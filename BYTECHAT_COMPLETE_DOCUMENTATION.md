# ByteChat - Complete Application Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema & Entity Relationships](#database-schema--entity-relationships)
4. [Core Flows & Functionalities](#core-flows--functionalities)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [WebSocket Topics & Real-time Communication](#websocket-topics--real-time-communication)
7. [Security & Authentication](#security--authentication)
8. [Frontend Architecture](#frontend-architecture)
9. [Deployment Guide](#deployment-guide)

---

## Application Overview

ByteChat is a production-ready, real-time chat application inspired by Slack. It provides workspace-based collaboration with channels, direct messaging, file sharing, and advanced messaging features.

### Key Features
- **Workspace Management**: Create and manage multiple workspaces
- **Channel Communication**: Public and private channels within workspaces
- **Direct Messaging**: One-on-one conversations with DM request system
- **Real-time Updates**: WebSocket-based instant messaging
- **Advanced Messaging**: Mentions, replies, reactions, pins, edits
- **File Sharing**: Upload and share files via Cloudinary
- **Notifications**: Real-time notification system
- **Online Presence**: Track user online/offline status
- **Role-based Access**: Workspace and channel-level permissions

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.3.1 |
| Build Tool | Vite | 7.1.12 |
| State Management | Zustand | 5.0.11 |
| Styling | TailwindCSS | 4.2.1 |
| Backend | Spring Boot | 3.2.3 |
| Language | Java | 17 |
| Database | PostgreSQL | Latest |
| Security | Spring Security + JWT | - |
| WebSocket | STOMP/SockJS | - |
| File Storage | Cloudinary | - |
| Email | Spring Mail | - |
| Migration | Flyway | - |
| API Docs | SpringDoc OpenAPI | 2.3.0 |

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Browser    │  │   Browser    │          │
│  │   (User 1)   │  │   (User 2)   │  │   (User 3)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   React App     │
                    │   (Port 5173)   │
                    │                 │
                    │  - Zustand      │
                    │  - React Query  │
                    │  - Axios        │
                    │  - STOMP.js     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   HTTP/REST            WebSocket           File Upload
        │                    │                    │
┌───────▼────────────────────▼────────────────────▼───────┐
│              SPRING BOOT APPLICATION                     │
│                   (Port 8080)                            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ REST         │  │ WebSocket    │  │ File Upload  │ │
│  │ Controllers  │  │ Controller   │  │ Controller   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼───────┐ │
│  │              Service Layer                          │ │
│  │  - AuthService    - MessageService                 │ │
│  │  - WorkspaceService - ChannelService               │ │
│  │  - NotificationService - UserService               │ │
│  └──────┬──────────────────────────────────────────────┘ │
│         │                                                 │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │           Repository Layer (JPA)                    │ │
│  └──────┬──────────────────────────────────────────────┘ │
└─────────┼────────────────────────────────────────────────┘
          │
┌─────────▼─────────┐    ┌──────────────┐
│   PostgreSQL      │    │  Cloudinary  │
│   Database        │    │  (Files)     │
└───────────────────┘    └──────────────┘
```

### Component Interaction Flow

```
User Action → React Component → Service Layer → API Call
                                                    ↓
                                            Spring Controller
                                                    ↓
                                            Service Layer
                                                    ↓
                                            Repository
                                                    ↓
                                            Database
                                                    ↓
                                            Response ← WebSocket Broadcast
                                                    ↓
                                            All Connected Clients
```

---

## Database Schema & Entity Relationships

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ PK id           │
│    email        │◄──────────┐
│    password     │           │
│    displayName  │           │
│    avatarUrl    │           │
│    lastSeen     │           │
│    online       │           │
│    role         │           │
│    createdAt    │           │
└────────┬────────┘           │
         │                    │
         │ owns               │ member of
         │                    │
         ▼                    │
┌─────────────────┐           │
│   WORKSPACES    │           │
│─────────────────│           │
│ PK id           │           │
│    name         │           │
│    description  │           │
│    isPrivate    │           │
│    isArchived   │           │
│ FK owner_id     │───────────┘
│    createdAt    │
└────────┬────────┘
         │
         │ has
         │
         ▼
┌──────────────────────┐
│  WORKSPACE_MEMBERS   │
│──────────────────────│
│ PK id                │
│ FK workspace_id      │──────┐
│ FK user_id           │      │
│    role              │      │
│    joinedAt          │      │
└──────────────────────┘      │
                              │
         ┌────────────────────┘
         │
         ▼
┌─────────────────┐
│    CHANNELS     │
│─────────────────│
│ PK id           │
│    name         │
│    description  │
│ FK workspace_id │
│    isPrivate    │
│    isDefault    │
│    isArchived   │
│    isDeleted    │
│ FK created_by   │
│    createdAt    │
└────────┬────────┘
         │
         │ has
         │
         ▼
┌──────────────────────┐
│   CHANNEL_MEMBERS    │
│──────────────────────│
│ PK channel_id        │
│ PK user_id           │
│    role              │
│    joinedAt          │
└──────────────────────┘
         │
         │ contains
         │
         ▼
┌─────────────────┐
│    MESSAGES     │
│─────────────────│
│ PK id           │
│ FK channel_id   │
│ FK sender_id    │
│    content      │
│    type         │
│    isDeleted    │
│    isPinned     │
│    sentAt       │
│    editedAt     │
│    replyToId    │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────────┐  ┌──────────────────┐
│ MESSAGE_MENTIONS │  │    REACTIONS     │
│──────────────────│  │──────────────────│
│ PK message_id    │  │ PK id            │
│ PK user_id       │  │ FK message_id    │
└──────────────────┘  │ FK user_id       │
                      │    emoji         │
                      │    createdAt     │
                      └──────────────────┘

┌─────────────────┐
│ DIRECT_MESSAGES │
│─────────────────│
│ PK id           │
│ FK from_user_id │
│ FK to_user_id   │
│ FK workspace_id │
│    content      │
│    type         │
│    isDeleted    │
│    readAt       │
│    sentAt       │
│    replyToId    │
└─────────────────┘

┌─────────────────┐
│  NOTIFICATIONS  │
│─────────────────│
│ PK id           │
│ FK recipient_id │
│    type         │
│    content      │
│    relatedId    │
│    isRead       │
│    createdAt    │
└─────────────────┘

┌─────────────────┐
│   ATTACHMENTS   │
│─────────────────│
│ PK id           │
│ FK message_id   │
│ FK uploader_id  │
│    fileName     │
│    fileType     │
│    fileSize     │
│    fileUrl      │
│    uploadedAt   │
└─────────────────┘
```


### Database Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| **users** | User accounts | Owner of workspaces, member of workspaces/channels |
| **workspaces** | Workspace containers | Has many channels, has many members |
| **workspace_members** | Workspace membership | Links users to workspaces with roles |
| **workspace_invitations** | Pending workspace invites | Links inviter, invitee, workspace |
| **channels** | Communication channels | Belongs to workspace, has many members |
| **channel_members** | Channel membership | Links users to channels with roles |
| **channel_invitations** | Pending channel invites | Links inviter, invitee, channel |
| **messages** | Channel messages | Belongs to channel, sent by user |
| **message_mentions** | User mentions in messages | Links messages to mentioned users |
| **direct_messages** | Private messages | Between two users in workspace |
| **dm_requests** | DM permission requests | Request to start DM conversation |
| **reactions** | Emoji reactions | On messages, by users |
| **notifications** | User notifications | Sent to recipient about events |
| **attachments** | File uploads | Attached to messages |
| **message_reads** | Read receipts | Tracks who read which message |
| **otps** | Verification codes | For email verification |

### Key Relationships

1. **User ↔ Workspace**: Many-to-Many through `workspace_members`
2. **User ↔ Channel**: Many-to-Many through `channel_members`
3. **Workspace ↔ Channel**: One-to-Many (workspace has many channels)
4. **Channel ↔ Message**: One-to-Many (channel has many messages)
5. **User ↔ Message**: One-to-Many (user sends many messages)
6. **Message ↔ User (mentions)**: Many-to-Many through `message_mentions`
7. **Message ↔ Reaction**: One-to-Many (message has many reactions)
8. **User ↔ DirectMessage**: Two foreign keys (from_user, to_user)

---

## Core Flows & Functionalities

### 1. User Registration & Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  REGISTRATION FLOW                            │
└──────────────────────────────────────────────────────────────┘

User enters email/password
         │
         ▼
POST /api/auth/send-otp
         │
         ▼
Backend generates 6-digit OTP
         │
         ▼
Email sent with OTP code
         │
         ▼
User enters OTP code
         │
         ▼
POST /api/auth/register
  { email, password, displayName, otpCode }
         │
         ▼
Backend validates OTP
         │
         ├─── Invalid ──► Error: "Invalid or expired OTP"
         │
         ▼ Valid
User account created
         │
         ▼
JWT tokens generated
  - Access Token (15 min)
  - Refresh Token (7 days)
         │
         ▼
Return AuthResponse
  { accessToken, refreshToken, user }
         │
         ▼
Frontend stores tokens in Zustand
         │
         ▼
User redirected to Landing Page

┌──────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                                │
└──────────────────────────────────────────────────────────────┘

User enters email/password
         │
         ▼
POST /api/auth/login
  { email, password }
         │
         ▼
Backend validates credentials
         │
         ├─── Invalid ──► Error: "Invalid credentials"
         │
         ▼ Valid
JWT tokens generated
         │
         ▼
Return AuthResponse
         │
         ▼
Frontend stores tokens
         │
         ▼
User redirected to Landing Page

┌──────────────────────────────────────────────────────────────┐
│                  TOKEN REFRESH FLOW                           │
└──────────────────────────────────────────────────────────────┘

Access token expires (15 min)
         │
         ▼
API request fails with 401
         │
         ▼
Axios interceptor catches error
         │
         ▼
POST /api/auth/refresh
  { refreshToken }
         │
         ▼
Backend validates refresh token
         │
         ├─── Invalid ──► Logout user
         │
         ▼ Valid
New access token generated
         │
         ▼
Retry original request
         │
         ▼
Continue normal operation
```

### 2. Workspace Creation Flow

```
┌──────────────────────────────────────────────────────────────┐
│              WORKSPACE CREATION FLOW                          │
└──────────────────────────────────────────────────────────────┘

User clicks "Create Workspace"
         │
         ▼
Navigate to /create-workspace
         │
         ▼
WorkspaceWizard component loads
         │
         ▼
Step 1: Enter email for verification
         │
         ▼
POST /api/workspaces/send-otp
  { email }
         │
         ▼
Backend generates OTP
         │
         ▼
Email sent with OTP
         │
         ▼
Step 2: Enter OTP code
         │
         ▼
POST /api/workspaces/verify-otp
  { email, code }
         │
         ▼
Backend validates OTP
         │
         ├─── Invalid ──► Error: "Invalid OTP"
         │
         ▼ Valid
Step 3: Enter workspace details
  - Workspace name
  - Description (optional)
  - Privacy setting
         │
         ▼
POST /api/workspaces/create
  { name, description, isPrivate, email }
         │
         ▼
Backend creates:
  1. Workspace entity
  2. WorkspaceMember (owner role)
  3. Default #general channel
  4. ChannelMember for owner
         │
         ▼
Return WorkspaceCreationResponse
  { workspace, defaultChannel, authResponse }
         │
         ▼
Frontend updates state
         │
         ▼
Redirect to workspace chat
  /chat/channel/{generalChannelId}
```

### 3. Channel Communication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 CHANNEL MESSAGING FLOW                        │
└──────────────────────────────────────────────────────────────┘

User selects channel from sidebar
         │
         ▼
Navigate to /chat/channel/{channelId}
         │
         ▼
ChatWindow component loads
         │
         ▼
GET /api/messages/channel/{channelId}
  ?page=0&size=50
         │
         ▼
Backend fetches messages
         │
         ▼
Display messages in chat window
         │
         ▼
WebSocket subscription established
  /topic/channel/{channelId}
         │
         ▼
User types message
         │
         ▼
Typing indicator sent via WebSocket
  /app/chat.typing
         │
         ▼
Other users see typing indicator
         │
         ▼
User sends message
         │
         ▼
POST /api/messages/channel/{channelId}
  { content, type, replyToId }
         │
         ▼
Backend processes message:
  1. Save to database
  2. Extract @mentions
  3. Create notifications for mentions
  4. Broadcast via WebSocket
         │
         ▼
WebSocket message sent to
  /topic/channel/{channelId}
         │
         ▼
All subscribed clients receive message
         │
         ▼
Frontend updates chat store
         │
         ▼
Message appears in real-time
```


### 4. Direct Messaging Flow

```
┌──────────────────────────────────────────────────────────────┐
│                DIRECT MESSAGING FLOW                          │
└──────────────────────────────────────────────────────────────┘

User clicks on another user
         │
         ▼
Check if DM conversation exists
         │
         ├─── Exists ──► Navigate to /chat/dm/{userId}
         │
         ▼ New DM
POST /api/dm-requests
  { recipientId, workspaceId }
         │
         ▼
Backend creates DM request
  Status: PENDING
         │
         ▼
Notification sent to recipient
  Type: DM_REQUEST
         │
         ▼
Recipient receives notification
         │
         ▼
Recipient clicks "Accept"
         │
         ▼
POST /api/dm-requests/{requestId}/accept
         │
         ▼
Backend updates request status
  Status: ACCEPTED
         │
         ▼
Both users can now send DMs
         │
         ▼
Navigate to /chat/dm/{userId}
         │
         ▼
GET /api/dm/{userId}
  ?page=0&size=50
         │
         ▼
Display DM history
         │
         ▼
WebSocket subscription
  /topic/dm/{currentUserId}
         │
         ▼
User sends DM
         │
         ▼
POST /api/dm/{userId}
  { content, type, replyToId }
         │
         ▼
Backend saves DM
         │
         ▼
WebSocket broadcast to both users
  /topic/dm/{userId}
         │
         ▼
Message appears in real-time
         │
         ▼
Mark as read when viewed
PUT /api/dm/{userId}/read
```

### 5. Workspace Invitation Flow

```
┌──────────────────────────────────────────────────────────────┐
│             WORKSPACE INVITATION FLOW                         │
└──────────────────────────────────────────────────────────────┘

Workspace Owner clicks "Invite Members"
         │
         ▼
Modal opens for email input
         │
         ▼
Owner enters invitee email
         │
         ▼
POST /api/workspaces/{workspaceId}/invite
  { email }
         │
         ▼
Backend validates:
  - User exists with email
  - User not already member
         │
         ├─── Validation fails ──► Error message
         │
         ▼ Valid
Create WorkspaceInvitation
  Status: PENDING
         │
         ▼
Create Notification
  Type: WORKSPACE_INVITE
  Content: "{owner} invited you to {workspace}"
         │
         ▼
Send via WebSocket
  /topic/user/{inviteeId}/notifications
         │
         ▼
Invitee sees notification in bell icon
         │
         ▼
Invitee clicks notification
         │
         ▼
NotificationPanel shows invite with buttons:
  [Dismiss] [Accept] [Reject]
         │
         ▼
Invitee clicks "Accept"
         │
         ▼
POST /api/notifications/{notificationId}/accept
         │
         ▼
Backend processes acceptance:
  1. Update invitation status: ACCEPTED
  2. Create WorkspaceMember entry
  3. Add user to #general channel
  4. Mark notification as read
         │
         ▼
Frontend refreshes:
  - Workspaces list
  - Channels list
         │
         ▼
Workspace appears in user's workspace list
         │
         ▼
User can click workspace to enter
         │
         ▼
Redirect to /chat/channel/{generalChannelId}
```

### 6. Message Mention Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  MESSAGE MENTION FLOW                         │
└──────────────────────────────────────────────────────────────┘

User types message with @username
  Example: "Hey @JohnDoe, check this out!"
         │
         ▼
Frontend shows autocomplete suggestions
  (as user types after @)
         │
         ▼
User selects or completes mention
         │
         ▼
Message sent to backend
         │
         ▼
POST /api/messages/channel/{channelId}
  { content: "Hey @JohnDoe, check this out!" }
         │
         ▼
Backend extracts mentions:
  Regex: @([A-Za-z0-9._-]+)
         │
         ▼
Match against channel members
  Normalize: remove spaces, lowercase
         │
         ▼
For each valid mention:
  1. Add userId to mentionedUserIds
  2. Create notification
     Type: MENTION
     Content: "{sender} mentioned you in #{channel}"
  3. Send via WebSocket
         │
         ▼
Save message with mentionedUserIds
         │
         ▼
Broadcast message via WebSocket
  /topic/channel/{channelId}
         │
         ▼
Mentioned users receive:
  1. Real-time notification
  2. Message with visual highlight
         │
         ▼
Frontend displays:
  - Blue background on @username
  - "mentioned you" badge
  - Blue left border on message
         │
         ▼
Mentioned user clicks notification
         │
         ▼
Navigate to channel with message
```

### 7. File Upload Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   FILE UPLOAD FLOW                            │
└──────────────────────────────────────────────────────────────┘

User clicks file attachment icon
         │
         ▼
File picker opens
         │
         ▼
User selects file(s)
         │
         ▼
Frontend validates:
  - File size (max 10MB)
  - File type (allowed types)
         │
         ├─── Invalid ──► Error: "File too large"
         │
         ▼ Valid
Create FormData with file
         │
         ▼
POST /api/files/upload
  Content-Type: multipart/form-data
         │
         ▼
Backend receives file
         │
         ▼
Upload to Cloudinary
         │
         ▼
Cloudinary returns URL
         │
         ▼
Create Attachment entity
  - fileName
  - fileType
  - fileSize
  - fileUrl (Cloudinary URL)
         │
         ▼
Return attachment data
         │
         ▼
Frontend embeds file URL in message
         │
         ▼
POST /api/messages/channel/{channelId}
  { content, type: "FILE", attachmentId }
         │
         ▼
Message saved with attachment reference
         │
         ▼
Broadcast via WebSocket
         │
         ▼
All users see file in chat
  - Image: inline preview
  - Document: download link
```


### 8. Notification System Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 NOTIFICATION SYSTEM FLOW                      │
└──────────────────────────────────────────────────────────────┘

Event occurs (mention, invite, DM, etc.)
         │
         ▼
Backend creates Notification entity
  - recipientId
  - type (MENTION, WORKSPACE_INVITE, etc.)
  - content (message text)
  - relatedEntityId (workspace/channel/message ID)
  - isRead: false
         │
         ▼
Save to database
         │
         ▼
Send via WebSocket
  /topic/user/{recipientId}/notifications
         │
         ▼
Frontend receives notification
         │
         ▼
Update Zustand store
  setNotifications([newNotification, ...prev])
         │
         ▼
Update bell icon badge count
         │
         ▼
User clicks bell icon
         │
         ▼
NotificationPanel opens
         │
         ▼
Display notifications grouped by type:
  📨 WORKSPACE_INVITE
  💬 MENTION
  ✉️ DIRECT_MESSAGE
  📢 CHANNEL_INVITE
         │
         ▼
User clicks notification action
         │
         ├─── "Mark as Read" ──► PUT /api/notifications/{id}/read
         │
         ├─── "Accept" ──► POST /api/notifications/{id}/accept
         │
         └─── "Dismiss" ──► Remove from UI
         │
         ▼
Backend updates notification
         │
         ▼
Frontend updates state
         │
         ▼
Badge count decreases
```

### 9. Channel Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                CHANNEL CREATION FLOW                          │
└──────────────────────────────────────────────────────────────┘

User clicks "Create Channel"
         │
         ▼
CreateChannelModal opens
         │
         ▼
User enters:
  - Channel name
  - Description (optional)
  - Privacy setting (public/private)
         │
         ▼
POST /api/channels/workspace/{workspaceId}
  { name, description, isPrivate }
         │
         ▼
Backend creates:
  1. Channel entity
  2. ChannelMember (creator as owner)
         │
         ▼
Return ChannelResponse
         │
         ▼
Frontend updates channels list
         │
         ▼
Auto-navigate to new channel
  /chat/channel/{channelId}

┌──────────────────────────────────────────────────────────────┐
│              CHANNEL INVITATION FLOW                          │
└──────────────────────────────────────────────────────────────┘

Channel admin clicks "Invite to Channel"
         │
         ▼
Modal shows workspace members
         │
         ▼
Admin selects user(s)
         │
         ▼
POST /api/channels/{channelId}/invite
  { email }
         │
         ▼
Backend creates:
  1. ChannelInvitation (PENDING)
  2. Notification (CHANNEL_INVITE)
         │
         ▼
Invitee receives notification
         │
         ▼
Invitee accepts
         │
         ▼
POST /api/notifications/{id}/accept
         │
         ▼
Backend:
  1. Update invitation: ACCEPTED
  2. Create ChannelMember
         │
         ▼
User added to channel
         │
         ▼
Channel appears in user's sidebar

┌──────────────────────────────────────────────────────────────┐
│              CHANNEL ARCHIVING FLOW                           │
└──────────────────────────────────────────────────────────────┘

Channel owner clicks "Archive Channel"
         │
         ▼
Confirmation modal appears
         │
         ▼
Owner confirms
         │
         ▼
POST /api/channels/{channelId}/archive
         │
         ▼
Backend updates:
  isArchived: true
         │
         ▼
Channel moved to "Archived" section
         │
         ▼
No new messages allowed
         │
         ▼
Read-only access for members

To restore:
POST /api/channels/{channelId}/restore
  → isArchived: false
```

### 10. Online Presence Flow

```
┌──────────────────────────────────────────────────────────────┐
│                ONLINE PRESENCE FLOW                           │
└──────────────────────────────────────────────────────────────┘

User logs in
         │
         ▼
WebSocket connection established
  /ws endpoint
         │
         ▼
Backend WebSocketEventListener
  @EventListener(SessionConnectedEvent)
         │
         ▼
Update user status:
  online: true
  lastSeen: null
         │
         ▼
Broadcast to all connected clients
         │
         ▼
Frontend updates online users list
         │
         ▼
Green dot appears next to user

User disconnects/logs out
         │
         ▼
Backend WebSocketEventListener
  @EventListener(SessionDisconnectEvent)
         │
         ▼
Update user status:
  online: false
  lastSeen: now()
         │
         ▼
Broadcast to all connected clients
         │
         ▼
Frontend updates online users list
         │
         ▼
Green dot removed, show "last seen"

Periodic heartbeat (every 30 seconds)
         │
         ▼
Frontend sends ping via WebSocket
         │
         ▼
Backend updates lastSeen timestamp
         │
         ▼
Maintain online status
```

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/register` | Register new user | `{ email, password, displayName, otpCode }` | `AuthResponse` |
| POST | `/api/auth/login` | User login | `{ email, password }` | `AuthResponse` |
| POST | `/api/auth/refresh` | Refresh access token | `{ refreshToken }` | `AuthResponse` |
| POST | `/api/auth/send-otp` | Send registration OTP | `{ email }` | `{ message }` |
| POST | `/api/auth/forgot-password` | Send password reset OTP | `{ email }` | `{ message }` |
| POST | `/api/auth/reset-password` | Reset password | `{ email, otpCode, newPassword }` | `{ message }` |

### Workspace Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/workspaces/send-otp` | Send workspace creation OTP | `{ email }` | `{ message }` |
| POST | `/api/workspaces/verify-otp` | Verify OTP | `{ email, code }` | `{ verified: true }` |
| POST | `/api/workspaces/create` | Create workspace | `{ name, description, isPrivate, email }` | `WorkspaceCreationResponse` |
| GET | `/api/workspaces` | Get user workspaces | - | `Page<WorkspaceResponse>` |
| POST | `/api/workspaces/{id}/join` | Join workspace | - | `{ message }` |
| POST | `/api/workspaces/{id}/invite` | Invite user | `{ email }` | `{ message }` |
| GET | `/api/workspaces/{id}/members` | Get members | - | `List<UserResponse>` |
| DELETE | `/api/workspaces/{id}/members/{userId}` | Remove member | - | `{ message }` |

### Channel Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/channels/workspace/{workspaceId}` | Create channel | `{ name, description, isPrivate }` | `ChannelResponse` |
| GET | `/api/channels/workspace/{workspaceId}` | Get workspace channels | - | `List<ChannelResponse>` |
| GET | `/api/channels/workspace/{workspaceId}/archived` | Get archived channels | - | `List<ChannelResponse>` |
| GET | `/api/channels/workspace/{workspaceId}/deleted` | Get deleted channels | - | `List<ChannelResponse>` |
| GET | `/api/channels/{id}/members` | Get channel members | - | `List<UserResponse>` |
| POST | `/api/channels/{id}/invite` | Invite user | `{ email }` | `{ message }` |
| POST | `/api/channels/{id}/archive` | Archive channel | - | `{ message }` |
| POST | `/api/channels/{id}/restore` | Restore channel | - | `{ message }` |
| DELETE | `/api/channels/{id}` | Soft delete channel | - | `{ message }` |
| DELETE | `/api/channels/{id}/permanent` | Permanently delete | - | `{ message }` |
| POST | `/api/channels/{id}/leave` | Leave channel | - | `{ message }` |
| DELETE | `/api/channels/{id}/members/{userId}` | Remove member | - | `{ message }` |
| POST | `/api/channels/{id}/transfer-ownership` | Transfer ownership | `{ newOwnerId }` | `{ message }` |
| POST | `/api/channels/{id}/members/{userId}/make-admin` | Promote to admin | - | `{ message }` |
| POST | `/api/channels/{id}/members/{userId}/remove-admin` | Demote admin | - | `{ message }` |


### Message Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/messages/channel/{channelId}` | Send message | `{ content, type, replyToId }` | `MessageResponse` |
| GET | `/api/messages/channel/{channelId}` | Get messages | `?page=0&size=50` | `Page<MessageResponse>` |
| PUT | `/api/messages/{id}` | Edit message | `{ content }` | `MessageResponse` |
| DELETE | `/api/messages/{id}` | Delete message | `?scope=self|everyone` | `MessageResponse` |
| POST | `/api/messages/{id}/pin` | Pin message | - | `MessageResponse` |
| POST | `/api/messages/{id}/react` | Add reaction | `{ emoji }` | `MessageResponse` |
| POST | `/api/messages/{id}/read` | Mark as read | - | `{ message }` |
| POST | `/api/messages/channel/{channelId}/read` | Mark channel as read | - | `{ message }` |

### Direct Message Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/dm/{userId}` | Send DM | `{ content, type, replyToId }` | `MessageResponse` |
| GET | `/api/dm/{userId}` | Get DM history | `?page=0&size=50` | `Page<MessageResponse>` |
| PUT | `/api/dm/{id}` | Edit DM | `{ content }` | `MessageResponse` |
| DELETE | `/api/dm/{id}` | Delete DM | `?scope=self|everyone` | `MessageResponse` |
| POST | `/api/dm/{id}/pin` | Pin DM | - | `MessageResponse` |
| POST | `/api/dm/{id}/react` | Add reaction | `{ emoji }` | `MessageResponse` |
| PUT | `/api/dm/{userId}/read` | Mark as read | - | `{ message }` |

### DM Request Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/dm-requests` | Create DM request | `{ recipientId, workspaceId }` | `DMRequestResponse` |
| GET | `/api/dm-requests` | Get pending requests | - | `List<DMRequestResponse>` |
| POST | `/api/dm-requests/{id}/accept` | Accept request | - | `{ message }` |
| POST | `/api/dm-requests/{id}/reject` | Reject request | - | `{ message }` |

### Notification Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/notifications` | Get all notifications | - | `List<NotificationResponse>` |
| GET | `/api/notifications/unread` | Get unread notifications | - | `List<NotificationResponse>` |
| PUT | `/api/notifications/{id}/read` | Mark as read | - | `{ message }` |
| POST | `/api/notifications/{id}/accept` | Accept invite | - | `{ message }` |

### User Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/users/me` | Get current user | - | `UserResponse` |
| PUT | `/api/users/me` | Update profile | `{ displayName, avatarUrl }` | `UserResponse` |
| GET | `/api/users` | Get all users | - | `List<UserResponse>` |
| GET | `/api/users/online` | Get online users | - | `List<UserResponse>` |
| GET | `/api/users/{id}` | Get user by ID | - | `UserResponse` |
| GET | `/api/users/search` | Search users | `?query=john` | `List<UserResponse>` |
| GET | `/api/users/workspace/{workspaceId}/shared` | Get shared users in workspace | - | `List<UserResponse>` |

### File Upload Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/files/upload` | Upload file | `multipart/form-data` | `AttachmentResponse` |
| DELETE | `/api/files/{id}` | Delete file | - | `{ message }` |

---

## WebSocket Topics & Real-time Communication

### WebSocket Configuration

**Endpoint**: `/ws`
**Protocol**: STOMP over SockJS
**Authentication**: JWT token in connect headers

### Connection Setup (Frontend)

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  connectHeaders: {
    Authorization: `Bearer ${accessToken}`
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000
});

client.onConnect = () => {
  console.log('Connected to WebSocket');
};

client.activate();
```

### WebSocket Topics

| Topic | Purpose | Message Format |
|-------|---------|----------------|
| `/topic/channel/{channelId}` | Channel messages | `MessageResponse` |
| `/topic/channel/{channelId}/typing` | Typing indicators | `{ userId, displayName, isTyping }` |
| `/topic/dm/{userId}` | Direct messages | `MessageResponse` |
| `/topic/user/{userId}/notifications` | User notifications | `NotificationResponse` |
| `/topic/workspace/{workspaceId}/presence` | Online presence updates | `{ userId, online, lastSeen }` |

### Application Destinations (Client → Server)

| Destination | Purpose | Payload |
|-------------|---------|---------|
| `/app/chat/channel/{channelId}` | Send channel message | `MessageRequest` |
| `/app/chat/room/{roomId}` | Send room message | `MessageRequest` |
| `/app/chat.typing` | Send typing indicator | `{ workspaceId, channelId, isTyping }` |

### Subscription Examples

```javascript
// Subscribe to channel messages
client.subscribe('/topic/channel/123', (message) => {
  const messageData = JSON.parse(message.body);
  console.log('New message:', messageData);
});

// Subscribe to notifications
client.subscribe('/topic/user/456/notifications', (message) => {
  const notification = JSON.parse(message.body);
  console.log('New notification:', notification);
});

// Subscribe to typing indicators
client.subscribe('/topic/channel/123/typing', (message) => {
  const typingData = JSON.parse(message.body);
  console.log('User typing:', typingData);
});

// Send message via WebSocket
client.publish({
  destination: '/app/chat/channel/123',
  body: JSON.stringify({
    content: 'Hello, world!',
    type: 'TEXT'
  })
});
```

### WebSocket Message Flow

```
Client A                    Server                    Client B
   │                          │                          │
   │  1. Connect with JWT     │                          │
   ├─────────────────────────►│                          │
   │                          │                          │
   │  2. Subscribe to channel │                          │
   ├─────────────────────────►│                          │
   │                          │                          │
   │  3. Send message         │                          │
   ├─────────────────────────►│                          │
   │                          │  4. Save to DB           │
   │                          │  5. Broadcast            │
   │                          ├─────────────────────────►│
   │  6. Receive message      │                          │
   │◄─────────────────────────┤                          │
   │                          │  7. Receive message      │
   │                          ├─────────────────────────►│
```

---

## Security & Authentication

### JWT Token Structure

**Access Token** (15 minutes expiry):
```json
{
  "sub": "user@example.com",
  "userId": 123,
  "role": "MEMBER",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token** (7 days expiry):
```json
{
  "sub": "user@example.com",
  "userId": 123,
  "type": "REFRESH",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### Authorization Levels

#### 1. Workspace Roles

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control: delete workspace, manage all members, transfer ownership |
| **ADMIN** | Manage members, create channels, moderate content |
| **MEMBER** | View content, send messages, create channels (if allowed) |

#### 2. Channel Roles

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control: delete channel, manage members, change settings |
| **ADMIN** | Manage members, pin messages, moderate content |
| **MEMBER** | View and send messages |

#### 3. Permission Checks

```java
// Example: Check if user can delete channel
public void deleteChannel(Long channelId, User currentUser) {
    Channel channel = channelRepository.findById(channelId)
        .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
    
    // Check if user is channel owner or workspace owner
    boolean isChannelOwner = channel.getCreatedBy().getId().equals(currentUser.getId());
    boolean isWorkspaceOwner = channel.getWorkspace().getOwner().getId().equals(currentUser.getId());
    
    if (!isChannelOwner && !isWorkspaceOwner) {
        throw new UnauthorizedException("Only channel or workspace owner can delete");
    }
    
    // Proceed with deletion
}
```

### Password Security

- **Hashing Algorithm**: BCrypt with strength 10
- **Password Requirements**: Minimum 8 characters (enforced on frontend)
- **Password Reset**: OTP-based verification required

### CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:5173"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```


---

## Frontend Architecture

### State Management (Zustand)

#### Auth Store (`authStore.js`)

```javascript
{
  user: {
    id: 1,
    email: "user@example.com",
    displayName: "John Doe",
    avatarUrl: "https://...",
    online: true,
    role: "MEMBER"
  },
  accessToken: "eyJhbGc...",
  refreshToken: "eyJhbGc...",
  isAuthenticated: true,
  
  // Actions
  login: (credentials) => {},
  logout: () => {},
  updateUser: (userData) => {},
  setTokens: (tokens) => {}
}
```

#### Chat Store (`chatStore.js`)

```javascript
{
  // Data
  workspaces: [],
  channels: [],
  users: [],
  onlineUsers: [],
  sharedUsers: [],
  notifications: [],
  
  // Messages by entity
  channelMessages: {
    [channelId]: [messages]
  },
  dmMessages: {
    [userId]: [messages]
  },
  
  // UI State
  activeWorkspaceId: null,
  activeThread: { type: 'channel', id: 123 },
  sidebarMode: 'channels', // 'channels' | 'archive' | 'trash'
  isCreateChannelModalOpen: false,
  
  // Typing indicators
  typingByWorkspace: {
    [workspaceId]: {
      [channelId]: { userId, displayName, isTyping }
    }
  },
  
  // Actions
  setWorkspaces: (workspaces) => {},
  setChannels: (channels) => {},
  appendChannelMessage: (channelId, message) => {},
  appendDmMessage: (userId, message) => {},
  setNotifications: (notifications) => {},
  clearChannelUnread: (channelId) => {},
  incrementChannelUnread: (channelId) => {}
}
```

### Component Hierarchy

```
App
├── AppRouter
│   ├── LoginPage
│   ├── RegisterPage
│   ├── LandingPage
│   ├── WorkspaceWizard
│   └── MainLayout
│       ├── AppRail
│       │   └── WorkspaceList
│       ├── Sidebar
│       │   ├── WorkspaceHeader
│       │   ├── ChannelList
│       │   ├── DMList
│       │   └── CreateChannelModal
│       ├── NotificationPanel
│       ├── ProfileDrawer
│       └── ChatPage (Outlet)
│           ├── ChatWindow (for channels)
│           │   ├── ChatHeader
│           │   ├── MessageList
│           │   │   └── MessageBubble
│           │   │       ├── ReactionBar
│           │   │       └── MessageActions
│           │   ├── TypingIndicator
│           │   └── MessageInput
│           │       ├── EmojiPicker
│           │       └── FileUpload
│           └── DMChatWindow (for DMs)
│               └── [Similar structure]
```

### Service Layer Architecture

```javascript
// api.js - Base Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - Add JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await authService.refreshToken(refreshToken);
          useAuthStore.getState().setTokens(response.data);
          // Retry original request
          return api(error.config);
        } catch (refreshError) {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### Routing Structure

```javascript
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    
    {/* Protected routes */}
    <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
    <Route path="/create-workspace" element={<ProtectedRoute><WorkspaceWizard /></ProtectedRoute>} />
    
    {/* Main app with layout */}
    <Route path="/chat" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path=":type/:id" element={<ChatPage />} />
      {/* type: 'channel' | 'dm' | 'workspace' */}
    </Route>
  </Routes>
</BrowserRouter>
```

### WebSocket Integration

```javascript
// websocket.js
let client = null;
let subscriptions = new Map();

export function connectWebSocket(onConnect) {
  client = new Client({
    webSocketFactory: () => new SockJS(getWebSocketUrl()),
    connectHeaders: {
      Authorization: `Bearer ${useAuthStore.getState().accessToken}`
    },
    reconnectDelay: 5000
  });
  
  client.onConnect = () => {
    if (onConnect) onConnect(client);
  };
  
  client.activate();
  return client;
}

export function subscribeToChannel(channelId, callback) {
  const subscription = client.subscribe(
    `/topic/channel/${channelId}`,
    (message) => callback(JSON.parse(message.body))
  );
  subscriptions.set(`channel:${channelId}`, subscription);
  return subscription;
}

// Usage in component
useEffect(() => {
  if (!user?.id) return;
  
  connectWebSocket((stompClient) => {
    // Subscribe to notifications
    subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    
    // Subscribe to channel
    if (channelId) {
      subscribeToChannel(channelId, (message) => {
        appendChannelMessage(channelId, message);
      });
    }
  });
  
  return () => disconnectWebSocket();
}, [user?.id, channelId]);
```

### UI Component Patterns

#### Message Bubble Component

```jsx
const MessageBubble = ({ message, currentUser }) => {
  const isOwnMessage = message.senderId === currentUser.id;
  const isMentioned = message.mentionedUserIds?.includes(currentUser.id);
  
  return (
    <div className={cn(
      "message-bubble",
      isOwnMessage && "own-message",
      isMentioned && "mentioned-message"
    )}>
      {/* Avatar */}
      <img src={message.senderAvatar} alt={message.senderName} />
      
      {/* Content */}
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{message.senderName}</span>
          <span className="timestamp">{formatDate(message.sentAt)}</span>
          {isMentioned && <span className="badge">mentioned you</span>}
        </div>
        
        {/* Reply context */}
        {message.replyToId && (
          <div className="reply-context">
            <span>{message.replyToSenderName}</span>
            <p>{message.replyToContent}</p>
          </div>
        )}
        
        {/* Message text with mentions highlighted */}
        <p className="message-text">
          {highlightMentions(message.content)}
        </p>
        
        {/* Reactions */}
        <ReactionBar reactions={message.reactions} />
        
        {/* Actions */}
        <MessageActions
          onReply={() => setReplyTo(message)}
          onEdit={() => setEditing(message)}
          onDelete={() => deleteMessage(message.id)}
          onPin={() => pinMessage(message.id)}
        />
      </div>
    </div>
  );
};
```

---

## Deployment Guide

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (for file uploads)
- SMTP server (for emails)

### Environment Variables

#### Backend (.env or application.properties)

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/bytechat
spring.datasource.username=postgres
spring.datasource.password=your_password

# JWT
jwt.secret=your-256-bit-secret-key-here
jwt.expiration=900000
jwt.refresh-expiration=604800000

# Cloudinary
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# CORS
cors.allowed-origins=http://localhost:5173,https://yourdomain.com
```

#### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

### Local Development Setup

#### 1. Database Setup

```bash
# Create database
createdb bytechat

# Or using psql
psql -U postgres
CREATE DATABASE bytechat;
\q
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies and run
./mvnw clean install
./mvnw spring-boot:run

# Or using Maven wrapper on Windows
mvnw.cmd clean install
mvnw.cmd spring-boot:run
```

Backend will start on `http://localhost:8080`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### Docker Deployment

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: bytechat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bytechat-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/bytechat
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - bytechat-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: http://localhost:8080/api
      VITE_WS_URL: http://localhost:8080/ws
    ports:
      - "5173:80"
    depends_on:
      - backend
    networks:
      - bytechat-network

volumes:
  postgres_data:

networks:
  bytechat-network:
    driver: bridge
```

#### Backend Dockerfile

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production Deployment Checklist

- [ ] Set strong JWT secret (256-bit random string)
- [ ] Configure production database with SSL
- [ ] Set up Cloudinary production account
- [ ] Configure production SMTP server
- [ ] Update CORS allowed origins
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets
- [ ] Enable database connection pooling
- [ ] Configure WebSocket scaling (Redis pub/sub)
- [ ] Set up health check endpoints
- [ ] Configure firewall rules
- [ ] Set up CI/CD pipeline

### API Documentation Access

Once deployed, access Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```

---

## Appendix

### Common Issues & Solutions

#### Issue: WebSocket connection fails

**Solution**: Check CORS configuration and ensure JWT token is being sent in connect headers.

```javascript
// Verify token is present
const token = useAuthStore.getState().accessToken;
console.log('Token:', token);

// Check WebSocket URL
console.log('WS URL:', getWebSocketUrl());
```

#### Issue: Messages not appearing in real-time

**Solution**: Verify WebSocket subscription is active and callback is updating state.

```javascript
// Add logging to subscription
subscribeToChannel(channelId, (message) => {
  console.log('Received message:', message);
  appendChannelMessage(channelId, message);
});
```

#### Issue: Token refresh loop

**Solution**: Ensure refresh token endpoint doesn't require authentication.

```java
.requestMatchers("/api/auth/refresh").permitAll()
```

#### Issue: File upload fails

**Solution**: Check Cloudinary credentials and file size limits.

```java
// Increase max file size in application.properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

### Performance Optimization Tips

1. **Database Indexing**: Ensure indexes on frequently queried columns
2. **Message Pagination**: Load messages in chunks (50 per page)
3. **WebSocket Scaling**: Use Redis pub/sub for multi-instance deployments
4. **Caching**: Implement Redis caching for user sessions and online status
5. **CDN**: Serve static assets and uploaded files via CDN
6. **Lazy Loading**: Load channels and users on demand
7. **Debouncing**: Debounce typing indicators (500ms)
8. **Connection Pooling**: Configure HikariCP for optimal database connections

### Future Enhancements

- [ ] Voice and video calling
- [ ] Screen sharing
- [ ] Message threading
- [ ] Advanced search with filters
- [ ] Message bookmarks
- [ ] Custom emoji support
- [ ] Workspace themes
- [ ] Mobile applications (React Native)
- [ ] Desktop application (Electron)
- [ ] Message translation
- [ ] Bot integrations
- [ ] Webhooks for external services
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Two-factor authentication

---

## Conclusion

ByteChat is a comprehensive, production-ready real-time chat application with enterprise-grade features. This documentation covers all aspects of the system architecture, flows, and deployment procedures.

For questions or contributions, please refer to the project repository.

**Version**: 1.0.0  
**Last Updated**: 2026-03-19  
**Maintained By**: ByteChat Development Team
