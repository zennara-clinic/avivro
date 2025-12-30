import { processChatMessage } from '../../src/api/chat.js';

/**
 * Express route handler for chat messages
 * POST /api/chat/:agentId
 */
export async function handleChatMessage(req, res) {
  try {
    const { agentId } = req.params;
    const { message, conversationId, sessionId } = req.body;

    // Validate request
    if (!agentId || !message || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['agentId', 'message', 'sessionId'],
      });
    }

    // Process the chat message
    const response = await processChatMessage(agentId, {
      message,
      conversationId,
      sessionId,
    });

    // Return successful response
    res.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return error response
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

/**
 * Health check endpoint
 * GET /api/health
 */
export function healthCheck(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Avivro Chat API',
  });
}
