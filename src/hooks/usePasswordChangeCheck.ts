
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePasswordChangeCheck = () => {
  const { user } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPasswordChangeStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log('Checking password change status for user:', user.id);
        
        // Use .maybeSingle() instead of .single() to handle cases where no record exists
        const { data, error } = await supabase
          .from('account_credentials')
          .select('is_password_changed')
          .eq('user_id', user.id)
          .maybeSingle(); // This returns null if no record exists instead of throwing an error

        if (error) {
          console.error('Error checking password change status:', error);
          setNeedsPasswordChange(false);
        } else if (data) {
          // If record exists, check if password needs to be changed
          setNeedsPasswordChange(!data.is_password_changed);
          console.log('Password needs change:', !data.is_password_changed);
        } else {
          // If no record exists, user doesn't need password change (they're not from team management)
          setNeedsPasswordChange(false);
          console.log('No account credentials record found - user does not need password change');
        }
      } catch (error) {
        console.error('Error in password check:', error);
        setNeedsPasswordChange(false);
      } finally {
        setLoading(false);
      }
    };

    checkPasswordChangeStatus();
  }, [user?.id]);

  return { needsPasswordChange, loading };
};
