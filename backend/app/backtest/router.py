"""
Backtest API Router
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging

from app.dependencies import get_current_user
from app.models import User
from .models import BacktestConfig, BacktestResult, TimeFrame, DataSource
from .engine import BacktestEngine, BuiltInStrategies
from .analytics import BacktestAnalytics
from .data_fetcher import data_fetcher

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/backtest", tags=["Backtest"])


# Request/Response schemas
class BacktestRequest(BaseModel):
    """Backtest request schema"""
    symbol: str = Field(..., description="Trading symbol (e.g., EURUSD, BTCUSD)")
    timeframe: str = Field(default="1h", description="Timeframe: 1m, 5m, 15m, 30m, 1h, 4h, 1d")
    start_date: datetime = Field(..., description="Backtest start date")
    end_date: datetime = Field(default_factory=datetime.now, description="Backtest end date")
    initial_capital: float = Field(default=10000, ge=100, description="Initial capital")
    commission: float = Field(default=0.0001, ge=0, description="Commission per trade (0.01%)")
    slippage: float = Field(default=0.0001, ge=0, description="Slippage (0.01%)")
    spread: float = Field(default=0.0002, ge=0, description="Spread (0.02%)")
    leverage: int = Field(default=100, ge=1, le=500, description="Leverage")
    risk_per_trade: float = Field(default=0.02, ge=0.001, le=0.5, description="Risk per trade (2%)")
    data_source: str = Field(default="auto", description="Data source: mt5, yahoo, auto")
    
    # Strategy
    strategy: str = Field(default="sma_crossover", description="Strategy name")
    strategy_params: Dict[str, Any] = Field(default={}, description="Strategy parameters")
    
    # Options
    include_monte_carlo: bool = Field(default=True, description="Run Monte Carlo simulation")
    monte_carlo_simulations: int = Field(default=1000, ge=100, le=10000)


class QuickBacktestRequest(BaseModel):
    """Quick backtest with minimal params"""
    symbol: str
    strategy: str = "sma_crossover"
    days: int = Field(default=365, ge=30, le=3650)
    timeframe: str = "1h"


class SymbolSearchRequest(BaseModel):
    """Symbol search request"""
    query: str = Field(..., min_length=1)
    source: str = Field(default="auto")


class BacktestResponse(BaseModel):
    """Backtest response with all data"""
    success: bool
    message: str
    result: Optional[Dict[str, Any]] = None
    execution_time_ms: int = 0


# Endpoints
@router.post("/run", response_model=BacktestResponse)
async def run_backtest(
    request: BacktestRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Run a full backtest with specified parameters
    """
    try:
        # Parse timeframe
        tf_map = {
            "1m": TimeFrame.M1, "5m": TimeFrame.M5, "15m": TimeFrame.M15,
            "30m": TimeFrame.M30, "1h": TimeFrame.H1, "4h": TimeFrame.H4,
            "1d": TimeFrame.D1, "1w": TimeFrame.W1, "1M": TimeFrame.MN1
        }
        timeframe = tf_map.get(request.timeframe, TimeFrame.H1)
        
        # Parse data source
        source_map = {"mt5": DataSource.MT5, "yahoo": DataSource.YAHOO, "auto": DataSource.AUTO}
        data_source = source_map.get(request.data_source, DataSource.AUTO)
        
        # Create config
        config = BacktestConfig(
            symbol=request.symbol.upper(),
            timeframe=timeframe,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            commission=request.commission,
            slippage=request.slippage,
            spread=request.spread,
            leverage=request.leverage,
            risk_per_trade=request.risk_per_trade,
            data_source=data_source,
            strategy_name=request.strategy,
            strategy_params=request.strategy_params
        )
        
        # Get strategy
        strategy = _get_strategy(request.strategy, request.strategy_params)
        
        # Run backtest
        engine = BacktestEngine()
        result = await engine.run(strategy, config)
        
        # Run Monte Carlo if requested
        if request.include_monte_carlo and result.trades:
            analytics = BacktestAnalytics()
            result.monte_carlo = analytics.run_monte_carlo(
                trades=result.trades,
                initial_capital=config.initial_capital,
                simulations=request.monte_carlo_simulations
            )
        
        # Convert to response format
        response_data = _format_result(result)
        
        return BacktestResponse(
            success=True,
            message=f"Backtest completed. {len(result.trades)} trades, "
                   f"{result.metrics.total_return_pct:.2f}% return",
            result=response_data,
            execution_time_ms=result.execution_time_ms
        )
        
    except Exception as e:
        logger.error(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick", response_model=BacktestResponse)
async def quick_backtest(
    request: QuickBacktestRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Quick backtest with minimal parameters
    """
    try:
        # Create full request
        full_request = BacktestRequest(
            symbol=request.symbol,
            strategy=request.strategy,
            timeframe=request.timeframe,
            start_date=datetime.now() - timedelta(days=request.days),
            end_date=datetime.now(),
            include_monte_carlo=True
        )
        
        return await run_backtest(full_request, current_user)
        
    except Exception as e:
        logger.error(f"Quick backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategies")
async def get_available_strategies(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of available built-in strategies
    """
    return {
        "strategies": [
            {
                "id": "sma_crossover",
                "name": "SMA Crossover",
                "description": "Simple Moving Average crossover strategy. Buys when fast SMA crosses above slow SMA.",
                "parameters": [
                    {"name": "fast_period", "type": "int", "default": 10, "min": 2, "max": 100},
                    {"name": "slow_period", "type": "int", "default": 20, "min": 5, "max": 200}
                ]
            },
            {
                "id": "rsi_strategy",
                "name": "RSI Mean Reversion",
                "description": "RSI-based mean reversion. Buys oversold, sells overbought.",
                "parameters": [
                    {"name": "period", "type": "int", "default": 14, "min": 2, "max": 50},
                    {"name": "oversold", "type": "int", "default": 30, "min": 10, "max": 40},
                    {"name": "overbought", "type": "int", "default": 70, "min": 60, "max": 90}
                ]
            },
            {
                "id": "breakout",
                "name": "Donchian Breakout",
                "description": "Channel breakout strategy. Trades breakouts of N-period high/low.",
                "parameters": [
                    {"name": "lookback", "type": "int", "default": 20, "min": 5, "max": 100}
                ]
            }
        ]
    }


@router.get("/symbols")
async def get_available_symbols(
    source: str = "auto",
    current_user: User = Depends(get_current_user)
):
    """
    Get list of available symbols
    """
    source_map = {"mt5": DataSource.MT5, "yahoo": DataSource.YAHOO, "auto": DataSource.AUTO}
    data_source = source_map.get(source, DataSource.AUTO)
    
    symbols = await data_fetcher.get_available_symbols(data_source)
    
    # Categorize symbols
    forex = [s for s in symbols if len(s) == 6 and s.isalpha()]
    crypto = [s for s in symbols if "BTC" in s or "ETH" in s or s.endswith("USD") and len(s) <= 7]
    indices = [s for s in symbols if s.startswith("US") or s.startswith("^")]
    commodities = [s for s in symbols if s.startswith("XAU") or s.startswith("XAG")]
    
    return {
        "total": len(symbols),
        "categories": {
            "forex": forex[:20],
            "crypto": crypto[:10],
            "indices": indices[:10],
            "commodities": commodities[:10]
        },
        "all": symbols[:100]  # Limit response size
    }


@router.get("/data-status")
async def get_data_status(
    current_user: User = Depends(get_current_user)
):
    """
    Check data source availability
    Yahoo Finance is the default - no MT5 auto-connect
    """
    return {
        "mt5": {
            "available": False,  # MT5 disabled by default for backtesting
            "status": "disabled",
            "message": "MT5 not used for backtesting (uses Yahoo Finance)"
        },
        "yahoo": {
            "available": True,  # Always available - primary source
            "status": "active"
        },
        "recommended": "yahoo",
        "note": "Backtesting uses Yahoo Finance data. MT5 is only for live trading."
    }


@router.post("/validate-symbol")
async def validate_symbol(
    symbol: str,
    source: str = "auto",
    current_user: User = Depends(get_current_user)
):
    """
    Validate if a symbol is available and get sample data
    """
    source_map = {"mt5": DataSource.MT5, "yahoo": DataSource.YAHOO, "auto": DataSource.AUTO}
    data_source = source_map.get(source, DataSource.AUTO)
    
    # Try to fetch a small sample
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    df, actual_source = await data_fetcher.fetch_data(
        symbol=symbol.upper(),
        timeframe=TimeFrame.H1,
        start_date=start_date,
        end_date=end_date,
        source=data_source
    )
    
    if df is None or len(df) == 0:
        return {
            "valid": False,
            "symbol": symbol.upper(),
            "message": f"Symbol {symbol} not found or no data available"
        }
    
    return {
        "valid": True,
        "symbol": symbol.upper(),
        "source": actual_source.value,
        "sample_bars": len(df),
        "latest_price": float(df['Close'].iloc[-1]),
        "date_range": {
            "start": str(df.index[0]),
            "end": str(df.index[-1])
        }
    }


# Helper functions
def _get_strategy(strategy_name: str, params: Dict[str, Any]):
    """Get strategy function by name"""
    strategies = {
        "sma_crossover": lambda: BuiltInStrategies.sma_crossover(
            fast_period=params.get("fast_period", 10),
            slow_period=params.get("slow_period", 20)
        ),
        "rsi_strategy": lambda: BuiltInStrategies.rsi_strategy(
            period=params.get("period", 14),
            oversold=params.get("oversold", 30),
            overbought=params.get("overbought", 70)
        ),
        "breakout": lambda: BuiltInStrategies.breakout_strategy(
            lookback=params.get("lookback", 20)
        )
    }
    
    if strategy_name not in strategies:
        raise ValueError(f"Unknown strategy: {strategy_name}")
    
    return strategies[strategy_name]()


def _to_python(val):
    """Convert numpy types to Python native types"""
    import numpy as np
    if isinstance(val, (np.bool_, np.bool)):
        return bool(val)
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    if isinstance(val, (np.floating, np.float64, np.float32)):
        return float(val)
    if isinstance(val, np.ndarray):
        return val.tolist()
    return val


def _format_result(result: BacktestResult) -> Dict[str, Any]:
    """Format backtest result for API response"""
    # Convert equity curve to native Python floats
    equity_step = max(1, len(result.equity_curve)//500)
    equity_curve = [float(v) for v in result.equity_curve[::equity_step]]
    drawdown_curve = [float(v) for v in result.drawdown_curve[::equity_step]]
    timestamps = [str(t) for t in result.timestamps[::equity_step]]
    
    return {
        "config": {
            "symbol": result.config.symbol,
            "timeframe": result.config.timeframe.value,
            "start_date": str(result.start_date),
            "end_date": str(result.end_date),
            "initial_capital": float(result.config.initial_capital),
            "data_source": result.data_source_used.value
        },
        "metrics": {
            "total_return": float(result.metrics.total_return),
            "total_return_pct": float(result.metrics.total_return_pct),
            "cagr": float(result.metrics.cagr),
            "sharpe_ratio": float(result.metrics.sharpe_ratio),
            "sortino_ratio": float(result.metrics.sortino_ratio),
            "max_drawdown_pct": float(result.metrics.max_drawdown_pct),
            "volatility": float(result.metrics.volatility),
            "win_rate": float(result.metrics.win_rate),
            "profit_factor": float(result.metrics.profit_factor),
            "total_trades": int(result.metrics.total_trades),
            "avg_trade": float(result.metrics.avg_trade),
            "expectancy": float(result.metrics.expectancy),
            "sqn": float(result.metrics.sqn),
            "calmar_ratio": float(result.metrics.calmar_ratio),
            "recovery_factor": float(result.metrics.recovery_factor)
        },
        "trades": [
            {
                "id": int(t.id),
                "entry_time": str(t.entry_time),
                "exit_time": str(t.exit_time) if t.exit_time else None,
                "order_type": t.order_type.value,
                "entry_price": float(t.entry_price),
                "exit_price": float(t.exit_price) if t.exit_price else None,
                "volume": float(t.volume),
                "profit": float(t.profit),
                "profit_pct": float(t.profit_pct),
                "bars_held": int(t.bars_held),
                "is_winner": bool(t.is_winner)
            }
            for t in result.trades[:100]
        ],
        "charts": {
            "equity_curve": equity_curve,
            "drawdown_curve": drawdown_curve,
            "timestamps": timestamps
        },
        "monte_carlo": {
            "mean_return": float(result.monte_carlo.mean_return),
            "median_return": float(result.monte_carlo.median_return),
            "percentile_5": float(result.monte_carlo.percentile_5),
            "percentile_95": float(result.monte_carlo.percentile_95),
            "probability_of_loss": float(result.monte_carlo.probability_of_loss),
            "probability_of_50pct_loss": float(result.monte_carlo.probability_of_50pct_loss),
            "worst_max_drawdown": float(result.monte_carlo.worst_max_drawdown),
            "drawdown_95": float(result.monte_carlo.drawdown_95),
            "equity_curves": [[float(v) for v in curve] for curve in result.monte_carlo.equity_curves[:20]]
        } if result.monte_carlo else None,
        "total_bars": int(result.total_bars),
        "execution_time_ms": int(result.execution_time_ms)
    }
