ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS reply_to_message_id BIGINT,
    ADD COLUMN IF NOT EXISTS reply_to_content TEXT,
    ADD COLUMN IF NOT EXISTS reply_to_sender_name VARCHAR(255);

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS reply_to_message_id BIGINT,
    ADD COLUMN IF NOT EXISTS reply_to_content TEXT,
    ADD COLUMN IF NOT EXISTS reply_to_sender_name VARCHAR(255);
