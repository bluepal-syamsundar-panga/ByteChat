# ByteChat Detailed Architecture & Component Flows

This document details the exact class-level interaction and data flow for the key features of the ByteChat application.

## 1. Authentication & Registration Flow
ByteChat uses a dual-stage registration (OTP + JWT).

```mermaid
sequenceDiagram
    autonumber
    participant U as React: RegisterPage
    participant US as Zustand: authStore
    participant FS as frontend: authService.js
    participant AC as backend: AuthController
    participant AS as backend: AuthServiceImpl
    participant OS as backend: OtpServiceImpl
    participant ES as backend: EmailServiceImpl
    participant DB as Postgres: USER Table

    U->>US: signup(email)
    US->>FS: register(email)
    FS->>AC: POST /api/auth/register
    AC->>AS: register(email)
    AS->>DB: create user (PENDING)
    AS->>OS: generateOtp(email, REGISTRATION)
    OS->>ES: sendOtpEmail(email, otp)
    ES-->>U: [User receives OTP and logs in]
    
    U->>US: verifyOtp(email, otp)
    US->>FS: verifyOtp(email, otp)
    FS->>AC: POST /api/auth/verify-otp
    AC->>AS: verifyOtp(email, otp)
    AS->>OS: validateOtp(email, otp)
    AS->>AS: generateToken(user)
    AC-->>US: { token, userProfile }
    US->>US: setAuth(token, user)
```

## 2. Real-time Messaging (Channel Chat)
Detailed flow of sending a channel message and the real-time broadcast via WebSocket.

```mermaid
sequenceDiagram
    autonumber
    participant U as React: ChatWindow
    participant CS as frontend: chatService.js
    participant WSF as frontend: websocket.js (StompJS)
    participant MC as backend: MessageController
    participant MS as backend: MessageServiceImpl
    participant WSB as backend: SimpleMessageBroker (Spring WS)
    participant DB as Postgres: MESSAGE Table
    participant O as React: Other User (ChatWindow)

    U->>CS: sendMessage(channelId, content)
    CS->>MC: POST /api/messages
    MC->>MS: saveMessage(dto, currentUser)
    MS->>DB: save(message)
    MS->>WSB: convertAndSend("/topic/channel/{id}", messageResp)
    WSB-->>WSF: Message Received (Subscriber)
    WSF-->>U: update chatStore.messages
    WSB-->>O: update chatStore.messages (Other users)
```

## 3. Workspace Member Invitation Flow
How workspace owners invite collaborators and how they are notified.

```mermaid
sequenceDiagram
    autonumber
    participant U as React: InviteModal
    participant WS as frontend: chatService.js
    participant WC as backend: WorkspaceController
    participant WSI as backend: WorkspaceServiceImpl
    participant NS as backend: NotificationServiceImpl
    participant ES as backend: EmailServiceImpl
    participant WSB as backend: WebSocket Broker

    U->>WS: inviteUser(workspaceId, email)
    WS->>WC: POST /api/workspaces/{id}/invite
    WC->>WSI: inviteMember(workspaceId, email)
    WSI->>NS: sendNotification(recipient, "WORKSPACE_INVITE", ...)
    NS->>WSB: push to "/user/{receiverId}/topic/notifications"
    WSI->>ES: sendInvitationEmail(email, workspaceName)
    WSB-->>U: Toast: "Invitation Sent Successfully"
```

## 4. Presence Tracking Flow
Tracking when users come online or go offline.

```mermaid
sequenceDiagram
    autonumber
    participant WSF as frontend: websocket.js
    participant WSC as backend: WebSocketConfig (Connect Event)
    participant PS as backend: PresenceService
    participant WSB as backend: WebSocket Broker
    participant O as React: Sidebar (Presence Indicators)

    WSF->>WSC: Connect (STOMP Connect)
    WSC->>PS: setUserOnline(userId)
    PS->>WSB: Broadcast to "/topic/presence"
    WSB-->>WSF: Presence Event received
    WSF-->>O: update user's online status in UI
    
    WSF->>WSC: Disconnect (Heartbeat failure or logout)
    WSC->>PS: setUserOffline(userId)
    PS->>WSB: Broadcast to "/topic/presence" (Offline state)
```

## Component Responsibility Matrix

| Component | Responsibility |
| :--- | :--- |
| `AuthController` | Entry point for login, registration, and OTP verification. |
| `AuthServiceImpl` | Handles token generation, security contexts, and account creation. |
| `MessageServiceImpl` | Core chat logic, persistent storage, and WebSocket distribution. |
| `WorkspaceServiceImpl` | Multi-tenancy management, permissions, and invitations. |
| `NotificationServiceImpl` | Real-time and persistent alerts (Invites, Mentions). |
| `chatStore.js` (Zustand) | Global state for current workspace, channels, and message lists. |
| `websocket.js` | Managing STOMP protocol connection and subscription state. |
| `api.js` (Axios) | Common interceptors for JWT injection and error handling. |
| `AppRouter.jsx` | Guarding routes, ensuring users are authenticated. |

## Detailed File Links
- **Backend Core**: [com.bytechat.serviceimpl](file:///d:/ByteChat/ByteChat/backend/src/main/java/com/bytechat/serviceimpl)
- **Frontend Logic**: [src/services](file:///d:/ByteChat/ByteChat/frontend/src/services)
- **State Layer**: [src/store](file:///d:/ByteChat/ByteChat/frontend/src/store)
