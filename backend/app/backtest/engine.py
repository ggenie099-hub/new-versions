"""
Enterprise-Grade Backtesting Engine
- Vectorized operations for speed
- Realistic execution simulation
- Accurate slippage and commission modeling
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Callable
import numpy as np

try:
    import pandas as pd
except ImportError:
    pd = None

from .models import (
    BacktestConfig, BacktestResult, Trade, OrderType,
    PerformanceMetrics, DataSource, TimeFrame
)
from .data_fetcher import data_fetcher

logger = logging.getLogger(__name__)


class BacktestEngine:
    """
    High-performance backtesting engine with realistic execution
    """
    
    def __init__(self):
        self.data: Optional[pd.DataFrame] = None
        self.config: Optional[BacktestConfig] = None
        self.trades: List[Trade] = []
        self.equity_curve: List[float] = []
        self.positions: List[Dict] = []
        
        # Internal state
        self._cash: float = 0
        self._equity: float = 0
        self._position: Optional[Dict] = None
        self._trade_id: int = 0
        self._bar_index: int = 0
    
    async def load_data(self, config: BacktestConfig) -> bool:
        """Load historical data based on config"""
        self.config = config
        
        df, source = await data_fetcher.fetch_data(
            symbol=config.symbol,
            timeframe=config.timeframe,
            start_date=config.start_date,
            end_date=config.end_date,
            source=config.data_source
        )
        
        if df is None or len(df) == 0:
            logger.error(f"Failed to load data for {config.symbol}")
            return False
        
        self.data = df
        self._data_source = source
        logger.info(f"Loaded {len(df)} bars from {source.value}")
        return True
    
    def _calculate_position_size(self, price: float, stop_loss: Optional[float] = None) -> float:
        """Calculate position size based on risk management"""
        if stop_loss and self.config:
            # Risk-based position sizing
            risk_amount = self._equity * self.config.risk_per_trade
            risk_per_unit = abs(price - stop_loss)
            if risk_per_unit > 0:
                units = risk_amount / risk_per_unit
                # Apply leverage
                max_units = (self._equity * self.config.leverage) / price
                return min(units, max_units)
        
        # Default: use 10% of equity with leverage
        if self.config:
            return (self._equity * 0.1 * self.config.leverage) / price
        return 1.0
    
    def _apply_slippage(self, price: float, order_type: OrderType) -> float:
        """Apply realistic slippage to execution price"""
        if not self.config:
            return price
        
        slippage_pct = self.config.slippage
        spread_pct = self.config.spread / 2
        
        if order_type == OrderType.BUY:
            # Buy at ask (higher price) + slippage
            return price * (1 + spread_pct + slippage_pct * np.random.random())
        else:
            # Sell at bid (lower price) - slippage
            return price * (1 - spread_pct - slippage_pct * np.random.random())
    
    def _calculate_commission(self, volume: float, price: float) -> float:
        """Calculate commission for trade"""
        if not self.config:
            return 0
        return volume * price * self.config.commission

    def open_position(
        self,
        bar_index: int,
        order_type: OrderType,
        price: float,
        volume: Optional[float] = None,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None
    ) -> Optional[Trade]:
        """Open a new position"""
        if self._position is not None:
            return None  # Already have a position
        
        if self.data is None or self.config is None:
            return None
        
        # Apply slippage
        exec_price = self._apply_slippage(price, order_type)
        
        # Calculate position size
        if volume is None:
            volume = self._calculate_position_size(exec_price, stop_loss)
        
        # Calculate commission
        commission = self._calculate_commission(volume, exec_price)
        
        # Check if we have enough capital
        required_margin = (volume * exec_price) / self.config.leverage
        if required_margin + commission > self._cash:
            return None
        
        # Deduct commission
        self._cash -= commission
        
        # Create trade
        self._trade_id += 1
        timestamp = self.data.index[bar_index]
        
        trade = Trade(
            id=self._trade_id,
            entry_time=timestamp,
            symbol=self.config.symbol,
            order_type=order_type,
            entry_price=exec_price,
            volume=volume,
            stop_loss=stop_loss,
            take_profit=take_profit,
            commission=commission,
            slippage=abs(exec_price - price)
        )
        
        self._position = {
            "trade": trade,
            "entry_bar": bar_index,
            "highest_price": exec_price,
            "lowest_price": exec_price
        }
        
        return trade
    
    def close_position(self, bar_index: int, price: float, reason: str = "") -> Optional[Trade]:
        """Close current position"""
        if self._position is None or self.data is None:
            return None
        
        trade: Trade = self._position["trade"]
        
        # Apply slippage (opposite direction)
        close_type = OrderType.SELL if trade.order_type == OrderType.BUY else OrderType.BUY
        exec_price = self._apply_slippage(price, close_type)
        
        # Calculate commission
        commission = self._calculate_commission(trade.volume, exec_price)
        
        # Calculate profit
        if trade.order_type == OrderType.BUY:
            profit = (exec_price - trade.entry_price) * trade.volume
        else:
            profit = (trade.entry_price - exec_price) * trade.volume
        
        profit -= commission  # Deduct closing commission
        
        # Update trade
        trade.exit_time = self.data.index[bar_index]
        trade.exit_price = exec_price
        trade.profit = profit
        trade.profit_pct = (profit / (trade.entry_price * trade.volume)) * 100
        trade.commission += commission
        trade.bars_held = bar_index - self._position["entry_bar"]
        trade.is_winner = profit > 0
        
        # Calculate MAE/MFE
        if trade.order_type == OrderType.BUY:
            trade.mae = (trade.entry_price - self._position["lowest_price"]) / trade.entry_price * 100
            trade.mfe = (self._position["highest_price"] - trade.entry_price) / trade.entry_price * 100
        else:
            trade.mae = (self._position["highest_price"] - trade.entry_price) / trade.entry_price * 100
            trade.mfe = (trade.entry_price - self._position["lowest_price"]) / trade.entry_price * 100
        
        # Update cash
        self._cash += profit
        
        # Store trade
        self.trades.append(trade)
        self._position = None
        
        return trade
    
    def _update_position_tracking(self, bar_index: int):
        """Update MAE/MFE tracking for open position"""
        if self._position is None or self.data is None:
            return
        
        high = self.data.iloc[bar_index]['High']
        low = self.data.iloc[bar_index]['Low']
        
        self._position["highest_price"] = max(self._position["highest_price"], high)
        self._position["lowest_price"] = min(self._position["lowest_price"], low)
    
    def _check_stop_loss_take_profit(self, bar_index: int) -> bool:
        """Check and execute SL/TP"""
        if self._position is None or self.data is None:
            return False
        
        trade: Trade = self._position["trade"]
        bar = self.data.iloc[bar_index]
        
        # Check stop loss
        if trade.stop_loss:
            if trade.order_type == OrderType.BUY and bar['Low'] <= trade.stop_loss:
                self.close_position(bar_index, trade.stop_loss, "Stop Loss")
                return True
            elif trade.order_type == OrderType.SELL and bar['High'] >= trade.stop_loss:
                self.close_position(bar_index, trade.stop_loss, "Stop Loss")
                return True
        
        # Check take profit
        if trade.take_profit:
            if trade.order_type == OrderType.BUY and bar['High'] >= trade.take_profit:
                self.close_position(bar_index, trade.take_profit, "Take Profit")
                return True
            elif trade.order_type == OrderType.SELL and bar['Low'] <= trade.take_profit:
                self.close_position(bar_index, trade.take_profit, "Take Profit")
                return True
        
        return False
    
    def _calculate_equity(self, bar_index: int) -> float:
        """Calculate current equity including unrealized P&L"""
        equity = self._cash
        
        if self._position is not None and self.data is not None:
            trade: Trade = self._position["trade"]
            current_price = self.data.iloc[bar_index]['Close']
            
            if trade.order_type == OrderType.BUY:
                unrealized = (current_price - trade.entry_price) * trade.volume
            else:
                unrealized = (trade.entry_price - current_price) * trade.volume
            
            equity += unrealized
        
        return equity

    async def run(
        self,
        strategy: Callable[[pd.DataFrame, int, 'BacktestEngine'], Optional[Dict]],
        config: Optional[BacktestConfig] = None
    ) -> BacktestResult:
        """
        Run backtest with given strategy function
        
        Strategy function signature:
        def strategy(data: pd.DataFrame, bar_index: int, engine: BacktestEngine) -> Optional[Dict]
        
        Returns dict with:
        - action: "buy", "sell", "close", or None
        - stop_loss: Optional[float]
        - take_profit: Optional[float]
        - volume: Optional[float]
        """
        start_time = time.time()
        
        if config:
            self.config = config
            if not await self.load_data(config):
                raise ValueError("Failed to load data")
        
        if self.data is None or self.config is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Initialize
        self._cash = self.config.initial_capital
        self._equity = self.config.initial_capital
        self.trades = []
        self.equity_curve = []
        self._position = None
        self._trade_id = 0
        
        # Run through each bar
        for i in range(len(self.data)):
            self._bar_index = i
            
            # Update position tracking
            self._update_position_tracking(i)
            
            # Check SL/TP first
            self._check_stop_loss_take_profit(i)
            
            # Get strategy signal
            try:
                signal = strategy(self.data, i, self)
            except Exception as e:
                logger.error(f"Strategy error at bar {i}: {e}")
                signal = None
            
            # Execute signal
            if signal:
                action = signal.get("action")
                current_price = self.data.iloc[i]['Close']
                
                if action == "buy" and self._position is None:
                    self.open_position(
                        bar_index=i,
                        order_type=OrderType.BUY,
                        price=current_price,
                        volume=signal.get("volume"),
                        stop_loss=signal.get("stop_loss"),
                        take_profit=signal.get("take_profit")
                    )
                elif action == "sell" and self._position is None:
                    self.open_position(
                        bar_index=i,
                        order_type=OrderType.SELL,
                        price=current_price,
                        volume=signal.get("volume"),
                        stop_loss=signal.get("stop_loss"),
                        take_profit=signal.get("take_profit")
                    )
                elif action == "close" and self._position is not None:
                    self.close_position(i, current_price, "Strategy Exit")
            
            # Record equity
            self._equity = self._calculate_equity(i)
            self.equity_curve.append(self._equity)
        
        # Close any remaining position
        if self._position is not None:
            self.close_position(len(self.data) - 1, self.data.iloc[-1]['Close'], "End of Backtest")
        
        # Calculate metrics
        from .analytics import BacktestAnalytics
        analytics = BacktestAnalytics()
        metrics = analytics.calculate_metrics(
            trades=self.trades,
            equity_curve=self.equity_curve,
            initial_capital=self.config.initial_capital
        )
        
        # Build result
        execution_time = int((time.time() - start_time) * 1000)
        
        result = BacktestResult(
            config=self.config,
            metrics=metrics,
            trades=self.trades,
            equity_curve=self.equity_curve,
            drawdown_curve=analytics.calculate_drawdown_curve(self.equity_curve),
            returns=analytics.calculate_returns(self.equity_curve),
            timestamps=list(self.data.index),
            data_source_used=self._data_source,
            total_bars=len(self.data),
            start_date=self.data.index[0],
            end_date=self.data.index[-1],
            execution_time_ms=execution_time
        )
        
        logger.info(f"Backtest completed in {execution_time}ms. "
                   f"Trades: {len(self.trades)}, Return: {metrics.total_return_pct:.2f}%")
        
        return result
    
    async def run_strategy_string(
        self,
        strategy_code: str,
        config: BacktestConfig
    ) -> BacktestResult:
        """
        Run backtest with strategy defined as Python code string
        Useful for user-defined strategies from frontend
        """
        # Create strategy function from code
        local_vars = {}
        exec(f"""
import numpy as np
import pandas as pd

def user_strategy(data, bar_index, engine):
{chr(10).join('    ' + line for line in strategy_code.split(chr(10)))}
""", {"np": np, "pd": pd}, local_vars)
        
        strategy_func = local_vars.get("user_strategy")
        if not strategy_func:
            raise ValueError("Failed to compile strategy code")
        
        return await self.run(strategy_func, config)


# Built-in strategies
class BuiltInStrategies:
    """Collection of built-in trading strategies"""
    
    @staticmethod
    def sma_crossover(fast_period: int = 10, slow_period: int = 20):
        """Simple Moving Average Crossover Strategy"""
        def strategy(data: pd.DataFrame, bar_index: int, engine: BacktestEngine):
            if bar_index < slow_period:
                return None
            
            # Calculate SMAs
            close = data['Close'].iloc[:bar_index + 1]
            fast_sma = close.rolling(fast_period).mean().iloc[-1]
            slow_sma = close.rolling(slow_period).mean().iloc[-1]
            prev_fast = close.rolling(fast_period).mean().iloc[-2]
            prev_slow = close.rolling(slow_period).mean().iloc[-2]
            
            current_price = data.iloc[bar_index]['Close']
            
            # Crossover detection
            if prev_fast <= prev_slow and fast_sma > slow_sma:
                return {
                    "action": "buy",
                    "stop_loss": current_price * 0.98,
                    "take_profit": current_price * 1.04
                }
            elif prev_fast >= prev_slow and fast_sma < slow_sma:
                return {
                    "action": "sell",
                    "stop_loss": current_price * 1.02,
                    "take_profit": current_price * 0.96
                }
            
            return None
        
        return strategy
    
    @staticmethod
    def rsi_strategy(period: int = 14, oversold: int = 30, overbought: int = 70):
        """RSI Mean Reversion Strategy"""
        def strategy(data: pd.DataFrame, bar_index: int, engine: BacktestEngine):
            if bar_index < period + 1:
                return None
            
            # Calculate RSI
            close = data['Close'].iloc[:bar_index + 1]
            delta = close.diff()
            gain = (delta.where(delta > 0, 0)).rolling(period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            
            current_rsi = rsi.iloc[-1]
            prev_rsi = rsi.iloc[-2]
            current_price = data.iloc[bar_index]['Close']
            
            # Entry signals
            if prev_rsi <= oversold and current_rsi > oversold:
                return {
                    "action": "buy",
                    "stop_loss": current_price * 0.97,
                    "take_profit": current_price * 1.05
                }
            elif prev_rsi >= overbought and current_rsi < overbought:
                return {
                    "action": "sell",
                    "stop_loss": current_price * 1.03,
                    "take_profit": current_price * 0.95
                }
            
            # Exit on opposite signal
            if engine._position:
                trade = engine._position["trade"]
                if trade.order_type == OrderType.BUY and current_rsi >= overbought:
                    return {"action": "close"}
                elif trade.order_type == OrderType.SELL and current_rsi <= oversold:
                    return {"action": "close"}
            
            return None
        
        return strategy
    
    @staticmethod
    def breakout_strategy(lookback: int = 20):
        """Donchian Channel Breakout Strategy"""
        def strategy(data: pd.DataFrame, bar_index: int, engine: BacktestEngine):
            if bar_index < lookback:
                return None
            
            # Calculate channels
            high = data['High'].iloc[bar_index - lookback:bar_index]
            low = data['Low'].iloc[bar_index - lookback:bar_index]
            
            upper_channel = high.max()
            lower_channel = low.min()
            
            current_price = data.iloc[bar_index]['Close']
            current_high = data.iloc[bar_index]['High']
            current_low = data.iloc[bar_index]['Low']
            
            # Breakout signals
            if current_high > upper_channel and engine._position is None:
                return {
                    "action": "buy",
                    "stop_loss": lower_channel,
                    "take_profit": current_price + 2 * (current_price - lower_channel)
                }
            elif current_low < lower_channel and engine._position is None:
                return {
                    "action": "sell",
                    "stop_loss": upper_channel,
                    "take_profit": current_price - 2 * (upper_channel - current_price)
                }
            
            return None
        
        return strategy


# Global instance
backtest_engine = BacktestEngine()
