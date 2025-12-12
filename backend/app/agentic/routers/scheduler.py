"""
Scheduler API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.agentic.models import ScheduledJob, Workflow, JobQueue
from pydantic import BaseModel

router = APIRouter(prefix="/scheduler", tags=["Agentic Scheduler"])


class ScheduledJobCreateRequest(BaseModel):
    workflow_id: int
    trigger_type: str  # cron, price, indicator, time, webhook
    trigger_config: Dict[str, Any]


class ScheduledJobUpdateRequest(BaseModel):
    trigger_config: Dict[str, Any] = None
    is_active: bool = None


@router.post("/jobs")
async def create_scheduled_job(
    job_data: ScheduledJobCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new scheduled job
    
    Trigger types:
    - cron: Schedule with cron expression
    - price: Trigger on price condition
    - indicator: Trigger on indicator signal
    - time: Trigger at regular intervals
    - webhook: Trigger via external webhook
    """
    
    # Verify workflow exists and belongs to user
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == job_data.workflow_id)
        .where(Workflow.user_id == current_user.id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Create scheduled job
    scheduled_job = ScheduledJob(
        workflow_id=job_data.workflow_id,
        user_id=current_user.id,
        trigger_type=job_data.trigger_type,
        trigger_config=job_data.trigger_config,
        is_active=True
    )
    
    db.add(scheduled_job)
    await db.commit()
    await db.refresh(scheduled_job)
    
    return {
        "id": scheduled_job.id,
        "workflow_id": scheduled_job.workflow_id,
        "trigger_type": scheduled_job.trigger_type,
        "trigger_config": scheduled_job.trigger_config,
        "is_active": scheduled_job.is_active,
        "created_at": scheduled_job.created_at
    }


@router.get("/jobs")
async def get_scheduled_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all scheduled jobs for current user"""
    
    result = await db.execute(
        select(ScheduledJob)
        .where(ScheduledJob.user_id == current_user.id)
        .order_by(ScheduledJob.created_at.desc())
    )
    jobs = result.scalars().all()
    
    return [
        {
            "id": job.id,
            "workflow_id": job.workflow_id,
            "trigger_type": job.trigger_type,
            "trigger_config": job.trigger_config,
            "is_active": job.is_active,
            "last_run": job.last_run,
            "next_run": job.next_run,
            "run_count": job.run_count,
            "created_at": job.created_at
        }
        for job in jobs
    ]


@router.get("/jobs/{job_id}")
async def get_scheduled_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific scheduled job"""
    
    result = await db.execute(
        select(ScheduledJob)
        .where(ScheduledJob.id == job_id)
        .where(ScheduledJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Scheduled job not found")
    
    return {
        "id": job.id,
        "workflow_id": job.workflow_id,
        "trigger_type": job.trigger_type,
        "trigger_config": job.trigger_config,
        "is_active": job.is_active,
        "last_run": job.last_run,
        "next_run": job.next_run,
        "run_count": job.run_count,
        "created_at": job.created_at
    }


@router.put("/jobs/{job_id}")
async def update_scheduled_job(
    job_id: int,
    job_data: ScheduledJobUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a scheduled job"""
    
    result = await db.execute(
        select(ScheduledJob)
        .where(ScheduledJob.id == job_id)
        .where(ScheduledJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Scheduled job not found")
    
    # Update fields
    if job_data.trigger_config is not None:
        job.trigger_config = job_data.trigger_config
    
    if job_data.is_active is not None:
        job.is_active = job_data.is_active
    
    await db.commit()
    await db.refresh(job)
    
    return {
        "id": job.id,
        "workflow_id": job.workflow_id,
        "trigger_type": job.trigger_type,
        "trigger_config": job.trigger_config,
        "is_active": job.is_active,
        "last_run": job.last_run,
        "next_run": job.next_run,
        "run_count": job.run_count
    }


@router.delete("/jobs/{job_id}")
async def delete_scheduled_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a scheduled job"""
    
    result = await db.execute(
        select(ScheduledJob)
        .where(ScheduledJob.id == job_id)
        .where(ScheduledJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Scheduled job not found")
    
    await db.delete(job)
    await db.commit()
    
    return {"success": True, "message": "Scheduled job deleted"}


@router.post("/jobs/{job_id}/toggle")
async def toggle_scheduled_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle scheduled job active status"""
    
    result = await db.execute(
        select(ScheduledJob)
        .where(ScheduledJob.id == job_id)
        .where(ScheduledJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Scheduled job not found")
    
    job.is_active = not job.is_active
    await db.commit()
    
    return {
        "id": job.id,
        "is_active": job.is_active,
        "message": f"Job {'activated' if job.is_active else 'deactivated'}"
    }


@router.get("/jobs/{job_id}/history")
async def get_job_history(
    job_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get execution history for a scheduled job"""
    
    # Verify job belongs to user
    result = await db.execute(
        select(ScheduledJob)
        .where(ScheduledJob.id == job_id)
        .where(ScheduledJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Scheduled job not found")
    
    # Get job queue history
    result = await db.execute(
        select(JobQueue)
        .where(JobQueue.workflow_id == job.workflow_id)
        .order_by(JobQueue.created_at.desc())
        .limit(limit)
    )
    history = result.scalars().all()
    
    return [
        {
            "id": h.id,
            "status": h.status,
            "scheduled_at": h.scheduled_at,
            "started_at": h.started_at,
            "completed_at": h.completed_at,
            "retry_count": h.retry_count,
            "error_message": h.error_message
        }
        for h in history
    ]


@router.get("/queue/status")
async def get_queue_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get job queue status"""
    
    # Count jobs by status
    result = await db.execute(
        select(JobQueue)
        .where(JobQueue.user_id == current_user.id)
    )
    all_jobs = result.scalars().all()
    
    status_counts = {
        'pending': 0,
        'running': 0,
        'completed': 0,
        'failed': 0,
        'cancelled': 0
    }
    
    for job in all_jobs:
        if job.status in status_counts:
            status_counts[job.status] += 1
    
    return {
        "total_jobs": len(all_jobs),
        "status_counts": status_counts,
        "active_jobs": status_counts['pending'] + status_counts['running']
    }


@router.get("/queue/pending")
async def get_pending_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending jobs in queue"""
    
    result = await db.execute(
        select(JobQueue)
        .where(JobQueue.user_id == current_user.id)
        .where(JobQueue.status == 'pending')
        .order_by(JobQueue.priority.desc(), JobQueue.created_at)
    )
    jobs = result.scalars().all()
    
    return [
        {
            "id": job.id,
            "workflow_id": job.workflow_id,
            "priority": job.priority,
            "scheduled_at": job.scheduled_at,
            "created_at": job.created_at
        }
        for job in jobs
    ]


@router.post("/queue/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending job"""
    
    result = await db.execute(
        select(JobQueue)
        .where(JobQueue.id == job_id)
        .where(JobQueue.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in ['pending', 'running']:
        raise HTTPException(status_code=400, detail="Can only cancel pending or running jobs")
    
    job.status = 'cancelled'
    job.completed_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True, "message": "Job cancelled"}


@router.post("/queue/jobs/{job_id}/retry")
async def retry_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retry a failed job"""
    
    result = await db.execute(
        select(JobQueue)
        .where(JobQueue.id == job_id)
        .where(JobQueue.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != 'failed':
        raise HTTPException(status_code=400, detail="Can only retry failed jobs")
    
    # Reset job status
    job.status = 'pending'
    job.retry_count = 0
    job.error_message = None
    job.started_at = None
    job.completed_at = None
    job.scheduled_at = datetime.utcnow()
    
    await db.commit()
    
    return {"success": True, "message": "Job queued for retry"}
