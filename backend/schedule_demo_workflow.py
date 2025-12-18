"""
Script to schedule the trading workflow to run every 24 hours.
"""
import asyncio
import os
from app.agentic.models import Workflow
from app.models import User
from app.database import AsyncSessionLocal
from sqlalchemy import select

async def schedule_workflow():
    async with AsyncSessionLocal() as db:
        # Get the demo workflow (ID 555)
        result = await db.execute(select(Workflow).filter(Workflow.id == 555))
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            print("❌ Workflow ID 555 not found. Please run run_trading_template.py first.")
            return

        # Update to scheduled trigger
        # Cron for daily execution at 09:00 UTC
        workflow.trigger_type = 'scheduled'
        workflow.schedule_cron = '0 9 * * *'
        workflow.is_active = True
        
        # Also update the trigger node in the nodes list
        for node in workflow.nodes:
            if node['type'] == 'ManualTrigger':
                node['type'] = 'ScheduleTrigger'
                node['data'] = {
                    "cron_expression": "0 9 * * *",
                    "timezone": "UTC"
                }
        
        await db.commit()
        print(f"✅ Workflow '{workflow.name}' (ID: {workflow.id}) has been scheduled!")
        print(f"⏰ Schedule: {workflow.schedule_cron} (Every day at 09:00 UTC)")
        print(f"🔄 The system scheduler will now pick this up automatically.")

if __name__ == "__main__":
    asyncio.run(schedule_workflow())
