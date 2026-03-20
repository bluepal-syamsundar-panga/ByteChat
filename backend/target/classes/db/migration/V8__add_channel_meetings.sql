CREATE TABLE meetings (
    id bigserial PRIMARY KEY,
    channel_id bigint NOT NULL,
    workspace_id bigint NOT NULL,
    creator_id bigint NOT NULL,
    title varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,
    room_key varchar(255) NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp(6),
    CONSTRAINT fk_meeting_channel FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE,
    CONSTRAINT fk_meeting_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_meeting_creator FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_meetings_workspace_active ON meetings(workspace_id, is_active, created_at DESC);
CREATE INDEX idx_meetings_channel_active ON meetings(channel_id, is_active, created_at DESC);
