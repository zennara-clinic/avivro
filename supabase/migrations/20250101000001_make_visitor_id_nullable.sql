-- Make visitor_id nullable for anonymous widget users
ALTER TABLE conversations 
ALTER COLUMN visitor_id DROP NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id ON conversations(visitor_id);
