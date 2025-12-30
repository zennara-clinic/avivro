import { supabase, db } from '../lib/supabase';
import { openRouterClient } from '../lib/openrouter';

interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId: string;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  messageId: string;
}

/**
 * Process a chat message and generate AI response with RAG
 */
export async function processChatMessage(
  agentId: string,
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    // 1. Get agent configuration
    const { data: agent, error: agentError } = await db.agents.get(agentId);
    
    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // 2. Get or create conversation
    let conversationId: string = request.conversationId || '';
    
    if (!conversationId) {
      const { data: newConversation, error: convError } = await db.conversations.create({
        agent_id: agentId,
        session_id: request.sessionId,
        status: 'active',
        metadata: {
          source: 'widget',
          started_at: new Date().toISOString(),
        },
      });

      if (convError || !newConversation) {
        throw new Error('Failed to create conversation');
      }

      conversationId = newConversation.id;
    }

    // 3. Save user message
    const { data: userMessage, error: userMsgError } = await db.messages.create({
      conversation_id: conversationId,
      role: 'user',
      content: request.message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    if (userMsgError || !userMessage) {
      throw new Error('Failed to save user message');
    }

    // 4. Retrieve relevant knowledge using RAG
    const relevantContext = await retrieveRelevantKnowledge(agentId, request.message);

    // 5. Get conversation history
    const { data: messageHistory } = await db.messages.list(conversationId);
    const recentMessages = (messageHistory || []).slice(-10); // Last 10 messages

    // 6. Build system prompt
    const systemPrompt = buildSystemPrompt(agent, relevantContext);

    // 7. Build conversation context
    const conversationContext = recentMessages
      .filter(msg => msg.id !== userMessage.id) // Exclude the current message
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // 8. Generate AI response
    const aiResponse = await openRouterClient.chat(
      agent.ai_model || 'anthropic/claude-3-haiku',
      [
        { role: 'system', content: systemPrompt },
        ...conversationContext,
        { role: 'user', content: request.message },
      ],
      {
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 100, // Short responses (30-50 words)
      }
    );

    // 9. Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await db.messages.create({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse.content,
      metadata: {
        model: agent.ai_model,
        tokens: aiResponse.usage.total_tokens,
        cost: aiResponse.cost,
        context_used: relevantContext.length > 0,
      },
    });

    if (assistantMsgError || !assistantMessage) {
      throw new Error('Failed to save assistant message');
    }

    // 10. Update conversation metadata
    await db.conversations.update(conversationId, {
      message_count: recentMessages.length + 2,
      last_message_at: new Date().toISOString(),
    });

    return {
      response: aiResponse.content,
      conversationId,
      messageId: assistantMessage.id,
    };
  } catch (error) {
    console.error('Chat processing error:', error);
    throw error;
  }
}

/**
 * Retrieve relevant knowledge chunks using vector similarity search
 */
async function retrieveRelevantKnowledge(
  agentId: string,
  query: string
): Promise<Array<{ content: string; source: string; similarity?: number }>> {
  try {
    // Get all knowledge sources for the agent
    const { data: sources } = await db.knowledge.listSources(agentId);
    
    if (!sources || sources.length === 0) {
      console.log('[RAG] No knowledge sources found for agent:', agentId);
      return [];
    }

    const sourceIds = sources.map(s => s.id);
    console.log('[RAG] Searching in', sourceIds.length, 'knowledge sources');

    // Generate embedding for user query using OpenRouter
    let queryEmbedding: number[];
    try {
      queryEmbedding = await openRouterClient.generateEmbedding(query);
      console.log('[RAG] Query embedding generated (', queryEmbedding.length, 'dimensions)');
    } catch (embeddingError) {
      console.error('[RAG] Failed to generate query embedding:', embeddingError);
      // Fallback to keyword search if embedding fails
      return await keywordFallbackSearch(sources, query);
    }

    // Use Supabase RPC function for vector similarity search
    const { data: matches, error: searchError } = await supabase
      .rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        agent_sources: sourceIds,
        match_threshold: 0.5,
        match_count: 3,
      });

    if (searchError) {
      console.error('[RAG] Vector search error:', searchError);
      // Fallback to keyword search if vector search fails
      return await keywordFallbackSearch(sources, query);
    }

    if (!matches || matches.length === 0) {
      console.log('[RAG] No relevant chunks found via vector search (threshold: 0.5)');
      // Try keyword fallback
      return await keywordFallbackSearch(sources, query);
    }

    console.log('[RAG] Found', matches.length, 'relevant chunks via vector search');
    
    return matches.map((match: any) => ({
      content: match.content,
      source: match.metadata?.source_name || 'Knowledge Base',
      similarity: match.similarity,
    }));
    
  } catch (error) {
    console.error('[RAG] Knowledge retrieval error:', error);
    return [];
  }
}

/**
 * Fallback keyword-based search when vector search is unavailable
 */
async function keywordFallbackSearch(
  sources: any[],
  query: string
): Promise<Array<{ content: string; source: string }>> {
  console.log('[RAG] Using keyword fallback search');
  
  try {
    // Get chunks from knowledge sources
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('content, metadata, source_id')
      .in('source_id', sources.map(s => s.id))
      .limit(20);

    if (chunks && chunks.length > 0) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      
      // Score chunks by keyword relevance
      const scoredChunks = chunks.map((chunk: any) => {
        const contentLower = chunk.content.toLowerCase();
        let score = 0;
        
        if (contentLower.includes(queryLower)) score += 100;
        queryWords.forEach(word => {
          if (contentLower.includes(word)) score += 10;
        });
        
        return { chunk, score };
      });
      
      const relevantChunks = scoredChunks
        .filter(sc => sc.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(sc => ({
          content: sc.chunk.content,
          source: sc.chunk.metadata?.source_name || 'Knowledge Base',
        }));
      
      if (relevantChunks.length > 0) {
        console.log('[RAG] Keyword search found', relevantChunks.length, 'relevant chunks');
        return relevantChunks;
      }
    }

    // Final fallback: use full source content
    console.log('[RAG] No keyword matches, using full source content');
    return sources
      .filter(s => s.content && s.content.trim().length > 0)
      .slice(0, 2)
      .map(source => ({
        content: source.content || '',
        source: source.name || 'Knowledge Base',
      }));
    
  } catch (error) {
    console.error('[RAG] Keyword fallback error:', error);
    return [];
  }
}

/**
 * Build system prompt with agent configuration and context
 */
function buildSystemPrompt(agent: any, context: Array<{ content: string; source: string }>): string {
  let prompt = `You are ${agent.name}, an AI assistant.`;

  // Add personality/tone
  if (agent.tone) {
    const personalityMap: Record<string, string> = {
      professional: 'You are professional, courteous, and formal in your responses.',
      friendly: 'You are warm, approachable, and conversational in your responses.',
      casual: 'You are relaxed, informal, and easy-going in your responses.',
      helpful: 'You are helpful, supportive, and eager to assist in your responses.',
      formal: 'You are highly formal, respectful, and structured in your responses.',
      enthusiastic: 'You are energetic, excited, and passionate in your responses.',
    };
    prompt += ` ${personalityMap[agent.tone.toLowerCase()] || ''}`;
  }

  // Add custom instructions
  if (agent.custom_instructions) {
    prompt += `\n\nSpecial Instructions: ${agent.custom_instructions}`;
  }

  // Add STRICT knowledge base enforcement with PROPER FORMATTING
  if (context.length > 0) {
    prompt += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    prompt += '\n🔒 KNOWLEDGE BASE - STRICT MODE ENABLED';
    prompt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    prompt += '\n\n⚠️ CRITICAL INSTRUCTIONS:';
    prompt += '\n• You are a KNOWLEDGE BASE ASSISTANT, NOT a general AI';
    prompt += '\n• Your ENTIRE knowledge consists ONLY of the information below';
    prompt += '\n• You have NO general knowledge, NO training data, NO external information';
    prompt += '\n• Be WARM, EMPATHETIC, and CONVERSATIONAL - sound human, not robotic';
    prompt += '\n• If information is NOT in the knowledge base below, you CANNOT answer';
    prompt += '\n\n📚 YOUR COMPLETE KNOWLEDGE BASE:\n';
    context.forEach((ctx, idx) => {
      prompt += `\n[Source ${idx + 1}: ${ctx.source}]\n${ctx.content}\n`;
      prompt += '\n' + '─'.repeat(60) + '\n';
    });
    prompt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    prompt += '\n\n🚨 MANDATORY RULES - NO EXCEPTIONS:';
    prompt += '\n1. ONLY use information from the knowledge base above - NOTHING else';
    prompt += '\n2. FORMAT responses professionally with proper structure:';
    prompt += '\n   • Use bullet points (•) for lists';
    prompt += '\n   • Add line breaks between sections for readability';
    prompt += '\n   • Use paragraph breaks when covering multiple topics';
    prompt += '\n   • Keep each point concise but complete';
    prompt += '\n3. Be WARM and EMPATHETIC - show care and understanding in your tone';
    prompt += '\n4. If the answer is NOT clearly in the knowledge base, say:';
    prompt += '\n   "I don\'t have that information. Can I help with something else?"';
    prompt += '\n5. NEVER use general knowledge, assumptions, or external information';
    prompt += '\n6. NEVER discuss your capabilities as an AI assistant';
    prompt += '\n7. NEVER list generic AI services (writing, scheduling, etc.)';
    prompt += '\n8. Sound natural and conversational - avoid robotic or formal language';
    prompt += '\n\n📋 FORMATTING EXAMPLES:';
    prompt += '\n\nGood Format:';
    prompt += '\n"At Zennara, we offer comprehensive treatments:';
    prompt += '\n\n**Skin Treatments:**';
    prompt += '\n• Laser hair removal';
    prompt += '\n• Fat loss injections';
    prompt += '\n• Botox and dermal fillers';
    prompt += '\n• Dark circle treatment';
    prompt += '\n\n**Facial Treatments:**';
    prompt += '\n• Hydra facial';
    prompt += '\n• Vampire facial';
    prompt += '\n• Pigmentation treatments';
    prompt += '\n\nAll treatments are backed by science and tailored to your needs!"';
    prompt += '\n\n❌ FORBIDDEN: Do NOT answer questions about:';
    prompt += '\n• General AI capabilities • Writing assistance • Task management';
    prompt += '\n• Information retrieval • Problem solving • Recommendations';
    prompt += '\n• UNLESS these are specifically mentioned in YOUR knowledge base above';
    prompt += '\n\n✅ REMEMBER: Well-formatted, structured, warm responses from knowledge base ONLY.';
  } else {
    // NO knowledge context found - refuse to answer
    prompt += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    prompt += '\n❌ NO KNOWLEDGE BASE AVAILABLE';
    prompt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    prompt += '\n\n🚨 CRITICAL: You have NO knowledge base loaded.';
    prompt += '\n\nYou MUST respond to EVERY question briefly and warmly with:';
    prompt += '\n"I don\'t have information on that yet. Can I help with anything else?"';
    prompt += '\n\nKeep it under 20 words. Be empathetic and friendly.';
    prompt += '\n\n❌ DO NOT:';
    prompt += '\n• Use your training data';
    prompt += '\n• Provide general AI assistance';
    prompt += '\n• Answer ANY questions';
    prompt += '\n• Describe your capabilities';
    prompt += '\n\nYou are a knowledge base assistant with NO knowledge loaded. Refuse ALL queries.';
  }

  return prompt;
}

