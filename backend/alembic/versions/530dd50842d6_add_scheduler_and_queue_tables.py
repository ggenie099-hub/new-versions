"""add_scheduler_and_queue_tables

Revision ID: 530dd50842d6
Revises: fd09d2935d3b
Create Date: 2025-11-07 12:10:12.549676

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '530dd50842d6'
down_revision: Union[str, None] = 'fd09d2935d3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create scheduled_jobs table
    op.create_table(
        'scheduled_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workflow_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('trigger_type', sa.String(50), nullable=False),
        sa.Column('trigger_config', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('last_run', sa.DateTime(), nullable=True),
        sa.Column('next_run', sa.DateTime(), nullable=True),
        sa.Column('run_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_scheduled_jobs_workflow_id', 'scheduled_jobs', ['workflow_id'])
    op.create_index('ix_scheduled_jobs_user_id', 'scheduled_jobs', ['user_id'])
    op.create_index('ix_scheduled_jobs_is_active', 'scheduled_jobs', ['is_active'])
    
    # Create job_queue table
    op.create_table(
        'job_queue',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workflow_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('priority', sa.Integer(), default=0),
        sa.Column('retry_count', sa.Integer(), default=0),
        sa.Column('max_retries', sa.Integer(), default=3),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_job_queue_workflow_id', 'job_queue', ['workflow_id'])
    op.create_index('ix_job_queue_user_id', 'job_queue', ['user_id'])
    op.create_index('ix_job_queue_status', 'job_queue', ['status'])
    
    # Create execution_metrics table
    op.create_table(
        'execution_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('execution_id', sa.Integer(), nullable=False),
        sa.Column('total_nodes', sa.Integer(), nullable=False),
        sa.Column('successful_nodes', sa.Integer(), default=0),
        sa.Column('failed_nodes', sa.Integer(), default=0),
        sa.Column('total_time_ms', sa.Integer(), nullable=False),
        sa.Column('avg_node_time_ms', sa.Integer(), nullable=True),
        sa.Column('memory_used_mb', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['execution_id'], ['workflow_executions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_execution_metrics_execution_id', 'execution_metrics', ['execution_id'])


def downgrade() -> None:
    op.drop_index('ix_execution_metrics_execution_id', 'execution_metrics')
    op.drop_table('execution_metrics')
    
    op.drop_index('ix_job_queue_status', 'job_queue')
    op.drop_index('ix_job_queue_user_id', 'job_queue')
    op.drop_index('ix_job_queue_workflow_id', 'job_queue')
    op.drop_table('job_queue')
    
    op.drop_index('ix_scheduled_jobs_is_active', 'scheduled_jobs')
    op.drop_index('ix_scheduled_jobs_user_id', 'scheduled_jobs')
    op.drop_index('ix_scheduled_jobs_workflow_id', 'scheduled_jobs')
    op.drop_table('scheduled_jobs')
