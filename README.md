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

1. Navigate to the project root directory.
2. Create your local env file:
```bash
Copy-Item .env.example .env
```
3. Fill in the confidential values inside `.env`.
4. Run the stack:
```bash
docker-compose up --build -d
```
5. Access the applications:
* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:8080/api`

## Environment Variables
Set these in `.env`:
* `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
* `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
* `JWT_SECRET`
* `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
