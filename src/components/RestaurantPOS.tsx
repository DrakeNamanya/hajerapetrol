import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Trash2, DollarSign, Clock, Users, ShoppingCart, Receipt, CreditCard, Banknote, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MenuManager } from "./MenuManager";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
}

interface RestaurantPOSProps {
  onSaleRecord: (sale: any) => void;
}

export const RestaurantPOS: React.FC<RestaurantPOSProps> = ({ onSaleRecord }) => {
  const [currentOrder, setCurrentOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Main Course');
  const [orders, setOrders] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [orderNumber, setOrderNumber] = useState(1001);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [dailyOrdersSubmitted, setDailyOrdersSubmitted] = useState(false);
  const [submissionDate, setSubmissionDate] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  // Initial menu items that match MenuManager structure
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'Ugali & Beef', category: 'Main Course', price: 12000, description: 'Traditional ugali served with tender beef stew', available: true },
    { id: '2', name: 'Rice & Chicken', category: 'Main Course', price: 15000, description: 'Steamed rice with grilled chicken', available: true },
    { id: '3', name: 'Fish & Chips', category: 'Main Course', price: 18000, description: 'Fresh fish with crispy chips', available: true },
    { id: '4', name: 'Rolex', category: 'Fast Food', price: 3000, description: 'Egg rolled in chapati with vegetables', available: true },
    { id: '5', name: 'Samosa', category: 'Snacks', price: 1500, description: 'Crispy pastry with savory filling', available: true },
    { id: '6', name: 'Soda', category: 'Beverages', price: 2500, description: 'Assorted soft drinks', available: true },
  ]);

  const categories = ['Main Course', 'Fast Food', 'Snacks', 'Beverages', 'Desserts'];

  const handleMenuUpdate = (updatedItems: MenuItem[]) => {
    setMenuItems(updatedItems);
  };

  const getItemsByCategory = (category: string) => {
    return menuItems.filter(item => item.category === category && item.available);
  };

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

  const calculateTax = (subtotal) => {
    return subtotal * 0.18; // 18% VAT
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  const processPayment = () => {
    if (currentOrder.length === 0) return;

    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = calculateTotal();

    const newOrder = {
      id: orderNumber,
      items: [...currentOrder],
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) || 0 : total,
      change: paymentMethod === 'cash' ? Math.max(0, (parseFloat(amountReceived) || 0) - total) : 0,
      timestamp: new Date(),
      tableNumber: tableNumber || 'N/A',
      customerName: customerName || 'Walk-in Customer',
      status: 'completed'
    };

    // Record sale for approval system
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
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentMethod,
      amountReceived: newOrder.amountReceived,
      change: newOrder.change,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(sale);
    setOrders([newOrder, ...orders]);
    setCurrentReceipt(newOrder);
    setShowReceipt(true);
    setCurrentOrder([]);
    setShowPayment(false);
    setAmountReceived('');
    setTableNumber('');
    setCustomerName('');
    setOrderNumber(orderNumber + 1);

    toast({
      title: "Order Processed",
      description: `Restaurant order of ${formatCurrency(total)} processed successfully`,
    });
  };

  const printReceipt = () => {
    window.print();
  };

  const viewReceipt = (order) => {
    setCurrentReceipt(order);
    setShowReceipt(true);
  };

  const getTodaysOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => order.timestamp.toDateString() === today);
  };

  const getDailyTotal = () => {
    return getTodaysOrders().reduce((total, order) => total + order.total, 0);
  };

  const submitDailyOrders = () => {
    setDailyOrdersSubmitted(true);
    setSubmissionDate(new Date());
    toast({
      title: "Daily Orders Submitted",
      description: "Orders have been submitted to accountant for approval",
    });
  };

  const resetDailySubmission = () => {
    setDailyOrdersSubmitted(false);
    setSubmissionDate(null);
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
              <div className="flex items-center gap-1">
                <Users size={16} />
                Order #{orderNumber}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pos">Point of Sale</TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Settings size={16} />
              Menu Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Menu Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Menu</h2>
                  
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-3 mb-8 border-b">
                    {categories.map(category => {
                      const categoryItems = getItemsByCategory(category);
                      const categoryIcon = {
                        'Main Course': '🍖',
                        'Fast Food': '🍔',
                        'Snacks': '🥗',
                        'Beverages': '🥤',
                        'Desserts': '🍰'
                      }[category] || '🍽️';

                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          disabled={categoryItems.length === 0}
                          className={`px-6 py-4 rounded-t-lg font-medium transition-colors text-lg ${
                            selectedCategory === category
                              ? 'bg-amber-600 text-white border-b-4 border-amber-600'
                              : categoryItems.length === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="mr-3 text-xl">{categoryIcon}</span>
                          {category}
                          {categoryItems.length === 0 && ' (Empty)'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Menu Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getItemsByCategory(selectedCategory).length === 0 ? (
                      <div className="col-span-full text-center py-12 text-gray-500">
                        <p>No items available in this category</p>
                        <p className="text-sm mt-2">Use Menu Management to add items</p>
                      </div>
                    ) : (
                      getItemsByCategory(selectedCategory).map(item => (
                        <div
                          key={item.id}
                          onClick={() => addToOrder(item)}
                          className="border-2 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer hover:border-amber-400 bg-white hover:scale-105 active:scale-95"
                          style={{ minHeight: '280px' }}
                        >
                          {/* Item Details */}
                          <div className="p-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                              <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                <Plus size={16} />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 flex-1">{item.description}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-2xl font-bold text-amber-600">
                                {formatCurrency(item.price)}
                              </p>
                              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                                Tap to Add
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(calculateSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax (18%):</span>
                          <span>{formatCurrency(calculateTax(calculateSubtotal()))}</span>
                        </div>
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

                {/* Daily Orders Summary */}
                {orders.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Today's Orders Summary</h2>
                      <span className="text-sm text-gray-500">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                      {getTodaysOrders().map((order, index) => (
                        <div key={order.id}>
                          <div className="flex justify-between items-center py-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Order #{order.id}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  Table {order.tableNumber}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {order.timestamp.toLocaleTimeString()} | 
                                {order.paymentMethod === 'cash' ? ' Cash' : ' Card'} | 
                                {order.items.length} items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                {formatCurrency(order.total)}
                              </p>
                              <button
                                onClick={() => viewReceipt(order)}
                                className="text-xs text-amber-600 hover:text-amber-800 underline mt-1"
                              >
                                View Receipt
                              </button>
                            </div>
                          </div>
                          {index < getTodaysOrders().length - 1 && (
                            <hr className="border-gray-200" />
                          )}
                        </div>
                      ))}
                    </div>

                    {getTodaysOrders().length > 0 && (
                      <>
                        <hr className="border-gray-300 border-2 my-4" />
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-lg font-bold text-amber-800">
                              Daily Total:
                            </span>
                            <span className="text-xl font-bold text-amber-800">
                              {formatCurrency(getDailyTotal())}
                            </span>
                          </div>
                          <div className="text-sm text-amber-600 mb-4">
                            Total Orders: {getTodaysOrders().length} | 
                            Cash: {getTodaysOrders().filter(o => o.paymentMethod === 'cash').length} | 
                            Card: {getTodaysOrders().filter(o => o.paymentMethod === 'card').length}
                          </div>
                          
                          {!dailyOrdersSubmitted ? (
                            <button
                              onClick={submitDailyOrders}
                              className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Receipt size={16} />
                              Submit to Accountant for Approval
                            </button>
                          ) : (
                            <div className="text-center">
                              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-2">
                                ✅ Submitted to Accountant
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                Submitted on: {submissionDate?.toLocaleString()}
                              </p>
                              <button
                                onClick={resetDailySubmission}
                                className="text-sm text-amber-600 hover:text-amber-800 underline"
                              >
                                Reset Submission (Demo)
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {getTodaysOrders().length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <p>No orders processed today yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <MenuManager onMenuUpdate={handleMenuUpdate} />
          </TabsContent>
        </Tabs>

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

                {paymentMethod === 'cash' && (
                  <div>
                    <Label>Amount Received</Label>
                    <Input
                      type="number"
                      step="1"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="0"
                      className="mt-2"
                    />
                    {amountReceived && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-sm text-green-700">
                          Change: {formatCurrency(Math.max(0, parseFloat(amountReceived) - calculateTotal()))}
                        </p>
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < calculateTotal())}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Complete Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && currentReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Receipt Content */}
              <div id="receipt-content" className="receipt-print">
                <div className="text-center mb-6">
                  <div className="flex justify-center items-center mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800">HIPEMART OILS</h1>
                  <h2 className="text-lg font-semibold text-orange-600">BUSIA</h2>
                  <p className="text-sm text-gray-600">RESTAURANT DEPARTMENT</p>
                  <div className="border-t border-gray-300 my-3"></div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Order #:</span>
                    <span className="font-medium">{currentReceipt.id}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer:</span>
                    <span className="font-medium">{currentReceipt.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Table:</span>
                    <span className="font-medium">{currentReceipt.tableNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Date:</span>
                    <span className="font-medium">{currentReceipt.timestamp.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time:</span>
                    <span className="font-medium">{currentReceipt.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="border-t border-gray-300 my-3"></div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold mb-2 text-center">ITEMS</h3>
                  {currentReceipt.items.map((item, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between">
                        <span className="truncate flex-1">{item.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{item.quantity} x {formatCurrency(item.price)}</span>
                        <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 my-3"></div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(currentReceipt.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tax (18%):</span>
                    <span>{formatCurrency(currentReceipt.tax)}</span>
                  </div>
                  <div className="border-t border-gray-300 my-2"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(currentReceipt.total)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Payment Method:</span>
                    <span className="capitalize font-medium">{currentReceipt.paymentMethod}</span>
                  </div>
                  {currentReceipt.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Amount Received:</span>
                        <span>{formatCurrency(currentReceipt.amountReceived)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Change:</span>
                        <span>{formatCurrency(currentReceipt.change)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-300 my-3"></div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>Thank you for your business!</p>
                  <p>Visit us again soon</p>
                  <div className="text-xs text-gray-500 mt-3">
                    <p>Powered by</p>
                    <p className="font-semibold text-orange-600">DATACOLLECTORS LTD</p>
                    <p>0701634653</p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-4 mt-4 border-t no-print">
                <Button
                  variant="outline"
                  onClick={() => setShowReceipt(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={printReceipt}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  <Receipt size={16} className="mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-print, .receipt-print * {
              visibility: visible;
            }
            .receipt-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              font-size: 12px;
              line-height: 1.4;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
