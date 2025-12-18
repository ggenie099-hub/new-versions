"""
Synchronize Agentic Database Tables
"""
import asyncio
from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import User, MT5Account, Watchlist, Trade, Notification
from app.agentic.models import Workflow, WorkflowExecution, NodeExecutionLog, WorkflowState, ScheduledJob, JobQueue, ExecutionMetrics

async def sync_tables():
    print("🔨 Synchronizing database tables (including Agentic models)...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Sync complete!")

if __name__ == "__main__":
    asyncio.run(sync_tables())
