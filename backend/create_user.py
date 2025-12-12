"""
Create a test user for login
"""
import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from app.security import get_password_hash
import secrets


async def create_user():
    """Create a test user"""
    async with AsyncSessionLocal() as db:
        # Create user
        user = User(
            email="admin@autotrading.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_verified=True,
            subscription_tier="PRO",
            api_key=secrets.token_urlsafe(32)
        )
        
        db.add(user)
        await db.commit()
        
        print("✅ User created successfully!")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Password: admin123")
        print(f"   API Key: {user.api_key}")
        print("\n🔐 You can now login with:")
        print(f"   Email: admin@autotrading.com")
        print(f"   Password: admin123")


if __name__ == "__main__":
    asyncio.run(create_user())
