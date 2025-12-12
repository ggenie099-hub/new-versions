from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.security import decode_token
from typing import Optional

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    print(f"🔐 Validating token (first 50 chars): {token[:50]}...")
    
    payload = decode_token(token)
    
    if payload is None:
        print("❌ Token decode failed - Invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Token decoded successfully. Payload: {payload}")
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        print("❌ No 'sub' found in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert string user_id to int
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        print(f"❌ Invalid user_id format: {user_id_str}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"🔍 Looking up user with ID: {user_id}")
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        print(f"❌ User not found with ID: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        print(f"❌ User {user.email} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    print(f"✅ User authenticated: {user.email} (ID: {user.id})")
    return user


async def get_user_by_api_key(api_key: str, db: AsyncSession) -> Optional[User]:
    result = await db.execute(select(User).filter(User.api_key == api_key))
    return result.scalar_one_or_none()


async def verify_websocket_connection(websocket: WebSocket, api_key: str, db: AsyncSession) -> User:
    user = await get_user_by_api_key(api_key, db)
    if not user:
        await websocket.close(code=4001, reason="Invalid API key")
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user
