
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  pendingOrders: number;
  criticalAlerts: number;
}

export const useInventoryStats = () => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total active items
        const { count: totalItems } = await supabase
          .from('inventory_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get low stock items
        const { count: lowStockItems } = await supabase
          .from('inventory_items')
          .select('*', { count: 'exact', head: true })
          .lte('current_stock', 'minimum_stock')
          .eq('is_active', true);

        // Get pending purchase orders
        const { count: pendingOrders } = await supabase
          .from('purchase_orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'approved', 'ordered']);

        // Get critical alerts
        const { count: criticalAlerts } = await supabase
          .from('low_stock_alerts')
          .select('*', { count: 'exact', head: true })
          .in('alert_level', ['critical', 'out_of_stock'])
          .eq('is_acknowledged', false);

        setStats({
          totalItems: totalItems || 0,
          lowStockItems: lowStockItems || 0,
          pendingOrders: pendingOrders || 0,
          criticalAlerts: criticalAlerts || 0,
        });
      } catch (error) {
        console.error('Error fetching inventory stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};
