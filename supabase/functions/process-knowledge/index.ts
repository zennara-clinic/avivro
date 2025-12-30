import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
  sourceId: string
}

/**
 * Split text into chunks with overlap for better context retention
 * Uses smart splitting on paragraph and sentence boundaries
 */
function chunkText(text: string, targetTokens: number = 800, overlapTokens: number = 150): string[] {
  const chunks: string[] = []
  
  // Clean and normalize text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  // Split by paragraphs first
  const paragraphs = cleanedText.split(/\n\n+/).filter(p => p.trim().length > 0)
  
  let currentChunk = ''
  let currentTokens = 0
  let previousChunkEnd = '' // For overlap
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]
    const paragraphTokens = estimateTokens(paragraph)
    
    // If single paragraph is very large, split by sentences
    if (paragraphTokens > targetTokens * 1.2) {
      // Save current chunk if exists
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        previousChunkEnd = getLastSentences(currentChunk, overlapTokens)
        currentChunk = ''
        currentTokens = 0
      }
      
      // Split large paragraph into sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [paragraph]
      
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence)
        
        // Start new chunk if current is full
        if (currentTokens + sentenceTokens > targetTokens && currentChunk) {
          chunks.push(currentChunk.trim())
          
          // Add overlap from previous chunk
          const overlapText = getLastSentences(currentChunk, overlapTokens)
          previousChunkEnd = overlapText
          currentChunk = overlapText ? overlapText + ' ' + sentence : sentence
          currentTokens = estimateTokens(currentChunk)
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence
          currentTokens += sentenceTokens
        }
      }
    } else {
      // Normal paragraph - can we fit it in current chunk?
      if (currentTokens + paragraphTokens > targetTokens && currentChunk) {
        chunks.push(currentChunk.trim())
        
        // Add overlap from previous chunk
        const overlapText = getLastSentences(currentChunk, overlapTokens)
        previousChunkEnd = overlapText
        currentChunk = overlapText ? overlapText + '\n\n' + paragraph : paragraph
        currentTokens = estimateTokens(currentChunk)
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
        currentTokens += paragraphTokens
      }
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  // Filter out chunks that are too small (less than 100 chars) unless it's the only chunk
  const filteredChunks = chunks.filter(c => c.length > 100 || chunks.length === 1)
  
  return filteredChunks.length > 0 ? filteredChunks : chunks
}

/**
 * Get the last few sentences from text for overlap
 */
function getLastSentences(text: string, targetTokens: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) || []
  if (sentences.length === 0) return ''
  
  let overlapText = ''
  let overlapTokens = 0
  
  // Work backwards from the end
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i]
    const sentenceTokens = estimateTokens(sentence)
    
    if (overlapTokens + sentenceTokens <= targetTokens) {
      overlapText = sentence + overlapText
      overlapTokens += sentenceTokens
    } else {
      break
    }
  }
  
  return overlapText.trim()
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Generate embedding using OpenRouter API
 * Uses OpenAI's text-embedding-3-small model which outputs 768-dimensional vectors
 */
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  // Clean and truncate text if too long (max 8192 tokens ~ 32k chars)
  const cleanText = text.trim().slice(0, 32000)
  
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://avivro.com',
      'X-Title': 'Avivro',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small', // Correct OpenRouter model format
      input: cleanText,
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Embedding generation failed: ${error}`)
  }

  const data = await response.json()
  
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Invalid embedding response from OpenRouter')
  }
  
  return data.data[0].embedding
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sourceId }: ProcessRequest = await req.json()

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Processing knowledge source:', sourceId)

    // Get the knowledge source
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      console.error('Source fetch error:', sourceError)
      return new Response(
        JSON.stringify({ error: 'Knowledge source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!source.content || source.content.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Knowledge source has no content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to processing
    await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('id', sourceId)

    console.log('Chunking content with smart overlap...')
    
    // Chunk the content with larger chunks and overlap for better context
    const chunks = chunkText(source.content, 800, 150)
    console.log(`Created ${chunks.length} chunks (target: 800 tokens, overlap: 150 tokens)`)

    // Delete existing chunks for this source (if reprocessing)
    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('source_id', sourceId)

    // Process each chunk: generate embedding and store
    const chunkData = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`)
      
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk, openrouterKey)
        
        chunkData.push({
          source_id: sourceId,
          content: chunk,
          chunk_index: i,
          embedding: embedding,
          metadata: {
            source_name: source.name,
            source_type: source.type,
            source_url: source.url || null,
            chunk_length: chunk.length,
            estimated_tokens: estimateTokens(chunk),
            total_chunks: chunks.length,
            agent_id: source.agent_id,
          }
        })
      } catch (embeddingError: any) {
        console.error(`Failed to generate embedding for chunk ${i}:`, embeddingError)
        // Continue with other chunks even if one fails
      }
    }

    if (chunkData.length === 0) {
      console.error('No chunks generated')
      return new Response(
        JSON.stringify({ error: 'Failed to generate any embeddings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Storing ${chunkData.length} chunks in database...`)

    // Insert all chunks
    const { error: insertError } = await supabase
      .from('knowledge_chunks')
      .insert(chunkData)

    if (insertError) {
      console.error('Chunk insert error:', insertError)
      throw insertError
    }

    // Update source status to completed
    await supabase
      .from('knowledge_sources')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', sourceId)

    console.log('Processing complete!')

    return new Response(
      JSON.stringify({
        success: true,
        sourceId,
        chunksCreated: chunkData.length,
        message: `Successfully processed ${chunkData.length} chunks`,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Process knowledge error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process knowledge source', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
