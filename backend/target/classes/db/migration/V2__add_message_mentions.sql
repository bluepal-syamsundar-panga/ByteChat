-- Add message_mentions table to track which users are mentioned in messages
CREATE TABLE IF NOT EXISTS message_mentions (
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, user_id)
);

-- Add index for faster lookups
CREATE INDEX idx_message_mentions_user_id ON message_mentions(user_id);
CREATE INDEX idx_message_mentions_message_id ON message_mentions(message_id);
