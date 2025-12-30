import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../supabase';
import type { Database } from '../../types/database.types';

type Correction = Database['public']['Tables']['corrections']['Row'];
type CorrectionInsert = Database['public']['Tables']['corrections']['Insert'];

export function useCorrections(agentId?: string, status?: string) {
  return useQuery({
    queryKey: ['corrections', agentId, status],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.corrections.list(agentId, status);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useCreateCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CorrectionInsert) => {
      const { data: correction, error } = await db.corrections.create(data);
      if (error) throw error;
      return correction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] });
    },
  });
}

export function useUpdateCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      correctionId,
      data,
    }: {
      correctionId: string;
      data: Partial<Correction>;
    }) => {
      const { error } = await db.corrections.update(correctionId, data);
      if (error) throw error;
      return correctionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] });
    },
  });
}

export function useDeleteCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (correctionId: string) => {
      const { error } = await db.corrections.delete(correctionId);
      if (error) throw error;
      return correctionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] });
    },
  });
}
