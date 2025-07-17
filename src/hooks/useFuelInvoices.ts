import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FuelInvoice {
  id: string;
  client_name: string;
  fuel_quantity: number;
  fuel_type: string;
  price_per_liter: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  notes?: string;
}

export interface CreateFuelInvoiceData {
  client_name: string;
  fuel_quantity: number;
  fuel_type: string;
  price_per_liter: number;
  due_date?: string;
  notes?: string;
}

export function useFuelInvoices() {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['fuel-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FuelInvoice[];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: CreateFuelInvoiceData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const total_amount = invoiceData.fuel_quantity * invoiceData.price_per_liter;

      const { data, error } = await supabase
        .from('fuel_invoices')
        .insert({
          ...invoiceData,
          total_amount,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-invoices'] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      status 
    }: { 
      invoiceId: string; 
      status: 'paid' | 'cancelled';
    }) => {
      const { data, error } = await supabase
        .from('fuel_invoices')
        .update({ status })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-invoices'] });
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });

  const getInvoicesByStatus = (status: string) => {
    return invoices.filter(invoice => invoice.status === status);
  };

  return {
    invoices,
    isLoading,
    createInvoice,
    updateInvoiceStatus,
    getInvoicesByStatus,
    isCreating: createInvoice.isPending,
    isUpdating: updateInvoiceStatus.isPending,
  };
}