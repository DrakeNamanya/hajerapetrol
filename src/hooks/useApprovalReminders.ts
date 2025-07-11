import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useApprovalReminders = () => {
  const [sending, setSending] = useState(false);

  const sendReminder = async (type: 'sales' | 'expenses' | 'purchase_orders') => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-approval-reminder', {
        body: { type }
      });

      if (error) throw error;

      toast({
        title: "Reminders Sent",
        description: `Successfully sent ${data.sent} reminder emails for pending ${type}`,
      });

      return data;
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder emails",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  };

  return {
    sendReminder,
    sending
  };
};