import { getModelById } from '../config/llm-models';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterClient {
  private apiKey: string;
  private appName: string;
  private siteUrl: string;

  constructor(
    apiKey?: string,
    appName: string = 'Avivro',
    siteUrl: string = 'https://avivro.com'
  ) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.appName = appName;
    this.siteUrl = siteUrl;

    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in your environment.');
    }
  }

  async chat(
    modelId: string,
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
    } = {}
  ): Promise<{
    content: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    cost: number;
  }> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required. Please configure VITE_OPENROUTER_API_KEY.');
    }

    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found in configuration.`);
    }

    const requestBody: OpenRouterRequest = {
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
      top_p: options.top_p,
      frequency_penalty: options.frequency_penalty,
      presence_penalty: options.presence_penalty,
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      const content = data.choices[0].message.content;
      const usage = data.usage;

      // Calculate cost based on token usage
      const inputCost = (usage.prompt_tokens / 1000000) * model.pricing.input;
      const outputCost = (usage.completion_tokens / 1000000) * model.pricing.output;
      const totalCost = inputCost + outputCost;

      return {
        content,
        usage,
        cost: totalCost,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while calling OpenRouter API');
    }
  }

  async streamChat(
    modelId: string,
    messages: OpenRouterMessage[],
    onChunk: (chunk: string) => void,
    options: {
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required.');
    }

    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found in configuration.`);
    }

    const requestBody = {
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
      stream: true,
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors for streaming chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while streaming from OpenRouter API');
    }
  }

  getModelInfo(modelId: string) {
    return getModelById(modelId);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate embeddings for text using OpenRouter's embedding models
   * Uses text-embedding-3-small which outputs 768-dimensional vectors
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required for embeddings');
    }

    // Clean and truncate text if too long (max 8192 tokens ~ 32k chars)
    const cleanText = text.trim().slice(0, 32000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify({
          model: 'openai/text-embedding-3-small',
          input: cleanText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenRouter Embeddings API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid embedding response from OpenRouter');
      }

      return data.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while generating embeddings');
    }
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();

// Export helper function for easy usage
export async function generateChatResponse(
  modelId: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: OpenRouterMessage[] = [],
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<{
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
}> {
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  return openRouterClient.chat(modelId, messages, options);
}

export type { OpenRouterMessage, OpenRouterRequest, OpenRouterResponse };
