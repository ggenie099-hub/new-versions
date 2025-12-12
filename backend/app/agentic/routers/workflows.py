"""
Workflow CRUD API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.agentic.models import Workflow
from app.agentic.schemas import WorkflowCreate, WorkflowUpdate, WorkflowResponse

router = APIRouter(prefix="/workflows", tags=["Agentic Workflows"])


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workflow"""
    
    workflow = Workflow(
        user_id=current_user.id,
        name=workflow_data.name,
        description=workflow_data.description,
        nodes=[node.dict() for node in workflow_data.nodes],
        connections=[conn.dict() for conn in workflow_data.connections],
        settings=workflow_data.settings,
        trigger_type=workflow_data.trigger_type,
        schedule_cron=workflow_data.schedule_cron
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    return workflow


@router.get("", response_model=List[WorkflowResponse])
async def get_workflows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all workflows for current user"""
    
    result = await db.execute(
        select(Workflow)
        .filter(Workflow.user_id == current_user.id)
        .order_by(desc(Workflow.updated_at))
    )
    workflows = result.scalars().all()
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific workflow"""
    
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
    
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update workflow"""
    
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
    
    # Update fields
    if workflow_data.name is not None:
        workflow.name = workflow_data.name
    if workflow_data.description is not None:
        workflow.description = workflow_data.description
    if workflow_data.nodes is not None:
        workflow.nodes = [node.dict() for node in workflow_data.nodes]
    if workflow_data.connections is not None:
        workflow.connections = [conn.dict() for conn in workflow_data.connections]
    if workflow_data.settings is not None:
        workflow.settings = workflow_data.settings
    if workflow_data.is_active is not None:
        workflow.is_active = workflow_data.is_active
    if workflow_data.trigger_type is not None:
        workflow.trigger_type = workflow_data.trigger_type
    if workflow_data.schedule_cron is not None:
        workflow.schedule_cron = workflow_data.schedule_cron
    
    await db.commit()
    await db.refresh(workflow)
    
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete workflow"""
    
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
    
    await db.delete(workflow)
    await db.commit()
    
    return None


@router.post("/{workflow_id}/toggle")
async def toggle_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Activate or deactivate workflow"""
    
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
    
    workflow.is_active = not workflow.is_active
    await db.commit()
    await db.refresh(workflow)
    
    return {
        'id': workflow.id,
        'is_active': workflow.is_active,
        'message': f"Workflow {'activated' if workflow.is_active else 'deactivated'}"
    }
