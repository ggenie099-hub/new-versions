from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, MT5Account, Trade, Notification
from app.mt5_handler import mt5_handler
from app.security import encryption_handler
from datetime import datetime
import json

router = APIRouter(prefix="/webhook", tags=["Webhook"])


@router.post("/tradingview")
async def tradingview_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    TradingView webhook endpoint for alert execution
    
    Expected JSON format:
    {
        "api_key": "user_api_key",
        "action": "BUY" | "SELL" | "CLOSE",
        "symbol": "EURUSD",
        "volume": 0.01,
        "stop_loss": 1.0850,  // optional
        "take_profit": 1.0950  // optional
    }
    """
    
    try:
        # Parse JSON body
        body = await request.json()
        
        # Validate required fields
        api_key = body.get("api_key")
        action = body.get("action", "").upper()
        symbol = body.get("symbol")
        volume = float(body.get("volume", 0.01))
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        if not action or action not in ["BUY", "SELL", "CLOSE"]:
            raise HTTPException(status_code=400, detail="Invalid action. Must be BUY, SELL, or CLOSE")
        
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")
        
        # Find user by API key
        result = await db.execute(
            select(User).filter(User.api_key == api_key)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Get user's connected MT5 account
        result = await db.execute(
            select(MT5Account).filter(
                MT5Account.user_id == user.id,
                MT5Account.is_connected == True
            ).limit(1)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(status_code=400, detail="No connected MT5 account found")
        
        # Decrypt password and login to MT5
        password = encryption_handler.decrypt(account.encrypted_password)
        await mt5_handler.initialize()
        success, error = await mt5_handler.login(
            int(account.account_number),
            password,
            account.server
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=f"MT5 login failed: {error}")
        
        # Handle CLOSE action
        if action == "CLOSE":
            # Get open positions for this symbol
            result = await db.execute(
                select(Trade).filter(
                    Trade.user_id == user.id,
                    Trade.symbol == symbol,
                    Trade.status == "OPEN"
                )
            )
            trades = result.scalars().all()
            
            closed_count = 0
            for trade in trades:
                success, error = await mt5_handler.close_position(int(trade.mt5_ticket))
                if success:
                    trade.status = "CLOSED"
                    trade.close_time = datetime.utcnow()
                    closed_count += 1
            
            await db.commit()
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                title="TradingView Alert - Positions Closed",
                message=f"Closed {closed_count} position(s) for {symbol}",
                type="success"
            )
            db.add(notification)
            await db.commit()
            
            return {
                "status": "success",
                "action": "CLOSE",
                "symbol": symbol,
                "closed_positions": closed_count,
                "message": f"Closed {closed_count} position(s)"
            }
        
        # Handle BUY/SELL action
        stop_loss = float(body.get("stop_loss")) if body.get("stop_loss") else None
        take_profit = float(body.get("take_profit")) if body.get("take_profit") else None
        
        # Place order
        success, order_result, error = await mt5_handler.place_order(
            symbol=symbol,
            order_type=action,
            volume=volume,
            stop_loss=stop_loss,
            take_profit=take_profit,
            comment="TradingView Alert"
        )
        
        if not success:
            # Create error notification
            notification = Notification(
                user_id=user.id,
                title="TradingView Alert - Trade Failed",
                message=f"Failed to place {action} order for {symbol}: {error}",
                type="error"
            )
            db.add(notification)
            await db.commit()
            
            raise HTTPException(status_code=400, detail=error or "Failed to place order")
        
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
            comment="TradingView Alert",
            status="OPEN"
        )
        db.add(new_trade)
        
        # Create success notification
        notification = Notification(
            user_id=user.id,
            title="TradingView Alert - Trade Executed",
            message=f"{action} order for {symbol} executed at {order_result['price']}",
            type="success"
        )
        db.add(notification)
        
        await db.commit()
        await db.refresh(new_trade)
        
        return {
            "status": "success",
            "action": action,
            "symbol": symbol,
            "ticket": order_result["ticket"],
            "price": order_result["price"],
            "volume": volume,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "message": f"{action} order executed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/test")
async def test_webhook():
    """Test endpoint to verify webhook is working"""
    return {
        "status": "ok",
        "message": "TradingView webhook endpoint is working",
        "endpoint": "/api/webhook/tradingview"
    }
