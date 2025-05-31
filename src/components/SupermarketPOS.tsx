
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Package, Users, BarChart3, Search, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SupermarketPOSProps {
  onSaleRecord: (sale: any) => void;
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  category: string;
  price: number;
  stock: number;
  lowStockAlert: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  joinDate: string;
}

export const SupermarketPOS: React.FC<SupermarketPOSProps> = ({ onSaleRecord }) => {
  const [activeSection, setActiveSection] = useState('pos');
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Bananas", barcode: "1234567890", category: "Fruits & Vegetables", price: 3500, stock: 50, lowStockAlert: 10 },
    { id: 2, name: "Fresh Milk 1L", barcode: "2345678901", category: "Dairy & Eggs", price: 4200, stock: 25, lowStockAlert: 5 },
    { id: 3, name: "Bread Loaf", barcode: "3456789012", category: "Bakery", price: 3500, stock: 30, lowStockAlert: 8 },
    { id: 4, name: "Chicken Breast", barcode: "4567890123", category: "Meat & Seafood", price: 18500, stock: 15, lowStockAlert: 5 },
    { id: 5, name: "Orange Juice 1L", barcode: "5678901234", category: "Beverages", price: 6500, stock: 20, lowStockAlert: 5 }
  ]);
  
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: "John Mukasa", email: "john@email.com", phone: "0701234567", address: "Kampala, Uganda", loyaltyPoints: 250, joinDate: "2024-01-15" },
    { id: 2, name: "Sarah Nakato", email: "sarah@email.com", phone: "0707654321", address: "Entebbe, Uganda", loyaltyPoints: 180, joinDate: "2024-02-20" }
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Form states for adding new products/customers
  const [newProduct, setNewProduct] = useState({
    name: '', barcode: '', category: '', price: '', stock: '', lowStockAlert: ''
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '', email: '', phone: '', address: '', loyaltyPoints: ''
  });

  const categories = [
    "Fruits & Vegetables", "Dairy & Eggs", "Meat & Seafood", 
    "Bakery", "Beverages", "Snacks", "Household"
  ];

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { class: 'text-red-600', text: 'Out of Stock' };
    if (product.stock <= product.lowStockAlert) return { class: 'text-yellow-600', text: 'Low Stock' };
    return { class: 'text-green-600', text: 'In Stock' };
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode.includes(productSearch)
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "Error", description: "Product out of stock", variant: "destructive" });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        toast({ title: "Error", description: "Insufficient stock", variant: "destructive" });
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        const product = products.find(p => p.id === id);
        if (newQuantity > 0 && newQuantity <= (product?.stock || 0)) {
          return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTax = (subtotal: number) => subtotal * 0.18; // 18% VAT
  const calculateTotal = () => calculateSubtotal() + calculateTax(calculateSubtotal());

  const processPayment = () => {
    if (cart.length === 0) {
      toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Error", description: "Please select payment method", variant: "destructive" });
      return;
    }

    // Update stock
    setProducts(products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    }));

    const sale = {
      id: Date.now(),
      department: 'supermarket',
      type: 'supermarket_sale',
      customer: customerName || 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      total: calculateTotal(),
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(sale);
    setCart([]);
    setCustomerName('');
    setPaymentMethod('');

    toast({
      title: "Sale Completed",
      description: `Sale of ${formatCurrency(sale.total)} recorded successfully`,
    });
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (products.find(p => p.barcode === newProduct.barcode)) {
      toast({ title: "Error", description: "Product with this barcode already exists", variant: "destructive" });
      return;
    }

    const product: Product = {
      id: Math.max(...products.map(p => p.id)) + 1,
      name: newProduct.name,
      barcode: newProduct.barcode,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      lowStockAlert: parseInt(newProduct.lowStockAlert)
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', barcode: '', category: '', price: '', stock: '', lowStockAlert: '' });
    toast({ title: "Success", description: "Product added successfully" });
  };

  const addCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (customers.find(c => c.email === newCustomer.email)) {
      toast({ title: "Error", description: "Customer with this email already exists", variant: "destructive" });
      return;
    }

    const customer: Customer = {
      id: Math.max(...customers.map(c => c.id)) + 1,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      loyaltyPoints: parseInt(newCustomer.loyaltyPoints) || 0,
      joinDate: new Date().toISOString().split('T')[0]
    };

    setCustomers([...customers, customer]);
    setNewCustomer({ name: '', email: '', phone: '', address: '', loyaltyPoints: '' });
    toast({ title: "Success", description: "Customer added successfully" });
  };

  const renderNavTabs = () => (
    <div className="flex gap-2 mb-6 flex-wrap justify-center">
      {[
        { id: 'pos', label: 'POS System', icon: ShoppingCart },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'reports', label: 'Reports', icon: BarChart3 }
      ].map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          onClick={() => setActiveSection(id)}
          variant={activeSection === id ? "default" : "outline"}
          className={`flex items-center gap-2 ${activeSection === id ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          <Icon size={16} />
          {label}
        </Button>
      ))}
    </div>
  );

  const renderPOSSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart size={20} />
            Product Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products by name or barcode..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map(product => {
              const status = getStockStatus(product);
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50"
                >
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.category}</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${status.class} bg-gray-100`}>
                    Stock: {product.stock}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Customer Name (Optional)</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus size={16} />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus size={16} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (18%):</span>
                    <span>{formatCurrency(calculateTax(calculateSubtotal()))}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <Button
                  onClick={processPayment}
                  className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  disabled={cart.length === 0}
                >
                  Complete Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventorySection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addProduct} className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Barcode</Label>
              <Input
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (UGX)</Label>
              <Input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Low Stock Alert</Label>
              <Input
                type="number"
                value={newProduct.lowStockAlert}
                onChange={(e) => setNewProduct({...newProduct, lowStockAlert: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full">Add Product</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm">Total Products</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.stock <= p.lowStockAlert && p.stock > 0).length}
              </div>
              <div className="text-sm">Low Stock</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.stock === 0).length}
              </div>
              <div className="text-sm">Out of Stock</div>
            </div>
          </div>

          <div className="overflow-auto max-h-96">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 bg-gray-100">Name</th>
                  <th className="text-left p-2 bg-gray-100">Price</th>
                  <th className="text-left p-2 bg-gray-100">Stock</th>
                  <th className="text-left p-2 bg-gray-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-t">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{formatCurrency(product.price)}</td>
                      <td className="p-2">{product.stock}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class} bg-gray-100`}>
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomersSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addCustomer} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
              />
            </div>
            <div>
              <Label>Loyalty Points</Label>
              <Input
                type="number"
                value={newCustomer.loyaltyPoints}
                onChange={(e) => setNewCustomer({...newCustomer, loyaltyPoints: e.target.value})}
                defaultValue="0"
              />
            </div>
            <Button type="submit" className="w-full">Add Customer</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
              <div className="text-sm">Total Customers</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.loyaltyPoints >= 100).length}
              </div>
              <div className="text-sm">Loyal Customers</div>
            </div>
          </div>

          <div className="overflow-auto max-h-96">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 bg-gray-100">Name</th>
                  <th className="text-left p-2 bg-gray-100">Contact</th>
                  <th className="text-left p-2 bg-gray-100">Loyalty</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id} className="border-t">
                    <td className="p-2">{customer.name}</td>
                    <td className="p-2">{customer.phone}</td>
                    <td className="p-2">{customer.loyaltyPoints} points</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{products.length}</div>
              <div className="text-gray-600">Total Products</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {products.filter(p => p.stock <= p.lowStockAlert && p.stock > 0).length}
                </div>
                <div className="text-sm">Low Stock Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stock === 0).length}
                </div>
                <div className="text-sm">Out of Stock</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alert</CardTitle>
        </CardHeader>
        <CardContent>
          {products.filter(p => p.stock <= p.lowStockAlert).length === 0 ? (
            <div className="text-center text-gray-500 py-8">No stock alerts</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.filter(p => p.stock <= p.lowStockAlert).map(product => (
                <div 
                  key={product.id}
                  className="flex justify-between items-center p-2 bg-yellow-50 border-l-4 border-yellow-500 rounded"
                >
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-gray-600">{product.category}</div>
                  </div>
                  <div className="text-sm font-bold text-yellow-600">
                    {product.stock} left
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{customers.length}</div>
              <div className="text-gray-600">Total Customers</div>
            </div>
            <div className="text-center pt-4 border-t">
              <div className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.loyaltyPoints >= 100).length}
              </div>
              <div className="text-sm">Loyal Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <ShoppingCart className="h-6 w-6" />
            SuperMart POS System
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderNavTabs()}
          
          {activeSection === 'pos' && renderPOSSection()}
          {activeSection === 'inventory' && renderInventorySection()}
          {activeSection === 'customers' && renderCustomersSection()}
          {activeSection === 'reports' && renderReportsSection()}
        </CardContent>
      </Card>
    </div>
  );
};
