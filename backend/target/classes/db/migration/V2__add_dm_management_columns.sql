-- Add columns to direct_messages for pinning and editing
ALTER TABLE direct_messages ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE direct_messages ADD COLUMN edited_at TIMESTAMP(6);

-- Update reactions table to support DMs
ALTER TABLE reactions ADD COLUMN dm_id BIGINT;
ALTER TABLE reactions ALTER COLUMN message_id DROP NOT NULL;
ALTER TABLE reactions ADD CONSTRAINT fk_reaction_dm FOREIGN KEY (dm_id) REFERENCES direct_messages (id) ON DELETE CASCADE;

-- Update unique constraint for reactions
-- Drop old constraint that required message_id
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS uk_reaction_message_user_emoji;

-- Create partial unique indexes to handle both channel messages and DMs
-- This ensures a user can only react with the same emoji once per message/DM
CREATE UNIQUE INDEX idx_unique_reaction_message ON reactions (message_id, user_id, emoji) WHERE message_id IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_reaction_dm ON reactions (dm_id, user_id, emoji) WHERE dm_id IS NOT NULL;
