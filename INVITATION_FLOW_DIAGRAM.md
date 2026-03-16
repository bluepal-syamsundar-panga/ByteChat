# Workspace Invitation Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WORKSPACE INVITATION FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                              ┌──────────────────────┐
│   WORKSPACE OWNER    │                              │   INVITED USER       │
│  (Sender)            │                              │   (Recipient)        │
└──────────────────────┘                              └──────────────────────┘
         │                                                      │
         │ 1. Opens Sidebar                                    │
         │    Clicks "Invite Members"                          │
         ▼                                                      │
    ┌─────────┐                                                │
    │  Modal  │                                                │
    │ Opens   │                                                │
    └─────────┘                                                │
         │                                                      │
         │ 2. Enters email: member@test.com                    │
         │    Clicks "Send Invitation"                         │
         ▼                                                      │
┌──────────────────┐                                           │
│   chatService    │                                           │
│  .inviteToRoom() │                                           │
└──────────────────┘                                           │
         │                                                      │
         │ POST /api/rooms/{roomId}/invite                     │
         ▼                                                      │
┌──────────────────────────────────────────┐                   │
│         BACKEND PROCESSING               │                   │
│  ┌────────────────────────────────────┐  │                   │
│  │ 1. Validate email exists           │  │                   │
│  │ 2. Check not already member        │  │                   │
│  │ 3. Create Notification:            │  │                   │
│  │    - Type: ROOM_INVITE             │  │                   │
│  │    - Content: "X invited you..."   │  │                   │
│  │    - RelatedEntityId: roomId       │  │                   │
│  └────────────────────────────────────┘  │                   │
└──────────────────────────────────────────┘                   │
         │                                                      │
         │ 4. WebSocket Push                                   │
         │    /topic/user.{userId}.notifications               │
         ├─────────────────────────────────────────────────────▶
         │                                                      │
         │ 5. Success message shown                            │ 6. Notification received
         │    "Invitation sent!"                               │    Real-time via WebSocket
         │                                                      ▼
         │                                              ┌──────────────┐
         │                                              │ Bell Icon 🔔 │
         │                                              │ Shows Badge  │
         │                                              │   Count: 1   │
         │                                              └──────────────┘
         │                                                      │
         │                                                      │ 7. User clicks bell
         │                                                      ▼
         │                                              ┌──────────────────┐
         │                                              │ NotificationPanel│
         │                                              │ Opens            │
         │                                              │                  │
         │                                              │ 📨 "Owner invited│
         │                                              │    you to join   │
         │                                              │    workspace X"  │
         │                                              │                  │
         │                                              │ [Dismiss] [Accept]│
         │                                              │          [Reject] │
         │                                              └──────────────────┘
         │                                                      │
         │                                                      │ 8. Clicks "Accept"
         │                                                      ▼
         │                                              ┌──────────────────┐
         │                                              │ notificationService│
         │                                              │    .accept()     │
         │                                              └──────────────────┘
         │                                                      │
         │                                                      │ POST /api/notifications/{id}/accept
         │                                                      ▼
         │                                      ┌──────────────────────────────────┐
         │                                      │    BACKEND PROCESSING            │
         │                                      │  ┌────────────────────────────┐  │
         │                                      │  │ 1. Validate notification   │  │
         │                                      │  │ 2. Create RoomMember       │  │
         │                                      │  │ 3. Add to #general channel │  │
         │                                      │  │ 4. Mark notification read  │  │
         │                                      │  └────────────────────────────┘  │
         │                                      └──────────────────────────────────┘
         │                                                      │
         │                                                      │ 9. Success response
         │                                                      ▼
         │                                              ┌──────────────────┐
         │                                              │ Frontend Refresh │
         │                                              │ - Fetch rooms    │
         │                                              │ - Fetch users    │
         │                                              │ - Remove notif   │
         │                                              │ - Show toast     │
         │                                              └──────────────────┘
         │                                                      │
         │                                                      │ 10. Navigate to Landing Page
         │                                                      ▼
         │                                              ┌──────────────────────┐
         │                                              │   LANDING PAGE       │
         │                                              │                      │
         │                                              │ Your Workspaces:     │
         │                                              │ ┌──────────────────┐ │
         │                                              │ │  Workspace X     │ │
         │                                              │ │  (Now visible!)  │ │
         │                                              │ └──────────────────┘ │
         │                                              └──────────────────────┘
         │                                                      │
         │                                                      │ 11. Click workspace
         │                                                      ▼
         │                                              ┌──────────────────┐
         │                                              │ Enter Workspace  │
         │                                              │ #general channel │
         │                                              └──────────────────┘
         │                                                      │
         │◀─────────────────────────────────────────────────────┤
         │                                                      │
         │         Both users now in same workspace!            │
         │                                                      │
         ▼                                                      ▼
```

## Key Components

### Frontend Components
- **Sidebar.jsx**: Invite Members button and modal
- **NotificationPanel.jsx**: Bell icon, notification list, Accept/Reject buttons
- **LandingPage.jsx**: Workspace grid display

### Frontend Services
- **chatService.js**: `inviteToRoom(roomId, email)`
- **notificationService.js**: `getNotifications()`, `accept(id)`, `markAsRead(id)`

### Backend Endpoints
- **POST** `/api/rooms/{roomId}/invite` - Send invitation
- **GET** `/api/notifications` - Get user notifications
- **POST** `/api/notifications/{id}/accept` - Accept invitation
- **PUT** `/api/notifications/{id}/read` - Mark as read

### Database Tables
- **notifications**: Stores invitation notifications
- **room_members**: Tracks workspace membership
- **rooms**: Workspace/room data

### WebSocket Topics
- `/topic/user.{userId}.notifications` - Real-time notification delivery
