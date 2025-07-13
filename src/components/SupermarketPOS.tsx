import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, ShoppingCart, Plus, Minus, Package, AlertTriangle, TrendingUp, TrendingDown, Clock, BarChart3, Receipt, Database, DollarSign } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReceiptGenerator } from './ReceiptGenerator';
import { useReceipts } from '@/hooks/useReceipts';
import { useSales } from '@/hooks/useSales';

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  category: string;
  stock: number;
  lowStockAlert: number;
  expiryDate?: string;
  salesCount: number;
}

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  quantity: number;
  price: number;
  total: number;
  category: string;
  stock: number;
  lowStockAlert: number;
}

interface Sale {
  id: number;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
}

const initialProducts: Product[] = [
  { id: '1', name: 'Rice 5kg', barcode: '123456789012', price: 25000, category: 'Grains', stock: 50, lowStockAlert: 20, expiryDate: '2024-12-31', salesCount: 15 },
  { id: '2', name: 'Cooking Oil 1L', barcode: '123456789013', price: 8000, category: 'Oil', stock: 30, lowStockAlert: 20, expiryDate: '2024-10-15', salesCount: 22 },
  { id: '3', name: 'Sugar 1kg', barcode: '123456789014', price: 4500, category: 'Sweeteners', stock: 25, lowStockAlert: 20, expiryDate: '2025-03-20', salesCount: 8 },
  { id: '4', name: 'Bread', barcode: '123456789015', price: 2500, category: 'Bakery', stock: 15, lowStockAlert: 20, expiryDate: '2024-06-10', salesCount: 30 },
  { id: '5', name: 'Milk 1L', barcode: '123456789016', price: 3500, category: 'Dairy', stock: 10, lowStockAlert: 20, expiryDate: '2024-06-15', salesCount: 18 },
];

interface SupermarketPOSProps {
  onSaleRecord: (sale: any) => void;
}

export const SupermarketPOS: React.FC<SupermarketPOSProps> = ({ onSaleRecord }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [salesSubmitted, setSalesSubmitted] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [dailySalesSubmitted, setDailySalesSubmitted] = useState(false);
  const [submissionDate, setSubmissionDate] = useState<Date | null>(null);
  
  // Stock management form state
  const [stockForm, setStockForm] = useState({
    productName: '',
    quantity: '',
    price: '',
    category: '',
    barcode: '',
    expiryDate: ''
  });
  
  const { generateReceiptNumber, saveReceipt } = useReceipts();
  const { createSale, isCreatingSale, sales, getSalesSummary } = useSales();

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      if (product.stock === 0) {
        toast({
          title: "Out of Stock",
          description: "This product is currently out of stock",
          variant: "destructive",
        });
        return;
      }
      setCart([...cart, {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: 1,
        price: product.price,
        total: product.price,
        category: product.category,
        stock: product.stock,
        lowStockAlert: product.lowStockAlert
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} units available`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const handleBarcodeInput = (barcode: string, isForSale: boolean = true) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      if (isForSale) {
        addToCart(product);
        toast({
          title: "Product Added",
          description: `${product.name} added to cart`,
        });
      } else {
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, stock: p.stock + 1 }
            : p
        ));
        toast({
          title: "Inventory Updated",
          description: `${product.name} stock increased by 1`,
        });
      }
      setBarcodeInput('');
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      });
    }
  };

  const handleStockFormSubmit = () => {
    if (!stockForm.productName || !stockForm.quantity || !stockForm.price || !stockForm.category || !stockForm.barcode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const existingProduct = products.find(p => p.barcode === stockForm.barcode);
    
    if (existingProduct) {
      // Update existing product stock
      setProducts(prev => prev.map(p => 
        p.barcode === stockForm.barcode 
          ? { ...p, stock: p.stock + parseInt(stockForm.quantity), expiryDate: stockForm.expiryDate || p.expiryDate }
          : p
      ));
      toast({
        title: "Stock Updated",
        description: `${existingProduct.name} stock increased by ${stockForm.quantity}`,
      });
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now().toString(),
        name: stockForm.productName,
        barcode: stockForm.barcode,
        price: parseFloat(stockForm.price),
        category: stockForm.category,
        stock: parseInt(stockForm.quantity),
        lowStockAlert: 20,
        expiryDate: stockForm.expiryDate,
        salesCount: 0
      };
      setProducts(prev => [...prev, newProduct]);
      toast({
        title: "Product Added",
        description: `${stockForm.productName} added to inventory`,
      });
    }

    // Reset form
    setStockForm({
      productName: '',
      quantity: '',
      price: '',
      category: '',
      barcode: '',
      expiryDate: ''
    });
  };

  const handleSale = async () => {
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
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    const receiptNumber = generateReceiptNumber('supermarket');
    
    const receiptData = {
      receiptNumber,
      department: 'supermarket',
      customerName: 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal,
      tax,
      total,
      paymentMethod,
      timestamp: new Date()
    };

    // Save to database using the new sales hook
    const saleData = {
      department: 'supermarket' as const,
      sale_type: 'grocery_sale',
      customer_name: 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal,
      tax,
      total,
      payment_method: paymentMethod,
    };

    createSale(saleData);

    // Save receipt
    const receiptSaved = await saveReceipt(receiptData);
    
    if (receiptSaved) {
      setCurrentReceipt(receiptData);
      setShowReceipt(true);
    }

    // Update product stock
    setProducts(prev => prev.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return {
          ...product,
          stock: product.stock - cartItem.quantity,
          salesCount: product.salesCount + cartItem.quantity
        };
      }
      return product;
    }));

    // Add to daily sales
    const newSale: Sale = {
      id: Date.now(),
      items: [...cart],
      total,
      paymentMethod,
      timestamp: new Date()
    };
    setDailySales(prev => [...prev, newSale]);

    // Clear cart and payment method
    setCart([]);
    setPaymentMethod('');

    // Still call the legacy onSaleRecord for backward compatibility
    const globalSale = {
      id: Date.now(),
      department: 'supermarket',
      type: 'grocery_sale',
      customer: 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      total,
      paymentMethod,
      timestamp: new Date(),
      status: 'pending'
    };

    onSaleRecord(globalSale);

    toast({
      title: "Sale Completed",
      description: `Sale of UGX ${total.toLocaleString()} recorded successfully`,
    });
  };

  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return sales.filter(sale => new Date(sale.created_at).toDateString() === today);
  };

  const getDailyTotal = () => {
    return getTodaysSales().reduce((total, sale) => total + Number(sale.total), 0);
  };

  const submitDailySales = () => {
    const todaysSales = getTodaysSales();
    if (todaysSales.length === 0) {
      toast({
        title: "No Sales",
        description: "No sales to submit today",
        variant: "destructive",
      });
      return;
    }

    setDailySalesSubmitted(true);
    setSubmissionDate(new Date());
    
    toast({
      title: "Daily Sales Submitted",
      description: "Daily sales have been submitted to accountant for approval",
    });
  };

  const resetDailySubmission = () => {
    setDailySalesSubmitted(false);
    setSubmissionDate(null);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode.includes(productSearch)
  );

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  const dailyTotal = dailySales.reduce((sum, sale) => sum + sale.total, 0);

  // Get database sales summary
  const dbSalesSummary = getSalesSummary();

  // Reports data with updated logic
  const lowStockProducts = products.filter(p => p.stock < 20);
  const mostSellingProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  const worstSellingProducts = [...products].sort((a, b) => a.salesCount - b.salesCount).slice(0, 5);
  const expiringProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  // Weekly sales data for chart
  const weeklyData = [
    { day: 'Mon', amount: 450000 },
    { day: 'Tue', amount: 520000 },
    { day: 'Wed', amount: 380000 },
    { day: 'Thu', amount: 620000 },
    { day: 'Fri', amount: 780000 },
    { day: 'Sat', amount: 890000 },
    { day: 'Sun', amount: 420000 }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Building2 className="h-6 w-6" />
                Supermarket POS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Search Products</Label>
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by name or barcode"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scan Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Scan or enter barcode"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeInput(barcodeInput, true);
                        }
                      }}
                    />
                    <Button onClick={() => handleBarcodeInput(barcodeInput, true)}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm">{product.name}</h4>
                      <p className="text-green-600 font-bold">UGX {product.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Stock: {product.stock}</p>
                      <Button 
                        onClick={() => addToCart(product)}
                        className="w-full mt-2"
                        size="sm"
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">UGX {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-2 font-semibold">UGX {item.total.toLocaleString()}</span>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">UGX {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {cart.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleSale}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={isCreatingSale}
                  >
                    {isCreatingSale ? 'Processing...' : 'Complete Sale & Save to Database'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Sales Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Today's Sales:</span>
                    <span className="text-green-600 font-semibold">UGX {dbSalesSummary.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transactions:</span>
                    <span className="font-semibold">{dbSalesSummary.salesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <Badge variant="secondary">{dbSalesSummary.pendingSales}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <Badge variant="default">{dbSalesSummary.approvedSales}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Sales Summary */}
          {sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Daily Sales Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Today's Total Sales:</span>
                    <span className="text-lg font-bold text-green-600">
                      UGX {getDailyTotal().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Number of Sales:</span>
                    <span>{getTodaysSales().length}</span>
                  </div>
                  
                  {!dailySalesSubmitted ? (
                    <Button 
                      onClick={submitDailySales}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={getTodaysSales().length === 0}
                    >
                      Submit Daily Sales to Accountant
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-green-600 font-medium text-center">
                        ✓ Daily sales submitted on {submissionDate?.toLocaleDateString()} at {submissionDate?.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-600 text-center">
                        Waiting for accountant approval
                      </p>
                      <Button 
                        onClick={resetDailySubmission}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Reset Submission
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Add New Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={stockForm.productName}
                    onChange={(e) => setStockForm(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (UGX)</Label>
                  <Input
                    type="number"
                    value={stockForm.price}
                    onChange={(e) => setStockForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={stockForm.category} onValueChange={(value) => setStockForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value="Grains">Grains</SelectItem>
                      <SelectItem value="Oil">Oil</SelectItem>
                      <SelectItem value="Sweeteners">Sweeteners</SelectItem>
                      <SelectItem value="Bakery">Bakery</SelectItem>
                      <SelectItem value="Dairy">Dairy</SelectItem>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                      <SelectItem value="Household">Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={stockForm.expiryDate}
                    onChange={(e) => setStockForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input
                    value={stockForm.barcode}
                    onChange={(e) => setStockForm(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Scan or enter barcode"
                  />
                </div>
              </div>
              <Button onClick={handleStockFormSubmit} className="w-full">
                Add to Inventory
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>UGX {product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        {product.stock < 20 ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert (Less than 20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-gray-500">No low stock items</p>
                ) : (
                  <div className="space-y-2">
                    {lowStockProducts.map(product => (
                      <div key={product.id} className="flex justify-between items-center">
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="destructive">{product.stock} left</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Most Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mostSellingProducts.map((product, index) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="font-medium">#{index + 1} {product.name}</span>
                      <Badge variant="default">{product.salesCount} sold</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingDown className="h-5 w-5" />
                  Worst Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {worstSellingProducts.map((product, index) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="font-medium">#{index + 1} {product.name}</span>
                      <Badge variant="secondary">{product.salesCount} sold</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-5 w-5" />
                  Expiry Date Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringProducts.length === 0 ? (
                  <p className="text-gray-500">No products expiring soon</p>
                ) : (
                  <div className="space-y-2">
                    {expiringProducts.map(product => (
                      <div key={product.id} className="flex justify-between items-center">
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="secondary">{product.expiryDate}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="font-medium text-sm">{day.day}</div>
                      <div className="bg-blue-100 rounded p-2">
                        <div className="text-xs text-blue-600 font-semibold">
                          UGX {day.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Sales Receipt
            </DialogTitle>
          </DialogHeader>
          {currentReceipt && (
            <ReceiptGenerator
              receiptData={currentReceipt}
              onPrint={() => console.log('Receipt printed')}
              onDownload={() => console.log('Receipt downloaded')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
