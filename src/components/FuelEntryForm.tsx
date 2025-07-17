import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Fuel, Plus, TrendingDown } from "lucide-react";
import { useFuelEntries } from '@/hooks/useFuelEntries';

export const FuelEntryForm: React.FC = () => {
  const [openingStock, setOpeningStock] = useState('');
  const [closingStock, setClosingStock] = useState('');
  const [revenueReceived, setRevenueReceived] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [notes, setNotes] = useState('');

  const { createEntry, isCreating } = useFuelEntries();

  const fuelSold = openingStock && closingStock ? 
    parseFloat(openingStock) - parseFloat(closingStock) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!openingStock || !closingStock || !revenueReceived || !fuelType) {
      return;
    }

    createEntry.mutate({
      opening_stock: parseFloat(openingStock),
      closing_stock: parseFloat(closingStock),
      revenue_received: parseFloat(revenueReceived),
      fuel_type: fuelType,
      notes: notes || undefined,
    });

    // Reset form
    setOpeningStock('');
    setClosingStock('');
    setRevenueReceived('');
    setFuelType('');
    setNotes('');
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Fuel className="h-6 w-6" />
          Daily Fuel Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="kerosene">Kerosene</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingStock">Opening Stock (Liters)</Label>
              <Input
                id="openingStock"
                type="number"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                placeholder="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingStock">Closing Stock (Liters)</Label>
              <Input
                id="closingStock"
                type="number"
                value={closingStock}
                onChange={(e) => setClosingStock(e.target.value)}
                placeholder="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueReceived">Revenue Received (UGX)</Label>
              <Input
                id="revenueReceived"
                type="number"
                value={revenueReceived}
                onChange={(e) => setRevenueReceived(e.target.value)}
                placeholder="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {openingStock && closingStock && (
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Fuel Sold:</span>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {fuelSold.toFixed(2)} L
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
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Submitting...' : 'Submit Entry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};