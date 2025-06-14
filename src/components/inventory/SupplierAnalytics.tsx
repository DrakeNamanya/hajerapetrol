
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, TrendingUp, Clock, Package, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SupplierMetrics {
  supplier_name: string;
  total_orders: number;
  total_value: number;
  items_supplied: number;
  average_order_value: number;
  on_time_deliveries: number;
  total_deliveries: number;
  on_time_percentage: number;
  last_order_date: string;
  performance_rating: number;
}

export const SupplierAnalytics: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'value' | 'orders' | 'performance'>('value');
  const [timeRange, setTimeRange] = useState('90'); // days

  useEffect(() => {
    fetchSupplierMetrics();
  }, [timeRange]);

  const fetchSupplierMetrics = async () => {
    setLoading(true);
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeRange));

      // Get purchase orders data
      const { data: orders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('supplier_name, total_amount, created_at, status, expected_delivery_date, approved_at')
        .gte('created_at', dateThreshold.toISOString());

      if (ordersError) throw ordersError;

      // Get inventory items per supplier
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('supplier_name')
        .eq('is_active', true);

      if (itemsError) throw itemsError;

      // Calculate metrics per supplier
      const supplierMetrics: Record<string, any> = {};

      // Process orders
      (orders || []).forEach(order => {
        const supplier = order.supplier_name;
        if (!supplierMetrics[supplier]) {
          supplierMetrics[supplier] = {
            supplier_name: supplier,
            total_orders: 0,
            total_value: 0,
            on_time_deliveries: 0,
            total_deliveries: 0,
            last_order_date: order.created_at,
            orders: []
          };
        }

        supplierMetrics[supplier].total_orders++;
        supplierMetrics[supplier].total_value += Number(order.total_amount);
        supplierMetrics[supplier].orders.push(order);

        if (order.created_at > supplierMetrics[supplier].last_order_date) {
          supplierMetrics[supplier].last_order_date = order.created_at;
        }

        // Calculate on-time delivery (simplified logic)
        if (order.status === 'delivered' || order.status === 'completed') {
          supplierMetrics[supplier].total_deliveries++;
          // Assume on-time if status is completed (you can enhance this logic)
          if (order.status === 'completed') {
            supplierMetrics[supplier].on_time_deliveries++;
          }
        }
      });

      // Process items per supplier
      const itemCounts = (items || []).reduce((acc, item) => {
        if (item.supplier_name) {
          acc[item.supplier_name] = (acc[item.supplier_name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate final metrics
      const finalMetrics: SupplierMetrics[] = Object.values(supplierMetrics).map((supplier: any) => {
        const averageOrderValue = supplier.total_orders > 0 ? supplier.total_value / supplier.total_orders : 0;
        const onTimePercentage = supplier.total_deliveries > 0 ? (supplier.on_time_deliveries / supplier.total_deliveries) * 100 : 0;
        
        // Simple performance rating calculation (0-5 stars)
        let performanceRating = 0;
        if (supplier.total_orders > 0) {
          performanceRating = Math.min(5, Math.max(1, 
            (onTimePercentage / 20) + // Up to 5 points for on-time delivery
            (supplier.total_orders > 10 ? 1 : 0) + // Bonus for volume
            (averageOrderValue > 100000 ? 1 : 0) // Bonus for order value
          ));
        }

        return {
          supplier_name: supplier.supplier_name,
          total_orders: supplier.total_orders,
          total_value: supplier.total_value,
          items_supplied: itemCounts[supplier.supplier_name] || 0,
          average_order_value: averageOrderValue,
          on_time_deliveries: supplier.on_time_deliveries,
          total_deliveries: supplier.total_deliveries,
          on_time_percentage: onTimePercentage,
          last_order_date: supplier.last_order_date,
          performance_rating: performanceRating
        };
      });

      // Sort suppliers
      finalMetrics.sort((a, b) => {
        switch (sortBy) {
          case 'value':
            return b.total_value - a.total_value;
          case 'orders':
            return b.total_orders - a.total_orders;
          case 'performance':
            return b.performance_rating - a.performance_rating;
          default:
            return 0;
        }
      });

      setSuppliers(finalMetrics);
    } catch (error) {
      console.error('Error fetching supplier metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-600">Excellent</Badge>;
    if (percentage >= 80) return <Badge className="bg-blue-600">Good</Badge>;
    if (percentage >= 70) return <Badge className="bg-yellow-600">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Active Suppliers</span>
            </div>
            <div className="text-2xl font-bold mt-2">{suppliers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {suppliers.reduce((sum, s) => sum + s.total_orders, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              UGX {suppliers.reduce((sum, s) => sum + s.total_value, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Avg On-Time</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {suppliers.length > 0 
                ? (suppliers.reduce((sum, s) => sum + s.on_time_percentage, 0) / suppliers.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Supplier Performance Analytics</CardTitle>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Sort by Value</SelectItem>
                  <SelectItem value="orders">Sort by Orders</SelectItem>
                  <SelectItem value="performance">Sort by Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Orders & Value</TableHead>
                  <TableHead>Items Supplied</TableHead>
                  <TableHead>Delivery Performance</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map(supplier => (
                  <TableRow key={supplier.supplier_name}>
                    <TableCell>
                      <div className="font-medium">{supplier.supplier_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{supplier.total_orders}</span> orders
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          UGX {supplier.total_value.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: UGX {supplier.average_order_value.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.items_supplied} items</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm">
                          {supplier.on_time_deliveries} / {supplier.total_deliveries} on-time
                        </div>
                        {getPerformanceBadge(supplier.on_time_percentage)}
                        <div className="text-xs text-gray-500">
                          {supplier.on_time_percentage.toFixed(1)}% success rate
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStars(supplier.performance_rating)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(supplier.last_order_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {suppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No supplier data found for the selected time period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
