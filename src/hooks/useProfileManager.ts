
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
        
        // If profile doesn't exist (user hasn't confirmed email or not invited)
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          
          // Get current user to check email confirmation status
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            if (!user.email_confirmed_at) {
              console.log('User email not confirmed yet');
              setError('Please check your email and click the confirmation link to complete your registration.');
              setLoading(false);
              return false;
            }
            
            // Email is confirmed but no profile exists
            // Check if there are any directors (first user case)
            const { data: existingDirectors, error: directorError } = await supabase
              .from('profiles')
              .select('id')
              .eq('role', 'director')
              .limit(1);

            if (!directorError && (!existingDirectors || existingDirectors.length === 0)) {
              console.log('No directors found, this should be the first director');
              // Trigger a retry as the database trigger should have created the profile
              if (retryCount < 5) {
                console.log('Retrying profile fetch for first director...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchUserProfile(userId, retryCount + 1);
              }
              setError('Unable to create director profile. Please contact support.');
            } else {
              // Check for pending invitations
              const { data: invitationData, error: invitationError } = await supabase
                .from('team_invitations')
                .select('*')
                .eq('email', user.email)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString())
                .single();

              if (!invitationError && invitationData) {
                console.log('Found pending invitation, profile should be created');
                // Retry as the trigger should have processed the invitation
                if (retryCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  return fetchUserProfile(userId, retryCount + 1);
                }
                setError('Account setup incomplete. Please contact an administrator.');
              } else {
                console.log('No invitation found for confirmed user');
                setError('Account not authorized. Please contact an administrator to get invited to the system.');
              }
            }
          }
        } else {
          setError('Failed to load user profile. Please try again.');
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
