# 🔌 Integrations Guide - MT5, LLM & External Tools

## Complete Guide for Connecting External Services

---

## 1️⃣ MT5 Integration (Already Working!)

### Current Status: ✅ Connected

Your MT5 is already integrated! Check connection:

```python
# backend/app/mt5_handler.py
# Already configured and working
```

### How to Use MT5 in Workflows:

**Available MT5 Nodes:**
1. **GetLivePrice** - Fetch current price
2. **GetAccountInfo** - Get balance, equity, margin
3. **MarketOrder** - Place buy/sell orders
4. **ClosePosition** - Close open positions

**Example Workflow:**
```
Manual Trigger → Get Live Price → Market Order
```

### MT5 Configuration:

**Location:** `backend/.env`
```env
# MT5 is auto-detected on your system
# No additional config needed!
```

---

## 2️⃣ LLM Integration (OpenAI, Local Models)

### Option A: OpenAI API

**Step 1: Add OpenAI Node**

Create: `backend/app/agentic/nodes/llm.py`

```python
"""
LLM Nodes for AI-powered trading decisions
"""
from .base import BaseNode
from typing import Dict, Any, Optional
import openai
import os


class OpenAIAnalysisNode(BaseNode):
    """Analyze market data using OpenAI GPT"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Use OpenAI to analyze market conditions
        
        Config:
            api_key: OpenAI API key
            model: Model to use (gpt-4, gpt-3.5-turbo)
            prompt: Analysis prompt
        
        Input:
            market_data: Current market data
        
        Output:
            analysis: AI analysis
            recommendation: BUY/SELL/HOLD
            confidence: Confidence score
        """
        api_key = self.config.get('api_key') or os.getenv('OPENAI_API_KEY')
        model = self.config.get('model', 'gpt-3.5-turbo')
        prompt_template = self.config.get('prompt', 'Analyze this market data: {data}')
        
        if not api_key:
            raise Exception("OpenAI API key not configured")
        
        # Get market data from input
        market_data = input_data.get('market_data', {}) if input_data else {}
        
        # Format prompt
        prompt = prompt_template.format(data=market_data)
        
        # Call OpenAI
        openai.api_key = api_key
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional forex trader. Analyze market data and provide trading recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        analysis = response.choices[0].message.content
        
        # Parse recommendation (simple keyword detection)
        recommendation = 'HOLD'
        if 'buy' in analysis.lower():
            recommendation = 'BUY'
        elif 'sell' in analysis.lower():
            recommendation = 'SELL'
        
        return {
            'analysis': analysis,
            'recommendation': recommendation,
            'confidence': 0.8,  # You can parse this from response
            'model': model
        }
```

**Step 2: Add to .env**
```env
OPENAI_API_KEY=sk-your-api-key-here
```

**Step 3: Register Node**
```python
# In backend/app/agentic/nodes/__init__.py
from .llm import OpenAIAnalysisNode

# In backend/app/agentic/engine/executor.py
NODE_REGISTRY = {
    # ... existing nodes
    'OpenAIAnalysis': OpenAIAnalysisNode,
}
```

---

### Option B: Local LLM (Ollama)

**Step 1: Install Ollama**
```bash
# Download from: https://ollama.ai
# Or use: curl https://ollama.ai/install.sh | sh
```

**Step 2: Pull Model**
```bash
ollama pull llama2
# or
ollama pull mistral
```

**Step 3: Create Local LLM Node**

```python
class LocalLLMNode(BaseNode):
    """Use local LLM via Ollama"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Use local LLM for analysis
        
        Config:
            model: Model name (llama2, mistral)
            prompt: Analysis prompt
            ollama_url: Ollama API URL (default: http://localhost:11434)
        """
        import requests
        
        model = self.config.get('model', 'llama2')
        prompt_template = self.config.get('prompt', 'Analyze: {data}')
        ollama_url = self.config.get('ollama_url', 'http://localhost:11434')
        
        market_data = input_data.get('market_data', {}) if input_data else {}
        prompt = prompt_template.format(data=market_data)
        
        # Call Ollama API
        response = requests.post(
            f'{ollama_url}/api/generate',
            json={
                'model': model,
                'prompt': prompt,
                'stream': False
            }
        )
        
        result = response.json()
        analysis = result.get('response', '')
        
        return {
            'analysis': analysis,
            'model': model,
            'local': True
        }
```

---

## 3️⃣ External API Integration

### Example: News API for Sentiment Analysis

**Create News Node:**

```python
class NewsAnalysisNode(BaseNode):
    """Fetch and analyze news sentiment"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Fetch news and analyze sentiment
        
        Config:
            api_key: News API key
            symbol: Trading symbol
            keywords: Keywords to search
        """
        import requests
        
        api_key = self.config.get('api_key') or os.getenv('NEWS_API_KEY')
        symbol = self.config.get('symbol', 'EUR')
        keywords = self.config.get('keywords', 'forex EUR USD')
        
        # Fetch news
        response = requests.get(
            'https://newsapi.org/v2/everything',
            params={
                'q': keywords,
                'apiKey': api_key,
                'language': 'en',
                'sortBy': 'publishedAt',
                'pageSize': 10
            }
        )
        
        news = response.json()
        articles = news.get('articles', [])
        
        # Simple sentiment analysis
        positive_words = ['bullish', 'growth', 'rise', 'gain', 'strong']
        negative_words = ['bearish', 'fall', 'drop', 'weak', 'decline']
        
        sentiment_score = 0
        for article in articles:
            text = (article.get('title', '') + ' ' + article.get('description', '')).lower()
            sentiment_score += sum(1 for word in positive_words if word in text)
            sentiment_score -= sum(1 for word in negative_words if word in text)
        
        sentiment = 'NEUTRAL'
        if sentiment_score > 2:
            sentiment = 'POSITIVE'
        elif sentiment_score < -2:
            sentiment = 'NEGATIVE'
        
        return {
            'sentiment': sentiment,
            'sentiment_score': sentiment_score,
            'articles_count': len(articles),
            'latest_headline': articles[0].get('title') if articles else None
        }
```

---

## 4️⃣ Telegram Bot Integration

**Create Telegram Node:**

```python
class TelegramNotificationNode(BaseNode):
    """Send notifications via Telegram"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send Telegram message
        
        Config:
            bot_token: Telegram bot token
            chat_id: Chat ID to send to
            message: Message template
        """
        import requests
        
        bot_token = self.config.get('bot_token') or os.getenv('TELEGRAM_BOT_TOKEN')
        chat_id = self.config.get('chat_id') or os.getenv('TELEGRAM_CHAT_ID')
        message_template = self.config.get('message', 'Trade Alert: {data}')
        
        # Format message with input data
        message = message_template.format(data=input_data or {})
        
        # Send via Telegram
        response = requests.post(
            f'https://api.telegram.org/bot{bot_token}/sendMessage',
            json={
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
        )
        
        return {
            'sent': response.ok,
            'message_id': response.json().get('result', {}).get('message_id')
        }
```

**Setup Telegram Bot:**
1. Message @BotFather on Telegram
2. Create new bot: `/newbot`
3. Get bot token
4. Get your chat ID: Message @userinfobot

**Add to .env:**
```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

## 5️⃣ Email Notifications

**Create Email Node:**

```python
class EmailNotificationNode(BaseNode):
    """Send email notifications"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send email
        
        Config:
            smtp_server: SMTP server
            smtp_port: SMTP port
            username: Email username
            password: Email password
            to_email: Recipient email
            subject: Email subject
            body: Email body template
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        smtp_server = self.config.get('smtp_server', 'smtp.gmail.com')
        smtp_port = self.config.get('smtp_port', 587)
        username = self.config.get('username') or os.getenv('EMAIL_USERNAME')
        password = self.config.get('password') or os.getenv('EMAIL_PASSWORD')
        to_email = self.config.get('to_email')
        subject = self.config.get('subject', 'Trading Alert')
        body_template = self.config.get('body', 'Alert: {data}')
        
        # Format body
        body = body_template.format(data=input_data or {})
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = username
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)
        
        return {
            'sent': True,
            'to': to_email,
            'subject': subject
        }
```

**Gmail Setup:**
1. Enable 2FA on Gmail
2. Generate App Password
3. Use app password in config

---

## 6️⃣ Database Integration

**Already Available!**

Use these nodes:
- **Save to Database** - Store custom data
- **Query Database** - Retrieve data
- **Update Record** - Modify data

**Example: Store Trade Signals**

```python
# Workflow:
# RSI Node → Save to Database
# Config: table_name = "trade_signals"
```

---

## 7️⃣ Webhook Integration

**Create Webhook Receiver:**

```python
# In backend/app/agentic/routers/webhooks.py
from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/agentic/webhooks", tags=["Webhooks"])

@router.post("/{workflow_id}")
async def receive_webhook(workflow_id: int, request: Request):
    """
    Receive webhook and trigger workflow
    """
    data = await request.json()
    
    # Trigger workflow with webhook data
    # ... execute workflow
    
    return {"success": True, "workflow_id": workflow_id}
```

**Use Case:**
- TradingView alerts
- External signals
- Third-party integrations

---

## 8️⃣ Configuration Management

### Centralized Config

**Create:** `backend/.env`

```env
# MT5 (Already configured)
MT5_LOGIN=your_login
MT5_PASSWORD=your_password
MT5_SERVER=your_server

# OpenAI
OPENAI_API_KEY=sk-your-key

# Telegram
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id

# Email
EMAIL_USERNAME=your@email.com
EMAIL_PASSWORD=your-app-password

# News API
NEWS_API_KEY=your-news-api-key

# Custom APIs
CUSTOM_API_KEY=your-custom-key
CUSTOM_API_URL=https://api.example.com
```

### Access in Nodes:

```python
import os

api_key = os.getenv('OPENAI_API_KEY')
```

---

## 9️⃣ Complete Example Workflows

### Workflow 1: AI-Powered Trading

```
Manual Trigger
  ↓
Get Live Price (EURUSD)
  ↓
OpenAI Analysis (Analyze market)
  ↓
If (recommendation == BUY)
  ↓
Position Sizer (1% risk)
  ↓
Market Order (BUY)
  ↓
Telegram Notification (Trade placed!)
```

### Workflow 2: News-Based Trading

```
Schedule Trigger (Every hour)
  ↓
News Analysis (Fetch sentiment)
  ↓
If (sentiment == POSITIVE)
  ↓
Get Live Price
  ↓
RSI Check
  ↓
Market Order
  ↓
Email Notification
```

### Workflow 3: Multi-Signal Strategy

```
Time Trigger (Every 15 min)
  ↓
Get Live Price
  ├→ RSI
  ├→ MACD
  └→ Moving Average
  ↓
Merge Signals
  ↓
Local LLM Analysis
  ↓
Risk Check
  ↓
Market Order
  ↓
Save to Database
```

---

## 🔟 Quick Setup Checklist

### For OpenAI:
- [ ] Get API key from platform.openai.com
- [ ] Add to .env: `OPENAI_API_KEY=sk-...`
- [ ] Create OpenAIAnalysisNode
- [ ] Register in executor
- [ ] Test in workflow

### For Local LLM:
- [ ] Install Ollama
- [ ] Pull model: `ollama pull llama2`
- [ ] Create LocalLLMNode
- [ ] Test with simple prompt

### For Telegram:
- [ ] Create bot with @BotFather
- [ ] Get bot token
- [ ] Get chat ID
- [ ] Add to .env
- [ ] Create TelegramNotificationNode

### For Email:
- [ ] Enable 2FA on Gmail
- [ ] Generate app password
- [ ] Add to .env
- [ ] Create EmailNotificationNode

---

## 📚 Resources

**OpenAI:** https://platform.openai.com/docs  
**Ollama:** https://ollama.ai  
**Telegram Bots:** https://core.telegram.org/bots  
**News API:** https://newsapi.org  
**MT5 Python:** https://www.mql5.com/en/docs/python_metatrader5

---

## 🆘 Need Help?

1. Check logs: `backend/logs/`
2. Test nodes individually
3. Use test mode in workflows
4. Check API quotas/limits

---

**Your system is ready for any integration!** 🚀
