
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Package2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BatchItem {
  id: string;
  name: string;
  current_stock: number;
  new_stock: number;
  movement_type: 'in' | 'out' | 'adjustment';
  reason: string;
  unit_cost?: number;
}

interface InventoryItem {
  id: string;
  name: string;
  current_stock: number;
  department: string;
  unit_price: number;
}

export const BatchStockUpdate: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock, department, unit_price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItemToBatch = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || batchItems.some(bi => bi.id === itemId)) return;

    setBatchItems(prev => [...prev, {
      id: item.id,
      name: item.name,
      current_stock: item.current_stock,
      new_stock: item.current_stock,
      movement_type: 'adjustment',
      reason: '',
      unit_cost: item.unit_price
    }]);
  };

  const updateBatchItem = (itemId: string, field: keyof BatchItem, value: any) => {
    setBatchItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const removeBatchItem = (itemId: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== itemId));
  };

  const processBatchUpdate = async () => {
    if (batchItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to update",
        variant: "destructive",
      });
      return;
    }

    const invalidItems = batchItems.filter(item => 
      item.new_stock < 0 || !item.reason.trim()
    );

    if (invalidItems.length > 0) {
      toast({
        title: "Invalid Data",
        description: "Please ensure all items have valid stock levels and reasons",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Update inventory items
      for (const item of batchItems) {
        // Update stock level
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ current_stock: item.new_stock })
          .eq('id', item.id);

        if (updateError) throw updateError;

        // Record stock movement
        const quantity = Math.abs(item.new_stock - item.current_stock);
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            item_id: item.id,
            movement_type: item.movement_type === 'in' ? 'stock_in' : 
                          item.movement_type === 'out' ? 'stock_out' : 'adjustment',
            quantity: quantity,
            previous_stock: item.current_stock,
            new_stock: item.new_stock,
            department: items.find(i => i.id === item.id)?.department || 'unknown',
            unit_cost: item.unit_cost,
            total_value: quantity * (item.unit_cost || 0),
            notes: item.reason,
            created_by: 'current-user' // TODO: Get from auth context
          });

        if (movementError) throw movementError;
      }

      toast({
        title: "Success",
        description: `Updated ${batchItems.length} items successfully`,
      });

      setBatchItems([]);
      fetchItems(); // Refresh data
    } catch (error) {
      console.error('Error processing batch update:', error);
      toast({
        title: "Error",
        description: "Failed to process batch update",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const availableItems = items.filter(item => !batchItems.some(bi => bi.id === item.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Batch Stock Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Item Selector */}
          <div className="flex gap-2">
            <Select onValueChange={addItemToBatch}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select item to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} (Current: {item.current_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Items Table */}
          {batchItems.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Movement Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.current_stock}</Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.new_stock}
                          onChange={(e) => updateBatchItem(item.id, 'new_stock', Number(e.target.value))}
                          className="w-24"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.movement_type} 
                          onValueChange={(value) => updateBatchItem(item.id, 'movement_type', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">Stock In</SelectItem>
                            <SelectItem value="out">Stock Out</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason..."
                          value={item.reason}
                          onChange={(e) => updateBatchItem(item.id, 'reason', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_cost || 0}
                          onChange={(e) => updateBatchItem(item.id, 'unit_cost', Number(e.target.value))}
                          className="w-24"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBatchItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={processBatchUpdate}
              disabled={processing || batchItems.length === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              {processing ? 'Processing...' : `Update ${batchItems.length} Items`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
