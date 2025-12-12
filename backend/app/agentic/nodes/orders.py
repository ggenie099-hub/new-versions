"""
Order execution nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from app.mt5_handler import mt5_handler


class MarketOrderNode(BaseNode):
    """Place a market order"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Get configuration
        symbol = self.config.get('symbol', input_data.get('symbol') if input_data else 'EURUSD')
        order_type = self.config.get('order_type', 'BUY')
        volume = float(self.config.get('volume', 0.01))
        stop_loss = self.config.get('stop_loss')
        take_profit = self.config.get('take_profit')
        comment = self.config.get('comment', 'Agentic Workflow')
        
        # Convert stop_loss and take_profit to float if provided
        if stop_loss:
            stop_loss = float(stop_loss)
        if take_profit:
            take_profit = float(take_profit)
        
        # Place order
        success, order_result, error = await mt5_handler.place_order(
            symbol=symbol,
            order_type=order_type,
            volume=volume,
            stop_loss=stop_loss,
            take_profit=take_profit,
            comment=comment
        )
        
        if not success:
            raise Exception(f"Order failed: {error}")
        
        return {
            'success': True,
            'ticket': order_result['ticket'],
            'symbol': symbol,
            'order_type': order_type,
            'volume': volume,
            'price': order_result['price'],
            'stop_loss': stop_loss,
            'take_profit': take_profit
        }
    
    def get_required_inputs(self) -> list:
        return []  # Can work standalone or with input
    
    def get_outputs(self) -> list:
        return ['success', 'ticket', 'symbol', 'order_type', 'volume', 'price', 'stop_loss', 'take_profit']


class ClosePositionNode(BaseNode):
    """Close an open position"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Get ticket from config or input
        ticket = self.config.get('ticket')
        if not ticket and input_data:
            ticket = input_data.get('ticket')
        
        if not ticket:
            raise Exception("No ticket provided to close")
        
        # Close position
        success, error = await mt5_handler.close_position(int(ticket))
        
        if not success:
            raise Exception(f"Failed to close position: {error}")
        
        return {
            'success': True,
            'ticket': ticket,
            'message': 'Position closed successfully'
        }
    
    def get_required_inputs(self) -> list:
        return ['ticket']
    
    def get_outputs(self) -> list:
        return ['success', 'ticket', 'message']
