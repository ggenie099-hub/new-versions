"""
Script to execute a complete trading signal workflow.
Flow: Manual Trigger -> Fetch Price -> Smart Risk Manager -> Market Order (with SL/TP) -> Notification
"""
import asyncio
import os
import json
from app.agentic.engine.executor import WorkflowExecutor
from app.agentic.models import Workflow
from app.models import User
from app.database import AsyncSessionLocal
from sqlalchemy import select

async def setup_trading_workflow():
    async with AsyncSessionLocal() as db:
        # 1. Ensure test user exists
        result = await db.execute(select(User).filter(User.id == 1))
        user = result.scalar_one_or_none()
        if not user:
            user = User(id=1, username="trader", email="trader@maven.com", hashed_password="pw")
            db.add(user)
            await db.commit()

        # 2. Define the workflow nodes
        # Node 1: Manual Trigger
        # Node 2: Get Price
        # Node 3: Smart Risk Manager (Kelly Criterion)
        # Node 4: Market Order with SL/TP
        # Node 5: Notification
        
        nodes = [
            {
                "id": "trigger-1",
                "type": "ManualTrigger",
                "data": {"label": "Start Signal"}
            },
            {
                "id": "price-1",
                "type": "GetLivePrice",
                "data": {"symbol": "EURUSD"}
            },
            {
                "id": "risk-1",
                "type": "SmartRiskManager",
                "data": {
                    "base_risk": 1.0,
                    "max_risk": 3.0,
                    "aggressiveness": 0.8
                }
            },
            {
                "id": "order-1",
                "type": "MarketOrder",
                "data": {
                    "symbol": "EURUSD",
                    "order_type": "BUY",
                    "volume": 0.05,
                    "stop_loss": 1.0850,
                    "take_profit": 1.0950,
                    "comment": "AI Signal Workflow"
                }
            },
            {
                "id": "notify-1",
                "type": "DashboardNotification",
                "data": {
                    "title": "Trade Placed",
                    "message": "EURUSD Buy signal executed with Smart SL: 1.0850",
                    "type": "success"
                }
            }
        ]
        
        connections = [
            {"source": "trigger-1", "target": "price-1"},
            {"source": "price-1", "target": "risk-1"},
            {"source": "risk-1", "target": "order-1"},
            {"source": "order-1", "target": "notify-1"}
        ]

        # 3. Create or update the workflow (ID 555 for Demo)
        result = await db.execute(select(Workflow).filter(Workflow.id == 555))
        workflow = result.scalar_one_or_none()
        
        if workflow:
            workflow.nodes = nodes
            workflow.connections = connections
        else:
            workflow = Workflow(
                id=555,
                user_id=1,
                name="AI Signal & Order Template",
                description="Fetches price, calculates risk, and places order with SL/TP",
                nodes=nodes,
                connections=connections,
                is_active=True
            )
            db.add(workflow)
        
        await db.commit()
        await db.refresh(workflow)
        return workflow

async def run_workflow():
    print("🛠️ Setting up Trading Workflow Template...")
    workflow = await setup_trading_workflow()
    
    print(f"🚀 Executing Workflow: {workflow.name}")
    executor = WorkflowExecutor(workflow=workflow, user_id=1)
    
    try:
        execution = await executor.execute(test_mode=True)
        print("\n" + "="*40)
        print(f"Status: {execution.status}")
        print(f"Started: {execution.started_at}")
        print(f"Completed: {execution.completed_at}")
        print("="*40)
        
        print("\n📝 Execution Logs:")
        async with AsyncSessionLocal() as db:
            from app.agentic.models import NodeExecutionLog
            logs_result = await db.execute(select(NodeExecutionLog).filter(NodeExecutionLog.execution_id == execution.id))
            for log in logs_result.scalars():
                status_icon = "✅" if log.status == "completed" else "❌"
                print(f"{status_icon} [{log.node_type}] - {log.status}")
                if log.output_data:
                    print(f"   Output: {json.dumps(log.output_data, indent=2)[:200]}...")
                if log.error_message:
                    print(f"   Error: {log.error_message}")
    except Exception as e:
        print(f"❌ Execution failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(run_workflow())
