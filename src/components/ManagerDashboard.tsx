import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Fuel, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderManager } from './PurchaseOrderManager';
import { FuelTankManager } from './FuelTankManager';
import type { User } from '@supabase/supabase-js';

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
  id: string;
  type: string;
  description: string;
  amount: number;
  department: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  requested_by: string;
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

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      console.log('Fetching expenses for manager approval...');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Manager expenses fetched:', data);
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    }
  };

  const updateExpenseStatus = async (expenseId: string, newStatus: string, rejectionReason?: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to update expenses",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'manager_approved') {
        updateData.approved_by_manager = currentUser.id;
        updateData.manager_approved_at = new Date().toISOString();
      }

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Expense ${newStatus === 'rejected' ? 'rejected' : 'approved and sent to director'}`,
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleExpenseApprove = (expenseId: string) => {
    updateExpenseStatus(expenseId, 'manager_approved');
  };

  const handleExpenseReject = (expenseId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      updateExpenseStatus(expenseId, 'rejected', reason);
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expense Approval</TabsTrigger>
          <TabsTrigger value="tank">Tank Management</TabsTrigger>
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
                            <h4 className="font-semibold text-lg">{expense.type}</h4>
                            <Badge className={getDepartmentColor(expense.department)}>
                              {expense.department?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{expense.description}</p>
                          <div className="text-sm text-gray-600">
                            <p>Date: {new Date(expense.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-red-600">
                            UGX {Number(expense.amount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleExpenseApprove(expense.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          Approve & Send to Director
                        </Button>
                        <Button 
                          onClick={() => handleExpenseReject(expense.id)}
                          variant="destructive"
                          className="flex-1"
                          disabled={loading}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No pending expense requests from accountant</p>
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
                        <span className="font-medium">{expense.type}</span>
                        <span className="text-sm text-gray-600 ml-2">({expense.department})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">UGX {Number(expense.amount).toLocaleString()}</div>
                        <Badge className="bg-blue-100 text-blue-800">Awaiting Director</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>


        <TabsContent value="tank" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-6 w-6" />
                Fuel Tank Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FuelTankManager />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
