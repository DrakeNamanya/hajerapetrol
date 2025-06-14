
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export const useBusinessSettings = () => {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'HIPEMART OILS',
    address: 'BUKHALIHA ROAD, BUSIA',
    phone: '+256 776 429450',
    email: 'info@hipemartoils.com',
    website: 'www.hipemartoils.com'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching business settings:', error);
        return;
      }

      if (data) {
        setBusinessSettings({
          businessName: data.business_name,
          address: data.address,
          phone: data.phone,
          email: data.email || '',
          website: data.website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    businessSettings,
    loading,
    refetch: fetchBusinessSettings
  };
};
