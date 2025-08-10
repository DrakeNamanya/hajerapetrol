import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FuelEntry {
  id: string;
  date: string;
  attendant_id: string;
  opening_stock: number;
  closing_stock: number;
  fuel_sold?: number; // Generated column - calculated automatically
  revenue_received: number;
  status: 'submitted' | 'approved_by_accountant' | 'approved_by_manager';
  approved_by_accountant?: string;
  approved_by_manager?: string;
  accountant_approved_at?: string;
  manager_approved_at?: string;
  created_at: string;
  updated_at: string;
  fuel_type: string;
  pump_fuel_sold?: number;
  notes?: string;
}

export interface CreateFuelEntryData {
  opening_stock: number;
  closing_stock: number;
  revenue_received: number;
  fuel_type: string;
  pump_fuel_sold?: number;
  notes?: string;
}

export function useFuelEntries() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['fuel-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FuelEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entryData: CreateFuelEntryData) => {
      console.log('Starting fuel entry creation...', entryData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log('User authenticated:', user.id);

      const insertData = {
        ...entryData,
        attendant_id: user.id,
      };
      
      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('fuel_entries')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert response:', { data, error });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      toast({
        title: "Success",
        description: "Fuel entry created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating fuel entry:', error);
      toast({
        title: "Error",
        description: "Failed to create fuel entry",
        variant: "destructive",
      });
    },
  });

  const updateEntryStatus = useMutation({
    mutationFn: async ({ 
      entryId, 
      status, 
      approvalType 
    }: { 
      entryId: string; 
      status: 'approved_by_accountant' | 'approved_by_manager';
      approvalType: 'accountant' | 'manager';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: any = { status };
      
      if (approvalType === 'accountant') {
        updateData.approved_by_accountant = user.id;
        updateData.accountant_approved_at = new Date().toISOString();
      } else if (approvalType === 'manager') {
        updateData.approved_by_manager = user.id;
        updateData.manager_approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('fuel_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      toast({
        title: "Success",
        description: "Entry status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating entry status:', error);
      toast({
        title: "Error",
        description: "Failed to update entry status",
        variant: "destructive",
      });
    },
  });

  const getTodaysEntries = () => {
    const today = new Date().toDateString();
    return entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );
  };

  const getEntriesByStatus = (status: string) => {
    return entries.filter(entry => entry.status === status);
  };

  return {
    entries,
    isLoading,
    createEntry,
    updateEntryStatus,
    getTodaysEntries,
    getEntriesByStatus,
    isCreating: createEntry.isPending,
    isUpdating: updateEntryStatus.isPending,
  };
}