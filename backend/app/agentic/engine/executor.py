"""
Workflow execution engine
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.agentic.models import Workflow, WorkflowExecution, NodeExecutionLog
from app.agentic.nodes import (
    GetLivePriceNode,
    GetAccountInfoNode,
    MarketOrderNode,
    ClosePositionNode,
    IfElseNode,
    CompareNode,
    DashboardNotificationNode,
    RSINode,
    MACDNode,
    MovingAverageNode,
    BollingerBandsNode,
    ATRNode,
    PositionSizerNode,
    RiskRewardCalculatorNode,
    DrawdownMonitorNode,
    DailyLossLimitNode,
    MaxPositionsNode,
    SmartRiskManagerNode,
    ScheduleTriggerNode,
    PriceTriggerNode,
    IndicatorTriggerNode,
    TimeTriggerNode,
    WebhookTriggerNode,
    ManualTriggerNode
)
from app.agentic.nodes.memory import SetStateNode, GetStateNode
from app.agentic.nodes.news import NewsFetchNode, SentimentAnalysisNode
from app.agentic.nodes.ai_agents import (
    OllamaNode,
    GroqNode,
    HuggingFaceNode,
    OpenAINode,
    OpenRouterNode,
    AITradingAnalystNode,
    CustomAgentNode,
    AIDecisionNode
)
from app.database import AsyncSessionLocal

# Node registry
NODE_REGISTRY = {
    # Market Data Nodes
    'GetLivePrice': GetLivePriceNode,
    'GetAccountInfo': GetAccountInfoNode,
    
    # Order Nodes
    'MarketOrder': MarketOrderNode,
    'ClosePosition': ClosePositionNode,
    
    # Condition Nodes
    'IfElse': IfElseNode,
    'Compare': CompareNode,
    
    # Notification Nodes
    'DashboardNotification': DashboardNotificationNode,
    
    # State Nodes
    'SetState': SetStateNode,
    'GetState': GetStateNode,
    
    # News & Sentiment Nodes
    'NewsFetch': NewsFetchNode,
    'SentimentAnalysis': SentimentAnalysisNode,
    
    # Technical Indicator Nodes
    'RSI': RSINode,
    'MACD': MACDNode,
    'MovingAverage': MovingAverageNode,
    'BollingerBands': BollingerBandsNode,
    'ATR': ATRNode,
    
    # Risk Management Nodes
    'PositionSizer': PositionSizerNode,
    'RiskRewardCalculator': RiskRewardCalculatorNode,
    'DrawdownMonitor': DrawdownMonitorNode,
    'DailyLossLimit': DailyLossLimitNode,
    'MaxPositions': MaxPositionsNode,
    'SmartRiskManager': SmartRiskManagerNode,
    
    # AI Agent Nodes (FREE + Paid options)
    'Ollama': OllamaNode,
    'Groq': GroqNode,
    'HuggingFace': HuggingFaceNode,
    'OpenAI': OpenAINode,
    'OpenRouter': OpenRouterNode,
    'AITradingAnalyst': AITradingAnalystNode,
    'CustomAgent': CustomAgentNode,
    'AIDecision': AIDecisionNode,
    
    # Trigger Nodes
    'ScheduleTrigger': ScheduleTriggerNode,
    'PriceTrigger': PriceTriggerNode,
    'IndicatorTrigger': IndicatorTriggerNode,
    'TimeTrigger': TimeTriggerNode,
    'WebhookTrigger': WebhookTriggerNode,
    'ManualTrigger': ManualTriggerNode,
}


class WorkflowExecutor:
    """Execute workflows"""
    
    def __init__(self, workflow: Workflow, user_id: int):
        self.workflow = workflow
        self.user_id = user_id
        self.execution_id = None
        self.node_outputs = {}  # Store outputs from each node
    
    async def execute(self, test_mode: bool = False) -> WorkflowExecution:
        """
        Execute the workflow
        
        Args:
            test_mode: If True, don't actually execute trades
            
        Returns:
            WorkflowExecution object
        """
        async with AsyncSessionLocal() as db:
            # Create execution record
            execution = WorkflowExecution(
                workflow_id=self.workflow.id,
                user_id=self.user_id,
                status='running',
                started_at=datetime.utcnow()
            )
            db.add(execution)
            await db.commit()
            await db.refresh(execution)
            
            self.execution_id = execution.id
            
            try:
                # Get nodes and connections
                nodes = self.workflow.nodes
                connections = self.workflow.connections
                
                # Build execution order (topological sort)
                execution_order = self._build_execution_order(nodes, connections)
                
                # Execute nodes in order
                for node_config in execution_order:
                    await self._execute_node(node_config, db, test_mode)
                
                # Mark execution as completed
                execution.status = 'completed'
                execution.completed_at = datetime.utcnow()
                execution.execution_data = self.node_outputs
                
                await db.commit()
                await db.refresh(execution)
                
                return execution
                
            except Exception as e:
                # Mark execution as failed
                execution.status = 'failed'
                execution.completed_at = datetime.utcnow()
                execution.error_message = str(e)
                execution.execution_data = self.node_outputs
                
                await db.commit()
                await db.refresh(execution)
                
                raise e
    
    def _build_execution_order(self, nodes: List[Dict], connections: List[Dict]) -> List[Dict]:
        """
        Build execution order using topological sort
        
        For now, simple implementation: execute in order of nodes array
        TODO: Implement proper topological sort
        """
        return nodes
    
    async def _execute_node(self, node_config: Dict[str, Any], db, test_mode: bool = False):
        """Execute a single node"""
        node_id = node_config['id']
        node_type = node_config['type']
        node_data = node_config.get('data', {})
        
        # Add user_id to node config for notification nodes
        if 'user_id' not in node_data:
            node_data['user_id'] = self.user_id
        
        # Get node class
        node_class = NODE_REGISTRY.get(node_type)
        if not node_class:
            raise Exception(f"Unknown node type: {node_type}")
        
        # Create node instance
        context = {
            'workflow_id': self.workflow.id,
            'user_id': self.user_id,
            'execution_id': self.execution_id,
            'test_mode': test_mode
        }
        print(f"DEBUG: Executing node {node_id} ({node_type}) for user {self.user_id}. test_mode={test_mode}")
        node = node_class(node_id=node_id, config=node_data, context=context)
        
        # Get input data from previous nodes
        input_data = self._get_node_inputs(node_id)
        
        # Create log entry
        log = NodeExecutionLog(
            execution_id=self.execution_id,
            node_id=node_id,
            node_type=node_type,
            status='running',
            input_data=input_data or {}
        )
        db.add(log)
        await db.commit()
        
        try:
            # Execute node
            result = await node.run(input_data)
            
            # Update log
            log.status = 'completed' if result['success'] else 'failed'
            log.output_data = result['output']
            log.error_message = result.get('error')
            log.execution_time_ms = result['execution_time_ms']
            
            # Store output for next nodes
            if result['success']:
                self.node_outputs[node_id] = result['output']
            
            await db.commit()
            
        except Exception as e:
            # Update log with error
            log.status = 'failed'
            log.error_message = str(e)
            await db.commit()
            raise e
    
    def _get_node_inputs(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get input data for a node from previous nodes"""
        # For now, return all previous outputs
        # TODO: Implement proper connection-based data flow
        if self.node_outputs:
            # Return the last node's output
            return list(self.node_outputs.values())[-1] if self.node_outputs else None
        return None
