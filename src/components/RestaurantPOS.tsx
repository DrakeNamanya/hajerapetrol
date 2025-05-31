
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, DollarSign, Clock, Users, ShoppingCart, Receipt, CreditCard, Banknote } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RestaurantPOSProps {
  onSaleRecord: (sale: any) => void;
}

export const RestaurantPOS: React.FC<RestaurantPOSProps> = ({ onSaleRecord }) => {
  const [currentOrder, setCurrentOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('appetizers');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Menu items organized by category with UGX prices
  const menuItems = {
    appetizers: [
      { id: 1, name: 'Chicken Wings', price: 25000, category: 'appetizers' },
      { id: 2, name: 'Samosas', price: 15000, category: 'appetizers' },
      { id: 3, name: 'Garden Salad', price: 18000, category: 'appetizers' },
      { id: 4, name: 'Spring Rolls', price: 20000, category: 'appetizers' }
    ],
    mains: [
      { id: 5, name: 'Grilled Tilapia', price: 45000, category: 'mains' },
      { id: 6, name: 'Beef Stew', price: 35000, category: 'mains' },
      { id: 7, name: 'Chicken Curry', price: 30000, category: 'mains' },
      { id: 8, name: 'Pork Ribs', price: 40000, category: 'mains' },
      { id: 9, name: 'Vegetable Rice', price: 25000, category: 'mains' }
    ],
    desserts: [
      { id: 10, name: 'Chocolate Cake', price: 12000, category: 'desserts' },
      { id: 11, name: 'Ice Cream', price: 8000, category: 'desserts' },
      { id: 12, name: 'Fruit Salad', price: 10000, category: 'desserts' }
    ],
    beverages: [
      { id: 13, name: 'Soft Drink', price: 3000, category: 'beverages' },
      { id: 14, name: 'Coffee', price: 5000, category: 'beverages' },
      { id: 15, name: 'Fresh Juice', price: 8000, category: 'beverages' },
      { id: 16, name: 'Local Beer', price: 6000, category: 'beverages' }
    ]
  };

  const categories = [
    { id: 'appetizers', name: 'Appetizers', icon: '🥗' },
    { id: 'mains', name: 'Main Dishes', icon: '🍖' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' }
  ];

  const addToOrder = (item) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromOrder = (id) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // No tax for simplicity
  };

  const formatCurrency = (amount) => {
    return `UGX ${Math.round(amount).toLocaleString()}`;
  };

  const processPayment = () => {
    if (currentOrder.length === 0) return;

    const sale = {
      id: Date.now(),
      department: 'restaurant',
      type: 'restaurant_sale',
      customer: customerName || 'Walk-in Customer',
      tableNumber: tableNumber || 'N/A',
      items: currentOrder.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        category: item.category
      })),
      total: calculateTotal(),
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(sale);
    
    // Reset form
    setCurrentOrder([]);
    setShowPayment(false);
    setAmountReceived('');
    setTableNumber('');
    setCustomerName('');

    toast({
      title: "Order Recorded",
      description: `Restaurant order of ${formatCurrency(calculateTotal())} recorded successfully`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="text-amber-600" />
              Restaurant POS System
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Menu</h2>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-amber-600 text-white border-b-2 border-amber-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems[selectedCategory].map(item => (
                  <div
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-amber-300 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-lg font-bold text-amber-600 mt-2">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <Plus className="text-amber-600 ml-2 flex-shrink-0" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="space-y-6">
            {/* Customer and Table Info */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="tableNumber">Table Number (Optional)</Label>
                <Input
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                />
              </div>
            </div>

            {/* Current Order */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart size={20} />
                Current Order
              </h2>

              {currentOrder.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items added yet</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {currentOrder.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeFromOrder(item.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 text-red-600 hover:bg-red-100 flex items-center justify-center ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-amber-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  >
                    <DollarSign size={20} className="mr-2" />
                    Process Payment
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Process Payment</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        paymentMethod === 'cash'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Banknote size={20} />
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        paymentMethod === 'card'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CreditCard size={20} />
                      Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mobile')}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        paymentMethod === 'mobile'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      📱
                      Mobile
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPayment(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={processPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Complete Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
