"""
Workflow execution API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.agentic.models import Workflow, WorkflowExecution, NodeExecutionLog
from app.agentic.schemas import ExecutionCreate, ExecutionResponse, NodeExecutionLogResponse
from app.agentic.engine import WorkflowExecutor

router = APIRouter(prefix="/executions", tags=["Agentic Executions"])


@router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: int,
    execution_data: ExecutionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Execute a workflow manually"""
    
    # Get workflow
    result = await db.execute(
        select(Workflow).filter(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Execute workflow
    try:
        executor = WorkflowExecutor(workflow, current_user.id)
        execution = await executor.execute(test_mode=execution_data.test_mode)
        
        return {
            'execution_id': execution.id,
            'status': execution.status,
            'message': 'Workflow execution started'
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution failed: {str(e)}"
        )


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get execution details"""
    
    result = await db.execute(
        select(WorkflowExecution).filter(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.user_id == current_user.id
        )
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    return execution


@router.get("/{execution_id}/logs", response_model=List[NodeExecutionLogResponse])
async def get_execution_logs(
    execution_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get execution logs"""
    
    # Verify execution belongs to user
    result = await db.execute(
        select(WorkflowExecution).filter(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.user_id == current_user.id
        )
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # Get logs
    result = await db.execute(
        select(NodeExecutionLog)
        .filter(NodeExecutionLog.execution_id == execution_id)
        .order_by(NodeExecutionLog.executed_at)
    )
    logs = result.scalars().all()
    
    return logs


@router.get("/workflows/{workflow_id}/history", response_model=List[ExecutionResponse])
async def get_workflow_executions(
    workflow_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get execution history for a workflow"""
    
    # Verify workflow belongs to user
    result = await db.execute(
        select(Workflow).filter(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Get executions
    result = await db.execute(
        select(WorkflowExecution)
        .filter(WorkflowExecution.workflow_id == workflow_id)
        .order_by(desc(WorkflowExecution.started_at))
        .limit(limit)
    )
    executions = result.scalars().all()
    
    return executions
