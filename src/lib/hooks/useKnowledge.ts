import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../supabase';
import type { Database } from '../../types/database.types';

type KnowledgeSource = Database['public']['Tables']['knowledge_sources']['Row'];
type KnowledgeSourceInsert = Database['public']['Tables']['knowledge_sources']['Insert'];

export function useKnowledgeSources(agentId?: string) {
  return useQuery({
    queryKey: ['knowledge-sources', agentId],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.knowledge.listSources(agentId);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useKnowledgeSource(sourceId?: string) {
  return useQuery({
    queryKey: ['knowledge-source', sourceId],
    queryFn: async () => {
      if (!sourceId) throw new Error('Source ID required');
      const { data, error } = await db.knowledge.getSource(sourceId);
      if (error) throw error;
      return data;
    },
    enabled: !!sourceId,
  });
}

export function useCreateKnowledgeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: KnowledgeSourceInsert) => {
      const { data: source, error } = await db.knowledge.createSource(data);
      if (error) throw error;
      return { source, agentId: data.agent_id };
    },
    onSuccess: ({ agentId }) => {
      // Invalidate both the general query and the specific agent query
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources', agentId] });
    },
  });
}

export function useUpdateKnowledgeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceId,
      data,
    }: {
      sourceId: string;
      data: Partial<KnowledgeSource>;
    }) => {
      const { error } = await db.knowledge.updateSource(sourceId, data);
      if (error) throw error;
      return sourceId;
    },
    onSuccess: (sourceId) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-source', sourceId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
    },
  });
}

export function useDeleteKnowledgeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { error } = await db.knowledge.deleteSource(sourceId);
      if (error) throw error;
      return sourceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
    },
  });
}
