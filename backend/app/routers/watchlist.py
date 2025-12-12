from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import User, Watchlist
from app.schemas import WatchlistCreate, WatchlistResponse
from app.dependencies import get_current_user
from app.mt5_handler import mt5_handler

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    watchlist_data: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add symbol to watchlist"""
    
    # Check if symbol already in watchlist
    result = await db.execute(
        select(Watchlist).filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == watchlist_data.symbol
        )
    )
    
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symbol already in watchlist"
        )
    
    # Get symbol info
    await mt5_handler.initialize()
    symbol_info = await mt5_handler.get_symbol_info(watchlist_data.symbol)
    
    # Create watchlist entry
    new_item = Watchlist(
        user_id=current_user.id,
        symbol=watchlist_data.symbol,
        bid=symbol_info["bid"] if symbol_info else None,
        ask=symbol_info["ask"] if symbol_info else None,
        last_price=symbol_info["last"] if symbol_info else None,
        volume=symbol_info["volume"] if symbol_info else None,
        last_update=datetime.utcnow()
    )
    
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    
    return new_item


@router.get("", response_model=List[WatchlistResponse])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's watchlist"""
    
    result = await db.execute(
        select(Watchlist).filter(Watchlist.user_id == current_user.id)
    )
    watchlist = result.scalars().all()
    return watchlist


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    watchlist_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove symbol from watchlist"""
    
    result = await db.execute(
        select(Watchlist).filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found"
        )
    
    await db.delete(item)
    await db.commit()
    
    return None


@router.post("/sync")
async def sync_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync watchlist prices with live data"""
    
    # Get watchlist
    result = await db.execute(
        select(Watchlist).filter(Watchlist.user_id == current_user.id)
    )
    watchlist = result.scalars().all()
    
    if not watchlist:
        return {"message": "Watchlist is empty"}
    
    # Initialize MT5
    await mt5_handler.initialize()
    
    # Update prices
    updated_count = 0
    for item in watchlist:
        symbol_info = await mt5_handler.get_symbol_info(item.symbol)
        if symbol_info:
            old_price = item.last_price
            item.bid = symbol_info["bid"]
            item.ask = symbol_info["ask"]
            item.last_price = symbol_info["last"]
            item.volume = symbol_info["volume"]
            
            # Calculate change percent
            if old_price and old_price > 0:
                item.change_percent = ((symbol_info["last"] - old_price) / old_price) * 100
            
            item.last_update = datetime.utcnow()
            updated_count += 1
    
    await db.commit()
    
    return {
        "message": f"Updated {updated_count} symbols",
        "total": len(watchlist)
    }
