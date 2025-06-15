
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { recoverAuthState } from '@/utils/authCleanup';
import { AuthContextType } from '@/types/auth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useAuthOperations } from '@/hooks/useAuthOperations';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const {
    profile,
    error,
    loading: profileLoading,
    setError,
    setLoading: setProfileLoading,
    fetchUserProfile,
    refreshProfile: refreshUserProfile,
    clearError,
    resetProfile
  } = useProfileManager();

  const { signUp, signIn, signOut } = useAuthOperations();

  const loading = authLoading || profileLoading;

  const refreshProfile = async () => {
    if (user) {
      setProfileLoading(true);
      await fetchUserProfile(user.id);
    }
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    setAuthLoading(true);
    
    try {
      const result = await signUp(email, password, fullName);
      return result;
    } catch (error: any) {
      setError(error.message || 'Sign up failed');
      return { error };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    setAuthLoading(true);
    
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError(result.error.message);
        setAuthLoading(false);
      }
      
      return result;
    } catch (error: any) {
      setError(error.message || 'Sign in failed');
      setAuthLoading(false);
      return { error };
    }
  };

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
              // Use setTimeout to prevent potential deadlocks
              setTimeout(() => {
                if (mounted) {
                  fetchUserProfile(session.user.id);
                }
              }, 100);
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
              setTimeout(() => {
                if (mounted) {
                  fetchUserProfile(recoveredSession.user.id);
                }
              }, 100);
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
            setTimeout(() => {
              if (mounted) {
                fetchUserProfile(session.user.id);
              }
            }, 100);
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
  }, [fetchUserProfile, resetProfile, setError]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut,
    refreshProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
