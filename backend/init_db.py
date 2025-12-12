"""
Initialize database tables
"""
import asyncio
from app.database import engine, Base
from app.models import User, MT5Account, Watchlist, Trade, Notification


async def init_db():
    """Create all database tables"""
    print("🔨 Creating database tables...")
    
    async with engine.begin() as conn:
        # Drop all tables (use with caution in production!)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
