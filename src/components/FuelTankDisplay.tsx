import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Fuel, AlertTriangle, Gauge } from "lucide-react";
import { useFuelTankInventory } from '@/hooks/useFuelTankInventory';

interface FuelTankDisplayProps {
  showTitle?: boolean;
  compact?: boolean;
}

export const FuelTankDisplay: React.FC<FuelTankDisplayProps> = ({ 
  showTitle = true, 
  compact = false 
}) => {
  const { 
    tanks, 
    isLoading, 
    getUtilizationPercentage,
    getTotalCapacity,
    getTotalCurrentLevel
  } = useFuelTankInventory();

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
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading tank levels...</div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {tanks.map((tank) => {
          const utilization = getUtilizationPercentage(tank.fuel_type);
          return (
            <div key={tank.id} className="text-center">
              <div className="text-xs font-medium capitalize mb-1">{tank.fuel_type}</div>
              <Progress value={utilization} className="h-2 mb-1" />
              <div className="text-xs text-muted-foreground">
                {tank.current_level.toFixed(0)}L
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            Fuel Tank Levels
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Total Inventory</span>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {getTotalCurrentLevel().toFixed(0)}L / {getTotalCapacity().toFixed(0)}L
              </div>
              <div className="text-xs text-muted-foreground">
                {((getTotalCurrentLevel() / getTotalCapacity()) * 100).toFixed(1)}% Full
              </div>
            </div>
          </div>
        </div>

        {/* Individual Tanks */}
        <div className="space-y-3">
          {tanks.map((tank) => {
            const utilization = getUtilizationPercentage(tank.fuel_type);
            return (
              <div key={tank.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span className="font-medium capitalize">{tank.fuel_type}</span>
                    {utilization < 20 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${getUtilizationColor(utilization)}`}>
                      {tank.current_level.toFixed(0)}L
                    </span>
                    <Badge variant={getUtilizationBadgeColor(utilization)} className="text-xs">
                      {utilization.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={utilization} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Capacity: {tank.tank_capacity.toFixed(0)}L</span>
                  {tank.last_refill_date && (
                    <span>Last refill: {new Date(tank.last_refill_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Low Fuel Alerts */}
        {tanks.some(tank => getUtilizationPercentage(tank.fuel_type) < 20) && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Low Fuel Alerts</span>
            </div>
            <div className="space-y-1">
              {tanks
                .filter(tank => getUtilizationPercentage(tank.fuel_type) < 20)
                .map(tank => (
                  <div key={tank.id} className="text-sm text-red-700">
                    • {tank.fuel_type.toUpperCase()}: {tank.current_level.toFixed(0)}L remaining
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};