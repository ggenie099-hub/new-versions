# 🔍 Test Auto-Sync Dashboard

## Current Status
Auto-sync code is implemented and should be working.

## 🧪 How to Test

### 1. Open Browser Console
1. Open dashboard: http://localhost:3000/dashboard
2. Press **F12** to open Developer Tools
3. Go to **Console** tab

### 2. Check for Auto-Sync Logs
You should see logs every 10 seconds:
```
Auto-synced: 3 positions
```

### 3. Verify Auto-Sync is Enabled
Look for the green indicator on dashboard:
- "Live updates active" with pulsing green dot

### 4. Test Manual Sync
Click the "Sync" button and check if positions update

---

## 🐛 Possible Issues

### Issue 1: Auto-Sync Toggle is OFF
**Solution:** Check if toggle is enabled in dashboard settings

### Issue 2: No Active Account
**Solution:** Make sure MT5 account shows "Connected" status

### Issue 3: Backend Not Responding
**Check backend logs** for sync requests:
```
INFO: POST /api/trades/sync-positions?account_id=1 HTTP/1.1 200 OK
```

### Issue 4: Frontend Not Re-rendering
**Solution:** Check browser console for errors

---

## 🔧 Quick Fix

If auto-sync is not working, try:

1. **Refresh the page** (Ctrl+R or F5)
2. **Check toggle is ON** (should show green "Live updates active")
3. **Check browser console** for errors
4. **Check backend is running** (terminal should show sync requests)

---

## 📊 What Should Happen

Every 10 seconds:
1. Frontend sends request to backend
2. Backend syncs with MT5
3. Backend returns updated positions
4. Frontend updates the positions table
5. Console shows: "Auto-synced: X positions"

---

## 🎯 Test Right Now

1. Open dashboard
2. Open browser console (F12)
3. Watch for "Auto-synced" messages
4. Should appear every 10 seconds

If you see the messages, auto-sync IS working!
If positions don't update, it might be a display issue.

