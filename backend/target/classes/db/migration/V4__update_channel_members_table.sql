-- Migration to update channel_members table to support per-user roles and archiving
-- 1. Remove composite primary key
ALTER TABLE channel_members DROP CONSTRAINT channel_members_pkey;

-- 2. Add id column as primary key
ALTER TABLE channel_members ADD COLUMN id bigserial PRIMARY KEY;

-- 3. Add role column
ALTER TABLE channel_members ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'MEMBER';

-- 4. Add is_archived column
ALTER TABLE channel_members ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Add unique constraint on channel_id and user_id to prevent duplicate memberships
ALTER TABLE channel_members ADD CONSTRAINT uk_channel_user UNIQUE (channel_id, user_id);
