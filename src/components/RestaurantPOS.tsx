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

  // Menu items organized by category with UGX prices
  const menuItems = {
    appetizers: [
      { id: 1, name: 'Chicken Wings', price: 25000, category: 'appetizers', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300&h=200&fit=crop&crop=center', description: 'Crispy buffalo wings with celery' },
      { id: 2, name: 'Samosas', price: 15000, category: 'appetizers', image: 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=300&h=200&fit=crop&crop=center', description: 'Golden fried with dipping sauce' },
      { id: 3, name: 'Garden Salad', price: 18000, category: 'appetizers', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop&crop=center', description: 'Fresh romaine with parmesan' },
      { id: 4, name: 'Spring Rolls', price: 20000, category: 'appetizers', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&h=200&fit=crop&crop=center', description: 'Vegetable spring rolls with sauce' }
    ],
    mains: [
      { id: 5, name: 'Grilled Tilapia', price: 45000, category: 'mains', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop&crop=center', description: 'Fresh tilapia with lemon butter' },
      { id: 6, name: 'Beef Stew', price: 35000, category: 'mains', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&crop=center', description: 'Tender beef with vegetables' },
      { id: 7, name: 'Chicken Curry', price: 30000, category: 'mains', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop&crop=center', description: 'Spiced chicken with rice' },
      { id: 8, name: 'Pork Ribs', price: 40000, category: 'mains', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop&crop=center', description: 'BBQ ribs with fries' },
      { id: 9, name: 'Vegetable Rice', price: 25000, category: 'mains', image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=300&h=200&fit=crop&crop=center', description: 'Mixed vegetables with rice' }
    ],
    desserts: [
      { id: 10, name: 'Chocolate Cake', price: 12000, category: 'desserts', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop&crop=center', description: 'Rich chocolate ganache layer cake' },
      { id: 11, name: 'Ice Cream', price: 8000, category: 'desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop&crop=center', description: 'Vanilla ice cream with toppings' },
      { id: 12, name: 'Fruit Salad', price: 10000, category: 'desserts', image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300&h=200&fit=crop&crop=center', description: 'Fresh seasonal fruits' }
    ],
    beverages: [
      { id: 13, name: 'Soft Drink', price: 3000, category: 'beverages', image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=300&h=200&fit=crop&crop=center', description: 'Coke, Pepsi, Sprite, Orange' },
      { id: 14, name: 'Coffee', price: 5000, category: 'beverages', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop&crop=center', description: 'Freshly brewed coffee' },
      { id: 15, name: 'Fresh Juice', price: 8000, category: 'beverages', image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&h=200&fit=crop&crop=center', description: 'Orange, Apple, Cranberry' },
      { id: 16, name: 'Local Beer', price: 6000, category: 'beverages', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=200&fit=crop&crop=center', description: 'Local draft and bottled options' }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Menu</h2>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-3 mb-8 border-b">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-4 rounded-t-lg font-medium transition-colors text-lg ${
                      selectedCategory === category.id
                        ? 'bg-amber-600 text-white border-b-4 border-amber-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-3 text-xl">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {menuItems[selectedCategory].map(item => (
                  <div
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className="border-2 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer hover:border-amber-400 bg-white hover:scale-105 active:scale-95"
                    style={{ minHeight: '320px' }}
                  >
                    {/* Food Image */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml;base64,${btoa(`
                            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                              <rect width="100%" height="100%" fill="#f3f4f6"/>
                              <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial" font-size="14">
                                ${item.name}
                              </text>
                            </svg>
                          `)}`;
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full p-2 shadow-md">
                        <Plus className="text-amber-600" size={24} />
                      </div>
                    </div>
                    
                    {/* Item Details */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
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
                  <h1 className="text-xl font-bold text-gray-800">HAJARA FUEL STATION</h1>
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
