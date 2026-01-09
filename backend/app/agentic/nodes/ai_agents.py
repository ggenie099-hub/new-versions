"""
AI Agent Nodes - LLM-powered trading intelligence
Supports: Ollama (FREE), OpenAI, Groq (FREE tier), HuggingFace (FREE)
"""
from .base import BaseNode
from typing import Dict, Any, Optional
import httpx
import json
import os


class OllamaNode(BaseNode):
    """
    FREE Local LLM using Ollama
    Models: llama3, mistral, codellama, phi3, gemma
    Requires: Ollama installed locally (https://ollama.ai)
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        model = self.config.get('model', 'llama3')
        prompt = self.config.get('prompt', '')
        system_prompt = self.config.get('system_prompt', 'You are a professional forex trading analyst.')
        ollama_url = self.config.get('ollama_url', 'http://localhost:11434')
        
        # Replace variables in prompt
        if input_data:
            for key, value in input_data.items():
                prompt = prompt.replace(f'{{{key}}}', str(value))
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{ollama_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "system": system_prompt,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        'response': result.get('response', ''),
                        'model': model,
                        'success': True,
                        'tokens': result.get('eval_count', 0)
                    }
                else:
                    raise Exception(f"Ollama error: {response.text}")
                    
        except httpx.ConnectError:
            raise Exception("Ollama not running! Start with: ollama serve")
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['response', 'model', 'success', 'tokens']


class GroqNode(BaseNode):
    """
    FREE Cloud LLM using Groq (very fast!)
    Models: llama3-70b, mixtral-8x7b, gemma-7b
    Free tier: 30 requests/minute
    Get API key: https://console.groq.com
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        api_key = self.config.get('api_key', os.getenv('GROQ_API_KEY', ''))
        model = self.config.get('model', 'llama3-70b-8192')
        prompt = self.config.get('prompt', '')
        system_prompt = self.config.get('system_prompt', 'You are a professional forex trading analyst.')
        
        if not api_key:
            raise Exception("Groq API key required! Get free key at console.groq.com")
        
        # Replace variables in prompt
        if input_data:
            for key, value in input_data.items():
                prompt = prompt.replace(f'{{{key}}}', str(value))
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'response': result['choices'][0]['message']['content'],
                    'model': model,
                    'success': True,
                    'tokens': result.get('usage', {}).get('total_tokens', 0)
                }
            else:
                raise Exception(f"Groq error: {response.text}")
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['response', 'model', 'success', 'tokens']


class HuggingFaceNode(BaseNode):
    """
    FREE HuggingFace Inference API
    Models: mistralai/Mistral-7B, meta-llama/Llama-2-7b, etc.
    Free tier available
    Get API key: https://huggingface.co/settings/tokens
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        api_key = self.config.get('api_key', os.getenv('HF_API_KEY', ''))
        model = self.config.get('model', 'mistralai/Mistral-7B-Instruct-v0.2')
        prompt = self.config.get('prompt', '')
        
        if not api_key:
            raise Exception("HuggingFace API key required! Get free key at huggingface.co")
        
        # Replace variables in prompt
        if input_data:
            for key, value in input_data.items():
                prompt = prompt.replace(f'{{{key}}}', str(value))
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"inputs": prompt, "parameters": {"max_new_tokens": 500}}
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result[0].get('generated_text', '') if isinstance(result, list) else str(result)
                return {
                    'response': text,
                    'model': model,
                    'success': True
                }
            else:
                raise Exception(f"HuggingFace error: {response.text}")
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['response', 'model', 'success']


class OpenAINode(BaseNode):
    """
    OpenAI GPT Models (Paid)
    Models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
    Get API key: https://platform.openai.com
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        api_key = self.config.get('api_key', os.getenv('OPENAI_API_KEY', ''))
        model = self.config.get('model', 'gpt-4o-mini')
        prompt = self.config.get('prompt', '')
        system_prompt = self.config.get('system_prompt', 'You are a professional forex trading analyst.')
        
        if not api_key:
            raise Exception("OpenAI API key required!")
        
        # Replace variables in prompt
        if input_data:
            for key, value in input_data.items():
                prompt = prompt.replace(f'{{{key}}}', str(value))
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'response': result['choices'][0]['message']['content'],
                    'model': model,
                    'success': True,
                    'tokens': result.get('usage', {}).get('total_tokens', 0)
                }
            else:
                raise Exception(f"OpenAI error: {response.text}")
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['response', 'model', 'success', 'tokens']


class OpenRouterNode(BaseNode):
    """
    OpenRouter - Access 100+ models with one API
    Models: claude-3, gpt-4, llama-3, mistral, gemini, etc.
    FREE models available! Get API key: https://openrouter.ai
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        api_key = self.config.get('api_key', os.getenv('OPENROUTER_API_KEY', ''))
        model = self.config.get('model', 'meta-llama/llama-3-8b-instruct:free')
        prompt = self.config.get('prompt', '')
        system_prompt = self.config.get('system_prompt', 'You are a professional forex trading analyst.')
        
        if not api_key:
            raise Exception("OpenRouter API key required! Get key at openrouter.ai")
        
        # Replace variables in prompt
        if input_data:
            for key, value in input_data.items():
                prompt = prompt.replace(f'{{{key}}}', str(value))
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Trading Maven AI"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'response': result['choices'][0]['message']['content'],
                    'model': model,
                    'success': True,
                    'tokens': result.get('usage', {}).get('total_tokens', 0)
                }
            else:
                raise Exception(f"OpenRouter error: {response.text}")
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['response', 'model', 'success', 'tokens']


class AITradingAnalystNode(BaseNode):
    """
    Pre-built AI Trading Analyst
    Analyzes market data and gives BUY/SELL/HOLD recommendation
    Uses any configured LLM backend
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        llm_provider = self.config.get('llm_provider', 'ollama')  # ollama, groq, openai
        api_key = self.config.get('api_key', '')
        model = self.config.get('model', 'llama3')
        symbol = self.config.get('symbol', 'EURUSD')
        
        # Build analysis prompt
        analysis_prompt = f"""Analyze the following market data for {symbol} and provide a trading recommendation.

Market Data:
- Symbol: {symbol}
- Current Price: {input_data.get('price', 'N/A') if input_data else 'N/A'}
- RSI: {input_data.get('rsi', 'N/A') if input_data else 'N/A'}
- MACD: {input_data.get('macd', 'N/A') if input_data else 'N/A'}
- Trend: {input_data.get('trend', 'N/A') if input_data else 'N/A'}

Provide your analysis in this exact JSON format:
{{
    "recommendation": "BUY" or "SELL" or "HOLD",
    "confidence": 0-100,
    "entry_price": suggested entry price or null,
    "stop_loss": suggested SL in pips or null,
    "take_profit": suggested TP in pips or null,
    "reasoning": "brief explanation"
}}

Only respond with the JSON, no other text."""

        system_prompt = """You are an expert forex trading analyst with 20 years of experience. 
You analyze technical indicators and market conditions to provide precise trading recommendations.
Always be conservative with risk and never recommend trades with less than 60% confidence."""

        # Call appropriate LLM
        if llm_provider == 'ollama':
            ollama_url = self.config.get('ollama_url', 'http://localhost:11434')
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{ollama_url}/api/generate",
                    json={"model": model, "prompt": analysis_prompt, "system": system_prompt, "stream": False}
                )
                if response.status_code == 200:
                    ai_response = response.json().get('response', '')
                else:
                    raise Exception(f"Ollama error: {response.text}")
                    
        elif llm_provider == 'groq':
            if not api_key:
                raise Exception("Groq API key required!")
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": model or "llama3-70b-8192",
                        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": analysis_prompt}],
                        "temperature": 0.2
                    }
                )
                if response.status_code == 200:
                    ai_response = response.json()['choices'][0]['message']['content']
                else:
                    raise Exception(f"Groq error: {response.text}")
                    
        elif llm_provider == 'openai':
            if not api_key:
                raise Exception("OpenAI API key required!")
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": model or "gpt-4o-mini",
                        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": analysis_prompt}],
                        "temperature": 0.2
                    }
                )
                if response.status_code == 200:
                    ai_response = response.json()['choices'][0]['message']['content']
                else:
                    raise Exception(f"OpenAI error: {response.text}")
        else:
            raise Exception(f"Unknown LLM provider: {llm_provider}")
        
        # Parse AI response
        try:
            # Extract JSON from response
            json_start = ai_response.find('{')
            json_end = ai_response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                analysis = json.loads(ai_response[json_start:json_end])
            else:
                analysis = {"recommendation": "HOLD", "confidence": 0, "reasoning": ai_response}
        except json.JSONDecodeError:
            analysis = {"recommendation": "HOLD", "confidence": 0, "reasoning": ai_response}
        
        return {
            'recommendation': analysis.get('recommendation', 'HOLD'),
            'confidence': analysis.get('confidence', 0),
            'entry_price': analysis.get('entry_price'),
            'stop_loss': analysis.get('stop_loss'),
            'take_profit': analysis.get('take_profit'),
            'reasoning': analysis.get('reasoning', ''),
            'raw_response': ai_response,
            'symbol': symbol
        }
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['recommendation', 'confidence', 'entry_price', 'stop_loss', 'take_profit', 'reasoning']


class CustomAgentNode(BaseNode):
    """
    Build your own custom AI agent with custom prompts
    Define personality, trading style, and decision logic
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        llm_provider = self.config.get('llm_provider', 'ollama')
        api_key = self.config.get('api_key', '')
        model = self.config.get('model', 'llama3')
        
        # Custom agent configuration
        agent_name = self.config.get('agent_name', 'Trading Bot')
        agent_personality = self.config.get('agent_personality', 'professional and analytical')
        trading_style = self.config.get('trading_style', 'conservative scalper')
        risk_tolerance = self.config.get('risk_tolerance', 'low')
        custom_instructions = self.config.get('custom_instructions', '')
        user_prompt = self.config.get('prompt', 'Analyze the current market conditions.')
        
        # Build system prompt from agent config
        system_prompt = f"""You are {agent_name}, a {agent_personality} trading assistant.

Your Trading Style: {trading_style}
Risk Tolerance: {risk_tolerance}

{custom_instructions}

Always provide clear, actionable trading advice. When recommending trades, include:
- Entry price
- Stop loss (in pips)
- Take profit (in pips)
- Confidence level (0-100%)
- Brief reasoning"""

        # Replace variables in user prompt
        if input_data:
            for key, value in input_data.items():
                user_prompt = user_prompt.replace(f'{{{key}}}', str(value))
        
        # Call LLM based on provider
        if llm_provider == 'ollama':
            ollama_url = self.config.get('ollama_url', 'http://localhost:11434')
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{ollama_url}/api/generate",
                    json={"model": model, "prompt": user_prompt, "system": system_prompt, "stream": False}
                )
                if response.status_code == 200:
                    ai_response = response.json().get('response', '')
                else:
                    raise Exception(f"Ollama error: {response.text}")
                    
        elif llm_provider == 'groq':
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": model or "llama3-70b-8192",
                        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                        "temperature": 0.3
                    }
                )
                if response.status_code == 200:
                    ai_response = response.json()['choices'][0]['message']['content']
                else:
                    raise Exception(f"Groq error: {response.text}")
                    
        elif llm_provider == 'openai':
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": model or "gpt-4o-mini",
                        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                        "temperature": 0.3
                    }
                )
                if response.status_code == 200:
                    ai_response = response.json()['choices'][0]['message']['content']
                else:
                    raise Exception(f"OpenAI error: {response.text}")
        else:
            raise Exception(f"Unknown provider: {llm_provider}")
        
        return {
            'response': ai_response,
            'agent_name': agent_name,
            'model': model,
            'provider': llm_provider,
            'success': True
        }
    
    def get_required_inputs(self) -> list:
        return []
    
    def get_outputs(self) -> list:
        return ['response', 'agent_name', 'model', 'provider', 'success']


class AIDecisionNode(BaseNode):
    """
    AI-powered trade decision maker
    Takes AI analysis and converts to actionable trade parameters
    """
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not input_data:
            raise Exception("AI Decision node requires input from AI Analyst")
        
        recommendation = input_data.get('recommendation', 'HOLD')
        confidence = input_data.get('confidence', 0)
        min_confidence = float(self.config.get('min_confidence', 70))
        
        # Check if we should trade
        should_trade = recommendation in ['BUY', 'SELL'] and confidence >= min_confidence
        
        return {
            'should_trade': should_trade,
            'action': recommendation if should_trade else 'HOLD',
            'confidence': confidence,
            'meets_threshold': confidence >= min_confidence,
            'entry_price': input_data.get('entry_price'),
            'stop_loss': input_data.get('stop_loss'),
            'take_profit': input_data.get('take_profit'),
            'reasoning': input_data.get('reasoning', '')
        }
    
    def get_required_inputs(self) -> list:
        return ['recommendation', 'confidence']
    
    def get_outputs(self) -> list:
        return ['should_trade', 'action', 'confidence', 'entry_price', 'stop_loss', 'take_profit']
