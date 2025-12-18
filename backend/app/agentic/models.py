"""
Database models for Agentic Trading System
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Workflow(Base):
    """Workflow definition model"""
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    nodes = Column(JSON, nullable=False, default=list)  # Node definitions
    connections = Column(JSON, nullable=False, default=list)  # Node connections
    settings = Column(JSON, default=dict)  # Workflow settings
    is_active = Column(Boolean, default=False)
    trigger_type = Column(String(50))  # manual, scheduled, event, price, indicator
    schedule_cron = Column(String(100))  # Cron expression for scheduled workflows
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowExecution(Base):
    """Workflow execution history model"""
    __tablename__ = "workflow_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="running")  # running, completed, failed, stopped
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    execution_data = Column(JSON, default=dict)  # Node execution results
    error_message = Column(Text)
    trades_executed = Column(Integer, default=0)
    profit_loss = Column(Integer, default=0)  # In cents to avoid float issues
    
    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    user = relationship("User")
    logs = relationship("NodeExecutionLog", back_populates="execution", cascade="all, delete-orphan")


class NodeExecutionLog(Base):
    """Individual node execution log model"""
    __tablename__ = "node_execution_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("workflow_executions.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String(100), nullable=False)
    node_type = Column(String(50), nullable=False)
    status = Column(String(50), default="running")  # running, completed, failed, skipped
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error_message = Column(Text)
    execution_time_ms = Column(Integer)  # Execution time in milliseconds
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    execution = relationship("WorkflowExecution", back_populates="logs")


class ScheduledJob(Base):
    """Scheduled job model for automated workflow execution"""
    __tablename__ = "scheduled_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_type = Column(String(50), nullable=False)  # cron, price, indicator, time, webhook
    trigger_config = Column(JSON, default=dict)  # Trigger-specific configuration
    is_active = Column(Boolean, default=True, index=True)
    last_run = Column(DateTime(timezone=True))
    next_run = Column(DateTime(timezone=True))
    run_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    workflow = relationship("Workflow")
    user = relationship("User")


class JobQueue(Base):
    """Job queue for workflow execution"""
    __tablename__ = "job_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)  # pending, running, completed, failed, cancelled
    priority = Column(Integer, default=0)  # Higher number = higher priority
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    workflow = relationship("Workflow")
    user = relationship("User")


class ExecutionMetrics(Base):
    """Execution performance metrics"""
    __tablename__ = "execution_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("workflow_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    total_nodes = Column(Integer, nullable=False)
    successful_nodes = Column(Integer, default=0)
    failed_nodes = Column(Integer, default=0)
    total_time_ms = Column(Integer, nullable=False)
    avg_node_time_ms = Column(Integer)
    memory_used_mb = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    execution = relationship("WorkflowExecution")


class WorkflowState(Base):
    """Persistent state for workflows across executions"""
    __tablename__ = "workflow_states"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(255), nullable=False, index=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    workflow = relationship("Workflow", backref="states")
