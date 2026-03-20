CREATE TABLE group_conversations (
    id bigserial PRIMARY KEY,
    workspace_id bigint NOT NULL,
    name varchar(255) NOT NULL,
    created_by bigint NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_conversation_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_conversation_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE group_conversation_members (
    id bigserial PRIMARY KEY,
    group_conversation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    joined_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_member_group FOREIGN KEY (group_conversation_id) REFERENCES group_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_member_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_group_member UNIQUE (group_conversation_id, user_id)
);

CREATE TABLE group_conversation_invites (
    id bigserial PRIMARY KEY,
    group_conversation_id bigint NOT NULL,
    inviter_id bigint NOT NULL,
    invitee_id bigint NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp(6),
    CONSTRAINT fk_group_invite_group FOREIGN KEY (group_conversation_id) REFERENCES group_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_invite_inviter FOREIGN KEY (inviter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_invite_invitee FOREIGN KEY (invitee_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_group_invite UNIQUE (group_conversation_id, invitee_id)
);

CREATE TABLE group_conversation_messages (
    id bigserial PRIMARY KEY,
    group_conversation_id bigint NOT NULL,
    sender_id bigint NOT NULL,
    content text NOT NULL,
    type varchar(50) DEFAULT 'TEXT',
    reply_to_message_id bigint,
    reply_to_content text,
    reply_to_sender_name varchar(255),
    is_deleted boolean NOT NULL DEFAULT false,
    is_pinned boolean NOT NULL DEFAULT false,
    pinned_by_user_id bigint,
    pinned_by_name varchar(255),
    edited_at timestamp(6),
    sent_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_message_group FOREIGN KEY (group_conversation_id) REFERENCES group_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_message_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE group_conversation_message_hidden_users (
    group_conversation_message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT fk_group_message_hidden_message FOREIGN KEY (group_conversation_message_id) REFERENCES group_conversation_messages (id) ON DELETE CASCADE
);

CREATE TABLE group_conversation_message_reads (
    id bigserial PRIMARY KEY,
    message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_message_read_message FOREIGN KEY (message_id) REFERENCES group_conversation_messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_message_read_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_group_message_read UNIQUE (message_id, user_id)
);

CREATE INDEX idx_group_conversation_workspace ON group_conversations(workspace_id);
CREATE INDEX idx_group_member_user ON group_conversation_members(user_id);
CREATE INDEX idx_group_invite_invitee ON group_conversation_invites(invitee_id, status);
CREATE INDEX idx_group_message_group ON group_conversation_messages(group_conversation_id, sent_at);
CREATE INDEX idx_group_message_read_message ON group_conversation_message_reads(message_id, user_id);
