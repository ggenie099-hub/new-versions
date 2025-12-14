"""
Analytics Engine - Core calculation logic for AI Trading Decision Intelligence
"""
import MetaTrader5 as mt5
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Tuple
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import asyncio
import logging

from .models import (
    MarketRegime, MarketCondition, MarketDirection,
    TradeReadiness, TradeZone,
    StrategyHealth, StrategyStatus,
    TradeQuality,
    RiskStatus, RiskLevel,
    SessionIntelligence, TradingSession,
    MarketNarrative,
    TradeBlocker, TradeBlockReason,
    FullAnalytics
)

logger = logging.getLogger(__name__)


class AnalyticsEngine:
    """Core analytics engine for market analysis"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        # Risk settings (can be made configurable per user)
        self.max_drawdown_percent = 10.0
        self.max_daily_loss_percent = 3.0
        self.max_spread_pips = 5.0
        self.min_volume_threshold = 100
    
    # ============ MARKET DATA HELPERS ============
    
    def _get_ohlcv_data(self, symbol: str, timeframe: int = mt5.TIMEFRAME_H1, bars: int = 100) -> Optional[np.ndarray]:
        """Get OHLCV data from MT5"""
        try:
            rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, bars)
            if rates is None or len(rates) == 0:
                return None
            return rates
        except Exception as e:
            logger.error(f"Failed to get OHLCV for {symbol}: {e}")
            return None
    
    def _calculate_atr(self, high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> float:
        """Calculate Average True Range"""
        if len(high) < period + 1:
            return 0.0
        
        tr_list = []
        for i in range(1, len(high)):
            tr = max(
                high[i] - low[i],
                abs(high[i] - close[i-1]),
                abs(low[i] - close[i-1])
            )
            tr_list.append(tr)
        
        if len(tr_list) < period:
            return np.mean(tr_list) if tr_list else 0.0
        
        return np.mean(tr_list[-period:])
    
    def _calculate_adx(self, high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> float:
        """Calculate ADX (Average Directional Index)"""
        if len(high) < period * 2:
            return 25.0  # Default neutral value
        
        plus_dm = []
        minus_dm = []
        tr_list = []
        
        for i in range(1, len(high)):
            up_move = high[i] - high[i-1]
            down_move = low[i-1] - low[i]
            
            plus_dm.append(up_move if up_move > down_move and up_move > 0 else 0)
            minus_dm.append(down_move if down_move > up_move and down_move > 0 else 0)
            
            tr = max(high[i] - low[i], abs(high[i] - close[i-1]), abs(low[i] - close[i-1]))
            tr_list.append(tr)
        
        if len(tr_list) < period:
            return 25.0
        
        # Smoothed values
        atr = np.mean(tr_list[-period:])
        plus_di = 100 * np.mean(plus_dm[-period:]) / atr if atr > 0 else 0
        minus_di = 100 * np.mean(minus_dm[-period:]) / atr if atr > 0 else 0
        
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di) if (plus_di + minus_di) > 0 else 0
        return dx

    
    def _calculate_rsi(self, close: np.ndarray, period: int = 14) -> Tuple[float, float]:
        """Calculate RSI and its slope"""
        if len(close) < period + 5:
            return 50.0, 0.0
        
        deltas = np.diff(close)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            rsi = 100.0
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        # Calculate RSI slope (momentum direction)
        rsi_values = []
        for i in range(5):
            idx = -(period + i)
            if abs(idx) > len(gains):
                continue
            ag = np.mean(gains[idx:idx+period] if idx+period < 0 else gains[idx:])
            al = np.mean(losses[idx:idx+period] if idx+period < 0 else losses[idx:])
            if al == 0:
                rsi_values.append(100.0)
            else:
                rsi_values.append(100 - (100 / (1 + ag/al)))
        
        slope = (rsi_values[0] - rsi_values[-1]) / len(rsi_values) if len(rsi_values) > 1 else 0
        return rsi, slope
    
    def _check_volume_expansion(self, volume: np.ndarray, period: int = 20) -> bool:
        """Check if volume is expanding"""
        if len(volume) < period + 5:
            return False
        
        recent_avg = np.mean(volume[-5:])
        historical_avg = np.mean(volume[-period:-5])
        
        return recent_avg > historical_avg * 1.2
    
    # ============ MARKET REGIME ANALYZER ============
    
    async def analyze_market_regime(self, symbol: str = "EURUSD") -> MarketRegime:
        """Analyze current market regime"""
        loop = asyncio.get_event_loop()
        
        def _analyze():
            rates = self._get_ohlcv_data(symbol, mt5.TIMEFRAME_H1, 100)
            
            if rates is None:
                # Return default when no data
                return MarketRegime(
                    condition=MarketCondition.RANGING,
                    direction=MarketDirection.NEUTRAL,
                    confidence=50.0,
                    atr_ratio=0.0,
                    adx_strength=25.0,
                    rsi_slope=0.0,
                    volume_expansion=False,
                    color_code="yellow",
                    summary="Unable to fetch market data. Please ensure MT5 is connected."
                )
            
            high = np.array([r['high'] for r in rates])
            low = np.array([r['low'] for r in rates])
            close = np.array([r['close'] for r in rates])
            volume = np.array([r['tick_volume'] for r in rates])
            
            # Calculate indicators
            atr = self._calculate_atr(high, low, close)
            atr_ratio = (atr / close[-1]) * 100 if close[-1] > 0 else 0
            adx = self._calculate_adx(high, low, close)
            rsi, rsi_slope = self._calculate_rsi(close)
            vol_expansion = self._check_volume_expansion(volume)
            
            # Determine market condition
            if adx > 25 and atr_ratio > 0.1:
                condition = MarketCondition.TRENDING
            elif adx < 20 and atr_ratio < 0.05:
                condition = MarketCondition.RANGING
            elif atr_ratio > 0.15:
                condition = MarketCondition.VOLATILE
            else:
                condition = MarketCondition.CHOPPY
            
            # Determine direction
            sma_20 = np.mean(close[-20:])
            sma_50 = np.mean(close[-50:]) if len(close) >= 50 else sma_20
            
            if close[-1] > sma_20 > sma_50 and rsi_slope > 0:
                direction = MarketDirection.BULLISH
            elif close[-1] < sma_20 < sma_50 and rsi_slope < 0:
                direction = MarketDirection.BEARISH
            else:
                direction = MarketDirection.NEUTRAL
            
            # Calculate confidence
            confidence = min(100, adx + abs(rsi_slope) * 10 + (20 if vol_expansion else 0))
            
            # Color code
            if condition == MarketCondition.TRENDING and confidence > 60:
                color_code = "green"
            elif condition in [MarketCondition.VOLATILE, MarketCondition.CHOPPY]:
                color_code = "red"
            else:
                color_code = "yellow"
            
            # Summary
            summary = f"Market is {condition.value} with {direction.value} bias. "
            if condition == MarketCondition.TRENDING:
                summary += "Good conditions for trend-following strategies."
            elif condition == MarketCondition.RANGING:
                summary += "Consider range-bound strategies or wait for breakout."
            elif condition == MarketCondition.VOLATILE:
                summary += "High volatility - use wider stops or reduce position size."
            else:
                summary += "Choppy conditions - consider staying out."
            
            return MarketRegime(
                condition=condition,
                direction=direction,
                confidence=round(confidence, 1),
                atr_ratio=round(atr_ratio, 4),
                adx_strength=round(adx, 1),
                rsi_slope=round(rsi_slope, 2),
                volume_expansion=vol_expansion,
                color_code=color_code,
                summary=summary
            )
        
        return await loop.run_in_executor(self.executor, _analyze)

    
    # ============ TRADE READINESS METER ============
    
    async def analyze_trade_readiness(self, symbol: str = "EURUSD") -> TradeReadiness:
        """Calculate AI Trade Readiness Score"""
        loop = asyncio.get_event_loop()
        
        def _analyze():
            factors = []
            warnings = []
            score = 50.0  # Base score
            
            # Get market data
            rates = self._get_ohlcv_data(symbol, mt5.TIMEFRAME_H1, 50)
            symbol_info = mt5.symbol_info(symbol)
            
            # 1. Momentum alignment
            momentum_aligned = False
            if rates is not None:
                close = np.array([r['close'] for r in rates])
                rsi, rsi_slope = self._calculate_rsi(close)
                
                if 40 < rsi < 60 and abs(rsi_slope) > 0.5:
                    momentum_aligned = True
                    score += 15
                    factors.append("Momentum aligned with trend")
                elif rsi > 70 or rsi < 30:
                    warnings.append(f"RSI at extreme level ({rsi:.0f})")
                    score -= 10
            
            # 2. Volume confirmation
            volume_confirmed = False
            if rates is not None:
                volume = np.array([r['tick_volume'] for r in rates])
                if self._check_volume_expansion(volume):
                    volume_confirmed = True
                    score += 10
                    factors.append("Volume confirms move")
                else:
                    warnings.append("Low volume - weak conviction")
            
            # 3. Spread condition
            spread_ok = False
            if symbol_info:
                spread_points = symbol_info.spread
                point = symbol_info.point
                spread_pips = spread_points * point * 10000 if 'JPY' not in symbol else spread_points * point * 100
                
                if spread_pips < self.max_spread_pips:
                    spread_ok = True
                    score += 10
                    factors.append(f"Spread tight ({spread_pips:.1f} pips)")
                else:
                    warnings.append(f"Wide spread ({spread_pips:.1f} pips)")
                    score -= 15
            
            # 4. Session timing
            session = self._get_current_session()
            session_quality = "poor"
            
            if session in [TradingSession.LONDON, TradingSession.NEW_YORK, TradingSession.OVERLAP_LONDON_NY]:
                session_quality = "excellent"
                score += 15
                factors.append(f"Active session: {session.value}")
            elif session == TradingSession.OVERLAP_ASIA_LONDON:
                session_quality = "good"
                score += 10
                factors.append("Asia-London overlap")
            elif session == TradingSession.ASIA:
                session_quality = "moderate"
                score += 5
                if 'JPY' in symbol or 'AUD' in symbol:
                    factors.append("Asian session - good for JPY/AUD pairs")
                else:
                    warnings.append("Asian session - lower liquidity for majors")
            else:
                warnings.append("Off-hours trading - reduced liquidity")
                score -= 10
            
            # 5. Indicator agreement
            indicator_agreement = 50.0
            if rates is not None:
                close = np.array([r['close'] for r in rates])
                sma_10 = np.mean(close[-10:])
                sma_20 = np.mean(close[-20:])
                ema_10 = self._calculate_ema(close, 10)
                
                agreements = 0
                if close[-1] > sma_10:
                    agreements += 1
                if close[-1] > sma_20:
                    agreements += 1
                if close[-1] > ema_10:
                    agreements += 1
                if sma_10 > sma_20:
                    agreements += 1
                
                indicator_agreement = (agreements / 4) * 100
                score += (indicator_agreement - 50) * 0.2
                
                if indicator_agreement > 75:
                    factors.append("Strong indicator agreement")
                elif indicator_agreement < 25:
                    warnings.append("Conflicting indicator signals")
            
            # Clamp score
            score = max(0, min(100, score))
            
            # Determine zone
            if score >= 70:
                zone = TradeZone.HIGH_PROBABILITY
                color_code = "green"
                recommendation = "Market conditions favorable. Proceed with your strategy."
            elif score >= 50:
                zone = TradeZone.CAUTION
                color_code = "yellow"
                recommendation = "Proceed with caution. Consider reduced position size."
            else:
                zone = TradeZone.NO_TRADE
                color_code = "red"
                recommendation = "Low quality setup. Consider waiting for better conditions."
            
            return TradeReadiness(
                score=round(score, 1),
                zone=zone,
                momentum_aligned=momentum_aligned,
                volume_confirmed=volume_confirmed,
                spread_ok=spread_ok,
                session_quality=session_quality,
                indicator_agreement=round(indicator_agreement, 1),
                factors=factors,
                warnings=warnings,
                color_code=color_code,
                recommendation=recommendation
            )
        
        return await loop.run_in_executor(self.executor, _analyze)
    
    def _calculate_ema(self, data: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(data) < period:
            return np.mean(data)
        
        multiplier = 2 / (period + 1)
        ema = data[-period]
        
        for price in data[-period+1:]:
            ema = (price - ema) * multiplier + ema
        
        return ema
    
    def _get_current_session(self) -> TradingSession:
        """Determine current trading session based on UTC time"""
        now = datetime.utcnow()
        hour = now.hour
        
        # Session times (UTC)
        # Asia: 00:00 - 09:00
        # London: 08:00 - 17:00
        # New York: 13:00 - 22:00
        
        if 8 <= hour < 9:
            return TradingSession.OVERLAP_ASIA_LONDON
        elif 13 <= hour < 17:
            return TradingSession.OVERLAP_LONDON_NY
        elif 0 <= hour < 8:
            return TradingSession.ASIA
        elif 9 <= hour < 13:
            return TradingSession.LONDON
        elif 17 <= hour < 22:
            return TradingSession.NEW_YORK
        else:
            return TradingSession.OFF_HOURS

    
    # ============ RISK STATUS ============
    
    async def analyze_risk_status(self, balance: float, equity: float, 
                                   open_positions: List[Dict]) -> RiskStatus:
        """Analyze current risk and drawdown status"""
        
        # Calculate drawdown
        current_drawdown = balance - equity if balance > equity else 0
        drawdown_percentage = (current_drawdown / balance * 100) if balance > 0 else 0
        
        # Calculate open risk
        open_risk = sum(abs(pos.get('profit', 0)) for pos in open_positions if pos.get('profit', 0) < 0)
        
        # Determine risk level
        if drawdown_percentage >= self.max_drawdown_percent:
            risk_level = RiskLevel.CRITICAL
            color_code = "red"
            warning_message = f"CRITICAL: Drawdown ({drawdown_percentage:.1f}%) exceeds maximum allowed ({self.max_drawdown_percent}%)"
            should_pause = True
        elif drawdown_percentage >= self.max_drawdown_percent * 0.7:
            risk_level = RiskLevel.WARNING
            color_code = "yellow"
            warning_message = f"WARNING: Approaching maximum drawdown limit"
            should_pause = False
        else:
            risk_level = RiskLevel.SAFE
            color_code = "green"
            warning_message = None
            should_pause = False
        
        return RiskStatus(
            current_drawdown=round(current_drawdown, 2),
            max_allowed_drawdown=round(balance * self.max_drawdown_percent / 100, 2),
            drawdown_percentage=round(drawdown_percentage, 2),
            risk_level=risk_level,
            daily_loss=0.0,  # Would need trade history to calculate
            weekly_loss=0.0,
            open_risk=round(open_risk, 2),
            color_code=color_code,
            warning_message=warning_message,
            should_pause_trading=should_pause
        )
    
    # ============ SESSION INTELLIGENCE ============
    
    async def analyze_session_intelligence(self, symbol: str = "EURUSD") -> SessionIntelligence:
        """Analyze current session and liquidity"""
        
        session = self._get_current_session()
        
        # Session-specific analysis
        session_configs = {
            TradingSession.ASIA: {
                "name": "Asian Session",
                "liquidity": "medium",
                "breakout_prob": 65,
                "best_pairs": ["USDJPY", "AUDUSD", "NZDUSD", "AUDJPY"],
                "avoid_pairs": ["GBPUSD", "EURGBP"],
                "notes": "Lower volatility. Good for range trading. JPY and AUD pairs most active."
            },
            TradingSession.LONDON: {
                "name": "London Session",
                "liquidity": "high",
                "breakout_prob": 35,
                "best_pairs": ["EURUSD", "GBPUSD", "EURGBP", "GBPJPY"],
                "avoid_pairs": [],
                "notes": "High liquidity and volatility. Best time for breakout trades."
            },
            TradingSession.NEW_YORK: {
                "name": "New York Session",
                "liquidity": "high",
                "breakout_prob": 40,
                "best_pairs": ["EURUSD", "GBPUSD", "USDCAD", "USDJPY"],
                "avoid_pairs": ["AUDNZD"],
                "notes": "High activity. Watch for US economic news impact."
            },
            TradingSession.OVERLAP_LONDON_NY: {
                "name": "London-NY Overlap",
                "liquidity": "high",
                "breakout_prob": 25,
                "best_pairs": ["EURUSD", "GBPUSD", "USDCHF"],
                "avoid_pairs": [],
                "notes": "Peak liquidity period. Best time for major pairs."
            },
            TradingSession.OVERLAP_ASIA_LONDON: {
                "name": "Asia-London Overlap",
                "liquidity": "medium",
                "breakout_prob": 45,
                "best_pairs": ["EURJPY", "GBPJPY", "EURUSD"],
                "avoid_pairs": ["AUDNZD", "NZDUSD"],
                "notes": "Transitional period. Watch for European open moves."
            },
            TradingSession.OFF_HOURS: {
                "name": "Off-Hours",
                "liquidity": "low",
                "breakout_prob": 75,
                "best_pairs": [],
                "avoid_pairs": ["All major pairs"],
                "notes": "Low liquidity. High spread risk. Avoid trading if possible."
            }
        }
        
        config = session_configs.get(session, session_configs[TradingSession.OFF_HOURS])
        
        # Check spread condition
        symbol_info = mt5.symbol_info(symbol)
        spread_condition = "normal"
        if symbol_info:
            spread_points = symbol_info.spread
            if spread_points < 10:
                spread_condition = "tight"
            elif spread_points > 30:
                spread_condition = "wide"
        
        # Color code based on liquidity
        color_map = {"high": "green", "medium": "yellow", "low": "red"}
        
        return SessionIntelligence(
            active_session=session,
            session_name=config["name"],
            liquidity_quality=config["liquidity"],
            false_breakout_probability=config["breakout_prob"],
            spread_condition=spread_condition,
            best_pairs=config["best_pairs"],
            avoid_pairs=config["avoid_pairs"],
            color_code=color_map.get(config["liquidity"], "yellow"),
            notes=config["notes"]
        )

    
    # ============ MARKET NARRATIVE ============
    
    async def generate_market_narrative(self, symbol: str = "EURUSD") -> MarketNarrative:
        """Generate AI Market Insight in natural language"""
        loop = asyncio.get_event_loop()
        
        def _generate():
            observations = []
            
            rates = self._get_ohlcv_data(symbol, mt5.TIMEFRAME_H1, 50)
            
            if rates is None:
                return MarketNarrative(
                    narrative="Unable to analyze market. Please ensure MT5 connection is active.",
                    key_observations=["No market data available"],
                    smart_money_bias="unclear",
                    action_recommendation="wait",
                    confidence=0
                )
            
            close = np.array([r['close'] for r in rates])
            high = np.array([r['high'] for r in rates])
            low = np.array([r['low'] for r in rates])
            volume = np.array([r['tick_volume'] for r in rates])
            
            # Price action analysis
            current_price = close[-1]
            prev_high = np.max(high[-20:-1])
            prev_low = np.min(low[-20:-1])
            range_size = prev_high - prev_low
            
            # Position in range
            if range_size > 0:
                position_in_range = (current_price - prev_low) / range_size
            else:
                position_in_range = 0.5
            
            # Volume analysis
            vol_expanding = self._check_volume_expansion(volume)
            recent_vol = np.mean(volume[-5:])
            avg_vol = np.mean(volume[-20:])
            vol_ratio = recent_vol / avg_vol if avg_vol > 0 else 1
            
            # Trend analysis
            sma_20 = np.mean(close[-20:])
            sma_50 = np.mean(close[-50:]) if len(close) >= 50 else sma_20
            
            # Build narrative
            narrative_parts = []
            
            # Price position
            if position_in_range > 0.8:
                narrative_parts.append(f"Price is testing recent highs near {prev_high:.5f}")
                observations.append("Near resistance zone")
            elif position_in_range < 0.2:
                narrative_parts.append(f"Price is testing recent lows near {prev_low:.5f}")
                observations.append("Near support zone")
            else:
                narrative_parts.append(f"Price is consolidating within the {prev_low:.5f} - {prev_high:.5f} range")
                observations.append("Mid-range consolidation")
            
            # Volume context
            if vol_expanding and vol_ratio > 1.5:
                narrative_parts.append("with significant volume expansion")
                observations.append("Volume surge detected")
            elif vol_ratio < 0.7:
                narrative_parts.append("with declining volume")
                observations.append("Volume contraction")
            
            # Trend context
            if current_price > sma_20 > sma_50:
                narrative_parts.append("The overall trend remains bullish")
                observations.append("Bullish trend structure")
                smart_money = "buying"
            elif current_price < sma_20 < sma_50:
                narrative_parts.append("The overall trend remains bearish")
                observations.append("Bearish trend structure")
                smart_money = "selling"
            else:
                narrative_parts.append("The trend is unclear with mixed signals")
                observations.append("No clear trend")
                smart_money = "neutral"
            
            # Recommendation logic
            if vol_expanding and position_in_range > 0.7 and smart_money == "buying":
                action = "act_cautiously"
                narrative_parts.append("Breakout potential exists but wait for confirmation.")
            elif vol_expanding and position_in_range < 0.3 and smart_money == "selling":
                action = "act_cautiously"
                narrative_parts.append("Breakdown potential exists but wait for confirmation.")
            elif not vol_expanding and 0.3 < position_in_range < 0.7:
                action = "wait"
                narrative_parts.append("No clear setup. Patience recommended.")
            elif vol_ratio < 0.5:
                action = "wait"
                narrative_parts.append("Low conviction moves. Better to wait.")
            else:
                action = "prepare"
                narrative_parts.append("Monitor for entry opportunities.")
            
            # Calculate confidence
            confidence = 50
            if vol_expanding:
                confidence += 15
            if abs(position_in_range - 0.5) > 0.3:
                confidence += 10
            if smart_money != "neutral":
                confidence += 15
            
            confidence = min(100, confidence)
            
            narrative = ". ".join(narrative_parts) + "."
            
            return MarketNarrative(
                narrative=narrative,
                key_observations=observations,
                smart_money_bias=smart_money,
                action_recommendation=action,
                confidence=confidence
            )
        
        return await loop.run_in_executor(self.executor, _generate)
    
    # ============ TRADE BLOCKER ============
    
    async def check_trade_blocker(self, symbol: str, balance: float, 
                                   equity: float) -> TradeBlocker:
        """Check if trading should be blocked"""
        
        block_reasons = []
        
        # 1. Check spread
        symbol_info = mt5.symbol_info(symbol)
        spread_abnormal = False
        if symbol_info:
            spread_points = symbol_info.spread
            if spread_points > 50:  # Very wide spread
                spread_abnormal = True
                block_reasons.append(TradeBlockReason(
                    reason_code="SPREAD_HIGH",
                    description=f"Spread is abnormally high ({spread_points} points)",
                    severity="block"
                ))
        
        # 2. Check volume
        volume_too_low = False
        rates = self._get_ohlcv_data(symbol, mt5.TIMEFRAME_M15, 10)
        if rates is not None:
            recent_vol = np.mean([r['tick_volume'] for r in rates[-3:]])
            if recent_vol < self.min_volume_threshold:
                volume_too_low = True
                block_reasons.append(TradeBlockReason(
                    reason_code="LOW_VOLUME",
                    description="Market volume is too low for reliable execution",
                    severity="warning"
                ))
        
        # 3. Check risk limits
        risk_violated = False
        if balance > 0:
            drawdown_pct = ((balance - equity) / balance) * 100
            if drawdown_pct >= self.max_drawdown_percent:
                risk_violated = True
                block_reasons.append(TradeBlockReason(
                    reason_code="RISK_LIMIT",
                    description=f"Maximum drawdown limit reached ({drawdown_pct:.1f}%)",
                    severity="block"
                ))
        
        # 4. News window (simplified - would need news API for real implementation)
        news_active = False
        now = datetime.utcnow()
        # Block during typical high-impact news times (simplified)
        if now.weekday() == 4 and 12 <= now.hour <= 14:  # Friday NFP window
            news_active = True
            block_reasons.append(TradeBlockReason(
                reason_code="NEWS_WINDOW",
                description="High-impact news window active (NFP)",
                severity="warning"
            ))
        
        # Determine if blocked
        is_blocked = any(r.severity == "block" for r in block_reasons)
        can_override = not any(r.reason_code == "RISK_LIMIT" for r in block_reasons)
        
        return TradeBlocker(
            is_blocked=is_blocked,
            block_reasons=block_reasons,
            spread_abnormal=spread_abnormal,
            volume_too_low=volume_too_low,
            news_window_active=news_active,
            risk_limit_violated=risk_violated,
            can_override=can_override
        )

    
    # ============ TRADE QUALITY SCORE ============
    
    async def analyze_trade_quality(self, position: Dict) -> TradeQuality:
        """Analyze quality of an open trade"""
        loop = asyncio.get_event_loop()
        
        def _analyze():
            symbol = position.get('symbol', 'EURUSD')
            ticket = position.get('ticket', 0)
            trade_type = position.get('type', 'BUY')
            open_price = position.get('price_open', 0)
            current_price = position.get('price_current', 0)
            profit = position.get('profit', 0)
            
            positive_factors = []
            warnings = []
            score = 50.0
            
            # Get current market data
            rates = self._get_ohlcv_data(symbol, mt5.TIMEFRAME_H1, 50)
            
            if rates is not None:
                close = np.array([r['close'] for r in rates])
                high = np.array([r['high'] for r in rates])
                low = np.array([r['low'] for r in rates])
                volume = np.array([r['tick_volume'] for r in rates])
                
                # 1. Check if trade is with trend
                sma_20 = np.mean(close[-20:])
                if trade_type == 'BUY' and current_price > sma_20:
                    positive_factors.append("Trade aligned with short-term trend")
                    score += 15
                elif trade_type == 'SELL' and current_price < sma_20:
                    positive_factors.append("Trade aligned with short-term trend")
                    score += 15
                else:
                    warnings.append("Trade against short-term trend")
                    score -= 10
                
                # 2. Check momentum
                rsi, rsi_slope = self._calculate_rsi(close)
                if trade_type == 'BUY' and rsi_slope > 0:
                    positive_factors.append("Momentum supports long position")
                    score += 10
                elif trade_type == 'SELL' and rsi_slope < 0:
                    positive_factors.append("Momentum supports short position")
                    score += 10
                elif abs(rsi_slope) < 0.2:
                    warnings.append("Weak momentum")
                    score -= 5
                else:
                    warnings.append("Momentum against position")
                    score -= 15
                
                # 3. Check volume
                if self._check_volume_expansion(volume):
                    positive_factors.append("Volume confirms move")
                    score += 10
                else:
                    warnings.append("Low volume - weak conviction")
                    score -= 5
                
                # 4. Check if near support/resistance
                recent_high = np.max(high[-20:])
                recent_low = np.min(low[-20:])
                
                if trade_type == 'BUY':
                    distance_to_resistance = (recent_high - current_price) / current_price * 100
                    if distance_to_resistance < 0.1:
                        warnings.append("Near resistance - limited upside")
                        score -= 10
                    elif distance_to_resistance > 0.5:
                        positive_factors.append("Room to run before resistance")
                        score += 5
                else:
                    distance_to_support = (current_price - recent_low) / current_price * 100
                    if distance_to_support < 0.1:
                        warnings.append("Near support - limited downside")
                        score -= 10
                    elif distance_to_support > 0.5:
                        positive_factors.append("Room to run before support")
                        score += 5
            
            # 5. Profit status
            if profit > 0:
                positive_factors.append(f"Position in profit (${profit:.2f})")
                score += 10
            elif profit < -50:
                warnings.append(f"Significant drawdown (${profit:.2f})")
                score -= 15
            
            # Clamp score
            score = max(0, min(100, score))
            
            # Recommendation
            if score >= 70:
                recommendation = "hold"
                color_code = "green"
            elif score >= 50:
                recommendation = "hold"
                color_code = "yellow"
            elif score >= 30:
                recommendation = "partial_close"
                color_code = "yellow"
            else:
                recommendation = "exit_early"
                color_code = "red"
            
            return TradeQuality(
                ticket=ticket,
                symbol=symbol,
                score=round(score, 1),
                positive_factors=positive_factors,
                warnings=warnings,
                recommendation=recommendation,
                color_code=color_code
            )
        
        return await loop.run_in_executor(self.executor, _analyze)
    
    # ============ STRATEGY HEALTH ============
    
    async def analyze_strategy_health(self, strategy_name: str, 
                                       trade_history: List[Dict]) -> StrategyHealth:
        """Analyze health of a trading strategy"""
        
        if not trade_history:
            return StrategyHealth(
                strategy_name=strategy_name,
                confidence=50.0,
                status=StrategyStatus.WEAK,
                win_rate_20=0.0,
                recent_drawdown=0.0,
                regime_compatible=True,
                color_code="yellow",
                notes="No trade history available for analysis"
            )
        
        # Get last 20 trades
        recent_trades = trade_history[-20:] if len(trade_history) >= 20 else trade_history
        
        # Calculate win rate
        wins = sum(1 for t in recent_trades if t.get('profit', 0) > 0)
        win_rate = (wins / len(recent_trades)) * 100 if recent_trades else 0
        
        # Calculate recent drawdown
        profits = [t.get('profit', 0) for t in recent_trades]
        cumulative = np.cumsum(profits)
        peak = np.maximum.accumulate(cumulative)
        drawdown = peak - cumulative
        max_drawdown = np.max(drawdown) if len(drawdown) > 0 else 0
        
        # Calculate confidence
        confidence = win_rate * 0.6 + (100 - min(max_drawdown, 100)) * 0.4
        
        # Determine status
        if confidence >= 70 and win_rate >= 50:
            status = StrategyStatus.HEALTHY
            color_code = "green"
            notes = "Strategy performing well. Continue with current approach."
        elif confidence >= 40:
            status = StrategyStatus.WEAK
            color_code = "yellow"
            notes = "Strategy showing weakness. Consider reducing position sizes."
        else:
            status = StrategyStatus.DISABLED
            color_code = "red"
            notes = "Strategy underperforming. Review and adjust before continuing."
        
        return StrategyHealth(
            strategy_name=strategy_name,
            confidence=round(confidence, 1),
            status=status,
            win_rate_20=round(win_rate, 1),
            recent_drawdown=round(max_drawdown, 2),
            regime_compatible=True,  # Would need market regime to determine
            color_code=color_code,
            notes=notes
        )
    
    # ============ FULL ANALYTICS ============
    
    async def get_full_analytics(self, symbol: str, balance: float, equity: float,
                                  open_positions: List[Dict],
                                  trade_history: List[Dict] = None) -> FullAnalytics:
        """Get complete analytics dashboard data"""
        
        # Run all analyses in parallel
        market_regime, trade_readiness, risk_status, session_intel, narrative, blocker = await asyncio.gather(
            self.analyze_market_regime(symbol),
            self.analyze_trade_readiness(symbol),
            self.analyze_risk_status(balance, equity, open_positions),
            self.analyze_session_intelligence(symbol),
            self.generate_market_narrative(symbol),
            self.check_trade_blocker(symbol, balance, equity)
        )
        
        # Analyze open positions
        trade_qualities = []
        for pos in open_positions:
            quality = await self.analyze_trade_quality(pos)
            trade_qualities.append(quality)
        
        # Strategy health (if history available)
        strategy_health = []
        if trade_history:
            health = await self.analyze_strategy_health("Default Strategy", trade_history)
            strategy_health.append(health)
        
        return FullAnalytics(
            market_regime=market_regime,
            trade_readiness=trade_readiness,
            risk_status=risk_status,
            session_intelligence=session_intel,
            market_narrative=narrative,
            trade_blocker=blocker,
            trade_qualities=trade_qualities,
            strategy_health=strategy_health
        )


# Global analytics engine instance
analytics_engine = AnalyticsEngine()
