from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import User, MT5Account
from app.schemas import MT5AccountCreate, MT5AccountResponse, MT5AccountUpdate
from app.dependencies import get_current_user
from app.mt5_handler import mt5_handler
from app.security import encryption_handler

router = APIRouter(prefix="/mt5", tags=["MT5 Account"])


@router.post("/accounts", response_model=MT5AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_mt5_account(
    account_data: MT5AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new MT5 account"""
    
    # Check if account already exists for this user
    result = await db.execute(
        select(MT5Account).filter(
            MT5Account.user_id == current_user.id,
            MT5Account.account_number == account_data.account_number
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MT5 account already exists"
        )
    
    # Encrypt password
    encrypted_password = encryption_handler.encrypt(account_data.password)
    
    # Create account
    new_account = MT5Account(
        user_id=current_user.id,
        account_number=account_data.account_number,
        encrypted_password=encrypted_password,
        server=account_data.server,
        account_type=account_data.account_type,
        broker=account_data.broker,
    )
    
    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)
    
    return new_account


@router.get("/accounts", response_model=List[MT5AccountResponse])
async def get_mt5_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all MT5 accounts for current user"""
    
    result = await db.execute(
        select(MT5Account).filter(MT5Account.user_id == current_user.id)
    )
    accounts = result.scalars().all()
    return accounts


@router.get("/accounts/{account_id}", response_model=MT5AccountResponse)
async def get_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific MT5 account"""
    
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
    
    return account


@router.post("/accounts/{account_id}/connect")
async def connect_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Connect to MT5 account"""
    
    # Get account
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
    
    # Decrypt password
    password = encryption_handler.decrypt(account.encrypted_password)
    
    # Initialize and login
    await mt5_handler.initialize()
    success, error = await mt5_handler.login(
        int(account.account_number),
        password,
        account.server
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Failed to connect to MT5 account"
        )
    
    # Update account info
    account_info = await mt5_handler.get_account_info()
    if account_info:
        account.balance = account_info["balance"]
        account.equity = account_info["equity"]
        account.margin = account_info["margin"]
        account.free_margin = account_info["free_margin"]
        account.margin_level = account_info["margin_level"]
        account.profit = account_info["profit"]
        account.leverage = account_info["leverage"]
        account.currency = account_info["currency"]
    
    account.is_connected = True
    account.last_sync = datetime.utcnow()
    
    await db.commit()
    await db.refresh(account)
    
    return {
        "message": "Connected successfully",
        "account": account
    }


@router.post("/accounts/{account_id}/disconnect")
async def disconnect_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disconnect from MT5 account"""
    
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
    
    await mt5_handler.shutdown()
    account.is_connected = False
    
    await db.commit()
    
    return {"message": "Disconnected successfully"}


@router.post("/accounts/{account_id}/sync")
async def sync_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync MT5 account data"""
    
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
    
    # Get account info
    account_info = await mt5_handler.get_account_info()
    if not account_info:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve account information"
        )
    
    # Update account
    account.balance = account_info["balance"]
    account.equity = account_info["equity"]
    account.margin = account_info["margin"]
    account.free_margin = account_info["free_margin"]
    account.margin_level = account_info["margin_level"]
    account.profit = account_info["profit"]
    account.leverage = account_info["leverage"]
    account.currency = account_info["currency"]
    account.last_sync = datetime.utcnow()
    
    await db.commit()
    await db.refresh(account)
    
    return {
        "message": "Account synced successfully",
        "account": account
    }


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete MT5 account"""
    
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
    
    await db.delete(account)
    await db.commit()
    
    return None
