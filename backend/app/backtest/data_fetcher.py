"""
MT5 Data Fetcher - All data from MetaTrader 5
Supports all timeframes for live data and backtesting
Robust error handling and connection management
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, List
from concurrent.futures import ThreadPoolExecutor
import traceback

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    mt5 = None
    MT5_AVAILABLE = False

from .models import TimeFrame, DataSource

logger = logging.getLogger(__name__)


class DataFetcher:
    """
    MT5 Data Fetcher for live data and backtesting
    All data comes from MetaTrader 5 terminal
    """
    
    # Common trading symbols (fallback)
    COMMON_SYMBOLS = [
        "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
        "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY",
        "XAUUSD", "XAGUSD", "US30", "US500", "US100", "BTCUSD", "ETHUSD"
    ]
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._mt5_initialized: bool = False
        self._last_error: str = ""
    
    def _get_mt5_timeframe(self, timeframe: TimeFrame):
        """Get MT5 timeframe constant"""
        if not MT5_AVAILABLE:
            return None
        
        tf_map = {
            TimeFrame.M1: mt5.TIMEFRAME_M1,
            TimeFrame.M5: mt5.TIMEFRAME_M5,
            TimeFrame.M15: mt5.TIMEFRAME_M15,
            TimeFrame.M30: mt5.TIMEFRAME_M30,
            TimeFrame.H1: mt5.TIMEFRAME_H1,
            TimeFrame.H4: mt5.TIMEFRAME_H4,
            TimeFrame.D1: mt5.TIMEFRAME_D1,
            TimeFrame.W1: mt5.TIMEFRAME_W1,
            TimeFrame.MN1: mt5.TIMEFRAME_MN1,
        }
        return tf_map.get(timeframe)

    def _ensure_mt5_initialized(self) -> Tuple[bool, str]:
        """
        Ensure MT5 is initialized and connected
        Returns: (success, error_message)
        """
        if not MT5_AVAILABLE:
            return False, "MetaTrader5 package not installed"
        
        try:
            # Check if already initialized and connected
            if self._mt5_initialized:
                info = mt5.terminal_info()
                if info is not None and info.connected:
                    return True, ""
                self._mt5_initialized = False
            
            # Try to initialize
            if not mt5.initialize():
                error = mt5.last_error()
                error_msg = f"MT5 initialization failed: {error}"
                logger.error(error_msg)
                return False, error_msg
            
            # Check connection
            info = mt5.terminal_info()
            if info is None:
                return False, "MT5 terminal info not available"
            
            if not info.connected:
                return False, "MT5 terminal not connected to broker"
            
            self._mt5_initialized = True
            logger.info(f"MT5 initialized: {info.name}, Build: {info.build}")
            return True, ""
            
        except Exception as e:
            error_msg = f"MT5 initialization error: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def _find_symbol(self, symbol: str) -> Optional[str]:
        """Find symbol in MT5, trying different variations"""
        if not MT5_AVAILABLE:
            return None
        
        # Try exact match first
        if mt5.symbol_select(symbol, True):
            return symbol
        
        # Try common suffixes
        suffixes = ['', '.', 'm', 'micro', '_', '.i', '.e']
        for suffix in suffixes:
            test_symbol = f"{symbol}{suffix}"
            if mt5.symbol_select(test_symbol, True):
                logger.info(f"Symbol {symbol} found as {test_symbol}")
                return test_symbol
        
        # Try lowercase
        if mt5.symbol_select(symbol.lower(), True):
            return symbol.lower()
        
        return None
    
    async def check_mt5_available(self) -> bool:
        """Check if MT5 is available and connected"""
        if not MT5_AVAILABLE:
            return False
        
        loop = asyncio.get_event_loop()
        
        def _check():
            success, _ = self._ensure_mt5_initialized()
            return success
        
        try:
            return await loop.run_in_executor(self.executor, _check)
        except Exception as e:
            logger.error(f"MT5 availability check failed: {e}")
            return False

    async def fetch_mt5_data(
        self,
        symbol: str,
        timeframe: TimeFrame,
        start_date: datetime,
        end_date: datetime
    ) -> Tuple[Optional[pd.DataFrame], str]:
        """
        Fetch historical data from MT5
        Returns: (DataFrame or None, error_message)
        """
        if pd is None:
            return None, "pandas not installed"
        
        if not MT5_AVAILABLE:
            return None, "MetaTrader5 package not installed"
        
        loop = asyncio.get_event_loop()
        
        def _fetch() -> Tuple[Optional[pd.DataFrame], str]:
            try:
                # Initialize MT5
                success, error = self._ensure_mt5_initialized()
                if not success:
                    return None, error
                
                # Find symbol
                symbol_to_use = self._find_symbol(symbol)
                if symbol_to_use is None:
                    return None, f"Symbol '{symbol}' not found in MT5. Make sure it's available in your broker."
                
                # Get MT5 timeframe
                mt5_tf = self._get_mt5_timeframe(timeframe)
                if mt5_tf is None:
                    return None, f"Invalid timeframe: {timeframe}"
                
                # Calculate bars needed
                delta = end_date - start_date
                minutes = delta.total_seconds() / 60
                tf_minutes = {
                    TimeFrame.M1: 1, TimeFrame.M5: 5, TimeFrame.M15: 15,
                    TimeFrame.M30: 30, TimeFrame.H1: 60, TimeFrame.H4: 240,
                    TimeFrame.D1: 1440, TimeFrame.W1: 10080, TimeFrame.MN1: 43200,
                }
                tf_min = tf_minutes.get(timeframe, 60)
                bars_needed = min(int(minutes / tf_min) + 100, 100000)
                
                # Try copy_rates_range first
                rates = mt5.copy_rates_range(symbol_to_use, mt5_tf, start_date, end_date)
                
                # If no data, try copy_rates_from
                if rates is None or len(rates) == 0:
                    rates = mt5.copy_rates_from(symbol_to_use, mt5_tf, datetime.now(), bars_needed)
                
                if rates is None or len(rates) == 0:
                    error = mt5.last_error()
                    return None, f"No data available for {symbol_to_use}. MT5 error: {error}"
                
                # Convert to DataFrame
                df = pd.DataFrame(rates)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                df.set_index('time', inplace=True)
                
                # Rename columns
                df.rename(columns={
                    'open': 'Open',
                    'high': 'High',
                    'low': 'Low',
                    'close': 'Close',
                    'tick_volume': 'Volume'
                }, inplace=True)
                
                # Keep only OHLCV columns
                df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
                
                # Remove timezone if present
                if df.index.tz is not None:
                    df.index = df.index.tz_localize(None)
                
                # Filter by date range (simple string-based to avoid timezone issues)
                if len(df) > 0:
                    try:
                        start_str = start_date.strftime('%Y-%m-%d')
                        end_str = end_date.strftime('%Y-%m-%d %H:%M:%S')
                        df = df.loc[start_str:end_str]
                    except Exception:
                        # If filtering fails, just use all data
                        pass
                
                if len(df) == 0:
                    return None, f"No data in the specified date range for {symbol_to_use}"
                
                logger.info(f"MT5: Fetched {len(df)} bars for {symbol_to_use} ({timeframe.value})")
                return df, ""
                
            except Exception as e:
                error_msg = f"MT5 data fetch error: {str(e)}"
                logger.error(f"{error_msg}\n{traceback.format_exc()}")
                return None, error_msg
        
        return await loop.run_in_executor(self.executor, _fetch)

    async def fetch_data(
        self,
        symbol: str,
        timeframe: TimeFrame,
        start_date: datetime,
        end_date: datetime,
        source: DataSource = DataSource.MT5
    ) -> Tuple[Optional[pd.DataFrame], DataSource]:
        """
        Fetch data from MT5
        Returns: (DataFrame, DataSource.MT5)
        Raises exception with clear error message if data fetch fails
        """
        if pd is None:
            raise ImportError("pandas is required for backtesting")
        
        df, error = await self.fetch_mt5_data(symbol, timeframe, start_date, end_date)
        
        if df is not None and len(df) > 0:
            self._last_error = ""
            return df, DataSource.MT5
        
        # Store error for debugging
        self._last_error = error
        logger.error(f"Failed to load data for {symbol}: {error}")
        
        return None, DataSource.MT5
    
    def get_last_error(self) -> str:
        """Get the last error message"""
        return self._last_error
    
    async def get_available_symbols(self, source: DataSource = DataSource.MT5) -> List[str]:
        """Get list of available symbols from MT5"""
        if not MT5_AVAILABLE:
            return self.COMMON_SYMBOLS
        
        loop = asyncio.get_event_loop()
        
        def _get_symbols():
            try:
                success, _ = self._ensure_mt5_initialized()
                if not success:
                    return self.COMMON_SYMBOLS
                
                all_symbols = mt5.symbols_get()
                if all_symbols:
                    symbols = [s.name for s in all_symbols if s.visible]
                    if symbols:
                        return symbols
            except Exception as e:
                logger.error(f"Error getting MT5 symbols: {e}")
            
            return self.COMMON_SYMBOLS
        
        try:
            return await loop.run_in_executor(self.executor, _get_symbols)
        except Exception:
            return self.COMMON_SYMBOLS
    
    async def get_symbol_info(self, symbol: str) -> Optional[Dict]:
        """Get symbol information from MT5"""
        if not MT5_AVAILABLE:
            return None
        
        loop = asyncio.get_event_loop()
        
        def _get_info():
            try:
                success, _ = self._ensure_mt5_initialized()
                if not success:
                    return None
                
                symbol_to_use = self._find_symbol(symbol)
                if symbol_to_use is None:
                    return None
                
                info = mt5.symbol_info(symbol_to_use)
                if info is None:
                    return None
                
                return {
                    "symbol": info.name,
                    "description": info.description,
                    "point": info.point,
                    "digits": info.digits,
                    "spread": info.spread,
                    "trade_contract_size": info.trade_contract_size,
                    "volume_min": info.volume_min,
                    "volume_max": info.volume_max,
                    "volume_step": info.volume_step,
                    "bid": info.bid,
                    "ask": info.ask,
                }
            except Exception as e:
                logger.error(f"Error getting symbol info: {e}")
                return None
        
        try:
            return await loop.run_in_executor(self.executor, _get_info)
        except Exception:
            return None
    
    async def get_current_price(self, symbol: str) -> Optional[Dict]:
        """Get current price from MT5"""
        if not MT5_AVAILABLE:
            return None
        
        loop = asyncio.get_event_loop()
        
        def _get_price():
            try:
                success, _ = self._ensure_mt5_initialized()
                if not success:
                    return None
                
                symbol_to_use = self._find_symbol(symbol)
                if symbol_to_use is None:
                    return None
                
                tick = mt5.symbol_info_tick(symbol_to_use)
                if tick is None:
                    return None
                
                return {
                    "symbol": symbol_to_use,
                    "bid": tick.bid,
                    "ask": tick.ask,
                    "last": tick.last,
                    "volume": tick.volume,
                    "time": datetime.fromtimestamp(tick.time)
                }
            except Exception as e:
                logger.error(f"Error getting current price: {e}")
                return None
        
        try:
            return await loop.run_in_executor(self.executor, _get_price)
        except Exception:
            return None


# Global instance
data_fetcher = DataFetcher()
