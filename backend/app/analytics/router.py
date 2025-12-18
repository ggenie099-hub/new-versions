"""
Analytics API Router - Endpoints for AI Trading Decision Intelligence
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, MT5Account, Trade
from app.dependencies import get_current_user, ensure_mt5_connected
from app.mt5_handler import mt5_handler
from app.security import encryption_handler

from .engine import analytics_engine
from .models import (
    MarketRegime,
    TradeReadiness,
    RiskStatus,
    SessionIntelligence,
    MarketNarrative,
    TradeBlocker,
    TradeQuality,
    StrategyHealth,
    FullAnalytics
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/market-regime", response_model=MarketRegime)
async def get_market_regime(
    symbol: str = Query(default="EURUSD", description="Symbol to analyze"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get market regime analysis for a symbol"""
    
    # Get connected MT5 account or any account if none connected
    result = await db.execute(
        select(MT5Account).filter(MT5Account.user_id == current_user.id)
        .order_by(MT5Account.is_connected.desc())
    )
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=400, detail="No MT5 account found. Please add an account first.")
    
    connected = await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    if not connected:
        raise HTTPException(status_code=400, detail="Failed to connect to MT5")
    
    return await analytics_engine.analyze_market_regime(symbol)


@router.get("/trade-readiness", response_model=TradeReadiness)
async def get_trade_readiness(
    symbol: str = Query(default="EURUSD", description="Symbol to analyze"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI trade readiness score"""
    
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.is_connected == True
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=400, detail="No connected MT5 account")
    
    await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    return await analytics_engine.analyze_trade_readiness(symbol)


@router.get("/risk-status", response_model=RiskStatus)
async def get_risk_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current risk and drawdown status"""
    
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.is_connected == True
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=400, detail="No connected MT5 account")
    
    await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    
    # Get account info
    account_info = await mt5_handler.get_account_info()
    if not account_info:
        raise HTTPException(status_code=500, detail="Failed to get account info")
    
    # Get open positions
    positions = await mt5_handler.get_open_positions()
    
    return await analytics_engine.analyze_risk_status(
        balance=account_info['balance'],
        equity=account_info['equity'],
        open_positions=positions
    )


@router.get("/session-intelligence", response_model=SessionIntelligence)
async def get_session_intelligence(
    symbol: str = Query(default="EURUSD", description="Symbol to analyze"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get session and liquidity intelligence"""
    
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.is_connected == True
        )
    )
    account = result.scalar_one_or_none()
    
    if account:
        await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    
    return await analytics_engine.analyze_session_intelligence(symbol)


@router.get("/market-narrative", response_model=MarketNarrative)
async def get_market_narrative(
    symbol: str = Query(default="EURUSD", description="Symbol to analyze"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI market insight in natural language"""
    
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.is_connected == True
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=400, detail="No connected MT5 account")
    
    await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    return await analytics_engine.generate_market_narrative(symbol)


@router.get("/trade-blocker", response_model=TradeBlocker)
async def get_trade_blocker(
    symbol: str = Query(default="EURUSD", description="Symbol to check"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if trading should be blocked"""
    
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.is_connected == True
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=400, detail="No connected MT5 account")
    
    await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    
    account_info = await mt5_handler.get_account_info()
    if not account_info:
        raise HTTPException(status_code=500, detail="Failed to get account info")
    
    return await analytics_engine.check_trade_blocker(
        symbol=symbol,
        balance=account_info['balance'],
        equity=account_info['equity']
    )


@router.get("/trade-quality/{ticket}", response_model=TradeQuality)
async def get_trade_quality(
    ticket: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quality score for an open trade"""
    
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.is_connected == True
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=400, detail="No connected MT5 account")
    
    await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    
    # Get position
    positions = await mt5_handler.get_open_positions()
    position = next((p for p in positions if p['ticket'] == ticket), None)
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    return await analytics_engine.analyze_trade_quality(position)


@router.get("/strategy-health", response_model=List[StrategyHealth])
async def get_strategy_health(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get health status of trading strategies"""
    
    # Get trade history
    result = await db.execute(
        select(Trade).filter(
            Trade.user_id == current_user.id
        ).order_by(desc(Trade.open_time)).limit(100)
    )
    trades = result.scalars().all()
    
    trade_history = [
        {
            'ticket': t.mt5_ticket,
            'symbol': t.symbol,
            'type': t.order_type,
            'profit': t.profit or 0,
            'open_time': t.open_time
        }
        for t in trades
    ]
    
    health = await analytics_engine.analyze_strategy_health("Default Strategy", trade_history)
    return [health]


@router.get("/full", response_model=FullAnalytics)
async def get_full_analytics(
    symbol: str = Query(default="EURUSD", description="Primary symbol to analyze"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete analytics dashboard data in one call"""
    
    # Get connected MT5 account or any account if none connected
    result = await db.execute(
        select(MT5Account).filter(MT5Account.user_id == current_user.id)
        .order_by(MT5Account.is_connected.desc())
    )
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=400, detail="No MT5 account found. Please add an account first.")
    
    connected = await ensure_mt5_connected(account, mt5_handler, encryption_handler)
    if not connected:
        raise HTTPException(status_code=400, detail="Failed to connect to MT5")
    
    # Get account info
    account_info = await mt5_handler.get_account_info()
    if not account_info:
        raise HTTPException(status_code=500, detail="Failed to get account info")
    
    # Get open positions
    positions = await mt5_handler.get_open_positions()
    
    # Get trade history
    trade_result = await db.execute(
        select(Trade).filter(
            Trade.user_id == current_user.id
        ).order_by(desc(Trade.open_time)).limit(100)
    )
    trades = trade_result.scalars().all()
    
    trade_history = [
        {
            'ticket': t.mt5_ticket,
            'symbol': t.symbol,
            'type': t.order_type,
            'profit': t.profit or 0,
            'open_time': t.open_time
        }
        for t in trades
    ]
    
    return await analytics_engine.get_full_analytics(
        symbol=symbol,
        balance=account_info['balance'],
        equity=account_info['equity'],
        open_positions=positions,
        trade_history=trade_history
    )
