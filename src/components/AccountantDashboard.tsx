
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

interface AccountantDashboardProps {
  sales: Sale[];
  onApprove: (saleId: number) => void;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ sales, onApprove }) => {
  const pendingSales = sales.filter(sale => sale.status === 'pending');
  const approvedSales = sales.filter(sale => sale.status === 'accountant_approved' || sale.status === 'approved');

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

  return (
    <div className="space-y-6">
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
    </div>
  );
};
