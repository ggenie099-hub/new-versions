"""
Unified Diagnostic Script for New Agentic Trading Features
Tests: Persistence (Memory), News & Sentiment, and Smart Risk Management
"""
import asyncio
import os
import json
from app.agentic.nodes.memory import SetStateNode, GetStateNode
from app.agentic.nodes.news import NewsFetchNode, SentimentAnalysisNode
from app.agentic.nodes.risk_management import SmartRiskManagerNode
from app.agentic.models import Workflow
from app.models import User
from app.database import AsyncSessionLocal
from sqlalchemy import select

async def test_persistence():
    print("\n💾 Testing Persistence (Memory) Nodes...")
    
    # Mock context
    context = {'workflow_id': 999, 'user_id': 1}
    
    # 1. Test SetState
    setter = SetStateNode(node_id="test_setter", config={'key': 'trend', 'value': 'bullish'}, context=context)
    set_result = await setter.run()
    print(f"SetState Result: {set_result['success']}")
    
    # 2. Test GetState
    getter = GetStateNode(node_id="test_getter", config={'key': 'trend'}, context=context)
    get_result = await getter.run()
    print(f"GetState Result: {get_result['output']['value']} (Expected: bullish)")
    
    return get_result['output']['value'] == 'bullish'

async def test_news_and_sentiment():
    print("\n🗞️ Testing News & Sentiment Nodes...")
    
    context = {'workflow_id': 999, 'user_id': 1}
    
    # 1. Fetch News
    fetcher = NewsFetchNode(node_id="test_news", config={'symbol': 'EURUSD', 'limit': 3}, context=context)
    news_result = await fetcher.run()
    headlines = news_result['output'].get('headlines', [])
    print(f"Fetched {len(headlines)} headlines.")
    for h in headlines:
        print(f" - {h}")
        
    # 2. Analyze Sentiment
    analyzer = SentimentAnalysisNode(node_id="test_sentiment", config={}, context=context)
    sentiment_result = await analyzer.run({'headlines': headlines})
    
    output = sentiment_result['output']
    print(f"Sentiment Analysis: {output['sentiment_label']} (Score: {output['sentiment_score']})")
    print(f"Analysis: {output['analysis'][:100]}...")
    
    return sentiment_result['success']

async def test_smart_risk():
    print("\n⚖️ Testing Smart Risk Management Node...")
    
    context = {'workflow_id': 999, 'user_id': 1}
    
    # Test case: Good win rate, decent R:R
    input_data = {
        'win_rate': 0.65,
        'avg_win_loss': 1.5,
        'account_balance': 10000
    }
    
    risk_manager = SmartRiskManagerNode(
        node_id="test_risk", 
        config={'base_risk': 1.0, 'max_risk': 3.0, 'aggressiveness': 0.5}, 
        context=context
    )
    
    result = await risk_manager.run(input_data)
    output = result['output']
    
    print(f"Base Risk: 1.0%")
    print(f"Adjusted Risk: {output['adjusted_risk']}%")
    print(f"Kelly Fraction: {output['kelly_fraction']}")
    print(f"Risk Multiplier: {output['risk_multiplier']}x")
    
    return output['adjusted_risk'] > 1.0  # Should be higher due to good stats

async def run_all_tests():
    async with AsyncSessionLocal() as db:
        # Create dummy user if not exists
        result = await db.execute(select(User).filter(User.id == 1))
        if not result.scalar_one_or_none():
            u = User(id=1, username="testuser", email="test@example.com", hashed_password="pw")
            db.add(u)
            await db.commit()

        # Check if dummy workflow exists
        result = await db.execute(select(Workflow).filter(Workflow.id == 999))
        if not result.scalar_one_or_none():
            dummy = Workflow(id=999, user_id=1, name="Test Workflow", nodes=[], connections=[])
            db.add(dummy)
            try:
                await db.commit()
            except:
                await db.rollback()
    
    print("🚀 Starting Agentic Feature Diagnostics...")
    
    p_ok = await test_persistence()
    n_ok = await test_news_and_sentiment()
    r_ok = await test_smart_risk()
    
    print("\n" + "="*30)
    print(f"Persistence: {'✅ PASSED' if p_ok else '❌ FAILED'}")
    print(f"News & Sentiment: {'✅ PASSED' if n_ok else '❌ FAILED'}")
    print(f"Smart Risk: {'✅ PASSED' if r_ok else '❌ FAILED'}")
    print("="*30)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
