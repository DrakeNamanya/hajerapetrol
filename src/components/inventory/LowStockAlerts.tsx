
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LowStockAlert {
  id: string;
  current_stock: number;
  minimum_stock: number;
  alert_level: string;
  is_acknowledged: boolean;
  acknowledged_at: string;
  created_at: string;
  inventory_items: {
    id: string;
    name: string;
    sku: string;
    department: string;
    unit_of_measure: string;
    supplier_name: string;
  };
}

export const LowStockAlerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('low_stock_alerts')
        .select(`
          *,
          inventory_items (
            id,
            name,
            sku,
            department,
            unit_of_measure,
            supplier_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load stock alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('low_stock_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert acknowledged",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Stock</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getAlertIcon = (level: string) => {
    if (level === 'out_of_stock' || level === 'critical') {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <Package className="h-4 w-4 text-orange-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Details</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Alert Level</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.alert_level)}
                        <div>
                          <div className="font-medium">{alert.inventory_items.name}</div>
                          <div className="text-sm text-gray-500">
                            {alert.inventory_items.sku} • {alert.inventory_items.department}
                          </div>
                          <div className="text-sm text-gray-500">
                            Supplier: {alert.inventory_items.supplier_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.current_stock}</span>
                          <span className="text-sm text-gray-500">
                            {alert.inventory_items.unit_of_measure}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Minimum: {alert.minimum_stock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAlertBadge(alert.alert_level)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.is_acknowledged ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Acknowledged</span>
                        </div>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.is_acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p>No stock alerts at this time.</p>
              <p className="text-sm">All inventory levels are within normal ranges.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
