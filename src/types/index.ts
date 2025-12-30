export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  personality: string;
  website: string;
  conversations: number;
  lastActive: string;
  createdAt: string;
  model: string;
  leadCapture: {
    enabled: boolean;
    collectName: boolean;
    collectEmail: boolean;
    collectPhone: boolean;
  };
  appearance: {
    primaryColor: string;
    logoUrl?: string;
    position: 'bottom-right' | 'bottom-left';
    bubbleText: string;
  };
}

export interface Conversation {
  id: string;
  agentId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  messages: Message[];
  status: 'active' | 'resolved' | 'lead';
  startedAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'positive' | 'negative';
}

export interface Correction {
  id: string;
  agentId: string;
  question: string;
  correctedAnswer: string;
  usageCount: number;
  enabled: boolean;
  createdAt: string;
}

export interface KnowledgeItem {
  id: string;
  agentId: string;
  type: 'webpage' | 'file' | 'correction';
  source: string;
  status: 'processing' | 'completed' | 'failed';
  wordCount?: number;
  lastUpdated: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    conversations: number | 'unlimited';
    agents: number | 'unlimited';
    models: string[];
  };
}
