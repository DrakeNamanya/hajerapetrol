
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
        
        // If profile doesn't exist, check if this is the first user (should become director)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, checking if this should be the first director...');
          
          // Check if there are any existing directors
          const { data: existingDirectors, error: directorError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'director')
            .limit(1);

          if (!directorError && (!existingDirectors || existingDirectors.length === 0)) {
            console.log('No directors found, this user should become the first director');
            
            // Get the current user's email
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              console.log('Creating director profile for:', user.email);
              
              // Create director profile
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                  role: 'director',
                  department: 'executive'
                })
                .select()
                .single();

              if (createError) {
                console.error('Failed to create director profile:', createError);
                setError('Failed to create user profile. Please contact support.');
                setLoading(false);
                return false;
              }

              console.log('Director profile created successfully:', newProfile);
              setProfile(newProfile);
              setError(null);
              setLoading(false);
              return true;
            }
          }
          
          // If we reach here and retries are available, try again
          if (retryCount < 3) {
            console.log('Profile not found, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchUserProfile(userId, retryCount + 1);
          }
          
          // After retries, check for pending invitations
          console.log('Checking for pending invitations...');
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            const { data: invitationData, error: invitationError } = await supabase
              .from('team_invitations')
              .select('*')
              .eq('email', user.email)
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
