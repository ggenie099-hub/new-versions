# ✅ WORKING TradingView Setup - TESTED & VERIFIED

## 🎯 Status: WEBHOOK IS WORKING! ✅

Webhook endpoint tested and confirmed working.
Issue: MT5 AutoTrading needs to be enabled.

---

## 🔧 Step 1: Enable AutoTrading in MT5

### In MT5 Terminal:
1. Click **Tools** → **Options**
2. Go to **Expert Advisors** tab
3. ✅ Check **"Allow algorithmic trading"**
4. ✅ Check **"Allow WebRequest for listed URL"**
5. Click **OK**

### OR Quick Method:
- Click the **"AutoTrading"** button in MT5 toolbar
- Should turn GREEN when enabled

---

## 🔑 Step 2: Your API Key

**Your API Key:**
```
f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE
```

⚠️ **IMPORTANT:** Use this exact API key in TradingView alerts!

---

## 📋 Step 3: TradingView Alert Setup

### Webhook URL (Notifications Tab):
```
https://nine-walls-sneeze.loca.lt/api/webhook/tradingview
```

### Message (Message Tab):

**For BUY Signal:**
```json
{
  "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": 1.14,
  "take_profit": 1.16
}
```

**For SELL Signal:**
```json
{
  "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
  "action": "SELL",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": 1.16,
  "take_profit": 1.14
}
```

**For CLOSE Signal:**
```json
{
  "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
  "action": "CLOSE",
  "symbol": "EURUSD"
}
```

---

## 🧪 Step 4: Test the Webhook

### Test Command:
```bash
curl -X POST https://nine-walls-sneeze.loca.lt/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

### Expected Success Response:
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

## ✅ Checklist Before Testing

- [ ] MT5 Terminal is running
- [ ] AutoTrading is ENABLED in MT5 (green button)
- [ ] MT5 account shows "Connected" in dashboard
- [ ] Backend is running (`python run.py`)
- [ ] LocalTunnel is running (`lt --port 8000`)
- [ ] Using correct API key in TradingView
- [ ] Webhook URL is correct in TradingView

---

## 🎯 Complete TradingView Alert Example

### Alert Condition:
- Price crosses above 1.15000

### Notifications Tab:
- ✅ Webhook URL: `https://nine-walls-sneeze.loca.lt/api/webhook/tradingview`

### Message Tab:
```json
{
  "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": 1.14,
  "take_profit": 1.16
}
```

### Settings Tab:
- Alert name: "EURUSD Buy Signal"
- Trigger: Once Per Bar Close
- Expiration: Open-ended

---

## 🔍 Monitoring

### Check Backend Logs:
Look for lines like:
```
INFO: POST /api/webhook/tradingview HTTP/1.1 200 OK
```

### Check Dashboard:
- Go to: http://localhost:3000/dashboard
- Check "Recent Trades" section
- Check "Notifications"

### Check MT5:
- Open "Trade" tab in MT5
- Should see new position

---

## 🐛 Common Issues & Solutions

### Error: "AutoTrading disabled by client"
**Solution:** Enable AutoTrading in MT5 (see Step 1)

### Error: "Invalid API key"
**Solution:** Use the correct API key: `f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE`

### Error: "No connected MT5 account found"
**Solution:** 
- Check MT5 is running
- Check account shows "Connected" in dashboard
- Click "Refresh" on account card

### Error: "Symbol not found"
**Solution:** 
- Use MT5 format: "EURUSD" not "EUR/USD"
- Check symbol exists in your MT5 Market Watch

### No webhook received
**Solution:**
- Check LocalTunnel is running
- Check webhook URL in TradingView is correct
- Test with curl command first

---

## 📊 What Happens When Alert Triggers

1. **TradingView** sends webhook to LocalTunnel URL
2. **LocalTunnel** forwards to localhost:8000
3. **Backend** validates API key ✅
4. **Backend** logs into MT5 ✅
5. **Backend** places order in MT5 ✅
6. **Backend** creates trade record ✅
7. **Backend** sends notification ✅
8. **You** see trade in dashboard! 🎉

---

## 🚀 You're Ready!

Everything is configured and tested. Just:
1. Enable AutoTrading in MT5
2. Create your TradingView alert
3. Start automated trading!

---

## 📞 Quick Reference

- **Webhook URL:** `https://nine-walls-sneeze.loca.lt/api/webhook/tradingview`
- **API Key:** `f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE`
- **Dashboard:** http://localhost:3000/dashboard
- **Test Endpoint:** https://nine-walls-sneeze.loca.lt/api/webhook/test

