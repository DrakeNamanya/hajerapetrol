
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateSaleData {
  department: 'fuel' | 'supermarket' | 'restaurant';
  sale_type: string;
  customer_name?: string;
  table_number?: string;
  pump_number?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  amount_received?: number;
  change_amount?: number;
}

interface UpdateSaleStatusParams {
  saleId: string;
  status: string;
  approvalType: 'accountant' | 'manager';
  rejectionReason?: string;
}

export const useSales = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Get sales for current user's department or all if manager/accountant/director
  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      console.log('Fetching sales data...', { user: user?.id, profile: profile?.role });
      
      if (!user) {
        console.log('No user found, cannot fetch sales');
        throw new Error('User not authenticated');
      }

      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error fetching sales:', error);
          throw error;
        }

        console.log('Sales data fetched successfully:', data?.length || 0, 'records');
        return data || [];
      } catch (fetchError) {
        console.error('Error fetching sales:', {
          message: fetchError.message,
          details: fetchError.toString(),
          hint: fetchError.hint || '',
          code: fetchError.code || ''
        });
        throw fetchError;
      }
    },
    enabled: !!user && !!profile,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up real-time subscription for sales updates
  useEffect(() => {
    if (!user || !profile) {
      console.log('Skipping real-time subscription - no user or profile');
      return;
    }

    console.log('Setting up real-time subscription for sales');

    // Create a unique channel name to avoid conflicts
    const channelName = `sales-changes-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('Real-time sales update:', payload);
          
          // Invalidate and refetch sales data
          queryClient.invalidateQueries({ queryKey: ['sales'] });
          
          // Show toast notification based on the event type
          if (payload.eventType === 'INSERT') {
            const newSale = payload.new as any;
            toast({
              title: "New Sale Created",
              description: `${newSale.department.toUpperCase()} - UGX ${Number(newSale.total).toLocaleString()}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedSale = payload.new as any;
            if (updatedSale.status === 'accountant_approved') {
              toast({
                title: "Sale Approved by Accountant",
                description: `Sale UGX ${Number(updatedSale.total).toLocaleString()} sent to manager`,
              });
            } else if (updatedSale.status === 'approved') {
              toast({
                title: "Sale Fully Approved",
                description: `Sale UGX ${Number(updatedSale.total).toLocaleString()} completed`,
                variant: "default",
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role, queryClient]); // Use specific values instead of objects to prevent unnecessary re-renders

  // Create a new sale
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      console.log('=== STARTING SALE CREATION ===');
      console.log('Creating sale with data:', saleData);
      console.log('Current user info:', { id: user?.id, email: user?.email });
      console.log('Current profile info:', { role: profile?.role, department: profile?.department });
      console.log('Current timestamp:', new Date().toISOString());
      
      if (!user) {
        console.error('Cannot create sale - user not authenticated');
        throw new Error('User not authenticated');
      }

      const salePayload = {
        department: saleData.department,
        sale_type: saleData.sale_type,
        customer_name: saleData.customer_name,
        table_number: saleData.table_number,
        pump_number: saleData.pump_number,
        items: saleData.items as any, // Cast to Json type
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total: saleData.total,
        payment_method: saleData.payment_method,
        amount_received: saleData.amount_received,
        change_amount: saleData.change_amount,
        created_by: user.id,
      };

      console.log('Final payload being sent to Supabase:', salePayload);

      const { data, error } = await supabase
        .from('sales')
        .insert(salePayload)
        .select()
        .single();

      if (error) {
        console.error('=== SUPABASE ERROR DETAILS ===');
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        console.error('Full error object:', error);
        console.error('=== END ERROR DETAILS ===');
        throw error;
      }

      console.log('Sale created successfully:', data);
      return data;
    },
    onSuccess: () => {
      // Note: Real-time subscription will handle the data refresh
      toast({
        title: "Sale Recorded",
        description: "Sale has been successfully saved to database",
      });
    },
    onError: (error: any) => {
      console.error('Sale creation error:', error);
      toast({
        title: "Error",
        description: "Failed to save sale to database",
        variant: "destructive",
      });
    },
  });

  // Update sale status (for accountants/managers)
  const updateSaleStatusMutation = useMutation({
    mutationFn: async ({ 
      saleId, 
      status, 
      approvalType,
      rejectionReason
    }: UpdateSaleStatusParams) => {
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      if (status === 'rejected') {
        // For rejected sales, track who rejected it
        if (approvalType === 'accountant') {
          updateData.approved_by_accountant = user.id;
          updateData.accountant_approved_at = new Date().toISOString();
        } else if (approvalType === 'manager') {
          updateData.approved_by_manager = user.id;
          updateData.manager_approved_at = new Date().toISOString();
        }
      } else {
        // For approved sales
        if (approvalType === 'accountant') {
          updateData.approved_by_accountant = user.id;
          updateData.accountant_approved_at = new Date().toISOString();
        } else if (approvalType === 'manager') {
          updateData.approved_by_manager = user.id;
          updateData.manager_approved_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Note: Real-time subscription will handle the data refresh
      toast({
        title: "Sale Updated",
        description: "Sale status has been updated",
      });
    },
    onError: (error: any) => {
      console.error('Sale update error:', error);
      toast({
        title: "Error",
        description: "Failed to update sale status",
        variant: "destructive",
      });
    },
  });

  // Get sales summary
  const getSalesSummary = () => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.created_at).toDateString() === today
    );

    const totalSales = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const pendingSales = todaySales.filter(sale => sale.status === 'pending').length;
    const approvedSales = todaySales.filter(sale => sale.status === 'approved').length;

    return {
      totalSales,
      pendingSales,
      approvedSales,
      salesCount: todaySales.length,
    };
  };

  return {
    sales,
    isLoading,
    error,
    createSale: createSaleMutation.mutate,
    updateSaleStatus: updateSaleStatusMutation.mutate,
    isCreatingSale: createSaleMutation.isPending,
    isUpdatingSale: updateSaleStatusMutation.isPending,
    getSalesSummary,
  };
};
