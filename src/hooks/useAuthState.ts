
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { recoverAuthState } from '@/utils/authCleanup';

export const useAuthState = (
  fetchUserProfile: (userId: string) => Promise<boolean>,
  resetProfile: () => void,
  setError: (error: string | null) => void
) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Memoize the profile fetching function to prevent recreating it
  const fetchProfileSafely = useCallback((userId: string) => {
    setTimeout(() => {
      fetchUserProfile(userId);
    }, 100);
  }, [fetchUserProfile]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        
        switch (event) {
          case 'SIGNED_IN':
            setSession(session);
            setUser(session?.user ?? null);
            setError(null);
            setAuthLoading(false);
            
            if (session?.user) {
              fetchProfileSafely(session.user.id);
            }
            break;
            
          case 'SIGNED_OUT':
            setSession(null);
            setUser(null);
            resetProfile();
            setAuthLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            setSession(session);
            setError(null);
            break;
            
          case 'USER_UPDATED':
            setUser(session?.user ?? null);
            break;
            
          default:
            setSession(session);
            setUser(session?.user ?? null);
        }
        
        if (!session) {
          resetProfile();
          setAuthLoading(false);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session initialization error:', error);
          const recoveredSession = await recoverAuthState();
          if (recoveredSession && mounted) {
            setSession(recoveredSession);
            setUser(recoveredSession.user);
            setAuthLoading(false);
            if (recoveredSession.user) {
              fetchProfileSafely(recoveredSession.user.id);
            }
          } else {
            setAuthLoading(false);
          }
        } else if (session && mounted) {
          console.log('Found existing session for:', session.user.email);
          setSession(session);
          setUser(session.user);
          setAuthLoading(false);
          if (session.user) {
            fetchProfileSafely(session.user.id);
          }
        } else {
          console.log('No existing session found');
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setError('Authentication initialization failed');
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to prevent infinite loop

  return {
    user,
    session,
    authLoading,
    setAuthLoading,
    setError
  };
};
