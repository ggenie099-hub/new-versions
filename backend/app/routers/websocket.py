from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Set
import json
import asyncio
from datetime import datetime
from app.database import get_db
from app.models import User, Trade, Notification, MT5Account
from app.dependencies import get_user_by_api_key
from app.mt5_handler import mt5_handler
from app.security import encryption_handler

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Remove disconnected websockets
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast(self, message: dict):
        for user_id in self.active_connections:
            await self.send_personal_message(message, user_id)


manager = ConnectionManager()


@router.websocket("/ws/{user_id}/{token}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint for real-time trading"""
    
    # Verify connection (basic token check - in production, implement proper verification)
    user = None
    try:
        await manager.connect(websocket, user_id)
        
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Connected to Trading Maven",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        while True:
            # Receive message
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
                continue
            
            # Verify API key
            api_key = message.get("api_key")
            if not api_key:
                await websocket.send_json({
                    "type": "error",
                    "message": "API key is required"
                })
                continue
            
            user = await get_user_by_api_key(api_key, db)
            if not user or user.id != user_id:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid API key"
                })
                continue
            
            # Process action
            action = message.get("action", "").upper()
            
            if action in ["BUY", "SELL"]:
                await handle_trade_action(websocket, message, user, db)
            elif action == "CLOSE":
                await handle_close_action(websocket, message, user, db)
            elif action == "SYNC":
                await handle_sync_action(websocket, user, db)
            elif action == "PING":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown action: {action}"
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        print(f"User {user_id} disconnected")
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        manager.disconnect(websocket, user_id)


async def handle_trade_action(websocket: WebSocket, message: dict, user: User, db: AsyncSession):
    """Handle BUY/SELL trade actions"""
    
    try:
        symbol = message.get("symbol")
        action = message.get("action")
        volume = float(message.get("volume", 0.01))
        stop_loss = float(message["stop_loss"]) if message.get("stop_loss") else None
        take_profit = float(message["take_profit"]) if message.get("take_profit") else None
        
        if not symbol or not action:
            await websocket.send_json({
                "type": "error",
                "message": "Symbol and action are required"
            })
            return
        
        # Get user's connected MT5 account
        from sqlalchemy import select
        result = await db.execute(
            select(MT5Account).filter(
                MT5Account.user_id == user.id,
                MT5Account.is_connected == True
            ).limit(1)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            await websocket.send_json({
                "type": "error",
                "message": "No connected MT5 account found"
            })
            return
        
        # Ensure MT5 is logged in
        password = encryption_handler.decrypt(account.encrypted_password)
        await mt5_handler.initialize()
        await mt5_handler.login(int(account.account_number), password, account.server)
        
        # Place order
        success, order_result, error = await mt5_handler.place_order(
            symbol=symbol,
            order_type=action,
            volume=volume,
            stop_loss=stop_loss,
            take_profit=take_profit,
            comment="WebSocket Trade"
        )
        
        if not success:
            await websocket.send_json({
                "type": "error",
                "action": "trade_failed",
                "message": error,
                "symbol": symbol
            })
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                title="Trade Failed",
                message=f"Failed to place {action} order for {symbol}: {error}",
                type="error"
            )
            db.add(notification)
            await db.commit()
            return
        
        # Create trade record
        new_trade = Trade(
            user_id=user.id,
            mt5_ticket=str(order_result["ticket"]),
            symbol=symbol,
            order_type=action,
            volume=volume,
            open_price=order_result["price"],
            stop_loss=stop_loss,
            take_profit=take_profit,
            comment="WebSocket Trade",
            status="OPEN"
        )
        db.add(new_trade)
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            title="Trade Executed",
            message=f"{action} order for {symbol} executed at {order_result['price']}",
            type="success"
        )
        db.add(notification)
        
        await db.commit()
        await db.refresh(new_trade)
        
        # Send success response
        await websocket.send_json({
            "type": "success",
            "action": "trade_executed",
            "trade": {
                "id": new_trade.id,
                "ticket": order_result["ticket"],
                "symbol": symbol,
                "type": action,
                "volume": volume,
                "price": order_result["price"],
                "stop_loss": stop_loss,
                "take_profit": take_profit
            },
            "timestamp": datetime.utcnow().isoformat()
        })
    
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"Trade execution error: {str(e)}"
        })


async def handle_close_action(websocket: WebSocket, message: dict, user: User, db: AsyncSession):
    """Handle CLOSE action"""
    
    try:
        symbol = message.get("symbol")
        ticket = message.get("ticket")
        
        if not symbol and not ticket:
            await websocket.send_json({
                "type": "error",
                "message": "Symbol or ticket is required to close position"
            })
            return
        
        # Get trade
        from sqlalchemy import select
        query = select(Trade).filter(Trade.user_id == user.id, Trade.status == "OPEN")
        
        if ticket:
            query = query.filter(Trade.mt5_ticket == str(ticket))
        elif symbol:
            query = query.filter(Trade.symbol == symbol)
        
        result = await db.execute(query.limit(1))
        trade = result.scalar_one_or_none()
        
        if not trade:
            await websocket.send_json({
                "type": "error",
                "message": "No open trade found"
            })
            return
        
        # Close position
        success, error = await mt5_handler.close_position(int(trade.mt5_ticket))
        
        if not success:
            await websocket.send_json({
                "type": "error",
                "action": "close_failed",
                "message": error
            })
            return
        
        # Update trade
        trade.status = "CLOSED"
        trade.close_time = datetime.utcnow()
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            title="Trade Closed",
            message=f"{trade.symbol} position closed",
            type="success"
        )
        db.add(notification)
        
        await db.commit()
        
        await websocket.send_json({
            "type": "success",
            "action": "position_closed",
            "trade": {
                "id": trade.id,
                "symbol": trade.symbol,
                "profit": trade.profit
            },
            "timestamp": datetime.utcnow().isoformat()
        })
    
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"Close position error: {str(e)}"
        })


async def handle_sync_action(websocket: WebSocket, user: User, db: AsyncSession):
    """Handle SYNC action - get account info and positions"""
    
    try:
        # Get connected account
        from sqlalchemy import select
        result = await db.execute(
            select(MT5Account).filter(
                MT5Account.user_id == user.id,
                MT5Account.is_connected == True
            ).limit(1)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            await websocket.send_json({
                "type": "error",
                "message": "No connected MT5 account"
            })
            return
        
        # Get account info
        account_info = await mt5_handler.get_account_info()
        
        # Get open positions
        positions = await mt5_handler.get_open_positions()
        
        await websocket.send_json({
            "type": "sync",
            "account": {
                "balance": account_info["balance"] if account_info else 0,
                "equity": account_info["equity"] if account_info else 0,
                "margin": account_info["margin"] if account_info else 0,
                "free_margin": account_info["free_margin"] if account_info else 0,
                "profit": account_info["profit"] if account_info else 0,
            },
            "positions": positions,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"Sync error: {str(e)}"
        })
