
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ExpenseTracker } from './ExpenseTracker';

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
  expenses?: Expense[];
}

// Department sales data using actual sales data with different time periods
const getDepartmentSalesData = (sales: Sale[], period: string) => {
  const now = new Date();
  let filteredSales = sales.filter(sale => sale.status === 'approved' || sale.status === 'accountant_approved');
  
  // Filter sales based on selected period
  if (period === 'day') {
    filteredSales = filteredSales.filter(sale => 
      sale.timestamp.toDateString() === now.toDateString()
    );
  } else if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredSales = filteredSales.filter(sale => sale.timestamp >= weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    filteredSales = filteredSales.filter(sale => sale.timestamp >= monthAgo);
  } else if (period === 'year') {
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    filteredSales = filteredSales.filter(sale => sale.timestamp >= yearAgo);
  }

  const departmentTotals = filteredSales.reduce((acc, sale) => {
    acc[sale.department] = (acc[sale.department] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);

  return [
    { department: 'Supermarket', amount: departmentTotals.supermarket || 0 },
    { department: 'Restaurant', amount: departmentTotals.restaurant || 0 },
    { department: 'Fuel', amount: departmentTotals.fuel || 0 },
  ];
};

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ 
  sales, 
  onApprove, 
  expenses = [] 
}) => {
  const [chartPeriod, setChartPeriod] = useState('week');
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

  const salesChartData = getDepartmentSalesData(sales, chartPeriod);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales Approval</TabsTrigger>
          <TabsTrigger value="expenses">Expense Records</TabsTrigger>
          <TabsTrigger value="reports">Sales Reports</TabsTrigger>
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

          {pendingExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Expenses from Manager ({pendingExpenses.length})</CardTitle>
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
                          <Badge variant="secondary">Awaiting Approval</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseTracker userRole="accountant" />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Department Sales Overview
                <Select value={chartPeriod} onValueChange={setChartPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
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
      </Tabs>
    </div>
  );
};
