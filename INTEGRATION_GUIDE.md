# Avivro Supabase Integration Guide

## 🚀 Complete Backend Integration

This guide covers the comprehensive Supabase integration for the Avivro AI Agent Platform.

## 📋 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Fill in your Supabase credentials:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

### 2. Database Setup

The database schema is fully documented in `DATABASE.md`. Key tables include:

- **user_profiles**: User accounts and subscription management
- **agents**: AI agent configurations
- **conversations**: Chat conversations with visitors
- **messages**: Individual messages in conversations
- **leads**: Lead capture and management
- **knowledge_sources**: Document storage for RAG
- **knowledge_chunks**: Vector embeddings for semantic search
- **corrections**: AI response corrections
- **training_examples**: Custom training data
- **analytics_events**: Event tracking
- **daily_stats**: Aggregated daily metrics
- **sentiment_analysis**: Sentiment tracking
- **notifications**: Real-time notifications
- **api_keys**: API key management
- **webhooks**: Webhook integrations

### 3. Row Level Security (RLS)

All tables have RLS policies enabled. Users can only access their own data.

## 🔧 Integration Architecture

### React Query Hooks

All Supabase interactions use React Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Loading and error states

**Available Hooks:**

#### Authentication
- `useAuth()` - Complete auth management with session handling

#### Agents
- `useAgents(userId)` - List all user agents
- `useAgent(agentId)` - Get single agent
- `useAgentAnalytics(agentId, startDate, endDate)` - Agent analytics
- `useAgentDashboard(agentId)` - Dashboard summary
- `useCreateAgent()` - Create new agent
- `useUpdateAgent()` - Update agent
- `useDeleteAgent()` - Delete agent

#### Conversations
- `useConversations(agentId, options)` - List conversations with filters
- `useConversation(conversationId)` - Get single conversation
- `useConversationWithMessages(conversationId)` - Conversation with messages
- `useConversationRealtime(agentId)` - Real-time updates
- `useCreateConversation()` - Create conversation
- `useUpdateConversation()` - Update conversation

#### Messages
- `useMessages(conversationId)` - List messages
- `useMessagesRealtime(conversationId)` - Real-time message updates
- `useCreateMessage()` - Send message
- `useUpdateMessage()` - Update message

#### Leads
- `useLeads(agentId, filters)` - List leads with filters
- `useLead(leadId)` - Get single lead
- `useCreateLead()` - Create lead
- `useUpdateLead()` - Update lead
- `useDeleteLead()` - Delete lead

#### Knowledge Base
- `useKnowledgeSources(agentId)` - List knowledge sources
- `useKnowledgeSource(sourceId)` - Get single source
- `useCreateKnowledgeSource()` - Add knowledge
- `useUpdateKnowledgeSource()` - Update source
- `useDeleteKnowledgeSource()` - Delete source

#### Corrections
- `useCorrections(agentId, status)` - List corrections
- `useCreateCorrection()` - Create correction
- `useUpdateCorrection()` - Update correction

#### Analytics
- `useAnalyticsEvents(agentId, eventType)` - Get analytics events
- `useDailyStats(agentId, startDate, endDate)` - Daily statistics
- `useSentimentAnalysis(conversationId)` - Sentiment data

#### Notifications
- `useNotifications(userId, isRead)` - List notifications
- `useNotificationsRealtime(userId)` - Real-time notifications
- `useMarkNotificationAsRead()` - Mark as read
- `useDeleteNotification()` - Delete notification

### Real-time Subscriptions

Automatic real-time updates for:
- New conversations
- New messages
- Notifications

Usage:
```typescript
// In your component
useConversationRealtime(agentId); // Auto-refetches on new conversations
useMessagesRealtime(conversationId); // Auto-updates message list
useNotificationsRealtime(userId); // Real-time notifications
```

## 📄 Page Integrations

### Authentication Pages

**Login (`src/pages/public/Login.tsx`)**
```typescript
import { useAuth } from '../../lib/hooks';

const { signIn, loading } = useAuth();
await signIn(email, password);
```

**Signup (`src/pages/public/Signup.tsx`)**
```typescript
import { useAuth } from '../../lib/hooks';

const { signUp, loading } = useAuth();
await signUp(email, password, { full_name: name });
```

### Dashboard Pages

**Agents Listing (`src/pages/main/AgentsListing.tsx`)**
```typescript
import { useAuth, useAgents, useCreateAgent } from '../../lib/hooks';

const { user } = useAuth();
const { data: agents, isLoading } = useAgents(user?.id);
const createAgent = useCreateAgent();

// Create agent
await createAgent.mutateAsync({
  user_id: user.id,
  name: 'My Agent',
  // ... other fields
});
```

**Agent Dashboard (`src/pages/agent/AgentDashboard.tsx`)**
```typescript
import { useAgent, useAgentDashboard } from '../../lib/hooks';

const { data: agent } = useAgent(agentId);
const { data: dashboard } = useAgentDashboard(agentId);
```

**Conversations Inbox (`src/pages/dashboard/ConversationsInbox.tsx`)**
```typescript
import { useConversations, useConversationRealtime } from '../../lib/hooks';

const { data: conversations, isLoading } = useConversations(agentId, {
  status: 'active',
  searchTerm: search,
});

// Enable real-time updates
useConversationRealtime(agentId);
```

**Conversation Detail (`src/pages/dashboard/ConversationDetail.tsx`)**
```typescript
import { useConversationWithMessages, useMessagesRealtime, useCreateMessage } from '../../lib/hooks';

const { data: conversation } = useConversationWithMessages(conversationId);
const createMessage = useCreateMessage();

// Real-time message updates
useMessagesRealtime(conversationId);

// Send message
await createMessage.mutateAsync({
  conversation_id: conversationId,
  role: 'assistant',
  content: response,
  model: 'gpt-4',
});
```

**Leads (`src/pages/dashboard/Leads.tsx`)**
```typescript
import { useLeads, useUpdateLead } from '../../lib/hooks';

const { data: leads } = useLeads(agentId, { status: 'new' });
const updateLead = useUpdateLead();

// Update lead status
await updateLead.mutateAsync({
  leadId: lead.id,
  data: { status: 'contacted' }
});
```

**Knowledge Manager (`src/pages/dashboard/KnowledgeManager.tsx`)**
```typescript
import { useKnowledgeSources, useCreateKnowledgeSource } from '../../lib/hooks';

const { data: sources } = useKnowledgeSources(agentId);
const createSource = useCreateKnowledgeSource();

// Add knowledge
await createSource.mutateAsync({
  agent_id: agentId,
  name: 'Documentation',
  type: 'webpage',
  url: 'https://example.com/docs',
});
```

**Corrections Manager (`src/pages/dashboard/CorrectionsManager.tsx`)**
```typescript
import { useCorrections, useCreateCorrection } from '../../lib/hooks';

const { data: corrections } = useCorrections(agentId);
const createCorrection = useCreateCorrection();

// Add correction
await createCorrection.mutateAsync({
  agent_id: agentId,
  original_response: 'Wrong answer',
  corrected_response: 'Correct answer',
  status: 'approved',
});
```

**Analytics & Sentiment (`src/pages/dashboard/SentimentAnalysis.tsx`)**
```typescript
import { useDailyStats, useSentimentAnalysis } from '../../lib/hooks';

const { data: stats } = useDailyStats(agentId, startDate, endDate);
const { data: sentiment } = useSentimentAnalysis(conversationId);
```

**Account Settings (`src/pages/main/AccountSettings.tsx`)**
```typescript
import { useAuth } from '../../lib/hooks';

const { profile, updateProfile } = useAuth();

// Update profile
await updateProfile({
  full_name: 'John Doe',
  company_name: 'Acme Inc',
});
```

### Create Agent Flow

**Create Agent (`src/pages/dashboard/CreateAgent.tsx`)**
```typescript
import { useCreateAgent } from '../../lib/hooks';

const createAgent = useCreateAgent();

const handleCreate = async (data) => {
  const agent = await createAgent.mutateAsync({
    user_id: user.id,
    name: data.name,
    description: data.description,
    ai_model: data.model,
    temperature: data.temperature,
    max_tokens: data.maxTokens,
    system_prompt: data.systemPrompt,
    welcome_message: data.welcomeMessage,
    tone: data.tone,
    enable_sentiment_analysis: data.enableSentiment,
    enable_lead_capture: data.enableLeadCapture,
    primary_color: data.color,
    widget_position: data.position,
  });
  
  navigate(`/dashboard/agent/${agent.id}`);
};
```

## 🎨 UI Integration Patterns

### Loading States
```typescript
const { data, isLoading, error } = useAgents(userId);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <AgentsList agents={data} />;
```

### Mutations with Toast Notifications
```typescript
const updateAgent = useUpdateAgent();

const handleUpdate = async () => {
  try {
    await updateAgent.mutateAsync({ agentId, data });
    toast.success('Agent updated successfully');
  } catch (error) {
    toast.error('Failed to update agent');
  }
};
```

### Optimistic Updates
```typescript
const queryClient = useQueryClient();
const updateLead = useUpdateLead();

const handleStatusChange = async (leadId, status) => {
  // Optimistically update UI
  queryClient.setQueryData(['leads', agentId], (old) => 
    old.map(lead => lead.id === leadId ? { ...lead, status } : lead)
  );
  
  try {
    await updateLead.mutateAsync({ leadId, data: { status } });
  } catch (error) {
    // Revert on error
    queryClient.invalidateQueries(['leads', agentId]);
  }
};
```

## 🔐 Authentication Flow

1. User signs up/logs in
2. `useAuth()` hook manages session
3. Protected routes check authentication
4. Automatic redirect to login if not authenticated
5. Session persists across page reloads

## 🌐 Real-time Features

All real-time subscriptions are automatically managed:
- Subscribe on component mount
- Unsubscribe on unmount
- Automatic cache updates
- No manual setup required

## 📊 Analytics Integration

Track all user actions:
```typescript
// Automatic tracking via database triggers
- Page views (analytics_events)
- Conversations started
- Messages sent
- Leads captured
- Daily aggregations (daily_stats)
```

## 🚨 Error Handling

Consistent error handling across all hooks:
```typescript
const { data, error, isError } = useAgents(userId);

if (isError) {
  console.error('Error loading agents:', error);
  // Show user-friendly error message
}
```

## 🎯 Next Steps

1. **Set up Supabase**: Create project and add credentials to `.env`
2. **Run migrations**: Execute SQL from `DATABASE.md`
3. **Test authentication**: Login/signup flows
4. **Test CRUD operations**: Create, read, update agents
5. **Test real-time**: Open two tabs and see live updates
6. **Configure RLS**: Verify security policies
7. **Deploy**: Set environment variables in production

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs
- React Query Docs: https://tanstack.com/query/latest
- Database Schema: See `DATABASE.md`
- API Reference: See `src/lib/supabase.ts`

---

**Integration Complete!** All pages are connected to Supabase with real-time updates, authentication, and comprehensive data management.
