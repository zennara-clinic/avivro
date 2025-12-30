export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  pricing: {
    input: number;  // per million tokens
    output: number; // per million tokens
  };
  contextWindow: number;
  recommended: boolean;
  category: 'ultra-budget' | 'budget' | 'balanced';
  strengths: string[];
}

export const OPENROUTER_MODELS: LLMModel[] = [
  // DEFAULT - Claude 3 Haiku (Best for Knowledge Base)
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model, excellent for chat and knowledge base',
    pricing: { input: 0.25, output: 1.25 },
    contextWindow: 200000,
    recommended: true,
    category: 'balanced',
    strengths: ['Anthropic quality', 'Very fast', '200K context', 'Best for knowledge base']
  },
  // Alternative Premium Options
  {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: 'Fast Google model with massive context and vision support',
    pricing: { input: 0.075, output: 0.30 },
    contextWindow: 1000000,
    recommended: true,
    category: 'balanced',
    strengths: ['Massive 1M context', 'Vision support', 'Very fast', 'Google quality']
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: 'Meta',
    description: 'Powerful model with strong reasoning capabilities',
    pricing: { input: 0.35, output: 0.40 },
    contextWindow: 131072,
    recommended: true,
    category: 'balanced',
    strengths: ['Strong reasoning', '131K context', 'Balanced cost', 'Reliable']
  },
  {
    id: 'mistralai/mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'Mistral AI',
    description: 'Latest Mistral model with enhanced capabilities',
    pricing: { input: 0.13, output: 0.13 },
    contextWindow: 128000,
    recommended: true,
    category: 'balanced',
    strengths: ['Latest technology', '128K context', 'Function calling', 'Very efficient']
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    description: 'Extremely affordable with excellent coding capabilities',
    pricing: { input: 0.14, output: 0.28 },
    contextWindow: 64000,
    recommended: true,
    category: 'budget',
    strengths: ['Excellent coding', 'Very cheap', '64K context', 'Fast responses']
  }
];

export const getModelById = (id: string): LLMModel | undefined => {
  return OPENROUTER_MODELS.find(model => model.id === id);
};

export const getModelsByCategory = (category: LLMModel['category']): LLMModel[] => {
  return OPENROUTER_MODELS.filter(model => model.category === category);
};

export const getRecommendedModels = (): LLMModel[] => {
  return OPENROUTER_MODELS.filter(model => model.recommended);
};

export const getFreeModels = (): LLMModel[] => {
  return OPENROUTER_MODELS.filter(model => model.pricing.input === 0 && model.pricing.output === 0);
};

export const getModelsByPriceRange = (maxInput: number, maxOutput: number): LLMModel[] => {
  return OPENROUTER_MODELS.filter(
    model => model.pricing.input <= maxInput && model.pricing.output <= maxOutput
  );
};

export const calculateCost = (modelId: string, inputTokens: number, outputTokens: number): number => {
  const model = getModelById(modelId);
  if (!model) return 0;
  
  const inputCost = (inputTokens / 1000000) * model.pricing.input;
  const outputCost = (outputTokens / 1000000) * model.pricing.output;
  
  return inputCost + outputCost;
};
