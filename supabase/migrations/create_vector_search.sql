-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- Add embedding column to knowledge_chunks table if it doesn't exist
-- Using 768 dimensions for OpenAI text-embedding-3-small model
alter table knowledge_chunks 
add column if not exists embedding vector(768);

-- Create index for faster vector similarity search
create index if not exists knowledge_chunks_embedding_idx 
on knowledge_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create function to match knowledge chunks using vector similarity
-- Accepts array of source IDs to search within
create or replace function match_knowledge_chunks(
  query_embedding vector(768),
  agent_sources uuid[],
  match_threshold float default 0.5,
  match_count int default 3
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.source_id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where 
    kc.source_id = any(agent_sources)
    and kc.embedding is not null
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant execute permission to authenticated and anon users
grant execute on function match_knowledge_chunks to authenticated, anon;

-- Create function to generate and store embeddings (to be called when processing knowledge)
create or replace function generate_embedding_for_chunk(
  chunk_id uuid,
  chunk_content text
)
returns void
language plpgsql
security definer
as $$
begin
  -- This function will be called by the edge function after generating embedding
  -- It just updates the embedding column
  update knowledge_chunks
  set embedding = NULL -- Will be updated by edge function
  where id = chunk_id;
end;
$$;

-- Add trigger to set default empty embedding when inserting new chunks
create or replace function set_default_embedding()
returns trigger
language plpgsql
as $$
begin
  if NEW.embedding is null then
    NEW.embedding := array_fill(0, ARRAY[768])::vector(768);
  end if;
  return NEW;
end;
$$;

create trigger knowledge_chunks_default_embedding
  before insert on knowledge_chunks
  for each row
  execute function set_default_embedding();
