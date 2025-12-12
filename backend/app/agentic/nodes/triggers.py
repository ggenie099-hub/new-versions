"""
Trigger Nodes - Start workflow execution based on conditions
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from datetime import datetime


class ScheduleTriggerNode(BaseNode):
    """Trigger workflow on a schedule (cron)"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Schedule trigger - This node is evaluated by the scheduler
        
        Config:
            cron_expression: Cron expression (e.g., "0 9 * * *" for 9 AM daily)
            timezone: Timezone (default: UTC)
        
        Output:
            triggered_at: Timestamp when triggered
            cron_expression: The cron expression used
        """
        cron_expression = self.config.get('cron_expression', '0 9 * * *')
        timezone = self.config.get('timezone', 'UTC')
        
        return {
            'triggered_at': datetime.utcnow().isoformat(),
            'cron_expression': cron_expression,
            'timezone': timezone,
            'trigger_type': 'schedule'
        }
    
    def get_outputs(self) -> list:
        return ['triggered_at', 'cron_expression', 'timezone', 'trigger_type']


class PriceTriggerNode(BaseNode):
    """Trigger workflow when price condition is met"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Price trigger - Evaluated by scheduler
        
        Config:
            symbol: Trading symbol (e.g., EURUSD)
            condition: Price condition (e.g., "price > 1.10")
            check_interval: How often to check (minutes)
        
        Output:
            triggered_at: When condition was met
            symbol: Symbol that triggered
            current_price: Price when triggered
            condition: The condition that was met
        """
        symbol = self.config.get('symbol', 'EURUSD')
        condition = self.config.get('condition', 'price > 0')
        
        # Get current price from input (set by scheduler)
        current_price = input_data.get('current_price', 0) if input_data else 0
        
        return {
            'triggered_at': datetime.utcnow().isoformat(),
            'symbol': symbol,
            'current_price': current_price,
            'condition': condition,
            'trigger_type': 'price'
        }
    
    def get_outputs(self) -> list:
        return ['triggered_at', 'symbol', 'current_price', 'condition', 'trigger_type']


class IndicatorTriggerNode(BaseNode):
    """Trigger workflow when indicator condition is met"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Indicator trigger - Evaluated by scheduler
        
        Config:
            indicator: Indicator type (RSI, MACD, etc.)
            condition: Indicator condition (e.g., "RSI < 30")
            symbol: Trading symbol
            timeframe: Chart timeframe
        
        Output:
            triggered_at: When condition was met
            indicator: Indicator that triggered
            indicator_value: Value when triggered
            condition: The condition that was met
        """
        indicator = self.config.get('indicator', 'RSI')
        condition = self.config.get('condition', 'value < 30')
        symbol = self.config.get('symbol', 'EURUSD')
        timeframe = self.config.get('timeframe', 'H1')
        
        # Get indicator value from input (set by scheduler)
        indicator_value = input_data.get('indicator_value', 0) if input_data else 0
        
        return {
            'triggered_at': datetime.utcnow().isoformat(),
            'indicator': indicator,
            'indicator_value': indicator_value,
            'condition': condition,
            'symbol': symbol,
            'timeframe': timeframe,
            'trigger_type': 'indicator'
        }
    
    def get_outputs(self) -> list:
        return ['triggered_at', 'indicator', 'indicator_value', 'condition', 'trigger_type']


class TimeTriggerNode(BaseNode):
    """Trigger workflow at regular time intervals"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Time trigger - Run every X minutes
        
        Config:
            interval_minutes: Interval in minutes (e.g., 5, 15, 60)
        
        Output:
            triggered_at: When triggered
            interval_minutes: The interval used
        """
        interval_minutes = self.config.get('interval_minutes', 60)
        
        return {
            'triggered_at': datetime.utcnow().isoformat(),
            'interval_minutes': interval_minutes,
            'trigger_type': 'time'
        }
    
    def get_outputs(self) -> list:
        return ['triggered_at', 'interval_minutes', 'trigger_type']


class WebhookTriggerNode(BaseNode):
    """Trigger workflow via external webhook"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Webhook trigger - Triggered by external HTTP request
        
        Config:
            webhook_url: Unique webhook URL
            secret_key: Optional secret for validation
        
        Input:
            webhook_data: Data received from webhook
        
        Output:
            triggered_at: When webhook was received
            webhook_data: Data from webhook
        """
        webhook_url = self.config.get('webhook_url', '')
        
        # Get webhook data from input
        webhook_data = input_data.get('webhook_data', {}) if input_data else {}
        
        return {
            'triggered_at': datetime.utcnow().isoformat(),
            'webhook_url': webhook_url,
            'webhook_data': webhook_data,
            'trigger_type': 'webhook'
        }
    
    def get_outputs(self) -> list:
        return ['triggered_at', 'webhook_url', 'webhook_data', 'trigger_type']


class ManualTriggerNode(BaseNode):
    """Manual trigger - User clicks execute button"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Manual trigger - Executed by user action
        
        Output:
            triggered_at: When manually triggered
            triggered_by: User who triggered
        """
        triggered_by = self.config.get('user_id', 'unknown')
        
        return {
            'triggered_at': datetime.utcnow().isoformat(),
            'triggered_by': triggered_by,
            'trigger_type': 'manual'
        }
    
    def get_outputs(self) -> list:
        return ['triggered_at', 'triggered_by', 'trigger_type']
