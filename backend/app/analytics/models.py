"""
Analytics Data Models for AI Trading Decision Intelligence
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from enum import Enum
from datetime import datetime


class MarketCondition(str, Enum):
    TRENDING = "trending"
    RANGING = "ranging"
    VOLATILE = "volatile"
    CHOPPY = "choppy"


class MarketDirection(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class RiskLevel(str, Enum):
    SAFE = "safe"
    WARNING = "warning"
    CRITICAL = "critical"


class TradingSession(str, Enum):
    ASIA = "asia"
    LONDON = "london"
    NEW_YORK = "new_york"
    OVERLAP_LONDON_NY = "overlap_london_ny"
    OVERLAP_ASIA_LONDON = "overlap_asia_london"
    OFF_HOURS = "off_hours"


class TradeZone(str, Enum):
    NO_TRADE = "no_trade"
    CAUTION = "caution"
    HIGH_PROBABILITY = "high_probability"


class StrategyStatus(str, Enum):
    HEALTHY = "healthy"
    WEAK = "weak"
    DISABLED = "disabled"


# ============ Response Models ============

class MarketRegime(BaseModel):
    """Market Regime Analysis Result"""
    condition: MarketCondition
    direction: MarketDirection
    confidence: float = Field(ge=0, le=100, description="Confidence percentage 0-100")
    atr_ratio: float = Field(description="ATR relative to price")
    adx_strength: float = Field(description="ADX value for trend strength")
    rsi_slope: float = Field(description="RSI momentum direction")
    volume_expansion: bool = Field(description="Volume expanding or contracting")
    color_code: Literal["green", "yellow", "red"]
    summary: str = Field(description="Human-readable summary")
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TradeReadiness(BaseModel):
    """AI Trade Readiness Meter Result"""
    score: float = Field(ge=0, le=100, description="Readiness score 0-100")
    zone: TradeZone
    momentum_aligned: bool
    volume_confirmed: bool
    spread_ok: bool
    session_quality: str
    indicator_agreement: float = Field(ge=0, le=100)
    factors: List[str] = Field(description="Contributing factors")
    warnings: List[str] = Field(default_factory=list)
    color_code: Literal["green", "yellow", "red"]
    recommendation: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StrategyHealth(BaseModel):
    """Strategy Health Panel Result"""
    strategy_name: str
    confidence: float = Field(ge=0, le=100)
    status: StrategyStatus
    win_rate_20: float = Field(description="Win rate of last 20 trades")
    recent_drawdown: float
    regime_compatible: bool
    color_code: Literal["green", "yellow", "red"]
    notes: str


class TradeQuality(BaseModel):
    """Trade Quality Score for Open Positions"""
    ticket: int
    symbol: str
    score: float = Field(ge=0, le=100)
    positive_factors: List[str]
    warnings: List[str]
    recommendation: Literal["hold", "partial_close", "exit_early", "add_position"]
    color_code: Literal["green", "yellow", "red"]
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RiskStatus(BaseModel):
    """Risk & Drawdown Intelligence Result"""
    current_drawdown: float
    max_allowed_drawdown: float
    drawdown_percentage: float = Field(ge=0, le=100)
    risk_level: RiskLevel
    daily_loss: float
    weekly_loss: float
    open_risk: float = Field(description="Total risk from open positions")
    color_code: Literal["green", "yellow", "red"]
    warning_message: Optional[str] = None
    should_pause_trading: bool = False
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SessionIntelligence(BaseModel):
    """Session & Liquidity Intelligence Result"""
    active_session: TradingSession
    session_name: str
    liquidity_quality: Literal["high", "medium", "low"]
    false_breakout_probability: float = Field(ge=0, le=100)
    spread_condition: Literal["tight", "normal", "wide"]
    best_pairs: List[str] = Field(description="Best pairs for current session")
    avoid_pairs: List[str] = Field(description="Pairs to avoid")
    color_code: Literal["green", "yellow", "red"]
    notes: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MarketNarrative(BaseModel):
    """AI Market Insight - Natural Language Analysis"""
    narrative: str = Field(description="Human-style market explanation")
    key_observations: List[str]
    smart_money_bias: Literal["buying", "selling", "neutral", "unclear"]
    action_recommendation: Literal["wait", "prepare", "act_cautiously", "act_confidently"]
    confidence: float = Field(ge=0, le=100)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TradeBlockReason(BaseModel):
    """Reason for blocking a trade"""
    reason_code: str
    description: str
    severity: Literal["warning", "block"]


class TradeBlocker(BaseModel):
    """AI Trade Blocker - Guard Rail System"""
    is_blocked: bool
    block_reasons: List[TradeBlockReason] = Field(default_factory=list)
    spread_abnormal: bool = False
    volume_too_low: bool = False
    news_window_active: bool = False
    risk_limit_violated: bool = False
    can_override: bool = Field(description="Whether user can override the block")
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FullAnalytics(BaseModel):
    """Complete Analytics Response"""
    market_regime: MarketRegime
    trade_readiness: TradeReadiness
    risk_status: RiskStatus
    session_intelligence: SessionIntelligence
    market_narrative: MarketNarrative
    trade_blocker: TradeBlocker
    trade_qualities: List[TradeQuality] = Field(default_factory=list)
    strategy_health: List[StrategyHealth] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
