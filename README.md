# 🚀 Trading Maven - AI-Powered MT5 Trading Platform

Advanced trading platform with AI agents, visual workflow automation, and TradingView integration for MetaTrader 5.

## ✨ Key Features

### 🤖 AI Trading Agents (NEW!)
- **Ollama** - FREE local LLM (llama3, mistral, phi3)
- **Groq** - FREE cloud LLM (30 req/min free tier)
- **OpenRouter** - 100+ models with FREE options
- **HuggingFace** - FREE inference API
- **OpenAI** - GPT-4o, GPT-4o-mini
- **Custom Agent Builder** - Create your own AI trading personality

### 📊 AI Trading Intelligence Dashboard
- Real-time market regime detection (Trending/Ranging/Choppy)
- AI Trade Readiness score with confidence meter
- Risk status monitoring with drawdown alerts
- Session intelligence (London/NY/Asia overlap detection)
- Smart position sizing recommendations

### 🔗 Agentic Workflow System
- N8N-style visual workflow builder
- 40+ pre-built nodes across 10 categories
- Drag & drop node connections
- Real-time execution console
- Pre-built strategy templates

### 📈 Core Trading Features
- TradingView webhook integration
- Real-time MT5 account sync
- Live positions & trade history
- Multi-account support
- Auto-sync with configurable intervals

## 🏗️ Tech Stack

| Backend | Frontend |
|---------|----------|
| FastAPI | Next.js 14 |
| SQLAlchemy | TypeScript |
| MetaTrader5 | Tailwind CSS |
| SQLite | ReactFlow |
| Alembic | Zustand |

## 📦 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Dashboard
- Open: http://localhost:3000
- Login: admin@autotrading.com / password123

## 🤖 AI Agent Setup

### FREE Options (No Cost)

**Option 1: Ollama (Local)**
```bash
# Install from https://ollama.ai
ollama pull llama3
ollama serve
```

**Option 2: Groq (Cloud)**
1. Get FREE API key: https://console.groq.com
2. Add key in node config

**Option 3: OpenRouter**
1. Get API key: https://openrouter.ai
2. Use FREE models: `llama-3-8b:free`, `mistral-7b:free`

## 📋 Available Node Categories

| Category | Nodes |
|----------|-------|
| **Triggers** | Manual, Schedule, Price, Indicator, Webhook |
| **Market Data** | GetLivePrice, GetAccountInfo |
| **Indicators** | RSI, MACD, Moving Average, Bollinger Bands, ATR |
| **Conditions** | If/Else, Compare |
| **Risk Management** | Position Sizer, Drawdown Monitor, Daily Loss Limit |
| **Orders** | Market Order, Close Position |
| **AI Agents** | Ollama, Groq, OpenRouter, OpenAI, Custom Agent |
| **Notifications** | Dashboard Notification |
| **Memory** | Set State, Get State |
| **News** | Fetch News, Sentiment Analysis |

## 🎯 Pre-built Strategy Templates

### Trading Strategies
- RSI Scalper Bot
- MACD Crossover Bot
- Bollinger Bounce Bot
- Quick BUY/SELL Bot
- Gold Scalper Bot

### AI Strategies
- AI Trader (FREE Ollama)
- AI Trader (FREE Groq)
- Custom AI Agent Builder

### Risk & Reports
- Risk Check Bot
- Drawdown Monitor
- Account Status Report

## 🔧 Environment Variables

Create `backend/.env`:
```env
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-fernet-key
DATABASE_URL=sqlite:///./trading_maven.db

# Optional AI Keys
GROQ_API_KEY=your-groq-key
OPENROUTER_API_KEY=your-openrouter-key
OPENAI_API_KEY=your-openai-key
```

## 📖 TradingView Webhook Format

```json
{
  "api_key": "your-api-key",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": 50,
  "take_profit": 100
}
```

## 🔒 Security Features

- JWT authentication
- Encrypted MT5 credentials (Fernet)
- API key authentication for webhooks
- CORS protection
- Secure password hashing (bcrypt)

## 📁 Project Structure

```
trading-maven/
├── backend/
│   ├── app/
│   │   ├── agentic/
│   │   │   ├── nodes/        # All node implementations
│   │   │   ├── engine/       # Workflow executor
│   │   │   └── routers/      # API endpoints
│   │   ├── analytics/        # AI analytics engine
│   │   ├── routers/          # Core API endpoints
│   │   └── mt5_handler.py    # MT5 integration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/dashboard/    # Dashboard pages
│   │   ├── components/       # React components
│   │   └── store/            # Zustand state
│   └── package.json
└── docs/                     # Documentation
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MT5 not connecting | Ensure MT5 terminal is running with AutoTrading enabled |
| Orders failing | Check margin, enable "Allow algorithmic trading" |
| AI not responding | Check Ollama is running (`ollama serve`) |
| Webhook not working | Verify tunnel URL and API key |

## 📚 Documentation

- [Agentic System Guide](docs/AGENTIC_README.md)
- [TradingView Setup](docs/WORKING_TRADINGVIEW_SETUP.md)
- [Complete Setup](docs/COMPLETE_SETUP_SUMMARY.md)

---

**Built with ❤️ for algorithmic traders**

