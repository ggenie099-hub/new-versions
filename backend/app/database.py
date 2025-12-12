from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()

# Configure engine based on database type
if 'sqlite' in settings.DATABASE_URL:
    # SQLite doesn't support pool_size and max_overflow
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
        future=True,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL/MySQL configuration
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
