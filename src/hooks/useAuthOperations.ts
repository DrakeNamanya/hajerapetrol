
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';

export const useAuthOperations = () => {
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Global signout during signup failed (expected):', err);
      }
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Global signout during signin failed (expected):', err);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (data.user) {
        console.log('Sign in successful, waiting for profile...');
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error('Sign out error:', err);
      }
      
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out failed:', error);
      window.location.href = '/';
    }
  };

  return {
    signUp,
    signIn,
    signOut
  };
};
