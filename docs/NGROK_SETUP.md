# Setting Up ngrok for TradingView Webhooks

## Problem
TradingView only accepts webhooks on standard ports (80 for HTTP, 443 for HTTPS).
Your local server runs on port 8000, which TradingView rejects.

## Solution: Use ngrok

### Step 1: Download ngrok
1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract the zip file
4. (Optional) Sign up for free account at https://ngrok.com/signup

### Step 2: Run ngrok
Open Command Prompt or PowerShell and run:
```bash
ngrok http 8000
```

### Step 3: Copy the Public URL
You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

Copy the HTTPS URL: `https://abc123.ngrok.io`

### Step 4: Update Webhook URL in TradingView
Use this URL in TradingView webhook:
```
https://abc123.ngrok.io/api/webhook/tradingview
```

### Step 5: Test the Alert
1. Create alert in TradingView
2. Go to "Message" tab → Paste JSON
3. Go to "Notifications" tab → Check "Webhook URL"
4. Paste: `https://abc123.ngrok.io/api/webhook/tradingview`
5. Click "Create"

## Important Notes

### Free ngrok Limitations:
- URL changes every time you restart ngrok
- Limited to 40 connections/minute
- Session expires after 2 hours

### Paid ngrok Benefits ($8/month):
- Custom subdomain (e.g., `https://yourname.ngrok.io`)
- URL stays the same
- No time limits
- More connections

### Alternative: Deploy to Production
For permanent solution, deploy your app to:
- Heroku (free tier available)
- DigitalOcean ($5/month)
- AWS/Azure/GCP
- Vercel (frontend) + Railway (backend)

## Quick Start Commands

### Start Backend (Terminal 1):
```bash
cd backend
python run.py
```

### Start ngrok (Terminal 2):
```bash
ngrok http 8000
```

### Start Frontend (Terminal 3):
```bash
cd frontend
npm run dev
```

## Testing the Webhook

### Test with curl:
```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your_api_key",
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
  "price": 1.0850,
  "message": "BUY order executed successfully"
}
```

## Troubleshooting

### Error: "Empty payload is required"
- Make sure JSON is in "Message" tab, not webhook URL
- Webhook URL should only contain the URL

### Error: "Connection refused"
- Make sure backend is running on port 8000
- Make sure ngrok is running
- Check ngrok URL is correct

### Error: "Invalid API key"
- Check API key in JSON matches your account
- Regenerate API key if needed

### Error: "No connected MT5 account"
- Connect your MT5 account in dashboard
- Make sure account is connected (green status)

## Production Deployment

For production, you need:
1. Domain name (e.g., tradingmaven.com)
2. SSL certificate (Let's Encrypt - free)
3. Server (VPS or cloud hosting)
4. Proper webhook URL: `https://api.tradingmaven.com/webhook/tradingview`

Would you like help with production deployment?
