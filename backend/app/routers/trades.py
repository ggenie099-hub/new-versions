from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import User, Trade, MT5Account, Notification
from app.schemas import TradeCreate, TradeResponse
from app.dependencies import get_current_user
from app.mt5_handler import mt5_handler
from app.security import encryption_handler

router = APIRouter(prefix="/trades", tags=["Trades"])


@router.post("", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
async def create_trade(
    trade_data: TradeCreate,
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Place a new trade"""
    
    # Get MT5 account
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.id == account_id,
            MT5Account.user_id == current_user.id
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MT5 account not found"
        )
    
    if not account.is_connected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MT5 account is not connected"
        )
    
    # Place order
    success, order_result, error = await mt5_handler.place_order(
        symbol=trade_data.symbol,
        order_type=trade_data.order_type,
        volume=trade_data.volume,
        stop_loss=trade_data.stop_loss,
        take_profit=trade_data.take_profit,
        comment=trade_data.comment or "Trading Maven"
    )
    
    if not success:
        # Create error notification
        notification = Notification(
            user_id=current_user.id,
            title="Trade Failed",
            message=f"Failed to place {trade_data.order_type} order for {trade_data.symbol}: {error}",
            type="error"
        )
        db.add(notification)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Failed to place order"
        )
    
    # Create trade record
    new_trade = Trade(
        user_id=current_user.id,
        mt5_ticket=str(order_result["ticket"]),
        symbol=trade_data.symbol,
        order_type=trade_data.order_type,
        volume=trade_data.volume,
        open_price=order_result["price"],
        stop_loss=trade_data.stop_loss,
        take_profit=trade_data.take_profit,
        comment=trade_data.comment,
        status="OPEN"
    )
    
    db.add(new_trade)
    
    # Create success notification
    notification = Notification(
        user_id=current_user.id,
        title="Trade Executed",
        message=f"{trade_data.order_type} order for {trade_data.symbol} executed at {order_result['price']}",
        type="success"
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(new_trade)
    
    return new_trade


@router.get("", response_model=List[TradeResponse])
async def get_trades(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all trades for current user"""
    
    query = select(Trade).filter(Trade.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Trade.status == status_filter.upper())
    
    query = query.order_by(desc(Trade.open_time))
    
    result = await db.execute(query)
    trades = result.scalars().all()
    return trades


@router.get("/open", response_model=List[TradeResponse])
async def get_open_trades(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all open trades"""
    
    result = await db.execute(
        select(Trade).filter(
            Trade.user_id == current_user.id,
            Trade.status == "OPEN"
        ).order_by(desc(Trade.open_time))
    )
    trades = result.scalars().all()
    return trades


@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific trade"""
    
    result = await db.execute(
        select(Trade).filter(
            Trade.id == trade_id,
            Trade.user_id == current_user.id
        )
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    return trade


@router.post("/{trade_id}/close")
async def close_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Close an open trade"""
    
    # Get trade
    result = await db.execute(
        select(Trade).filter(
            Trade.id == trade_id,
            Trade.user_id == current_user.id
        )
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    if trade.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trade is not open"
        )
    
    # Close position
    success, error = await mt5_handler.close_position(int(trade.mt5_ticket))
    
    if not success:
        # Create error notification
        notification = Notification(
            user_id=current_user.id,
            title="Close Trade Failed",
            message=f"Failed to close trade {trade.symbol}: {error}",
            type="error"
        )
        db.add(notification)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Failed to close position"
        )
    
    # Update trade
    trade.status = "CLOSED"
    trade.close_time = datetime.utcnow()
    
    # Get current position info for close price and profit
    positions = await mt5_handler.get_open_positions()
    
    # Create success notification
    notification = Notification(
        user_id=current_user.id,
        title="Trade Closed",
        message=f"{trade.symbol} position closed. Profit: {trade.profit}",
        type="success"
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(trade)
    
    return {
        "message": "Trade closed successfully",
        "trade": trade
    }


@router.post("/sync-positions")
async def sync_positions(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync open positions from MT5"""
    
    # Get MT5 account
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.id == account_id,
            MT5Account.user_id == current_user.id
        )
    )
    account = result.scalar_one_or_none()
    
    if not account or not account.is_connected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MT5 account not connected"
        )
    
    # Ensure MT5 session is active for this account
    try:
        password = encryption_handler.decrypt(account.encrypted_password)
        await mt5_handler.initialize()
        success, error = await mt5_handler.login(int(account.account_number), password, account.server)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error or "Failed to login to MT5")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"MT5 login error: {str(e)}")

    # Get open positions from MT5
    positions = await mt5_handler.get_open_positions()
    
    synced_count = 0
    for pos in positions:
        # Check if trade exists
        result = await db.execute(
            select(Trade).filter(Trade.mt5_ticket == str(pos["ticket"]))
        )
        trade = result.scalar_one_or_none()
        
        if trade:
            # Update existing trade
            trade.profit = pos["profit"]
            trade.commission = pos["commission"]
            trade.swap = pos["swap"]
        else:
            # Create new trade record
            new_trade = Trade(
                user_id=current_user.id,
                mt5_ticket=str(pos["ticket"]),
                symbol=pos["symbol"],
                order_type=pos["type"],
                volume=pos["volume"],
                open_price=pos["price_open"],
                stop_loss=pos["stop_loss"],
                take_profit=pos["take_profit"],
                profit=pos["profit"],
                commission=pos["commission"],
                swap=pos["swap"],
                status="OPEN",
                open_time=pos["open_time"],
                comment=pos["comment"]
            )
            db.add(new_trade)
            synced_count += 1
    
    await db.commit()
    
    return {
        "message": f"Synced {synced_count} new positions",
        "total_positions": len(positions),
        "positions": positions,
    }
