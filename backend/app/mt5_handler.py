import MetaTrader5 as mt5
from typing import Optional, Dict, List, Tuple
from datetime import datetime
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor


logger = logging.getLogger(__name__)


class MT5Handler:
    """Handles all MT5 operations with thread-safe async wrappers"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.connections: Dict[int, bool] = {}
    
    def _format_last_error(self) -> str:
        try:
            err = mt5.last_error()
            if isinstance(err, tuple) and len(err) >= 2:
                return f"[{err[0]}] {err[1]}"
            return str(err)
        except Exception as e:
            return f"Unknown error: {e}"

    async def initialize(self) -> bool:
        """Initialize MT5 terminal with error logging"""
        loop = asyncio.get_event_loop()

        def _init():
            try:
                # Check if already initialized and connected
                terminal_info = mt5.terminal_info()
                if terminal_info is not None:
                    return True
                
                ok = mt5.initialize()
                if not ok:
                    logger.error("MT5 initialize failed: %s", self._format_last_error())
                else:
                    info = mt5.terminal_info()
                    logger.info("MT5 initialized. Terminal: %s", info)
                return ok
            except Exception as e:
                logger.exception("Exception during MT5 initialize: %s", e)
                return False

        return await loop.run_in_executor(self.executor, _init)
    
    async def shutdown(self):
        """Shutdown MT5 terminal"""
        loop = asyncio.get_event_loop()

        def _shutdown():
            try:
                mt5.shutdown()
                logger.info("MT5 terminal shutdown.")
            except Exception as e:
                logger.exception("Exception during MT5 shutdown: %s", e)

        await loop.run_in_executor(self.executor, _shutdown)
    
    async def login(self, account: int, password: str, server: str) -> Tuple[bool, Optional[str]]:
        """Login to MT5 account with robust error reporting"""
        loop = asyncio.get_event_loop()

        def _login():
            try:
                # Always try to initialize first
                if not mt5.initialize():
                    msg = f"MT5 initialization failed: {self._format_last_error()}"
                    logger.error(msg)
                    return False, msg

                # Check if already logged in to this exact account
                acc_info = mt5.account_info()
                if acc_info is not None and acc_info.login == account and server.lower() in acc_info.server.lower():
                    logger.info("Already logged in to account %s", account)
                    return True, None

                authorized = mt5.login(account, password=password, server=server)
                if authorized:
                    logger.info("MT5 login succeeded for account %s on server %s", account, server)
                    return True, None
                else:
                    err = self._format_last_error()
                    info = mt5.terminal_info()
                    msg = f"Login failed for account {account} on server {server}: {err}. Terminal: {info}"
                    logger.error(msg)
                    return False, msg
            except Exception as e:
                logger.exception("Exception during MT5 login for account %s: %s", account, e)
                return False, f"Exception during login: {e}"

        return await loop.run_in_executor(self.executor, _login)
    
    async def get_account_info(self) -> Optional[Dict]:
        """Get account information with error logging"""
        loop = asyncio.get_event_loop()

        def _get_info():
            try:
                # Verify terminal is still initialized
                if mt5.terminal_info() is None:
                    if not mt5.initialize():
                        logger.error("MT5 not initialized and automatic re-init failed.")
                        return None

                account_info = mt5.account_info()
                if account_info is None:
                    logger.error("MT5 account_info returned None. Last error: %s", self._format_last_error())
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
                    "login": account_info.login,
                    "server": account_info.server
                }
            except Exception as e:
                logger.exception("Exception during account_info retrieval: %s", e)
                return None

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
            # Ensure terminal is initialized
            if mt5.terminal_info() is None:
                logger.info("MT5 NOT INITIALIZED during place_order. Attempting to initialize...")
                if not mt5.initialize():
                    logger.error("MT5 initialization failed in place_order: %s", self._format_last_error())
                    return False, None, f"MT5 initialization failed: {self._format_last_error()}"

            # Log order details
            logger.info("Placing %s order for %s: volume=%s, sl=%s, tp=%s", order_type, symbol, volume, stop_loss, take_profit)

            # Get current price
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                logger.error("Symbol info failed for %s: %s", symbol, self._format_last_error())
                return False, None, f"Symbol {symbol} not found: {self._format_last_error()}"
            
            if not symbol_info.visible:
                logger.info("Symbol %s not visible, selecting it...", symbol)
                if not mt5.symbol_select(symbol, True):
                    logger.error("Failed to select symbol %s: %s", symbol, self._format_last_error())
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
            
            # Determine filling mode based on symbol
            filling_type = symbol_info.filling_mode
            logger.info("Symbol %s filling_mode: %s", symbol, filling_type)
            
            # Try different filling modes in order of preference
            filling_modes = []
            if filling_type & 1:  # FOK
                filling_modes.append(mt5.ORDER_FILLING_FOK)
            if filling_type & 2:  # IOC
                filling_modes.append(mt5.ORDER_FILLING_IOC)
            if filling_type & 4:  # RETURN
                filling_modes.append(mt5.ORDER_FILLING_RETURN)
            
            # Default to FOK if none specified
            if not filling_modes:
                logger.warning("No filling modes detected for %s, trying defaults", symbol)
                filling_modes = [mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_RETURN]
            
            # Try each filling mode
            last_error = None
            for filling_mode in filling_modes:
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
                    "type_filling": filling_mode,
                }
                
                if stop_loss:
                    request["sl"] = stop_loss
                if take_profit:
                    request["tp"] = take_profit
                
                logger.info("Sending order request: %s", request)
                # Send order
                result = mt5.order_send(request)
                
                if result is None:
                    last_error = f"Order send failed (result is None). Last error: {self._format_last_error()}"
                    logger.error(last_error)
                    continue
                
                if result.retcode == mt5.TRADE_RETCODE_DONE:
                    # Success!
                    logger.info("Order placed successfully! Ticket: %s", result.order)
                    return True, {
                        "ticket": result.order,
                        "volume": result.volume,
                        "price": result.price,
                        "bid": result.bid,
                        "ask": result.ask,
                        "comment": result.comment,
                    }, None
                
                # If unsupported filling mode, try next one
                if result.retcode == mt5.TRADE_RETCODE_INVALID_FILL:
                    logger.warning("Filling mode %s not supported for %s", filling_mode, symbol)
                    last_error = f"Filling mode {filling_mode} not supported"
                    continue
                
                # Other error, return immediately
                last_error = f"Order failed [retcode={result.retcode}]: {result.comment}"
                logger.error(last_error)
                break
            
            # All filling modes failed
            logger.error("All filling modes failed for %s. Last error: %s", symbol, last_error)
            return False, None, last_error or "Order failed with all filling modes"
            
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
                    "price_open": pos.price_open,
                    "price_current": pos.price_current,
                    "stop_loss": pos.sl,
                    "take_profit": pos.tp,
                    "profit": pos.profit,
                    "swap": getattr(pos, 'swap', 0.0),
                    "commission": getattr(pos, 'commission', 0.0),
                    "open_time": datetime.fromtimestamp(pos.time),
                    "comment": getattr(pos, 'comment', ''),
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
                        "commission": getattr(deal, 'commission', 0.0),
                        "swap": getattr(deal, 'swap', 0.0),
                        "time": datetime.fromtimestamp(deal.time),
                        "comment": getattr(deal, 'comment', ''),
                    })
            
            return result
        
        return await loop.run_in_executor(self.executor, _get_history)


# Global MT5 handler instance
mt5_handler = MT5Handler()
