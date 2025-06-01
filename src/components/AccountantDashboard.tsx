
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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
  type: string;
  description: string;
  amount: number;
  department: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface AccountantDashboardProps {
  sales: Sale[];
  onApprove: (saleId: number) => void;
}

const salesChartData = [
  { department: 'Supermarket', amount: 5500000 },
  { department: 'Restaurant', amount: 3200000 },
  { department: 'Fuel', amount: 8900000 },
];

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ sales, onApprove }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    type: '',
    description: '',
    amount: '',
    department: ''
  });
  const [chartFilter, setChartFilter] = useState('week');

  const pendingSales = sales.filter(sale => sale.status === 'pending');
  const approvedSales = sales.filter(sale => sale.status === 'accountant_approved' || sale.status === 'approved');
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending');

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
      description: "Sale has been approved and sent to manager for final approval",
    });
  };

  const handleExpenseSubmit = () => {
    if (!newExpense.type || !newExpense.description || !newExpense.amount || !newExpense.department) {
      toast({
        title: "Error",
        description: "Please fill in all expense fields",
        variant: "destructive",
      });
      return;
    }

    const expense: Expense = {
      id: Date.now(),
      type: newExpense.type,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      department: newExpense.department,
      timestamp: new Date(),
      status: 'pending'
    };

    setExpenses(prev => [...prev, expense]);
    setNewExpense({ type: '', description: '', amount: '', department: '' });

    toast({
      title: "Expense Recorded",
      description: "Expense has been submitted to manager for approval",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales Approval</TabsTrigger>
          <TabsTrigger value="reports">Sales Reports</TabsTrigger>
          <TabsTrigger value="expenses">Expense Management</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {pendingSales.length}
                </div>
                <p className="text-blue-600 font-medium">Pending Review</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {approvedSales.length}
                </div>
                <p className="text-green-600 font-medium">Approved by Me</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  UGX {pendingSales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()}
                </div>
                <p className="text-purple-600 font-medium">Value Pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSales.map(sale => (
                  <div key={sale.id} className="border rounded-lg p-4 bg-yellow-50">
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
                        <div className="text-xl font-bold text-orange-600">
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
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Approve & Send to Manager
                    </Button>
                  </div>
                ))}
                
                {pendingSales.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No sales pending approval
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recently Approved Sales</CardTitle>
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
                      <Badge variant={sale.status === 'approved' ? 'default' : 'secondary'}>
                        {sale.status === 'approved' ? 'Manager Approved' : 'Sent to Manager'}
                      </Badge>
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

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Sales Overview</CardTitle>
              <div className="flex gap-2">
                <Select value={chartFilter} onValueChange={setChartFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Sales Amount",
                    color: "#3b82f6",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record New Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expense Type</Label>
                  <Select value={newExpense.type} onValueChange={(value) => setNewExpense(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">Inventory Purchase</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="operating">Operating Expense</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={newExpense.department} onValueChange={(value) => setNewExpense(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel Station</SelectItem>
                      <SelectItem value="supermarket">Supermarket</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount (UGX)</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                  />
                </div>
              </div>

              <Button onClick={handleExpenseSubmit} className="w-full">
                Submit Expense for Approval
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Expenses ({pendingExpenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingExpenses.map(expense => (
                  <div key={expense.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getDepartmentColor(expense.department)}>
                            {expense.department.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">{expense.type}</Badge>
                        </div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">{expense.timestamp.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">UGX {expense.amount.toLocaleString()}</p>
                        <Badge variant="secondary">Awaiting Manager Approval</Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {pendingExpenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending expenses
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
