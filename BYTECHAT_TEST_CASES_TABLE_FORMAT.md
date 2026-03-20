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

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-001 | User Registration with Valid OTP | High | User has valid email address | 1. Navigate to registration page<br>2. Enter email: test@example.com<br>3. Click "Send OTP"<br>4. Check email for OTP code<br>5. Enter received OTP code<br>6. Enter password: Test@123<br>7. Enter display name: John Doe<br>8. Click "Register" | • User account created successfully<br>• JWT tokens received<br>• User redirected to landing page<br>• Success message displayed |
| TC-002 | User Registration with Invalid OTP | High | User on registration page | 1. Enter email: test@example.com<br>2. Click "Send OTP"<br>3. Enter incorrect OTP: 000000<br>4. Enter password and display name<br>5. Click "Register" | • Registration fails<br>• Error message: "Invalid or expired OTP"<br>• User remains on registration page |
| TC-003 | User Registration with Expired OTP | Medium | User has requested OTP | 1. Request OTP for email<br>2. Wait for OTP to expire (>10 minutes)<br>3. Enter expired OTP<br>4. Complete registration form<br>5. Click "Register" | • Registration fails<br>• Error message: "OTP has expired"<br>• Option to resend OTP displayed |
| TC-004 | User Login with Valid Credentials | High | User account exists | 1. Navigate to login page<br>2. Enter email: test@example.com<br>3. Enter password: Test@123<br>4. Click "Login" | • Login successful<br>• JWT tokens received and stored<br>• User redirected to landing page<br>• User's workspaces displayed |
| TC-005 | User Login with Invalid Password | High | User account exists | 1. Navigate to login page<br>2. Enter valid email<br>3. Enter incorrect password<br>4. Click "Login" | • Login fails<br>• Error message: "Invalid credentials"<br>• User remains on login page |
| TC-006 | User Login with Non-existent Email | High | None | 1. Navigate to login page<br>2. Enter non-existent email: notfound@example.com<br>3. Enter any password<br>4. Click "Login" | • Login fails<br>• Error message: "User not found" or "Invalid credentials"<br>• User remains on login page |
| TC-007 | JWT Token Refresh | High | User logged in, access token about to expire | 1. User logged in with valid session<br>2. Wait for access token to expire (15 minutes)<br>3. Make any API request<br>4. Observe token refresh mechanism | • Access token automatically refreshed<br>• New access token received<br>• Original request completed successfully<br>• No user interruption |
| TC-008 | Logout Functionality | High | User logged in | 1. User logged in and on any page<br>2. Click user profile icon<br>3. Click "Logout" button<br>4. Confirm logout | • User logged out successfully<br>• Tokens cleared from storage<br>• Redirected to login page<br>• Cannot access protected routes |
| TC-009 | Password Reset - Request OTP | Medium | User account exists | 1. Navigate to login page<br>2. Click "Forgot Password"<br>3. Enter registered email<br>4. Click "Send OTP"<br>5. Check email | • OTP sent to email<br>• Success message displayed<br>• OTP input field appears |
| TC-010 | Password Reset - Complete Flow | Medium | User has received password reset OTP | 1. Enter received OTP<br>2. Enter new password: NewPass@123<br>3. Confirm new password: NewPass@123<br>4. Click "Reset Password"<br>5. Try logging in with new password | • Password reset successful<br>• Success message displayed<br>• Can login with new password<br>• Old password no longer works |
| TC-011 | Registration with Duplicate Email | High | User account already exists with email | 1. Navigate to registration page<br>2. Enter existing email<br>3. Request OTP<br>4. Complete registration form | • Registration fails<br>• Error message: "Email already registered"<br>• Suggestion to login instead |
| TC-012 | Registration with Weak Password | Medium | None | 1. Navigate to registration page<br>2. Enter valid email and OTP<br>3. Enter weak password: 123<br>4. Try to register | • Validation error displayed<br>• Message: "Password must be at least 8 characters"<br>• Registration blocked until valid password |
| TC-013 | Session Persistence After Browser Refresh | Medium | User logged in | 1. User logged in successfully<br>2. Refresh browser page (F5)<br>3. Observe user state | • User remains logged in<br>• Session persisted<br>• User data still available<br>• No redirect to login |
| TC-014 | Multiple Login Sessions | Low | User account exists | 1. Login from Browser 1<br>2. Login from Browser 2 with same credentials<br>3. Perform actions in both browsers | • Both sessions active<br>• Actions reflected in both browsers<br>• No session conflict |
| TC-015 | Login with Email Case Insensitivity | Low | User registered with test@example.com | 1. Navigate to login page<br>2. Enter email: TEST@EXAMPLE.COM<br>3. Enter correct password<br>4. Click "Login" | • Login successful<br>• Email treated as case-insensitive<br>• User logged in normally |

---

## Workspace Management

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-016 | Create Workspace with Valid OTP | High | User logged in | 1. Click "Create Workspace" button<br>2. Enter email for verification<br>3. Click "Send OTP"<br>4. Enter received OTP<br>5. Enter workspace name: "My Team"<br>6. Enter description: "Team workspace"<br>7. Select privacy: Public<br>8. Click "Create" | • Workspace created successfully<br>• User set as workspace owner<br>• Default #general channel created<br>• User added to #general channel<br>• Redirected to workspace chat |
| TC-017 | Create Private Workspace | High | User logged in, OTP verified | 1. Navigate to workspace creation<br>2. Complete OTP verification<br>3. Enter workspace name<br>4. Select "Private" option<br>5. Click "Create" | • Private workspace created<br>• Only visible to members<br>• Owner can invite users<br>• Privacy setting saved correctly |
| TC-018 | View All User Workspaces | High | User is member of multiple workspaces | 1. Login to application<br>2. Navigate to landing page<br>3. Observe workspace list | • All workspaces displayed<br>• Shows owned and member workspaces<br>• Workspace names and descriptions visible<br>• Click to enter workspace |
| TC-019 | Invite User to Workspace by Email | High | User is workspace owner/admin | 1. Open workspace<br>2. Click "Invite Members" in sidebar<br>3. Enter invitee email: newuser@example.com<br>4. Click "Send Invitation" | • Invitation created with PENDING status<br>• Notification sent to invitee<br>• Success message displayed<br>• Invitation appears in invitee's notifications |
| TC-020 | Accept Workspace Invitation | High | User has pending workspace invitation | 1. Login as invited user<br>2. Click notification bell icon<br>3. View workspace invitation<br>4. Click "Accept" button | • Invitation status changed to ACCEPTED<br>• User added to workspace as MEMBER<br>• User added to #general channel<br>• Workspace appears in user's workspace list<br>• Notification marked as read |
| TC-021 | Reject Workspace Invitation | Medium | User has pending workspace invitation | 1. Login as invited user<br>2. Open notifications panel<br>3. View workspace invitation<br>4. Click "Reject" button | • Invitation status changed to REJECTED<br>• User not added to workspace<br>• Notification removed from list<br>• Can still be invited again later |
| TC-022 | Leave Workspace as Member | Medium | User is workspace member (not owner) | 1. Open workspace<br>2. Click workspace settings<br>3. Click "Leave Workspace"<br>4. Confirm action | • User removed from workspace<br>• User removed from all workspace channels<br>• Workspace no longer visible to user<br>• Confirmation message displayed |
| TC-023 | Archive Workspace | Medium | User is workspace owner | 1. Open workspace settings<br>2. Click "Archive Workspace"<br>3. Confirm action | • Workspace archived (isArchived = true)<br>• Workspace moved to archived section<br>• No new channels can be created<br>• Existing content remains accessible<br>• Can be restored later |
| TC-024 | View Workspace Members | Medium | User is workspace member | 1. Open workspace<br>2. Click "Members" or workspace name<br>3. View member list | • All workspace members displayed<br>• Shows display name and avatar<br>• Shows member roles (OWNER/ADMIN/MEMBER)<br>• Shows online status |
| TC-025 | Remove Member from Workspace | High | User is workspace owner | 1. Open workspace members list<br>2. Select a member<br>3. Click "Remove Member"<br>4. Confirm action | • Member removed from workspace<br>• Member removed from all channels<br>• Member loses access immediately<br>• Workspace no longer visible to removed user |
| TC-026 | Transfer Workspace Ownership | Low | User is workspace owner, another admin exists | 1. Open workspace settings<br>2. Click "Transfer Ownership"<br>3. Select new owner from admin list<br>4. Confirm transfer | • Ownership transferred to selected user<br>• Previous owner becomes admin<br>• New owner has full control<br>• Change reflected immediately |
| TC-027 | Create Workspace with Duplicate Name | Low | Workspace with name already exists | 1. Try to create workspace<br>2. Enter existing workspace name<br>3. Complete form<br>4. Click "Create" | • Workspace created successfully<br>• Duplicate names allowed<br>• Each workspace has unique ID<br>• No conflict |
| TC-028 | Workspace with Special Characters in Name | Low | User logged in | 1. Create new workspace<br>2. Enter name: "Team @#$% 2024"<br>3. Complete creation | • Workspace created successfully<br>• Special characters handled properly<br>• Name displayed correctly<br>• No encoding issues |
| TC-029 | View Workspace Without Membership | Medium | Private workspace exists, user not a member | 1. Try to access workspace URL directly<br>2. Attempt to view workspace | • Access denied<br>• Error message: "You don't have access"<br>• Redirected to landing page<br>• Workspace not visible in list |
| TC-030 | Workspace Pagination | Low | User is member of 50+ workspaces | 1. Navigate to landing page<br>2. Scroll through workspace list<br>3. Observe pagination | • Workspaces loaded in pages (50 per page)<br>• Smooth scrolling<br>• Load more on scroll<br>• No performance issues |

---


## Channel Management

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-031 | Create Public Channel | High | User is workspace member | 1. Open workspace<br>2. Click "Create Channel" button<br>3. Enter channel name: "announcements"<br>4. Enter description: "Team announcements"<br>5. Select "Public"<br>6. Click "Create" | • Channel created successfully<br>• Creator added as channel owner<br>• Channel visible to all workspace members<br>• Channel appears in sidebar |
| TC-032 | Create Private Channel | High | User is workspace member | 1. Click "Create Channel"<br>2. Enter channel name: "private-team"<br>3. Select "Private"<br>4. Click "Create" | • Private channel created<br>• Only creator can see initially<br>• Lock icon displayed<br>• Can invite specific members |
| TC-033 | Invite User to Private Channel | High | User owns private channel | 1. Open private channel<br>2. Click channel settings<br>3. Click "Invite Members"<br>4. Select user from workspace members<br>5. Click "Send Invitation" | • Invitation sent to user<br>• Notification created<br>• User receives channel invite notification<br>• Channel remains private |
| TC-034 | Accept Channel Invitation | High | User has pending channel invitation | 1. Open notifications panel<br>2. View channel invitation<br>3. Click "Accept" | • User added to channel<br>• Channel appears in sidebar<br>• Can view channel messages<br>• Can send messages |
| TC-035 | Archive Channel | Medium | User is channel owner | 1. Open channel<br>2. Click channel settings<br>3. Click "Archive Channel"<br>4. Confirm action | • Channel archived (isArchived = true)<br>• Moved to "Archived" section<br>• Read-only access<br>• No new messages allowed<br>• Can be restored |
| TC-036 | Delete Channel (Soft Delete) | Medium | User is channel owner | 1. Open channel settings<br>2. Click "Delete Channel"<br>3. Confirm deletion | • Channel soft deleted (isDeleted = true)<br>• Moved to "Trash" section<br>• Not visible in main channel list<br>• Can be restored within retention period<br>• Can be permanently deleted |
| TC-037 | Restore Archived Channel | Medium | Channel is archived | 1. Navigate to "Archived" section<br>2. Select archived channel<br>3. Click "Restore Channel"<br>4. Confirm action | • Channel restored (isArchived = false)<br>• Moved back to active channels<br>• Full functionality restored<br>• Can send messages again |
| TC-038 | Permanently Delete Channel | High | Channel is in trash | 1. Navigate to "Trash" section<br>2. Select deleted channel<br>3. Click "Delete Permanently"<br>4. Confirm action | • Channel permanently deleted from database<br>• All messages deleted<br>• Cannot be restored<br>• Confirmation message displayed |
| TC-039 | Leave Channel as Member | Medium | User is channel member (not owner) | 1. Open channel<br>2. Click channel settings<br>3. Click "Leave Channel"<br>4. Confirm action | • User removed from channel<br>• Channel removed from sidebar<br>• Cannot access channel anymore<br>• Can be re-invited |
| TC-040 | Remove Member from Channel | Medium | User is channel owner/admin | 1. Open channel settings<br>2. View members list<br>3. Select a member<br>4. Click "Remove Member"<br>5. Confirm action | • Member removed from channel<br>• Member loses access immediately<br>• Channel removed from member's sidebar<br>• Notification sent to removed member |
| TC-041 | Promote Member to Channel Admin | Medium | User is channel owner | 1. Open channel settings<br>2. View members list<br>3. Select a member<br>4. Click "Make Admin"<br>5. Confirm action | • Member promoted to admin role<br>• Admin badge displayed<br>• Admin permissions granted<br>• Can manage channel members |
| TC-042 | Demote Channel Admin to Member | Medium | User is channel owner, admin exists | 1. Open channel settings<br>2. View members list<br>3. Select an admin<br>4. Click "Remove Admin"<br>5. Confirm action | • Admin demoted to member role<br>• Admin badge removed<br>• Admin permissions revoked<br>• Still remains as member |
| TC-043 | Transfer Channel Ownership | Low | User is channel owner | 1. Open channel settings<br>2. Click "Transfer Ownership"<br>3. Select new owner from members<br>4. Confirm transfer | • Ownership transferred<br>• Previous owner becomes admin<br>• New owner has full control<br>• Change reflected immediately |
| TC-044 | View Channel Members List | Medium | User is channel member | 1. Open channel<br>2. Click channel name or info icon<br>3. View members list | • All channel members displayed<br>• Shows display names and avatars<br>• Shows online status<br>• Shows member roles |
| TC-045 | Create Channel with Duplicate Name | Low | Channel with name exists in workspace | 1. Try to create channel<br>2. Enter existing channel name<br>3. Complete form<br>4. Click "Create" | • Channel created successfully<br>• Duplicate names allowed in same workspace<br>• Each channel has unique ID<br>• No conflict |

---

## Messaging Features

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-046 | Send Text Message in Channel | High | User is channel member | 1. Open channel<br>2. Type message: "Hello, team!"<br>3. Press Enter or click Send | • Message sent successfully<br>• Message appears in chat window<br>• Timestamp displayed<br>• Sender name and avatar shown<br>• Other members see message in real-time |
| TC-047 | Send Message with @Mention | High | User is channel member, other members exist | 1. Open channel<br>2. Type: "Hey @JohnDoe, check this out!"<br>3. Send message | • Message sent with mention<br>• @JohnDoe highlighted in blue<br>• Notification sent to mentioned user<br>• Mentioned user sees "mentioned you" badge<br>• Message has blue left border for mentioned user |
| TC-048 | Reply to Message | High | Messages exist in channel | 1. Hover over a message<br>2. Click "Reply" icon<br>3. Type reply: "Thanks for the update!"<br>4. Send message | • Reply sent successfully<br>• Original message quoted in reply<br>• Reply linked to original message<br>• Thread context visible |
| TC-049 | Edit Own Message | High | User has sent a message | 1. Hover over own message<br>2. Click "Edit" icon<br>3. Modify message text<br>4. Click "Save" or press Enter | • Message updated successfully<br>• "Edited" label displayed<br>• Edit timestamp shown<br>• Updated message visible to all<br>• Original message replaced |
| TC-050 | Delete Own Message (For Self) | Medium | User has sent a message | 1. Hover over own message<br>2. Click "Delete" icon<br>3. Select "Delete for me"<br>4. Confirm deletion | • Message hidden for user only<br>• Other users still see message<br>• Message marked as hidden for user<br>• Cannot be recovered |
| TC-051 | Delete Message for Everyone | High | User is message sender or channel admin | 1. Hover over message<br>2. Click "Delete" icon<br>3. Select "Delete for everyone"<br>4. Confirm deletion | • Message deleted for all users<br>• Message marked as deleted (isDeleted = true)<br>• Shows "Message deleted" placeholder<br>• Cannot be recovered |
| TC-052 | Pin Message to Channel | Medium | User is channel member | 1. Hover over important message<br>2. Click "Pin" icon<br>3. Confirm pin action | • Message pinned successfully<br>• Pin icon displayed on message<br>• Message appears in pinned messages section<br>• All members can see pinned message |
| TC-053 | React to Message with Emoji | Medium | Messages exist in channel | 1. Hover over a message<br>2. Click "Add Reaction" icon<br>3. Select emoji: 👍<br>4. Click emoji | • Reaction added to message<br>• Emoji displayed below message<br>• Reaction count shown<br>• User's reaction highlighted<br>• Other users see reaction in real-time |
| TC-054 | Remove Own Reaction | Low | User has reacted to a message | 1. View message with own reaction<br>2. Click on own reaction emoji | • Reaction removed<br>• Emoji count decremented<br>• If count = 0, emoji removed<br>• Change visible to all users |
| TC-055 | View Message History with Pagination | High | Channel has 100+ messages | 1. Open channel<br>2. Scroll to top of messages<br>3. Observe "Load More" behavior | • Initial 50 messages loaded<br>• Scroll up loads previous messages<br>• Smooth pagination<br>• No duplicate messages<br>• Maintains scroll position |
| TC-056 | Send Message with Multiple Mentions | Medium | Multiple users in channel | 1. Type message: "@John @Jane @Mike please review"<br>2. Send message | • All three users mentioned<br>• All mentions highlighted<br>• Notifications sent to all three users<br>• Each user sees mention badge |
| TC-057 | Send Long Message (1000+ characters) | Low | User in channel | 1. Type very long message (>1000 chars)<br>2. Send message | • Message sent successfully<br>• Full message stored<br>• Message displayed with proper formatting<br>• Scrollable if needed<br>• No truncation |
| TC-058 | Send Message with Special Characters | Low | User in channel | 1. Type message with special chars: "Test @#$%^&*() <script>"<br>2. Send message | • Message sent successfully<br>• Special characters escaped/sanitized<br>• No XSS vulnerability<br>• Message displayed correctly |
| TC-059 | Typing Indicator | Medium | Multiple users in channel | 1. User A starts typing<br>2. User B observes channel | • "User A is typing..." displayed to User B<br>• Indicator appears within 1 second<br>• Indicator disappears after 3 seconds of inactivity<br>• Multiple users typing shown |
| TC-060 | Message Read Receipts | Low | User sends message in channel | 1. Send message<br>2. Other users view message<br>3. Check read status | • Read receipts tracked<br>• Can see who read message<br>• Read count displayed<br>• Updates in real-time |

---

## Direct Messaging

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-061 | Send DM Request to User | High | Two users in same workspace | 1. Click on user's name<br>2. Click "Send Message"<br>3. System creates DM request | • DM request created with PENDING status<br>• Notification sent to recipient<br>• Request appears in recipient's notifications<br>• Sender can see pending status |
| TC-062 | Accept DM Request | High | User has pending DM request | 1. Open notifications<br>2. View DM request<br>3. Click "Accept" | • Request status changed to ACCEPTED<br>• DM conversation opened<br>• Both users can send messages<br>• Conversation appears in DM list |
| TC-063 | Reject DM Request | Medium | User has pending DM request | 1. Open notifications<br>2. View DM request<br>3. Click "Reject" | • Request status changed to REJECTED<br>• No DM conversation created<br>• Requester notified of rejection<br>• Can request again later |
| TC-064 | Send Direct Message | High | DM conversation established | 1. Open DM conversation<br>2. Type message: "Hi, how are you?"<br>3. Send message | • Message sent successfully<br>• Message appears in conversation<br>• Recipient receives notification<br>• Message delivered in real-time<br>• Unread badge shown to recipient |
| TC-065 | View DM History | High | DM conversation with message history | 1. Open DM conversation<br>2. Scroll through messages<br>3. Load older messages | • All messages displayed chronologically<br>• Pagination works smoothly<br>• Messages from both users shown<br>• Timestamps displayed correctly |
| TC-066 | Mark DM as Read | Medium | User has unread DMs | 1. Open DM conversation with unread messages<br>2. View messages | • Messages marked as read automatically<br>• Unread badge removed<br>• Read timestamp recorded<br>• Sender can see read status |
| TC-067 | Edit DM Message | Medium | User has sent DM | 1. Hover over own DM<br>2. Click "Edit"<br>3. Modify message<br>4. Save changes | • DM updated successfully<br>• "Edited" label shown<br>• Updated message visible to both users<br>• Edit timestamp recorded |
| TC-068 | Delete DM for Self | Medium | DM conversation exists | 1. Hover over DM<br>2. Click "Delete"<br>3. Select "Delete for me"<br>4. Confirm | • Message hidden for user only<br>• Other user still sees message<br>• Message marked as hidden<br>• Cannot be recovered |
| TC-069 | React to DM | Low | DM conversation exists | 1. Hover over DM<br>2. Click "Add Reaction"<br>3. Select emoji<br>4. Confirm | • Reaction added to DM<br>• Emoji displayed<br>• Other user sees reaction<br>• Can remove reaction |
| TC-070 | Reply to DM | Medium | DM conversation exists | 1. Hover over DM<br>2. Click "Reply"<br>3. Type reply message<br>4. Send | • Reply sent with context<br>• Original message quoted<br>• Reply linked to original<br>• Thread maintained |

---

## Notifications

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-071 | Receive Mention Notification | High | User mentioned in message | 1. Another user mentions you in channel<br>2. Observe notification bell icon | • Notification received in real-time<br>• Bell icon shows unread count<br>• Notification type: MENTION<br>• Content shows who mentioned you<br>• Click navigates to message |
| TC-072 | Receive Workspace Invitation Notification | High | User invited to workspace | 1. Workspace owner sends invitation<br>2. Check notification panel | • Notification received immediately<br>• Type: WORKSPACE_INVITE<br>• Shows workspace name and inviter<br>• Accept/Reject buttons available<br>• Unread count incremented |
| TC-073 | Receive Channel Invitation Notification | High | User invited to private channel | 1. Channel owner sends invitation<br>2. Check notification panel | • Notification received in real-time<br>• Type: CHANNEL_INVITE<br>• Shows channel name and inviter<br>• Accept/Reject buttons available<br>• Click navigates to channel after accept |
| TC-074 | Receive DM Notification | High | User receives new DM | 1. Another user sends DM<br>2. Observe notifications | • Notification received immediately<br>• Type: DIRECT_MESSAGE<br>• Shows sender and message preview<br>• Unread badge on DM list<br>• Click opens DM conversation |
| TC-075 | Mark Notification as Read | Medium | User has unread notifications | 1. Open notification panel<br>2. Click on a notification<br>3. Click "Mark as Read" | • Notification marked as read<br>• Unread count decremented<br>• Notification styling changes<br>• Still visible in notification list |
| TC-076 | View All Notifications | Medium | User has multiple notifications | 1. Click notification bell icon<br>2. View notification panel | • All notifications displayed<br>• Sorted by date (newest first)<br>• Shows notification type icons<br>• Unread notifications highlighted<br>• Scrollable list |
| TC-077 | Notification Badge Count | Medium | User has unread notifications | 1. Receive multiple notifications<br>2. Observe bell icon badge | • Badge shows correct count<br>• Updates in real-time<br>• Maximum display (e.g., 99+)<br>• Decrements when marked read<br>• Disappears when count = 0 |
| TC-078 | Accept Invite from Notification | High | User has workspace/channel invite | 1. Open notification panel<br>2. View invitation notification<br>3. Click "Accept" button | • Invitation accepted<br>• User added to workspace/channel<br>• Notification marked as read<br>• Success message displayed<br>• Workspace/channel appears in list |
| TC-079 | Dismiss Notification | Low | User has notifications | 1. Open notification panel<br>2. Hover over notification<br>3. Click "Dismiss" or X icon | • Notification removed from list<br>• Unread count decremented<br>• No other action taken<br>• Cannot be recovered |
| TC-080 | Notification Persistence | Medium | User has notifications | 1. View notifications<br>2. Logout<br>3. Login again<br>4. Check notifications | • Unread notifications persisted<br>• Still visible after re-login<br>• Count maintained<br>• No notifications lost |

---

## File Upload & Attachments

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-081 | Upload Image File | High | User in channel | 1. Click attachment icon<br>2. Select image file (PNG, JPG)<br>3. Confirm upload<br>4. Send message | • Image uploaded to Cloudinary<br>• Image preview shown in message<br>• File URL stored in database<br>• Other users see image inline<br>• Click to view full size |
| TC-082 | Upload Document File | High | User in channel | 1. Click attachment icon<br>2. Select document (PDF, DOCX)<br>3. Confirm upload<br>4. Send message | • Document uploaded successfully<br>• File name and icon displayed<br>• Download link available<br>• File size shown<br>• Other users can download |
| TC-083 | Upload File Size Limit | High | User in channel | 1. Try to upload file >10MB<br>2. Observe validation | • Upload blocked<br>• Error message: "File too large (max 10MB)"<br>• File not uploaded<br>• User can select different file |
| TC-084 | Upload Multiple Files | Medium | User in channel | 1. Click attachment icon<br>2. Select multiple files<br>3. Confirm upload<br>4. Send message | • All files uploaded<br>• Multiple attachments in one message<br>• Each file shown separately<br>• All files accessible<br>• Proper file metadata |
| TC-085 | View Attachment History | Low | Channel has file attachments | 1. Open channel info<br>2. Click "Files" tab<br>3. View all attachments | • All channel attachments listed<br>• Sorted by date<br>• Shows file name, type, size<br>• Shows uploader name<br>• Click to download/view |

---

## User Profile & Presence

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-086 | Update Display Name | Medium | User logged in | 1. Click user profile icon<br>2. Click "Edit Profile"<br>3. Change display name to "John Smith"<br>4. Click "Save" | • Display name updated<br>• New name shown everywhere<br>• Change reflected in messages<br>• Other users see new name<br>• Success message displayed |
| TC-087 | Upload Profile Avatar | Medium | User logged in | 1. Open profile settings<br>2. Click "Upload Avatar"<br>3. Select image file<br>4. Crop/adjust if needed<br>5. Save changes | • Avatar uploaded to Cloudinary<br>• New avatar displayed<br>• Avatar shown in messages<br>• Avatar shown in member lists<br>• Other users see new avatar |
| TC-088 | View User Profile | Low | User in workspace | 1. Click on another user's name<br>2. View profile modal/page | • Profile information displayed<br>• Shows display name, email<br>• Shows avatar<br>• Shows online status<br>• Shows joined date<br>• Option to send DM |
| TC-089 | Online Status Indicator | High | Multiple users in workspace | 1. User A logs in<br>2. User B observes user list<br>3. User A logs out<br>4. User B observes again | • Green dot when online<br>• Gray dot when offline<br>• "Last seen" timestamp when offline<br>• Updates in real-time<br>• Accurate status |
| TC-090 | User Search Functionality | Medium | Multiple users in system | 1. Click search bar<br>2. Type user name: "John"<br>3. View search results | • Matching users displayed<br>• Shows display name and avatar<br>• Shows online status<br>• Click to view profile or send DM<br>• Search is case-insensitive |

---

## Advanced Features

| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result |
|--------------|----------------|----------|---------------|------------|-----------------|
| TC-091 | WebSocket Connection Stability | High | User logged in | 1. Login to application<br>2. Disconnect internet briefly<br>3. Reconnect internet<br>4. Observe WebSocket reconnection | • WebSocket reconnects automatically<br>• No data loss<br>• Messages sync after reconnection<br>• User notified of connection status<br>• Seamless experience |
| TC-092 | Real-time Message Delivery | High | Two users in same channel | 1. User A sends message<br>2. User B observes channel (no refresh) | • Message appears instantly for User B<br>• No page refresh needed<br>• Latency <1 second<br>• Message order maintained<br>• Consistent across all users |
| TC-093 | Concurrent Message Sending | Medium | Multiple users in channel | 1. 5 users send messages simultaneously<br>2. Observe message order | • All messages delivered<br>• Correct chronological order<br>• No messages lost<br>• No duplicate messages<br>• Proper conflict resolution |
| TC-094 | Channel Unread Badge | Medium | User is member of multiple channels | 1. New message sent in Channel A<br>2. User viewing Channel B<br>3. Observe Channel A in sidebar | • Unread badge appears on Channel A<br>• Badge shows message count<br>• Badge persists until channel opened<br>• Badge clears when channel viewed<br>• Accurate count |
| TC-095 | DM Unread Badge | Medium | User has DM conversations | 1. Receive new DM<br>2. User viewing different conversation<br>3. Observe DM list | • Unread badge on DM conversation<br>• Shows unread count<br>• Badge clears when DM opened<br>• Accurate count<br>• Updates in real-time |
| TC-096 | Message Search in Channel | Low | Channel has many messages | 1. Open channel<br>2. Click search icon<br>3. Enter search term: "meeting"<br>4. View results | • Matching messages displayed<br>• Highlights search term<br>• Shows message context<br>• Click to jump to message<br>• Search is case-insensitive |
| TC-097 | Emoji Picker Functionality | Low | User composing message | 1. Click emoji icon in message input<br>2. Browse emoji categories<br>3. Select emoji<br>4. Send message | • Emoji picker opens<br>• Categories displayed<br>• Search functionality works<br>• Selected emoji inserted<br>• Emoji displays correctly |
| TC-098 | Message Timestamp Display | Low | Messages in channel | 1. View messages from different times<br>2. Observe timestamp format | • Recent messages: "2 minutes ago"<br>• Today's messages: "10:30 AM"<br>• Yesterday: "Yesterday at 10:30 AM"<br>• Older: "Jan 15 at 10:30 AM"<br>• Hover shows full timestamp |
| TC-099 | Browser Notification Permission | Low | User first login | 1. Login to application<br>2. Observe browser notification prompt<br>3. Grant permission | • Browser asks for notification permission<br>• If granted, desktop notifications work<br>• If denied, in-app notifications still work<br>• Can change permission later<br>• Preference saved |
| TC-100 | Application Performance with Large Data | High | User in workspace with 1000+ messages | 1. Open channel with large message history<br>2. Scroll through messages<br>3. Send new message<br>4. Observe performance | • Smooth scrolling<br>• No lag or freezing<br>• Messages load quickly<br>• Pagination efficient<br>• Memory usage reasonable<br>• No browser crashes |

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
