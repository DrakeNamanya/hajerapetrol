
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Fuel, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface Sale {
  id: number;
  department: string;
  type: string;
  customer: string;
  items: any[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
  status: string;
  tableNumber?: string;
}

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  department: string;
  requestedBy: string;
  timestamp: Date;
  status: 'pending' | 'manager_approved' | 'director_approved' | 'rejected';
}

interface ManagerDashboardProps {
  sales: Sale[];
  onApprove: (saleId: number) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ sales, onApprove }) => {
  const [dipstickReadings, setDipstickReadings] = useState({
    petrol_regular: '',
    petrol_premium: '',
    diesel: '',
    kerosene: ''
  });

  // Mock expense data from accountant
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 1,
      category: 'Office Supplies',
      amount: 150000,
      description: 'Printer paper, pens, and stationery',
      department: 'All',
      requestedBy: 'Sarah Accountant',
      timestamp: new Date(),
      status: 'pending'
    },
    {
      id: 2,
      category: 'Equipment Maintenance',
      amount: 350000,
      description: 'Fuel pump maintenance and calibration',
      department: 'Fuel',
      requestedBy: 'Sarah Accountant',
      timestamp: new Date(),
      status: 'pending'
    },
    {
      id: 3,
      category: 'Marketing',
      amount: 500000,
      description: 'Local radio advertisement campaign',
      department: 'All',
      requestedBy: 'Sarah Accountant',
      timestamp: new Date(),
      status: 'pending'
    }
  ]);

  // Simulated fuel data - in real app this would come from fuel POS
  const fuelInventory = [
    { id: 'petrol_regular', name: 'Regular Petrol', totalInventory: 5000, sold: 300, available: 4700 },
    { id: 'petrol_premium', name: 'Premium Petrol', totalInventory: 3500, sold: 200, available: 3300 },
    { id: 'diesel', name: 'Diesel', totalInventory: 4200, sold: 150, available: 4050 },
    { id: 'kerosene', name: 'Kerosene', totalInventory: 2800, sold: 100, available: 2700 },
  ];

  const pendingSales = sales.filter(sale => sale.status === 'accountant_approved');
  const approvedSales = sales.filter(sale => sale.status === 'approved');

  const totalRevenue = approvedSales.reduce((sum, sale) => sum + sale.total, 0);
  const pendingRevenue = pendingSales.reduce((sum, sale) => sum + sale.total, 0);

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'fuel': return 'bg-orange-100 text-orange-800';
      case 'supermarket': return 'bg-green-100 text-green-800';
      case 'restaurant': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = (saleId: number) => {
    onApprove(saleId);
    toast({
      title: "Sale Approved",
      description: "Sale has been approved and added to revenue",
    });
  };

  const handleExpenseApprove = (expenseId: number) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === expenseId 
          ? { ...expense, status: 'manager_approved' as const }
          : expense
      )
    );
    toast({
      title: "Expense Approved",
      description: "Expense has been approved and sent to director for final approval",
    });
  };

  const handleExpenseReject = (expenseId: number) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === expenseId 
          ? { ...expense, status: 'rejected' as const }
          : expense
      )
    );
    toast({
      title: "Expense Rejected",
      description: "Expense has been rejected",
      variant: "destructive"
    });
  };

  const handleDipstickVerification = () => {
    toast({
      title: "Dipstick Reading Verified",
      description: "Fuel inventory readings have been recorded",
    });
  };

  const departmentStats = ['fuel', 'supermarket', 'restaurant'].map(dept => {
    const deptSales = approvedSales.filter(sale => sale.department === dept);
    const deptRevenue = deptSales.reduce((sum, sale) => sum + sale.total, 0);
    return {
      department: dept,
      sales: deptSales.length,
      revenue: deptRevenue
    };
  });

  const pendingExpenses = expenses.filter(expense => expense.status === 'pending');
  const approvedExpenses = expenses.filter(expense => expense.status === 'manager_approved');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Approval</TabsTrigger>
          <TabsTrigger value="expenses">Expense Approval</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  UGX {totalRevenue.toLocaleString()}
                </div>
                <p className="text-blue-600 font-medium">Total Revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-yellow-600">
                  UGX {pendingRevenue.toLocaleString()}
                </div>
                <p className="text-yellow-600 font-medium">Pending Approval</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {approvedSales.length}
                </div>
                <p className="text-green-600 font-medium">Approved Sales</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {pendingExpenses.length}
                </div>
                <p className="text-purple-600 font-medium">Pending Expenses</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departmentStats.map(stat => (
              <Card key={stat.department}>
                <CardHeader>
                  <CardTitle className="capitalize">{stat.department} Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sales Count:</span>
                      <span className="font-semibold">{stat.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-semibold">UGX {stat.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {pendingSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales Awaiting Final Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSales.map(sale => (
                    <div key={sale.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getDepartmentColor(sale.department)}>
                              {sale.department.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {sale.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium">{sale.customer}</p>
                          {sale.tableNumber && (
                            <p className="text-sm text-gray-600">Table: {sale.tableNumber}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            UGX {sale.total.toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-600">{sale.paymentMethod}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium mb-2">Items:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sale.items.map((item, index) => (
                            <div key={index} className="text-sm bg-white p-2 rounded border">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 ml-2">
                                {item.quantity} × UGX {item.price.toLocaleString()} = UGX {item.total.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleApprove(sale.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Approve Sale
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Approved Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedSales.slice(-10).reverse().map(sale => (
                  <div key={sale.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getDepartmentColor(sale.department)}>
                        {sale.department.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{sale.customer}</span>
                      <span className="text-sm text-gray-600">
                        {sale.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="font-semibold text-green-600">
                      UGX {sale.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Expense Requests from Accountant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingExpenses.length > 0 ? (
                <div className="space-y-4">
                  {pendingExpenses.map(expense => (
                    <div key={expense.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{expense.category}</h4>
                            <Badge className={getDepartmentColor(expense.department)}>
                              {expense.department.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{expense.description}</p>
                          <div className="text-sm text-gray-600">
                            <p>Requested by: {expense.requestedBy}</p>
                            <p>Date: {expense.timestamp.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-red-600">
                            UGX {expense.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleExpenseApprove(expense.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Approve & Send to Director
                        </Button>
                        <Button 
                          onClick={() => handleExpenseReject(expense.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No pending expense requests</p>
              )}
            </CardContent>
          </Card>

          {approvedExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expenses Sent to Director</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvedExpenses.map(expense => (
                    <div key={expense.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="font-medium">{expense.category}</span>
                        <span className="text-sm text-gray-600 ml-2">({expense.department})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">UGX {expense.amount.toLocaleString()}</div>
                        <Badge className="bg-blue-100 text-blue-800">Awaiting Director</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Fuel className="h-6 w-6" />
                Daily Fuel Inventory Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-4">
                Compare dipstick readings with calculated inventory to verify fuel levels.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fuelInventory.map(fuel => {
                  const dipstickReading = parseFloat(dipstickReadings[fuel.id as keyof typeof dipstickReadings] || '0');
                  const calculatedInventory = fuel.totalInventory - fuel.sold;
                  const difference = dipstickReading - calculatedInventory;
                  const isMatch = Math.abs(difference) <= 50; // 50L tolerance

                  return (
                    <Card key={fuel.id} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">{fuel.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Total Inventory:</p>
                            <p className="font-semibold">{fuel.totalInventory.toLocaleString()}L</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Fuel Sold:</p>
                            <p className="font-semibold">{fuel.sold.toLocaleString()}L</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Calculated Available:</p>
                            <p className="font-semibold">{calculatedInventory.toLocaleString()}L</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Dipstick Reading:</p>
                            <Input
                              type="number"
                              value={dipstickReadings[fuel.id as keyof typeof dipstickReadings]}
                              onChange={(e) => setDipstickReadings(prev => ({
                                ...prev,
                                [fuel.id]: e.target.value
                              }))}
                              placeholder="Enter reading"
                              className="h-8"
                            />
                          </div>
                        </div>

                        {dipstickReading > 0 && (
                          <div className={`p-3 rounded-lg ${isMatch ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {isMatch ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`font-semibold ${isMatch ? 'text-green-800' : 'text-red-800'}`}>
                                {isMatch ? 'Match' : 'Discrepancy'}
                              </span>
                            </div>
                            <p className="text-sm">
                              Difference: {difference > 0 ? '+' : ''}{difference.toLocaleString()}L
                            </p>
                            {!isMatch && (
                              <p className="text-xs text-red-600 mt-1">
                                Please investigate the discrepancy
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button 
                onClick={handleDipstickVerification}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                Verify and Record Readings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
