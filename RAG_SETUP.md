# RAG Knowledge Base Integration - Complete Setup Guide

## 🎯 Overview

Your chatbot now uses **RAG (Retrieval Augmented Generation)** to respond **ONLY** from your knowledge base. Generic AI responses are completely blocked.

## 📦 Tech Stack

- **Vector Database**: Supabase PostgreSQL + pgvector extension
- **Embeddings**: OpenRouter API (`text-embedding-3-small`)
- **LLM**: OpenRouter (any model you select)
- **Chunking**: Smart text splitting (500 tokens per chunk)
- **Similarity Search**: Cosine similarity with 0.5 threshold

## 🔧 Setup Steps

### 1. Environment Variables

Add these to your `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 2. Database Setup

The vector search function is already created in:
- `supabase/migrations/create_vector_search.sql`

This migration includes:
- ✅ pgvector extension
- ✅ `knowledge_chunks` table with embedding column
- ✅ Vector similarity index (IVFFlat)
- ✅ `match_knowledge_chunks()` RPC function

**To apply**: Run migrations in Supabase Dashboard or via CLI:
```bash
supabase db push
```

### 3. Deploy Edge Functions

Deploy both Edge Functions to Supabase:

```bash
# Deploy chat function
supabase functions deploy chat --no-verify-jwt

# Deploy knowledge processing function
supabase functions deploy process-knowledge --no-verify-jwt
```

**Set environment secrets**:
```bash
supabase secrets set OPENROUTER_API_KEY=your_key_here
```

### 4. Test Knowledge Upload

1. **Go to**: Dashboard → Knowledge Manager
2. **Add knowledge source**:
   - Website URL (crawls and extracts text)
   - Upload document (PDF, DOCX, TXT)
   - Paste text directly
3. **System automatically**:
   - Saves content to `knowledge_sources` table
   - Triggers `process-knowledge` Edge Function
   - Chunks content into ~500 token pieces
   - Generates embeddings via OpenRouter
   - Stores in `knowledge_chunks` table with vectors

## 🔍 How RAG Works

### User asks a question:

```
User: "What services do you offer?"
```

### 1. Generate Query Embedding
```typescript
// OpenRouter API call
const embedding = await generateEmbedding(userQuestion)
// Returns: [0.123, -0.456, 0.789, ...] (1536 dimensions)
```

### 2. Vector Similarity Search
```sql
SELECT content, metadata, similarity
FROM match_knowledge_chunks(
  query_embedding := [0.123, -0.456, ...],
  p_agent_id := 'agent-uuid',
  match_threshold := 0.5,
  match_count := 8
)
ORDER BY similarity DESC
```

### 3. Build Context
```
📚 YOUR COMPLETE KNOWLEDGE BASE:

[Source 1: Company Services]
We offer web development, mobile apps, and AI chatbots...

[Source 2: Pricing]
Our pricing starts at $500 for basic packages...
```

### 4. Strict System Prompt
```
🔒 KNOWLEDGE BASE - STRICT MODE ENABLED

⚠️ CRITICAL INSTRUCTIONS:
• You are a KNOWLEDGE BASE ASSISTANT, NOT a general AI
• Your ENTIRE knowledge consists ONLY of the information above
• NEVER use general knowledge or training data
• If answer is NOT in knowledge base, say:
  "I can't respond to that. This question is outside my knowledge base."
```

### 5. LLM Response
✅ **With knowledge**: Answers from retrieved chunks  
❌ **Without knowledge**: Refuses with exact message

## 🚨 Strict Enforcement Features

### What the Bot WON'T Do:
- ❌ Answer general questions not in knowledge base
- ❌ List generic AI capabilities
- ❌ Provide writing/scheduling assistance
- ❌ Use training data or external knowledge
- ❌ Make assumptions or guesses

### What the Bot WILL Do:
- ✅ Answer ONLY from uploaded knowledge
- ✅ Cite source numbers [Source 1], [Source 2]
- ✅ Refuse out-of-scope questions explicitly
- ✅ Stay strictly within knowledge boundaries

## 📊 Configuration Settings

### Vector Search Tuning

In `supabase/functions/chat/index.ts`:

```typescript
match_threshold: 0.5,  // Lower = more lenient (0.0-1.0)
match_count: 8          // Number of chunks to retrieve
```

**Recommendations**:
- **Strict matching**: 0.7-0.8 threshold
- **Lenient matching**: 0.4-0.6 threshold
- **More context**: Increase match_count to 10-15

### Chunk Size

In `supabase/functions/process-knowledge/index.ts`:

```typescript
const chunks = chunkText(content, 500) // 500 tokens per chunk
```

**Guidelines**:
- **Short answers**: 300-500 tokens
- **Detailed content**: 800-1200 tokens
- **Preserve context**: Use sentence boundaries

## 🔄 Reprocessing Knowledge

### When to Reprocess:
- Updated knowledge content
- Changed chunking strategy
- Embedding model changed

### How to Reprocess:
1. Go to Knowledge Manager
2. Click "View Details" on knowledge source
3. Edit content if needed
4. Click "Retrain Agent"
5. System automatically regenerates chunks and embeddings

## 🐛 Troubleshooting

### Bot still gives generic responses?

**Check**:
1. ✅ Knowledge sources uploaded?
2. ✅ Processing completed (status = "processed")?
3. ✅ Chunks created in database?
4. ✅ Edge Functions deployed?
5. ✅ OpenRouter API key set?

**SQL to verify chunks**:
```sql
SELECT 
  ks.name as source_name,
  COUNT(kc.id) as chunk_count,
  MAX(kc.created_at) as last_processed
FROM knowledge_sources ks
LEFT JOIN knowledge_chunks kc ON kc.source_id = ks.id
WHERE ks.agent_id = 'your-agent-id'
GROUP BY ks.id, ks.name;
```

### No knowledge retrieved?

**Adjust threshold**:
```typescript
match_threshold: 0.3  // More lenient (retrieves more)
```

**Check embedding generation**:
```bash
# View Edge Function logs
supabase functions logs process-knowledge
```

### Processing fails?

**Common issues**:
- Invalid OpenRouter API key
- Content too large (split into smaller sources)
- Empty or whitespace-only content
- Network timeouts (retry)

**Check logs**:
```bash
supabase functions logs process-knowledge --tail
```

## 📈 Best Practices

### 1. Organize Knowledge Sources
```
✅ Good:
- "Product Catalog" (all products)
- "FAQ - Technical" (tech questions)
- "FAQ - Billing" (billing questions)
- "Company Policies" (policies)

❌ Bad:
- "Random Notes.txt"
- "Copy of final FINAL v2.docx"
```

### 2. Quality Content
- Clear, well-structured text
- Proper headings and sections
- No excessive formatting
- Remove boilerplate/headers/footers

### 3. Test Queries
After uploading knowledge:
1. Ask in-scope questions → Should answer with citations
2. Ask out-of-scope questions → Should refuse
3. Verify accuracy and relevance

### 4. Monitor Performance
- Check conversation logs
- Review refused queries
- Update knowledge as needed
- Adjust threshold if too strict/lenient

## 🚀 Next Steps

1. **Upload your knowledge base** (websites, documents, FAQs)
2. **Wait for processing** (watch toast notifications)
3. **Test chatbot** with real questions
4. **Refine** threshold and content as needed
5. **Monitor** and iterate

## 🆘 Support

If issues persist:
1. Check Supabase Edge Function logs
2. Verify database migrations applied
3. Ensure all environment variables set
4. Review console errors in browser
5. Check network requests to Edge Functions

---

**Your chatbot is now a strict knowledge-base-only assistant!** 🎉

No more generic AI responses - only precise answers from YOUR data.
