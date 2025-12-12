"""
Enterprise-Grade Backtest Analytics
- Comprehensive performance metrics
- Monte Carlo simulation
- Risk analysis
"""
import logging
from typing import List, Optional
import numpy as np
from datetime import datetime, timedelta

try:
    import pandas as pd
except ImportError:
    pd = None

from .models import (
    Trade, PerformanceMetrics, MonteCarloResult, OrderType
)

logger = logging.getLogger(__name__)


class BacktestAnalytics:
    """
    Comprehensive analytics for backtest results
    """
    
    def calculate_returns(self, equity_curve: List[float]) -> List[float]:
        """Calculate period returns from equity curve"""
        if len(equity_curve) < 2:
            return []
        
        returns = []
        for i in range(1, len(equity_curve)):
            if equity_curve[i-1] != 0:
                ret = (equity_curve[i] - equity_curve[i-1]) / equity_curve[i-1]
            else:
                ret = 0
            returns.append(ret)
        
        return returns
    
    def calculate_drawdown_curve(self, equity_curve: List[float]) -> List[float]:
        """Calculate drawdown at each point"""
        if not equity_curve:
            return []
        
        drawdowns = []
        peak = equity_curve[0]
        
        for equity in equity_curve:
            peak = max(peak, equity)
            if peak > 0:
                dd = (peak - equity) / peak
            else:
                dd = 0
            drawdowns.append(dd)
        
        return drawdowns
    
    def calculate_metrics(
        self,
        trades: List[Trade],
        equity_curve: List[float],
        initial_capital: float,
        risk_free_rate: float = 0.02,  # 2% annual
        periods_per_year: int = 252  # Daily bars
    ) -> PerformanceMetrics:
        """Calculate comprehensive performance metrics"""
        metrics = PerformanceMetrics()
        
        if not equity_curve or len(equity_curve) < 2:
            return metrics
        
        # Convert to numpy for faster calculations
        equity = np.array(equity_curve)
        returns = np.diff(equity) / equity[:-1]
        returns = np.nan_to_num(returns, 0)
        
        # === RETURNS ===
        metrics.total_return = equity[-1] - initial_capital
        metrics.total_return_pct = ((equity[-1] / initial_capital) - 1) * 100
        
        # Annualized return
        n_periods = len(equity_curve)
        years = n_periods / periods_per_year
        if years > 0 and equity[-1] > 0 and initial_capital > 0:
            metrics.cagr = ((equity[-1] / initial_capital) ** (1 / years) - 1) * 100
            metrics.annualized_return = metrics.cagr
        
        # === RISK METRICS ===
        if len(returns) > 1:
            metrics.volatility = np.std(returns) * np.sqrt(periods_per_year) * 100
            
            # Downside volatility (only negative returns)
            negative_returns = returns[returns < 0]
            if len(negative_returns) > 0:
                metrics.downside_volatility = np.std(negative_returns) * np.sqrt(periods_per_year) * 100
        
        # Drawdown analysis
        drawdowns = self.calculate_drawdown_curve(equity_curve)
        if drawdowns:
            metrics.max_drawdown = max(drawdowns) * initial_capital
            metrics.max_drawdown_pct = max(drawdowns) * 100
            metrics.avg_drawdown = np.mean(drawdowns) * 100
            
            # Max drawdown duration
            in_drawdown = False
            current_duration = 0
            max_duration = 0
            for dd in drawdowns:
                if dd > 0:
                    in_drawdown = True
                    current_duration += 1
                else:
                    if in_drawdown:
                        max_duration = max(max_duration, current_duration)
                        current_duration = 0
                        in_drawdown = False
            metrics.max_drawdown_duration = max(max_duration, current_duration)

        # === RISK-ADJUSTED RETURNS ===
        if len(returns) > 1:
            # Sharpe Ratio
            excess_returns = returns - (risk_free_rate / periods_per_year)
            if np.std(returns) > 0:
                metrics.sharpe_ratio = (np.mean(excess_returns) / np.std(returns)) * np.sqrt(periods_per_year)
            
            # Sortino Ratio
            if metrics.downside_volatility > 0:
                annual_return = np.mean(returns) * periods_per_year
                metrics.sortino_ratio = (annual_return - risk_free_rate) / (metrics.downside_volatility / 100)
            
            # Calmar Ratio
            if metrics.max_drawdown_pct > 0:
                metrics.calmar_ratio = metrics.cagr / metrics.max_drawdown_pct
            
            # Omega Ratio
            threshold = risk_free_rate / periods_per_year
            gains = returns[returns > threshold] - threshold
            losses = threshold - returns[returns <= threshold]
            if len(losses) > 0 and np.sum(losses) > 0:
                metrics.omega_ratio = np.sum(gains) / np.sum(losses)
        
        # === TRADE STATISTICS ===
        if trades:
            metrics.total_trades = len(trades)
            
            winners = [t for t in trades if t.profit > 0]
            losers = [t for t in trades if t.profit <= 0]
            
            metrics.winning_trades = len(winners)
            metrics.losing_trades = len(losers)
            metrics.win_rate = (len(winners) / len(trades)) * 100 if trades else 0
            
            # Average win/loss
            if winners:
                metrics.avg_win = np.mean([t.profit for t in winners])
                metrics.avg_win_pct = np.mean([t.profit_pct for t in winners])
                metrics.largest_win = max(t.profit for t in winners)
            
            if losers:
                metrics.avg_loss = np.mean([t.profit for t in losers])
                metrics.avg_loss_pct = np.mean([t.profit_pct for t in losers])
                metrics.largest_loss = min(t.profit for t in losers)
            
            # Profit factor
            gross_profit = sum(t.profit for t in winners) if winners else 0
            gross_loss = abs(sum(t.profit for t in losers)) if losers else 0
            if gross_loss > 0:
                metrics.profit_factor = gross_profit / gross_loss
            
            # Average trade
            metrics.avg_trade = np.mean([t.profit for t in trades])
            metrics.avg_trade_pct = np.mean([t.profit_pct for t in trades])
            
            # Time analysis
            metrics.avg_bars_in_trade = np.mean([t.bars_held for t in trades])
            if winners:
                metrics.avg_bars_in_winner = np.mean([t.bars_held for t in winners])
            if losers:
                metrics.avg_bars_in_loser = np.mean([t.bars_held for t in losers])
            
            # Consecutive wins/losses
            metrics.max_consecutive_wins = self._max_consecutive(trades, True)
            metrics.max_consecutive_losses = self._max_consecutive(trades, False)
            
            # Expectancy
            if metrics.win_rate > 0:
                win_rate_decimal = metrics.win_rate / 100
                metrics.expectancy = (win_rate_decimal * metrics.avg_win_pct) + \
                                    ((1 - win_rate_decimal) * metrics.avg_loss_pct)
            
            # SQN (System Quality Number)
            if len(trades) > 0:
                trade_returns = [t.profit_pct for t in trades]
                if np.std(trade_returns) > 0:
                    metrics.sqn = (np.mean(trade_returns) / np.std(trade_returns)) * np.sqrt(len(trades))
            
            # Recovery Factor
            if metrics.max_drawdown > 0:
                metrics.recovery_factor = metrics.total_return / metrics.max_drawdown
            
            # Time in market / Exposure
            total_bars_in_trades = sum(t.bars_held for t in trades)
            if len(equity_curve) > 0:
                metrics.exposure_pct = (total_bars_in_trades / len(equity_curve)) * 100
                metrics.time_in_market = metrics.exposure_pct
        
        return metrics
    
    def _max_consecutive(self, trades: List[Trade], winners: bool) -> int:
        """Calculate max consecutive wins or losses"""
        max_streak = 0
        current_streak = 0
        
        for trade in trades:
            is_winner = trade.profit > 0
            if is_winner == winners:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
        
        return max_streak
    
    def run_monte_carlo(
        self,
        trades: List[Trade],
        initial_capital: float,
        simulations: int = 1000,
        confidence_level: float = 0.95
    ) -> MonteCarloResult:
        """
        Run Monte Carlo simulation by randomizing trade sequence
        """
        result = MonteCarloResult(
            simulations=simulations,
            confidence_level=confidence_level
        )
        
        if not trades or len(trades) < 2:
            return result
        
        # Extract trade returns
        trade_returns = np.array([t.profit for t in trades])
        
        # Run simulations
        final_equities = []
        max_drawdowns = []
        equity_curves = []
        
        for _ in range(simulations):
            # Shuffle trade order
            shuffled_returns = np.random.permutation(trade_returns)
            
            # Build equity curve
            equity = [initial_capital]
            for ret in shuffled_returns:
                equity.append(equity[-1] + ret)
            
            # Calculate max drawdown for this simulation
            equity_arr = np.array(equity)
            peak = np.maximum.accumulate(equity_arr)
            drawdown = (peak - equity_arr) / peak
            max_dd = np.max(drawdown)
            
            final_equities.append(equity[-1])
            max_drawdowns.append(max_dd)
            
            # Store some equity curves for visualization (limit to 100)
            if len(equity_curves) < 100:
                equity_curves.append(equity)
        
        final_equities = np.array(final_equities)
        max_drawdowns = np.array(max_drawdowns)

        # Return distribution
        result.mean_return = float(np.mean(final_equities) - initial_capital)
        result.median_return = float(np.median(final_equities) - initial_capital)
        result.std_return = float(np.std(final_equities))
        result.min_return = float(np.min(final_equities) - initial_capital)
        result.max_return = float(np.max(final_equities) - initial_capital)
        
        # Percentiles
        result.percentile_5 = float(np.percentile(final_equities, 5) - initial_capital)
        result.percentile_25 = float(np.percentile(final_equities, 25) - initial_capital)
        result.percentile_75 = float(np.percentile(final_equities, 75) - initial_capital)
        result.percentile_95 = float(np.percentile(final_equities, 95) - initial_capital)
        
        # Drawdown distribution
        result.mean_max_drawdown = float(np.mean(max_drawdowns) * 100)
        result.median_max_drawdown = float(np.median(max_drawdowns) * 100)
        result.worst_max_drawdown = float(np.max(max_drawdowns) * 100)
        result.drawdown_95 = float(np.percentile(max_drawdowns, 95) * 100)
        
        # Risk of ruin calculations
        result.probability_of_loss = float(np.mean(final_equities < initial_capital) * 100)
        result.probability_of_50pct_loss = float(np.mean(final_equities < initial_capital * 0.5) * 100)
        result.probability_of_ruin = float(np.mean(final_equities <= 0) * 100)
        
        # Store equity curves and final equities for visualization
        result.equity_curves = [curve for curve in equity_curves[:50]]  # Limit for JSON size
        result.final_equities = final_equities.tolist()
        
        return result
    
    def generate_report(
        self,
        trades: List[Trade],
        equity_curve: List[float],
        initial_capital: float,
        include_monte_carlo: bool = True
    ) -> dict:
        """Generate comprehensive backtest report"""
        metrics = self.calculate_metrics(trades, equity_curve, initial_capital)
        
        report = {
            "summary": {
                "total_return": f"${metrics.total_return:,.2f}",
                "total_return_pct": f"{metrics.total_return_pct:.2f}%",
                "cagr": f"{metrics.cagr:.2f}%",
                "sharpe_ratio": f"{metrics.sharpe_ratio:.2f}",
                "sortino_ratio": f"{metrics.sortino_ratio:.2f}",
                "max_drawdown": f"{metrics.max_drawdown_pct:.2f}%",
                "win_rate": f"{metrics.win_rate:.1f}%",
                "profit_factor": f"{metrics.profit_factor:.2f}",
                "total_trades": metrics.total_trades
            },
            "returns": {
                "total_return": metrics.total_return,
                "total_return_pct": metrics.total_return_pct,
                "annualized_return": metrics.annualized_return,
                "cagr": metrics.cagr
            },
            "risk": {
                "volatility": metrics.volatility,
                "downside_volatility": metrics.downside_volatility,
                "max_drawdown": metrics.max_drawdown,
                "max_drawdown_pct": metrics.max_drawdown_pct,
                "max_drawdown_duration": metrics.max_drawdown_duration,
                "avg_drawdown": metrics.avg_drawdown
            },
            "risk_adjusted": {
                "sharpe_ratio": metrics.sharpe_ratio,
                "sortino_ratio": metrics.sortino_ratio,
                "calmar_ratio": metrics.calmar_ratio,
                "omega_ratio": metrics.omega_ratio
            },
            "trades": {
                "total_trades": metrics.total_trades,
                "winning_trades": metrics.winning_trades,
                "losing_trades": metrics.losing_trades,
                "win_rate": metrics.win_rate,
                "profit_factor": metrics.profit_factor,
                "avg_win": metrics.avg_win,
                "avg_loss": metrics.avg_loss,
                "largest_win": metrics.largest_win,
                "largest_loss": metrics.largest_loss,
                "avg_trade": metrics.avg_trade,
                "expectancy": metrics.expectancy,
                "sqn": metrics.sqn
            },
            "time_analysis": {
                "avg_bars_in_trade": metrics.avg_bars_in_trade,
                "avg_bars_in_winner": metrics.avg_bars_in_winner,
                "avg_bars_in_loser": metrics.avg_bars_in_loser,
                "max_consecutive_wins": metrics.max_consecutive_wins,
                "max_consecutive_losses": metrics.max_consecutive_losses,
                "exposure_pct": metrics.exposure_pct
            }
        }
        
        if include_monte_carlo and trades:
            monte_carlo = self.run_monte_carlo(trades, initial_capital)
            report["monte_carlo"] = {
                "simulations": monte_carlo.simulations,
                "mean_return": monte_carlo.mean_return,
                "median_return": monte_carlo.median_return,
                "percentile_5": monte_carlo.percentile_5,
                "percentile_95": monte_carlo.percentile_95,
                "probability_of_loss": monte_carlo.probability_of_loss,
                "probability_of_50pct_loss": monte_carlo.probability_of_50pct_loss,
                "worst_max_drawdown": monte_carlo.worst_max_drawdown,
                "drawdown_95": monte_carlo.drawdown_95
            }
        
        return report


# Global instance
backtest_analytics = BacktestAnalytics()
