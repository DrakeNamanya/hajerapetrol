import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { useAuthState } from '@/hooks/useAuthState';
import { usePasswordChangeCheck } from '@/hooks/usePasswordChangeCheck';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    profile,
    error: profileError,
    loading: profileLoading,
    setError,
    setLoading: setProfileLoading,
    fetchUserProfile,
    refreshProfile: refreshUserProfile,
    clearError,
    resetProfile
  } = useProfileManager();

  const {
    user,
    session,
    authLoading,
    setAuthLoading,
    setError: setAuthError
  } = useAuthState(fetchUserProfile, resetProfile, setError);

  const {
    handleSignUp,
    handleSignIn,
    signOut,
    refreshProfile
  } = useAuthHandlers(setError, setAuthLoading, user, fetchUserProfile, setProfileLoading);

  const {
    needsPasswordChange,
    loading: passwordCheckLoading,
    markPasswordChanged
  } = usePasswordChangeCheck();

  const loading = authLoading || profileLoading || passwordCheckLoading;
  const error = profileError;

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
      <PasswordChangeModal 
        open={needsPasswordChange && !loading} 
        onPasswordChanged={markPasswordChanged}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
