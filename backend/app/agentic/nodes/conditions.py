"""
Condition and logic nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional


class IfElseNode(BaseNode):
    """Conditional branching node"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Get values to compare
        value_a = self.config.get('value_a')
        value_b = self.config.get('value_b')
        operator = self.config.get('operator', '>')
        
        # If values not in config, try to get from input
        if value_a is None and input_data:
            value_a = input_data.get('value_a')
        if value_b is None and input_data:
            value_b = input_data.get('value_b')
        
        # Convert to float for comparison
        try:
            value_a = float(value_a)
            value_b = float(value_b)
        except (TypeError, ValueError):
            raise Exception(f"Cannot compare values: {value_a} and {value_b}")
        
        # Perform comparison
        result = False
        if operator == '>':
            result = value_a > value_b
        elif operator == '<':
            result = value_a < value_b
        elif operator == '>=':
            result = value_a >= value_b
        elif operator == '<=':
            result = value_a <= value_b
        elif operator == '==':
            result = value_a == value_b
        elif operator == '!=':
            result = value_a != value_b
        else:
            raise Exception(f"Unknown operator: {operator}")
        
        return {
            'condition_met': result,
            'value_a': value_a,
            'value_b': value_b,
            'operator': operator,
            'branch': 'true' if result else 'false'
        }
    
    def get_outputs(self) -> list:
        return ['condition_met', 'value_a', 'value_b', 'operator', 'branch']


class CompareNode(BaseNode):
    """Compare two values"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Similar to IfElse but simpler
        value_a = self.config.get('value_a', input_data.get('value_a') if input_data else None)
        value_b = self.config.get('value_b', input_data.get('value_b') if input_data else None)
        operator = self.config.get('operator', '>')
        
        try:
            value_a = float(value_a)
            value_b = float(value_b)
        except (TypeError, ValueError):
            raise Exception(f"Cannot compare values: {value_a} and {value_b}")
        
        # Perform comparison
        if operator == '>':
            result = value_a > value_b
        elif operator == '<':
            result = value_a < value_b
        elif operator == '>=':
            result = value_a >= value_b
        elif operator == '<=':
            result = value_a <= value_b
        elif operator == '==':
            result = value_a == value_b
        elif operator == '!=':
            result = value_a != value_b
        else:
            result = False
        
        return {
            'result': result,
            'value_a': value_a,
            'value_b': value_b
        }
    
    def get_outputs(self) -> list:
        return ['result', 'value_a', 'value_b']
