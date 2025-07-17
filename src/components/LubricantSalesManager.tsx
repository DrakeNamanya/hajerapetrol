import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, DollarSign, Zap } from "lucide-react";
import { useLubricantSales } from '@/hooks/useLubricantSales';

export const LubricantSalesManager: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState<'lubricant' | 'gas_cylinder'>('lubricant');
  const [notes, setNotes] = useState('');

  const { 
    sales, 
    createSale, 
    getTodaysSales, 
    getSalesByCategory,
    getTotalSales,
    isCreating 
  } = useLubricantSales();

  const totalAmount = quantity && unitPrice ? 
    parseFloat(quantity) * parseFloat(unitPrice) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName || !quantity || !unitPrice) {
      return;
    }

    createSale.mutate({
      product_name: productName,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unitPrice),
      category,
      notes: notes || undefined,
    });

    // Reset form
    setProductName('');
    setQuantity('');
    setUnitPrice('');
    setCategory('lubricant');
    setNotes('');
  };

  const todaysSales = getTodaysSales();
  const lubricantSales = getSalesByCategory('lubricant');
  const gasCylinderSales = getSalesByCategory('gas_cylinder');

  return (
    <div className="space-y-6">
      {/* Create Sale Form */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <ShoppingCart className="h-6 w-6" />
            Record Lubricant/Gas Cylinder Sale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: 'lubricant' | 'gas_cylinder') => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lubricant">Lubricant</SelectItem>
                    <SelectItem value="gas_cylinder">Gas Cylinder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (UGX)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {totalAmount > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Total Amount:</span>
                  </div>
                  <Badge variant="default" className="text-lg">
                    UGX {totalAmount.toLocaleString()}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Recording...' : 'Record Sale'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Total Sales:</span>
                <span className="font-semibold">{sales.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Today's Sales:</span>
                <span className="font-semibold">{todaysSales.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Lubricants:</span>
                <Badge variant="secondary">{lubricantSales.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Gas Cylinders:</span>
                <Badge variant="secondary">{gasCylinderSales.length}</Badge>
              </div>
              <div className="flex justify-between col-span-2">
                <span>Total Revenue:</span>
                <span className="text-purple-600 font-semibold">UGX {getTotalSales().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 10).map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.product_name}</TableCell>
                  <TableCell>
                    <Badge variant={sale.category === 'lubricant' ? 'default' : 'secondary'}>
                      {sale.category === 'lubricant' ? 'Lubricant' : 'Gas Cylinder'}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>UGX {sale.unit_price.toLocaleString()}</TableCell>
                  <TableCell>UGX {sale.total_amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};