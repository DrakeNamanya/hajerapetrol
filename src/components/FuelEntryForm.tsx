import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Fuel, Plus, TrendingDown, AlertCircle } from "lucide-react";
import { useFuelEntries } from '@/hooks/useFuelEntries';
import { useFuelTankInventory } from '@/hooks/useFuelTankInventory';

export const FuelEntryForm: React.FC = () => {
  const [openingStock, setOpeningStock] = useState('');
  const [closingStock, setClosingStock] = useState('');
  const [revenueReceived, setRevenueReceived] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [pumpFuelSold, setPumpFuelSold] = useState('');
  const [notes, setNotes] = useState('');

  const { createEntry, isCreating } = useFuelEntries();
  const { getTankByFuelType, deductFuelFromTank } = useFuelTankInventory();

  const fuelSold = openingStock && closingStock ? 
    parseFloat(openingStock) - parseFloat(closingStock) : 0;
  
  const pumpSold = pumpFuelSold ? parseFloat(pumpFuelSold) : 0;
  const tank = fuelType ? getTankByFuelType(fuelType) : null;
  
  // Validation
  const hasDiscrepancy = pumpSold > 0 && fuelSold > 0 && Math.abs(pumpSold - fuelSold) > 5;
  const exceedsTankLevel = tank && pumpSold > tank.current_level;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!openingStock || !closingStock || !revenueReceived || !fuelType) {
      return;
    }

    // Validate pump fuel sold
    if (pumpSold < 0) {
      alert('Pump fuel sold cannot be negative');
      return;
    }

    if (exceedsTankLevel) {
      alert('Fuel sold exceeds available tank level');
      return;
    }

    createEntry.mutate({
      opening_stock: parseFloat(openingStock),
      closing_stock: parseFloat(closingStock),
      revenue_received: parseFloat(revenueReceived),
      fuel_type: fuelType,
      pump_fuel_sold: pumpSold || undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        // Deduct fuel from tank if pump fuel sold is provided
        if (pumpSold > 0 && fuelType) {
          deductFuelFromTank.mutate({ fuel_type: fuelType, amount: pumpSold });
        }
      }
    });

    // Reset form
    setOpeningStock('');
    setClosingStock('');
    setRevenueReceived('');
    setFuelType('');
    setPumpFuelSold('');
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

            <div className="space-y-2">
              <Label htmlFor="pumpFuelSold">Pump Fuel Sold (Liters)</Label>
              <Input
                id="pumpFuelSold"
                type="number"
                value={pumpFuelSold}
                onChange={(e) => setPumpFuelSold(e.target.value)}
                placeholder="0"
                step="0.01"
                className={exceedsTankLevel ? 'border-red-500' : ''}
              />
              {tank && (
                <p className="text-xs text-muted-foreground">
                  Tank Level: {tank.current_level.toFixed(2)}L
                </p>
              )}
            </div>
          </div>

          {(openingStock && closingStock) || pumpFuelSold ? (
            <div className="space-y-4">
              {openingStock && closingStock && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Calculated Fuel Sold:</span>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {fuelSold.toFixed(2)} L
                    </Badge>
                  </div>
                </div>
              )}
              
              {pumpFuelSold && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Pump Reading:</span>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {pumpSold.toFixed(2)} L
                    </Badge>
                  </div>
                </div>
              )}

              {hasDiscrepancy && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Discrepancy Alert: {Math.abs(pumpSold - fuelSold).toFixed(2)}L difference
                    </span>
                  </div>
                </div>
              )}

              {exceedsTankLevel && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Error: Fuel sold exceeds tank level
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}

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