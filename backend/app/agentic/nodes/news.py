"""
News and Sentiment Analysis Nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
import os
import json
import datetime

class NewsFetchNode(BaseNode):
    """Fetch recent market news and headlines"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Fetch news from an API or public source
        
        Config:
            api_key: NewsAPI key (optional)
            category: News category (trading, forex, business)
            symbol: Filter by symbol (e.g., EURUSD, BTC)
            limit: Number of headlines to fetch (default: 5)
        
        Output:
            headlines: List of news headlines
            news_data: Full news data objects
        """
        import requests
        
        api_key = self.config.get('api_key') or os.getenv('NEWS_API_KEY')
        symbol = self.config.get('symbol', input_data.get('symbol') if input_data else None)
        limit = self.config.get('limit', 5)
        
        # If no API key, use a mock source or public RSS-to-JSON
        if not api_key:
            # Mock news for development if no key is provided
            headlines = [
                f"Market analysis for {symbol or 'Majors'}: Volatility expected ahead of NFP",
                f"Central Bank official hints at potential rate cuts in Q1",
                f"{symbol or 'Forex'} technical outlook remains bullish on daily timeframe",
                "US Dollar Index softens as inflation data comes in lower than expected",
                "Global trade tensions ease as new negotiations begin"
            ]
            return {
                'headlines': headlines[:limit],
                'source': 'mock_data',
                'status': 'success'
            }
            
        try:
            # Example using NewsAPI.org
            url = f"https://newsapi.org/v2/everything?q={symbol or 'forex trading'}&pageSize={limit}&apiKey={api_key}"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if data['status'] == 'ok':
                articles = data.get('articles', [])
                headlines = [a['title'] for a in articles]
                return {
                    'headlines': headlines,
                    'news_data': articles,
                    'count': len(headlines)
                }
            else:
                raise Exception(f"NewsAPI error: {data.get('message')}")
                
        except Exception as e:
            raise Exception(f"Failed to fetch news: {str(e)}")

    def get_outputs(self) -> list:
        return ['headlines', 'news_data', 'count']

class SentimentAnalysisNode(BaseNode):
    """Analyze sentiment of news headlines using AI"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze sentiment
        
        Input:
            headlines: List of headlines to analyze
            
        Output:
            sentiment_score: Score from -1 (Bearish) to 1 (Bullish)
            sentiment_label: Bullish, Bearish, or Neutral
            analysis: Summary of the sentiment
        """
        if not input_data or 'headlines' not in input_data:
            raise Exception("Sentiment Analysis requires 'headlines' in input")
            
        headlines = input_data['headlines']
        
        # We can use the OpenAI logic if available, or a simple keyword-based analyzer
        # Let's try to use LLM if configured
        
        from app.agentic.nodes.llm import OpenAIAnalysisNode
        
        llm_node = OpenAIAnalysisNode(
            node_id="internal_llm", 
            config={
                'prompt': "Analyze the sentiment of these financial headlines and provide a combined sentiment score between -1 (very bearish) and 1 (very bullish). Response format: {{\"score\": 0.5, \"label\": \"Bullish\", \"analysis\": \"...\"}}\n\nHeadlines: {data}"
            },
            context=self.context
        )
        
        try:
            result = await llm_node.execute({'market_data': headlines})
            # Try to parse JSON from the LLM response
            analysis_text = result.get('analysis', '')
            
            # Simple fallback if LLM doesn't return JSON
            sentiment_score = 0
            sentiment_label = "Neutral"
            
            if "score" in analysis_text.lower():
                # Try to extract score using simple logic if not valid JSON
                import re
                scores = re.findall(r"[-+]?\d*\.\d+|\d+", analysis_text)
                if scores:
                    sentiment_score = float(scores[0])
            
            if sentiment_score > 0.2: sentiment_label = "Bullish"
            elif sentiment_score < -0.2: sentiment_label = "Bearish"
            
            return {
                'sentiment_score': sentiment_score,
                'sentiment_label': sentiment_label,
                'analysis': analysis_text
            }
        except Exception as e:
            # Fallback simple analyzer
            bullish_words = ['bullish', 'up', 'growth', 'gain', 'strong', 'buy', 'positive']
            bearish_words = ['bearish', 'down', 'decline', 'loss', 'weak', 'sell', 'negative']
            
            score = 0
            text = " ".join(headlines).lower()
            for word in bullish_words: score += text.count(word)
            for word in bearish_words: score -= text.count(word)
            
            normalized_score = max(-1, min(1, score / (len(headlines) * 2)))
            label = "Neutral"
            if normalized_score > 0.1: label = "Bullish"
            elif normalized_score < -0.1: label = "Bearish"
            
            return {
                'sentiment_score': normalized_score,
                'sentiment_label': label,
                'analysis': "Calculated using keyword analysis (fallback mode)."
            }

    def get_outputs(self) -> list:
        return ['sentiment_score', 'sentiment_label', 'analysis']
