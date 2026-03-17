-- Migration to add lifecycle management columns to channels table
ALTER TABLE channels ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
