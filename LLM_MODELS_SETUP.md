# OpenRouter LLM Models Integration

## Overview

Your Avivro application now supports **20 budget-friendly LLM models** from OpenRouter, all priced under $1-2 per million tokens. Users can select from these models when creating agents or publishing chatbots.

## Models Included

### Ultra Budget (FREE)
1. **Llama 3.2 3B Instruct (Free)** - Meta
2. **Llama 3.1 8B Instruct (Free)** - Meta  
3. **Gemma 2 9B IT (Free)** - Google
4. **Phi-3 Mini 128K (Free)** - Microsoft
5. **Qwen 2 7B Instruct (Free)** - Alibaba

### Budget ($0.05-$0.30/M)
6. **Llama 3.1 8B Instruct** - Meta
7. **Llama 3.2 11B Vision** - Meta (with vision support)
8. **Gemma 2 9B IT** - Google
9. **Mistral 7B Instruct** - Mistral AI
10. **DeepSeek Chat** - DeepSeek (excellent for coding)

### Balanced ($0.30-$1.50/M)
11. **Llama 3.1 70B Instruct** - Meta
12. **Gemini 1.5 Flash** - Google (1M context window!)
13. **Mistral Nemo** - Mistral AI
14. **Qwen 2.5 72B Instruct** - Alibaba
15. **Claude 3 Haiku** - Anthropic
16. **Llama 3.1 Sonar Small** - Perplexity
17. **GPT-3.5 Turbo** - OpenAI
18. **Command R** - Cohere
19. **Grok Beta** - xAI
20. **Nemotron 70B Instruct** - NVIDIA

## Setup Instructions

### 1. Get OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key

### 2. Configure Environment

Add your OpenRouter API key to `.env`:

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### 3. That's It!

The integration is ready to use. The pricing is handled automatically through your billing plans - **users never see individual model costs**.

## User Experience

### Agent Creation Wizard
- **3-step process**: Name & Tone → AI Model → Knowledge Source
- **Model filters**: Recommended, Free Only, All Models
- **Search**: Users can search by model name, provider, or description
- **Clean UI**: No pricing shown to users (included in your plans)
- **Badges**: "Top" badge for recommended models
- **Details**: Model name, provider, description, and key strengths

### Publish/Deploy Page
- **Dropdown selector** with search functionality
- **Filter options**: Recommended, Free Only, All Models
- **Model cards** showing name, provider, and strengths
- **No pricing displayed** - transparent to end users

## Pricing (Internal Use Only)

Pricing is stored in the backend configuration for:
- **Cost tracking** - Monitor your AI costs
- **Usage analytics** - Understand which models are most expensive
- **Budget planning** - Plan your infrastructure costs

**Users never see these costs** - they're included in your subscription plans.

## Features

### For Users
✅ 20 high-quality AI models to choose from  
✅ 5 completely FREE models  
✅ Easy filtering (Recommended/Free/All)  
✅ Search by name, provider, or capability  
✅ Clear model descriptions and strengths  
✅ "Top" badges for best models  

### For You (Admin)
✅ Internal cost tracking per model  
✅ Token usage monitoring  
✅ Cost calculations for analytics  
✅ Easy to add/remove models  
✅ Centralized configuration  

## Files Modified

1. **`src/config/llm-models.ts`** - Model definitions and pricing
2. **`src/lib/openrouter.ts`** - API client for OpenRouter
3. **`src/components/AgentCreationWizard.tsx`** - Added model selection step
4. **`src/pages/dashboard/Publish.tsx`** - Enhanced model selector
5. **`.env.example`** - Added OpenRouter API key template

## API Usage

The OpenRouter client is available throughout your app:

```typescript
import { openRouterClient, generateChatResponse } from '@/lib/openrouter';

// Simple usage
const response = await generateChatResponse(
  'meta-llama/llama-3.1-8b-instruct',
  'You are a helpful assistant',
  'Hello, how are you?'
);

// Advanced usage with streaming
await openRouterClient.streamChat(
  'google/gemini-flash-1.5',
  messages,
  (chunk) => console.log(chunk),
  { temperature: 0.7, max_tokens: 2000 }
);
```

## Cost Tracking

Use the built-in cost calculation:

```typescript
import { calculateCost } from '@/config/llm-models';

const cost = calculateCost(
  'meta-llama/llama-3.1-8b-instruct',
  1000,  // input tokens
  500    // output tokens
);
// Returns cost in USD (for internal tracking)
```

## Adding More Models

Edit `src/config/llm-models.ts`:

```typescript
{
  id: 'provider/model-name',
  name: 'Model Display Name',
  provider: 'Provider Name',
  description: 'What this model is good for',
  pricing: { input: 0.05, output: 0.15 },
  contextWindow: 128000,
  recommended: true,
  category: 'budget',
  strengths: ['Fast', 'Accurate', 'Multilingual']
}
```

## Support

- **OpenRouter Docs**: https://openrouter.ai/docs
- **Model Pricing**: Pricing is for internal tracking only
- **API Status**: Check openrouter.ai/status

---

**Note**: All pricing information is kept private for your cost tracking. Users only see model names, providers, and capabilities - making it a seamless experience included in your subscription plans.
