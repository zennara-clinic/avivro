# 🚀 Deployment Checklist - RAG Knowledge Base System

## Pre-Deployment

### 1. Environment Variables
- [ ] `.env` file created with all required variables
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (for Edge Functions)
- [ ] `OPENROUTER_API_KEY` set

### 2. Database Migrations
```bash
# Apply all migrations
supabase db push

# Or manually run in Supabase SQL Editor:
# - create_vector_search.sql
```

- [ ] pgvector extension enabled
- [ ] `knowledge_chunks` table created
- [ ] `match_knowledge_chunks()` function exists
- [ ] Vector index created

**Verify with SQL**:
```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'match_knowledge_chunks';

-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'knowledge_chunks';
```

### 3. Edge Functions Deployment

#### Deploy Chat Function
```bash
cd supabase/functions
supabase functions deploy chat --no-verify-jwt
```
- [ ] Chat function deployed
- [ ] No deployment errors

#### Deploy Process Knowledge Function
```bash
supabase functions deploy process-knowledge --no-verify-jwt
```
- [ ] Process-knowledge function deployed
- [ ] No deployment errors

#### Set Secrets
```bash
# Set OpenRouter API key as secret
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Verify secrets set
supabase secrets list
```
- [ ] OPENROUTER_API_KEY secret set
- [ ] Other required secrets configured

### 4. Test Edge Functions

#### Test Process Knowledge
```bash
# Create a test knowledge source first, then:
curl -X POST \
  https://your-project.supabase.co/functions/v1/process-knowledge \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "test-source-id"}'
```
- [ ] Function responds successfully
- [ ] Chunks created in database
- [ ] Embeddings generated

#### Test Chat Function
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/chat/agent-id \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What services do you offer?",
    "sessionId": "test-session"
  }'
```
- [ ] Chat responds
- [ ] Knowledge retrieved
- [ ] Strict enforcement working

## Post-Deployment Testing

### 1. Upload Knowledge
- [ ] Access Knowledge Manager in dashboard
- [ ] Upload test website URL
- [ ] Upload test document
- [ ] Add test text content
- [ ] Verify processing notifications appear
- [ ] Check "processed" status in table

### 2. Verify Database
```sql
-- Check knowledge sources
SELECT id, name, type, status, tokens_count 
FROM knowledge_sources 
WHERE agent_id = 'your-agent-id';

-- Check chunks created
SELECT 
  ks.name,
  COUNT(kc.id) as chunks,
  AVG(LENGTH(kc.content)) as avg_chunk_size
FROM knowledge_sources ks
LEFT JOIN knowledge_chunks kc ON kc.source_id = ks.id
WHERE ks.agent_id = 'your-agent-id'
GROUP BY ks.id, ks.name;

-- Check embeddings exist
SELECT COUNT(*) FROM knowledge_chunks 
WHERE embedding IS NOT NULL;
```

- [ ] Sources saved
- [ ] Chunks created (500 tokens each)
- [ ] Embeddings exist (not NULL)

### 3. Test Chatbot Behavior

#### Test In-Scope Questions (Should Answer)
- [ ] Ask question from uploaded knowledge
- [ ] Verify answer is accurate
- [ ] Check source citation [Source X]
- [ ] Confirm no generic AI response

#### Test Out-of-Scope Questions (Should Refuse)
- [ ] Ask unrelated question
- [ ] Verify exact refusal message:
  ```
  "I can't respond to that. This question is outside my knowledge base."
  ```
- [ ] Confirm no general AI capabilities listed

#### Test Edge Cases
- [ ] Empty knowledge base → Refuses all questions
- [ ] Partial match → Returns relevant info or refuses
- [ ] Multiple related chunks → Combines info with citations

### 4. Performance Check
- [ ] Chat response time < 3 seconds
- [ ] Knowledge processing completes in reasonable time
- [ ] No timeout errors
- [ ] Edge Function logs clean (no errors)

## Monitoring Setup

### 1. Edge Function Logs
```bash
# Monitor chat function
supabase functions logs chat --tail

# Monitor processing function
supabase functions logs process-knowledge --tail
```
- [ ] Logs accessible
- [ ] No recurring errors

### 2. Database Monitoring
- [ ] Check Supabase dashboard for slow queries
- [ ] Monitor vector search performance
- [ ] Track chunk count growth

### 3. Error Tracking
- [ ] Browser console clean (no JS errors)
- [ ] Network tab shows successful API calls
- [ ] Toast notifications working

## Optimization (Optional)

### 1. Tune Similarity Threshold
```typescript
// In chat/index.ts
match_threshold: 0.5  // Adjust based on results
```
- [ ] Test different thresholds (0.4 - 0.7)
- [ ] Find optimal balance (recall vs precision)

### 2. Adjust Chunk Size
```typescript
// In process-knowledge/index.ts
chunkText(content, 500)  // Try 300-800
```
- [ ] Test different sizes
- [ ] Optimize for your content type

### 3. Increase Context Window
```typescript
match_count: 8  // Try 10-15 for more context
```
- [ ] Test with more chunks
- [ ] Monitor token usage

## Troubleshooting

### Issue: Bot gives generic responses

**Solution**:
1. Check knowledge processed: `SELECT status FROM knowledge_sources`
2. Verify chunks exist: `SELECT COUNT(*) FROM knowledge_chunks`
3. Check embeddings: `SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NOT NULL`
4. Review Edge Function logs: `supabase functions logs chat --tail`
5. Test vector search directly in SQL:
```sql
SELECT content, similarity 
FROM match_knowledge_chunks(
  query_embedding := (SELECT embedding FROM knowledge_chunks LIMIT 1),
  p_agent_id := 'your-agent-id',
  match_threshold := 0.5,
  match_count := 5
);
```

### Issue: Processing fails

**Solution**:
1. Check OpenRouter API key: `supabase secrets list`
2. View processing logs: `supabase functions logs process-knowledge`
3. Verify content not empty: `SELECT LENGTH(content) FROM knowledge_sources`
4. Check rate limits on OpenRouter
5. Try reprocessing with smaller content

### Issue: No chunks retrieved

**Solution**:
1. Lower threshold: `match_threshold: 0.3`
2. Increase count: `match_count: 15`
3. Verify query embedding generated
4. Check if chunks have embeddings
5. Test with simpler questions first

## Final Verification

- [ ] ✅ All knowledge sources processed
- [ ] ✅ Chatbot refuses out-of-scope questions
- [ ] ✅ In-scope answers are accurate
- [ ] ✅ Citations working [Source X]
- [ ] ✅ No generic AI responses
- [ ] ✅ Performance acceptable
- [ ] ✅ Error handling graceful
- [ ] ✅ Logs clean

## 🎉 Deployment Complete!

Your RAG knowledge base system is now live and enforcing strict knowledge-only responses!

**Next Steps**:
1. Upload production knowledge
2. Monitor first user interactions
3. Gather feedback
4. Refine based on usage patterns
5. Iterate and improve

---

**Need help?** Check:
- `RAG_SETUP.md` for detailed architecture
- Edge Function logs for debugging
- Supabase dashboard for database insights
