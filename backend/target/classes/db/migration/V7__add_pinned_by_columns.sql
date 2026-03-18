ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS pinned_by_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS pinned_by_name VARCHAR(255);

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS pinned_by_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS pinned_by_name VARCHAR(255);
