# ✅ FINAL TradingView Setup - WORKING SOLUTION

## 🎯 Current Working Setup

### Services Running:
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:3000
- ✅ LocalTunnel: **https://nine-walls-sneeze.loca.lt**

---

## 📋 Step 1: Get Your API Key

1. Open: http://localhost:3000/dashboard/bridge
2. Copy your API key
3. Example: `2Q8AqaARhzWDFHxcQ4008g`

---

## 📋 Step 2: Setup TradingView Alert

### In TradingView Chart:
1. Right-click on chart → **Add Alert**
2. Set your conditions

### Alert Configuration:

#### **Notifications Tab:**
✅ Check **"Webhook URL"**

Paste this URL:
```
https://nine-walls-sneeze.loca.lt/api/webhook/tradingview
```

#### **Message Tab:**
Paste this JSON (replace YOUR_API_KEY):

**For BUY Signal:**
```json
{
  "api_key": "YOUR_API_KEY_HERE",
  "action": "BUY",
  "symbol": "{{ticker}}",
  "volume": 0.01,
  "stop_loss": {{close}} * 0.99,
  "take_profit": {{close}} * 1.01
}
```

**For SELL Signal:**
```json
{
  "api_key": "YOUR_API_KEY_HERE",
  "action": "SELL",
  "symbol": "{{ticker}}",
  "volume": 0.01,
  "stop_loss": {{close}} * 1.01,
  "take_profit": {{close}} * 0.99
}
```

**For CLOSE Signal:**
```json
{
  "api_key": "YOUR_API_KEY_HERE",
  "action": "CLOSE",
  "symbol": "{{ticker}}"
}
```

---

## 🧪 Step 3: Test the Webhook

### Test from Command Line:
```bash
curl -X POST https://nine-walls-sneeze.loca.lt/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "2Q8AqaARhzWDFHxcQ4008g",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

### Expected Response:
```json
{
  "status": "success",
  "action": "BUY",
  "symbol": "EURUSD",
  "ticket": 123456,
  "price": 1.15183,
  "volume": 0.01,
  "message": "BUY order executed successfully"
}
```

---

## 📊 Step 4: Monitor

### View Requests:
- Backend logs: Check terminal running `python run.py`
- Dashboard: http://localhost:3000/dashboard
- Notifications: http://localhost:3000/dashboard/notifications

### When Alert Triggers:
1. TradingView sends webhook
2. LocalTunnel forwards to backend
3. Backend places order in MT5
4. You see trade in dashboard
5. You get notification

---

## ⚠️ Important Notes

### LocalTunnel URL Changes:
- URL changes when you restart `lt`
- Current URL: `https://nine-walls-sneeze.loca.lt`
- Update TradingView if you restart

### Keep Running:
- Backend: `python run.py`
- Frontend: `npm run dev`
- LocalTunnel: `lt --port 8000`
- MT5 Terminal

### MT5 Must Be Connected:
- Check dashboard shows "Connected" (green)
- If not, click "Refresh" on account card

---

## 🎯 Complete Example

### TradingView Alert Settings:

**Condition:** Price crosses above 1.15000

**Notifications Tab:**
- ✅ Webhook URL: `https://nine-walls-sneeze.loca.lt/api/webhook/tradingview`

**Message Tab:**
```json
{
  "api_key": "2Q8AqaARhzWDFHxcQ4008g",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": 1.14,
  "take_profit": 1.16
}
```

---

## 🔍 Troubleshooting

### No trade placed?
1. Check backend logs for errors
2. Check MT5 is running and connected
3. Check API key is correct
4. Test webhook with curl command

### Wrong symbol?
- Use MT5 format: "EURUSD" not "EUR/USD"
- Check symbol exists in your MT5

### Order rejected?
- Check volume is valid (min 0.01)
- Check margin is sufficient
- Check symbol is tradeable

---

## 📞 Quick Test

Run this to test everything:

```bash
curl -X POST https://nine-walls-sneeze.loca.lt/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "2Q8AqaARhzWDFHxcQ4008g",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

If you get success response, everything is working! ✅

---

## 🚀 You're All Set!

1. ✅ LocalTunnel running
2. ✅ Backend running
3. ✅ Frontend running
4. ✅ MT5 connected

Now create your TradingView alert and start automated trading! 🎉

