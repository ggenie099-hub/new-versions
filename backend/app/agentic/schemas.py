"""
Pydantic schemas for Agentic Trading System
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Node Schemas
class NodeConfig(BaseModel):
    """Base node configuration"""
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]


class NodeConnection(BaseModel):
    """Connection between nodes"""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


# Workflow Schemas
class WorkflowCreate(BaseModel):
    """Create workflow request"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    nodes: List[NodeConfig] = []
    connections: List[NodeConnection] = []
    settings: Dict[str, Any] = {}
    trigger_type: Optional[str] = "manual"
    schedule_cron: Optional[str] = None


class WorkflowUpdate(BaseModel):
    """Update workflow request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    nodes: Optional[List[NodeConfig]] = None
    connections: Optional[List[NodeConnection]] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    trigger_type: Optional[str] = None
    schedule_cron: Optional[str] = None


class WorkflowResponse(BaseModel):
    """Workflow response"""
    id: int
    user_id: int
    name: str
    description: Optional[str]
    nodes: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]
    settings: Dict[str, Any]
    is_active: bool
    trigger_type: Optional[str]
    schedule_cron: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Execution Schemas
class ExecutionCreate(BaseModel):
    """Start workflow execution"""
    test_mode: bool = False
    input_data: Optional[Dict[str, Any]] = None


class ExecutionResponse(BaseModel):
    """Execution response"""
    id: int
    workflow_id: int
    user_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    execution_data: Dict[str, Any]
    error_message: Optional[str]
    trades_executed: int
    profit_loss: int
    
    class Config:
        from_attributes = True


class NodeExecutionLogResponse(BaseModel):
    """Node execution log response"""
    id: int
    execution_id: int
    node_id: str
    node_type: str
    status: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    error_message: Optional[str]
    execution_time_ms: Optional[int]
    executed_at: datetime
    
    class Config:
        from_attributes = True


# Node Type Schemas
class NodeTypeParameter(BaseModel):
    """Node parameter definition"""
    name: str
    type: str  # string, number, boolean, select, symbol
    label: str
    description: Optional[str] = None
    required: bool = True
    default: Optional[Any] = None
    options: Optional[List[Dict[str, Any]]] = None  # For select type
    min: Optional[float] = None  # For number type
    max: Optional[float] = None  # For number type


class NodeTypeDefinition(BaseModel):
    """Node type definition"""
    type: str
    category: str
    name: str
    description: str
    icon: str
    color: str
    inputs: List[str]
    outputs: List[str]
    parameters: List[NodeTypeParameter]
    examples: Optional[List[Dict[str, Any]]] = None


# Test Node Schemas
class TestNodeRequest(BaseModel):
    """Test node execution request"""
    node_type: str
    config: Dict[str, Any]
    input_data: Optional[Dict[str, Any]] = None


class TestNodeResponse(BaseModel):
    """Test node execution response"""
    success: bool
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    execution_time_ms: int
