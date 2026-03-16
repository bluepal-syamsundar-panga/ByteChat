# Workspace Invitation - Test Checklist

## Prerequisites
- [ ] Two registered user accounts
  - Owner: `owner@test.com`
  - Member: `member@test.com`
- [ ] Owner has created at least one workspace
- [ ] Both users are logged in (separate browsers/incognito)

## Test Steps

### Phase 1: Send Invitation (Owner Side)
- [ ] **Step 1.1**: Login as owner@test.com
- [ ] **Step 1.2**: Navigate to a workspace
- [ ] **Step 1.3**: Verify Sidebar shows "Invite Members" button
- [ ] **Step 1.4**: Click "Invite Members" button
- [ ] **Step 1.5**: Modal opens with email input field
- [ ] **Step 1.6**: Enter `member@test.com` in email field
- [ ] **Step 1.7**: Click "Send Invitation" button
- [ ] **Step 1.8**: Verify success message: "Invitation sent successfully!"
- [ ] **Step 1.9**: Modal closes automatically
- [ ] **Step 1.10**: Check browser console - no errors

### Phase 2: Receive Notification (Member Side)
- [ ] **Step 2.1**: Switch to member@test.com browser
- [ ] **Step 2.2**: Verify bell icon (🔔) in header shows red badge
- [ ] **Step 2.3**: Badge shows count "1"
- [ ] **Step 2.4**: Click bell icon
- [ ] **Step 2.5**: NotificationPanel opens
- [ ] **Step 2.6**: Notification displays:
  - [ ] 📨 Icon
  - [ ] Message: "owner@test.com invited you to join workspace [WorkspaceName]"
  - [ ] Timestamp (e.g., "2 minutes ago")
  - [ ] Three buttons: "Dismiss", "Accept", "Reject"

### Phase 3: Accept Invitation (Member Side)
- [ ] **Step 3.1**: Click "Accept" button
- [ ] **Step 3.2**: Notification disappears from panel
- [ ] **Step 3.3**: Bell badge count decreases to 0
- [ ] **Step 3.4**: Success toast appears: "Invite accepted successfully!"
- [ ] **Step 3.5**: Check browser console - no errors

### Phase 4: Verify Workspace Access (Member Side)
- [ ] **Step 4.1**: Navigate to Landing Page (/)
- [ ] **Step 4.2**: Scroll to "Your Workspaces" section
- [ ] **Step 4.3**: Verify workspace now appears in grid
- [ ] **Step 4.4**: Workspace card shows:
  - [ ] Workspace name
  - [ ] Description
  - [ ] First letter icon
- [ ] **Step 4.5**: Click workspace card
- [ ] **Step 4.6**: Redirects to `/chat/channel/{channelId}`
- [ ] **Step 4.7**: #general channel loads
- [ ] **Step 4.8**: Can see channel messages
- [ ] **Step 4.9**: Can send messages
- [ ] **Step 4.10**: Sidebar shows workspace channels

### Phase 5: Verify Member List (Owner Side)
- [ ] **Step 5.1**: Switch back to owner@test.com browser
- [ ] **Step 5.2**: In workspace, check members list
- [ ] **Step 5.3**: Verify member@test.com appears in members
- [ ] **Step 5.4**: Member shows as online (if still logged in)

## Error Cases to Test

### Invalid Email
- [ ] **Error 1.1**: Enter non-existent email (e.g., `fake@test.com`)
- [ ] **Error 1.2**: Click "Send Invitation"
- [ ] **Error 1.3**: Verify error message: "User not found with email: fake@test.com"

### Already Member
- [ ] **Error 2.1**: Try to invite member@test.com again
- [ ] **Error 2.2**: Verify error message: "User is already in this room"

### Empty Email
- [ ] **Error 3.1**: Leave email field empty
- [ ] **Error 3.2**: Click "Send Invitation"
- [ ] **Error 3.3**: Verify validation prevents submission

### Reject Invitation
- [ ] **Error 4.1**: Send new invitation to another user
- [ ] **Error 4.2**: Recipient clicks "Reject" instead of "Accept"
- [ ] **Error 4.3**: Notification disappears
- [ ] **Error 4.4**: Workspace does NOT appear in recipient's workspace list

## Backend Verification (Optional)

### Database Checks
- [ ] **DB 1**: Check `notifications` table
  - [ ] New row with type='ROOM_INVITE'
  - [ ] recipient_id matches member user
  - [ ] related_entity_id matches workspace/room ID
  - [ ] is_read=true after acceptance

- [ ] **DB 2**: Check `room_members` table
  - [ ] New row created after acceptance
  - [ ] room_id matches workspace
  - [ ] user_id matches member
  - [ ] joined_at timestamp is recent

### API Checks (using Postman/curl)
- [ ] **API 1**: GET `/api/notifications`
  - [ ] Returns notification list
  - [ ] ROOM_INVITE notifications present

- [ ] **API 2**: POST `/api/rooms/{roomId}/invite`
  - [ ] Body: `{"email": "test@test.com"}`
  - [ ] Returns 200 OK
  - [ ] Response: `{"success": true, "message": "Invitation sent"}`

- [ ] **API 3**: POST `/api/notifications/{id}/accept`
  - [ ] Returns 200 OK
  - [ ] Response: `{"success": true, "message": "Invite accepted"}`

## Performance Checks
- [ ] **Perf 1**: Notification appears within 2 seconds of sending
- [ ] **Perf 2**: Workspace appears immediately after acceptance
- [ ] **Perf 3**: No page refresh required
- [ ] **Perf 4**: WebSocket connection stable

## Browser Console Checks
- [ ] **Console 1**: No JavaScript errors
- [ ] **Console 2**: No 404 API errors
- [ ] **Console 3**: No 403 Forbidden errors
- [ ] **Console 4**: WebSocket connection established
- [ ] **Console 5**: Notification received via WebSocket

## Summary
- Total Test Cases: 50+
- Critical Path: Steps 1.1 → 1.7 → 2.2 → 3.1 → 4.3 → 4.5
- Expected Duration: 10-15 minutes for full test
- Pass Criteria: All critical path steps pass without errors
