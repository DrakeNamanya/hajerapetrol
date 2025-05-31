
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fuel } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FuelPOSProps {
  onSaleRecord: (sale: any) => void;
}

const fuelTypes = [
  { id: 'petrol_regular', name: 'Regular Petrol', price: 5800, available: 5000 },
  { id: 'petrol_premium', name: 'Premium Petrol', price: 6200, available: 3500 },
  { id: 'diesel', name: 'Diesel', price: 5400, available: 4200 },
  { id: 'kerosene', name: 'Kerosene', price: 4900, available: 2800 },
];

export const FuelPOS: React.FC<FuelPOSProps> = ({ onSaleRecord }) => {
  const [selectedFuel, setSelectedFuel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const selectedFuelData = fuelTypes.find(f => f.id === selectedFuel);
  const totalAmount = selectedFuelData ? parseFloat(quantity || '0') * selectedFuelData.price : 0;

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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
