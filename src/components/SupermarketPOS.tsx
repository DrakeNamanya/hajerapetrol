
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SupermarketPOSProps {
  onSaleRecord: (sale: any) => void;
}

const products = [
  { id: 'bread', name: 'Bread Loaf', price: 3500, stock: 50 },
  { id: 'milk', name: 'Fresh Milk 1L', price: 4200, stock: 30 },
  { id: 'rice', name: 'Rice 1kg', price: 6500, stock: 100 },
  { id: 'sugar', name: 'Sugar 1kg', price: 4800, stock: 80 },
  { id: 'cooking_oil', name: 'Cooking Oil 1L', price: 8500, stock: 40 },
  { id: 'soap', name: 'Bar Soap', price: 2500, stock: 60 },
  { id: 'detergent', name: 'Detergent 500g', price: 7200, stock: 25 },
  { id: 'tea_leaves', name: 'Tea Leaves 250g', price: 5500, stock: 35 },
];

interface CartItem {
  product: typeof products[0];
  quantity: number;
  total: number;
}

export const SupermarketPOS: React.FC<SupermarketPOSProps> = ({ onSaleRecord }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const addToCart = () => {
    if (!selectedProduct || !quantity) {
      toast({
        title: "Error",
        description: "Please select a product and quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    const quantityNum = parseInt(quantity);

    if (!product || quantityNum <= 0 || quantityNum > product.stock) {
      toast({
        title: "Error",
        description: "Invalid quantity or insufficient stock",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.product.id === selectedProduct);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantityNum;
      if (newQuantity > product.stock) {
        toast({
          title: "Error",
          description: "Total quantity exceeds available stock",
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item => 
        item.product.id === selectedProduct 
          ? { ...item, quantity: newQuantity, total: newQuantity * product.price }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: quantityNum,
        total: quantityNum * product.price
      }]);
    }

    setSelectedProduct('');
    setQuantity('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const handleSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
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
      department: 'supermarket',
      type: 'supermarket_sale',
      customer: customerName || 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.total
      })),
      total: totalAmount,
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(sale);
    
    // Reset form
    setCart([]);
    setCustomerName('');
    setPaymentMethod('');

    toast({
      title: "Sale Recorded",
      description: `Supermarket sale of UGX ${totalAmount.toLocaleString()} recorded successfully`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <ShoppingCart className="h-6 w-6" />
            Supermarket POS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - UGX {product.price.toLocaleString()}
                    </SelectItem>
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
              <Button onClick={addToCart} className="w-full bg-green-600 hover:bg-green-700">
                Add to Cart
              </Button>
            </div>
          </div>

          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shopping Cart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          {item.quantity} × UGX {item.product.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">UGX {item.total.toLocaleString()}</span>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">UGX {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
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

          <Button 
            onClick={handleSale}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={cart.length === 0}
          >
            Complete Sale
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
