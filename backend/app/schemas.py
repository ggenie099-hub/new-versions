from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models import SubscriptionTier, AccountType, UserRole


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: UserRole
    subscription_tier: SubscriptionTier
    api_key: Optional[str] = None
    websocket_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# MT5 Account Schemas
class MT5AccountCreate(BaseModel):
    account_number: str
    password: str
    server: str
    account_type: AccountType
    broker: Optional[str] = None


class MT5AccountResponse(BaseModel):
    id: int
    account_number: str
    server: str
    account_type: AccountType
    broker: Optional[str] = None
    is_connected: bool
    balance: float
    equity: float
    margin: float
    free_margin: float
    margin_level: float
    profit: float
    leverage: int
    currency: str
    last_sync: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MT5AccountUpdate(BaseModel):
    balance: Optional[float] = None
    equity: Optional[float] = None
    margin: Optional[float] = None
    free_margin: Optional[float] = None
    margin_level: Optional[float] = None
    profit: Optional[float] = None
    is_connected: Optional[bool] = None


# Trade Schemas
class TradeCreate(BaseModel):
    symbol: str
    order_type: str
    volume: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    comment: Optional[str] = None


class TradeResponse(BaseModel):
    id: int
    mt5_ticket: Optional[str] = None
    symbol: str
    order_type: str
    volume: float
    open_price: float
    close_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    profit: float
    commission: float
    swap: float
    status: str
    open_time: datetime
    close_time: Optional[datetime] = None
    comment: Optional[str] = None
    
    class Config:
        from_attributes = True


# Watchlist Schemas
class WatchlistCreate(BaseModel):
    symbol: str


class WatchlistResponse(BaseModel):
    id: int
    symbol: str
    bid: Optional[float] = None
    ask: Optional[float] = None
    last_price: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[float] = None
    last_update: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Notification Schemas
class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# WebSocket Message Schemas
class WebSocketMessage(BaseModel):
    action: str
    symbol: str
    order_type: str
    volume: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    api_key: str


class TradingViewAlert(BaseModel):
    symbol: str
    action: str  # buy, sell, close
    volume: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    price: Optional[float] = None


# Symbol Search Schema
class SymbolSearchResponse(BaseModel):
    symbol: str
    description: str
    type: str
    exchange: Optional[str] = None


# JSON Generator Response
class JSONGeneratorResponse(BaseModel):
    message: dict
    example: str
