
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Search, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_value: number;
  reference_id: string;
  reference_type: string;
  notes: string;
  movement_date: string;
  department: string;
  inventory_items: {
    name: string;
    sku: string;
    unit_of_measure: string;
  };
}

export const StockMovements: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_items (
            name,
            sku,
            unit_of_measure
          )
        `)
        .order('movement_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: "Error",
        description: "Failed to load stock movements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.inventory_items.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.inventory_items.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;
    const matchesDepartment = departmentFilter === 'all' || movement.department === departmentFilter;
    return matchesSearch && matchesType && matchesDepartment;
  });

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-green-100 text-green-800">Purchase</Badge>;
      case 'sale':
        return <Badge className="bg-blue-100 text-blue-800">Sale</Badge>;
      case 'adjustment':
        return <Badge className="bg-yellow-100 text-yellow-800">Adjustment</Badge>;
      case 'transfer':
        return <Badge className="bg-purple-100 text-purple-800">Transfer</Badge>;
      case 'waste':
        return <Badge className="bg-red-100 text-red-800">Waste</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getMovementIcon = (quantity: number) => {
    return quantity > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
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
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Stock Movements
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
              </SelectContent>
            </Select>
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
          </div>

          {/* Movements Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Details</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead>Quantity Change</TableHead>
                  <TableHead>Stock Levels</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.inventory_items.name}</div>
                        <div className="text-sm text-gray-500">
                          {movement.inventory_items.sku} • {movement.department}
                        </div>
                        {movement.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            {movement.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMovementBadge(movement.movement_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.quantity)}
                        <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.inventory_items.unit_of_measure}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>From: {movement.previous_stock}</div>
                        <div>To: {movement.new_stock}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.total_value && (
                        <div className="text-sm">
                          UGX {movement.total_value.toLocaleString()}
                        </div>
                      )}
                      {movement.unit_cost && (
                        <div className="text-xs text-gray-500">
                          @ UGX {movement.unit_cost.toLocaleString()}/{movement.inventory_items.unit_of_measure}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(movement.movement_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.movement_date).toLocaleTimeString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMovements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No stock movements found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
