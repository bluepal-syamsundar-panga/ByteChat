# ByteChat - PostgreSQL Database Queries Reference

## 🔌 Connect to Database

```bash
# Connect to PostgreSQL
psql -U postgres -d bytechat

# Or with password prompt
psql -U postgres -d bytechat -W

# Connect from Docker
docker exec -it <postgres-container-name> psql -U postgres -d bytechat
```

---

## 📋 Basic Database Commands

```sql
-- List all tables
\dt

-- Describe table structure
\d users
\d workspaces
\d channels
\d messages

-- List all databases
\l

-- Switch database
\c bytechat

-- Show current database
SELECT current_database();

-- Quit psql
\q
```

---

## 👥 USER QUERIES

### View All Users
```sql
SELECT 
    id,
    email,
    display_name,
    online,
    role,
    is_verified,
    created_at,
    last_seen
FROM users
ORDER BY created_at DESC;
```

### View Online Users
```sql
SELECT 
    id,
    email,
    display_name,
    last_seen
FROM users
WHERE online = true
ORDER BY display_name;
```

### Find User by Email
```sql
SELECT * FROM users 
WHERE email = 'user@example.com';
```

### Count Total Users
```sql
SELECT COUNT(*) as total_users FROM users;
```

### Users Registered Today
```sql
SELECT 
    id,
    email,
    display_name,
    created_at
FROM users
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Users with Most Workspaces
```sql
SELECT 
    u.id,
    u.email,
    u.display_name,
    COUNT(wm.workspace_id) as workspace_count
FROM users u
LEFT JOIN workspace_members wm ON u.id = wm.user_id
GROUP BY u.id, u.email, u.display_name
ORDER BY workspace_count DESC
LIMIT 10;
```

---

## 🏢 WORKSPACE QUERIES

### View All Workspaces
```sql
SELECT 
    w.id,
    w.name,
    w.description,
    w.is_private,
    w.is_archived,
    u.display_name as owner_name,
    u.email as owner_email,
    w.created_at
FROM workspaces w
JOIN users u ON w.owner_id = u.id
ORDER BY w.created_at DESC;
```

### Workspace with Member Count
```sql
SELECT 
    w.id,
    w.name,
    w.is_private,
    u.display_name as owner,
    COUNT(wm.user_id) as member_count,
    w.created_at
FROM workspaces w
JOIN users u ON w.owner_id = u.id
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
GROUP BY w.id, w.name, w.is_private, u.display_name, w.created_at
ORDER BY member_count DESC;
```

### Find Workspace by Name
```sql
SELECT 
    w.*,
    u.display_name as owner_name
FROM workspaces w
JOIN users u ON w.owner_id = u.id
WHERE w.name ILIKE '%workspace_name%';
```

### Workspaces for Specific User
```sql
SELECT 
    w.id,
    w.name,
    w.description,
    wm.role,
    wm.joined_at
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = 1  -- Replace with user ID
ORDER BY wm.joined_at DESC;
```

### Archived Workspaces
```sql
SELECT 
    w.id,
    w.name,
    u.display_name as owner,
    w.created_at
FROM workspaces w
JOIN users u ON w.owner_id = u.id
WHERE w.is_archived = true
ORDER BY w.created_at DESC;
```

---

## 👥 WORKSPACE MEMBERS QUERIES

### View All Members of a Workspace
```sql
SELECT 
    u.id,
    u.email,
    u.display_name,
    u.avatar_url,
    wm.role,
    wm.joined_at
FROM workspace_members wm
JOIN users u ON wm.user_id = u.id
WHERE wm.workspace_id = 1  -- Replace with workspace ID
ORDER BY wm.joined_at;
```

### Count Members per Workspace
```sql
SELECT 
    w.id,
    w.name,
    COUNT(wm.user_id) as member_count
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
GROUP BY w.id, w.name
ORDER BY member_count DESC;
```

### Find Workspace Owners
```sql
SELECT 
    u.display_name,
    u.email,
    COUNT(w.id) as owned_workspaces
FROM users u
JOIN workspaces w ON u.id = w.owner_id
GROUP BY u.id, u.display_name, u.email
ORDER BY owned_workspaces DESC;
```

### Members with Admin Role
```sql
SELECT 
    w.name as workspace_name,
    u.display_name,
    u.email,
    wm.role
FROM workspace_members wm
JOIN users u ON wm.user_id = u.id
JOIN workspaces w ON wm.workspace_id = w.id
WHERE wm.role IN ('OWNER', 'ADMIN')
ORDER BY w.name, wm.role;
```

---

## 📢 CHANNEL QUERIES

### View All Channels
```sql
SELECT 
    c.id,
    c.name,
    c.description,
    c.is_private,
    c.is_default,
    c.is_archived,
    c.is_deleted,
    w.name as workspace_name,
    u.display_name as created_by,
    c.created_at
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
JOIN users u ON c.created_by = u.id
ORDER BY c.created_at DESC;
```

### Channels in Specific Workspace
```sql
SELECT 
    c.id,
    c.name,
    c.description,
    c.is_private,
    c.is_default,
    COUNT(cm.user_id) as member_count
FROM channels c
LEFT JOIN channel_members cm ON c.id = cm.channel_id
WHERE c.workspace_id = 1  -- Replace with workspace ID
  AND c.is_deleted = false
GROUP BY c.id, c.name, c.description, c.is_private, c.is_default
ORDER BY c.is_default DESC, c.name;
```

### Default Channels
```sql
SELECT 
    c.id,
    c.name,
    w.name as workspace_name,
    COUNT(cm.user_id) as member_count
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
LEFT JOIN channel_members cm ON c.id = cm.channel_id
WHERE c.is_default = true
GROUP BY c.id, c.name, w.name
ORDER BY w.name;
```

### Archived Channels
```sql
SELECT 
    c.id,
    c.name,
    w.name as workspace_name,
    c.created_at
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
WHERE c.is_archived = true
ORDER BY c.created_at DESC;
```

### Deleted Channels (Trash)
```sql
SELECT 
    c.id,
    c.name,
    w.name as workspace_name,
    c.created_at
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
WHERE c.is_deleted = true
ORDER BY c.created_at DESC;
```

### Private vs Public Channels
```sql
SELECT 
    is_private,
    COUNT(*) as channel_count
FROM channels
WHERE is_deleted = false
GROUP BY is_private;
```

---

## 👥 CHANNEL MEMBERS QUERIES

### View Members of a Channel
```sql
SELECT 
    u.id,
    u.email,
    u.display_name,
    u.avatar_url,
    cm.joined_at
FROM channel_members cm
JOIN users u ON cm.user_id = u.id
WHERE cm.channel_id = 1  -- Replace with channel ID
ORDER BY cm.joined_at;
```

### Channels for Specific User
```sql
SELECT 
    c.id,
    c.name,
    c.is_private,
    w.name as workspace_name,
    cm.joined_at
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
JOIN channel_members cm ON c.id = cm.channel_id
WHERE cm.user_id = 1  -- Replace with user ID
  AND c.is_deleted = false
ORDER BY cm.joined_at DESC;
```

### Count Members per Channel
```sql
SELECT 
    c.id,
    c.name,
    w.name as workspace_name,
    COUNT(cm.user_id) as member_count
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
LEFT JOIN channel_members cm ON c.id = cm.channel_id
GROUP BY c.id, c.name, w.name
ORDER BY member_count DESC;
```

---

## 💬 MESSAGE QUERIES

### View Recent Messages in Channel
```sql
SELECT 
    m.id,
    m.content,
    m.type,
    u.display_name as sender,
    m.is_deleted,
    m.is_pinned,
    m.sent_at,
    m.edited_at
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.channel_id = 1  -- Replace with channel ID
ORDER BY m.sent_at DESC
LIMIT 50;
```

### Count Messages per Channel
```sql
SELECT 
    c.id,
    c.name,
    COUNT(m.id) as message_count
FROM channels c
LEFT JOIN messages m ON c.id = m.channel_id
WHERE c.is_deleted = false
GROUP BY c.id, c.name
ORDER BY message_count DESC;
```

### Messages Sent Today
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    c.name as channel,
    m.sent_at
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN channels c ON m.channel_id = c.id
WHERE DATE(m.sent_at) = CURRENT_DATE
ORDER BY m.sent_at DESC;
```

### Pinned Messages
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    c.name as channel,
    m.sent_at
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN channels c ON m.channel_id = c.id
WHERE m.is_pinned = true
ORDER BY m.sent_at DESC;
```

### Messages with Mentions
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    c.name as channel,
    m.sent_at
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN channels c ON m.channel_id = c.id
WHERE EXISTS (
    SELECT 1 FROM message_mentions mm 
    WHERE mm.message_id = m.id
)
ORDER BY m.sent_at DESC
LIMIT 50;
```

### Messages by Specific User
```sql
SELECT 
    m.id,
    m.content,
    c.name as channel,
    m.sent_at,
    m.is_deleted
FROM messages m
JOIN channels c ON m.channel_id = c.id
WHERE m.sender_id = 1  -- Replace with user ID
ORDER BY m.sent_at DESC
LIMIT 100;
```

### Edited Messages
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    c.name as channel,
    m.sent_at,
    m.edited_at
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN channels c ON m.channel_id = c.id
WHERE m.edited_at IS NOT NULL
ORDER BY m.edited_at DESC;
```

### Deleted Messages
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    c.name as channel,
    m.sent_at
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN channels c ON m.channel_id = c.id
WHERE m.is_deleted = true
ORDER BY m.sent_at DESC;
```

---

## 💬 DIRECT MESSAGE QUERIES

### View DMs Between Two Users
```sql
SELECT 
    dm.id,
    dm.content,
    u1.display_name as from_user,
    u2.display_name as to_user,
    dm.sent_at,
    dm.read_at,
    dm.is_deleted
FROM direct_messages dm
JOIN users u1 ON dm.from_user_id = u1.id
JOIN users u2 ON dm.to_user_id = u2.id
WHERE (dm.from_user_id = 1 AND dm.to_user_id = 2)
   OR (dm.from_user_id = 2 AND dm.to_user_id = 1)
ORDER BY dm.sent_at DESC
LIMIT 50;
```

### Unread DMs for User
```sql
SELECT 
    dm.id,
    dm.content,
    u.display_name as from_user,
    dm.sent_at
FROM direct_messages dm
JOIN users u ON dm.from_user_id = u.id
WHERE dm.to_user_id = 1  -- Replace with user ID
  AND dm.read_at IS NULL
  AND dm.is_deleted = false
ORDER BY dm.sent_at DESC;
```

### Count DMs per User
```sql
SELECT 
    u.id,
    u.display_name,
    COUNT(dm.id) as dm_count
FROM users u
LEFT JOIN direct_messages dm ON u.id = dm.from_user_id OR u.id = dm.to_user_id
GROUP BY u.id, u.display_name
ORDER BY dm_count DESC;
```

### Recent DM Conversations
```sql
SELECT DISTINCT ON (
    LEAST(dm.from_user_id, dm.to_user_id),
    GREATEST(dm.from_user_id, dm.to_user_id)
)
    u1.display_name as user1,
    u2.display_name as user2,
    dm.content as last_message,
    dm.sent_at as last_message_time
FROM direct_messages dm
JOIN users u1 ON dm.from_user_id = u1.id
JOIN users u2 ON dm.to_user_id = u2.id
ORDER BY 
    LEAST(dm.from_user_id, dm.to_user_id),
    GREATEST(dm.from_user_id, dm.to_user_id),
    dm.sent_at DESC;
```

---

## 🔔 NOTIFICATION QUERIES

### View All Notifications
```sql
SELECT 
    n.id,
    n.type,
    n.content,
    u.display_name as recipient,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON n.recipient_id = u.id
ORDER BY n.created_at DESC
LIMIT 100;
```

### Unread Notifications for User
```sql
SELECT 
    id,
    type,
    content,
    related_entity_id,
    created_at
FROM notifications
WHERE recipient_id = 1  -- Replace with user ID
  AND is_read = false
ORDER BY created_at DESC;
```

### Notifications by Type
```sql
SELECT 
    type,
    COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;
```

### Recent Workspace Invitations
```sql
SELECT 
    n.id,
    n.content,
    u.display_name as recipient,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON n.recipient_id = u.id
WHERE n.type = 'WORKSPACE_INVITE'
ORDER BY n.created_at DESC;
```

### Mention Notifications
```sql
SELECT 
    n.id,
    n.content,
    u.display_name as recipient,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON n.recipient_id = u.id
WHERE n.type = 'MENTION'
ORDER BY n.created_at DESC;
```

---

## 😊 REACTION QUERIES

### View Reactions on a Message
```sql
SELECT 
    r.emoji,
    u.display_name as user,
    r.created_at
FROM reactions r
JOIN users u ON r.user_id = u.id
WHERE r.message_id = 1  -- Replace with message ID
ORDER BY r.created_at;
```

### Most Used Emojis
```sql
SELECT 
    emoji,
    COUNT(*) as usage_count
FROM reactions
GROUP BY emoji
ORDER BY usage_count DESC
LIMIT 10;
```

### Messages with Most Reactions
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    COUNT(r.id) as reaction_count
FROM messages m
JOIN users u ON m.sender_id = u.id
LEFT JOIN reactions r ON m.id = r.message_id
GROUP BY m.id, m.content, u.display_name
ORDER BY reaction_count DESC
LIMIT 10;
```

---

## 📎 ATTACHMENT QUERIES

### View All Attachments
```sql
SELECT 
    a.id,
    a.file_name,
    a.file_type,
    a.file_size,
    u.display_name as uploader,
    a.uploaded_at
FROM attachments a
JOIN users u ON a.uploader_id = u.id
ORDER BY a.uploaded_at DESC;
```

### Attachments in Channel
```sql
SELECT 
    a.id,
    a.file_name,
    a.file_type,
    a.file_size,
    u.display_name as uploader,
    a.uploaded_at
FROM attachments a
JOIN users u ON a.uploader_id = u.id
JOIN messages m ON a.message_id = m.id
WHERE m.channel_id = 1  -- Replace with channel ID
ORDER BY a.uploaded_at DESC;
```

### Total Storage Used
```sql
SELECT 
    pg_size_pretty(SUM(file_size)::bigint) as total_storage
FROM attachments;
```

### Storage per User
```sql
SELECT 
    u.display_name,
    COUNT(a.id) as file_count,
    pg_size_pretty(SUM(a.file_size)::bigint) as total_size
FROM users u
LEFT JOIN attachments a ON u.id = a.uploader_id
GROUP BY u.id, u.display_name
ORDER BY SUM(a.file_size) DESC;
```

---

## 📨 INVITATION QUERIES

### Pending Workspace Invitations
```sql
SELECT 
    wi.id,
    w.name as workspace,
    u1.display_name as inviter,
    wi.invitee_email,
    u2.display_name as invitee,
    wi.status,
    wi.created_at
FROM workspace_invitations wi
JOIN workspaces w ON wi.workspace_id = w.id
JOIN users u1 ON wi.inviter_id = u1.id
LEFT JOIN users u2 ON wi.invitee_id = u2.id
WHERE wi.status = 'PENDING'
ORDER BY wi.created_at DESC;
```

### Pending Channel Invitations
```sql
SELECT 
    ci.id,
    c.name as channel,
    u1.display_name as inviter,
    u2.display_name as invitee,
    ci.status,
    ci.created_at
FROM channel_invitations ci
JOIN channels c ON ci.channel_id = c.id
JOIN users u1 ON ci.inviter_id = u1.id
JOIN users u2 ON ci.invitee_id = u2.id
WHERE ci.status = 'PENDING'
ORDER BY ci.created_at DESC;
```

### Invitation Statistics
```sql
SELECT 
    status,
    COUNT(*) as count
FROM workspace_invitations
GROUP BY status;
```

---

## 📊 ANALYTICS QUERIES

### Daily Active Users (Last 7 Days)
```sql
SELECT 
    DATE(last_seen) as date,
    COUNT(DISTINCT id) as active_users
FROM users
WHERE last_seen >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(last_seen)
ORDER BY date DESC;
```

### Messages per Day (Last 30 Days)
```sql
SELECT 
    DATE(sent_at) as date,
    COUNT(*) as message_count
FROM messages
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

### Most Active Channels
```sql
SELECT 
    c.name,
    w.name as workspace,
    COUNT(m.id) as message_count
FROM channels c
JOIN workspaces w ON c.workspace_id = w.id
LEFT JOIN messages m ON c.id = m.channel_id
WHERE m.sent_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.id, c.name, w.name
ORDER BY message_count DESC
LIMIT 10;
```

### Most Active Users
```sql
SELECT 
    u.display_name,
    u.email,
    COUNT(m.id) as message_count
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id
WHERE m.sent_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.id, u.display_name, u.email
ORDER BY message_count DESC
LIMIT 10;
```

### Workspace Growth
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_workspaces
FROM workspaces
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### User Registration Trend
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔍 ADVANCED QUERIES

### Find Orphaned Records
```sql
-- Channels without workspace
SELECT c.* FROM channels c
LEFT JOIN workspaces w ON c.workspace_id = w.id
WHERE w.id IS NULL;

-- Messages without channel
SELECT m.* FROM messages m
LEFT JOIN channels c ON m.channel_id = c.id
WHERE c.id IS NULL;

-- Channel members without user
SELECT cm.* FROM channel_members cm
LEFT JOIN users u ON cm.user_id = u.id
WHERE u.id IS NULL;
```

### Database Size Information
```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size('bytechat'));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Search Messages by Content
```sql
SELECT 
    m.id,
    m.content,
    u.display_name as sender,
    c.name as channel,
    m.sent_at
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN channels c ON m.channel_id = c.id
WHERE m.content ILIKE '%search_term%'
  AND m.is_deleted = false
ORDER BY m.sent_at DESC
LIMIT 50;
```

### User Activity Summary
```sql
SELECT 
    u.id,
    u.display_name,
    u.email,
    COUNT(DISTINCT wm.workspace_id) as workspaces,
    COUNT(DISTINCT cm.channel_id) as channels,
    COUNT(DISTINCT m.id) as messages_sent,
    u.created_at as joined_date,
    u.last_seen
FROM users u
LEFT JOIN workspace_members wm ON u.id = wm.user_id
LEFT JOIN channel_members cm ON u.id = cm.user_id
LEFT JOIN messages m ON u.id = m.sender_id
WHERE u.id = 1  -- Replace with user ID
GROUP BY u.id, u.display_name, u.email, u.created_at, u.last_seen;
```

---

## 🧹 MAINTENANCE QUERIES

### Delete Old Notifications (Read, Older than 30 Days)
```sql
DELETE FROM notifications
WHERE is_read = true
  AND created_at < CURRENT_DATE - INTERVAL '30 days';
```

### Clean Up Deleted Messages (Older than 30 Days)
```sql
DELETE FROM messages
WHERE is_deleted = true
  AND sent_at < CURRENT_DATE - INTERVAL '30 days';
```

### Vacuum and Analyze
```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;

-- For specific table
VACUUM ANALYZE messages;
```

### Reindex Tables
```sql
-- Reindex all tables
REINDEX DATABASE bytechat;

-- Reindex specific table
REINDEX TABLE messages;
```

---

## 💡 Useful Tips

### Export Query Results to CSV
```sql
\copy (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;
```

### Show Query Execution Time
```sql
\timing on
SELECT COUNT(*) FROM messages;
\timing off
```

### Pretty Print Results
```sql
\x on  -- Expanded display
SELECT * FROM users WHERE id = 1;
\x off
```

### Save Query Output to File
```sql
\o /tmp/output.txt
SELECT * FROM users;
\o
```

---

## 🚀 Quick Health Check

Run this comprehensive health check query:

```sql
SELECT 
    'Total Users' as metric, COUNT(*)::text as value FROM users
UNION ALL
SELECT 'Online Users', COUNT(*)::text FROM users WHERE online = true
UNION ALL
SELECT 'Total Workspaces', COUNT(*)::text FROM workspaces
UNION ALL
SELECT 'Total Channels', COUNT(*)::text FROM channels WHERE is_deleted = false
UNION ALL
SELECT 'Total Messages', COUNT(*)::text FROM messages
UNION ALL
SELECT 'Messages Today', COUNT(*)::text FROM messages WHERE DATE(sent_at) = CURRENT_DATE
UNION ALL
SELECT 'Unread Notifications', COUNT(*)::text FROM notifications WHERE is_read = false
UNION ALL
SELECT 'Pending Invitations', COUNT(*)::text FROM workspace_invitations WHERE status = 'PENDING';
```

---

**Last Updated**: 2026-03-19  
**Database**: PostgreSQL  
**Application**: ByteChat
