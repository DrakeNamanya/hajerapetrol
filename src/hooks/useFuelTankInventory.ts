import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FuelTankInventory {
  id: string;
  fuel_type: string;
  tank_capacity: number;
  current_level: number;
  last_refill_amount: number;
  last_refill_date: string;
  updated_by: string;
  updated_at: string;
  created_at: string;
  notes?: string;
}

export interface UpdateTankData {
  fuel_type: string;
  refill_amount?: number;
  current_level?: number;
  notes?: string;
}

export function useFuelTankInventory() {
  const queryClient = useQueryClient();

  const { data: tanks = [], isLoading } = useQuery({
    queryKey: ['fuel-tank-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_tank_inventory')
        .select('*')
        .order('fuel_type');

      if (error) throw error;
      return data as FuelTankInventory[];
    },
  });

  const updateTankLevel = useMutation({
    mutationFn: async (updateData: UpdateTankData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { fuel_type, refill_amount, current_level, notes } = updateData;
      
      // Get current tank data
      const { data: currentTank, error: fetchError } = await supabase
        .from('fuel_tank_inventory')
        .select('*')
        .eq('fuel_type', fuel_type)
        .single();

      if (fetchError) throw fetchError;

      let newLevel = current_level;
      let refillData = {};

      if (refill_amount && refill_amount > 0) {
        // Adding fuel to tank
        newLevel = currentTank.current_level + refill_amount;
        refillData = {
          last_refill_amount: refill_amount,
          last_refill_date: new Date().toISOString().split('T')[0],
        };
      }

      const { data, error } = await supabase
        .from('fuel_tank_inventory')
        .update({
          current_level: newLevel,
          updated_by: user.id,
          notes,
          ...refillData,
        })
        .eq('fuel_type', fuel_type)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-inventory'] });
      toast({
        title: "Success",
        description: "Tank inventory updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating tank inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update tank inventory",
        variant: "destructive",
      });
    },
  });

  const deductFuelFromTank = useMutation({
    mutationFn: async ({ fuel_type, amount }: { fuel_type: string; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current tank data
      const { data: currentTank, error: fetchError } = await supabase
        .from('fuel_tank_inventory')
        .select('*')
        .eq('fuel_type', fuel_type)
        .single();

      if (fetchError) throw fetchError;

      const newLevel = Math.max(0, currentTank.current_level - amount);

      const { data, error } = await supabase
        .from('fuel_tank_inventory')
        .update({
          current_level: newLevel,
          updated_by: user.id,
        })
        .eq('fuel_type', fuel_type)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-inventory'] });
    },
    onError: (error) => {
      console.error('Error deducting fuel from tank:', error);
    },
  });

  const getTankByFuelType = (fuelType: string) => {
    return tanks.find(tank => tank.fuel_type === fuelType);
  };

  const getTotalCapacity = () => {
    return tanks.reduce((sum, tank) => sum + tank.tank_capacity, 0);
  };

  const getTotalCurrentLevel = () => {
    return tanks.reduce((sum, tank) => sum + tank.current_level, 0);
  };

  const getUtilizationPercentage = (fuelType: string) => {
    const tank = getTankByFuelType(fuelType);
    if (!tank || tank.tank_capacity === 0) return 0;
    return (tank.current_level / tank.tank_capacity) * 100;
  };

  return {
    tanks,
    isLoading,
    updateTankLevel,
    deductFuelFromTank,
    getTankByFuelType,
    getTotalCapacity,
    getTotalCurrentLevel,
    getUtilizationPercentage,
    isUpdating: updateTankLevel.isPending,
    isDeducting: deductFuelFromTank.isPending,
  };
}