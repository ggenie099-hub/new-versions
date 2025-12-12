"""
Dual Data Source Fetcher - MT5 Primary, Yahoo Finance Fallback
Auto-switches when MT5 is not available
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, List
from concurrent.futures import ThreadPoolExecutor
import numpy as np

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None

try:
    import yfinance as yf
except ImportError:
    yf = None

from .models import TimeFrame, DataSource

logger = logging.getLogger(__name__)


class DataFetcher:
    """
    Enterprise-grade data fetcher with automatic failover
    Primary: Yahoo Finance (free, no login required)
    Optional: MT5 (only when explicitly requested AND user has connected account)
    
    NOTE: We do NOT auto-connect to MT5 without user permission.
    Yahoo Finance is used by default for backtesting.
    """
    
    # MT5 timeframe mapping (only used if MT5 explicitly requested)
    MT5_TIMEFRAMES = {
        TimeFrame.M1: mt5.TIMEFRAME_M1 if mt5 else 1,
        TimeFrame.M5: mt5.TIMEFRAME_M5 if mt5 else 5,
        TimeFrame.M15: mt5.TIMEFRAME_M15 if mt5 else 15,
        TimeFrame.M30: mt5.TIMEFRAME_M30 if mt5 else 30,
        TimeFrame.H1: mt5.TIMEFRAME_H1 if mt5 else 60,
        TimeFrame.H4: mt5.TIMEFRAME_H4 if mt5 else 240,
        TimeFrame.D1: mt5.TIMEFRAME_D1 if mt5 else 1440,
        TimeFrame.W1: mt5.TIMEFRAME_W1 if mt5 else 10080,
        TimeFrame.MN1: mt5.TIMEFRAME_MN1 if mt5 else 43200,
    }
    
    # Yahoo Finance interval mapping
    YAHOO_INTERVALS = {
        TimeFrame.M1: "1m",
        TimeFrame.M5: "5m",
        TimeFrame.M15: "15m",
        TimeFrame.M30: "30m",
        TimeFrame.H1: "1h",
        TimeFrame.H4: "1h",  # Yahoo doesn't have 4h, we'll resample
        TimeFrame.D1: "1d",
        TimeFrame.W1: "1wk",
        TimeFrame.MN1: "1mo",
    }
    
    # Symbol mapping MT5 -> Yahoo
    SYMBOL_MAP = {
        "EURUSD": "EURUSD=X",
        "GBPUSD": "GBPUSD=X",
        "USDJPY": "USDJPY=X",
        "USDCHF": "USDCHF=X",
        "AUDUSD": "AUDUSD=X",
        "USDCAD": "USDCAD=X",
        "NZDUSD": "NZDUSD=X",
        "XAUUSD": "GC=F",
        "XAGUSD": "SI=F",
        "US30": "^DJI",
        "US500": "^GSPC",
        "US100": "^NDX",
        "BTCUSD": "BTC-USD",
        "ETHUSD": "ETH-USD",
    }
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        # MT5 is disabled by default - only enable when user explicitly connects
        self._mt5_enabled: bool = False
        self._mt5_account_id: Optional[int] = None
    
    def enable_mt5(self, account_id: int):
        """Enable MT5 data source for a specific connected account"""
        self._mt5_enabled = True
        self._mt5_account_id = account_id
        logger.info(f"MT5 data source enabled for account {account_id}")
    
    def disable_mt5(self):
        """Disable MT5 data source"""
        self._mt5_enabled = False
        self._mt5_account_id = None
        logger.info("MT5 data source disabled")
    
    async def check_mt5_available(self) -> bool:
        """
        Check if MT5 is available.
        Returns False by default - MT5 should only be used when explicitly enabled.
        """
        # MT5 is only available if explicitly enabled by user
        if not self._mt5_enabled:
            return False
        
        if mt5 is None:
            return False
        
        # Don't auto-initialize MT5 - just check if it's already running
        loop = asyncio.get_event_loop()
        
        def _check():
            try:
                # Only check terminal info, don't initialize
                info = mt5.terminal_info()
                return info is not None and info.connected
            except Exception as e:
                logger.warning(f"MT5 check failed: {e}")
                return False
        
        return await loop.run_in_executor(self.executor, _check)
    
    def _convert_symbol_to_yahoo(self, symbol: str) -> str:
        """Convert MT5 symbol to Yahoo Finance symbol"""
        # Check direct mapping
        if symbol in self.SYMBOL_MAP:
            return self.SYMBOL_MAP[symbol]
        
        # Forex pairs
        if len(symbol) == 6 and symbol.isalpha():
            return f"{symbol}=X"
        
        # Crypto
        if symbol.endswith("USD") and len(symbol) <= 7:
            base = symbol[:-3]
            return f"{base}-USD"
        
        # Default: return as-is (might be stock symbol)
        return symbol

    async def fetch_mt5_data(
        self,
        symbol: str,
        timeframe: TimeFrame,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[pd.DataFrame]:
        """Fetch historical data from MT5"""
        if mt5 is None or pd is None:
            return None
        
        loop = asyncio.get_event_loop()
        
        def _fetch():
            try:
                if not mt5.initialize():
                    logger.error("MT5 initialization failed")
                    return None
                
                # Select symbol
                if not mt5.symbol_select(symbol, True):
                    logger.warning(f"Symbol {symbol} not found in MT5")
                    return None
                
                # Get rates
                mt5_tf = self.MT5_TIMEFRAMES.get(timeframe)
                rates = mt5.copy_rates_range(symbol, mt5_tf, start_date, end_date)
                
                if rates is None or len(rates) == 0:
                    logger.warning(f"No data returned from MT5 for {symbol}")
                    return None
                
                # Convert to DataFrame
                df = pd.DataFrame(rates)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                df.set_index('time', inplace=True)
                df.rename(columns={
                    'open': 'Open',
                    'high': 'High',
                    'low': 'Low',
                    'close': 'Close',
                    'tick_volume': 'Volume'
                }, inplace=True)
                
                # Keep only OHLCV
                df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
                
                logger.info(f"MT5: Fetched {len(df)} bars for {symbol}")
                return df
                
            except Exception as e:
                logger.error(f"MT5 data fetch error: {e}")
                return None
        
        return await loop.run_in_executor(self.executor, _fetch)
    
    async def fetch_yahoo_data(
        self,
        symbol: str,
        timeframe: TimeFrame,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[pd.DataFrame]:
        """Fetch historical data from Yahoo Finance"""
        if yf is None or pd is None:
            logger.error("yfinance or pandas not installed")
            return None
        
        loop = asyncio.get_event_loop()
        
        def _fetch():
            try:
                yahoo_symbol = self._convert_symbol_to_yahoo(symbol)
                interval = self.YAHOO_INTERVALS.get(timeframe, "1d")
                
                # Yahoo has limitations on intraday data
                # 1m data: max 7 days
                # 5m-30m data: max 60 days
                # 1h data: max 730 days
                
                ticker = yf.Ticker(yahoo_symbol)
                df = ticker.history(
                    start=start_date,
                    end=end_date,
                    interval=interval,
                    auto_adjust=True
                )
                
                if df is None or len(df) == 0:
                    logger.warning(f"No data from Yahoo for {yahoo_symbol}")
                    return None
                
                # Standardize columns
                df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
                
                # Handle 4H timeframe (resample from 1H)
                if timeframe == TimeFrame.H4:
                    df = df.resample('4H').agg({
                        'Open': 'first',
                        'High': 'max',
                        'Low': 'min',
                        'Close': 'last',
                        'Volume': 'sum'
                    }).dropna()
                
                logger.info(f"Yahoo: Fetched {len(df)} bars for {yahoo_symbol}")
                return df
                
            except Exception as e:
                logger.error(f"Yahoo data fetch error: {e}")
                return None
        
        return await loop.run_in_executor(self.executor, _fetch)
    
    async def fetch_data(
        self,
        symbol: str,
        timeframe: TimeFrame,
        start_date: datetime,
        end_date: datetime,
        source: DataSource = DataSource.AUTO
    ) -> Tuple[Optional[pd.DataFrame], DataSource]:
        """
        Fetch data with automatic failover
        Returns: (DataFrame, actual_source_used)
        """
        if pd is None:
            raise ImportError("pandas is required for backtesting")
        
        # Determine source
        if source == DataSource.MT5:
            df = await self.fetch_mt5_data(symbol, timeframe, start_date, end_date)
            if df is not None:
                return df, DataSource.MT5
            return None, DataSource.MT5
        
        elif source == DataSource.YAHOO:
            df = await self.fetch_yahoo_data(symbol, timeframe, start_date, end_date)
            if df is not None:
                return df, DataSource.YAHOO
            return None, DataSource.YAHOO
        
        else:  # AUTO mode - Use Yahoo Finance by default (no MT5 auto-connect)
            # Yahoo Finance is the default for backtesting
            # MT5 is only used if explicitly enabled by user
            logger.info(f"AUTO mode: Using Yahoo Finance for {symbol}")
            
            df = await self.fetch_yahoo_data(symbol, timeframe, start_date, end_date)
            if df is not None:
                return df, DataSource.YAHOO
            
            # Only try MT5 if explicitly enabled AND Yahoo failed
            if self._mt5_enabled:
                logger.info("Yahoo failed, trying MT5 (user enabled)")
                df = await self.fetch_mt5_data(symbol, timeframe, start_date, end_date)
                if df is not None and len(df) > 0:
                    return df, DataSource.MT5
            
            return None, DataSource.AUTO
    
    async def get_available_symbols(self, source: DataSource = DataSource.AUTO) -> List[str]:
        """Get list of available symbols - returns Yahoo Finance symbols by default"""
        # Always return common symbols from Yahoo Finance
        # MT5 symbols only if explicitly requested AND enabled
        symbols = list(self.SYMBOL_MAP.keys())
        
        if source == DataSource.MT5 and self._mt5_enabled:
            loop = asyncio.get_event_loop()
            def _get_symbols():
                try:
                    all_symbols = mt5.symbols_get()
                    if all_symbols:
                        return [s.name for s in all_symbols if s.visible]
                except:
                    pass
                return []
            mt5_symbols = await loop.run_in_executor(self.executor, _get_symbols)
            if mt5_symbols:
                symbols = mt5_symbols
        
        return symbols


# Global instance
data_fetcher = DataFetcher()
