import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, realtime } from '../supabase';
import { useEffect } from 'react';
import type { Database } from '../../types/database.types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

export function useConversations(
  agentId?: string,
  options?: {
    status?: string;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: ['conversations', agentId, options],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.conversations.list(agentId, options);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');
      const { data, error } = await db.conversations.get(conversationId);
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useConversationWithMessages(conversationId?: string) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');
      const { data, error } = await db.conversations.getWithMessages(conversationId);
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useConversationRealtime(agentId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!agentId) return;

    const channel = realtime.subscribeToConversations(agentId, (payload) => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ['conversations', agentId] });
    });

    return () => {
      realtime.unsubscribe(channel);
    };
  }, [agentId, queryClient]);
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConversationInsert) => {
      const { data: conversation, error } = await db.conversations.create(data);
      if (error) throw error;
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: Partial<Conversation>;
    }) => {
      const { error } = await db.conversations.update(conversationId, data);
      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
