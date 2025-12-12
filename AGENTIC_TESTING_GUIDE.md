# 🧪 Agentic System Testing Guide

## ✅ Phase 1 Complete - Ready to Test!

---

## 🚀 Quick Start

### 1. Access Agentic System

**URL**: http://localhost:3000/dashboard/agentic

**Steps:**
1. Login to your dashboard
2. Click "Agentic Automations" in sidebar (Workflow icon)
3. You'll see the workflows page

---

## 📋 Test Scenarios

### Test 1: View Available Nodes

**API Endpoint:**
```bash
curl http://localhost:8000/api/agentic/nodes/types
```

**Expected Result:**
- Should return 17 nodes
- Categories: Market Data, Indicators, Risk Management, Orders, etc.

---

### Test 2: Create Sample Workflow

**Steps:**
1. Go to http://localhost:3000/dashboard/agentic
2. Click "Create Sample" button
3. A sample workflow will be created

**Expected Result:**
- New workflow appears in list
- Name: "Simple Price Alert"
- Status: Inactive

---

### Test 3: Execute Workflow

**Steps:**
1. Click "Execute Now" on any workflow
2. Wait for execution

**Expected Result:**
- Alert shows execution ID
- Check notifications for result

---

### Test 4: Visual Workflow Builder

**Steps:**
1. Click "Create New Workflow"
2. You'll see the workflow builder
3. Add nodes from left panel
4. Configure nodes
5. Save workflow

**Expected Result:**
- Can add nodes by clicking
- Can configure node data (JSON)
- Can save workflow

---

### Test 5: Test Individual Nodes

**RSI Node Test:**
```bash
curl -X POST http://localhost:8000/api/agentic/nodes/test \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "RSI",
    "config": {"period": 14, "overbought": 70, "oversold": 30},
    "input_data": {
      "prices": [1.0850, 1.0855, 1.0860, 1.0858, 1.0862, 1.0865, 1.0870, 1.0868, 1.0872, 1.0875, 1.0880, 1.0878, 1.0882, 1.0885, 1.0890]
    }
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "output": {
    "rsi": 83.67,
    "signal": "overbought",
    "period": 14
  },
  "execution_time_ms": 1
}
```

---

**MACD Node Test:**
```bash
curl -X POST http://localhost:8000/api/agentic/nodes/test \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "MACD",
    "config": {"fast_period": 12, "slow_period": 26, "signal_period": 9},
    "input_data": {
      "prices": [1.0850, 1.0851, 1.0852, 1.0853, 1.0854, 1.0855, 1.0856, 1.0857, 1.0858, 1.0859, 1.0860, 1.0861, 1.0862, 1.0863, 1.0864, 1.0865, 1.0866, 1.0867, 1.0868, 1.0869, 1.0870, 1.0871, 1.0872, 1.0873, 1.0874, 1.0875, 1.0876, 1.0877, 1.0878, 1.0879, 1.0880, 1.0881, 1.0882, 1.0883, 1.0884, 1.0885, 1.0886, 1.0887, 1.0888, 1.0889, 1.0890]
    }
  }'
```

---

**Risk/Reward Calculator Test:**
```bash
curl -X POST http://localhost:8000/api/agentic/nodes/test \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "RiskRewardCalculator",
    "config": {"min_rr_ratio": 2.0},
    "input_data": {
      "entry_price": 1.0850,
      "stop_loss": 1.0800,
      "take_profit": 1.0950
    }
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "output": {
    "risk_reward_ratio": 2.0,
    "risk_pips": 50.0,
    "reward_pips": 100.0,
    "recommendation": "TAKE_TRADE"
  }
}
```

---

## 🎯 Example Workflows to Create

### Workflow 1: RSI Oversold Strategy

**Nodes:**
1. Get Live Price (EURUSD)
2. RSI (period: 14, oversold: 30)
3. If/Else (condition: signal == 'oversold')
4. Position Sizer (risk: 1%)
5. Market Order (BUY)

**Logic:**
- Get current EURUSD price
- Calculate RSI
- If RSI is oversold, calculate position size
- Place BUY order

---

### Workflow 2: Risk Check Before Trade

**Nodes:**
1. Daily Loss Limit (limit: $100)
2. Max Positions (max: 5)
3. Risk/Reward Calculator (min R:R: 2.0)
4. If/Else (all checks pass)
5. Market Order

**Logic:**
- Check if daily loss limit reached
- Check if max positions reached
- Check if R:R ratio is acceptable
- If all pass, place order

---

### Workflow 3: MACD Crossover Strategy

**Nodes:**
1. Get Historical Data (EURUSD, H1, 50 bars)
2. MACD (12, 26, 9)
3. If/Else (crossover == 'bullish')
4. Position Sizer
5. Market Order (BUY)

---

## 🔍 Debugging

### Check Backend Logs:
```bash
# Backend is running on process ID 1
# Check logs in terminal
```

### Check Frontend Logs:
- Open browser console (F12)
- Check for errors
- Network tab for API calls

### Check Database:
```bash
cd backend
python check_users.py
```

---

## 📊 Available Nodes (17 Total)

### Market Data (3):
- GetLivePrice
- GetAccountInfo
- GetHistoricalData

### Technical Indicators (5):
- RSI
- MACD
- MovingAverage
- BollingerBands
- ATR

### Risk Management (5):
- PositionSizer
- RiskRewardCalculator
- DrawdownMonitor
- DailyLossLimit
- MaxPositions

### Conditions (2):
- IfElse
- Compare

### Orders (2):
- MarketOrder
- ClosePosition

### Notifications (1):
- DashboardNotification

---

## ✅ Success Checklist

- [ ] Can access /dashboard/agentic page
- [ ] Can see "Agentic Automations" in sidebar
- [ ] Can create sample workflow
- [ ] Can execute workflow
- [ ] Can access workflow builder
- [ ] Can add nodes in builder
- [ ] Can save workflow
- [ ] API endpoints working
- [ ] Node tests passing

---

## 🐛 Common Issues

### Issue 1: "Agentic Automations" not in sidebar
**Solution:** Refresh page, check if logged in

### Issue 2: Builder page not loading
**Solution:** Already fixed! Page created.

### Issue 3: Nodes not showing in builder
**Solution:** Check API endpoint: http://localhost:8000/api/agentic/nodes/types

### Issue 4: Workflow execution fails
**Solution:** Check if MT5 is connected (some nodes need MT5)

---

## 📞 Need Help?

1. Check backend logs (process 1)
2. Check frontend logs (browser console)
3. Test API endpoints with curl
4. Run: `python backend/test_new_nodes.py`

---

## 🎉 What's Working

✅ Backend API (17 nodes registered)
✅ Frontend pages (list + builder)
✅ Node testing endpoint
✅ Workflow CRUD operations
✅ Sample workflow creation
✅ Workflow execution

---

## 🚀 Next Steps

After testing Phase 1:
1. Confirm everything works
2. Start Phase 2 (Advanced Visual Builder with React Flow)
3. Add more node types
4. Add backtesting engine

---

**Ready to test!** 🎯

Open: http://localhost:3000/dashboard/agentic
