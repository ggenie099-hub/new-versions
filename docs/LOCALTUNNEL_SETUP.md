# LocalTunnel Setup (Alternative to ngrok)

## Problem with Free Ngrok
Free ngrok shows a browser warning page that TradingView cannot bypass.

## Solution: Use LocalTunnel (FREE, No Account Needed)

### Step 1: Install LocalTunnel
```bash
npm install -g localtunnel
```

### Step 2: Start LocalTunnel
```bash
lt --port 8000
```

You'll get a URL like: `https://random-name-123.loca.lt`

### Step 3: Use in TradingView
Use this URL in TradingView webhook:
```
https://random-name-123.loca.lt/api/webhook/tradingview
```

### Step 4: Test
```bash
curl https://random-name-123.loca.lt/api/webhook/test
```

---

## OR: Fix Ngrok (Better Option)

### Get Ngrok Auth Token (FREE):
1. Sign up: https://dashboard.ngrok.com/signup
2. Copy your auth token
3. Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`
4. Restart ngrok: `ngrok http 8000`

This removes the browser warning!

---

## Current Issue
TradingView cannot bypass ngrok's browser warning page.
You need either:
- Ngrok with auth token (free account)
- LocalTunnel (no account needed)
- Paid ngrok ($8/month)

