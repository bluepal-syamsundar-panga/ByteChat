# ByteChat: 100 Comprehensive Test Cases

This document provides a full suite of 100 test cases for the ByteChat application, covering Authentication, Workspace Management, Channels, Messaging (Real-time), Direct Messaging, User Profiles, and System Notifications.

| ID | Feature | Test Case Description | Input Data | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **001** | **Auth** | Register with valid email and OTP | Valid email, password, correct OTP | User account created and JWT returned | ✅ Implemented |
| **002** | **Auth** | Register with invalid OTP | Valid email, password, incorrect OTP | Error: "Invalid registration data or OTP" | ✅ Implemented |
| **003** | **Auth** | Register with already existing email | Existing email and valid OTP | Error: "User already exists" | ✅ Implemented |
| **004** | **Auth** | Login with valid credentials | Valid email and password | Status 200 and AuthResponse with token | ✅ Implemented |
| **005** | **Auth** | Login with incorrect password | Valid email, wrong password | Status 401/400 and error message | ✅ Implemented |
| **006** | **Auth** | Login with non-existent email | Non-existent email | Error: "User not found" | ✅ Implemented |
| **007** | **Auth** | Send registration OTP | Valid email | OTP sent via email service | ✅ Implemented |
| **008** | **Auth** | Send forgot password OTP | Valid registered email | Reset OTP sent via email | ✅ Implemented |
| **009** | **Auth** | Reset password with valid OTP | Valid OTP and new password | Password updated in database | ✅ Implemented |
| **010** | **Auth** | Refresh token rotation | Valid refresh token | New access token and refresh token returned | ✅ Implemented |
| **011** | **Auth** | Expired refresh token usage | Expired token | Error: "Refresh token expired" | ✅ Implemented |
| **012** | **Auth** | Unauthorized access to protected API | No Bearer token | Status 403/401 Forbidden | ✅ Implemented |
| **013** | **Auth** | Logout and invalidate session | Valid token | Session invalidated and redirect to login | ✅ Proposed |
| **014** | **Auth** | Password reset with expired OTP | Expired OTP | Error: "OTP expired" | ✅ Implemented |
| **015** | **Auth** | Brute force protection on login | 5+ wrong attempts | Account temporarily locked or captcha | ✅ Proposed |
| **016** | **Workspace** | Create workspace with valid name | Name: "Engineering" | Workspace created with current user as owner | ✅ Implemented |
| **017** | **Workspace** | Create workspace with duplicate name | Duplicate name | Error: "Workspace name already taken" | ✅ Implemented |
| **018** | **Workspace** | Join workspace via invitation link | Valid invitation link | User added as member to workspace | ✅ Implemented |
| **019** | **Workspace** | Leave workspace as member | Workspace ID | User removed from workspace members | ✅ Implemented |
| **020** | **Workspace** | Leave workspace as owner | Workspace ID | Error: "Owner cannot leave workspace" | ✅ Implemented |
| **021** | **Workspace** | Archive workspace as owner | Workspace ID, owner token | Workspace status set to ARCHIVED | ✅ Implemented |
| **022** | **Workspace** | Unarchive workspace | Workspace ID, owner token | Workspace status set to ACTIVE | ✅ Implemented |
| **023** | **Workspace** | Delete workspace permanently | Workspace ID, owner token | Workspace and all channels/messages deleted | ✅ Implemented |
| **024** | **Workspace** | Invite user to workspace by email | Valid user email | Invitation notification sent to user | ✅ Implemented |
| **025** | **Workspace** | Invite already member to workspace | User email | Error: "User is already a member" | ✅ Implemented |
| **026** | **Workspace** | List all joined workspaces | Current user token | Page list of user's workspaces | ✅ Implemented |
| **027** | **Workspace** | Update workspace display name | New name | Display name updated for all members | ✅ Proposed |
| **028** | **Workspace** | Remove member from workspace | Member ID, owner token | Member removed from workspace and channels | ✅ Implemented |
| **029** | **Workspace** | Change workspace member role | Member ID, new role (ADMIN) | Member role updated in database | ✅ Implemented |
| **030** | **Workspace** | Join archived workspace | Workspace ID | Error: "Cannot join archived workspace" | ✅ Implemented |
| **031** | **Channel** | Create public channel in workspace | Name: "General" | Channel created and accessible by all members | ✅ Implemented |
| **032** | **Channel** | Create private channel | Name: "Security-Only" | Channel only visible to invited users | ✅ Implemented |
| **033** | **Channel** | Join a public channel | Channel ID | User added to channel_members | ✅ Implemented |
| **034** | **Channel** | Archive channel | Channel ID, admin token | Channel set to READ-ONLY | ✅ Implemented |
| **035** | **Channel** | Delete channel | Channel ID, admin token | Channel and messages soft-deleted | ✅ Implemented |
| **036** | **Channel** | List all channels in workspace | Workspace ID | List of all accessible channels | ✅ Implemented |
| **037** | **Channel** | Update channel topic/description | New description | Update broadcasted to all members | ✅ Proposed |
| **038** | **Channel** | Invite user to private channel | Member ID | User added to private channel_members | ✅ Implemented |
| **039** | **Channel** | Remove user from channel | Member ID, admin token | User access to channel revoked | ✅ Implemented |
| **040** | **Channel** | Mark all messages in channel as read | Channel ID | Unread count for user set to 0 | ✅ Implemented |
| **041** | **Message** | Send text message to channel | Message: "Hello World" | Message saved and broadcasted via WS | ✅ Implemented |
| **042** | **Message** | Send message with markdown | Message: "**Bold**" | Content saved as raw markdown | ✅ Implemented |
| **043** | **Message** | Edit own message | Message ID, new content | Message updated with "Edited" flag | ✅ Implemented |
| **044** | **Message** | Edit someone else's message | Message ID, user token | Error: "Unauthorized to edit" | ✅ Implemented |
| **045** | **Message** | Delete own message | Message ID | Message removed from channel history | ✅ Implemented |
| **046** | **Message** | Pin channel message | Message ID, admin token | Message added to pinned list | ✅ Implemented |
| **047** | **Message** | Unpin channel message | Message ID, admin token | Message removed from pinned list | ✅ Implemented |
| **048** | **Message** | Reply to a message (Threading) | Parent ID, reply content | Reply linked to parent message | ✅ Proposed |
| **049** | **Message** | Retrieve paginated message history | Channel ID, size: 50 | Returns latest 50 messages | ✅ Implemented |
| **050** | **Message** | Retrieve messages older than cursor | cursorSentAt | returns messages before timestamp | ✅ Implemented |
| **051** | **DM** | Send DM request to user | User ID, workspace ID | DM request notification sent | ✅ Implemented |
| **052** | **DM** | Accept DM request | Request ID | DM thread created and history accessible | ✅ Implemented |
| **053** | **DM** | Reject DM request | Request ID | Request deleted and notification cleared | ✅ Implemented |
| **054** | **DM** | Send message in DM thread | Other user ID, message | Message sent and broadcasted to both | ✅ Implemented |
| **055** | **DM** | List all pending DM requests | Current user token | List of requests user received | ✅ Implemented |
| **056** | **DM** | Search for user in workspace to DM | Name query | List of matching workspace members | ✅ Proposed |
| **057** | **DM** | Block user from sending DMs | User ID | All incoming requests from user blocked | ✅ Proposed |
| **058** | **DM** | View DM thread history | Other user ID | Paginated list of private messages | ✅ Implemented |
| **059** | **DM** | Pin a DM thread | Thread ID | Thread moved to "Pinned" section | ✅ Proposed |
| **060** | **DM** | Unpin a DM thread | Thread ID | Thread moved to regular section | ✅ Proposed |
| **061** | **User** | Update user display name | New name: "Syam" | Profile updated in DB and broadcasted | ✅ Implemented |
| **062** | **User** | Upload profile avatar | Image file | URL updated and profile refreshed | ✅ Implemented |
| **063** | **User** | Change online status | Status (ONLINE/AWAY) | Status updated for all contacts | ✅ Implemented |
| **064** | **User** | View someone else's profile | User ID | Profile details and shared channels shown | ✅ Implemented |
| **065** | **User** | Delete own account | User token | User data soft-deleted and session ended | ✅ Proposed |
| **066** | **User** | Get total online users count | System context | Global count of active WS connections | ✅ Implemented |
| **067** | **User** | Search for users by email | Email query | Account details for exact match | ✅ Implemented |
| **068** | **User** | Set "Do Not Disturb" (DND) status | User ID | Notifications suppressed during DND | ✅ Proposed |
| **069** | **User** | View own session history | User token | List of active devices and locations | ✅ Proposed |
| **070** | **User** | Update user preferences (Theme) | DARK mode | UI theme saved per user | ✅ Proposed |
| **071** | **Notify** | Receive WS notification for new message | Real-time | Floating notification/badge shown | ✅ Implemented |
| **072** | **Notify** | Receive notification for DM request | Real-time | Inbox notification count incremented | ✅ Implemented |
| **073** | **Notify** | Mark specific notification as read | Notification ID | Unread count decremented | ✅ Implemented |
| **074** | **Notify** | Clear all notifications | User token | All notifications set to isRead: true | ✅ Proposed |
| **075** | **Notify** | Push notification for offline user | External service | Notification sent via Firebase/APNS | ✅ Proposed |
| **076** | **Notify** | Receive workspace invitation notify | Real-time | Invitation popup shown to user | ✅ Implemented |
| **077** | **Meeting** | Start instant meeting in channel | Channel ID | Meeting link broadcasted to channel | ✅ Implemented |
| **078** | **Meeting** | Join ongoing meeting | Meeting ID | User added to meeting participant list | ✅ Implemented |
| **079** | **Meeting** | End meeting as host | Meeting ID | All users removed and meeting status ended | ✅ Implemented |
| **080** | **Meeting** | Mute/Unmute microphone | User ID in meeting | Status updated for all participants | ✅ Proposed |
| **081** | **Meeting** | Share screen in meeting | User ID | Video stream shared with participants | ✅ Proposed |
| **082** | **Meeting** | View all active meetings in workspace | Workspace ID | List of meetings users can join | ✅ Implemented |
| **083** | **Reactions** | Add emoji reaction to message | Message ID, Emoji: :thumbsup: | Count incremented and broadcasted | ✅ Implemented |
| **084** | **Reactions** | Remove emoji reaction | Message ID, Emoji | Count decremented and broadcasted | ✅ Implemented |
| **085** | **Reactions** | View who reacted to message | Message ID | List of users for specific emoji | ✅ Proposed |
| **086** | **Files** | Upload document to channel | File: report.pdf | File saved to S3/Local and linked in msg | ✅ Implemented |
| **087** | **Files** | Upload image to channel | File: photo.png | Image thumbnail generated and shown | ✅ Implemented |
| **088** | **Files** | Download file from message | File URL | Browser starts file download | ✅ Implemented |
| **089** | **Files** | Delete uploaded file | File ID | File removed from storage and message | ✅ Proposed |
| **090** | **Files** | Search files in workspace | Query: "report" | List of files across all channels | ✅ Proposed |
| **091** | **Typing** | Detect typing in channel | User ID | "User is typing..." shown to others | ✅ Implemented |
| **092** | **Typing** | Stop typing indicator | Typing ends/Timeout | Indicator removed from UI | ✅ Implemented |
| **093** | **Settings** | Update account password (Settings) | Old/New Passwords | Password updated securely | ✅ Proposed |
| **094** | **Settings** | Enable Two-Factor Auth (2FA) | QR Code | User prompted for TOTP during login | ✅ Proposed |
| **095** | **System** | Heartbeat check for WebSockets | PING/PONG | Keep-alive connection maintained | ✅ Implemented |
| **096** | **System** | Reconnect WebSockets on drop | Network drop | Automatic retry and session recovery | ✅ Implemented |
| **097** | **System** | Audit log for Admin actions | Admin activity | Log of configuration changes | ✅ Proposed |
| **098** | **System** | Database backup trigger | Scheduler | Daily snapshot of application state | ✅ Proposed |
| **099** | **System** | View system health / stats | Admin token | CPU/Memory usage and connection count | ✅ Proposed |
| **100** | **System** | Multi-device synchronization | User ID | Message read status synced across devices | ✅ Proposed |
