# Message Display - Quick Test Guide

## Prerequisites
- Two user accounts logged in (separate browsers/incognito)
- At least one workspace with a channel
- Both users are members of the workspace

## Test 1: Channel Messages (Group Chat)

### Steps
1. **User A**: Navigate to a channel (e.g., #general)
2. **User A**: Open browser console (F12)
3. **User A**: Type and send a message: "Hello from User A"
4. **User A**: Check console logs:
   ```
   Messages Response: {...}
   Processed Messages: [...]
   Messages Count: X
   ```
5. **User B**: Navigate to the same channel
6. **User B**: Should see "Hello from User A" message immediately
7. **User B**: Send a message: "Hello from User B"
8. **User A**: Should see "Hello from User B" appear instantly (no refresh needed)

### Expected Results
- ✅ Messages appear immediately for both users
- ✅ No page refresh required
- ✅ Console shows correct message count
- ✅ No errors in console
- ✅ WebSocket connection active (check Network > WS tab)

## Test 2: Direct Messages

### Steps
1. **User A**: Click on User B in the DM list
2. **User A**: Open browser console (F12)
3. **User A**: Type and send a DM: "Private message from A"
4. **User A**: Check console logs:
   ```
   DM Response: {...}
   Processed DM Messages: [...]
   DM Messages Count: X
   ```
5. **User B**: Click on User A in the DM list
6. **User B**: Should see "Private message from A" immediately
7. **User B**: Send a DM: "Reply from B"
8. **User A**: Should see "Reply from B" appear instantly

### Expected Results
- ✅ DMs appear immediately for both users
- ✅ No polling requests in Network tab (check for repeated GET /api/dm/{userId})
- ✅ WebSocket connection active
- ✅ Console shows correct message count
- ✅ No errors in console

## Test 3: Message Persistence

### Steps
1. Send several messages in a channel
2. Refresh the page (F5)
3. Navigate back to the channel
4. All messages should still be visible

### Expected Results
- ✅ All messages persist after refresh
- ✅ Messages load in correct order (oldest to newest)
- ✅ No duplicate messages

## Test 4: Multiple Channels

### Steps
1. Send message in #general
2. Navigate to #random
3. Send message in #random
4. Navigate back to #general
5. Previous messages should still be visible

### Expected Results
- ✅ Each channel maintains its own message history
- ✅ No message mixing between channels
- ✅ Messages load correctly when switching channels

## Debugging Failed Tests

### Messages Not Appearing

**Check 1: Console Logs**
```javascript
// Should see:
Messages Response: { success: true, data: { content: [...] } }
Processed Messages: [{ id: 1, content: "..." }, ...]
Messages Count: 5
```

**If you see**:
```javascript
Messages Count: 0
```
**Then**: API is returning empty array. Check backend logs.

**Check 2: Network Tab**
- Open DevTools > Network
- Filter by "Fetch/XHR"
- Look for `/api/messages/channel/{id}` or `/api/dm/{id}`
- Click on request
- Check "Response" tab
- Should see: `{ "success": true, "data": { "content": [...] } }`

**Check 3: WebSocket Connection**
- Open DevTools > Network > WS
- Should see connection to `/ws`
- Status should be "101 Switching Protocols"
- Click on connection
- Go to "Messages" tab
- Should see frames being sent/received

**Check 4: Backend Logs**
```
INFO: Fetching messages for channel ID: 5
INFO: Fetched 10 messages for channel 5
INFO: Sending message to channel ID: 5
INFO: Message saved initial ID: 123
```

### WebSocket Not Working

**Symptoms**:
- Messages don't appear in real-time
- Need to refresh to see new messages
- Console shows "WebSocket error"

**Solutions**:
1. Check WebSocket URL in `.env`:
   ```
   VITE_WS_URL=http://localhost:8080/ws
   ```

2. Check CORS configuration in backend

3. Check if WebSocket is blocked by firewall/proxy

4. Try different browser

### API Response Structure Issues

**If console shows**:
```javascript
Processed Messages: []
Messages Count: 0
```

**But Network tab shows messages in response**:
- Check response structure
- Verify `response.data.data.content` path
- Add more console logs to debug

## Quick Fixes

### Clear Browser Cache
```
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)
```

### Restart Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Restart Frontend
```bash
cd frontend
npm run dev
```

### Check Environment Variables
```bash
# frontend/.env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

## Success Criteria
- ✅ Channel messages display immediately
- ✅ Direct messages display immediately
- ✅ No polling in Network tab for DMs
- ✅ WebSocket connection active
- ✅ Console logs show correct message counts
- ✅ No errors in browser console
- ✅ No errors in backend logs
- ✅ Messages persist after refresh
