# 🎯 Current Working Webhook URLs

## ✅ Active URLs (Choose ONE)

### Option 1: Ngrok (Currently Running)
```
https://7912dca4c118.ngrok-free.app/api/webhook/tradingview
```
⚠️ **Note:** Ngrok free has browser warning that TradingView cannot bypass

### Option 2: LocalTunnel (Currently Running - RECOMMENDED)
```
https://nine-walls-sneeze.loca.lt/api/webhook/tradingview
```
✅ **Recommended:** No browser warning, works directly with TradingView

---

## 🔑 Your API Key
```
f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE
```

---

## 📋 TradingView Alert Setup

### Use LocalTunnel URL (Recommended):

**Webhook URL (Notifications Tab):**
```
https://nine-walls-sneeze.loca.lt/api/webhook/tradingview
```

**Message (Message Tab):**
```json
{
  "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01
}
```

---

## ❌ Old URLs (DO NOT USE)
- ❌ `https://be066daa2d46.ngrok-free.app` - OFFLINE
- ❌ `https://3c012e803c56.ngrok-free.app` - OFFLINE

---

## 🧪 Test Commands

### Test LocalTunnel (Recommended):
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

### Test Ngrok (With Header):
```bash
curl -X POST https://7912dca4c118.ngrok-free.app/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "api_key": "f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE",
    "action": "BUY",
    "symbol": "EURUSD",
    "volume": 0.01
  }'
```

---

## ⚠️ Important Notes

### Before Testing:
1. ✅ Enable AutoTrading in MT5
2. ✅ MT5 account must be connected
3. ✅ Use correct API key
4. ✅ Update TradingView webhook URL

### URL Changes:
- LocalTunnel URL changes when you restart `lt`
- Ngrok URL changes when you restart `ngrok`
- Always check current URL before creating alerts

---

## 🔍 How to Check Current URLs

### Check LocalTunnel:
Look at terminal output when you run `lt --port 8000`

### Check Ngrok:
1. Look at terminal output
2. OR visit: http://localhost:4040

---

## 📊 Which URL to Use?

### Use LocalTunnel if:
- ✅ You want it to work immediately
- ✅ You don't want browser warnings
- ✅ You're using TradingView webhooks

### Use Ngrok if:
- You have paid ngrok account
- You need custom subdomain
- You're testing manually (can add headers)

---

## 🎯 Recommended Setup for TradingView

**Use LocalTunnel:**
```
URL: https://nine-walls-sneeze.loca.lt/api/webhook/tradingview
API Key: f5uaLmYUbnFB2aux-Hce5bq0hxV9Z4y03suW_9VmIuE
```

This works directly with TradingView without any issues!

