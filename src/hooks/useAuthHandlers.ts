
import { useAuthOperations } from '@/hooks/useAuthOperations';

export const useAuthHandlers = (
  setError: (error: string | null) => void,
  setAuthLoading: (loading: boolean) => void,
  user: any,
  fetchUserProfile: (userId: string) => Promise<boolean>,
  setProfileLoading: (loading: boolean) => void
) => {
  const { signUp, signIn, signOut } = useAuthOperations();

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

  const refreshProfile = async () => {
    if (user) {
      setProfileLoading(true);
      await fetchUserProfile(user.id);
    }
  };

  return {
    handleSignUp,
    handleSignIn,
    signOut,
    refreshProfile
  };
};
