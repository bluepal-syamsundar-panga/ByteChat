-- Consolidated Schema for Slack Clone Application
-- This migration creates all necessary tables for the application

-- Users table
CREATE TABLE users (
    id bigserial PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    display_name varchar(255) NOT NULL,
    avatar_url varchar(255),
    last_seen timestamp(6),
    online boolean NOT NULL DEFAULT false,
    is_verified boolean NOT NULL DEFAULT false,
    role varchar(255) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER','MEMBER')),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- OTPs table for verification
CREATE TABLE otps (
    id bigserial PRIMARY KEY,
    email varchar(255) NOT NULL,
    code varchar(6) NOT NULL,
    otp_type varchar(50) NOT NULL CHECK (otp_type IN ('REGISTRATION', 'PASSWORD_RESET', 'WORKSPACE_CREATION')),
    expiry_time timestamp(6) NOT NULL,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces table (formerly rooms)
CREATE TABLE workspaces (
    id bigserial PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text,
    is_private boolean NOT NULL DEFAULT false,
    is_archived boolean NOT NULL DEFAULT false,
    owner_id bigint NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workspace_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Workspace members table
CREATE TABLE workspace_members (
    id bigserial PRIMARY KEY,
    workspace_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role varchar(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    joined_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_wm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_workspace_user UNIQUE (workspace_id, user_id)
);

-- Workspace invitations table
CREATE TABLE workspace_invitations (
    id bigserial PRIMARY KEY,
    workspace_id bigint NOT NULL,
    inviter_id bigint NOT NULL,
    invitee_email varchar(255) NOT NULL,
    invitee_id bigint,
    status varchar(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp(6),
    CONSTRAINT fk_wi_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_wi_inviter FOREIGN KEY (inviter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_wi_invitee FOREIGN KEY (invitee_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Channels table
CREATE TABLE channels (
    id bigserial PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text,
    workspace_id bigint NOT NULL,
    is_private boolean NOT NULL DEFAULT false,
    is_default boolean NOT NULL DEFAULT false,
    is_archived boolean NOT NULL DEFAULT false,
    created_by bigint NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_channel_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_channel_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

-- Channel members table
CREATE TABLE channel_members (
    channel_id bigint NOT NULL,
    user_id bigint NOT NULL,
    joined_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (channel_id, user_id),
    CONSTRAINT fk_cm_channel FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Channel invitations table
CREATE TABLE channel_invitations (
    id bigserial PRIMARY KEY,
    channel_id bigint NOT NULL,
    inviter_id bigint NOT NULL,
    invitee_id bigint NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp(6),
    CONSTRAINT fk_ci_channel FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_inviter FOREIGN KEY (inviter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_invitee FOREIGN KEY (invitee_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE messages (
    id bigserial PRIMARY KEY,
    content text NOT NULL,
    type varchar(50) DEFAULT 'TEXT',
    channel_id bigint,
    sender_id bigint NOT NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    is_pinned boolean NOT NULL DEFAULT false,
    sent_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited_at timestamp(6),
    CONSTRAINT fk_message_channel FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Message mentions table
CREATE TABLE message_mentions (
    message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    PRIMARY KEY (message_id, user_id),
    CONSTRAINT fk_mention_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_mention_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Attachments table
CREATE TABLE attachments (
    id bigserial PRIMARY KEY,
    file_name varchar(255) NOT NULL,
    file_type varchar(100) NOT NULL,
    file_size bigint,
    file_url varchar(500) NOT NULL,
    message_id bigint,
    uploader_id bigint NOT NULL,
    uploaded_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_uploader FOREIGN KEY (uploader_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Reactions table
CREATE TABLE reactions (
    id bigserial PRIMARY KEY,
    emoji varchar(50) NOT NULL,
    message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reaction_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_reaction_message_user_emoji UNIQUE (message_id, user_id, emoji)
);

-- Direct messages table
CREATE TABLE direct_messages (
    id bigserial PRIMARY KEY,
    content text NOT NULL,
    type varchar(50) DEFAULT 'TEXT',
    from_user_id bigint NOT NULL,
    to_user_id bigint NOT NULL,
    workspace_id bigint,
    is_deleted boolean NOT NULL DEFAULT false,
    read_at timestamp(6),
    sent_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dm_from_user FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_dm_to_user FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_dm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

-- DM requests table
CREATE TABLE dm_requests (
    id bigserial PRIMARY KEY,
    workspace_id bigint NOT NULL,
    requester_id bigint NOT NULL,
    recipient_id bigint NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp(6),
    CONSTRAINT fk_dmr_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_dmr_requester FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_dmr_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_dm_request UNIQUE (workspace_id, requester_id, recipient_id)
);

-- Notifications table
CREATE TABLE notifications (
    id bigserial PRIMARY KEY,
    type varchar(100) NOT NULL,
    content text NOT NULL,
    recipient_id bigint NOT NULL,
    related_entity_id bigint,
    related_entity_type varchar(100),
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Message reads table
CREATE TABLE message_reads (
    id bigserial PRIMARY KEY,
    message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mr_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_mr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_message_user_read UNIQUE (message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_direct_messages_users ON direct_messages(from_user_id, to_user_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_workspace_invitations_invitee ON workspace_invitations(invitee_email);
CREATE INDEX idx_channel_invitations_invitee ON channel_invitations(invitee_id);
CREATE INDEX idx_message_reads_message ON message_reads(message_id);
