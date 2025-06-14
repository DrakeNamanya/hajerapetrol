
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Package, FileSpreadsheet, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ValuationItem {
  id: string;
  name: string;
  department: string;
  category: string;
  current_stock: number;
  unit_price: number;
  cost_price: number;
  total_selling_value: number;
  total_cost_value: number;
  potential_profit: number;
  profit_margin: number;
}

interface ValuationSummary {
  totalItems: number;
  totalSellingValue: number;
  totalCostValue: number;
  totalPotentialProfit: number;
  averageMargin: number;
  departmentBreakdown: Record<string, {
    items: number;
    sellingValue: number;
    costValue: number;
    profit: number;
  }>;
}

export const InventoryValuationReport: React.FC = () => {
  const [items, setItems] = useState<ValuationItem[]>([]);
  const [summary, setSummary] = useState<ValuationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'value' | 'profit' | 'margin'>('value');

  useEffect(() => {
    fetchValuationData();
  }, []);

  const fetchValuationData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, department, category, current_stock, unit_price, cost_price')
        .eq('is_active', true)
        .gt('current_stock', 0);

      if (error) throw error;

      const valuationItems: ValuationItem[] = (data || []).map(item => {
        const totalSellingValue = item.current_stock * item.unit_price;
        const totalCostValue = item.current_stock * item.cost_price;
        const potentialProfit = totalSellingValue - totalCostValue;
        const profitMargin = totalSellingValue > 0 ? (potentialProfit / totalSellingValue) * 100 : 0;

        return {
          ...item,
          total_selling_value: totalSellingValue,
          total_cost_value: totalCostValue,
          potential_profit: potentialProfit,
          profit_margin: profitMargin
        };
      });

      // Calculate summary
      const totalSellingValue = valuationItems.reduce((sum, item) => sum + item.total_selling_value, 0);
      const totalCostValue = valuationItems.reduce((sum, item) => sum + item.total_cost_value, 0);
      const totalPotentialProfit = totalSellingValue - totalCostValue;
      const averageMargin = totalSellingValue > 0 ? (totalPotentialProfit / totalSellingValue) * 100 : 0;

      // Department breakdown
      const departmentBreakdown = valuationItems.reduce((acc, item) => {
        if (!acc[item.department]) {
          acc[item.department] = { items: 0, sellingValue: 0, costValue: 0, profit: 0 };
        }
        acc[item.department].items++;
        acc[item.department].sellingValue += item.total_selling_value;
        acc[item.department].costValue += item.total_cost_value;
        acc[item.department].profit += item.potential_profit;
        return acc;
      }, {} as Record<string, any>);

      setSummary({
        totalItems: valuationItems.length,
        totalSellingValue,
        totalCostValue,
        totalPotentialProfit,
        averageMargin,
        departmentBreakdown
      });

      setItems(valuationItems);
    } catch (error) {
      console.error('Error fetching valuation data:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory valuation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedItems = items
    .filter(item => departmentFilter === 'all' || item.department === departmentFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.total_selling_value - a.total_selling_value;
        case 'profit':
          return b.potential_profit - a.potential_profit;
        case 'margin':
          return b.profit_margin - a.profit_margin;
        default:
          return 0;
      }
    });

  const exportToExcel = () => {
    // TODO: Implement Excel export functionality
    toast({
      title: "Export",
      description: "Excel export functionality coming soon",
    });
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
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Items</span>
              </div>
              <div className="text-2xl font-bold mt-2">{summary.totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Selling Value</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">
                UGX {summary.totalSellingValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Potential Profit</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-purple-600">
                UGX {summary.totalPotentialProfit.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Avg Margin</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-orange-600">
                {summary.averageMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Breakdown */}
      {summary?.departmentBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Department Valuation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summary.departmentBreakdown).map(([dept, stats]) => (
                <div key={dept} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{dept.toUpperCase()}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span className="font-medium">{stats.items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span className="font-medium">UGX {stats.sellingValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit:</span>
                      <span className="font-medium text-green-600">UGX {stats.profit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detailed Valuation Report</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Sort by Value</SelectItem>
                <SelectItem value="profit">Sort by Profit</SelectItem>
                <SelectItem value="margin">Sort by Margin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Details</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Prices</TableHead>
                  <TableHead>Total Values</TableHead>
                  <TableHead>Profit Analysis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{item.department}</Badge>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.current_stock}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Sale:</span> UGX {item.unit_price.toLocaleString()}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Cost:</span> UGX {item.cost_price.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Selling:</span> UGX {item.total_selling_value.toLocaleString()}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Cost:</span> UGX {item.total_cost_value.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">
                          UGX {item.potential_profit.toLocaleString()}
                        </div>
                        <div className="text-sm">
                          <Badge variant={item.profit_margin > 20 ? 'default' : 'secondary'}>
                            {item.profit_margin.toFixed(1)}% margin
                          </Badge>
                        </div>
                      </div>
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
