
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

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

interface ManagerDashboardProps {
  sales: Sale[];
  onApprove: (saleId: number) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ sales, onApprove }) => {
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

  const departmentStats = ['fuel', 'supermarket', 'restaurant'].map(dept => {
    const deptSales = approvedSales.filter(sale => sale.department === dept);
    const deptRevenue = deptSales.reduce((sum, sale) => sum + sale.total, 0);
    return {
      department: dept,
      sales: deptSales.length,
      revenue: deptRevenue
    };
  });

  return (
    <div className="space-y-6">
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
              {pendingSales.length}
            </div>
            <p className="text-purple-600 font-medium">Awaiting Approval</p>
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
    </div>
  );
};
