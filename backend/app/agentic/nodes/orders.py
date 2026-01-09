"""
Order execution nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from app.mt5_handler import mt5_handler
import MetaTrader5 as mt5


class MarketOrderNode(BaseNode):
    """Place a market order"""
    
    def _get_pip_value(self, symbol: str) -> float:
        """Get pip value for a symbol (0.0001 for most pairs, 0.01 for JPY pairs)"""
        if 'JPY' in symbol.upper():
            return 0.01
        return 0.0001
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Get configuration
        symbol = self.config.get('symbol', input_data.get('symbol') if input_data else 'EURUSD')
        order_type = self.config.get('order_type', 'BUY')
        volume = float(self.config.get('volume', 0.01))
        stop_loss_pips = self.config.get('stop_loss')
        take_profit_pips = self.config.get('take_profit')
        comment = self.config.get('comment', 'Agentic Workflow')
        
        # Support test mode
        test_mode = self.context.get('test_mode', False)
        print(f"DEBUG: MarketOrderNode.execute - symbol={symbol}, type={order_type}, volume={volume}, test_mode={test_mode}")
        
        # Get current price to calculate SL/TP levels
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            # Try to select the symbol first
            mt5.symbol_select(symbol, True)
            symbol_info = mt5.symbol_info(symbol)
        
        if symbol_info is None:
            raise Exception(f"Cannot get symbol info for {symbol}")
        
        current_price = symbol_info.ask if order_type.upper() == 'BUY' else symbol_info.bid
        pip_value = self._get_pip_value(symbol)
        
        # Convert pips to actual price levels
        stop_loss = None
        take_profit = None
        
        if stop_loss_pips:
            sl_pips = float(stop_loss_pips)
            if order_type.upper() == 'BUY':
                stop_loss = round(current_price - (sl_pips * pip_value), 5)
            else:
                stop_loss = round(current_price + (sl_pips * pip_value), 5)
            print(f"DEBUG: SL calculated: {sl_pips} pips = {stop_loss} price")
        
        if take_profit_pips:
            tp_pips = float(take_profit_pips)
            if order_type.upper() == 'BUY':
                take_profit = round(current_price + (tp_pips * pip_value), 5)
            else:
                take_profit = round(current_price - (tp_pips * pip_value), 5)
            print(f"DEBUG: TP calculated: {tp_pips} pips = {take_profit} price")
        
        print(f"DEBUG: Current price: {current_price}, SL: {stop_loss}, TP: {take_profit}")
        
        if test_mode:
            print(f"DEBUG: MarketOrderNode - Simulating order (test_mode=True)")
            return {
                'success': True,
                'ticket': 12345678,
                'symbol': symbol,
                'order_type': order_type,
                'volume': volume,
                'price': current_price,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'message': '[TEST MODE] Order placement simulated'
            }
        
        # Place order
        print(f"DEBUG: MarketOrderNode - Calling mt5_handler.place_order for {symbol}")
        success, order_result, error = await mt5_handler.place_order(
            symbol=symbol,
            order_type=order_type,
            volume=volume,
            stop_loss=stop_loss,
            take_profit=take_profit,
            comment=comment
        )
        
        if not success:
            print(f"DEBUG: MarketOrderNode - Order failed: {error}")
            raise Exception(f"Order failed: {error}")
        
        print(f"DEBUG: MarketOrderNode - Order successful: {order_result['ticket']}")
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
