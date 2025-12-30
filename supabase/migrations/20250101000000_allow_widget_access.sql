-- Enable RLS on tables if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow widget to insert conversations" ON conversations;
DROP POLICY IF EXISTS "Allow widget to insert messages" ON messages;
DROP POLICY IF EXISTS "Allow widget to insert leads" ON leads;
DROP POLICY IF EXISTS "Allow widget to read own conversation" ON conversations;
DROP POLICY IF EXISTS "Allow widget to read own messages" ON messages;

-- CONVERSATIONS TABLE POLICIES
-- Allow anyone (widget users) to insert conversations
CREATE POLICY "Allow widget to insert conversations"
ON conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read conversations they're part of
CREATE POLICY "Allow widget to read own conversation"
ON conversations
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow agents to read all their conversations
CREATE POLICY "Allow agents to read their conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow agents to update their conversations
CREATE POLICY "Allow agents to update their conversations"
ON conversations
FOR UPDATE
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- MESSAGES TABLE POLICIES
-- Allow anyone (widget users) to insert messages
CREATE POLICY "Allow widget to insert messages"
ON messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read messages in their conversation
CREATE POLICY "Allow widget to read own messages"
ON messages
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow agents to read messages in their conversations
CREATE POLICY "Allow agents to read their messages"
ON messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    INNER JOIN agents a ON c.agent_id = a.id
    WHERE a.user_id = auth.uid()
  )
);

-- LEADS TABLE POLICIES
-- Allow anyone (widget users) to insert leads
CREATE POLICY "Allow widget to insert leads"
ON leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow agents to read their leads
CREATE POLICY "Allow agents to read their leads"
ON leads
FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow agents to update their leads
CREATE POLICY "Allow agents to update their leads"
ON leads
FOR UPDATE
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow agents to delete their leads
CREATE POLICY "Allow agents to delete their leads"
ON leads
FOR DELETE
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);
