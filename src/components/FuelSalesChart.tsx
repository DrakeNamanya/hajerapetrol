
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Fuel } from 'lucide-react';

interface FuelSalesChartProps {
  className?: string;
}

export const FuelSalesChart: React.FC<FuelSalesChartProps> = ({ className }) => {
  // Weekly fuel sales data by fuel type
  const weeklyFuelData = [
    { day: 'Mon', petrol: 850000, diesel: 1200000, kerosene: 180000 },
    { day: 'Tue', petrol: 920000, diesel: 1350000, kerosene: 200000 },
    { day: 'Wed', petrol: 780000, diesel: 1100000, kerosene: 150000 },
    { day: 'Thu', petrol: 1100000, diesel: 1450000, kerosene: 220000 },
    { day: 'Fri', petrol: 1250000, diesel: 1600000, kerosene: 280000 },
    { day: 'Sat', petrol: 1400000, diesel: 1800000, kerosene: 320000 },
    { day: 'Sun', petrol: 900000, diesel: 1250000, kerosene: 190000 }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Weekly Fuel Sales Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            petrol: {
              label: "Petrol",
              color: "#ef4444",
            },
            diesel: {
              label: "Diesel",
              color: "#3b82f6",
            },
            kerosene: {
              label: "Kerosene",
              color: "#10b981",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyFuelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="petrol" fill="#ef4444" name="Petrol" />
              <Bar dataKey="diesel" fill="#3b82f6" name="Diesel" />
              <Bar dataKey="kerosene" fill="#10b981" name="Kerosene" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">
              UGX {weeklyFuelData.reduce((sum, day) => sum + day.petrol, 0).toLocaleString()}
            </div>
            <div className="text-sm text-red-600">Total Petrol Sales</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              UGX {weeklyFuelData.reduce((sum, day) => sum + day.diesel, 0).toLocaleString()}
            </div>
            <div className="text-sm text-blue-600">Total Diesel Sales</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              UGX {weeklyFuelData.reduce((sum, day) => sum + day.kerosene, 0).toLocaleString()}
            </div>
            <div className="text-sm text-green-600">Total Kerosene Sales</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
