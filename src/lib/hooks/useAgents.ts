import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../supabase';
import type { Database } from '../../types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentInsert = Database['public']['Tables']['agents']['Insert'];
type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export function useAgents(userId?: string) {
  return useQuery({
    queryKey: ['agents', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const { data, error } = await db.agents.list(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useAgent(agentId?: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.agents.get(agentId);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useAgentAnalytics(agentId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['agent-analytics', agentId, startDate, endDate],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.agents.getAnalytics(agentId, startDate, endDate);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useAgentDashboard(agentId?: string) {
  return useQuery({
    queryKey: ['agent-dashboard', agentId],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.agents.getDashboardSummary(agentId);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AgentInsert) => {
      const { data: agent, error } = await db.agents.create(data);
      if (error) throw error;
      return agent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, data }: { agentId: string; data: AgentUpdate }) => {
      const { error } = await db.agents.update(agentId, data);
      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await db.agents.delete(agentId);
      if (error) throw error;
      return agentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
