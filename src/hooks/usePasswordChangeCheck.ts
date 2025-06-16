
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const usePasswordChangeCheck = (user: User | null) => {
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPasswordChangeStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('account_credentials')
          .select('is_password_changed')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // If no record found, user probably signed up normally
          if (error.code === 'PGRST116') {
            setNeedsPasswordChange(false);
          } else {
            console.error('Error checking password change status:', error);
          }
        } else {
          setNeedsPasswordChange(!data.is_password_changed);
        }
      } catch (error) {
        console.error('Error in password change check:', error);
      }

      setLoading(false);
    };

    checkPasswordChangeStatus();
  }, [user]);

  const markPasswordChanged = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('account_credentials')
        .update({ is_password_changed: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking password as changed:', error);
      } else {
        setNeedsPasswordChange(false);
      }
    } catch (error) {
      console.error('Error updating password change status:', error);
    }
  };

  return {
    needsPasswordChange,
    loading,
    markPasswordChanged
  };
};
