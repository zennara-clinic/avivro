import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getUser: async () => {
    return await supabase.auth.getUser();
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  updatePassword: async (newPassword: string) => {
    return await supabase.auth.updateUser({
      password: newPassword,
    });
  },
};

// Database helpers
export const db = {
  // User Profiles
  profiles: {
    get: async (userId: string) => {
      return await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
    },

    update: async (userId: string, data: Partial<Database['public']['Tables']['user_profiles']['Update']>) => {
      return await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', userId);
    },

    getCurrentUsage: async (userId: string) => {
      return await supabase.rpc('get_current_usage', { p_user_id: userId });
    },
  },

  // Agents
  agents: {
    list: async (userId: string) => {
      return await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    },

    get: async (agentId: string) => {
      return await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
    },

    create: async (data: Database['public']['Tables']['agents']['Insert']) => {
      return await supabase
        .from('agents')
        .insert(data)
        .select()
        .single();
    },

    update: async (agentId: string, data: Database['public']['Tables']['agents']['Update']) => {
      return await supabase
        .from('agents')
        .update(data)
        .eq('id', agentId);
    },

    delete: async (agentId: string) => {
      return await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);
    },

    getAnalytics: async (agentId: string, startDate?: string, endDate?: string) => {
      return await supabase.rpc('get_agent_analytics', {
        p_agent_id: agentId,
        p_start_date: startDate,
        p_end_date: endDate,
      });
    },

    getDashboardSummary: async (agentId: string) => {
      return await supabase
        .from('agent_dashboard_summary')
        .select('*')
        .eq('agent_id', agentId)
        .single();
    },
  },

  // Conversations
  conversations: {
    list: async (agentId: string, options?: {
      status?: string;
      searchTerm?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }) => {
      return await supabase.rpc('search_conversations', {
        p_agent_id: agentId,
        p_status: options?.status,
        p_search_term: options?.searchTerm,
        p_start_date: options?.startDate,
        p_end_date: options?.endDate,
        p_limit: options?.limit || 50,
        p_offset: options?.offset || 0,
      });
    },

    get: async (conversationId: string) => {
      return await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
    },

    getWithMessages: async (conversationId: string) => {
      return await supabase.rpc('get_conversation_with_messages', {
        p_conversation_id: conversationId,
      });
    },

    create: async (data: Database['public']['Tables']['conversations']['Insert']) => {
      return await supabase
        .from('conversations')
        .insert(data)
        .select()
        .single();
    },

    update: async (conversationId: string, data: Partial<Database['public']['Tables']['conversations']['Row']>) => {
      return await supabase
        .from('conversations')
        .update(data)
        .eq('id', conversationId);
    },
  },

  // Messages
  messages: {
    list: async (conversationId: string) => {
      return await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    },

    create: async (data: Database['public']['Tables']['messages']['Insert']) => {
      return await supabase
        .from('messages')
        .insert(data)
        .select()
        .single();
    },

    update: async (messageId: string, data: Partial<Database['public']['Tables']['messages']['Row']>) => {
      return await supabase
        .from('messages')
        .update(data)
        .eq('id', messageId);
    },
  },

  // Leads
  leads: {
    list: async (agentId: string, filters?: { status?: string; searchTerm?: string }) => {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('agent_id', agentId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
      }

      return await query.order('created_at', { ascending: false });
    },

    get: async (leadId: string) => {
      return await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
    },

    create: async (data: Database['public']['Tables']['leads']['Insert']) => {
      return await supabase
        .from('leads')
        .insert(data)
        .select()
        .single();
    },

    update: async (leadId: string, data: Partial<Database['public']['Tables']['leads']['Row']>) => {
      return await supabase
        .from('leads')
        .update(data)
        .eq('id', leadId);
    },

    delete: async (leadId: string) => {
      return await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
    },
  },

  // Knowledge Sources
  knowledge: {
    listSources: async (agentId: string) => {
      return await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
    },

    getSource: async (sourceId: string) => {
      return await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('id', sourceId)
        .single();
    },

    createSource: async (data: Database['public']['Tables']['knowledge_sources']['Insert']) => {
      return await supabase
        .from('knowledge_sources')
        .insert(data)
        .select()
        .single();
    },

    updateSource: async (sourceId: string, data: Partial<Database['public']['Tables']['knowledge_sources']['Row']>) => {
      return await supabase
        .from('knowledge_sources')
        .update(data)
        .eq('id', sourceId);
    },

    deleteSource: async (sourceId: string) => {
      return await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);
    },

    searchChunks: async (agentId: string, queryEmbedding: number[], matchThreshold = 0.7, matchCount = 5) => {
      return await supabase.rpc('match_knowledge_chunks', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        p_agent_id: agentId,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });
    },
  },

  // Corrections
  corrections: {
    list: async (agentId: string, status?: string) => {
      let query = supabase
        .from('corrections')
        .select('*')
        .eq('agent_id', agentId);

      if (status) {
        query = query.eq('status', status);
      }

      return await query.order('created_at', { ascending: false });
    },

    create: async (data: Database['public']['Tables']['corrections']['Insert']) => {
      return await supabase
        .from('corrections')
        .insert(data)
        .select()
        .single();
    },

    update: async (correctionId: string, data: Partial<Database['public']['Tables']['corrections']['Row']>) => {
      return await supabase
        .from('corrections')
        .update(data)
        .eq('id', correctionId);
    },

    delete: async (correctionId: string) => {
      return await supabase
        .from('corrections')
        .delete()
        .eq('id', correctionId);
    },
  },

  // Training Examples
  training: {
    list: async (agentId: string) => {
      return await supabase
        .from('training_examples')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    },

    create: async (data: Database['public']['Tables']['training_examples']['Insert']) => {
      return await supabase
        .from('training_examples')
        .insert(data)
        .select()
        .single();
    },

    update: async (exampleId: string, data: Partial<Database['public']['Tables']['training_examples']['Row']>) => {
      return await supabase
        .from('training_examples')
        .update(data)
        .eq('id', exampleId);
    },

    delete: async (exampleId: string) => {
      return await supabase
        .from('training_examples')
        .delete()
        .eq('id', exampleId);
    },
  },

  // Analytics
  analytics: {
    getEvents: async (agentId: string, eventType?: string, limit = 100) => {
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('agent_id', agentId);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      return await query
        .order('created_at', { ascending: false })
        .limit(limit);
    },

    getDailyStats: async (agentId: string, startDate: string, endDate: string) => {
      return await supabase
        .from('daily_stats')
        .select('*')
        .eq('agent_id', agentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
    },

    getSentimentAnalysis: async (conversationId: string) => {
      return await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('analyzed_at', { ascending: false });
    },
  },

  // Notifications
  notifications: {
    list: async (userId: string, isRead?: boolean) => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (isRead !== undefined) {
        query = query.eq('is_read', isRead);
      }

      return await query.order('created_at', { ascending: false });
    },

    markAsRead: async (notificationId: string) => {
      return await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
    },

    delete: async (notificationId: string) => {
      return await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    },
  },

  // Activity Logs
  activity: {
    list: async (userId: string, limit = 50) => {
      return await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    },

    getRecent: async (userId: string, limit = 20) => {
      return await supabase
        .from('recent_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    },
  },

  // API Keys
  apiKeys: {
    list: async (userId: string) => {
      return await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    },

    create: async (data: Database['public']['Tables']['api_keys']['Insert']) => {
      return await supabase
        .from('api_keys')
        .insert(data)
        .select()
        .single();
    },

    update: async (keyId: string, data: Partial<Database['public']['Tables']['api_keys']['Row']>) => {
      return await supabase
        .from('api_keys')
        .update(data)
        .eq('id', keyId);
    },

    delete: async (keyId: string) => {
      return await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
    },
  },

  // Webhooks
  webhooks: {
    list: async (userId: string) => {
      return await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    },

    create: async (data: Database['public']['Tables']['webhooks']['Insert']) => {
      return await supabase
        .from('webhooks')
        .insert(data)
        .select()
        .single();
    },

    update: async (webhookId: string, data: Partial<Database['public']['Tables']['webhooks']['Row']>) => {
      return await supabase
        .from('webhooks')
        .update(data)
        .eq('id', webhookId);
    },

    delete: async (webhookId: string) => {
      return await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);
    },

    getDeliveries: async (webhookId: string, limit = 50) => {
      return await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit);
    },
  },
};

// Realtime subscriptions
export const realtime = {
  subscribeToConversations: (agentId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`conversations:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToMessages: (conversationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  unsubscribe: (channel: ReturnType<typeof supabase.channel>) => {
    return supabase.removeChannel(channel);
  },
};

export default supabase;
