# ByteChat

A real-time Slack clone built with Spring Boot and React.

## Features
* User Authentication (JWT)
* Public Rooms and Direct Messages
* Real-time messaging via WebSockets (STOMP/SockJS)
* Online Presence tracking
* Edit, Delete, Pin Messages
* Unread message badges and typing indicators structure
* Slack-like UI using TailwindCSS

## Tech Stack
* **Frontend**: React 18, Vite, TailwindCSS, Zustand
* **Backend**: Spring Boot 3, Spring Security, Spring WebSocket
* **Database**: PostgreSQL

## Running Locally via Docker Compose

Prerequisites: Docker installed.

1. Navigate to the root directory `d:\ByteChat`.
2. Run the stack:
```bash
docker-compose up --build -d
```
3. Access the applications:
* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:8080/api`

## Environment Variables
Defaults are provided in the docker-compose file. You can override them:
* `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
* `JWT_SECRET`
