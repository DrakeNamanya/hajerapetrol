
import { useState } from 'react';
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

export const useSales = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get sales for current user's department or all if manager/accountant/director
  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create a new sale
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
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
      approvalType 
    }: { 
      saleId: string; 
      status: string; 
      approvalType: 'accountant' | 'manager' 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const updateData: any = { status };
      
      if (approvalType === 'accountant') {
        updateData.approved_by_accountant = user.id;
        updateData.accountant_approved_at = new Date().toISOString();
      } else {
        updateData.approved_by_manager = user.id;
        updateData.manager_approved_at = new Date().toISOString();
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
      queryClient.invalidateQueries({ queryKey: ['sales'] });
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
