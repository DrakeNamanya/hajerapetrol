
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { cleanupAuthState, recoverAuthState } from '@/utils/authCleanup';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<boolean> => {
    try {
      console.log(`Fetching profile for user: ${userId}, attempt: ${retryCount + 1}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        
        // If profile doesn't exist and we haven't exceeded retry limit
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log('Profile not found, retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchUserProfile(userId, retryCount + 1);
        }
        
        // After retries, check if this user has a pending invitation
        console.log('Checking for pending invitations...');
        const { data: invitationData, error: invitationError } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('email', user?.email)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!invitationError && invitationData) {
          console.log('Found pending invitation, user needs to complete setup');
          setError('Account setup incomplete. Please contact an administrator for proper invitation.');
        } else {
          console.log('No profile found and no pending invitation - unauthorized user');
          setError('Account not authorized. Please contact an administrator to get invited to the system.');
        }
        
        setLoading(false);
        return false;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      setError(null);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError('Failed to load user profile');
      setLoading(false);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchUserProfile(user.id);
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
            setLoading(true);
            
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
            setProfile(null);
            setError(null);
            setLoading(false);
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
          setProfile(null);
          setLoading(false);
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
            if (recoveredSession.user) {
              setTimeout(() => {
                if (mounted) {
                  fetchUserProfile(recoveredSession.user.id);
                }
              }, 100);
            }
          } else {
            setLoading(false);
          }
        } else if (session && mounted) {
          console.log('Found existing session for:', session.user.email);
          setSession(session);
          setUser(session.user);
          if (session.user) {
            setTimeout(() => {
              if (mounted) {
                fetchUserProfile(session.user.id);
              }
            }, 100);
          } else {
            setLoading(false);
          }
        } else {
          console.log('No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setError('Authentication initialization failed');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      setLoading(true);
      
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
      setError(error.message || 'Sign up failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
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
      
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data.user) {
        console.log('Sign in successful, waiting for profile...');
      }
      
      return { error };
    } catch (error: any) {
      setError(error.message || 'Sign in failed');
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error('Sign out error:', err);
      }
      
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out failed:', error);
      setError('Sign out failed');
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
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
