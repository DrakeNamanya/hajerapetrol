import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, ShoppingCart, Plus, Minus, Package, AlertTriangle, TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface SupermarketPOSProps {
  onSaleRecord: (sale: any) => void;
}

const initialProducts: Product[] = [
  { id: '1', name: 'Rice 5kg', barcode: '123456789012', price: 25000, category: 'Grains', stock: 50, lowStockAlert: 10, expiryDate: '2024-12-31', salesCount: 15 },
  { id: '2', name: 'Cooking Oil 1L', barcode: '123456789013', price: 8000, category: 'Oil', stock: 30, lowStockAlert: 5, expiryDate: '2024-10-15', salesCount: 22 },
  { id: '3', name: 'Sugar 1kg', barcode: '123456789014', price: 4500, category: 'Sweeteners', stock: 25, lowStockAlert: 8, expiryDate: '2025-03-20', salesCount: 8 },
  { id: '4', name: 'Bread', barcode: '123456789015', price: 2500, category: 'Bakery', stock: 20, lowStockAlert: 5, expiryDate: '2024-06-10', salesCount: 30 },
  { id: '5', name: 'Milk 1L', barcode: '123456789016', price: 3500, category: 'Dairy', stock: 15, lowStockAlert: 5, expiryDate: '2024-06-15', salesCount: 18 },
];

export const SupermarketPOS: React.FC<SupermarketPOSProps> = ({ onSaleRecord }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [salesSubmitted, setSalesSubmitted] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

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
        // Adding to inventory
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
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.total, 0);
    
    const sale: Sale = {
      id: Date.now(),
      items: cart,
      total,
      paymentMethod,
      timestamp: new Date()
    };

    // Update product stock and sales count
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
    setDailySales(prev => [...prev, sale]);

    // Record the sale with the correct format for the global system
    const globalSale = {
      id: sale.id,
      department: 'supermarket',
      type: 'grocery_sale',
      customer: 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      timestamp: sale.timestamp,
      status: 'pending'
    };

    onSaleRecord(globalSale);

    // Clear cart and payment method
    setCart([]);
    setPaymentMethod('');

    toast({
      title: "Sale Completed",
      description: `Sale of UGX ${total.toLocaleString()} recorded successfully`,
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode.includes(productSearch)
  );

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  const dailyTotal = dailySales.reduce((sum, sale) => sum + sale.total, 0);

  // Reports data
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockAlert);
  const mostSellingProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  const worstSellingProducts = [...products].sort((a, b) => a.salesCount - b.salesCount).slice(0, 5);
  const expiringProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

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
                  >
                    Complete Sale
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Today's Total Sales:</span>
                  <span className="text-green-600">UGX {dailyTotal.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {dailySales.length} transactions completed
                </p>
              </div>

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
                    {approvalStatus === 'pending' && 'Awaiting Approval'}
                    {approvalStatus === 'approved' && 'Approved'}
                    {approvalStatus === 'rejected' && 'Rejected'}
                  </Badge>
                </div>
              )}

              {dailySales.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Today's Transactions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {dailySales.map(sale => (
                      <div key={sale.id} className="flex justify-between items-center text-sm border-b pb-1">
                        <span>{sale.timestamp.toLocaleTimeString()}</span>
                        <span>UGX {sale.total.toLocaleString()}</span>
                        <span className="text-gray-600">{sale.paymentMethod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Stock by Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Scan barcode to add stock"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeInput(barcodeInput, false);
                        }
                      }}
                    />
                    <Button onClick={() => handleBarcodeInput(barcodeInput, false)}>
                      Add Stock
                    </Button>
                  </div>
                </div>

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
                          {product.stock <= product.lowStockAlert ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="default">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
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
              <p className="text-gray-600">Weekly sales chart would be displayed here with daily breakdown</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
