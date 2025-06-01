
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fuel, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface FuelPOSProps {
  onSaleRecord: (sale: any) => void;
}

const initialFuelTypes = [
  { id: 'petrol_regular', name: 'Regular Petrol', price: 5800, available: 5000, totalInventory: 5000 },
  { id: 'petrol_premium', name: 'Premium Petrol', price: 6200, available: 3500, totalInventory: 3500 },
  { id: 'diesel', name: 'Diesel', price: 5400, available: 4200, totalInventory: 4200 },
  { id: 'kerosene', name: 'Kerosene', price: 4900, available: 2800, totalInventory: 2800 },
];

const weeklyData = [
  { day: 'Mon', sales: 2500000 },
  { day: 'Tue', sales: 3200000 },
  { day: 'Wed', sales: 2800000 },
  { day: 'Thu', sales: 3500000 },
  { day: 'Fri', sales: 4200000 },
  { day: 'Sat', sales: 3800000 },
  { day: 'Sun', sales: 3100000 },
];

export const FuelPOS: React.FC<FuelPOSProps> = ({ onSaleRecord }) => {
  const [fuelTypes, setFuelTypes] = useState(initialFuelTypes);
  const [selectedFuel, setSelectedFuel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [salesSubmitted, setSalesSubmitted] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  const selectedFuelData = fuelTypes.find(f => f.id === selectedFuel);
  const totalAmount = selectedFuelData ? parseFloat(quantity || '0') * selectedFuelData.price : 0;
  const dailyTotal = dailySales.reduce((sum, sale) => sum + sale.total, 0);

  const handleSale = () => {
    if (!selectedFuel || !quantity || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (quantityNum <= 0 || quantityNum > (selectedFuelData?.available || 0)) {
      toast({
        title: "Error",
        description: "Invalid quantity or insufficient stock",
        variant: "destructive",
      });
      return;
    }

    // Update fuel inventory
    setFuelTypes(prev => prev.map(fuel => 
      fuel.id === selectedFuel 
        ? { ...fuel, available: fuel.available - quantityNum }
        : fuel
    ));

    const sale = {
      id: Date.now(),
      department: 'fuel',
      type: 'fuel_sale',
      customer: customerName || 'Walk-in Customer',
      items: [{
        name: selectedFuelData?.name,
        quantity: quantityNum,
        price: selectedFuelData?.price,
        total: totalAmount
      }],
      total: totalAmount,
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    // Add to daily sales
    setDailySales(prev => [...prev, sale]);

    onSaleRecord(sale);
    
    // Reset form
    setSelectedFuel('');
    setQuantity('');
    setCustomerName('');
    setPaymentMethod('');

    toast({
      title: "Sale Recorded",
      description: `Fuel sale of UGX ${totalAmount.toLocaleString()} recorded successfully`,
    });
  };

  const submitDailySales = () => {
    if (dailySales.length === 0) {
      toast({
        title: "No Sales",
        description: "No sales to submit today",
        variant: "destructive",
      });
      return;
    }

    setSalesSubmitted(true);
    setApprovalStatus('pending');
    
    toast({
      title: "Sales Submitted",
      description: "Daily sales have been submitted to accountant for approval",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Fuel className="h-6 w-6" />
            Fuel Station POS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {fuelTypes.map(fuel => (
                    <SelectItem key={fuel.id} value={fuel.id}>
                      {fuel.name} - UGX {fuel.price.toLocaleString()}/L
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity (Liters)</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Name (Optional)</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFuelData && quantity && (
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-orange-600">UGX {totalAmount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Available: {selectedFuelData.available.toLocaleString()}L
              </div>
            </div>
          )}

          <Button 
            onClick={handleSale}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            Record Sale
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Sales Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sales: {
                label: "Sales",
                color: "#f97316",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: "#f97316" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Daily Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Today's Total Sales:</span>
              <span className="text-orange-600">UGX {dailyTotal.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {dailySales.length} transactions completed
            </p>
          </div>

          {dailySales.length > 0 && (
            <div className="mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.timestamp.toLocaleTimeString()}</TableCell>
                      <TableCell>{sale.items[0]?.name}</TableCell>
                      <TableCell>{sale.items[0]?.quantity}L</TableCell>
                      <TableCell>UGX {sale.total.toLocaleString()}</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <hr className="my-4 border-gray-300" />

          {!salesSubmitted ? (
            <Button 
              onClick={submitDailySales}
              className="w-full"
              disabled={dailySales.length === 0}
            >
              Submit Daily Sales to Accountant
            </Button>
          ) : (
            <div className="text-center">
              <Badge variant={approvalStatus === 'approved' ? 'default' : approvalStatus === 'rejected' ? 'destructive' : 'secondary'}>
                {approvalStatus === 'pending' && 'Awaiting Accountant Approval'}
                {approvalStatus === 'approved' && 'Approved by Accountant'}
                {approvalStatus === 'rejected' && 'Rejected by Accountant'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Fuel Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-700">Current Fuel Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {fuelTypes.map(fuel => (
              <div key={fuel.id} className="bg-gradient-to-r from-orange-100 to-red-100 p-3 rounded-lg">
                <h4 className="font-semibold text-orange-800">{fuel.name}</h4>
                <p className="text-lg font-bold text-orange-600">{fuel.available.toLocaleString()}L</p>
                <p className="text-sm text-gray-600">UGX {fuel.price.toLocaleString()}/L</p>
                <p className="text-xs text-gray-500">
                  Sold: {(fuel.totalInventory - fuel.available).toLocaleString()}L
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
