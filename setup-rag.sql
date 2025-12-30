-- ================================================
-- RAG Vector Search Setup for Avivro
-- Run this entire script in Supabase SQL Editor
-- ================================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop old embedding column and recreate with correct dimensions
ALTER TABLE knowledge_chunks 
DROP COLUMN IF EXISTS embedding CASCADE;

ALTER TABLE knowledge_chunks 
ADD COLUMN embedding vector(768);

-- Step 3: Drop old index and create new one
DROP INDEX IF EXISTS knowledge_chunks_embedding_idx CASCADE;

CREATE INDEX knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Drop old function and create updated version
DROP FUNCTION IF EXISTS match_knowledge_chunks CASCADE;

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(768),
  agent_sources uuid[],
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.source_id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    kc.source_id = ANY(agent_sources)
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION match_knowledge_chunks TO authenticated, anon;

-- Step 6: Update trigger for default embeddings
DROP TRIGGER IF EXISTS knowledge_chunks_default_embedding ON knowledge_chunks;
DROP FUNCTION IF EXISTS set_default_embedding CASCADE;

CREATE OR REPLACE FUNCTION set_default_embedding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.embedding IS NULL THEN
    NEW.embedding := array_fill(0, ARRAY[768])::vector(768);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER knowledge_chunks_default_embedding
  BEFORE INSERT ON knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION set_default_embedding();

-- ================================================
-- Verification Queries
-- ================================================

-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check embedding column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'knowledge_chunks' 
AND column_name = 'embedding';

-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'match_knowledge_chunks';

-- Check existing knowledge chunks status
SELECT 
  ks.name AS source_name,
  ks.status,
  COUNT(kc.id) AS total_chunks,
  COUNT(kc.embedding) FILTER (WHERE kc.embedding IS NOT NULL) AS chunks_with_embeddings,
  COUNT(kc.embedding) FILTER (WHERE kc.embedding IS NULL) AS chunks_without_embeddings
FROM knowledge_sources ks
LEFT JOIN knowledge_chunks kc ON kc.source_id = ks.id
GROUP BY ks.id, ks.name, ks.status
ORDER BY ks.created_at DESC;

-- ================================================
-- SUCCESS! 
-- Next steps:
-- 1. Set OPENROUTER_API_KEY in Supabase Edge Functions
-- 2. Delete and re-add all knowledge sources
-- 3. Test chatbot with specific knowledge questions
-- ================================================
