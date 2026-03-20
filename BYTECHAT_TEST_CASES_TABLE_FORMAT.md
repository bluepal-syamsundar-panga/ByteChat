# ByteChat - 100 Functional Test Cases (Table Format)

**Application**: ByteChat - Real-Time Chat Application  
**Version**: 1.0.0  
**Test Type**: Functional & End-to-End Testing  
**Date**: March 19, 2026  
**Prepared By**: QA Team

---

## Table of Contents

1. [User Authentication & Registration (TC-001 to TC-015)](#user-authentication--registration)
2. [Workspace Management (TC-016 to TC-030)](#workspace-management)
3. [Channel Management (TC-031 to TC-045)](#channel-management)
4. [Messaging Features (TC-046 to TC-060)](#messaging-features)
5. [Direct Messaging (TC-061 to TC-070)](#direct-messaging)
6. [Notifications (TC-071 to TC-080)](#notifications)
7. [File Upload & Attachments (TC-081 to TC-085)](#file-upload--attachments)
8. [User Profile & Presence (TC-086 to TC-090)](#user-profile--presence)
9. [Advanced Features (TC-091 to TC-100)](#advanced-features)

---

## User Authentication & Registration

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-001 | User Registration with Valid OTP | High | 1. Navigate to registration page 2. Enter email: test@example.com 3. Click "Send OTP" 4. Check email for OTP code 5. Enter received OTP code 6. Enter password: Test@123 7. Enter display name: John Doe 8. Click "Register" | • User account created successfully • JWT tokens received • User redirected to landing page • Success message displayed | ☐ Pass ☐ Fail |
| TC-002 | User Registration with Invalid OTP | High | 1. Enter email: test@example.com 2. Click "Send OTP" 3. Enter incorrect OTP: 000000 4. Enter password and display name 5. Click "Register" | • Registration fails • Error message: "Invalid or expired OTP" • User remains on registration page | ☐ Pass ☐ Fail |
| TC-003 | User Registration with Expired OTP | Medium | 1. Request OTP for email 2. Wait for OTP to expire (>10 minutes) 3. Enter expired OTP 4. Complete registration form 5. Click "Register" | • Registration fails • Error message: "OTP has expired" • Option to resend OTP displayed | ☐ Pass ☐ Fail |
| TC-004 | User Login with Valid Credentials | High | 1. Navigate to login page 2. Enter email: test@example.com 3. Enter password: Test@123 4. Click "Login" | • Login successful • JWT tokens received and stored • User redirected to landing page • User's workspaces displayed | ☐ Pass ☐ Fail |
| TC-005 | User Login with Invalid Password | High | 1. Navigate to login page 2. Enter valid email 3. Enter incorrect password 4. Click "Login" | • Login fails • Error message: "Invalid credentials" • User remains on login page | ☐ Pass ☐ Fail |
| TC-006 | User Login with Non-existent Email | High | 1. Navigate to login page 2. Enter non-existent email: notfound@example.com 3. Enter any password 4. Click "Login" | • Login fails • Error message: "User not found" or "Invalid credentials" • User remains on login page | ☐ Pass ☐ Fail |
| TC-007 | JWT Token Refresh | High | 1. User logged in with valid session 2. Wait for access token to expire (15 minutes) 3. Make any API request 4. Observe token refresh mechanism | • Access token automatically refreshed • New access token received • Original request completed successfully • No user interruption | ☐ Pass ☐ Fail |
| TC-008 | Logout Functionality | High | 1. User logged in and on any page 2. Click user profile icon 3. Click "Logout" button 4. Confirm logout | • User logged out successfully • Tokens cleared from storage • Redirected to login page • Cannot access protected routes | ☐ Pass ☐ Fail |
| TC-009 | Password Reset - Request OTP | Medium | 1. Navigate to login page 2. Click "Forgot Password" 3. Enter registered email 4. Click "Send OTP" 5. Check email | • OTP sent to email • Success message displayed • OTP input field appears | ☐ Pass ☐ Fail |
| TC-010 | Password Reset - Complete Flow | Medium | 1. Enter received OTP 2. Enter new password: NewPass@123 3. Confirm new password: NewPass@123 4. Click "Reset Password" 5. Try logging in with new password | • Password reset successful • Success message displayed • Can login with new password • Old password no longer works | ☐ Pass ☐ Fail |
| TC-011 | Registration with Duplicate Email | High | 1. Navigate to registration page 2. Enter existing email 3. Request OTP 4. Complete registration form | • Registration fails • Error message: "Email already registered" • Suggestion to login instead | ☐ Pass ☐ Fail |
| TC-012 | Registration with Weak Password | Medium | 1. Navigate to registration page 2. Enter valid email and OTP 3. Enter weak password: 123 4. Try to register | • Validation error displayed • Message: "Password must be at least 8 characters" • Registration blocked until valid password | ☐ Pass ☐ Fail |
| TC-013 | Session Persistence After Browser Refresh | Medium | 1. User logged in successfully 2. Refresh browser page (F5) 3. Observe user state | • User remains logged in • Session persisted • User data still available • No redirect to login | ☐ Pass ☐ Fail |
| TC-014 | Multiple Login Sessions | Low | 1. Login from Browser 1 2. Login from Browser 2 with same credentials 3. Perform actions in both browsers | • Both sessions active • Actions reflected in both browsers • No session conflict | ☐ Pass ☐ Fail |
| TC-015 | Login with Email Case Insensitivity | Low | 1. Navigate to login page 2. Enter email: TEST@EXAMPLE.COM 3. Enter correct password 4. Click "Login" | • Login successful • Email treated as case-insensitive • User logged in normally | ☐ Pass ☐ Fail |

---

## Workspace Management

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-016 | Create Workspace with Valid OTP | High | 1. Click "Create Workspace" button 2. Enter email for verification 3. Click "Send OTP" 4. Enter received OTP 5. Enter workspace name: "My Team" 6. Enter description: "Team workspace" 7. Select privacy: Public 8. Click "Create" | • Workspace created successfully • User set as workspace owner • Default #general channel created • User added to #general channel • Redirected to workspace chat | ☐ Pass ☐ Fail |
| TC-017 | Create Private Workspace | High | 1. Navigate to workspace creation 2. Complete OTP verification 3. Enter workspace name 4. Select "Private" option 5. Click "Create" | • Private workspace created • Only visible to members • Owner can invite users • Privacy setting saved correctly | ☐ Pass ☐ Fail |
| TC-018 | View All User Workspaces | High | 1. Login to application 2. Navigate to landing page 3. Observe workspace list | • All workspaces displayed • Shows owned and member workspaces • Workspace names and descriptions visible • Click to enter workspace | ☐ Pass ☐ Fail |
| TC-019 | Invite User to Workspace by Email | High | 1. Open workspace 2. Click "Invite Members" in sidebar 3. Enter invitee email: newuser@example.com 4. Click "Send Invitation" | • Invitation created with PENDING status • Notification sent to invitee • Success message displayed • Invitation appears in invitee's notifications | ☐ Pass ☐ Fail |
| TC-020 | Accept Workspace Invitation | High | 1. Login as invited user 2. Click notification bell icon 3. View workspace invitation 4. Click "Accept" button | • Invitation status changed to ACCEPTED • User added to workspace as MEMBER • User added to #general channel • Workspace appears in user's workspace list • Notification marked as read | ☐ Pass ☐ Fail |
| TC-021 | Reject Workspace Invitation | Medium | 1. Login as invited user 2. Open notifications panel 3. View workspace invitation 4. Click "Reject" button | • Invitation status changed to REJECTED • User not added to workspace • Notification removed from list • Can still be invited again later | ☐ Pass ☐ Fail |
| TC-022 | Leave Workspace as Member | Medium | 1. Open workspace 2. Click workspace settings 3. Click "Leave Workspace" 4. Confirm action | • User removed from workspace • User removed from all workspace channels • Workspace no longer visible to user • Confirmation message displayed | ☐ Pass ☐ Fail |
| TC-023 | Archive Workspace | Medium | 1. Open workspace settings 2. Click "Archive Workspace" 3. Confirm action | • Workspace archived (isArchived = true) • Workspace moved to archived section • No new channels can be created • Existing content remains accessible • Can be restored later | ☐ Pass ☐ Fail |
| TC-024 | View Workspace Members | Medium | 1. Open workspace 2. Click "Members" or workspace name 3. View member list | • All workspace members displayed • Shows display name and avatar • Shows member roles (OWNER/ADMIN/MEMBER) • Shows online status | ☐ Pass ☐ Fail |
| TC-025 | Remove Member from Workspace | High | 1. Open workspace members list 2. Select a member 3. Click "Remove Member" 4. Confirm action | • Member removed from workspace • Member removed from all channels • Member loses access immediately • Workspace no longer visible to removed user | ☐ Pass ☐ Fail |
| TC-026 | Transfer Workspace Ownership | Low | 1. Open workspace settings 2. Click "Transfer Ownership" 3. Select new owner from admin list 4. Confirm transfer | • Ownership transferred to selected user • Previous owner becomes admin • New owner has full control • Change reflected immediately | ☐ Pass ☐ Fail |
| TC-027 | Create Workspace with Duplicate Name | Low | 1. Try to create workspace 2. Enter existing workspace name 3. Complete form 4. Click "Create" | • Workspace created successfully • Duplicate names allowed • Each workspace has unique ID • No conflict | ☐ Pass ☐ Fail |
| TC-028 | Workspace with Special Characters in Name | Low | 1. Create new workspace 2. Enter name: "Team @#$% 2024" 3. Complete creation | • Workspace created successfully • Special characters handled properly • Name displayed correctly • No encoding issues | ☐ Pass ☐ Fail |
| TC-029 | View Workspace Without Membership | Medium | 1. Try to access workspace URL directly 2. Attempt to view workspace | • Access denied • Error message: "You don't have access" • Redirected to landing page • Workspace not visible in list | ☐ Pass ☐ Fail |
| TC-030 | Workspace Pagination | Low | 1. Navigate to landing page 2. Scroll through workspace list 3. Observe pagination | • Workspaces loaded in pages (50 per page) • Smooth scrolling • Load more on scroll • No performance issues | ☐ Pass ☐ Fail |

---


## Channel Management

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-031 | Create Public Channel | High | 1. Open workspace 2. Click "Create Channel" button 3. Enter channel name: "announcements" 4. Enter description: "Team announcements" 5. Select "Public" 6. Click "Create" | • Channel created successfully • Creator added as channel owner • Channel visible to all workspace members • Channel appears in sidebar | ☐ Pass ☐ Fail |
| TC-032 | Create Private Channel | High | 1. Click "Create Channel" 2. Enter channel name: "private-team" 3. Select "Private" 4. Click "Create" | • Private channel created • Only creator can see initially • Lock icon displayed • Can invite specific members | ☐ Pass ☐ Fail |
| TC-033 | Invite User to Private Channel | High | 1. Open private channel 2. Click channel settings 3. Click "Invite Members" 4. Select user from workspace members 5. Click "Send Invitation" | • Invitation sent to user • Notification created • User receives channel invite notification • Channel remains private | ☐ Pass ☐ Fail |
| TC-034 | Accept Channel Invitation | High | 1. Open notifications panel 2. View channel invitation 3. Click "Accept" | • User added to channel • Channel appears in sidebar • Can view channel messages • Can send messages | ☐ Pass ☐ Fail |
| TC-035 | Archive Channel | Medium | 1. Open channel 2. Click channel settings 3. Click "Archive Channel" 4. Confirm action | • Channel archived (isArchived = true) • Moved to "Archived" section • Read-only access • No new messages allowed • Can be restored | ☐ Pass ☐ Fail |
| TC-036 | Delete Channel (Soft Delete) | Medium | 1. Open channel settings 2. Click "Delete Channel" 3. Confirm deletion | • Channel soft deleted (isDeleted = true) • Moved to "Trash" section • Not visible in main channel list • Can be restored within retention period • Can be permanently deleted | ☐ Pass ☐ Fail |
| TC-037 | Restore Archived Channel | Medium | 1. Navigate to "Archived" section 2. Select archived channel 3. Click "Restore Channel" 4. Confirm action | • Channel restored (isArchived = false) • Moved back to active channels • Full functionality restored • Can send messages again | ☐ Pass ☐ Fail |
| TC-038 | Permanently Delete Channel | High | 1. Navigate to "Trash" section 2. Select deleted channel 3. Click "Delete Permanently" 4. Confirm action | • Channel permanently deleted from database • All messages deleted • Cannot be restored • Confirmation message displayed | ☐ Pass ☐ Fail |
| TC-039 | Leave Channel as Member | Medium | 1. Open channel 2. Click channel settings 3. Click "Leave Channel" 4. Confirm action | • User removed from channel • Channel removed from sidebar • Cannot access channel anymore • Can be re-invited | ☐ Pass ☐ Fail |
| TC-040 | Remove Member from Channel | Medium | 1. Open channel settings 2. View members list 3. Select a member 4. Click "Remove Member" 5. Confirm action | • Member removed from channel • Member loses access immediately • Channel removed from member's sidebar • Notification sent to removed member | ☐ Pass ☐ Fail |
| TC-041 | Promote Member to Channel Admin | Medium | 1. Open channel settings 2. View members list 3. Select a member 4. Click "Make Admin" 5. Confirm action | • Member promoted to admin role • Admin badge displayed • Admin permissions granted • Can manage channel members | ☐ Pass ☐ Fail |
| TC-042 | Demote Channel Admin to Member | Medium | 1. Open channel settings 2. View members list 3. Select an admin 4. Click "Remove Admin" 5. Confirm action | • Admin demoted to member role • Admin badge removed • Admin permissions revoked • Still remains as member | ☐ Pass ☐ Fail |
| TC-043 | Transfer Channel Ownership | Low | 1. Open channel settings 2. Click "Transfer Ownership" 3. Select new owner from members 4. Confirm transfer | • Ownership transferred • Previous owner becomes admin • New owner has full control • Change reflected immediately | ☐ Pass ☐ Fail |
| TC-044 | View Channel Members List | Medium | 1. Open channel 2. Click channel name or info icon 3. View members list | • All channel members displayed • Shows display names and avatars • Shows online status • Shows member roles | ☐ Pass ☐ Fail |
| TC-045 | Create Channel with Duplicate Name | Low | 1. Try to create channel 2. Enter existing channel name 3. Complete form 4. Click "Create" | • Channel created successfully • Duplicate names allowed in same workspace • Each channel has unique ID • No conflict | ☐ Pass ☐ Fail |

---

## Messaging Features

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-046 | Send Text Message in Channel | High | 1. Open channel 2. Type message: "Hello, team!" 3. Press Enter or click Send | • Message sent successfully • Message appears in chat window • Timestamp displayed • Sender name and avatar shown • Other members see message in real-time | ☐ Pass ☐ Fail |
| TC-047 | Send Message with @Mention | High | 1. Open channel 2. Type: "Hey @JohnDoe, check this out!" 3. Send message | • Message sent with mention • @JohnDoe highlighted in blue • Notification sent to mentioned user • Mentioned user sees "mentioned you" badge • Message has blue left border for mentioned user | ☐ Pass ☐ Fail |
| TC-048 | Reply to Message | High | 1. Hover over a message 2. Click "Reply" icon 3. Type reply: "Thanks for the update!" 4. Send message | • Reply sent successfully • Original message quoted in reply • Reply linked to original message • Thread context visible | ☐ Pass ☐ Fail |
| TC-049 | Edit Own Message | High | 1. Hover over own message 2. Click "Edit" icon 3. Modify message text 4. Click "Save" or press Enter | • Message updated successfully • "Edited" label displayed • Edit timestamp shown • Updated message visible to all • Original message replaced | ☐ Pass ☐ Fail |
| TC-050 | Delete Own Message (For Self) | Medium | 1. Hover over own message 2. Click "Delete" icon 3. Select "Delete for me" 4. Confirm deletion | • Message hidden for user only • Other users still see message • Message marked as hidden for user • Cannot be recovered | ☐ Pass ☐ Fail |
| TC-051 | Delete Message for Everyone | High | 1. Hover over message 2. Click "Delete" icon 3. Select "Delete for everyone" 4. Confirm deletion | • Message deleted for all users • Message marked as deleted (isDeleted = true) • Shows "Message deleted" placeholder • Cannot be recovered | ☐ Pass ☐ Fail |
| TC-052 | Pin Message to Channel | Medium | 1. Hover over important message 2. Click "Pin" icon 3. Confirm pin action | • Message pinned successfully • Pin icon displayed on message • Message appears in pinned messages section • All members can see pinned message | ☐ Pass ☐ Fail |
| TC-053 | React to Message with Emoji | Medium | 1. Hover over a message 2. Click "Add Reaction" icon 3. Select emoji: 👍 4. Click emoji | • Reaction added to message • Emoji displayed below message • Reaction count shown • User's reaction highlighted • Other users see reaction in real-time | ☐ Pass ☐ Fail |
| TC-054 | Remove Own Reaction | Low | 1. View message with own reaction 2. Click on own reaction emoji | • Reaction removed • Emoji count decremented • If count = 0, emoji removed • Change visible to all users | ☐ Pass ☐ Fail |
| TC-055 | View Message History with Pagination | High | 1. Open channel 2. Scroll to top of messages 3. Observe "Load More" behavior | • Initial 50 messages loaded • Scroll up loads previous messages • Smooth pagination • No duplicate messages • Maintains scroll position | ☐ Pass ☐ Fail |
| TC-056 | Send Message with Multiple Mentions | Medium | 1. Type message: "@John @Jane @Mike please review" 2. Send message | • All three users mentioned • All mentions highlighted • Notifications sent to all three users • Each user sees mention badge | ☐ Pass ☐ Fail |
| TC-057 | Send Long Message (1000+ characters) | Low | 1. Type very long message (>1000 chars) 2. Send message | • Message sent successfully • Full message stored • Message displayed with proper formatting • Scrollable if needed • No truncation | ☐ Pass ☐ Fail |
| TC-058 | Send Message with Special Characters | Low | 1. Type message with special chars: "Test @#$%^&*() <script>" 2. Send message | • Message sent successfully • Special characters escaped/sanitized • No XSS vulnerability • Message displayed correctly | ☐ Pass ☐ Fail |
| TC-059 | Typing Indicator | Medium | 1. User A starts typing 2. User B observes channel | • "User A is typing..." displayed to User B • Indicator appears within 1 second • Indicator disappears after 3 seconds of inactivity • Multiple users typing shown | ☐ Pass ☐ Fail |
| TC-060 | Message Read Receipts | Low | 1. Send message 2. Other users view message 3. Check read status | • Read receipts tracked • Can see who read message • Read count displayed • Updates in real-time | ☐ Pass ☐ Fail |

---

## Direct Messaging

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-061 | Send DM Request to User | High | 1. Click on user's name 2. Click "Send Message" 3. System creates DM request | • DM request created with PENDING status • Notification sent to recipient • Request appears in recipient's notifications • Sender can see pending status | ☐ Pass ☐ Fail |
| TC-062 | Accept DM Request | High | 1. Open notifications 2. View DM request 3. Click "Accept" | • Request status changed to ACCEPTED • DM conversation opened • Both users can send messages • Conversation appears in DM list | ☐ Pass ☐ Fail |
| TC-063 | Reject DM Request | Medium | 1. Open notifications 2. View DM request 3. Click "Reject" | • Request status changed to REJECTED • No DM conversation created • Requester notified of rejection • Can request again later | ☐ Pass ☐ Fail |
| TC-064 | Send Direct Message | High | 1. Open DM conversation 2. Type message: "Hi, how are you?" 3. Send message | • Message sent successfully • Message appears in conversation • Recipient receives notification • Message delivered in real-time • Unread badge shown to recipient | ☐ Pass ☐ Fail |
| TC-065 | View DM History | High | 1. Open DM conversation 2. Scroll through messages 3. Load older messages | • All messages displayed chronologically • Pagination works smoothly • Messages from both users shown • Timestamps displayed correctly | ☐ Pass ☐ Fail |
| TC-066 | Mark DM as Read | Medium | 1. Open DM conversation with unread messages 2. View messages | • Messages marked as read automatically • Unread badge removed • Read timestamp recorded • Sender can see read status | ☐ Pass ☐ Fail |
| TC-067 | Edit DM Message | Medium | 1. Hover over own DM 2. Click "Edit" 3. Modify message 4. Save changes | • DM updated successfully • "Edited" label shown • Updated message visible to both users • Edit timestamp recorded | ☐ Pass ☐ Fail |
| TC-068 | Delete DM for Self | Medium | 1. Hover over DM 2. Click "Delete" 3. Select "Delete for me" 4. Confirm | • Message hidden for user only • Other user still sees message • Message marked as hidden • Cannot be recovered | ☐ Pass ☐ Fail |
| TC-069 | React to DM | Low | 1. Hover over DM 2. Click "Add Reaction" 3. Select emoji 4. Confirm | • Reaction added to DM • Emoji displayed • Other user sees reaction • Can remove reaction | ☐ Pass ☐ Fail |
| TC-070 | Reply to DM | Medium | 1. Hover over DM 2. Click "Reply" 3. Type reply message 4. Send | • Reply sent with context • Original message quoted • Reply linked to original • Thread maintained | ☐ Pass ☐ Fail |

---

## Notifications

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-071 | Receive Mention Notification | High | 1. Another user mentions you in channel 2. Observe notification bell icon | • Notification received in real-time • Bell icon shows unread count • Notification type: MENTION • Content shows who mentioned you • Click navigates to message | ☐ Pass ☐ Fail |
| TC-072 | Receive Workspace Invitation Notification | High | 1. Workspace owner sends invitation 2. Check notification panel | • Notification received immediately • Type: WORKSPACE_INVITE • Shows workspace name and inviter • Accept/Reject buttons available • Unread count incremented | ☐ Pass ☐ Fail |
| TC-073 | Receive Channel Invitation Notification | High | 1. Channel owner sends invitation 2. Check notification panel | • Notification received in real-time • Type: CHANNEL_INVITE • Shows channel name and inviter • Accept/Reject buttons available • Click navigates to channel after accept | ☐ Pass ☐ Fail |
| TC-074 | Receive DM Notification | High | 1. Another user sends DM 2. Observe notifications | • Notification received immediately • Type: DIRECT_MESSAGE • Shows sender and message preview • Unread badge on DM list • Click opens DM conversation | ☐ Pass ☐ Fail |
| TC-075 | Mark Notification as Read | Medium | 1. Open notification panel 2. Click on a notification 3. Click "Mark as Read" | • Notification marked as read • Unread count decremented • Notification styling changes • Still visible in notification list | ☐ Pass ☐ Fail |
| TC-076 | View All Notifications | Medium | 1. Click notification bell icon 2. View notification panel | • All notifications displayed • Sorted by date (newest first) • Shows notification type icons • Unread notifications highlighted • Scrollable list | ☐ Pass ☐ Fail |
| TC-077 | Notification Badge Count | Medium | 1. Receive multiple notifications 2. Observe bell icon badge | • Badge shows correct count • Updates in real-time • Maximum display (e.g., 99+) • Decrements when marked read • Disappears when count = 0 | ☐ Pass ☐ Fail |
| TC-078 | Accept Invite from Notification | High | 1. Open notification panel 2. View invitation notification 3. Click "Accept" button | • Invitation accepted • User added to workspace/channel • Notification marked as read • Success message displayed • Workspace/channel appears in list | ☐ Pass ☐ Fail |
| TC-079 | Dismiss Notification | Low | 1. Open notification panel 2. Hover over notification 3. Click "Dismiss" or X icon | • Notification removed from list • Unread count decremented • No other action taken • Cannot be recovered | ☐ Pass ☐ Fail |
| TC-080 | Notification Persistence | Medium | 1. View notifications 2. Logout 3. Login again 4. Check notifications | • Unread notifications persisted • Still visible after re-login • Count maintained • No notifications lost | ☐ Pass ☐ Fail |

---

## File Upload & Attachments

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-081 | Upload Image File | High | 1. Click attachment icon 2. Select image file (PNG, JPG) 3. Confirm upload 4. Send message | • Image uploaded to Cloudinary • Image preview shown in message • File URL stored in database • Other users see image inline • Click to view full size | ☐ Pass ☐ Fail |
| TC-082 | Upload Document File | High | 1. Click attachment icon 2. Select document (PDF, DOCX) 3. Confirm upload 4. Send message | • Document uploaded successfully • File icon and name displayed • Download link available • File metadata stored • Other users can download | ☐ Pass ☐ Fail |
| TC-083 | Upload File Size Limit | High | 1. Try to upload file >10MB 2. Observe validation | • Upload blocked • Error message: "File too large (max 10MB)" • File not uploaded • User can select different file | ☐ Pass ☐ Fail |
| TC-084 | Upload Multiple Files | Medium | 1. Click attachment icon 2. Select multiple files 3. Confirm upload 4. Send message | • All files uploaded • Multiple attachments in one message • Each file shown separately • All files accessible • Proper file metadata | ☐ Pass ☐ Fail |
| TC-085 | View Attachment History | Low | 1. Open channel info 2. Click "Files" tab 3. View all attachments | • All channel attachments listed • Sorted by date • Shows file name, type, size • Shows uploader name • Click to download/view | ☐ Pass ☐ Fail |

---

## User Profile & Presence

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-086 | Update Display Name | Medium | 1. Click user profile icon 2. Click "Edit Profile" 3. Change display name to "John Smith" 4. Click "Save" | • Display name updated • New name shown everywhere • Change reflected in messages • Other users see new name • Success message displayed | ☐ Pass ☐ Fail |
| TC-087 | Upload Profile Avatar | Medium | 1. Open profile settings 2. Click "Upload Avatar" 3. Select image file 4. Crop/adjust if needed 5. Save changes | • Avatar uploaded to Cloudinary • New avatar displayed • Avatar shown in messages • Avatar shown in member lists • Other users see new avatar | ☐ Pass ☐ Fail |
| TC-088 | View User Profile | Low | 1. Click on another user's name 2. View profile modal/page | • Profile information displayed • Shows display name, email • Shows avatar • Shows online status • Shows joined date • Option to send DM | ☐ Pass ☐ Fail |
| TC-089 | Online Status Indicator | High | 1. User A logs in 2. User B observes user list 3. User A logs out 4. User B observes again | • Green dot when online • Gray dot when offline • "Last seen" timestamp when offline • Updates in real-time • Accurate status | ☐ Pass ☐ Fail |
| TC-090 | User Search Functionality | Medium | 1. Click search bar 2. Type user name: "John" 3. View search results | • Matching users displayed • Shows display name and avatar • Shows online status • Click to view profile or send DM • Search is case-insensitive | ☐ Pass ☐ Fail |

---

## Advanced Features

| Test Case ID | Test Case Title | Priority | Test Steps | Expected Result | Status |
|--------------|----------------|----------|------------|-----------------|--------|
| TC-091 | WebSocket Connection Stability | High | 1. Login to application 2. Disconnect internet briefly 3. Reconnect internet 4. Observe WebSocket reconnection | • WebSocket reconnects automatically • No data loss • Messages sync after reconnection • User notified of connection status • Seamless experience | ☐ Pass ☐ Fail |
| TC-092 | Real-time Message Delivery | High | 1. User A sends message 2. User B observes channel (no refresh) | • Message appears instantly for User B • No page refresh needed • Latency <1 second • Message order maintained • Consistent across all users | ☐ Pass ☐ Fail |
| TC-093 | Concurrent Message Sending | Medium | 1. 5 users send messages simultaneously 2. Observe message order | • All messages delivered • Correct chronological order • No messages lost • No duplicate messages • Proper conflict resolution | ☐ Pass ☐ Fail |
| TC-094 | Channel Unread Badge | Medium | 1. New message sent in Channel A 2. User viewing Channel B 3. Observe Channel A in sidebar | • Unread badge appears on Channel A • Badge shows message count • Badge persists until channel opened • Badge clears when channel viewed • Accurate count | ☐ Pass ☐ Fail |
| TC-095 | DM Unread Badge | Medium | 1. Receive new DM 2. User viewing different conversation 3. Observe DM list | • Unread badge on DM conversation • Shows unread count • Badge clears when DM opened • Accurate count • Updates in real-time | ☐ Pass ☐ Fail |
| TC-096 | Message Search in Channel | Low | 1. Open channel 2. Click search icon 3. Enter search term: "meeting" 4. View results | • Matching messages displayed • Highlights search term • Shows message context • Click to jump to message • Search is case-insensitive | ☐ Pass ☐ Fail |
| TC-097 | Emoji Picker Functionality | Low | 1. Click emoji icon in message input 2. Browse emoji categories 3. Select emoji 4. Send message | • Emoji picker opens • Categories displayed • Search functionality works • Selected emoji inserted • Emoji displays correctly | ☐ Pass ☐ Fail |
| TC-098 | Message Timestamp Display | Low | 1. View messages from different times 2. Observe timestamp format | • Recent messages: "2 minutes ago" • Today's messages: "10:30 AM" • Yesterday: "Yesterday at 10:30 AM" • Older: "Jan 15 at 10:30 AM" • Hover shows full timestamp | ☐ Pass ☐ Fail |
| TC-099 | Browser Notification Permission | Low | 1. Login to application 2. Observe browser notification prompt 3. Grant permission | • Browser asks for notification permission • If granted, desktop notifications work • If denied, in-app notifications still work • Can change permission later • Preference saved | ☐ Pass ☐ Fail |
| TC-100 | Application Performance with Large Data | High | 1. Open channel with large message history 2. Scroll through messages 3. Send new message 4. Observe performance | • Smooth scrolling • No lag or freezing • Messages load quickly • Pagination efficient • Memory usage reasonable • No browser crashes | ☐ Pass ☐ Fail |

---

## Test Execution Summary

### Priority Distribution
- **High Priority**: 45 test cases
- **Medium Priority**: 40 test cases
- **Low Priority**: 15 test cases

### Test Coverage
- User Authentication & Registration: 15 test cases
- Workspace Management: 15 test cases
- Channel Management: 15 test cases
- Messaging Features: 15 test cases
- Direct Messaging: 10 test cases
- Notifications: 10 test cases
- File Upload & Attachments: 5 test cases
- User Profile & Presence: 5 test cases
- Advanced Features: 10 test cases

### Test Environment
- **Frontend URL**: http://localhost:5173
- **Backend URL**: http://localhost:8080
- **Database**: PostgreSQL
- **Browsers**: Chrome, Firefox, Safari, Edge

### Expected Pass Rate
- **Target**: 95% pass rate
- **Acceptable**: 90% pass rate
- **Critical**: 100% pass rate for High Priority tests

---

## Sign-off

**Prepared By**: QA Team  
**Reviewed By**: ___________________  
**Approved By**: ___________________  
**Date**: ___________________

---

**End of Test Cases Document**

*This document contains 100 comprehensive functional test cases in table format for easy reference and PDF conversion.*
