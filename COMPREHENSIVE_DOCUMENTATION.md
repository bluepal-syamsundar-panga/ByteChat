# ByteChat: Comprehensive Application Documentation

ByteChat is a real-time, multi-tenant collaboration platform designed as a professional Slack clone. It enables teams to communicate through persistent channels, secure direct messages, and synchronous video meetings, all within a zero-trust security framework.

---

## 🛠️ 1. Unified Tech Stack & Architecture

### **Core Stack**
- **Frontend**: React 18, Vite, TailwindCSS (Styling), Zustand (State Management), Lucide-React (Icons), Emoji-picker-react.
- **Backend**: Spring Boot 3, Spring Security (JWT-based sessionless-auth), Spring Data JPA, Spring WebSocket (STOMP), Spring Mail.
- **Database**: PostgreSQL 15 (Relational storage).
- **Communication Protocol**: STOMP over WebSockets (Real-time engine).
- **External Integrations**:
    - **Cloudinary**: Rich media hosting and avatar management.
    - **SMTP (Gmail/SendGrid)**: Secure OTP delivery.
- **Containerization**: Docker & Docker Compose (Orchestration).

### **High-Level Architecture**
ByteChat uses a **Multi-Tenant Workspace model**. All data is logically isolated by `WorkspaceID`, ensuring that users can belong to multiple distinct professional environments with different identities.

---

## 🏛️ 2. Core Functional Modules

### **2.1 Shared Workspace Architecture**
- **Lifecycle**: Create Workspace (Admin OTP) → Invite Members → Set Roles (Admin/Member).
- **Isolation**: Each workspace has its own set of Channels, Direct Messages, and Meetings.
- **Member Governance**: Owners can remove members and delete workspaces entirely.

### **2.2 Real-time Messaging (Channels)**
- **Public & Private**: Channels are scoped to workspaces and can be joined by all or restricted by invite.
- **Message Lifecycle**:
    - **Rich Content**: Text, Images, PDF, Video, and Voice Notes (Cloudinary hosted).
    - **Interactive Engagement**: Emoji reactions with individual "Seen" receipt lists.
    - **Persistence**: Pinned messages and threaded replies (Reply to Message).
    - **State Indicators**: Real-time typing indicators and online presence tracking.

### **2.3 Relationship Management (Direct Messages)**
- **Security Check**: To prevent unsolicited spam, DMs require a **DM Request** (`PENDING` -> `ACCEPTED`) before a private channel is provisioned.
- **Privacy**: Rejections are silent.

### **2.4 Visual Collaboration (Meetings)**
- **Contextual Launch**: Start meetings from any channel or DM.
- **Security**: Password-protected private rooms.
- **Real-time Broadcast**: All workspace members receive a global toast notification to "Join Now."

---

## 📊 3. Technical Specification

### **3.1 Data Model (Key Entities)**
- **User**: The central identity. Stores JWT-secured credentials and profile data.
- **WorkspaceMember**: Connects Users to Workspaces with specialized roles (`OWNER`, `MEMBER`).
- **Channel**: A persistent chat room within a workspace.
- **Message**: Rich data entity supporting attachments and metadata (Pinned, Deleted).
- **DMRequest**: A transient state entity managing the DM handshake.
- **Notification**: A persistent relay for asynchronous events (Invites, Mentions).

### **3.2 API Blueprint (Rest Controllers)**
| Controller | Primary Responsibility |
| :--- | :--- |
| `AuthController` | Registration (OTP), Login (JWT), Account verification. |
| `WorkspaceController` | Workspace provisioning (OTP), member management, invitations. |
| `ChannelController` | Channel lifecycle and membership. |
| `MessageController` | Core messaging CRUD, attachment handling, pinned state. |
| `MeetingController` | Live session management and broadcasts. |
| `PresenceController` | Tracking user connectivity heartbeats. |
| `DMRequestController` | Handshake logic for private 1-on-1 chats. |

### **3.3 Real-time Engine (WebSocket TOPICS)**
ByteChat uses specialized STOMP topics for instant delivery:
- **Global Channel Broadcast**: `/topic/channel/{channelId}`
- **Private DM Thread**: `/user/{userId}/queue/direct-message`
- **Typing Status**: `/topic/typing/{workspaceId}`
- **Connectivity (Presence)**: `/topic/presence`
- **System Notifications**: `/user/{userId}/topic/notifications`

---

## 🔐 4. Security & Performance

### **Authentication Logic**
1.  **Dual-Stage OTP**: 
    - **Stage 1**: Verify User Email during registration.
    - **Stage 2**: Verify Admin intent during Workspace Creation.
2.  **JWT Filter**: Intercepts every HTTP request to validate headers.
3.  **WebSocket Interceptor**: Validates JWT during the STOMP `CONNECT` phase to prevent unauthorized socket hijacking.

### **Ecosystem Performance**
- **Load Testing**: Integrated **K6 Performance Scripts** simulate high-traffic scenarios (load, stress, spike) for the Message and DirectMessage modules.
- **Health Monitoring**: Spring Actuator tracks service health within Docker containers.

---

## 🚀 5. Getting Started

### **Environment Variables (.env)**
- `POSTGRES_USER`, `POSTGRES_PASSWORD`: DB Credentials.
- `JWT_SECRET`: 256-bit signing key.
- `MAIL_USERNAME`, `MAIL_PASSWORD`: SMTP credentials for OTP.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`: Media hosting.

### **Local Deployment**
```bash
# 1. Clone & Init
# 2. Config .env
# 3. Docker Launch
docker-compose up --build -d
```
Applications will be available at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080/api`
- **Interactive Documentation (Swagger)**: `http://localhost:8080/swagger-ui.html`
