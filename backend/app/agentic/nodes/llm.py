"""
LLM and AI Integration Nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
import os
import json


class OpenAIAnalysisNode(BaseNode):
    """Analyze market data using OpenAI GPT"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Use OpenAI to analyze market conditions
        
        Config:
            api_key: OpenAI API key (optional, uses env var)
            model: Model to use (default: gpt-3.5-turbo)
            prompt: Analysis prompt template
        
        Input:
            market_data: Current market data to analyze
        
        Output:
            analysis: AI-generated analysis
            recommendation: BUY/SELL/HOLD
            confidence: Confidence score (0-1)
        """
        try:
            import openai
        except ImportError:
            raise Exception("OpenAI package not installed. Run: pip install openai")
        
        api_key = self.config.get('api_key') or os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise Exception("OpenAI API key not configured. Set OPENAI_API_KEY in .env")
        
        model = self.config.get('model', 'gpt-3.5-turbo')
        prompt_template = self.config.get('prompt', 
            'Analyze this forex market data and provide a trading recommendation (BUY/SELL/HOLD): {data}')
        
        # Get market data from input
        market_data = input_data or {}
        prompt = prompt_template.format(data=json.dumps(market_data, indent=2))
        
        # Call OpenAI API
        openai.api_key = api_key
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a professional forex trader with 10 years of experience. Analyze market data and provide clear, actionable trading recommendations."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        analysis = response.choices[0].message.content
        
        # Parse recommendation from response
        analysis_lower = analysis.lower()
        recommendation = 'HOLD'
        confidence = 0.5
        
        if 'strong buy' in analysis_lower or 'strongly recommend buy' in analysis_lower:
            recommendation = 'BUY'
            confidence = 0.9
        elif 'buy' in analysis_lower:
            recommendation = 'BUY'
            confidence = 0.7
        elif 'strong sell' in analysis_lower or 'strongly recommend sell' in analysis_lower:
            recommendation = 'SELL'
            confidence = 0.9
        elif 'sell' in analysis_lower:
            recommendation = 'SELL'
            confidence = 0.7
        
        return {
            'analysis': analysis,
            'recommendation': recommendation,
            'confidence': confidence,
            'model': model,
            'tokens_used': response.usage.total_tokens
        }
    
    def get_required_inputs(self) -> list:
        return ['market_data']
    
    def get_outputs(self) -> list:
        return ['analysis', 'recommendation', 'confidence']


class LocalLLMNode(BaseNode):
    """Use local LLM via Ollama for analysis"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Use local LLM (Ollama) for market analysis
        
        Config:
            model: Model name (llama2, mistral, etc.)
            prompt: Analysis prompt template
            ollama_url: Ollama API URL (default: http://localhost:11434)
        
        Input:
            market_data: Market data to analyze
        
        Output:
            analysis: AI-generated analysis
            model: Model used
            local: True (indicates local model)
        """
        try:
            import requests
        except ImportError:
            raise Exception("Requests package not installed")
        
        model = self.config.get('model', 'llama2')
        prompt_template = self.config.get('prompt',
            'Analyze this forex market data and provide a trading recommendation: {data}')
        ollama_url = self.config.get('ollama_url', 'http://localhost:11434')
        
        market_data = input_data or {}
        prompt = prompt_template.format(data=json.dumps(market_data, indent=2))
        
        try:
            # Call Ollama API
            response = requests.post(
                f'{ollama_url}/api/generate',
                json={
                    'model': model,
                    'prompt': prompt,
                    'stream': False
                },
                timeout=30
            )
            
            if not response.ok:
                raise Exception(f"Ollama API error: {response.status_code}")
            
            result = response.json()
            analysis = result.get('response', '')
            
            # Parse recommendation
            analysis_lower = analysis.lower()
            recommendation = 'HOLD'
            if 'buy' in analysis_lower and 'sell' not in analysis_lower:
                recommendation = 'BUY'
            elif 'sell' in analysis_lower:
                recommendation = 'SELL'
            
            return {
                'analysis': analysis,
                'recommendation': recommendation,
                'model': model,
                'local': True,
                'ollama_url': ollama_url
            }
            
        except requests.exceptions.ConnectionError:
            raise Exception(f"Cannot connect to Ollama at {ollama_url}. Make sure Ollama is running.")
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    def get_required_inputs(self) -> list:
        return ['market_data']
    
    def get_outputs(self) -> list:
        return ['analysis', 'recommendation', 'model', 'local']


class TelegramNotificationNode(BaseNode):
    """Send notifications via Telegram bot"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send Telegram message
        
        Config:
            bot_token: Telegram bot token (optional, uses env var)
            chat_id: Chat ID to send to (optional, uses env var)
            message: Message template
        
        Input:
            Any data to include in message
        
        Output:
            sent: Whether message was sent successfully
            message_id: Telegram message ID
        """
        try:
            import requests
        except ImportError:
            raise Exception("Requests package not installed")
        
        bot_token = self.config.get('bot_token') or os.getenv('TELEGRAM_BOT_TOKEN')
        chat_id = self.config.get('chat_id') or os.getenv('TELEGRAM_CHAT_ID')
        message_template = self.config.get('message', '🤖 Trading Alert\n\n{data}')
        
        if not bot_token or not chat_id:
            raise Exception("Telegram bot_token and chat_id not configured")
        
        # Format message with input data
        message = message_template.format(data=json.dumps(input_data or {}, indent=2))
        
        # Send via Telegram
        response = requests.post(
            f'https://api.telegram.org/bot{bot_token}/sendMessage',
            json={
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML'
            },
            timeout=10
        )
        
        if not response.ok:
            raise Exception(f"Telegram API error: {response.status_code}")
        
        result = response.json()
        
        return {
            'sent': True,
            'message_id': result.get('result', {}).get('message_id'),
            'chat_id': chat_id
        }
    
    def get_outputs(self) -> list:
        return ['sent', 'message_id', 'chat_id']
