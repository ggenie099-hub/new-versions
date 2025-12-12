"""
Enterprise-Grade Backtesting System
- Dual data source (MT5 + Yahoo Finance fallback)
- Fast vectorized backtesting engine
- Advanced analytics and visualizations
"""

from .data_fetcher import DataFetcher
from .engine import BacktestEngine
from .analytics import BacktestAnalytics
from .models import BacktestResult, BacktestConfig

__all__ = [
    "DataFetcher",
    "BacktestEngine", 
    "BacktestAnalytics",
    "BacktestResult",
    "BacktestConfig"
]
