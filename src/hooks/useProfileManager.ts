
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const useProfileManager = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          .eq('email', (await supabase.auth.getUser()).data.user?.email)
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

  const refreshProfile = async (userId?: string) => {
    if (userId) {
      setLoading(true);
      await fetchUserProfile(userId);
    }
  };

  const clearError = () => setError(null);

  const resetProfile = () => {
    setProfile(null);
    setError(null);
    setLoading(false);
  };

  return {
    profile,
    error,
    loading,
    setError,
    setLoading,
    fetchUserProfile,
    refreshProfile,
    clearError,
    resetProfile
  };
};
