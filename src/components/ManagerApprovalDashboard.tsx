
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSales } from '@/hooks/useSales';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export const ManagerApprovalDashboard: React.FC = () => {
  const { sales, updateSaleStatus, isUpdatingSale } = useSales();

  // Filter sales by status - managers see accountant-approved sales
  const pendingManagerApproval = sales.filter(sale => sale.status === 'accountant_approved');
  const managerApprovedSales = sales.filter(sale => sale.status === 'approved');
  const allPendingSales = sales.filter(sale => sale.status === 'pending');

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
      status: 'approved',
      approvalType: 'manager'
    });
  };

  const handleRejectSale = (saleId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      updateSaleStatus({
        saleId,
        status: 'rejected',
        approvalType: 'manager',
        rejectionReason: reason
      });
    }
  };

  const formatSaleItems = (items: any) => {
    if (!Array.isArray(items)) return [];
    return items;
  };

  // Get today's approved sales total
  const today = new Date().toDateString();
  const todayApprovedSales = managerApprovedSales.filter(sale => 
    new Date(sale.created_at).toDateString() === today
  );
  const todayTotal = todayApprovedSales.reduce((sum, sale) => sum + Number(sale.total), 0);

  // Department breakdown for today
  const departmentTotals = todayApprovedSales.reduce((acc, sale) => {
    acc[sale.department] = (acc[sale.department] || 0) + Number(sale.total);
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { department: 'Fuel', amount: departmentTotals.fuel || 0 },
    { department: 'Supermarket', amount: departmentTotals.supermarket || 0 },
    { department: 'Restaurant', amount: departmentTotals.restaurant || 0 },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approval">Final Approval</TabsTrigger>
          <TabsTrigger value="overview">Sales Overview</TabsTrigger>
          <TabsTrigger value="reports">Department Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="approval" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingManagerApproval.length}
                </div>
                <p className="text-yellow-600 font-medium">Awaiting My Approval</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">
                  {allPendingSales.length}
                </div>
                <p className="text-red-600 font-medium">Pending Accountant</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {managerApprovedSales.length}
                </div>
                <p className="text-green-600 font-medium">Fully Approved</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  UGX {todayTotal.toLocaleString()}
                </div>
                <p className="text-blue-600 font-medium">Today's Total</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Requiring Final Approval</CardTitle>
              <p className="text-sm text-gray-600">These sales have been approved by the accountant and need your final approval</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingManagerApproval.map(sale => {
                  const items = formatSaleItems(sale.items);
                  return (
                    <div key={sale.id} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getDepartmentColor(sale.department)}>
                              {sale.department.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Accountant Approved
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
                          {sale.accountant_approved_at && (
                            <p className="text-xs text-green-600">
                              Accountant approved: {new Date(sale.accountant_approved_at).toLocaleString()}
                            </p>
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

                      <div className="bg-white p-3 rounded border mb-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold ml-2">UGX {Number(sale.subtotal).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tax (18%):</span>
                            <span className="font-semibold ml-2">UGX {Number(sale.tax).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold ml-2 text-lg">UGX {Number(sale.total).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApproveSale(sale.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
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
                
                {pendingManagerApproval.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No sales pending your approval
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recently Approved Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managerApprovedSales
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 20)
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
                        <Badge variant="default" className="bg-green-600">
                          Approved
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

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Sales by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Sales Amount",
                    color: "#10b981",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chartData.map(dept => (
              <Card key={dept.department}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{dept.department}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    UGX {dept.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Today's Total</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
