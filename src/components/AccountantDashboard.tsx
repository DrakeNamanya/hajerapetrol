
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
import { useSales } from '@/hooks/useSales';
import { PurchaseOrderManager } from './PurchaseOrderManager';

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
  expenses?: Expense[];
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ 
  expenses = [] 
}) => {
  const [chartPeriod, setChartPeriod] = useState('week');
  const { sales, updateSaleStatus, isUpdatingSale } = useSales();

  // Filter sales by status
  const pendingSales = sales.filter(sale => sale.status === 'pending');
  const accountantApprovedSales = sales.filter(sale => sale.status === 'accountant_approved');
  const fullyApprovedSales = sales.filter(sale => sale.status === 'director_approved');
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending');

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'fuel': return 'bg-orange-100 text-orange-800';
      case 'supermarket': return 'bg-green-100 text-green-800';
      case 'restaurant': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveSale = (saleId: string) => {
    updateSaleStatus({
      saleId,
      status: 'accountant_approved',
      approvalType: 'accountant'
    });
  };

  const handleRejectSale = (saleId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      updateSaleStatus({
        saleId,
        status: 'rejected',
        approvalType: 'accountant',
        rejectionReason: reason
      });
    }
  };

  const formatSaleItems = (items: any) => {
    if (!Array.isArray(items)) return [];
    return items;
  };

  // Department sales data using actual sales data
  const getDepartmentSalesData = (period: string) => {
    const now = new Date();
    let filteredSales = sales.filter(sale => 
      sale.status === 'director_approved' || sale.status === 'accountant_approved'
    );
    
    if (period === 'day') {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.created_at).toDateString() === now.toDateString()
      );
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredSales = filteredSales.filter(sale => new Date(sale.created_at) >= weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredSales = filteredSales.filter(sale => new Date(sale.created_at) >= monthAgo);
    } else if (period === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filteredSales = filteredSales.filter(sale => new Date(sale.created_at) >= yearAgo);
    }

    const departmentTotals = filteredSales.reduce((acc, sale) => {
      acc[sale.department] = (acc[sale.department] || 0) + Number(sale.total);
      return acc;
    }, {} as Record<string, number>);

    return [
      { department: 'Supermarket', amount: departmentTotals.supermarket || 0 },
      { department: 'Restaurant', amount: departmentTotals.restaurant || 0 },
      { department: 'Fuel', amount: departmentTotals.fuel || 0 },
    ];
  };

  const salesChartData = getDepartmentSalesData(chartPeriod);

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
                  {accountantApprovedSales.length}
                </div>
                <p className="text-green-600 font-medium">Approved by Me</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  UGX {pendingSales.reduce((sum, sale) => sum + Number(sale.total), 0).toLocaleString()}
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
                {pendingSales.map(sale => {
                  const items = formatSaleItems(sale.items);
                  return (
                    <div key={sale.id} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getDepartmentColor(sale.department)}>
                              {sale.department.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(sale.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium">{sale.customer_name || 'Walk-in Customer'}</p>
                          {sale.table_number && (
                            <p className="text-sm text-gray-600">Table: {sale.table_number}</p>
                          )}
                          {sale.pump_number && (
                            <p className="text-sm text-gray-600">Pump: {sale.pump_number}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-orange-600">
                            UGX {Number(sale.total).toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-600">{sale.payment_method}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium mb-2">Items:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {items.map((item: any, index: number) => (
                            <div key={index} className="text-sm bg-white p-2 rounded border">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 ml-2">
                                {item.quantity} × UGX {Number(item.price).toLocaleString()} = UGX {Number(item.total).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApproveSale(sale.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={isUpdatingSale}
                        >
                          {isUpdatingSale ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button 
                          onClick={() => handleRejectSale(sale.id)}
                          variant="destructive"
                          className="flex-1"
                          disabled={isUpdatingSale}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
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
                {[...accountantApprovedSales, ...fullyApprovedSales]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map(sale => (
                    <div key={sale.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getDepartmentColor(sale.department)}>
                          {sale.department.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{sale.customer_name || 'Walk-in'}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(sale.created_at).toLocaleString()}
                        </span>
                  <Badge variant={sale.status === 'director_approved' ? 'default' : 'secondary'}>
                    {sale.status === 'director_approved' ? 'Manager Approved' : 'Sent to Manager'}
                        </Badge>
                      </div>
                      <div className="font-semibold text-green-600">
                        UGX {Number(sale.total).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

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
