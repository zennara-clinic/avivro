# Avivro Database Documentation

Complete Supabase backend for Avivro AI Agent Platform built with comprehensive features, Row Level Security, and TypeScript support.

## 🎯 Database Overview

The Avivro database supports a complete AI agent platform with the following core features:

- **User Management** - Profiles, authentication, subscription management
- **Agent Management** - AI agent configuration, settings, and publishing
- **Conversations** - Real-time chat conversations with visitors
- **Messages** - Individual messages with AI model tracking
- **Lead Capture** - Automated lead collection and management
- **Knowledge Base** - Document storage with vector embeddings for semantic search
- **Corrections & Training** - AI response corrections and training data
- **Analytics** - Comprehensive event tracking, sentiment analysis, and stats
- **Usage Tracking** - Detailed usage logs and billing
- **Notifications** - Real-time notifications and activity logs
- **API & Webhooks** - API key management and webhook integrations

---

## 📋 Database Schema

### Core Tables

#### 1. **user_profiles**
User account information and subscription details.

**Key Fields:**
- `id` - UUID (references auth.users)
- `email`, `full_name`, `company_name`, `avatar_url`, `phone`
- `subscription_tier` - free, starter, professional, enterprise
- `subscription_status` - active, cancelled, past_due, trialing
- `monthly_message_limit`, `monthly_messages_used`

**Features:**
- Auto-created on user signup via trigger
- Monthly usage tracking with auto-reset
- Subscription and billing integration ready

---

#### 2. **agents**
AI agent configurations and settings.

**Key Fields:**
- `id`, `user_id`, `name`, `description`, `avatar_url`
- `ai_model` - OpenRouter model identifier
- `temperature`, `max_tokens`, `system_prompt`, `welcome_message`
- `tone` - professional, friendly, casual, formal, empathetic
- `enable_sentiment_analysis`, `enable_lead_capture`
- `primary_color`, `widget_position`, `widget_size`
- `is_published`, `public_url`, `embed_code`
- `total_conversations`, `total_messages`, `total_leads`

**Features:**
- Complete AI configuration (model, temperature, tokens)
- Customizable appearance and branding
- Publishing and embed code generation
- Real-time analytics counters

---

#### 3. **conversations**
Chat conversations between visitors and agents.

**Key Fields:**
- `id`, `agent_id`, `visitor_id`
- `visitor_name`, `visitor_email`, `visitor_phone`
- `visitor_ip`, `visitor_location`, `visitor_metadata`
- `source` - website, widget, api, mobile
- `status` - active, resolved, archived
- `sentiment_score`, `sentiment_label`
- `is_lead`, `lead_captured_at`
- `message_count`, `duration_seconds`

**Features:**
- Visitor tracking and identification
- Sentiment analysis integration
- Lead conversion tracking
- Automatic message counting via triggers

---

#### 4. **messages**
Individual messages within conversations.

**Key Fields:**
- `id`, `conversation_id`, `role` (user/assistant/system)
- `content`, `model`, `tokens_used`, `response_time_ms`
- `sentiment_score`, `sentiment_label`
- `was_corrected`, `correction_id`, `feedback_rating`

**Features:**
- AI model usage tracking
- Token consumption logging
- Response time monitoring
- Correction and feedback system

---

#### 5. **leads**
Captured leads from conversations.

**Key Fields:**
- `id`, `agent_id`, `conversation_id`
- `name`, `email`, `phone`, `company`
- `custom_fields` - JSONB for dynamic fields
- `status` - new, contacted, qualified, converted, lost
- `score`, `interest_level`
- `utm_source`, `utm_medium`, `utm_campaign`
- `assigned_to`, `next_follow_up_at`, `notes`, `tags`

**Features:**
- Flexible custom field support
- UTM tracking for attribution
- Lead scoring and qualification
- Task management (follow-ups, assignments)
- Automatic agent lead counter updates

---

#### 6. **knowledge_sources**
Documents and data sources for the knowledge base.

**Key Fields:**
- `id`, `agent_id`, `name`, `type`
- Types: file, url, text, api, notion, google_drive
- `content`, `file_url`, `file_name`, `file_size`, `file_type`
- `status` - pending, processing, completed, failed
- `chunks_count`, `tokens_count`
- `auto_sync`, `sync_frequency`, `last_synced_at`

**Features:**
- Multiple source type support
- Automatic chunking and processing
- Scheduled sync for URL/API sources
- Error tracking and retry logic

---

#### 7. **knowledge_chunks**
Vector embeddings for semantic search.

**Key Fields:**
- `id`, `source_id`, `agent_id`
- `content`, `tokens`
- `embedding` - vector(1536) for OpenAI embeddings
- `chunk_index`, `metadata`

**Features:**
- pgvector extension for similarity search
- HNSW index for fast vector queries
- Semantic search via `match_knowledge_chunks()` function

---

#### 8. **corrections**
AI response corrections for training.

**Key Fields:**
- `id`, `agent_id`, `message_id`, `conversation_id`
- `original_response`, `corrected_response`
- `reason`, `correction_type`
- `status` - pending, approved, rejected, applied
- `was_helpful`, `feedback_notes`

**Features:**
- Manual correction workflow
- Automatic training example creation on approval
- Feedback loop for continuous improvement

---

#### 9. **training_examples**
Training data for agent improvement.

**Key Fields:**
- `id`, `agent_id`, `input`, `expected_output`
- `category`, `tags`, `source`
- `quality_score`, `times_used`, `success_rate`
- `is_active`

**Features:**
- Multiple source types (manual, correction, conversation, import)
- Quality tracking and performance metrics
- Tag-based organization

---

#### 10. **analytics_events**
Detailed event tracking.

**Key Fields:**
- `id`, `agent_id`, `event_type`, `event_data`
- Event types: conversation_started, message_sent, lead_captured, etc.
- `visitor_id`, `session_id`, `conversation_id`
- `ip_address`, `user_agent`, `device_type`, `browser`, `os`
- `country`, `city`

**Features:**
- Comprehensive event logging
- Geo-location tracking
- Device and browser detection

---

#### 11. **daily_stats**
Aggregated daily metrics per agent.

**Key Fields:**
- `id`, `agent_id`, `date`
- Conversation metrics: `total_conversations`, `active_conversations`, `avg_conversation_duration`
- Message metrics: `total_messages`, `user_messages`, `assistant_messages`, `avg_response_time_ms`
- Lead metrics: `total_leads`, `conversion_rate`
- Sentiment: `positive_sentiment_count`, `neutral_sentiment_count`, `negative_sentiment_count`
- Engagement: `widget_opens`, `unique_visitors`, `returning_visitors`
- AI usage: `total_tokens_used`, `total_ai_cost`

**Features:**
- Automatic daily aggregation via triggers
- Performance tracking over time
- Cost analysis and optimization

---

#### 12. **sentiment_analysis**
Detailed sentiment tracking.

**Key Fields:**
- `id`, `conversation_id`, `message_id`, `agent_id`
- `overall_score`, `label` (positive/neutral/negative)
- `confidence`, `emotions` (JSONB)
- `topics`, `keywords`

**Features:**
- Message and conversation level analysis
- Emotion detection
- Topic and keyword extraction

---

#### 13. **usage_logs**
Detailed usage tracking for billing.

**Key Fields:**
- `id`, `user_id`, `agent_id`, `usage_type`
- Usage types: message, conversation, knowledge_chunk, embedding, api_call, export
- `ai_model`, `prompt_tokens`, `completion_tokens`, `total_tokens`
- `unit_cost`, `total_cost`

**Features:**
- Granular usage tracking
- Cost calculation per request
- AI model usage breakdown

---

#### 14. **monthly_usage_summary**
Monthly usage aggregation per user.

**Key Fields:**
- `id`, `user_id`, `year`, `month`
- `total_messages`, `total_conversations`, `total_agents`
- `total_tokens`, `total_ai_requests`, `total_ai_cost`
- `message_limit`, `messages_remaining`, `overage_messages`

**Features:**
- Monthly billing calculations
- Usage limit enforcement
- Overage tracking

---

#### 15. **billing_transactions**
Payment and billing history.

**Key Fields:**
- `id`, `user_id`, `type`, `status`
- Types: subscription, overage, one_time, refund, credit
- `amount`, `currency`, `tax_amount`, `total_amount`
- `payment_method`, `payment_provider`, `provider_transaction_id`
- `invoice_number`, `invoice_url`

**Features:**
- Complete transaction history
- Multiple payment provider support
- Invoice generation ready

---

#### 16. **subscription_history**
Subscription change tracking.

**Key Fields:**
- `id`, `user_id`, `tier`, `status`
- `monthly_price`, `annual_price`, `billing_cycle`
- `started_at`, `ended_at`, `trial_ends_at`
- `cancelled_at`, `cancellation_reason`

**Features:**
- Full subscription lifecycle tracking
- Cancellation reason analysis
- Trial period management

---

#### 17. **api_keys**
API key management.

**Key Fields:**
- `id`, `user_id`, `agent_id`, `name`
- `key_hash`, `key_prefix`, `scopes`
- `rate_limit_per_minute`, `rate_limit_per_day`
- `is_active`, `total_requests`, `last_used_at`, `expires_at`

**Features:**
- Secure key storage (hashed)
- Scope-based permissions
- Rate limiting configuration
- Usage tracking

---

#### 18. **webhooks**
Webhook endpoint management.

**Key Fields:**
- `id`, `user_id`, `agent_id`, `name`, `url`, `secret`
- `events` - Array of subscribed events
- `is_active`, `retry_failed`, `max_retries`
- `custom_headers` (JSONB)
- Delivery stats: `total_deliveries`, `successful_deliveries`, `failed_deliveries`

**Features:**
- Event subscription system
- Automatic retry logic
- Custom header support
- Delivery tracking

---

#### 19. **webhook_deliveries**
Webhook delivery logs.

**Key Fields:**
- `id`, `webhook_id`, `event_type`, `event_data`
- `status`, `http_status`, `response_body`, `error_message`
- `attempt_count`, `next_retry_at`
- `delivered_at`, `duration_ms`

**Features:**
- Complete delivery history
- Retry queue management
- Performance monitoring

---

#### 20. **notifications**
In-app notifications.

**Key Fields:**
- `id`, `user_id`, `type`, `title`, `message`
- Types: new_conversation, new_lead, new_message, usage_limit, billing_update, etc.
- `priority` - low, normal, high, urgent
- `is_read`, `read_at`
- `action_url`, `action_label`

**Features:**
- Auto-notification on key events (triggers)
- Priority system
- Actionable notifications with CTAs

---

#### 21. **activity_logs**
User activity audit trail.

**Key Fields:**
- `id`, `user_id`, `action`, `resource_type`, `resource_id`
- `description`, `changes` (JSONB)
- `ip_address`, `user_agent`

**Features:**
- Complete audit trail
- Change tracking (before/after)
- Security monitoring

---

#### 22. **email_logs**
Email delivery tracking.

**Key Fields:**
- `id`, `user_id`, `to_email`, `from_email`, `subject`
- `email_type`, `template_id`, `template_data`
- `status`, `provider`, `provider_message_id`
- `sent_at`, `delivered_at`, `opened_at`, `clicked_at`

**Features:**
- Email delivery tracking
- Template management
- Open and click tracking

---

## 🔧 Database Functions

### Analytics Functions

#### `get_agent_analytics(agent_id, start_date, end_date)`
Returns comprehensive analytics for an agent.

**Returns:**
- total_conversations, total_messages, total_leads
- avg_sentiment, positive_count, neutral_count, negative_count
- avg_response_time, conversion_rate

#### `get_current_usage(user_id)`
Returns current usage stats for a user.

**Returns:**
- messages_used, messages_limit, messages_remaining
- conversations_count, agents_count, leads_count, storage_used_mb

#### `get_conversation_with_messages(conversation_id)`
Returns conversation with all messages in JSON format.

---

### Search Functions

#### `search_conversations(agent_id, search_term, status, start_date, end_date, limit, offset)`
Advanced conversation search with filters.

#### `match_knowledge_chunks(query_embedding, agent_id, match_threshold, match_count)`
Semantic search across knowledge base using vector similarity.

---

### Helper Functions

#### `create_notification(user_id, type, title, message, agent_id, priority)`
Creates a new notification.

#### `log_activity(user_id, action, resource_type, resource_id, description, changes)`
Logs user activity.

#### `log_usage(user_id, agent_id, usage_type, tokens, cost)`
Logs usage and updates monthly summary.

#### `increment_message_usage(user_id)`
Increments message counter and enforces limits.

#### `reset_monthly_usage()`
Resets monthly usage counters (scheduled job).

#### `analyze_sentiment(text)`
Placeholder for sentiment analysis (integrate with AI service).

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

### User Data Access
- Users can only view/modify their own profiles
- Users can only access data for agents they own
- Public agents are viewable by anyone (when published)

### System Operations
- System can create analytics events, notifications, logs
- System can manage usage tracking and billing

### API Access
- Conversations can be created for published agents
- Messages can be sent to active conversations
- Leads can be captured from public forms

---

## 🎨 Database Views

### `agent_dashboard_summary`
Pre-aggregated agent dashboard data including:
- Active conversations count
- New leads (last 7 days)
- Knowledge sources count
- Pending corrections count

### `recent_activity`
Recent activity across conversations, leads, and knowledge sources.

---

## 📦 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Supabase
VITE_SUPABASE_URL=https://eowtgcoabblvldtgefwb.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
VITE_DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 3. Database is Ready!

The database has been fully set up with:
- ✅ All tables created
- ✅ RLS policies configured
- ✅ Triggers and functions deployed
- ✅ Indexes optimized
- ✅ TypeScript types generated

---

## 💻 Usage Examples

### Authentication

```typescript
import { auth } from './lib/supabase';

// Sign Up
const { data, error } = await auth.signUp('user@example.com', 'password', {
  full_name: 'John Doe',
});

// Sign In
const { data, error } = await auth.signIn('user@example.com', 'password');

// Get Current User
const { data: { user } } = await auth.getUser();
```

### Agent Management

```typescript
import { db } from './lib/supabase';

// Create Agent
const { data: agent } = await db.agents.create({
  user_id: userId,
  name: 'Customer Support Bot',
  description: 'Helpful customer support assistant',
  ai_model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  system_prompt: 'You are a helpful customer support agent...',
});

// Get Agent Analytics
const analytics = await db.agents.getAnalytics(agentId, '2025-01-01', '2025-01-31');
```

### Conversations

```typescript
// List Conversations
const conversations = await db.conversations.list(agentId, {
  status: 'active',
  searchTerm: 'support',
  limit: 20,
});

// Get Conversation with Messages
const conversation = await db.conversations.getWithMessages(conversationId);

// Create Message
const message = await db.messages.create({
  conversation_id: conversationId,
  role: 'assistant',
  content: 'How can I help you today?',
  model: 'anthropic/claude-3.5-sonnet',
  tokens_used: 150,
});
```

### Lead Management

```typescript
// Create Lead
const lead = await db.leads.create({
  agent_id: agentId,
  conversation_id: conversationId,
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1234567890',
  status: 'new',
  custom_fields: { company: 'Acme Inc', budget: '$10k' },
});

// Update Lead Status
await db.leads.update(leadId, {
  status: 'contacted',
  notes: 'Discussed requirements, scheduling follow-up',
});
```

### Knowledge Base

```typescript
// Add Knowledge Source
const source = await db.knowledge.createSource({
  agent_id: agentId,
  name: 'Product Documentation',
  type: 'url',
  url: 'https://docs.example.com',
  auto_sync: true,
  sync_frequency: 'daily',
});

// Semantic Search (after embeddings are created)
const results = await db.knowledge.searchChunks(
  agentId,
  queryEmbedding,  // from OpenAI embeddings API
  0.7,  // similarity threshold
  5     // number of results
);
```

### Real-time Subscriptions

```typescript
import { realtime } from './lib/supabase';

// Subscribe to new messages
const subscription = realtime.subscribeToMessages(conversationId, (payload) => {
  console.log('New message:', payload.new);
});

// Subscribe to notifications
const notifSubscription = realtime.subscribeToNotifications(userId, (payload) => {
  console.log('New notification:', payload.new);
});

// Unsubscribe
realtime.unsubscribe(subscription);
```

---

## 🚀 Advanced Features

### Vector Search Setup

For knowledge base semantic search:

1. Generate embeddings using OpenAI API:
```typescript
const response = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'text-embedding-ada-002',
    input: text,
  }),
});
const { data } = await response.json();
const embedding = data[0].embedding;
```

2. Store chunks with embeddings:
```typescript
await supabase.from('knowledge_chunks').insert({
  source_id: sourceId,
  agent_id: agentId,
  content: chunkText,
  embedding: embedding,
});
```

### Webhook Integration

```typescript
// Create Webhook
const webhook = await db.webhooks.create({
  user_id: userId,
  agent_id: agentId,
  name: 'Slack Notifications',
  url: 'https://hooks.slack.com/services/...',
  secret: 'webhook_secret_key',
  events: ['conversation.started', 'lead.captured'],
});

// Get Delivery History
const deliveries = await db.webhooks.getDeliveries(webhookId, 50);
```

---

## 📊 Database Stats

- **Total Tables:** 22
- **Total Views:** 2
- **Total Functions:** 11
- **Total Triggers:** 8
- **Extensions:** pgvector, uuid-ossp
- **RLS Policies:** 50+

---

## 🔒 Security Features

1. **Row Level Security (RLS)** - All tables protected
2. **Hashed API Keys** - Never store keys in plain text
3. **Webhook Secrets** - Secure webhook validation
4. **Audit Logging** - Complete activity trail
5. **Usage Limits** - Prevent abuse and overuse
6. **Data Isolation** - Users can only access their data

---

## 📝 Migration Management

All migrations are tracked in the `supabase_migrations` schema. Current migrations:

1. `create_user_profiles_table`
2. `create_agents_table`
3. `create_conversations_and_messages_tables`
4. `create_leads_table`
5. `enable_pgvector_extension`
6. `create_knowledge_base_tables`
7. `create_corrections_and_training_tables`
8. `create_analytics_tables`
9. `create_usage_and_billing_tables`
10. `create_api_keys_and_webhooks_tables`
11. `create_notifications_and_activity_logs`
12. `create_helper_functions_and_views`

---

## 🎯 Next Steps

1. **OpenRouter Integration** - Connect AI models for conversations
2. **Frontend Integration** - Connect React components to Supabase
3. **Real-time Features** - Implement live chat and notifications
4. **Email Service** - Set up transactional emails
5. **Webhook Handlers** - Build webhook delivery system
6. **Analytics Dashboard** - Create data visualization
7. **Payment Integration** - Connect Stripe for subscriptions
8. **Vector Embeddings** - Set up OpenAI embeddings pipeline

---

## 📞 Support

For questions or issues with the database:
- Review TypeScript types in `src/types/database.types.ts`
- Check Supabase client helpers in `src/lib/supabase.ts`
- Refer to this documentation for schema details

---

Built with ❤️ using Supabase MCP and TypeScript
