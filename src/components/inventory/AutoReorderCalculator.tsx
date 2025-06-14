
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingDown, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReorderItem {
  id: string;
  name: string;
  department: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_price: number;
  cost_price: number;
  supplier_name: string;
  average_daily_usage: number;
  lead_time_days: number;
  recommended_reorder_point: number;
  recommended_order_quantity: number;
  stock_status: 'critical' | 'low' | 'ok' | 'overstocked';
  days_until_stockout: number;
}

export const AutoReorderCalculator: React.FC = () => {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [defaultLeadTime, setDefaultLeadTime] = useState(7);
  const [safetyStock, setSafetyStock] = useState(3);

  useEffect(() => {
    fetchItemsAndCalculate();
  }, []);

  const fetchItemsAndCalculate = async () => {
    setLoading(true);
    try {
      // Get inventory items
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true);

      if (itemsError) throw itemsError;

      // Get stock movements for usage calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('item_id, quantity, movement_type, movement_date')
        .gte('movement_date', thirtyDaysAgo.toISOString());

      if (movementsError) throw movementsError;

      // Calculate usage patterns
      const usageData = (movements || []).reduce((acc, movement) => {
        if (movement.movement_type === 'stock_out' || movement.movement_type === 'sale') {
          if (!acc[movement.item_id]) {
            acc[movement.item_id] = { totalUsage: 0, days: 30 };
          }
          acc[movement.item_id].totalUsage += movement.quantity;
        }
        return acc;
      }, {} as Record<string, { totalUsage: number; days: number }>);

      // Calculate reorder recommendations
      const reorderItems: ReorderItem[] = (items || []).map(item => {
        const usage = usageData[item.id];
        const averageDailyUsage = usage ? usage.totalUsage / usage.days : 0;
        const leadTimeDays = defaultLeadTime; // You can enhance this per supplier
        
        // Calculate recommended reorder point
        // Formula: (Average daily usage × Lead time) + Safety stock
        const recommendedReorderPoint = Math.ceil(
          (averageDailyUsage * leadTimeDays) + (averageDailyUsage * safetyStock)
        );

        // Calculate recommended order quantity (EOQ simplified)
        // Formula: Lead time demand + Safety stock - Current stock
        const leadTimeDemand = averageDailyUsage * leadTimeDays;
        const recommendedOrderQuantity = Math.max(0, 
          leadTimeDemand + (averageDailyUsage * safetyStock) - item.current_stock
        );

        // Determine stock status
        let stockStatus: ReorderItem['stock_status'] = 'ok';
        if (item.current_stock === 0) {
          stockStatus = 'critical';
        } else if (item.current_stock <= recommendedReorderPoint) {
          stockStatus = 'low';
        } else if (item.current_stock > item.maximum_stock) {
          stockStatus = 'overstocked';
        }

        // Calculate days until stockout
        const daysUntilStockout = averageDailyUsage > 0 
          ? Math.floor(item.current_stock / averageDailyUsage)
          : 999;

        return {
          id: item.id,
          name: item.name,
          department: item.department,
          current_stock: item.current_stock,
          minimum_stock: item.minimum_stock,
          maximum_stock: item.maximum_stock,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          supplier_name: item.supplier_name || 'Not specified',
          average_daily_usage: Number(averageDailyUsage.toFixed(2)),
          lead_time_days: leadTimeDays,
          recommended_reorder_point: recommendedReorderPoint,
          recommended_order_quantity: recommendedOrderQuantity,
          stock_status: stockStatus,
          days_until_stockout: daysUntilStockout
        };
      });

      setItems(reorderItems);
    } catch (error) {
      console.error('Error fetching reorder data:', error);
      toast({
        title: "Error",
        description: "Failed to calculate reorder recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReorderPoints = async () => {
    setCalculating(true);
    try {
      // Update minimum stock levels based on recommendations
      const updates = items
        .filter(item => item.recommended_reorder_point !== item.minimum_stock)
        .map(item => ({
          id: item.id,
          minimum_stock: item.recommended_reorder_point
        }));

      for (const update of updates) {
        const { error } = await supabase
          .from('inventory_items')
          .update({ minimum_stock: update.minimum_stock })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Updated reorder points for ${updates.length} items`,
      });

      await fetchItemsAndCalculate(); // Refresh data
    } catch (error) {
      console.error('Error updating reorder points:', error);
      toast({
        title: "Error",
        description: "Failed to update reorder points",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const generatePurchaseOrders = async () => {
    const itemsToOrder = items.filter(item => 
      item.stock_status === 'critical' || item.stock_status === 'low'
    );

    if (itemsToOrder.length === 0) {
      toast({
        title: "No Orders Needed",
        description: "No items require immediate ordering",
      });
      return;
    }

    // Group by supplier
    const ordersBySupplier = itemsToOrder.reduce((acc, item) => {
      if (!acc[item.supplier_name]) {
        acc[item.supplier_name] = [];
      }
      acc[item.supplier_name].push(item);
      return acc;
    }, {} as Record<string, ReorderItem[]>);

    try {
      for (const [supplier, supplierItems] of Object.entries(ordersBySupplier)) {
        const totalAmount = supplierItems.reduce((sum, item) => 
          sum + (item.recommended_order_quantity * item.cost_price), 0
        );

        // Create purchase order
        const { data: order, error: orderError } = await supabase
          .from('purchase_orders')
          .insert({
            order_number: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            supplier_name: supplier,
            total_amount: totalAmount,
            status: 'pending',
            notes: 'Auto-generated based on reorder calculations'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = supplierItems.map(item => ({
          purchase_order_id: order.id,
          item_id: item.id,
          quantity_ordered: item.recommended_order_quantity,
          unit_cost: item.cost_price,
          total_cost: item.recommended_order_quantity * item.cost_price
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: `Generated ${Object.keys(ordersBySupplier).length} purchase orders`,
      });
    } catch (error) {
      console.error('Error generating purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to generate purchase orders",
        variant: "destructive",
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || item.stock_status === statusFilter;
    return matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status: ReorderItem['stock_status']) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'low':
        return <Badge className="bg-orange-600">Low Stock</Badge>;
      case 'overstocked':
        return <Badge className="bg-blue-600">Overstocked</Badge>;
      default:
        return <Badge variant="outline">OK</Badge>;
    }
  };

  const getStatusIcon = (status: ReorderItem['stock_status']) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'overstocked':
        return <TrendingDown className="h-4 w-4 text-blue-600 rotate-180" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const criticalItems = items.filter(item => item.stock_status === 'critical').length;
  const lowStockItems = items.filter(item => item.stock_status === 'low').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Critical Items</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{criticalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Low Stock Items</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Items</span>
            </div>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Well Stocked</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => item.stock_status === 'ok').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reorder Calculation Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Default Lead Time (days)</label>
              <Input
                type="number"
                value={defaultLeadTime}
                onChange={(e) => setDefaultLeadTime(Number(e.target.value))}
                min="1"
                max="30"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Safety Stock (days)</label>
              <Input
                type="number"
                value={safetyStock}
                onChange={(e) => setSafetyStock(Number(e.target.value))}
                min="1"
                max="14"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchItemsAndCalculate} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Automated Reorder Recommendations</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={updateReorderPoints}
                disabled={calculating}
                variant="outline"
              >
                Update Reorder Points
              </Button>
              <Button
                onClick={generatePurchaseOrders}
                disabled={criticalItems + lowStockItems === 0}
              >
                Generate Purchase Orders
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="supermarket">Supermarket</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="overstocked">Overstocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Details</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Usage Analysis</TableHead>
                  <TableHead>Recommendations</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.stock_status)}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <Badge variant="outline">{item.department}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(item.stock_status)}
                        <div className="text-sm">
                          Stock: <span className="font-medium">{item.current_stock}</span>
                        </div>
                        {item.days_until_stockout < 30 && (
                          <div className="text-xs text-red-600">
                            {item.days_until_stockout} days until stockout
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>Daily usage: {item.average_daily_usage}</div>
                        <div>Lead time: {item.lead_time_days} days</div>
                        <div>Current min: {item.minimum_stock}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          Reorder at: {item.recommended_reorder_point}
                        </div>
                        {item.recommended_order_quantity > 0 && (
                          <div className="text-blue-600">
                            Order: {item.recommended_order_quantity}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Cost: UGX {(item.recommended_order_quantity * item.cost_price).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.supplier_name}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
