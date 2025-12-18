"""
Strategy Persistence (Memory) Nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from sqlalchemy import select
from app.agentic.models import WorkflowState
from app.database import AsyncSessionLocal

class SetStateNode(BaseNode):
    """Store a value in persistent workflow memory"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        workflow_id = self.context.get('workflow_id')
        if not workflow_id:
            raise Exception("Workflow ID not found in context")
            
        key = self.config.get('key')
        value = self.config.get('value')
        
        # If value is not in config, try to get from input_data
        if value is None and input_data:
            value = input_data.get('value')
            
        if not key:
            raise Exception("Memory key not specified")
            
        async with AsyncSessionLocal() as db:
            # Check if key exists
            result = await db.execute(
                select(WorkflowState).filter(
                    WorkflowState.workflow_id == workflow_id,
                    WorkflowState.key == key
                )
            )
            state = result.scalar_one_or_none()
            
            if state:
                state.value = value
            else:
                state = WorkflowState(
                    workflow_id=workflow_id,
                    key=key,
                    value=value
                )
                db.add(state)
            
            await db.commit()
            
        return {
            'success': True,
            'key': key,
            'value': value
        }

    def get_outputs(self) -> list:
        return ['success', 'key', 'value']

class GetStateNode(BaseNode):
    """Retrieve a value from persistent workflow memory"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        workflow_id = self.context.get('workflow_id')
        if not workflow_id:
            raise Exception("Workflow ID not found in context")
            
        key = self.config.get('key')
        default_value = self.config.get('default_value')
        
        if not key:
            raise Exception("Memory key not specified")
            
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(WorkflowState).filter(
                    WorkflowState.workflow_id == workflow_id,
                    WorkflowState.key == key
                )
            )
            state = result.scalar_one_or_none()
            
            value = state.value if state else default_value
            
        return {
            'value': value,
            'exists': state is not None
        }

    def get_outputs(self) -> list:
        return ['value', 'exists']
