"""
Node processors for Agentic Trading System
"""
from .base import BaseNode
from .market_data import GetLivePriceNode, GetHistoricalDataNode, GetAccountInfoNode
from .orders import MarketOrderNode, ClosePositionNode
from .conditions import IfElseNode, CompareNode
from .notifications import DashboardNotificationNode
from .indicators import RSINode, MACDNode, MovingAverageNode, BollingerBandsNode, ATRNode
from .risk_management import (
    PositionSizerNode,
    RiskRewardCalculatorNode,
    DrawdownMonitorNode,
    DailyLossLimitNode,
    MaxPositionsNode,
    SmartRiskManagerNode
)
from .memory import SetStateNode, GetStateNode
from .news import NewsFetchNode, SentimentAnalysisNode
from .triggers import (
    ScheduleTriggerNode,
    PriceTriggerNode,
    IndicatorTriggerNode,
    TimeTriggerNode,
    WebhookTriggerNode,
    ManualTriggerNode
)

__all__ = [
    "BaseNode",
    # Market Data
    "GetLivePriceNode",
    "GetHistoricalDataNode",
    "GetAccountInfoNode",
    # Orders
    "MarketOrderNode",
    "ClosePositionNode",
    # Conditions
    "IfElseNode",
    "CompareNode",
    # Notifications
    "DashboardNotificationNode",
    # Indicators
    "RSINode",
    "MACDNode",
    "MovingAverageNode",
    "BollingerBandsNode",
    "ATRNode",
    # Risk Management
    "PositionSizerNode",
    "RiskRewardCalculatorNode",
    "DrawdownMonitorNode",
    "DailyLossLimitNode",
    "MaxPositionsNode",
    "SmartRiskManagerNode",
    # Memory
    "SetStateNode",
    "GetStateNode",
    # News
    "NewsFetchNode",
    "SentimentAnalysisNode",
    # Triggers
    "ScheduleTriggerNode",
    "PriceTriggerNode",
    "IndicatorTriggerNode",
    "TimeTriggerNode",
    "WebhookTriggerNode",
    "ManualTriggerNode",
]
