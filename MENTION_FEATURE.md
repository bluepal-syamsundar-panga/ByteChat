# Mention Feature Implementation

## Overview
This document describes the implementation of the @mention feature in ByteChat, allowing users to mention other users in messages and receive notifications.

## Features Implemented

### 1. Backend Changes

#### Message Entity (`Message.java`)
- Added `mentionedUserIds` field to track which users are mentioned in each message
- Uses `@ElementCollection` to store the list of mentioned user IDs in a separate table

#### MessageServiceImpl (`MessageServiceImpl.java`)
- Enhanced `sendMessage()` to extract mentions from message content using regex pattern
- Modified `notifyMentionedUsers()` to return list of mentioned user IDs
- Automatically sends notifications to mentioned users with type "MENTION"
- Mentions are detected by matching @username pattern against room members' display names

#### DirectMessageServiceImpl (`DirectMessageServiceImpl.java`)
- Added mention detection in direct messages
- Sends appropriate notification type (MENTION vs DIRECT_MESSAGE) based on content

#### MessageResponse DTO
- Added `mentionedUserIds` field to include mention information in API responses

#### Database Migration
- Created `V2__add_message_mentions.sql` migration file
- Adds `message_mentions` table with proper foreign keys and indexes

### 2. Frontend Changes

#### MessageBubble Component
- Added visual highlighting for @mentions in message content
- Shows blue background highlight for mentioned usernames
- Displays "mentioned you" badge when current user is mentioned
- Adds left border accent for messages that mention the current user

#### NotificationPanel Component (NEW)
- Real-time notification display in the header
- Shows unread notification count badge
- Supports different notification types (MENTION, DIRECT_MESSAGE, INVITE)
- Allows marking notifications as read
- Supports accepting invites directly from notifications
- Auto-updates via WebSocket subscriptions

#### MainLayout
- Integrated NotificationPanel into the header
- Positioned between search bar and user profile

## How It Works

### Sending a Message with Mentions

1. User types a message with @username (e.g., "Hey @JohnDoe, check this out!")
2. Frontend shows autocomplete suggestions as user types @
3. Message is sent to backend via WebSocket or REST API
4. Backend extracts mentions using regex pattern: `@([A-Za-z0-9._-]+)`
5. Backend matches mentioned usernames against room members
6. For each valid mention:
   - User ID is added to `mentionedUserIds` list
   - Notification is created with type "MENTION"
   - Notification is sent via WebSocket to mentioned user
7. Message is saved with mention information

### Receiving Mention Notifications

1. User receives real-time notification via WebSocket
2. Notification appears in NotificationPanel with unread badge
3. User can click notification to mark as read
4. Mentioned messages are visually highlighted in chat
5. User sees "mentioned you" badge on relevant messages

## API Endpoints

### Messages
- `POST /api/messages/room/{roomId}` - Send message (with mention detection)
- `PUT /api/messages/{messageId}` - Edit message (re-processes mentions)

### Notifications
- `GET /api/notifications` - Get all notifications for current user
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `POST /api/notifications/{id}/accept` - Accept invite notification

### WebSocket Topics
- `/topic/room.{roomId}` - Room messages
- `/topic/user.{userId}.notifications` - User notifications

## Mention Pattern Matching

The system uses the following rules for matching mentions:

1. **Pattern**: `@([A-Za-z0-9._-]+)`
2. **Normalization**: Display names are normalized by:
   - Removing all whitespace
   - Converting to lowercase
3. **Matching**: Case-insensitive match against room members
4. **Scope**: Only room members can be mentioned in room messages

## Visual Indicators

### In Messages
- Mentioned usernames appear with blue background: `@username`
- Messages mentioning you have:
  - Light blue background tint
  - Blue left border accent
  - "mentioned you" badge in header

### In Notifications
- Bell icon with red badge showing unread count
- Different emoji icons for notification types:
  - 💬 MENTION
  - ✉️ DIRECT_MESSAGE
  - 📨 INVITE
- Unread notifications have blue background tint

## Database Schema

### message_mentions Table
```sql
CREATE TABLE message_mentions (
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, user_id)
);
```

## Testing the Feature

1. **Start the application**
   ```bash
   # Backend
   cd backend
   ./mvnw spring-boot:run
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. **Test mention in room**
   - Join a room with multiple members
   - Type a message with @username
   - Verify autocomplete shows suggestions
   - Send the message
   - Check that mentioned user receives notification
   - Verify message shows with highlight

3. **Test notification system**
   - Click bell icon in header
   - Verify unread count is displayed
   - Click "Mark as read" on a notification
   - Verify count updates

## Future Enhancements

- [ ] Click on mention to view user profile
- [ ] @channel and @here mentions for all members
- [ ] Mention history/search
- [ ] Email notifications for mentions
- [ ] Mobile push notifications
- [ ] Mention preferences (mute mentions, etc.)
- [ ] Rich mention autocomplete with avatars
- [ ] Keyboard navigation for mention suggestions
