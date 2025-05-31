
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Restaurant } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RestaurantPOSProps {
  onSaleRecord: (sale: any) => void;
}

const menuItems = [
  { id: 'rice_beans', name: 'Rice & Beans', price: 8500, category: 'Main Dish' },
  { id: 'matooke', name: 'Matooke', price: 7000, category: 'Main Dish' },
  { id: 'posho', name: 'Posho', price: 5500, category: 'Main Dish' },
  { id: 'chicken', name: 'Grilled Chicken', price: 15000, category: 'Protein' },
  { id: 'beef', name: 'Beef Stew', price: 12000, category: 'Protein' },
  { id: 'fish', name: 'Fried Fish', price: 18000, category: 'Protein' },
  { id: 'vegetables', name: 'Mixed Vegetables', price: 6000, category: 'Vegetables' },
  { id: 'salad', name: 'Garden Salad', price: 4500, category: 'Vegetables' },
  { id: 'soda', name: 'Soda', price: 2500, category: 'Beverages' },
  { id: 'juice', name: 'Fresh Juice', price: 4000, category: 'Beverages' },
  { id: 'water', name: 'Bottled Water', price: 1500, category: 'Beverages' },
];

interface OrderItem {
  item: typeof menuItems[0];
  quantity: number;
  total: number;
}

export const RestaurantPOS: React.FC<RestaurantPOSProps> = ({ onSaleRecord }) => {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const addToOrder = () => {
    if (!selectedItem || !quantity) {
      toast({
        title: "Error",
        description: "Please select an item and quantity",
        variant: "destructive",
      });
      return;
    }

    const item = menuItems.find(m => m.id === selectedItem);
    const quantityNum = parseInt(quantity);

    if (!item || quantityNum <= 0) {
      toast({
        title: "Error",
        description: "Invalid selection or quantity",
        variant: "destructive",
      });
      return;
    }

    const existingItem = order.find(orderItem => orderItem.item.id === selectedItem);
    
    if (existingItem) {
      setOrder(order.map(orderItem => 
        orderItem.item.id === selectedItem 
          ? { 
              ...orderItem, 
              quantity: orderItem.quantity + quantityNum, 
              total: (orderItem.quantity + quantityNum) * item.price 
            }
          : orderItem
      ));
    } else {
      setOrder([...order, {
        item,
        quantity: quantityNum,
        total: quantityNum * item.price
      }]);
    }

    setSelectedItem('');
    setQuantity('');
  };

  const removeFromOrder = (itemId: string) => {
    setOrder(order.filter(orderItem => orderItem.item.id !== itemId));
  };

  const totalAmount = order.reduce((sum, orderItem) => sum + orderItem.total, 0);

  const handleSale = () => {
    if (order.length === 0) {
      toast({
        title: "Error",
        description: "Order is empty",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select payment method",
        variant: "destructive",
      });
      return;
    }

    const sale = {
      id: Date.now(),
      department: 'restaurant',
      type: 'restaurant_sale',
      customer: customerName || 'Walk-in Customer',
      tableNumber: tableNumber || 'N/A',
      items: order.map(orderItem => ({
        name: orderItem.item.name,
        quantity: orderItem.quantity,
        price: orderItem.item.price,
        total: orderItem.total,
        category: orderItem.item.category
      })),
      total: totalAmount,
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(sale);
    
    // Reset form
    setOrder([]);
    setCustomerName('');
    setTableNumber('');
    setPaymentMethod('');

    toast({
      title: "Order Recorded",
      description: `Restaurant order of UGX ${totalAmount.toLocaleString()} recorded successfully`,
    });
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Restaurant className="h-6 w-6" />
            Restaurant POS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Menu Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {categories.map(category => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-600 bg-gray-100">
                        {category}
                      </div>
                      {menuItems
                        .filter(item => item.category === category)
                        .map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - UGX {item.price.toLocaleString()}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={addToOrder} className="w-full bg-amber-600 hover:bg-amber-700">
                Add to Order
              </Button>
            </div>
          </div>

          {order.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.map(orderItem => (
                    <div key={orderItem.item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{orderItem.item.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          {orderItem.quantity} × UGX {orderItem.item.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-amber-600 ml-2 px-1 py-0.5 bg-amber-100 rounded">
                          {orderItem.item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">UGX {orderItem.total.toLocaleString()}</span>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeFromOrder(orderItem.item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-amber-600">UGX {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Customer Name (Optional)</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Table Number (Optional)</Label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table #"
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

          <Button 
            onClick={handleSale}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            disabled={order.length === 0}
          >
            Complete Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
