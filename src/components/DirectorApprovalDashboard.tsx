import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSales } from '@/hooks/useSales';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export const DirectorApprovalDashboard: React.FC = () => {
  const { sales, updateSaleStatus, isUpdatingSale } = useSales();

  // Filter sales by status - directors see manager-approved sales
  const pendingDirectorApproval = sales.filter(sale => sale.status === 'manager_approved');
  const directorApprovedSales = sales.filter(sale => sale.status === 'director_approved');
  const allManagerApprovedSales = sales.filter(sale => sale.status === 'manager_approved');

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
      status: 'director_approved',
      approvalType: 'director'
    });
  };

  const handleRejectSale = (saleId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      updateSaleStatus({
        saleId,
        status: 'rejected',
        approvalType: 'director',
        rejectionReason: reason
      });
    }
  };

  const formatSaleItems = (items: any) => {
    if (!Array.isArray(items)) return [];
    return items;
  };

  // Calculate summary statistics
  const totalPendingValue = pendingDirectorApproval.reduce((sum, sale) => sum + Number(sale.total), 0);
  const today = new Date().toDateString();
  const todayApprovedSales = directorApprovedSales.filter(sale => 
    new Date(sale.created_at).toDateString() === today
  );
  const todayTotal = todayApprovedSales.reduce((sum, sale) => sum + Number(sale.total), 0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Final Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved Sales</TabsTrigger>
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {pendingDirectorApproval.length}
                    </div>
                    <p className="text-yellow-600 font-medium">Awaiting Final Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      UGX {totalPendingValue.toLocaleString()}
                    </div>
                    <p className="text-purple-600 font-medium">Value Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      UGX {todayTotal.toLocaleString()}
                    </div>
                    <p className="text-green-600 font-medium">Today's Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sales Requiring Final Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingDirectorApproval.map(sale => {
                  const items = formatSaleItems(sale.items);
                  return (
                    <div key={sale.id} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getDepartmentColor(sale.department)}>
                              {sale.department.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Manager Approved
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

                      <div className="bg-blue-50 p-3 rounded mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>Approval History:</strong> Approved by Accountant → Approved by Manager → Awaiting Director
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApproveSale(sale.id)}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          disabled={isUpdatingSale}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isUpdatingSale ? 'Processing...' : 'Final Approval'}
                        </Button>
                        <Button 
                          onClick={() => handleRejectSale(sale.id)}
                          variant="destructive"
                          className="flex-1"
                          disabled={isUpdatingSale}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {pendingDirectorApproval.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">All sales are up to date</p>
                    <p className="text-sm">No sales require your approval at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recently Approved Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {directorApprovedSales
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
                          Fully Approved
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

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {sales.filter(sale => sale.status === 'pending').length}
                </div>
                <p className="text-sm text-gray-600">Pending Sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {sales.filter(sale => sale.status === 'accountant_approved').length}
                </div>
                <p className="text-sm text-gray-600">With Accountant</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {sales.filter(sale => sale.status === 'manager_approved').length}
                </div>
                <p className="text-sm text-gray-600">With Manager</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {directorApprovedSales.length}
                </div>
                <p className="text-sm text-gray-600">Fully Approved</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Current Workflow</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-blue-100 px-2 py-1 rounded">Fuel Cashier</span>
                    <span>→</span>
                    <span className="bg-yellow-100 px-2 py-1 rounded">Accountant</span>
                    <span>→</span>
                    <span className="bg-orange-100 px-2 py-1 rounded">Manager</span>
                    <span>→</span>
                    <span className="bg-green-100 px-2 py-1 rounded">Director</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• Fuel sales automatically deduct from tank inventory</p>
                  <p>• All sales require full approval chain completion</p>
                  <p>• Director approval completes the workflow</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};