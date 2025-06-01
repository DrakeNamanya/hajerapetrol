
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, BarChart3, Search, Plus, Minus, Trash2, Scan, Receipt as ReceiptIcon, TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Receipt } from './Receipt';

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
  expiryDate?: string;
  salesCount?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Sale {
  id: number;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
}

export const SupermarketPOS: React.FC<SupermarketPOSProps> = ({ onSaleRecord }) => {
  const [activeSection, setActiveSection] = useState('pos');
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Bananas", barcode: "1234567890", category: "Fruits & Vegetables", price: 3500, stock: 50, lowStockAlert: 10, expiryDate: "2024-12-25", salesCount: 45 },
    { id: 2, name: "Fresh Milk 1L", barcode: "2345678901", category: "Dairy & Eggs", price: 4200, stock: 25, lowStockAlert: 5, expiryDate: "2024-12-20", salesCount: 32 },
    { id: 3, name: "Bread Loaf", barcode: "3456789012", category: "Bakery", price: 3500, stock: 30, lowStockAlert: 8, expiryDate: "2024-12-18", salesCount: 28 },
    { id: 4, name: "Chicken Breast", barcode: "4567890123", category: "Meat & Seafood", price: 18500, stock: 15, lowStockAlert: 5, expiryDate: "2024-12-19", salesCount: 15 },
    { id: 5, name: "Orange Juice 1L", barcode: "5678901234", category: "Beverages", price: 6500, stock: 20, lowStockAlert: 5, expiryDate: "2024-12-30", salesCount: 8 }
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [barcodeInput, setBarco deInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [salesSubmitted, setSalesSubmitted] = useState(false);
  const [submissionDate, setSubmissionDate] = useState<Date | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  
  // Form states for adding new products
  const [newProduct, setNewProduct] = useState({
    name: '', barcode: '', category: '', price: '', stock: '', lowStockAlert: '', expiryDate: ''
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

  // Check if product expires within 7 days
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode.includes(productSearch)
  );

  // Add product by barcode scanning
  const addProductByBarcode = () => {
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeInput.trim());
    if (product) {
      addToCart(product);
      setBarcodeInput('');
      toast({ title: "Product Added", description: `${product.name} added to cart` });
    } else {
      toast({ title: "Product Not Found", description: "Barcode not found in inventory", variant: "destructive" });
    }
  };

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

    // Update stock and sales count
    setProducts(products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return { 
          ...product, 
          stock: product.stock - cartItem.quantity,
          salesCount: (product.salesCount || 0) + cartItem.quantity
        };
      }
      return product;
    }));

    const saleData = {
      id: Date.now(),
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      total: calculateTotal(),
      paymentMethod,
      timestamp: new Date()
    };

    // Add to daily sales
    setDailySales(prev => [...prev, saleData]);

    // Generate receipt data
    const receiptData = {
      id: `SM${Date.now()}`,
      customerName: 'Walk-in Customer',
      items: saleData.items,
      subtotal: calculateSubtotal(),
      tax: calculateTax(calculateSubtotal()),
      total: calculateTotal(),
      paymentMethod,
      timestamp: new Date(),
      department: 'supermarket'
    };

    setCurrentReceipt(receiptData);
    setShowReceipt(true);

    // Record sale for approval system
    const sale = {
      id: Date.now(),
      department: 'supermarket',
      type: 'supermarket_sale',
      customer: 'Walk-in Customer',
      items: saleData.items,
      total: calculateTotal(),
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(sale);
    setCart([]);
    setPaymentMethod('');

    toast({
      title: "Sale Completed",
      description: `Sale of ${formatCurrency(saleData.total)} recorded successfully`,
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
      lowStockAlert: parseInt(newProduct.lowStockAlert),
      expiryDate: newProduct.expiryDate,
      salesCount: 0
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', barcode: '', category: '', price: '', stock: '', lowStockAlert: '', expiryDate: '' });
    toast({ title: "Success", description: "Product added successfully" });
  };

  // Add product by scanning barcode to inventory
  const addProductToInventoryByBarcode = () => {
    if (!barcodeInput.trim()) return;
    
    // For demo purposes, we'll create a product if it doesn't exist
    const existingProduct = products.find(p => p.barcode === barcodeInput.trim());
    if (existingProduct) {
      toast({ title: "Product Exists", description: "Product already in inventory", variant: "destructive" });
      setBarcodeInput('');
      return;
    }

    // Pre-fill the form with barcode
    setNewProduct(prev => ({ ...prev, barcode: barcodeInput.trim() }));
    setBarcodeInput('');
    toast({ title: "Barcode Scanned", description: "Please fill in product details" });
  };

  // Get daily sales total
  const getDailySalesTotal = () => {
    const today = new Date().toDateString();
    return dailySales
      .filter(sale => sale.timestamp.toDateString() === today)
      .reduce((total, sale) => total + sale.total, 0);
  };

  // Submit daily sales to accountant
  const submitDailySales = () => {
    setSalesSubmitted(true);
    setSubmissionDate(new Date());
    toast({ title: "Success", description: "Daily sales submitted to accountant for approval" });
  };

  const renderNavTabs = () => (
    <div className="flex gap-2 mb-6 flex-wrap justify-center">
      {[
        { id: 'pos', label: 'POS System', icon: ShoppingCart },
        { id: 'inventory', label: 'Inventory', icon: Package },
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
            Product Search & Barcode Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name or barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Scan or enter barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProductByBarcode()}
                  className="pl-10"
                />
              </div>
              <Button onClick={addProductByBarcode} className="bg-green-600 hover:bg-green-700">
                Add to Cart
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map(product => {
              const status = getStockStatus(product);
              const expiringSoon = isExpiringSoon(product.expiryDate);
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50"
                >
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.category}</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${status.class} bg-gray-100`}>
                      Stock: {product.stock}
                    </span>
                    {expiringSoon && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                        Expires Soon
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
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
                  Complete Sale & Generate Receipt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Sales Summary */}
        {dailySales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Sales Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Sales Today:</span>
                  <span className="font-bold text-green-600">{formatCurrency(getDailySalesTotal())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Number of Transactions:</span>
                  <span className="font-medium">{dailySales.filter(s => s.timestamp.toDateString() === new Date().toDateString()).length}</span>
                </div>
                
                <hr className="border-2 border-gray-300 my-4" />
                
                {!salesSubmitted ? (
                  <Button 
                    onClick={submitDailySales}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Submit to Accountant for Approval
                  </Button>
                ) : (
                  <div className="text-center">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-2">
                      ✅ Submitted to Accountant
                    </div>
                    <p className="text-xs text-gray-600">
                      Submitted on: {submissionDate?.toLocaleString()}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Status: Pending Approval
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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
          <div className="mb-4">
            <Label>Scan Barcode to Add Product</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProductToInventoryByBarcode()}
                  className="pl-10"
                />
              </div>
              <Button onClick={addProductToInventoryByBarcode}>
                Scan
              </Button>
            </div>
          </div>
          
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
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={newProduct.expiryDate}
                onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => {
                  const status = getStockStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class} bg-gray-100`}>
                          {status.text}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsSection = () => {
    const getMostSellingProducts = () => {
      return [...products]
        .filter(p => p.salesCount && p.salesCount > 0)
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 5);
    };

    const getWorstSellingProducts = () => {
      return [...products]
        .filter(p => p.salesCount !== undefined)
        .sort((a, b) => (a.salesCount || 0) - (b.salesCount || 0))
        .slice(0, 5);
    };

    const getExpiringSoonProducts = () => {
      return products.filter(p => isExpiringSoon(p.expiryDate));
    };

    const getWeeklySales = () => {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dailySales
        .filter(sale => sale.timestamp >= weekAgo)
        .reduce((total, sale) => total + sale.total, 0);
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Status
            </CardTitle>
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
                  <div className="text-sm">Low Stock</div>
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

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
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

        {/* Most Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getMostSellingProducts().map((product, index) => (
                <div key={product.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-600">{product.category}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold">
                    {product.salesCount} sold
                  </div>
                </div>
              ))}
              {getMostSellingProducts().length === 0 && (
                <div className="text-center text-gray-500 py-4">No sales data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worst Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Worst Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getWorstSellingProducts().map((product, index) => (
                <div key={product.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600">#{index + 1}</span>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-600">{product.category}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold">
                    {product.salesCount || 0} sold
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expiry Date Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Expiring Soon (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getExpiringSoonProducts().length === 0 ? (
              <div className="text-center text-gray-500 py-8">No products expiring soon</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getExpiringSoonProducts().map(product => {
                  const daysLeft = Math.ceil((new Date(product.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={product.id}
                      className="flex justify-between items-center p-2 bg-red-50 border-l-4 border-red-500 rounded"
                    >
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-xs text-gray-600">{product.category}</div>
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        {daysLeft} days left
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Sales Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatCurrency(getWeeklySales())}
                </div>
                <div className="text-gray-600">Total Sales (Last 7 Days)</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {dailySales.filter(sale => {
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return sale.timestamp >= weekAgo;
                    }).length}
                  </div>
                  <div className="text-sm">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(getWeeklySales() / 7)}
                  </div>
                  <div className="text-sm">Daily Average</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
          {activeSection === 'reports' && renderReportsSection()}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceipt && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sales Receipt</h2>
              <Button
                variant="outline"
                onClick={() => setShowReceipt(false)}
              >
                Close
              </Button>
            </div>
            <Receipt receiptData={currentReceipt} />
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => window.print()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ReceiptIcon className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
