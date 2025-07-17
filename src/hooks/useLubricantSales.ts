import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface LubricantSale {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  category: 'lubricant' | 'gas_cylinder';
  notes?: string;
}

export interface CreateLubricantSaleData {
  product_name: string;
  quantity: number;
  unit_price: number;
  category: 'lubricant' | 'gas_cylinder';
  notes?: string;
}

export function useLubricantSales() {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['lubricant-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lubricant_sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LubricantSale[];
    },
  });

  const createSale = useMutation({
    mutationFn: async (saleData: CreateLubricantSaleData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const total_amount = saleData.quantity * saleData.unit_price;

      const { data, error } = await supabase
        .from('lubricant_sales')
        .insert({
          ...saleData,
          total_amount,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lubricant-sales'] });
      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive",
      });
    },
  });

  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return sales.filter(sale => 
      new Date(sale.created_at).toDateString() === today
    );
  };

  const getSalesByCategory = (category: 'lubricant' | 'gas_cylinder') => {
    return sales.filter(sale => sale.category === category);
  };

  const getTotalSales = () => {
    return sales.reduce((total, sale) => total + sale.total_amount, 0);
  };

  return {
    sales,
    isLoading,
    createSale,
    getTodaysSales,
    getSalesByCategory,
    getTotalSales,
    isCreating: createSale.isPending,
  };
}