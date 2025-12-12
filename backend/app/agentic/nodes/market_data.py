"""
Market data nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from app.mt5_handler import mt5_handler


class GetLivePriceNode(BaseNode):
    """Get current market price for a symbol"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        symbol = self.config.get('symbol', 'EURUSD')
        
        # Initialize MT5 if needed
        await mt5_handler.initialize()
        
        # Get symbol info
        symbol_info = await mt5_handler.get_symbol_info(symbol)
        
        if not symbol_info:
            raise Exception(f"Failed to get price for {symbol}")
        
        return {
            'symbol': symbol,
            'bid': symbol_info['bid'],
            'ask': symbol_info['ask'],
            'last': symbol_info['last'],
            'volume': symbol_info['volume'],
        }
    
    def get_outputs(self) -> list:
        return ['symbol', 'bid', 'ask', 'last', 'volume']


class GetAccountInfoNode(BaseNode):
    """Get MT5 account information"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Get account info from MT5
        account_info = await mt5_handler.get_account_info()
        
        if not account_info:
            raise Exception("Failed to get account info")
        
        return account_info
    
    def get_outputs(self) -> list:
        return ['balance', 'equity', 'margin', 'free_margin', 'margin_level', 'profit', 'leverage', 'currency']


class GetHistoricalDataNode(BaseNode):
    """Get historical price data"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        symbol = self.config.get('symbol', 'EURUSD')
        timeframe = self.config.get('timeframe', 'H1')
        bars = self.config.get('bars', 100)
        
        # Note: This is a placeholder - you'll need to implement historical data fetching
        # For now, return current price as a single bar
        symbol_info = await mt5_handler.get_symbol_info(symbol)
        
        return {
            'symbol': symbol,
            'timeframe': timeframe,
            'bars': bars,
            'data': [symbol_info] if symbol_info else []
        }
    
    def get_outputs(self) -> list:
        return ['symbol', 'timeframe', 'bars', 'data']
