import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, supabase } from '../supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('🔍 Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📊 Profile query result:', { data, error });
      
      if (error) {
        console.error('❌ Profile error:', error);
        throw error;
      }
      
      console.log('✅ Profile loaded successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('💥 Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password, metadata);
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      setProfile(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // Reload profile
      await loadProfile(user.id);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };
}
