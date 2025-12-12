"""
Workflow Scheduler - Automated workflow execution
"""
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from croniter import croniter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agentic.models import ScheduledJob, Workflow, JobQueue
from app.agentic.engine.executor import WorkflowExecutor
from app.database import AsyncSessionLocal
from app.mt5_handler import mt5_handler
import logging

logger = logging.getLogger(__name__)


class WorkflowScheduler:
    """Manages scheduled workflow executions"""
    
    def __init__(self):
        self.running = False
        self.check_interval = 60  # Check every 60 seconds
        self.active_jobs: Dict[int, asyncio.Task] = {}
    
    async def start(self):
        """Start the scheduler"""
        self.running = True
        logger.info("🚀 Workflow Scheduler started")
        
        while self.running:
            try:
                await self.check_and_execute_jobs()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(self.check_interval)
    
    async def stop(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("🛑 Workflow Scheduler stopped")
    
    async def check_and_execute_jobs(self):
        """Check for jobs that need to be executed"""
        async with AsyncSessionLocal() as db:
            # Get active scheduled jobs
            result = await db.execute(
                select(ScheduledJob)
                .where(ScheduledJob.is_active == True)
            )
            jobs = result.scalars().all()
            
            for job in jobs:
                try:
                    if await self.should_execute(job, db):
                        await self.queue_job(job, db)
                except Exception as e:
                    logger.error(f"Error checking job {job.id}: {e}")
    
    async def should_execute(self, job: ScheduledJob, db: AsyncSession) -> bool:
        """Check if a job should be executed now"""
        
        if job.trigger_type == 'cron':
            return await self._check_cron_trigger(job)
        
        elif job.trigger_type == 'price':
            return await self._check_price_trigger(job)
        
        elif job.trigger_type == 'indicator':
            return await self._check_indicator_trigger(job)
        
        elif job.trigger_type == 'time':
            return await self._check_time_trigger(job)
        
        return False
    
    async def _check_cron_trigger(self, job: ScheduledJob) -> bool:
        """Check if cron schedule is due"""
        if not job.trigger_config or 'cron_expression' not in job.trigger_config:
            return False
        
        cron_expr = job.trigger_config['cron_expression']
        
        try:
            cron = croniter(cron_expr, job.last_run or datetime.utcnow())
            next_run = cron.get_next(datetime)
            
            # Update next_run in database
            if job.next_run != next_run:
                job.next_run = next_run
            
            # Check if it's time to run
            return datetime.utcnow() >= next_run
        except Exception as e:
            logger.error(f"Invalid cron expression for job {job.id}: {e}")
            return False
    
    async def _check_price_trigger(self, job: ScheduledJob) -> bool:
        """Check if price condition is met"""
        if not job.trigger_config:
            return False
        
        symbol = job.trigger_config.get('symbol', 'EURUSD')
        condition = job.trigger_config.get('condition', '')  # e.g., "price > 1.10"
        
        try:
            # Get current price
            await mt5_handler.initialize()
            symbol_info = await mt5_handler.get_symbol_info(symbol)
            
            if not symbol_info:
                return False
            
            current_price = symbol_info['bid']
            
            # Evaluate condition
            # Simple evaluation (in production, use safer method)
            condition_str = condition.replace('price', str(current_price))
            
            # Only allow simple comparisons
            if any(op in condition_str for op in ['>', '<', '>=', '<=', '==']):
                try:
                    result = eval(condition_str)
                    return bool(result)
                except:
                    return False
            
            return False
        except Exception as e:
            logger.error(f"Error checking price trigger for job {job.id}: {e}")
            return False
    
    async def _check_indicator_trigger(self, job: ScheduledJob) -> bool:
        """Check if indicator condition is met"""
        # TODO: Implement indicator trigger logic
        # This would calculate indicator and check condition
        return False
    
    async def _check_time_trigger(self, job: ScheduledJob) -> bool:
        """Check if time interval has passed"""
        if not job.trigger_config or 'interval_minutes' not in job.trigger_config:
            return False
        
        interval_minutes = job.trigger_config['interval_minutes']
        
        if not job.last_run:
            return True
        
        next_run = job.last_run + timedelta(minutes=interval_minutes)
        return datetime.utcnow() >= next_run
    
    async def queue_job(self, scheduled_job: ScheduledJob, db: AsyncSession):
        """Add job to execution queue"""
        
        # Check if job is already queued or running
        result = await db.execute(
            select(JobQueue)
            .where(JobQueue.workflow_id == scheduled_job.workflow_id)
            .where(JobQueue.status.in_(['pending', 'running']))
        )
        existing_job = result.scalar_one_or_none()
        
        if existing_job:
            logger.info(f"Job for workflow {scheduled_job.workflow_id} already queued/running")
            return
        
        # Create queue entry
        queue_job = JobQueue(
            workflow_id=scheduled_job.workflow_id,
            user_id=scheduled_job.user_id,
            status='pending',
            priority=0,
            scheduled_at=datetime.utcnow()
        )
        
        db.add(queue_job)
        
        # Update scheduled job
        scheduled_job.last_run = datetime.utcnow()
        scheduled_job.run_count += 1
        
        await db.commit()
        
        logger.info(f"✅ Queued workflow {scheduled_job.workflow_id} for execution")
        
        # Execute immediately
        asyncio.create_task(self.execute_queued_job(queue_job.id))
    
    async def execute_queued_job(self, job_id: int):
        """Execute a queued job"""
        async with AsyncSessionLocal() as db:
            # Get job
            result = await db.execute(
                select(JobQueue).where(JobQueue.id == job_id)
            )
            job = result.scalar_one_or_none()
            
            if not job or job.status != 'pending':
                return
            
            # Update status
            job.status = 'running'
            job.started_at = datetime.utcnow()
            await db.commit()
            
            try:
                # Get workflow
                result = await db.execute(
                    select(Workflow).where(Workflow.id == job.workflow_id)
                )
                workflow = result.scalar_one_or_none()
                
                if not workflow:
                    raise Exception(f"Workflow {job.workflow_id} not found")
                
                # Execute workflow
                executor = WorkflowExecutor(workflow, user_id=job.user_id)
                execution = await executor.execute()
                
                # Update job status
                job.status = 'completed' if execution.status == 'completed' else 'failed'
                job.completed_at = datetime.utcnow()
                
                if execution.error_message:
                    job.error_message = execution.error_message
                
                await db.commit()
                
                logger.info(f"✅ Completed job {job_id} - Status: {job.status}")
                
            except Exception as e:
                logger.error(f"❌ Job {job_id} failed: {e}")
                
                # Update job status
                job.status = 'failed'
                job.completed_at = datetime.utcnow()
                job.error_message = str(e)
                job.retry_count += 1
                
                await db.commit()
                
                # Retry if needed
                if job.retry_count < job.max_retries:
                    logger.info(f"🔄 Retrying job {job_id} (attempt {job.retry_count + 1}/{job.max_retries})")
                    await asyncio.sleep(5 * job.retry_count)  # Exponential backoff
                    await self.execute_queued_job(job_id)


# Global scheduler instance
scheduler = WorkflowScheduler()


async def start_scheduler():
    """Start the global scheduler"""
    await scheduler.start()


async def stop_scheduler():
    """Stop the global scheduler"""
    await scheduler.stop()
