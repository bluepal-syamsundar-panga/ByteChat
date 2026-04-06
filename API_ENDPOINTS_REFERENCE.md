# ByteChat API Endpoints Reference

Complete reference guide for all REST API endpoints and WebSocket topics.

## Base URL
```
Development: http://localhost:8080/api
Production: https://your-domain.com/api
```

## Authentication

All endpoints except `/api/auth/**` require JWT authentication.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Initiates user registration by sending OTP to email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to email successfully",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email format
- `409 Conflict`: Email already registered

---

### Verify OTP
**POST** `/api/auth/verify-otp`

Verifies OTP and completes registration/login.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "John Doe",
    "avatarUrl": "https://cloudinary.com/...",
    "bio": "Software Developer",
    "role": "USER",
    "isOnline": true,
    "createdAt": "2026-01-01T10:00:00"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired OTP
- `404 Not Found`: Email not found

---

### Login
**POST** `/api/auth/login`

Initiates login by sending OTP to registered email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to email successfully"
}
```

---

### Refresh Token
**POST** `/api/auth/refresh`

Refreshes access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:** `200 OK`
```json
{
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

## Workspace Endpoints

### Get All Workspaces
**GET** `/api/workspaces`

Retrieves all workspaces the current user is a member of.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Tech Team",
    "description": "Engineering workspace",
    "avatarUrl": "https://cloudinary.com/...",
    "owner": {
      "id": 1,
      "displayName": "John Doe",
      "avatarUrl": "https://..."
    },
    "memberCount": 25,
    "role": "OWNER",
    "createdAt": "2026-01-01T10:00:00"
  }
]
```

---

### Get Workspace by ID
**GET** `/api/workspaces/{id}`

Retrieves detailed information about a specific workspace.

**Path Parameters:**
- `id` (Long): Workspace ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Tech Team",
  "description": "Engineering workspace",
  "avatarUrl": "https://...",
  "owner": {...},
  "members": [
    {
      "id": 1,
      "user": {...},
      "role": "OWNER",
      "joinedAt": "2026-01-01T10:00:00"
    }
  ],
  "channels": [...],
  "createdAt": "2026-01-01T10:00:00"
}
```

**Error Responses:**
- `404 Not Found`: Workspace not found
- `403 Forbidden`: User not a member

---

### Create Workspace
**POST** `/api/workspaces`

Creates a new workspace with the current user as owner.

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Workspace description"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "New Workspace",
  "description": "Workspace description",
  "avatarUrl": null,
  "owner": {...},
  "memberCount": 1,
  "createdAt": "2026-04-06T10:00:00"
}
```

---

### Update Workspace
**PUT** `/api/workspaces/{id}`

Updates workspace details (Owner/Admin only).

**Path Parameters:**
- `id` (Long): Workspace ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Updated Name",
  "description": "Updated description",
  ...
}
```

---

### Delete Workspace
**DELETE** `/api/workspaces/{id}`

Deletes a workspace (Owner only).

**Path Parameters:**
- `id` (Long): Workspace ID

**Response:** `204 No Content`

---

### Invite User to Workspace
**POST** `/api/workspaces/{id}/invite`

Sends invitation to user via email.

**Path Parameters:**
- `id` (Long): Workspace ID

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "MEMBER"
}
```

**Response:** `200 OK`
```json
{
  "message": "Invitation sent successfully"
}
```

---

### Update Member Role
**POST** `/api/workspaces/{id}/members/{userId}/role`

Updates a member's role in the workspace.

**Path Parameters:**
- `id` (Long): Workspace ID
- `userId` (Long): User ID

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Response:** `200 OK`

---

### Remove Member
**DELETE** `/api/workspaces/{id}/members/{userId}`

Removes a member from the workspace.

**Response:** `204 No Content`

---

## Channel Endpoints

### Get Workspace Channels
**GET** `/api/channels/workspace/{workspaceId}`

Retrieves all channels in a workspace that the user has access to.

**Path Parameters:**
- `workspaceId` (Long): Workspace ID

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "general",
    "description": "General discussion",
    "isPrivate": false,
    "workspace": {...},
    "createdBy": {...},
    "memberCount": 15,
    "unreadCount": 3,
    "createdAt": "2026-01-01T10:00:00"
  }
]
```

---

### Get Channel by ID
**GET** `/api/channels/{id}`

Retrieves detailed information about a specific channel.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "general",
  "description": "General discussion",
  "isPrivate": false,
  "workspace": {...},
  "createdBy": {...},
  "members": [...],
  "createdAt": "2026-01-01T10:00:00"
}
```

---

### Create Channel
**POST** `/api/channels`

Creates a new channel in a workspace.

**Request Body:**
```json
{
  "workspaceId": 1,
  "name": "project-alpha",
  "description": "Project Alpha discussions",
  "isPrivate": false
}
```

**Response:** `201 Created`
```json
{
  "id": 5,
  "name": "project-alpha",
  "description": "Project Alpha discussions",
  "isPrivate": false,
  "workspace": {...},
  "createdBy": {...},
  "createdAt": "2026-04-06T10:00:00"
}
```

---

### Update Channel
**PUT** `/api/channels/{id}`

Updates channel details (Admin only).

**Request Body:**
```json
{
  "name": "updated-name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### Delete Channel
**DELETE** `/api/channels/{id}`

Deletes a channel (Admin only).

**Response:** `204 No Content`

---

### Add Channel Member
**POST** `/api/channels/{id}/members`

Adds a user to the channel.

**Request Body:**
```json
{
  "userId": 5,
  "role": "MEMBER"
}
```

**Response:** `200 OK`

---

### Remove Channel Member
**DELETE** `/api/channels/{id}/members/{userId}`

Removes a user from the channel.

**Response:** `204 No Content`

---

### Join Public Channel
**POST** `/api/channels/{id}/join`

Allows user to join a public channel.

**Response:** `200 OK`

---

### Leave Channel
**POST** `/api/channels/{id}/leave`

Allows user to leave a channel.

**Response:** `200 OK`

---

## Message Endpoints

### Get Channel Messages
**GET** `/api/messages/channel/{channelId}`

Retrieves paginated messages from a channel.

**Path Parameters:**
- `channelId` (Long): Channel ID

**Query Parameters:**
- `page` (int, default: 0): Page number
- `size` (int, default: 50): Page size
- `sort` (string, default: "createdAt,desc"): Sort order

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": 100,
      "content": "Hello everyone!",
      "sender": {
        "id": 1,
        "displayName": "John Doe",
        "avatarUrl": "https://..."
      },
      "channelId": 1,
      "parentMessageId": null,
      "isPinned": false,
      "isEdited": false,
      "reactions": [
        {
          "emoji": "👍",
          "count": 3,
          "users": [...]
        }
      ],
      "attachments": [],
      "createdAt": "2026-04-06T10:00:00",
      "updatedAt": "2026-04-06T10:00:00"
    }
  ],
  "pageable": {...},
  "totalPages": 10,
  "totalElements": 500,
  "last": false,
  "number": 0,
  "size": 50
}
```

---

### Send Message
**POST** `/api/messages`

Sends a new message to a channel.

**Request Body:**
```json
{
  "channelId": 1,
  "content": "Hello everyone!",
  "parentMessageId": null
}
```

**Response:** `201 Created`
```json
{
  "id": 101,
  "content": "Hello everyone!",
  "sender": {...},
  "channelId": 1,
  "createdAt": "2026-04-06T10:30:00"
}
```

---

### Edit Message
**PUT** `/api/messages/{id}`

Edits an existing message (sender only).

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:** `200 OK`

---

### Delete Message
**DELETE** `/api/messages/{id}`

Deletes a message (sender or admin).

**Response:** `204 No Content`

---

### Pin Message
**POST** `/api/messages/{id}/pin`

Pins or unpins a message.

**Response:** `200 OK`

---

### Mark Message as Read
**POST** `/api/messages/{id}/read`

Marks a message as read by the current user.

**Response:** `200 OK`

---

### Get Thread Messages
**GET** `/api/messages/{id}/thread`

Retrieves all replies to a message.

**Response:** `200 OK`
```json
[
  {
    "id": 102,
    "content": "Reply to message",
    "sender": {...},
    "parentMessageId": 100,
    "createdAt": "2026-04-06T10:35:00"
  }
]
```

---

## Direct Message Endpoints

### Get DM Conversations
**GET** `/api/direct-messages`

Retrieves all DM conversations for the current user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "otherUser": {
      "id": 2,
      "displayName": "Jane Smith",
      "avatarUrl": "https://...",
      "isOnline": true,
      "lastSeen": "2026-04-06T10:00:00"
    },
    "lastMessage": {
      "id": 50,
      "content": "See you tomorrow!",
      "senderId": 2,
      "createdAt": "2026-04-06T09:00:00"
    },
    "unreadCount": 2
  }
]
```

---

### Get DM Conversation
**GET** `/api/direct-messages/conversation/{userId}`

Retrieves messages in a DM conversation with a specific user.

**Path Parameters:**
- `userId` (Long): Other user's ID

**Query Parameters:**
- `page` (int): Page number
- `size` (int): Page size

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "content": "Hi there!",
      "sender": {...},
      "receiver": {...},
      "isRead": true,
      "createdAt": "2026-04-06T08:00:00"
    }
  ],
  "totalPages": 3,
  "totalElements": 150
}
```

---

### Send Direct Message
**POST** `/api/direct-messages`

Sends a direct message to another user.

**Request Body:**
```json
{
  "receiverId": 2,
  "content": "Hello!"
}
```

**Response:** `201 Created`
```json
{
  "id": 51,
  "content": "Hello!",
  "sender": {...},
  "receiver": {...},
  "isRead": false,
  "createdAt": "2026-04-06T10:00:00"
}
```

---

### Mark DM as Read
**POST** `/api/direct-messages/{id}/read`

Marks a direct message as read.

**Response:** `200 OK`

---

## DM Request Endpoints

### Get DM Requests
**GET** `/api/dm-requests`

Retrieves pending DM requests.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "sender": {...},
    "receiver": {...},
    "status": "PENDING",
    "createdAt": "2026-04-06T09:00:00"
  }
]
```

---

### Send DM Request
**POST** `/api/dm-requests`

Sends a DM request to another user.

**Request Body:**
```json
{
  "receiverId": 5
}
```

**Response:** `201 Created`

---

### Accept DM Request
**POST** `/api/dm-requests/{id}/accept`

Accepts a DM request.

**Response:** `200 OK`

---

### Reject DM Request
**POST** `/api/dm-requests/{id}/reject`

Rejects a DM request.

**Response:** `200 OK`

---

## Notification Endpoints

### Get Notifications
**GET** `/api/notifications`

Retrieves user notifications.

**Query Parameters:**
- `unreadOnly` (boolean, default: false): Filter unread only

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "type": "MENTION",
    "message": "John mentioned you in #general",
    "referenceId": "123",
    "isRead": false,
    "createdAt": "2026-04-06T10:00:00"
  }
]
```

---

### Mark Notification as Read
**PUT** `/api/notifications/{id}/read`

Marks a notification as read.

**Response:** `200 OK`

---

### Mark All as Read
**PUT** `/api/notifications/read-all`

Marks all notifications as read.

**Response:** `200 OK`

---

### Delete Notification
**DELETE** `/api/notifications/{id}`

Deletes a notification.

**Response:** `204 No Content`

---

## User Endpoints

### Get Current User
**GET** `/api/users/me`

Retrieves current user profile.

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "displayName": "John Doe",
  "avatarUrl": "https://...",
  "bio": "Software Developer",
  "role": "USER",
  "isOnline": true,
  "lastSeen": "2026-04-06T10:00:00",
  "createdAt": "2026-01-01T10:00:00"
}
```

---

### Update Profile
**PUT** `/api/users/me`

Updates user profile.

**Request Body:**
```json
{
  "displayName": "John Smith",
  "bio": "Senior Developer"
}
```

**Response:** `200 OK`

---

### Upload Avatar
**POST** `/api/users/me/avatar`

Uploads user avatar image.

**Request:** multipart/form-data
- `file`: Image file (JPG, PNG, GIF)

**Response:** `200 OK`
```json
{
  "avatarUrl": "https://cloudinary.com/..."
}
```

---

### Search Users
**GET** `/api/users/search`

Searches for users.

**Query Parameters:**
- `query` (string): Search term
- `workspaceId` (Long, optional): Filter by workspace

**Response:** `200 OK`
```json
[
  {
    "id": 5,
    "displayName": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": "https://...",
    "isOnline": false
  }
]
```

---

### Get User by ID
**GET** `/api/users/{id}`

Retrieves user profile by ID.

**Response:** `200 OK`

---

## Reaction Endpoints

### Add Reaction
**POST** `/api/reactions`

Adds an emoji reaction to a message.

**Request Body:**
```json
{
  "messageId": 100,
  "emoji": "👍"
}
```

**Response:** `201 Created`

---

### Remove Reaction
**DELETE** `/api/reactions/{id}`

Removes a reaction.

**Response:** `204 No Content`

---

### Get Message Reactions
**GET** `/api/reactions/message/{messageId}`

Retrieves all reactions for a message.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "emoji": "👍",
    "user": {...},
    "messageId": 100,
    "createdAt": "2026-04-06T10:00:00"
  }
]
```

---

## File Upload Endpoints

### Upload File
**POST** `/api/files/upload`

Uploads a file attachment.

**Request:** multipart/form-data
- `file`: File to upload
- `type`: FILE_TYPE (IMAGE, VIDEO, DOCUMENT, AUDIO)

**Response:** `200 OK`
```json
{
  "id": 1,
  "fileName": "document.pdf",
  "fileUrl": "http://localhost:8080/uploads/uuid_document.pdf",
  "fileType": "DOCUMENT",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-04-06T10:00:00"
}
```

---

### Download File
**GET** `/api/files/{id}`

Downloads a file.

**Response:** File stream

---

## Meeting Endpoints

### Create Meeting
**POST** `/api/meetings`

Creates a new meeting.

**Request Body:**
```json
{
  "title": "Team Standup",
  "channelId": 1,
  "participantIds": [2, 3, 4]
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Team Standup",
  "channel": {...},
  "creator": {...},
  "participants": [...],
  "status": "ACTIVE",
  "startedAt": "2026-04-06T10:00:00"
}
```

---

### Get Meeting
**GET** `/api/meetings/{id}`

Retrieves meeting details.

**Response:** `200 OK`

---

### End Meeting
**POST** `/api/meetings/{id}/end`

Ends an active meeting.

**Response:** `200 OK`

---

### Get Active Meetings
**GET** `/api/meetings/active`

Retrieves all active meetings.

**Response:** `200 OK`

---

## WebSocket Topics

### Subscribe to Channel Messages
**Topic:** `/topic/channel/{channelId}`

Receives real-time messages in a channel.

**Message Format:**
```json
{
  "id": 100,
  "content": "New message",
  "sender": {...},
  "channelId": 1,
  "createdAt": "2026-04-06T10:00:00"
}
```

---

### Subscribe to Presence Updates
**Topic:** `/topic/presence`

Receives user online/offline status updates.

**Message Format:**
```json
{
  "userId": 5,
  "isOnline": true,
  "lastSeen": "2026-04-06T10:00:00"
}
```

---

### Subscribe to Personal Notifications
**Topic:** `/user/topic/notifications`

Receives personal notifications.

**Message Format:**
```json
{
  "id": 50,
  "type": "MENTION",
  "message": "You were mentioned",
  "referenceId": "123",
  "createdAt": "2026-04-06T10:00:00"
}
```

---

### Subscribe to Typing Indicators
**Topic:** `/topic/channel/{channelId}/typing`

Receives typing indicators in a channel.

**Message Format:**
```json
{
  "userId": 3,
  "displayName": "Jane Doe",
  "isTyping": true
}
```

---

### Send Typing Indicator
**Destination:** `/app/chat.typing`

Sends typing indicator to channel.

**Message Format:**
```json
{
  "channelId": 1,
  "isTyping": true
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "timestamp": "2026-04-06T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/messages"
}
```

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful deletion
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

### Limits
- Authentication: 5 requests/minute
- Messages: 60 requests/minute
- File uploads: 10 requests/minute
- General API: 1000 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1712400000
```

---

**Document Version:** 1.0  
**Last Updated:** April 6, 2026
