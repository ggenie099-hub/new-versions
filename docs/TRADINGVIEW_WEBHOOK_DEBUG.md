# TradingView Webhook Debugging Guide

## Issue: Signal received but not placed in MT5

### Common Causes:

1. **Ngrok not running** ❌
2. **Wrong webhook URL in TradingView**
3. **Invalid API key**
4. **MT5 account not connected**
5. **Wrong JSON format**
6. **MT5 not running**

---

## Step-by-Step Fix

### 1. Start ngrok (REQUIRED)

Open a NEW terminal/command prompt:

```bash
ngrok http 8000
```

You should see:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

**Copy the HTTPS URL!** (e.g., `https://abc123.ngrok.io`)

---

### 2. Get Your API Key

1. Go to: http://localhost:3000/dashboard/bridge
2. Copy your API key (looks like: `2Q8AqaARhzWDFHxcQ4008g`)

---

### 3. Configure TradingView Alert

#### In TradingView:
1. Right-click on chart → Add Alert
2. Set your conditions
3. Go to **"Notifications"** tab
4. Check **"Webhook URL"**
5. Enter: `https://YOUR-NGROK-URL.ngrok.io/api/webhook/tradingview`
   - Example: `https://abc123.ngrok.io/api/webhook/tradingview`

#### In **"Message"** tab, paste this JSON:

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

**Replace:**
- `YOUR_API_KEY_HERE` with your actual API key
- Adjust `volume`, `stop_loss`, `take_profit` as needed

---

### 4. Test the Webhook

#### Option A: Test from Command Line

```bash
cd backend
python test_webhook.py
```

#### Option B: Test with curl

```bash
curl -X POST https://YOUR-NGROK-URL.ngrok.io/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

#### Option C: Test from Browser

Visit: `https://YOUR-NGROK-URL.ngrok.io/api/webhook/test`

Should return:
```json
{
  "status": "ok",
  "message": "TradingView webhook endpoint is working"
}
```

---

### 5. Check Backend Logs

When TradingView sends a signal, you should see in backend logs:

```
INFO: 127.0.0.1:xxxxx - "POST /api/webhook/tradingview HTTP/1.1" 200 OK
```

If you see `401 Unauthorized` → Wrong API key
If you see `400 Bad Request` → Check JSON format or MT5 connection

---

### 6. Verify MT5 Connection

1. Go to: http://localhost:3000/dashboard
2. Check MT5 account status is **"Connected"** (green)
3. If not connected:
   - Make sure MT5 is running
   - Click "Refresh" on the account card
   - Re-add account if needed

---

## Common Errors & Solutions

### Error: "Invalid API key"
**Solution:** 
- Copy API key from dashboard
- Make sure no extra spaces
- Regenerate if needed

### Error: "No connected MT5 account found"
**Solution:**
- Add MT5 account in dashboard
- Make sure MT5 terminal is running
- Check account shows "Connected" status

### Error: "MT5 login failed"
**Solution:**
- Verify MT5 credentials are correct
- Check MT5 terminal is running
- Try reconnecting account

### Error: "Connection refused" or "502 Bad Gateway"
**Solution:**
- Make sure backend is running: `python run.py`
- Make sure ngrok is running: `ngrok http 8000`
- Check ngrok URL is correct

### Error: "Empty payload is required"
**Solution:**
- JSON should be in "Message" tab, NOT in webhook URL
- Webhook URL should only contain the URL

---

## Checklist Before Testing

- [ ] Backend running (`python run.py`)
- [ ] Frontend running (`npm run dev`)
- [ ] Ngrok running (`ngrok http 8000`)
- [ ] MT5 terminal running
- [ ] MT5 account connected in dashboard
- [ ] API key copied from dashboard
- [ ] Webhook URL in TradingView: `https://YOUR-NGROK.ngrok.io/api/webhook/tradingview`
- [ ] JSON in "Message" tab with correct API key

---

## Example Working Setup

### Terminal 1 - Backend:
```bash
cd backend
python run.py
# Should show: Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:3000
```

### Terminal 3 - Ngrok:
```bash
ngrok http 8000
# Copy the HTTPS URL
```

### TradingView Alert:
- **Webhook URL:** `https://abc123.ngrok.io/api/webhook/tradingview`
- **Message:**
```json
{
  "api_key": "2Q8AqaARhzWDFHxcQ4008g",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01
}
```

---

## Still Not Working?

### Check Backend Logs:
Look for errors in the terminal running `python run.py`

### Check Ngrok Dashboard:
Visit: http://localhost:4040
- Shows all incoming requests
- Shows request/response details
- Helps debug issues

### Enable Debug Mode:
Add this to your TradingView alert message:
```json
{
  "api_key": "YOUR_API_KEY",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "debug": true
}
```

---

## Need Help?

1. Check backend logs for errors
2. Check ngrok dashboard at http://localhost:4040
3. Test webhook with curl first
4. Verify MT5 is running and connected
5. Make sure API key is correct

