CREATE TABLE IF NOT EXISTS message_hidden_users (
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (message_id, user_id),
    CONSTRAINT fk_message_hidden_users_message
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_hidden_users_user_id
    ON message_hidden_users(user_id);

CREATE TABLE IF NOT EXISTS direct_message_hidden_users (
    direct_message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (direct_message_id, user_id),
    CONSTRAINT fk_direct_message_hidden_users_message
        FOREIGN KEY (direct_message_id) REFERENCES direct_messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_direct_message_hidden_users_user_id
    ON direct_message_hidden_users(user_id);
