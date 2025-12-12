# 🔍 TradingView Alert Not Working - Checklist

## Problem: Alert generated but not received in backend

---

## ✅ Step-by-Step Verification

### 1. Check Ngrok URL
**Current ngrok URL:** `https://3c012e803c56.ngrok-free.app`

Open this in browser: https://3c012e803c56.ngrok-free.app/api/webhook/test

**Expected response:**
```json
{
  "status": "ok",
  "message": "TradingView webhook endpoint is working"
}
```

❌ If you get error → Ngrok not working properly
✅ If you get JSON response → Ngrok is working

---

### 2. Check TradingView Alert Configuration

#### Open your alert in TradingView and verify:

**Notifications Tab:**
- [ ] "Webhook URL" checkbox is CHECKED ✅
- [ ] URL is: `https://3c012e803c56.ngrok-free.app/api/webhook/tradingview`
- [ ] NO extra spaces or characters
- [ ] Starts with `https://` (not `http://`)

**Message Tab:**
- [ ] Contains valid JSON
- [ ] API key is correct
- [ ] No syntax errors in JSON

---

### 3. Common TradingView Mistakes

#### ❌ WRONG - JSON in Webhook URL field:
```
https://3c012e803c56.ngrok-free.app/api/webhook/tradingview
{"api_key": "xxx", "action": "BUY"}  ← WRONG!
```

#### ✅ CORRECT Setup:

**Webhook URL field (Notifications tab):**
```
https://3c012e803c56.ngrok-free.app/api/webhook/tradingview
```

**Message field (Message tab):**
```json
{
  "api_key": "2Q8AqaARhzWDFHxcQ4008g",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01
}
```

---

### 4. Test Alert Manually

#### Option A: Test from TradingView
1. Create a simple alert: "Price crosses 1.0"
2. Set price to current price (so it triggers immediately)
3. Save alert
4. Wait 10 seconds
5. Check backend logs

#### Option B: Test with curl
```bash
curl -X POST https://3c012e803c56.ngrok-free.app/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "2Q8AqaARhzWDFHxcQ4008g",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

**Expected response:**
```json
{
  "status": "success",
  "action": "BUY",
  "symbol": "EURUSD",
  "ticket": 123456,
  "price": 1.15183,
  "message": "BUY order executed successfully"
}
```

---

### 5. Check Ngrok Dashboard

Open: http://localhost:4040

This shows ALL requests coming to ngrok.

**If you see requests:**
- ✅ TradingView is sending webhooks
- Check request details for errors

**If you DON'T see requests:**
- ❌ TradingView is not sending webhooks
- Check TradingView alert configuration
- Check webhook URL is correct

---

### 6. Verify API Key

Get your API key from dashboard:
1. Go to: http://localhost:3000/dashboard/bridge
2. Copy API key
3. Make sure it matches the one in TradingView alert

**Your current API key:** `2Q8AqaARhzWDFHxcQ4008g`

---

### 7. Check MT5 Connection

1. Go to: http://localhost:3000/dashboard
2. Check MT5 account status
3. Should show "Connected" (green)

If not connected:
- Make sure MT5 terminal is running
- Click "Refresh" button
- Re-add account if needed

---

## 🧪 Quick Test Script

Save this as `test_alert.json`:
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

Test with curl:
```bash
curl -X POST https://3c012e803c56.ngrok-free.app/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d @test_alert.json
```

---

## 📸 Screenshot Your TradingView Alert

Take screenshots of:
1. Alert conditions tab
2. Notifications tab (showing webhook URL)
3. Message tab (showing JSON)

This helps debug the issue.

---

## 🔧 TradingView Alert Template

### For BUY Signal:
```json
{
  "api_key": "2Q8AqaARhzWDFHxcQ4008g",
  "action": "BUY",
  "symbol": "{{ticker}}",
  "volume": 0.01,
  "stop_loss": {{close}} * 0.99,
  "take_profit": {{close}} * 1.01
}
```

### For SELL Signal:
```json
{
  "api_key": "2Q8AqaARhzWDFHxcQ4008g",
  "action": "SELL",
  "symbol": "{{ticker}}",
  "volume": 0.01,
  "stop_loss": {{close}} * 1.01,
  "take_profit": {{close}} * 0.99
}
```

### For CLOSE Signal:
```json
{
  "api_key": "2Q8AqaARhzWDFHxcQ4008g",
  "action": "CLOSE",
  "symbol": "{{ticker}}"
}
```

---

## 🎯 What Should Happen

When alert triggers:

1. **TradingView** sends webhook to ngrok URL
2. **Ngrok** forwards to localhost:8000
3. **Backend** receives request
4. **Backend** validates API key
5. **Backend** logs into MT5
6. **Backend** places order
7. **Backend** creates notification
8. **You** see trade in dashboard

---

## 🐛 Still Not Working?

### Check these logs:

1. **Backend logs** (terminal running `python run.py`)
   - Look for webhook requests
   - Look for errors

2. **Ngrok dashboard** (http://localhost:4040)
   - Shows all incoming requests
   - Shows request/response details

3. **TradingView alert history**
   - Check if alert actually triggered
   - Check webhook delivery status

---

## 💡 Pro Tips

1. **Test with simple alert first**
   - Use "Price crosses X" condition
   - Set X to current price
   - Should trigger immediately

2. **Use ngrok dashboard**
   - Best way to see what's happening
   - Shows exact request/response

3. **Check TradingView webhook limits**
   - Free plan: Limited webhooks
   - Pro plan: Unlimited webhooks

4. **Verify JSON syntax**
   - Use jsonlint.com to validate
   - No trailing commas
   - Proper quotes

---

## 📞 Need More Help?

If still not working, provide:
1. Screenshot of TradingView alert settings
2. Screenshot of ngrok dashboard (http://localhost:4040)
3. Backend logs when alert triggers
4. Response from test curl command

