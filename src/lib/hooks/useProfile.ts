import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { Database } from '../../types/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UpdateProfileData = Database['public']['Tables']['user_profiles']['Update'];

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!user?.id) throw new Error('No user logged in');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ newPassword }: { currentPassword: string; newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
  });
}
