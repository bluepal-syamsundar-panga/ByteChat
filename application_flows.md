# ByteChat Application Flows — Project Blueprint

This document outlines the core functional journeys within the ByteChat application, presented in a stakeholder-friendly format.

---

## 1. User Onboarding & Identity  `~2 min`  `Core Demo`
Showcases the entry point for new and returning users, ensuring secure access and personalized presence.

> **Flow**:
> Registration Page (Email Entry) → Receive OTP via Email → Verification Page (Verify OTP) → Automatic Login → Landing Page (Workspace Selection)

**Key Features:**
- **OTP Verification**: Secure, passwordless authentication.
- **Auto-Login**: Seamless transition from verification to the application.
- **Profile Identity**: Setting up display name and avatar (syncs across the workspace).

---

## 2. Workspace Architecture  `~3 min`
ByteChat is multi-tenant, allowing users to collaborate across distinct team environments.

> **Flow**:
> Landing Page (View Workspaces) → Action: "Create Workspace" → Workspace Wizard (Name, Description) → Instant Setup → Redirect to Brand New Workspace

**Key Features:**
- **Multi-Tenancy**: Switch between different organizations without re-logging.
- **Workspace Wizard**: Simplified setup flow for team leads.
- **Notification Center**: Global view of invites (Workspaces, Channels, Meetings).

---

## 3. Team Collaboration (Channels)  `~5 min`  `Core Demo`
The heart of the application where real-time team communication happens.

> **Flow**:
> Sidebar (Select Channel) → Chat Window (View History) → Message Input (Typing Indicator) → Send Message → Real-time Broadcast to all Subscribers → "Seen" Receipt update

**Key Features:**
- **Rich Messaging**: Markdown support, mentions (@user), and URL previews.
- **File Sharing**: Instant upload and inline previews for Images, PDF, Video, and Voice Notes.
- **Threaded Context**: Reply to specific messages to keep conversations organized.
- **Emoji Reactions**: Interactive feedback on any message bubble.

---

## 4. Private Communication (Direct Messages)  `~3 min`
One-on-one secure messaging for sensitive or personal tasks.

> **Flow**:
> Sidebar (DM Section) → Search Users (Global Search) → Start Conversation → Private Chat Window → Presence Tracking (Online/Offline Status)

**Key Features:**
- **User Discovery**: Find anyone in the workspace instantly.
- **Presence Sync**: Real-time dots (Green/Gray) indicating availability.
- **Unread Badges**: Visual indicators for missed private messages.

---

## 5. Meetings & Visual Collaboration  `~5 min`  `Enterprise`
Scaling communication from text to face-to-face interactions.

> **Flow**:
> Sidebar (Meeting Tab/Launcher) → Set Title → "Start Meeting" → Broadcast Invite Notification to Members → Join Meeting View

**Key Features:**
- **Instant Launcher**: Start meetings from any channel or DM context.
- **Live Notifications**: Toast alerts for all invited members.
- **Meeting Presence**: See who is currently in a "Live" session.

---

## 6. Personal Settings & Preferences  `~2 min`
Giving users control over their digital office space.

> **Flow**:
> Header (Profile Menu) → Settings Page → Edit Display Name / Role → Avatar Upload (Cloudinary) → Save → Global Update across all active sessions

**Key Features:**
- **Presence Management**: Toggle online status.
- **Secure Storage**: External storage (Cloudinary) for high-performance avatar delivery.
- **Notification Preferences**: Manage which alerts trigger desktop toasts.
