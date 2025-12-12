# 🔧 Enable MT5 AutoTrading for API

## ✅ Webhook is Working!
Your TradingView alert successfully reached the backend! 🎉

## ❌ Current Issue:
MT5 is blocking API trades with error: **"AutoTrading disabled by client"**

---

## 🔧 Solution: Enable AutoTrading Properly

### Method 1: Enable in MT5 Options (IMPORTANT)

1. Open **MT5 Terminal**
2. Click **Tools** → **Options** (or press Ctrl+O)
3. Go to **Expert Advisors** tab
4. ✅ Check **"Allow algorithmic trading"**
5. ✅ Check **"Allow DLL imports"** (if available)
6. ✅ Check **"Allow WebRequest for listed URL"**
7. Click **OK**
8. **RESTART MT5** (Important!)

### Method 2: Enable AutoTrading Button

1. Look for **"AutoTrading"** or **"Algo Trading"** button in toolbar
2. Click it until it turns **GREEN**
3. If it's already green, click it OFF then ON again

### Method 3: Check Account Settings

Some brokers disable AutoTrading at account level:
1. Right-click on account in **Navigator**
2. Select **"Properties"**
3. Check if AutoTrading is allowed
4. Contact broker if disabled

---

## 🧪 Test After Enabling

### Test with curl:
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
  "message": "BUY order executed successfully"
}
```

---

## 📊 What We Know:

✅ **Working:**
- TradingView alert triggers correctly
- Webhook reaches backend
- API key is valid
- MT5 account is connected
- Backend can login to MT5

❌ **Issue:**
- MT5 is blocking API from placing trades
- Need to enable AutoTrading properly

---

## 🎯 Quick Fix Steps:

1. **Close MT5 completely**
2. **Reopen MT5**
3. **Tools** → **Options** → **Expert Advisors**
4. ✅ **Enable "Allow algorithmic trading"**
5. **Click OK**
6. **Click AutoTrading button** (make it GREEN)
7. **Test webhook again**

---

## 💡 Alternative: Manual Order Test

Try placing a manual order in MT5 to verify:
1. Right-click on chart
2. Select "Trading" → "New Order"
3. Try to place a market order
4. If this works, API should work too

---

## 📞 Still Not Working?

If AutoTrading is enabled but still getting error:

### Check Broker Restrictions:
- Some brokers don't allow API trading
- Contact broker support
- Ask if "Algorithmic Trading" is allowed on your account

### Check MT5 Version:
- Update to latest MT5 version
- Some old versions have API issues

### Check Account Type:
- Demo accounts usually allow API
- Live accounts may need special permission

---

## 🎉 Good News!

The webhook integration is **100% working**! 
Once AutoTrading is properly enabled in MT5, trades will execute automatically! 🚀

