import MetaTrader5 as mt5
from typing import Optional, Dict, List, Tuple
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor


class MT5Handler:
    """Handles all MT5 operations with thread-safe async wrappers"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.connections: Dict[int, bool] = {}
    
    async def initialize(self) -> bool:
        """Initialize MT5 terminal"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, mt5.initialize)
    
    async def shutdown(self):
        """Shutdown MT5 terminal"""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self.executor, mt5.shutdown)
    
    async def login(self, account: int, password: str, server: str) -> Tuple[bool, Optional[str]]:
        """Login to MT5 account"""
        loop = asyncio.get_event_loop()
        
        def _login():
            if not mt5.initialize():
                return False, "MT5 initialization failed"
            
            authorized = mt5.login(account, password=password, server=server)
            if authorized:
                return True, None
            else:
                error = mt5.last_error()
                return False, f"Login failed: {error}"
        
        return await loop.run_in_executor(self.executor, _login)
    
    async def get_account_info(self) -> Optional[Dict]:
        """Get account information"""
        loop = asyncio.get_event_loop()
        
        def _get_info():
            account_info = mt5.account_info()
            if account_info is None:
                return None
            
            return {
                "balance": account_info.balance,
                "equity": account_info.equity,
                "margin": account_info.margin,
                "free_margin": account_info.margin_free,
                "margin_level": account_info.margin_level,
                "profit": account_info.profit,
                "leverage": account_info.leverage,
                "currency": account_info.currency,
            }
        
        return await loop.run_in_executor(self.executor, _get_info)
    
    async def get_symbol_info(self, symbol: str) -> Optional[Dict]:
        """Get symbol information"""
        loop = asyncio.get_event_loop()
        
        def _get_symbol():
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                return None
            
            return {
                "bid": symbol_info.bid,
                "ask": symbol_info.ask,
                "last": symbol_info.last,
                "volume": symbol_info.volume_real,
            }
        
        return await loop.run_in_executor(self.executor, _get_symbol)
    
    async def get_symbols(self) -> List[str]:
        """Get all available symbols"""
        loop = asyncio.get_event_loop()
        
        def _get_symbols():
            symbols = mt5.symbols_get()
            if symbols is None:
                return []
            return [symbol.name for symbol in symbols]
        
        return await loop.run_in_executor(self.executor, _get_symbols)
    
    async def search_symbols(self, query: str) -> List[Dict]:
        """Search symbols by query"""
        loop = asyncio.get_event_loop()
        
        def _search():
            symbols = mt5.symbols_get()
            if symbols is None:
                return []
            
            results = []
            query_lower = query.lower()
            for symbol in symbols:
                if query_lower in symbol.name.lower() or query_lower in symbol.description.lower():
                    results.append({
                        "symbol": symbol.name,
                        "description": symbol.description,
                        "type": symbol.path,
                        "exchange": symbol.path.split("\\")[0] if "\\" in symbol.path else None
                    })
            
            return results[:50]  # Limit to 50 results
        
        return await loop.run_in_executor(self.executor, _search)
    
    async def place_order(
        self,
        symbol: str,
        order_type: str,
        volume: float,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        comment: str = "Trading Maven"
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Place a market order"""
        loop = asyncio.get_event_loop()
        
        def _place_order():
            # Get current price
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                return False, None, f"Symbol {symbol} not found"
            
            if not symbol_info.visible:
                if not mt5.symbol_select(symbol, True):
                    return False, None, f"Failed to select symbol {symbol}"
            
            # Determine order type
            if order_type.upper() == "BUY":
                trade_type = mt5.ORDER_TYPE_BUY
                price = symbol_info.ask
            elif order_type.upper() == "SELL":
                trade_type = mt5.ORDER_TYPE_SELL
                price = symbol_info.bid
            else:
                return False, None, f"Invalid order type: {order_type}"
            
            # Prepare request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": volume,
                "type": trade_type,
                "price": price,
                "deviation": 20,
                "magic": 234000,
                "comment": comment,
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            if stop_loss:
                request["sl"] = stop_loss
            if take_profit:
                request["tp"] = take_profit
            
            # Send order
            result = mt5.order_send(request)
            
            if result is None:
                return False, None, "Order send failed"
            
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                return False, None, f"Order failed: {result.comment}"
            
            return True, {
                "ticket": result.order,
                "volume": result.volume,
                "price": result.price,
                "bid": result.bid,
                "ask": result.ask,
                "comment": result.comment,
            }, None
        
        return await loop.run_in_executor(self.executor, _place_order)
    
    async def close_position(self, ticket: int) -> Tuple[bool, Optional[str]]:
        """Close an open position"""
        loop = asyncio.get_event_loop()
        
        def _close():
            # Get position
            position = mt5.positions_get(ticket=ticket)
            if position is None or len(position) == 0:
                return False, "Position not found"
            
            position = position[0]
            
            # Determine close type
            if position.type == mt5.ORDER_TYPE_BUY:
                trade_type = mt5.ORDER_TYPE_SELL
                price = mt5.symbol_info(position.symbol).bid
            else:
                trade_type = mt5.ORDER_TYPE_BUY
                price = mt5.symbol_info(position.symbol).ask
            
            # Prepare request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": position.symbol,
                "volume": position.volume,
                "type": trade_type,
                "position": ticket,
                "price": price,
                "deviation": 20,
                "magic": 234000,
                "comment": "Close by TradingBridge",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            result = mt5.order_send(request)
            
            if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
                return False, f"Close failed: {result.comment if result else 'Unknown error'}"
            
            return True, None
        
        return await loop.run_in_executor(self.executor, _close)
    
    async def get_open_positions(self) -> List[Dict]:
        """Get all open positions"""
        loop = asyncio.get_event_loop()
        
        def _get_positions():
            positions = mt5.positions_get()
            if positions is None:
                return []
            
            result = []
            for pos in positions:
                result.append({
                    "ticket": pos.ticket,
                    "symbol": pos.symbol,
                    "type": "BUY" if pos.type == mt5.ORDER_TYPE_BUY else "SELL",
                    "volume": pos.volume,
                    "open_price": pos.price_open,
                    "current_price": pos.price_current,
                    "stop_loss": pos.sl,
                    "take_profit": pos.tp,
                    "profit": pos.profit,
                    "swap": pos.swap,
                    "commission": pos.commission,
                    "open_time": datetime.fromtimestamp(pos.time),
                    "comment": pos.comment,
                })
            
            return result
        
        return await loop.run_in_executor(self.executor, _get_positions)
    
    async def get_trade_history(self, days: int = 30) -> List[Dict]:
        """Get trade history"""
        loop = asyncio.get_event_loop()
        
        def _get_history():
            from datetime import timedelta
            from_date = datetime.now() - timedelta(days=days)
            
            deals = mt5.history_deals_get(from_date, datetime.now())
            if deals is None:
                return []
            
            result = []
            for deal in deals:
                if deal.entry == mt5.DEAL_ENTRY_IN or deal.entry == mt5.DEAL_ENTRY_OUT:
                    result.append({
                        "ticket": deal.ticket,
                        "order": deal.order,
                        "symbol": deal.symbol,
                        "type": "BUY" if deal.type == mt5.ORDER_TYPE_BUY else "SELL",
                        "volume": deal.volume,
                        "price": deal.price,
                        "profit": deal.profit,
                        "commission": deal.commission,
                        "swap": deal.swap,
                        "time": datetime.fromtimestamp(deal.time),
                        "comment": deal.comment,
                    })
            
            return result
        
        return await loop.run_in_executor(self.executor, _get_history)


# Global MT5 handler instance
mt5_handler = MT5Handler()