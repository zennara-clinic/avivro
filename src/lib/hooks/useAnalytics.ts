import { useQuery } from '@tanstack/react-query';
import { db } from '../supabase';

export function useAnalyticsEvents(agentId?: string, eventType?: string) {
  return useQuery({
    queryKey: ['analytics-events', agentId, eventType],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.analytics.getEvents(agentId, eventType);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useDailyStats(agentId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['daily-stats', agentId, startDate, endDate],
    queryFn: async () => {
      if (!agentId || !startDate || !endDate) {
        throw new Error('Agent ID, start date, and end date required');
      }
      const { data, error } = await db.analytics.getDailyStats(agentId, startDate, endDate);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId && !!startDate && !!endDate,
  });
}

export function useSentimentAnalysis(conversationId?: string) {
  return useQuery({
    queryKey: ['sentiment-analysis', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');
      const { data, error } = await db.analytics.getSentimentAnalysis(conversationId);
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}
