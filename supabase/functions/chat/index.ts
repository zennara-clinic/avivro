import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// HELPER FUNCTIONS - ADVANCED FEATURES
// ============================================================================

// Cache helper using Deno KV (built-in) - lazy initialization
let kvInstance: Deno.Kv | null = null

async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    kvInstance = await Deno.openKv()
  }
  return kvInstance
}

async function getCachedResponse(agentId: string, message: string): Promise<string | null> {
  try {
    const kv = await getKv()
    const cacheKey = ['chat_cache', agentId, message.toLowerCase().trim()]
    const cached = await kv.get<{ response: string, timestamp: number }>(cacheKey)
    
    if (cached.value) {
      const ageMinutes = (Date.now() - cached.value.timestamp) / 1000 / 60
      // Cache valid for 60 minutes
      if (ageMinutes < 60) {
        console.log(`[CACHE] Hit for message: "${message.slice(0, 50)}..."`)
        return cached.value.response
      }
    }
    return null
  } catch (error) {
    console.error('[CACHE] Read error:', error)
    return null
  }
}

async function setCachedResponse(agentId: string, message: string, response: string) {
  try {
    const kv = await getKv()
    const cacheKey = ['chat_cache', agentId, message.toLowerCase().trim()]
    await kv.set(cacheKey, { response, timestamp: Date.now() }, { expireIn: 3600000 }) // 1 hour
    console.log(`[CACHE] Stored response for: "${message.slice(0, 50)}..."`)
  } catch (error) {
    console.error('[CACHE] Write error:', error)
  }
}

async function invalidateAgentCache(agentId: string) {
  // Called when knowledge base is updated
  console.log(`[CACHE] Invalidating cache for agent: ${agentId}`)
  // Note: Deno KV doesn't support prefix delete, cache will expire naturally
}

// Intent Detection
function detectIntent(message: string): 'pricing' | 'booking' | 'info' | 'support' | 'general' {
  const lower = message.toLowerCase()
  
  if (/\b(price|cost|how much|payment|fee|charge|₹|$)\b/i.test(lower)) {
    return 'pricing'
  }
  if (/\b(book|appointment|schedule|reserve|slot|available|timing|when)\b/i.test(lower)) {
    return 'booking'
  }
  if (/\b(help|issue|problem|error|not working|complaint|refund)\b/i.test(lower)) {
    return 'support'
  }
  if (/\b(what|which|how|where|tell me about|explain|describe)\b/i.test(lower)) {
    return 'info'
  }
  
  return 'general'
}

// Language Detection (simplified)
function detectLanguage(message: string): string {
  // Hindi detection
  if (/[\u0900-\u097F]/.test(message)) return 'hi'
  // Arabic detection
  if (/[\u0600-\u06FF]/.test(message)) return 'ar'
  // Chinese detection
  if (/[\u4E00-\u9FFF]/.test(message)) return 'zh'
  // Spanish common words
  if (/\b(hola|gracias|por favor|como|que)\b/i.test(message)) return 'es'
  
  return 'en' // Default to English
}

// Sentiment Analysis
function analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
  const lower = message.toLowerCase()
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'worst', 'hate', 'angry', 'frustrated', 'disappointed', 
    'useless', 'poor', 'horrible', 'fuck', 'shit', 'damn', 'hell', 'kill', 'die', 'fraud',
    'scam', 'liar', 'lie', 'stupid', 'idiot', 'dumb', 'trash', 'garbage', 'suck', 'pathetic',
    'disgust', 'annoying', 'irritat', 'worthless', 'waste', 'regret', 'never again', 'horrible',
    'worst', 'rude', 'unprofessional', 'incompetent', 'failure', 'hopeless', 'disaster'
  ]
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'love', 'happy', 'thanks', 'wonderful', 
    'perfect', 'awesome', 'fantastic', 'brilliant', 'outstanding', 'superb', 'terrific',
    'appreciate', 'grateful', 'helpful', 'kind', 'friendly', 'professional', 'best',
    'recommend', 'satisfied', 'pleased', 'delighted', 'impressed'
  ]
  
  let score = 0
  negativeWords.forEach(word => {
    if (lower.includes(word)) score -= 1
  })
  positiveWords.forEach(word => {
    if (lower.includes(word)) score += 1
  })
  
  if (score < 0) return 'negative'  // Changed from < -1 to < 0 for more sensitive detection
  if (score > 0) return 'positive'  // Changed from > 1 to > 0 for more sensitive detection
  return 'neutral'
}

// Context Compression
function compressContext(context: string, maxLength: number = 1500): string {
  if (context.length <= maxLength) return context
  
  // Smart truncation: keep beginning and end
  const keepStart = Math.floor(maxLength * 0.6)
  const keepEnd = Math.floor(maxLength * 0.4)
  
  return context.slice(0, keepStart) + '\n\n[...content summarized...]\n\n' + context.slice(-keepEnd)
}

// Response Quality Scorer
function scoreResponseQuality(response: string, context: string, message: string): number {
  let score = 100
  
  // Penalize if response is too short (< 10 words)
  const wordCount = response.split(/\s+/).length
  if (wordCount < 10) score -= 20
  
  // Penalize if response doesn't have bullets when it should
  if (wordCount > 20 && !response.includes('•')) score -= 15
  
  // Reward if response has bold formatting
  if (response.includes('**')) score += 10
  
  // Penalize generic responses
  if (/I don't have|I cannot|I'm not sure/i.test(response)) score -= 30
  
  // Reward if response references context keywords
  const contextWords = context.toLowerCase().split(/\s+/).slice(0, 50)
  const responseWords = response.toLowerCase().split(/\s+/)
  const overlap = contextWords.filter(word => word.length > 4 && responseWords.includes(word)).length
  score += Math.min(overlap * 3, 20)
  
  return Math.max(0, Math.min(100, score))
}

interface ChatRequest {
  message: string
  conversationId?: string
  sessionId: string
  leadInfo?: {
    name: string
    email: string
    phone: string
  } | null
  modelOverride?: string // For model comparison testing
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const agentId = url.pathname.split('/').pop()

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { message, conversationId, sessionId, leadInfo, modelOverride }: ChatRequest = await req.json()

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Message and sessionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // ============================================================================
    // FEATURE 1: Response Caching - Check cache first
    // ============================================================================
    const cachedResponse = await getCachedResponse(agentId!, message)
    if (cachedResponse) {
      // Still save user message for history
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', agentId)
        .eq('visitor_id', sessionId)
        .single()
      
      if (conv) {
        await supabase.from('messages').insert([
          { conversation_id: conv.id, role: 'user', content: message },
          { conversation_id: conv.id, role: 'assistant', content: cachedResponse }
        ])
      }
      
      return new Response(
        JSON.stringify({ 
          response: cachedResponse, 
          conversationId: conv?.id,
          cached: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================================
    // FEATURE 5: Intent Detection
    // ============================================================================
    const userIntent = detectIntent(message)
    console.log(`[INTENT] Detected intent: ${userIntent}`)

    // ============================================================================
    // FEATURE 8: Language Detection
    // ============================================================================
    const userLanguage = detectLanguage(message)
    console.log(`[LANGUAGE] Detected language: ${userLanguage}`)

    // ============================================================================
    // FEATURE 9: Sentiment Analysis
    // ============================================================================
    const userSentiment = analyzeSentiment(message)
    console.log(`[SENTIMENT] User sentiment: ${userSentiment}`)

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create conversation (service role = always works)
    let activeConversationId = conversationId
    if (!activeConversationId) {
      const conversationData: any = {
        agent_id: agentId,
        visitor_id: sessionId,
        status: 'active',
        source: 'widget',
        visitor_metadata: { started_at: new Date().toISOString() }
      }

      // Add lead info if provided
      if (leadInfo) {
        conversationData.visitor_name = leadInfo.name
        conversationData.visitor_email = leadInfo.email
        conversationData.visitor_phone = leadInfo.phone
        conversationData.is_lead = true
        conversationData.lead_captured_at = new Date().toISOString()
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (convError || !newConv) {
        console.error('Conversation creation error:', convError)
        throw new Error('Failed to create conversation')
      }
      activeConversationId = newConv.id

      // Create lead entry if leadInfo provided
      if (leadInfo) {
        await supabase
          .from('leads')
          .insert({
            agent_id: agentId,
            conversation_id: activeConversationId,
            name: leadInfo.name,
            email: leadInfo.email,
            phone: leadInfo.phone,
            status: 'new',
            source: 'widget',
          })
      }
    }

    // Save user message
    const { data: userMsg, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
        metadata: { timestamp: new Date().toISOString() }
      })
      .select()
      .single()

    if (userMsgError || !userMsg) {
      throw new Error('Failed to save user message')
    }

    // ============================================================================
    // STEP 1: Multi-strategy knowledge retrieval with PARALLEL PROCESSING
    // ============================================================================
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!
    
    let relevantContext: any[] = []
    let retrievalMethod = 'none'
    
    console.log(`[RAG] Starting PARALLEL knowledge retrieval for agent: ${agentId}`)
    
    // FEATURE 3 & 6: Parallel Processing + Fallback Chain Strategy
    // Run vector search and keyword search simultaneously
    const [vectorResult, keywordResult] = await Promise.allSettled([
      // Vector Search Promise
      (async () => {
        try {
          const { data: sources } = await supabase
            .from('knowledge_sources')
            .select('id')
            .eq('agent_id', agentId)
          
          if (!sources || sources.length === 0) return { chunks: [], method: 'none' }
          
          const sourceIds = sources.map((s: any) => s.id)
          
          const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://avivro.com',
              'X-Title': 'Avivro',
            },
            body: JSON.stringify({
              model: 'openai/text-embedding-3-small',
              input: message,
            })
          })

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json()
            const queryEmbedding = embeddingData.data[0].embedding

            const { data: chunks } = await supabase.rpc(
              'match_knowledge_chunks',
              {
                query_embedding: queryEmbedding,
                agent_sources: sourceIds,
                match_threshold: 0.4,
                match_count: 5
              }
            )

            if (chunks && chunks.length > 0) {
              console.log(`[RAG] Vector search found ${chunks.length} chunks`)
              return {
                chunks: chunks.map((c: any) => ({
                  content: c.content,
                  similarity: c.similarity,
                  metadata: c.metadata || {}
                })),
                method: 'vector'
              }
            }
          }
          return { chunks: [], method: 'none' }
        } catch (error) {
          console.error('[RAG] Vector search error:', error)
          return { chunks: [], method: 'none' }
        }
      })(),
      
      // Keyword Search Promise (runs in parallel)
      (async () => {
        try {
          const { data: sources } = await supabase
            .from('knowledge_sources')
            .select('id, content, name, type, metadata')
            .eq('agent_id', agentId)

          if (!sources || sources.length === 0) return { chunks: [], method: 'none' }
          
          const queryLower = message.toLowerCase()
          const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
          
          const scoredSources = sources.map(source => {
            const contentLower = (source.content || '').toLowerCase()
            let score = 0
            
            if (contentLower.includes(queryLower)) score += 1000
            
            queryWords.forEach(word => {
              const matches = contentLower.match(new RegExp(word, 'gi'))
              if (matches) score += matches.length * 50
            })
            
            if (source.name && source.name.toLowerCase().includes(queryLower)) score += 200
            
            return { source, score }
          })
          
          const topSources = scoredSources
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
          
          if (topSources.length > 0) {
            console.log(`[RAG] Keyword search found ${topSources.length} sources`)
            return {
              chunks: topSources.map(item => ({
                content: item.source.content,
                score: item.score,
                metadata: { 
                  source_name: item.source.name,
                  source_type: item.source.type,
                  ...item.source.metadata 
                }
              })),
              method: 'keyword'
            }
          }
          
          // Fallback: use all sources
          console.log('[RAG] Using all knowledge sources as fallback')
          return {
            chunks: sources.map(source => ({
              content: source.content,
              metadata: { 
                source_name: source.name,
                source_type: source.type,
                ...source.metadata 
              }
            })),
            method: 'all'
          }
        } catch (error) {
          console.error('[RAG] Keyword search error:', error)
          return { chunks: [], method: 'none' }
        }
      })()
    ])
    
    // Choose best result from parallel searches
    if (vectorResult.status === 'fulfilled' && vectorResult.value.chunks.length > 0) {
      relevantContext = vectorResult.value.chunks
      retrievalMethod = vectorResult.value.method
    } else if (keywordResult.status === 'fulfilled' && keywordResult.value.chunks.length > 0) {
      relevantContext = keywordResult.value.chunks
      retrievalMethod = keywordResult.value.method
    }

    
    console.log(`[RAG] Final context: ${relevantContext.length} items using ${retrievalMethod} method`)

    // STEP 3: Get conversation history (last 6 messages for context efficiency)
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: false })
      .limit(6)

    // STEP 4: Build comprehensive system prompt with context
    let systemPrompt = ''
    let contextText = '' // Define outside for quality scoring access

    if (relevantContext.length > 0) {
      // FEATURE 4: Smart Context Compression
      contextText = relevantContext
        .map((ctx, idx) => {
          const sourceName = ctx.metadata?.source_name || `Source ${idx + 1}`
          const similarity = ctx.similarity ? ` (relevance: ${(ctx.similarity * 100).toFixed(0)}%)` : ''
          const compressedContent = compressContext(ctx.content, 1500)
          return `### ${sourceName}${similarity}\n${compressedContent}`
        })
        .join('\n\n---\n\n')

      // FEATURE 5: Intent-Based Specialized Instructions
      const intentInstructions = {
        'pricing': '**PRICING QUERY**: Focus on exact prices, packages, and payment options. Always bold prices.',
        'booking': '**BOOKING QUERY**: Emphasize availability, booking steps, and contact info. Include clear CTAs.',
        'support': '**SUPPORT QUERY**: Be extra empathetic and helpful. Acknowledge the issue and provide solutions.',
        'info': '**INFO QUERY**: Provide comprehensive details. Use structured bullet points.',
        'general': ''
      }

      // FEATURE 8: Language Support Hint
      const languageHint = userLanguage !== 'en' 
        ? `\n\n**LANGUAGE**: User is communicating in ${userLanguage}. Respond in the same language if possible, or use English if knowledge base is in English.`
        : ''

      // FEATURE 9: Sentiment-Aware Tone Adjustment
      const sentimentTone = {
        'negative': '\n\n**USER SENTIMENT**: User seems frustrated/unhappy. Be EXTRA empathetic, apologetic, and solution-focused. Acknowledge their concern immediately.',
        'positive': '\n\n**USER SENTIMENT**: User is happy/satisfied. Match their positive energy. Be warm and enthusiastic.',
        'neutral': ''
      }

      systemPrompt = `You are ${agent.name}, an AI assistant.${agent.tone ? ` Your tone is ${agent.tone}.` : ''}

# ⚠️ ABSOLUTE RULES - MUST FOLLOW EVERY SINGLE TIME ⚠️
${agent.custom_instructions ? `
**CUSTOM INSTRUCTIONS (HIGHEST PRIORITY - FOLLOW EXACTLY):**
${agent.custom_instructions}

These custom instructions are MANDATORY. You MUST follow them in EVERY response without exception.
If there's any conflict between these instructions and other rules below, ALWAYS follow the custom instructions above.
` : ''}

${intentInstructions[userIntent]}${languageHint}${sentimentTone[userSentiment]}

# PRIMARY DIRECTIVE
Answer using ONLY the knowledge base below. This is your COMPLETE knowledge about the business.

# CRITICAL OUTPUT RULES
1. **"I DON'T KNOW" = COPY THIS EXACTLY** - If answer NOT in knowledge base, respond with EXACTLY this:
   "Sorry, I can't respond to that."
   DO NOT add anything else. NO explanations. NO alternatives. Just that single sentence.

2. **EXTREME BREVITY** - Default to 15-25 words. Only use 35-40 for complex multi-part answers.

3. **BULLET POINTS MANDATORY** - For 2+ items, ALWAYS use bullets (•)

4. **BOLD KEY TERMS** - Use **bold** for: product names, prices, services, key benefits

5. **NO FLUFF WORDS** - NEVER use: "Unfortunately", "I apologize", "I'm afraid", "I do not want to", "I cannot provide", "Without access to"

6. **DIRECT ANSWERS ONLY** - Get to the point immediately. No preambles.

7. **WARM BUT BRIEF** - Friendly tone, but keep it SHORT and PUNCHY

${agent.custom_instructions ? `
# ⚠️ REMINDER: FOLLOW YOUR CUSTOM INSTRUCTIONS ⚠️
Before responding, verify your answer follows ALL custom instructions above.
${agent.custom_instructions}
` : ''}

# FORMATTING RULES
✅ DO:
• Start with the key answer immediately
• Use • bullets for any list (2+ items)
• **Bold** all product names, prices, services, key terms
• Keep sentences short and punchy
• Add line breaks between sections
• End with helpful next step or question

❌ DON'T:
• Use paragraphs for lists
• Write long sentences
• Include generic filler ("we offer a wide range...")
• Use "and many more", "etc.", or vague terms
• Exceed 40 words EVER

# YOUR KNOWLEDGE BASE
${contextText}

# PERFECT EXAMPLES (Short & Punchy!)

Example 1 - "I Don't Know" (EXACT TEMPLATE):
❌ BAD: "I'm afraid I don't have any information about when jojo go in my knowledge base..."
✅ GOOD: "Sorry, I can't respond to that."

Example 2 - Service Listing (20-25 words):
"We offer:
• **Laser hair removal**
• **Fat loss injections**  
• **Botox & fillers**

**Book a consultation!**"

Example 3 - Pricing (15-20 words):
"**Hydra Facial** - ₹3,500 | **Laser Hair Removal** - ₹5,000/session | **Botox** - ₹8,000+

Packages available!"

Example 4 - Quick Answer (10-15 words):
"Yes! **Free consultations** available. Book online or call **+91-XXXXXXXXXX**."

# OUTPUT STRATEGY
1. Identify the core question
2. Extract exact answer from knowledge base
3. Format with bullets + bold
4. Keep under 40 words
5. End with helpful CTA or question

Now answer using this knowledge base ONLY.`
    } else {
      // NO knowledge base available
      systemPrompt = `You are ${agent.name}, an AI assistant.

# CRITICAL SITUATION
You have NO knowledge base loaded. You cannot answer any questions about this business.

# YOUR ONLY RESPONSE
For EVERY question, respond EXACTLY like this:
"I don't have information on that yet. Can I help with anything else?"

# RULES
- Maximum 15 words
- Warm and friendly tone
- Never use training data
- Never provide generic answers
- Never make assumptions`
    }
    
    console.log(`[RAG] System prompt built with ${relevantContext.length} context items`)

    // STEP 5: Build conversation messages
    const conversationMessages = [
      { role: 'system', content: systemPrompt }
    ]

    // Add history (excluding current message, reversed for chronological order)
    if (messageHistory && messageHistory.length > 0) {
      const history = messageHistory
        .filter((m: any) => m.content !== message)
        .reverse()
        .slice(-5)
      
      history.forEach((m: any) => {
        conversationMessages.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })
      })
    }

    // Add current user message
    conversationMessages.push({ role: 'user', content: message })

    // STEP 6: Call OpenRouter with optimized settings
    // Use modelOverride if provided (for model comparison testing), otherwise use agent's default
    const aiModel = modelOverride || agent.ai_model || 'anthropic/claude-3-haiku'
    console.log(`[MODEL] Using model: ${aiModel}${modelOverride ? ' (override)' : ''}`)
    // Lower temperature for more consistent, focused responses
    const temperature = agent.temperature !== undefined ? agent.temperature : 0.4
    // Enforce extreme brevity: 15-25 words = 25-40 tokens, max 60 for complex answers
    const maxTokens = agent.max_tokens || 60

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': supabaseUrl,
        'X-Title': 'Avivro',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: conversationMessages,
        temperature,
        max_tokens: maxTokens,
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      throw new Error(`OpenRouter API error: ${errorText}`)
    }

    const aiData = await aiResponse.json()
    let assistantMessage = aiData.choices[0].message.content

    // ============================================================================
    // FEATURE 7: Response Quality Scoring with Retry Logic
    // ============================================================================
    const qualityScore = scoreResponseQuality(assistantMessage, contextText || '', message)
    console.log(`[QUALITY] Response quality score: ${qualityScore}/100`)

    // If quality is too low, retry with adjusted prompt (one retry only)
    if (qualityScore < 50 && relevantContext.length > 0) {
      console.log('[QUALITY] Low quality detected, retrying with enhanced prompt...')
      
      const retryMessages = [
        { 
          role: 'system', 
          content: systemPrompt + '\n\n**CRITICAL**: Previous response was too generic. Be MORE SPECIFIC, use BULLETS, and BOLD key terms.'
        },
        ...conversationMessages.slice(1)
      ]

      const retryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': supabaseUrl,
          'X-Title': 'Avivro',
        },
        body: JSON.stringify({
          model: aiModel,
          messages: retryMessages,
          temperature: temperature * 0.8, // Lower temperature for retry
          max_tokens: maxTokens,
        })
      })

      if (retryResponse.ok) {
        const retryData = await retryResponse.json()
        const newResponse = retryData.choices[0].message.content
        const newScore = scoreResponseQuality(newResponse, contextText || '', message)
        
        if (newScore > qualityScore) {
          console.log(`[QUALITY] Retry improved quality: ${newScore}/100`)
          assistantMessage = newResponse
        }
      }
    }

    // STEP 7: Save assistant message
    const { data: assistantMsg, error: assistantError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: assistantMessage,
        metadata: {
          model: aiModel,
          tokens: aiData.usage?.total_tokens || 0,
          context_used: relevantContext.length > 0,
          quality_score: qualityScore,
          intent: userIntent,
          sentiment: userSentiment,
          language: userLanguage,
          retrieval_method: retrievalMethod
        }
      })
      .select()
      .single()

    if (assistantError || !assistantMsg) {
      throw new Error('Failed to save assistant message')
    }

    // ============================================================================
    // FEATURE 1: Cache successful high-quality responses
    // ============================================================================
    if (qualityScore >= 70) {
      await setCachedResponse(agentId!, message, assistantMessage)
    }

    // Return response
    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversationId: activeConversationId,
        messageId: assistantMsg.id,
        metadata: {
          quality_score: qualityScore,
          intent: userIntent,
          sentiment: userSentiment,
          retrieval_method: retrievalMethod
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process message', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
