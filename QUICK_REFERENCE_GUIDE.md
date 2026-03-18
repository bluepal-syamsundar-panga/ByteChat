# ByteChat - Quick Reference Guide

## 🚀 Quick Start

### Start Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend runs on: `http://localhost:8080`

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Start with Docker
```bash
docker-compose up -d
```

---

## 📊 Entity Quick Reference

### Core Entities

| Entity | Key Fields | Purpose |
|--------|-----------|---------|
| **User** | id, email, displayName, avatarUrl, online | User accounts |
| **Workspace** | id, name, isPrivate, owner_id | Workspace containers |
| **Channel** | id, name, workspace_id, isPrivate, isDefault | Communication channels |
| **Message** | id, channel_id, sender_id, content, sentAt | Channel messages |
| **DirectMessage** | id, from_user_id, to_user_id, content, readAt | Private messages |
| **Notification** | id, recipient_id, type, content, isRead | User notifications |

### Relationships

```
User ──< WorkspaceMember >── Workspace ──< Channel ──< Message
User ──< ChannelMember >── Channel
User ──< DirectMessage >── User
User ──< Notification
```

---

## 🔑 API Quick Reference

### Authentication
```bash
# Register
POST /api/auth/register
Body: { email, password, displayName, otpCode }

# Login
POST /api/auth/login
Body: { email, password }

# Refresh Token
POST /api/auth/refresh
Body: { refreshToken }
```

### Workspaces
```bash
# Create Workspace
POST /api/workspaces/create
Body: { name, description, isPrivate, email }

# Get User Workspaces
GET /api/workspaces?page=0&size=50

# Invite User
POST /api/workspaces/{id}/invite
Body: { email }
```

### Channels
```bash
# Create Channel
POST /api/channels/workspace/{workspaceId}
Body: { name, description, isPrivate }

# Get Workspace Channels
GET /api/channels/workspace/{workspaceId}

# Send Message
POST /api/messages/channel/{channelId}
Body: { content, type, replyToId }

# Get Messages
GET /api/messages/channel/{channelId}?page=0&size=50
```

### Direct Messages
```bash
# Send DM
POST /api/dm/{userId}
Body: { content, type }

# Get DM History
GET /api/dm/{userId}?page=0&size=50

# Mark as Read
PUT /api/dm/{userId}/read
```

### Notifications
```bash
# Get All Notifications
GET /api/notifications

# Mark as Read
PUT /api/notifications/{id}/read

# Accept Invite
POST /api/notifications/{id}/accept
```

---

## 🔌 WebSocket Quick Reference

### Connection
```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  connectHeaders: {
    Authorization: `Bearer ${accessToken}`
  }
});

client.activate();
```

### Topics

| Topic | Purpose |
|-------|---------|
| `/topic/channel/{channelId}` | Channel messages |
| `/topic/dm/{userId}` | Direct messages |
| `/topic/user/{userId}/notifications` | Notifications |
| `/topic/channel/{channelId}/typing` | Typing indicators |

### Subscribe Example
```javascript
client.subscribe('/topic/channel/123', (message) => {
  const data = JSON.parse(message.body);
  console.log('New message:', data);
});
```

### Publish Example
```javascript
client.publish({
  destination: '/app/chat/channel/123',
  body: JSON.stringify({ content: 'Hello!' })
});
```

---

## 🎨 Frontend State Management

### Auth Store
```javascript
const { user, accessToken, login, logout } = useAuthStore();
```

### Chat Store
```javascript
const {
  workspaces,
  channels,
  channelMessages,
  dmMessages,
  notifications,
  appendChannelMessage,
  setNotifications
} = useChatStore();
```

---

## 🔐 Security Quick Reference

### JWT Configuration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Algorithm**: HS256
- **Header**: `Authorization: Bearer {token}`

### Roles

**Workspace Roles**:
- OWNER: Full control
- ADMIN: Manage members, create channels
- MEMBER: Basic access

**Channel Roles**:
- OWNER: Full control
- ADMIN: Manage members, moderate
- MEMBER: Send messages

---

## 📁 Project Structure

### Backend
```
backend/
├── src/main/java/com/bytechat/
│   ├── config/          # Security, WebSocket, Cloudinary
│   ├── controllers/     # REST & WebSocket controllers
│   ├── dto/            # Request/Response DTOs
│   ├── entity/         # JPA entities
│   ├── repository/     # JPA repositories
│   ├── services/       # Business logic
│   └── serviceimpl/    # Service implementations
└── src/main/resources/
    ├── application.properties
    └── db/migration/   # Flyway migrations
```

### Frontend
```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── Chat/      # Chat-related components
│   │   ├── Sidebar/   # Sidebar components
│   │   └── Common/    # Shared components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # Zustand stores
│   ├── routes/        # React Router config
│   └── App.jsx
└── package.json
```

---

## 🐛 Common Commands

### Backend
```bash
# Build
./mvnw clean install

# Run
./mvnw spring-boot:run

# Run tests
./mvnw test

# Package
./mvnw package
```

### Frontend
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database
```bash
# Create database
createdb bytechat

# Connect to database
psql -U postgres -d bytechat

# Run migrations (automatic on startup)
```

### Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 🔍 Debugging Tips

### Check Backend Health
```bash
curl http://localhost:8080/actuator/health
```

### Check WebSocket Connection
```javascript
// In browser console
console.log('WebSocket connected:', client.connected);
```

### View Database
```bash
psql -U postgres -d bytechat
\dt  # List tables
SELECT * FROM users;
SELECT * FROM messages LIMIT 10;
```

### Check Logs
```bash
# Backend logs
tail -f backend/logs/spring.log

# Frontend console
# Open browser DevTools → Console
```

---

## 📝 Environment Variables

### Backend (.env)
```bash
DB_URL=jdbc:postgresql://localhost:5432/bytechat
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

---

## 🎯 Feature Checklist

### Core Features
- ✅ User registration with OTP
- ✅ JWT authentication
- ✅ Workspace creation
- ✅ Channel management
- ✅ Real-time messaging
- ✅ Direct messages
- ✅ File uploads
- ✅ Online presence
- ✅ Typing indicators
- ✅ Notifications

### Advanced Features
- ✅ @Mentions
- ✅ Message replies
- ✅ Message reactions
- ✅ Message pinning
- ✅ Message editing
- ✅ Message deletion
- ✅ Channel archiving
- ✅ Role-based access
- ✅ Unread badges
- ✅ Read receipts

---

## 📞 Support

### Documentation
- Full Documentation: `BYTECHAT_COMPLETE_DOCUMENTATION.md`
- API Docs: `http://localhost:8080/swagger-ui.html`

### Useful Links
- Spring Boot Docs: https://spring.io/projects/spring-boot
- React Docs: https://react.dev
- STOMP.js Docs: https://stomp-js.github.io/stomp-websocket/

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: 2026-03-19
