-- Function to delete messages older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages older than 7 days
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Log the cleanup (optional - for monitoring)
  RAISE NOTICE 'Cleaned up messages older than 7 days at %', NOW();
END;
$$;

-- Function to delete old conversations that have no messages
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete conversations older than 7 days that have no messages
  DELETE FROM conversations
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND id NOT IN (SELECT DISTINCT conversation_id FROM messages);
  
  RAISE NOTICE 'Cleaned up empty conversations older than 7 days at %', NOW();
END;
$$;

-- Combined cleanup function (runs both cleanups)
CREATE OR REPLACE FUNCTION run_message_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old messages
  PERFORM cleanup_old_messages();
  
  -- Clean up empty conversations
  PERFORM cleanup_empty_conversations();
  
  RAISE NOTICE 'Message cleanup completed at %', NOW();
END;
$$;

-- Create a table to track cleanup runs (optional - for monitoring)
CREATE TABLE IF NOT EXISTS message_cleanup_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  messages_deleted INTEGER,
  conversations_deleted INTEGER
);

-- Enable RLS on cleanup log
ALTER TABLE message_cleanup_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cleanup logs
CREATE POLICY "Allow authenticated to read cleanup logs"
ON message_cleanup_log
FOR SELECT
TO authenticated
USING (true);

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION cleanup_old_messages() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_empty_conversations() TO service_role;
GRANT EXECUTE ON FUNCTION run_message_cleanup() TO service_role;

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

COMMENT ON FUNCTION run_message_cleanup() IS 'Cleans up messages and conversations older than 7 days. Should be run daily via cron job.';
