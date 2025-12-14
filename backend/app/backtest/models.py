"""
Backtest Data Models and Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import numpy as np


class TimeFrame(str, Enum):
    M1 = "1m"
    M5 = "5m"
    M15 = "15m"
    M30 = "30m"
    H1 = "1h"
    H4 = "4h"
    D1 = "1d"
    W1 = "1w"
    MN1 = "1M"


class OrderType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class DataSource(str, Enum):
    MT5 = "mt5"
    AUTO = "auto"  # Defaults to MT5


class Trade(BaseModel):
    """Individual trade record"""
    id: int
    entry_time: datetime
    exit_time: Optional[datetime] = None
    symbol: str
    order_type: OrderType
    entry_price: float
    exit_price: Optional[float] = None
    volume: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    profit: float = 0.0
    profit_pct: float = 0.0
    commission: float = 0.0
    slippage: float = 0.0
    bars_held: int = 0
    mae: float = 0.0  # Maximum Adverse Excursion
    mfe: float = 0.0  # Maximum Favorable Excursion
    is_winner: bool = False


class BacktestConfig(BaseModel):
    """Backtest configuration"""
    symbol: str
    timeframe: TimeFrame = TimeFrame.H1
    start_date: datetime
    end_date: datetime
    initial_capital: float = 10000.0
    commission: float = 0.0001  # 0.01% per trade
    slippage: float = 0.0001   # 0.01% slippage
    spread: float = 0.0002     # 0.02% spread
    leverage: int = 100
    risk_per_trade: float = 0.02  # 2% risk per trade
    max_positions: int = 1
    data_source: DataSource = DataSource.AUTO
    
    # Strategy parameters
    strategy_name: str = "custom"
    strategy_params: Dict[str, Any] = {}


class PerformanceMetrics(BaseModel):
    """Comprehensive performance metrics"""
    # Returns
    total_return: float = 0.0
    total_return_pct: float = 0.0
    annualized_return: float = 0.0
    cagr: float = 0.0
    
    # Risk metrics
    volatility: float = 0.0
    downside_volatility: float = 0.0
    max_drawdown: float = 0.0
    max_drawdown_pct: float = 0.0
    max_drawdown_duration: int = 0  # in bars
    avg_drawdown: float = 0.0
    
    # Risk-adjusted returns
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    omega_ratio: float = 0.0
    
    # Trade statistics
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    avg_win_pct: float = 0.0
    avg_loss_pct: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    avg_trade: float = 0.0
    avg_trade_pct: float = 0.0
    
    # Time analysis
    avg_bars_in_trade: float = 0.0
    avg_bars_in_winner: float = 0.0
    avg_bars_in_loser: float = 0.0
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0
    
    # Exposure
    time_in_market: float = 0.0
    exposure_pct: float = 0.0
    
    # Additional
    expectancy: float = 0.0
    sqn: float = 0.0  # System Quality Number
    recovery_factor: float = 0.0


class MonteCarloResult(BaseModel):
    """Monte Carlo simulation results"""
    simulations: int = 1000
    confidence_level: float = 0.95
    
    # Return distribution
    mean_return: float = 0.0
    median_return: float = 0.0
    std_return: float = 0.0
    min_return: float = 0.0
    max_return: float = 0.0
    percentile_5: float = 0.0
    percentile_25: float = 0.0
    percentile_75: float = 0.0
    percentile_95: float = 0.0
    
    # Drawdown distribution
    mean_max_drawdown: float = 0.0
    median_max_drawdown: float = 0.0
    worst_max_drawdown: float = 0.0
    drawdown_95: float = 0.0
    
    # Risk of ruin
    probability_of_loss: float = 0.0
    probability_of_50pct_loss: float = 0.0
    probability_of_ruin: float = 0.0  # 100% loss
    
    # Equity curves (for visualization)
    equity_curves: List[List[float]] = []
    final_equities: List[float] = []


class BacktestResult(BaseModel):
    """Complete backtest result"""
    config: BacktestConfig
    metrics: PerformanceMetrics
    trades: List[Trade] = []
    
    # Time series data
    equity_curve: List[float] = []
    drawdown_curve: List[float] = []
    returns: List[float] = []
    timestamps: List[datetime] = []
    
    # Data info
    data_source_used: DataSource = DataSource.MT5
    total_bars: int = 0
    start_date: datetime
    end_date: datetime
    
    # Monte Carlo (optional)
    monte_carlo: Optional[MonteCarloResult] = None
    
    # Execution info
    execution_time_ms: int = 0
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        arbitrary_types_allowed = True
