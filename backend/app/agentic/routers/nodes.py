"""
Node information and testing endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.agentic.engine.executor import NODE_REGISTRY

router = APIRouter(prefix="/api/agentic/nodes", tags=["Agentic Nodes"])


@router.get("/types")
async def get_node_types() -> Dict[str, Any]:
    """
    Get all available node types with their categories
    
    Returns:
        Dictionary of node types organized by category
    """
    
    node_categories = {
        "triggers": {
            "name": "Triggers",
            "description": "Start workflow execution",
            "nodes": [
                {
                    "type": "ManualTrigger",
                    "name": "Manual Trigger",
                    "description": "Manually trigger workflow execution",
                    "inputs": [],
                    "outputs": ["triggered_at", "triggered_by", "trigger_type"],
                    "config": {}
                },
                {
                    "type": "ScheduleTrigger",
                    "name": "Schedule Trigger",
                    "description": "Trigger workflow on cron schedule",
                    "inputs": [],
                    "outputs": ["triggered_at", "cron_expression", "timezone"],
                    "config": {
                        "cron_expression": {"type": "string", "default": "0 9 * * *", "required": True},
                        "timezone": {"type": "string", "default": "UTC", "required": False}
                    }
                },
                {
                    "type": "PriceTrigger",
                    "name": "Price Trigger",
                    "description": "Trigger when price condition is met",
                    "inputs": [],
                    "outputs": ["triggered_at", "symbol", "current_price", "condition"],
                    "config": {
                        "symbol": {"type": "string", "default": "EURUSD", "required": True},
                        "condition": {"type": "string", "default": "price > 1.10", "required": True},
                        "check_interval": {"type": "number", "default": 5, "required": False}
                    }
                },
                {
                    "type": "IndicatorTrigger",
                    "name": "Indicator Trigger",
                    "description": "Trigger when indicator condition is met",
                    "inputs": [],
                    "outputs": ["triggered_at", "indicator", "indicator_value", "condition"],
                    "config": {
                        "indicator": {"type": "select", "options": ["RSI", "MACD", "MA"], "default": "RSI"},
                        "condition": {"type": "string", "default": "value < 30", "required": True},
                        "symbol": {"type": "string", "default": "EURUSD", "required": True},
                        "timeframe": {"type": "string", "default": "H1", "required": False}
                    }
                },
                {
                    "type": "TimeTrigger",
                    "name": "Time Interval Trigger",
                    "description": "Trigger at regular time intervals",
                    "inputs": [],
                    "outputs": ["triggered_at", "interval_minutes"],
                    "config": {
                        "interval_minutes": {"type": "number", "default": 60, "required": True}
                    }
                },
                {
                    "type": "WebhookTrigger",
                    "name": "Webhook Trigger",
                    "description": "Trigger via external webhook",
                    "inputs": ["webhook_data"],
                    "outputs": ["triggered_at", "webhook_url", "webhook_data"],
                    "config": {
                        "webhook_url": {"type": "string", "required": True},
                        "secret_key": {"type": "string", "required": False}
                    }
                }
            ]
        },
        "market_data": {
            "name": "Market Data",
            "description": "Fetch market prices and account information",
            "nodes": [
                {
                    "type": "GetLivePrice",
                    "name": "Get Live Price",
                    "description": "Fetch current market price for a symbol",
                    "inputs": [],
                    "outputs": ["symbol", "bid", "ask", "last", "volume"],
                    "config": {
                        "symbol": {"type": "string", "default": "EURUSD", "required": True}
                    }
                },
                {
                    "type": "GetAccountInfo",
                    "name": "Get Account Info",
                    "description": "Fetch MT5 account information",
                    "inputs": [],
                    "outputs": ["balance", "equity", "margin", "free_margin", "profit"],
                    "config": {}
                }
            ]
        },
        "indicators": {
            "name": "Technical Indicators",
            "description": "Calculate technical indicators",
            "nodes": [
                {
                    "type": "RSI",
                    "name": "RSI (Relative Strength Index)",
                    "description": "Calculate RSI indicator",
                    "inputs": ["prices"],
                    "outputs": ["rsi", "signal", "previous_rsi"],
                    "config": {
                        "period": {"type": "number", "default": 14, "required": False},
                        "overbought": {"type": "number", "default": 70, "required": False},
                        "oversold": {"type": "number", "default": 30, "required": False}
                    }
                },
                {
                    "type": "MACD",
                    "name": "MACD",
                    "description": "Calculate MACD indicator",
                    "inputs": ["prices"],
                    "outputs": ["macd_line", "signal_line", "histogram", "crossover"],
                    "config": {
                        "fast_period": {"type": "number", "default": 12, "required": False},
                        "slow_period": {"type": "number", "default": 26, "required": False},
                        "signal_period": {"type": "number", "default": 9, "required": False}
                    }
                },
                {
                    "type": "MovingAverage",
                    "name": "Moving Average",
                    "description": "Calculate SMA, EMA, or WMA",
                    "inputs": ["prices"],
                    "outputs": ["ma_value", "trend", "price_position"],
                    "config": {
                        "period": {"type": "number", "default": 20, "required": False},
                        "ma_type": {"type": "select", "options": ["SMA", "EMA", "WMA"], "default": "SMA", "required": False}
                    }
                },
                {
                    "type": "BollingerBands",
                    "name": "Bollinger Bands",
                    "description": "Calculate Bollinger Bands",
                    "inputs": ["prices"],
                    "outputs": ["upper_band", "middle_band", "lower_band", "price_position"],
                    "config": {
                        "period": {"type": "number", "default": 20, "required": False},
                        "std_dev": {"type": "number", "default": 2, "required": False}
                    }
                },
                {
                    "type": "ATR",
                    "name": "ATR (Average True Range)",
                    "description": "Calculate volatility using ATR",
                    "inputs": ["high", "low", "close"],
                    "outputs": ["atr", "atr_percentage", "volatility"],
                    "config": {
                        "period": {"type": "number", "default": 14, "required": False}
                    }
                }
            ]
        },
        "conditions": {
            "name": "Conditions & Logic",
            "description": "Conditional branching and logic",
            "nodes": [
                {
                    "type": "IfElse",
                    "name": "If/Else",
                    "description": "Conditional branching",
                    "inputs": ["value"],
                    "outputs": ["result", "branch_taken"],
                    "config": {
                        "condition": {"type": "string", "required": True}
                    }
                },
                {
                    "type": "Compare",
                    "name": "Compare Values",
                    "description": "Compare two values",
                    "inputs": ["value_a", "value_b"],
                    "outputs": ["result", "comparison"],
                    "config": {
                        "operator": {"type": "select", "options": [">", "<", "=", ">=", "<=", "!="], "required": True}
                    }
                }
            ]
        },
        "risk_management": {
            "name": "Risk Management",
            "description": "Position sizing and risk control",
            "nodes": [
                {
                    "type": "PositionSizer",
                    "name": "Position Sizer",
                    "description": "Calculate lot size based on risk percentage",
                    "inputs": ["stop_loss_pips", "account_balance"],
                    "outputs": ["lot_size", "risk_amount", "position_value"],
                    "config": {
                        "risk_percentage": {"type": "number", "default": 1.0, "required": False},
                        "symbol": {"type": "string", "default": "EURUSD", "required": False}
                    }
                },
                {
                    "type": "RiskRewardCalculator",
                    "name": "Risk/Reward Calculator",
                    "description": "Calculate R:R ratio for a trade",
                    "inputs": ["entry_price", "stop_loss", "take_profit"],
                    "outputs": ["risk_reward_ratio", "risk_pips", "reward_pips", "recommendation"],
                    "config": {
                        "min_rr_ratio": {"type": "number", "default": 2.0, "required": False}
                    }
                },
                {
                    "type": "DrawdownMonitor",
                    "name": "Drawdown Monitor",
                    "description": "Monitor account drawdown",
                    "inputs": ["peak_equity", "current_equity"],
                    "outputs": ["current_drawdown", "is_critical", "status"],
                    "config": {
                        "max_drawdown_percentage": {"type": "number", "default": 10.0, "required": False},
                        "alert_threshold": {"type": "number", "default": 5.0, "required": False}
                    }
                },
                {
                    "type": "DailyLossLimit",
                    "name": "Daily Loss Limit",
                    "description": "Check if daily loss limit reached",
                    "inputs": ["daily_pnl"],
                    "outputs": ["can_trade", "limit_reached", "status"],
                    "config": {
                        "daily_loss_limit": {"type": "number", "default": 100, "required": False},
                        "daily_loss_percentage": {"type": "number", "default": 2.0, "required": False}
                    }
                },
                {
                    "type": "MaxPositions",
                    "name": "Max Positions Check",
                    "description": "Check if max positions limit reached",
                    "inputs": [],
                    "outputs": ["can_open_position", "current_positions", "limit_reached"],
                    "config": {
                        "max_positions": {"type": "number", "default": 5, "required": False},
                        "max_per_symbol": {"type": "number", "default": 2, "required": False},
                        "symbol": {"type": "string", "required": False}
                    }
                },
                {
                    "type": "SmartRiskManager",
                    "name": "Smart Risk Manager",
                    "description": "Adjust risk based on performance (Kelly Criterion)",
                    "inputs": ["win_rate", "avg_win_loss", "account_balance"],
                    "outputs": ["adjusted_risk", "kelly_fraction", "risk_multiplier"],
                    "config": {
                        "base_risk": {"type": "number", "default": 1.0, "required": False},
                        "max_risk": {"type": "number", "default": 3.0, "required": False},
                        "aggressiveness": {"type": "number", "default": 0.5, "required": False}
                    }
                }
            ]
        },
        "news": {
            "name": "News & Sentiment",
            "description": "Market news and AI sentiment analysis",
            "nodes": [
                {
                    "type": "NewsFetch",
                    "name": "Fetch News",
                    "description": "Fetch recent market news headlines",
                    "inputs": [],
                    "outputs": ["headlines", "count"],
                    "config": {
                        "symbol": {"type": "string", "default": "EURUSD", "required": False},
                        "limit": {"type": "number", "default": 5, "required": False},
                        "api_key": {"type": "string", "required": False}
                    }
                },
                {
                    "type": "SentimentAnalysis",
                    "name": "Sentiment Analysis",
                    "description": "Analyze news sentiment using AI",
                    "inputs": ["headlines"],
                    "outputs": ["sentiment_score", "sentiment_label", "analysis"],
                    "config": {}
                }
            ]
        },
        "memory": {
            "name": "Persistence & Memory",
            "description": "Store and retrieve data across executions",
            "nodes": [
                {
                    "type": "SetState",
                    "name": "Store Memory",
                    "description": "Save a value to workflow memory",
                    "inputs": ["value"],
                    "outputs": ["success", "key", "value"],
                    "config": {
                        "key": {"type": "string", "required": True},
                        "value": {"type": "string", "required": False}
                    }
                },
                {
                    "type": "GetState",
                    "name": "Recall Memory",
                    "description": "Retrieve a value from workflow memory",
                    "inputs": [],
                    "outputs": ["value", "exists"],
                    "config": {
                        "key": {"type": "string", "required": True},
                        "default_value": {"type": "string", "required": False}
                    }
                }
            ]
        },
        "orders": {
            "name": "Order Execution",
            "description": "Execute and manage trades",
            "nodes": [
                {
                    "type": "MarketOrder",
                    "name": "Market Order",
                    "description": "Place a market order",
                    "inputs": ["symbol", "volume"],
                    "outputs": ["ticket", "price", "status"],
                    "config": {
                        "action": {"type": "select", "options": ["BUY", "SELL"], "required": True},
                        "symbol": {"type": "string", "default": "EURUSD", "required": True},
                        "volume": {"type": "number", "default": 0.01, "required": True},
                        "stop_loss": {"type": "number", "required": False},
                        "take_profit": {"type": "number", "required": False}
                    }
                },
                {
                    "type": "ClosePosition",
                    "name": "Close Position",
                    "description": "Close an open position",
                    "inputs": ["ticket"],
                    "outputs": ["status", "profit"],
                    "config": {
                        "ticket": {"type": "number", "required": True}
                    }
                }
            ]
        },
        "notifications": {
            "name": "Notifications",
            "description": "Send alerts and notifications",
            "nodes": [
                {
                    "type": "DashboardNotification",
                    "name": "Dashboard Notification",
                    "description": "Send notification to dashboard",
                    "inputs": ["message"],
                    "outputs": ["notification_id", "status"],
                    "config": {
                        "title": {"type": "string", "required": True},
                        "message": {"type": "string", "required": True},
                        "type": {"type": "select", "options": ["info", "success", "warning", "error"], "default": "info"}
                    }
                }
            ]
        }
    }
    
    # Count total nodes
    total_nodes = sum(len(category["nodes"]) for category in node_categories.values())
    
    return {
        "total_nodes": total_nodes,
        "categories": node_categories,
        "registry": list(NODE_REGISTRY.keys())
    }


@router.get("/types/{node_type}")
async def get_node_schema(node_type: str) -> Dict[str, Any]:
    """
    Get detailed schema for a specific node type
    
    Args:
        node_type: The node type (e.g., 'RSI', 'MACD')
    
    Returns:
        Node schema with inputs, outputs, and configuration
    """
    if node_type not in NODE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Node type '{node_type}' not found")
    
    node_class = NODE_REGISTRY[node_type]
    
    # Create a temporary instance to get schema info
    temp_node = node_class(node_id="temp", config={})
    
    return {
        "type": node_type,
        "class_name": node_class.__name__,
        "required_inputs": temp_node.get_required_inputs(),
        "outputs": temp_node.get_outputs(),
        "description": node_class.__doc__ or "No description available"
    }


@router.post("/test")
async def test_node(
    node_type: str,
    config: Dict[str, Any],
    input_data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Test a node execution without saving to database
    
    Args:
        node_type: The node type to test
        config: Node configuration
        input_data: Input data for the node
    
    Returns:
        Execution result
    """
    if node_type not in NODE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Node type '{node_type}' not found")
    
    node_class = NODE_REGISTRY[node_type]
    node = node_class(node_id="test", config=config)
    
    try:
        result = await node.run(input_data)
        return {
            "success": result['success'],
            "output": result['output'],
            "error": result.get('error'),
            "execution_time_ms": result['execution_time_ms']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
