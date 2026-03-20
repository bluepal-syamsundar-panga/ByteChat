ALTER TABLE reactions
ADD COLUMN group_conversation_message_id BIGINT NULL;

ALTER TABLE reactions
ADD CONSTRAINT fk_reactions_group_conversation_message
FOREIGN KEY (group_conversation_message_id)
REFERENCES group_conversation_messages(id)
ON DELETE CASCADE;
