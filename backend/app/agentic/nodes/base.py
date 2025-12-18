"""
Base node class for all workflow nodes
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time


class BaseNode(ABC):
    """Base class for all workflow nodes"""
    
    def __init__(self, node_id: str, config: Dict[str, Any], context: Optional[Dict[str, Any]] = None):
        self.node_id = node_id
        self.config = config
        self.context = context or {}
        self.node_type = self.__class__.__name__
    
    @abstractmethod
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute the node logic
        
        Args:
            input_data: Data from previous nodes
            
        Returns:
            Output data for next nodes
        """
        pass
    
    async def run(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run the node with timing and error handling
        
        Returns:
            {
                'success': bool,
                'output': dict,
                'error': str (if failed),
                'execution_time_ms': int
            }
        """
        start_time = time.time()
        
        try:
            output = await self.execute(input_data)
            execution_time = int((time.time() - start_time) * 1000)
            
            return {
                'success': True,
                'output': output,
                'error': None,
                'execution_time_ms': execution_time
            }
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            
            return {
                'success': False,
                'output': {},
                'error': str(e),
                'execution_time_ms': execution_time
            }
    
    def validate_config(self) -> bool:
        """Validate node configuration"""
        return True
    
    def get_required_inputs(self) -> list:
        """Get list of required input keys"""
        return []
    
    def get_outputs(self) -> list:
        """Get list of output keys"""
        return []
