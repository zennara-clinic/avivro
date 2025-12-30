import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, realtime } from '../supabase';
import { useEffect } from 'react';
import type { Database } from '../../types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');
      const { data, error } = await db.messages.list(conversationId);
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useMessagesRealtime(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = realtime.subscribeToMessages(conversationId, (payload) => {
      // Add new message to cache
      queryClient.setQueryData(['messages', conversationId], (old: Message[] = []) => {
        const newMessage = payload.new as Message;
        // Avoid duplicates
        if (old.some(msg => msg.id === newMessage.id)) return old;
        return [...old, newMessage];
      });
    });

    return () => {
      realtime.unsubscribe(channel);
    };
  }, [conversationId, queryClient]);
}

export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MessageInsert) => {
      const { data: message, error } = await db.messages.create(data);
      if (error) throw error;
      return message;
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', message.conversation_id] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      data,
    }: {
      messageId: string;
      data: Partial<Message>;
    }) => {
      const { error } = await db.messages.update(messageId, data);
      if (error) throw error;
      return messageId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
