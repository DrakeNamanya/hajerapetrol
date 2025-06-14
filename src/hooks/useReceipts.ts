
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface ReceiptData {
  receiptNumber: string;
  department: string;
  customerName?: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  changeAmount?: number;
  tableNumber?: string;
  pumpNumber?: string;
}

export const useReceipts = () => {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'HIPEMART OILS',
    address: 'BUKHALIHA ROAD, BUSIA',
    phone: '+256 776 429450',
    email: 'info@hipemartoils.com',
    website: 'www.hipemartoils.com'
  });

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
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
    }
  };

  const generateReceiptNumber = (department: string) => {
    const timestamp = Date.now();
    const prefix = department.substring(0, 3).toUpperCase();
    return `${prefix}-${timestamp}`;
  };

  const saveReceipt = async (receiptData: ReceiptData) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .insert({
          receipt_number: receiptData.receiptNumber,
          department: receiptData.department,
          customer_name: receiptData.customerName,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax: receiptData.tax,
          total: receiptData.total,
          payment_method: receiptData.paymentMethod,
          amount_received: receiptData.amountReceived,
          change_amount: receiptData.changeAmount,
          table_number: receiptData.tableNumber,
          pump_number: receiptData.pumpNumber,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Receipt Saved",
        description: `Receipt ${receiptData.receiptNumber} saved successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast({
        title: "Error",
        description: "Failed to save receipt",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    businessSettings,
    generateReceiptNumber,
    saveReceipt,
    fetchBusinessSettings
  };
};
