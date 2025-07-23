import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Fuel, Plus, Gauge, AlertTriangle } from "lucide-react";
import { useFuelTankInventory } from '@/hooks/useFuelTankInventory';

export const FuelTankManager: React.FC = () => {
  const [selectedFuelType, setSelectedFuelType] = useState('');
  const [refillAmount, setRefillAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { 
    tanks, 
    isLoading, 
    updateTankLevel, 
    getUtilizationPercentage,
    isUpdating 
  } = useFuelTankInventory();

  const handleRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFuelType || !refillAmount) {
      return;
    }

    const amount = parseFloat(refillAmount);
    if (amount <= 0) {
      alert('Refill amount must be greater than 0');
      return;
    }

    updateTankLevel.mutate({
      fuel_type: selectedFuelType,
      refill_amount: amount,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedFuelType('');
    setRefillAmount('');
    setNotes('');
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getUtilizationBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 50) return 'secondary';
    if (percentage >= 20) return 'destructive';
    return 'destructive';
  };

  if (isLoading) {
    return <div>Loading tank inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tank Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tanks.map((tank) => {
          const utilization = getUtilizationPercentage(tank.fuel_type);
          return (
            <Card key={tank.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span className="capitalize">{tank.fuel_type}</span>
                  </div>
                  <Badge variant={getUtilizationBadgeColor(utilization)}>
                    {utilization.toFixed(1)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Level</span>
                    <span className={getUtilizationColor(utilization)}>
                      {tank.current_level.toFixed(2)}L
                    </span>
                  </div>
                  <Progress value={utilization} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0L</span>
                    <span>{tank.tank_capacity.toFixed(0)}L</span>
                  </div>
                </div>
                
                {tank.last_refill_date && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <div>Last Refill: {new Date(tank.last_refill_date).toLocaleDateString()}</div>
                    <div>Amount: {tank.last_refill_amount?.toFixed(2)}L</div>
                  </div>
                )}
                
                {utilization < 20 && (
                  <div className="flex items-center gap-2 text-red-600 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Low Fuel Alert</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Refill Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Refill Tank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRefill} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelType">Select Tank</Label>
                <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks.map((tank) => (
                      <SelectItem key={tank.id} value={tank.fuel_type}>
                        <div className="flex items-center justify-between w-full">
                          <span className="capitalize">{tank.fuel_type}</span>
                          <span className="text-muted-foreground ml-2">
                            {tank.current_level.toFixed(0)}L
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refillAmount">Refill Amount (Liters)</Label>
                <Input
                  id="refillAmount"
                  type="number"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {selectedFuelType && refillAmount && (
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Refill Preview</span>
                </div>
                <div className="text-sm space-y-1">
                  {(() => {
                    const tank = tanks.find(t => t.fuel_type === selectedFuelType);
                    const amount = parseFloat(refillAmount) || 0;
                    const newLevel = tank ? tank.current_level + amount : 0;
                    const newUtilization = tank ? (newLevel / tank.tank_capacity) * 100 : 0;
                    
                    return (
                      <>
                        <div>Current Level: {tank?.current_level.toFixed(2)}L</div>
                        <div>After Refill: {newLevel.toFixed(2)}L</div>
                        <div>New Utilization: {newUtilization.toFixed(1)}%</div>
                        {newLevel > (tank?.tank_capacity || 0) && (
                          <div className="text-red-600 font-medium">
                            ⚠️ Warning: Exceeds tank capacity!
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Supplier details, delivery notes, etc..."
                rows={3}
              />
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={isUpdating}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Refill Tank'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};