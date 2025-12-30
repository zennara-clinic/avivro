import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, realtime } from '../supabase';
import { useEffect } from 'react';
import type { Database } from '../../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications(userId?: string, isRead?: boolean) {
  return useQuery({
    queryKey: ['notifications', userId, isRead],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const { data, error } = await db.notifications.list(userId, isRead);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useNotificationsRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = realtime.subscribeToNotifications(userId, (payload) => {
      // Add new notification to cache
      queryClient.setQueryData(['notifications', userId, undefined], (old: Notification[] = []) => {
        const newNotification = payload.new as Notification;
        return [newNotification, ...old];
      });
    });

    return () => {
      realtime.unsubscribe(channel);
    };
  }, [userId, queryClient]);
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await db.notifications.markAsRead(notificationId);
      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await db.notifications.delete(notificationId);
      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
