import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../supabase';
import type { Database } from '../../types/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export function useLeads(agentId?: string, filters?: { status?: string; searchTerm?: string }) {
  return useQuery({
    queryKey: ['leads', agentId, filters],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID required');
      const { data, error } = await db.leads.list(agentId, filters);
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useLead(leadId?: string) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!leadId) throw new Error('Lead ID required');
      const { data, error } = await db.leads.get(leadId);
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LeadInsert) => {
      const { data: lead, error } = await db.leads.create(data);
      if (error) throw error;
      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: Partial<Lead> }) => {
      const { error } = await db.leads.update(leadId, data);
      if (error) throw error;
      return leadId;
    },
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await db.leads.delete(leadId);
      if (error) throw error;
      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
