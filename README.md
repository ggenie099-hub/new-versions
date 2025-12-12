# 🚀 Trading Maven - TradingView to MT5 Bridge

Ultra-low latency trading platform connecting TradingView alerts to MetaTrader 5 with advanced automation features.

## ✨ Features

### Core Features
- 🔗 **TradingView Integration** - Webhook-based alert execution
- 📊 **MT5 Connection** - Real-time account and position sync
- 🤖 **Agentic Trading System** - N8N-style visual workflow automation
- 📈 **Live Dashboard** - Real-time positions, trades, and account monitoring
- 🔔 **Smart Notifications** - Trade alerts and system notifications
- 🔐 **Secure API** - JWT authentication with API key management

### Advanced Features
- ⚡ **Auto-Sync** - Configurable real-time position updates
- 🎯 **Smart Order Execution** - Automatic filling mode detection
- 📱 **Responsive UI** - Dark mode, mobile-friendly interface
- 🔄 **WebSocket Support** - Real-time updates without polling
- 🛡️ **Encrypted Credentials** - Secure MT5 account storage

## 🏗️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM with async support
- **MetaTrader5** - MT5 Python integration
- **SQLite** - Lightweight database
- **Alembic** - Database migrations

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **React Hot Toast** - Notifications

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- MetaTrader 5 Terminal
- ngrok or LocalTunnel (for webhooks)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Run migrations
alembic upgrade head

# Start server
python run.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Tunnel Setup (for TradingView webhooks)

```bash
# Option 1: LocalTunnel (Recommended)
npm install -g localtunnel
lt --port 8000

# Option 2: ngrok
ngrok http 8000
```

## 🚀 Quick Start

1. **Start Backend**
   ```bash
   cd backend && python run.py
   ```

2. **Start Frontend**
   ```bash
   cd frontend && npm run dev
   ```

3. **Start Tunnel**
   ```bash
   lt --port 8000
   ```

4. **Access Dashboard**
   - Open: http://localhost:3000
   - Login with your credentials

5. **Connect MT5 Account**
   - Go to "Add MT5 Account"
   - Enter your MT5 credentials
   - Click "Connect"

6. **Setup TradingView Webhook**
   - Copy webhook URL from tunnel
   - Copy API key from Bridge page
   - Create alert in TradingView
   - Add webhook URL and JSON payload

## 📖 Documentation

Detailed documentation available in `/docs`:

- [Complete Setup Guide](docs/COMPLETE_SETUP_SUMMARY.md)
- [TradingView Integration](docs/WORKING_TRADINGVIEW_SETUP.md)
- [Agentic System](docs/AGENTIC_README.md)
- [Troubleshooting](docs/TRADINGVIEW_WEBHOOK_DEBUG.md)

## 🔧 Configuration

### Environment Variables

Create `.env` file in backend directory:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./trading_maven.db
CORS_ORIGINS=http://localhost:3000
```

### TradingView Alert Format

```json
{
  "api_key": "your-api-key",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": 1.14,
  "take_profit": 1.16
}
```

## 🎯 Features Overview

### Dashboard
- Real-time account balance and equity
- Open positions with live P&L
- Recent trades history
- Auto-sync with configurable intervals

### TradingView Bridge
- Webhook URL generation
- API key management
- Alert setup instructions
- Test webhook functionality

### Agentic Automations
- Visual workflow builder
- Pre-built node types (Market Data, Orders, Conditions)
- Workflow execution history
- Manual and scheduled triggers

## 🔒 Security

- JWT-based authentication
- Encrypted MT5 credentials (Fernet)
- API key authentication for webhooks
- CORS protection
- Secure password hashing (bcrypt)

## 🐛 Troubleshooting

### Common Issues

**Webhook not working?**
- Check tunnel is running
- Verify webhook URL in TradingView
- Check API key is correct

**MT5 not connecting?**
- Ensure MT5 terminal is running
- Enable AutoTrading in MT5
- Check credentials are correct

**Orders failing?**
- Enable "Allow algorithmic trading" in MT5
- Check margin is sufficient
- Verify symbol is correct

See [Troubleshooting Guide](docs/TRADINGVIEW_WEBHOOK_DEBUG.md) for more details.

## 📊 Project Structure

```
trading-maven/
├── backend/
│   ├── app/
│   │   ├── agentic/          # Agentic system
│   │   ├── routers/          # API endpoints
│   │   ├── models.py         # Database models
│   │   ├── mt5_handler.py    # MT5 integration
│   │   └── main.py           # FastAPI app
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities
│   │   └── store/            # State management
│   └── package.json
└── docs/                     # Documentation
```

## 🤝 Contributing

This is a private project. For questions or suggestions, contact the development team.

## 📄 License

All rights reserved.

## 🙏 Acknowledgments

- MetaTrader 5 for trading platform
- TradingView for charting and alerts
- FastAPI and Next.js communities

---

**Built with ❤️ for algorithmic traders**

