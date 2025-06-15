
import React, { createContext, useContext } from 'react';
import { AuthContextType } from '@/types/auth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    profile,
    error,
    loading: profileLoading,
    setError,
    setLoading: setProfileLoading,
    fetchUserProfile,
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

  const loading = authLoading || profileLoading;

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
