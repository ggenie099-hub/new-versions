# 🚀 Quick Setup - TradingView to MT5

## ✅ Current Status

### Running Services:
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:3000
- ✅ Ngrok: https://3c012e803c56.ngrok-free.app

---

## 📋 Step 1: Get Your API Key

1. Open: http://localhost:3000/dashboard/bridge
2. Copy your API key (example: `2Q8AqaARhzWDFHxcQ4008g`)

---

## 📋 Step 2: Setup TradingView Alert

### In TradingView Chart:
1. Right-click → **Add Alert**
2. Set your conditions (price, indicator, etc.)

### In Alert Settings:

#### **Notifications Tab:**
- ✅ Check **"Webhook URL"**
- Paste: `https://3c012e803c56.ngrok-free.app/api/webhook/tradingview`

#### **Message Tab:**
Paste this JSON (replace YOUR_API_KEY):

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

**For SELL orders:**
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

**To CLOSE positions:**
```json
{
  "api_key": "YOUR_API_KEY_HERE",
  "action": "CLOSE",
  "symbol": "{{ticker}}"
}
```

---

## 📋 Step 3: Test It!

### Option 1: Test from Browser
Visit: https://3c012e803c56.ngrok-free.app/api/webhook/test

Should show:
```json
{
  "status": "ok",
  "message": "TradingView webhook endpoint is working"
}
```

### Option 2: Test with Real Order
1. Create alert in TradingView
2. Trigger the alert (or wait for condition)
3. Check dashboard for new trade
4. Check notifications

---

## 🔍 Monitoring

### View Webhook Requests:
Open: http://localhost:4040
- Shows all incoming requests
- Shows request/response details
- Great for debugging

### View Backend Logs:
Check the terminal running `python run.py`
- Shows all API calls
- Shows errors if any

---

## ⚠️ Important Notes

### Ngrok URL Changes:
- Free ngrok URL changes when you restart ngrok
- Update TradingView webhook URL if you restart ngrok
- Current URL: `https://3c012e803c56.ngrok-free.app`

### MT5 Must Be Running:
- Keep MT5 terminal open
- Account must show "Connected" in dashboard
- If disconnected, click "Refresh" on account card

### API Key Security:
- Don't share your API key
- Regenerate if compromised
- Each user has unique API key

---

## 🎯 Quick Test Command

Test webhook from command line:

```bash
curl -X POST https://3c012e803c56.ngrok-free.app/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

---

## 📱 What Happens When Alert Triggers?

1. TradingView sends webhook to ngrok URL
2. Ngrok forwards to your local backend
3. Backend validates API key
4. Backend logs into MT5
5. Backend places order
6. Backend creates trade record
7. Backend sends notification
8. You see trade in dashboard!

---

## 🐛 Troubleshooting

### No trade placed?
1. Check MT5 is running
2. Check account is connected (green status)
3. Check API key is correct
4. Check backend logs for errors
5. Check ngrok dashboard at http://localhost:4040

### Wrong symbol?
- Use MT5 symbol format (e.g., "EURUSD" not "EUR/USD")
- Check symbol is available in your MT5

### Order rejected?
- Check volume is valid (minimum 0.01)
- Check margin is sufficient
- Check symbol is tradeable

---

## 📞 Need Help?

1. Check TRADINGVIEW_WEBHOOK_DEBUG.md for detailed debugging
2. Check backend logs for error messages
3. Check ngrok dashboard for request details
4. Verify MT5 connection in dashboard

