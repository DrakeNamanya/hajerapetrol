
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Sales Overview</TabsTrigger>
          <TabsTrigger value="reports">Department Reports</TabsTrigger>
        </TabsList>


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
