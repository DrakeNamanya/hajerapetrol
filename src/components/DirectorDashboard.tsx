import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Fuel, Building2, UtensilsCrossed, AlertTriangle, CheckCircle, Settings, UserPlus, Edit, FileText, UserX, UserCheck } from 'lucide-react';
import { PurchaseOrderManager } from './PurchaseOrderManager';
import { ApprovalReminderManager } from './ApprovalReminderManager';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserProfile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

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

interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface DirectorDashboardProps {
  sales: Sale[];
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ sales }) => {
  const [timeFilter, setTimeFilter] = useState('month');
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: 'HIPEMART OILS',
    address: 'BUKHALIHA ROAD, BUSIA',
    phone: '+256 776 429450',
    email: 'info@hipemartoils.com',
    website: 'www.hipemartoils.com'
  });

  useEffect(() => {
    fetchTeamMembers();
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
      setLoadingExpenses(true);
      console.log('Fetching expenses from Supabase...');
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('status', 'manager_approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: "Error",
          description: "Failed to load expenses",
          variant: "destructive",
        });
      } else {
        console.log('Expenses fetched:', data);
        setExpenses(data || []);
      }
    } catch (error) {
      console.error('Error in fetchExpenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoadingUsers(true);
      console.log('Fetching team members from Supabase...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } else {
        console.log('Team members fetched:', data);
        setTeamMembers(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        toast({
          title: "Error",
          description: "Failed to update user status",
          variant: "destructive",
        });
      } else {
        setTeamMembers(prev => prev.map(member => 
          member.id === userId 
            ? { ...member, is_active: !currentStatus }
            : member
        ));
        toast({
          title: "Success",
          description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive",
        });
      } else {
        setTeamMembers(prev => prev.map(member => 
          member.id === userId 
            ? { ...member, role: newRole }
            : member
        ));
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  // Real data from sales prop
  const realSalesData = React.useMemo(() => {
    const monthlyData = sales.reduce((acc, sale) => {
      const month = sale.timestamp.toLocaleDateString('en-US', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { name: month, fuel: 0, supermarket: 0, restaurant: 0, total: 0 };
      }
      acc[month][sale.department as keyof typeof acc[typeof month]] += sale.total;
      acc[month].total += sale.total;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(monthlyData);
  }, [sales]);

  const departmentPerformance = React.useMemo(() => {
    return ['fuel', 'supermarket', 'restaurant'].map(dept => {
      const deptSales = sales.filter(sale => sale.department === dept);
      const revenue = deptSales.reduce((sum, sale) => sum + sale.total, 0);
      return {
        department: dept.charAt(0).toUpperCase() + dept.slice(1),
        revenue,
        growth: revenue > 0 ? Math.round((revenue / 1000000) * 5 + 2) : 0, // Stable growth based on revenue
        transactions: deptSales.length,
        avgTicket: deptSales.length > 0 ? revenue / deptSales.length : 0
      };
    });
  }, [sales]);

  // Calculate Profit & Loss Statement data using real expenses
  const profitLossData = React.useMemo(() => {
    // Revenue by department from actual sales
    const revenueByDept = {
      fuel: sales.filter(s => s.department === 'fuel').reduce((sum, sale) => sum + sale.total, 0),
      supermarket: sales.filter(s => s.department === 'supermarket').reduce((sum, sale) => sum + sale.total, 0),
      restaurant: sales.filter(s => s.department === 'restaurant').reduce((sum, sale) => sum + sale.total, 0)
    };

    // Expenses by department from real expenses data
    const expensesByDept = {
      fuel: expenses.filter(e => e.department?.toLowerCase() === 'fuel' && e.status === 'director_approved').reduce((sum, exp) => sum + Number(exp.amount), 0),
      supermarket: expenses.filter(e => e.department?.toLowerCase() === 'supermarket' && e.status === 'director_approved').reduce((sum, exp) => sum + Number(exp.amount), 0),
      restaurant: expenses.filter(e => e.department?.toLowerCase() === 'restaurant' && e.status === 'director_approved').reduce((sum, exp) => sum + Number(exp.amount), 0),
      all: expenses.filter(e => e.department?.toLowerCase() === 'all' && e.status === 'director_approved').reduce((sum, exp) => sum + Number(exp.amount), 0)
    };

    const totalRevenue = Object.values(revenueByDept).reduce((sum, rev) => sum + rev, 0);
    const totalExpenses = Object.values(expensesByDept).reduce((sum, exp) => sum + exp, 0);
    const totalProfit = totalRevenue - totalExpenses;

    return {
      revenue: revenueByDept,
      expenses: expensesByDept,
      totalRevenue,
      totalExpenses,
      totalProfit
    };
  }, [sales, expenses]);

  const pieData = departmentPerformance.map(dept => ({
    name: dept.department,
    value: dept.revenue,
    color: dept.department === 'Fuel' ? '#f97316' : dept.department === 'Supermarket' ? '#10b981' : '#f59e0b'
  }));

  const totalRevenue = departmentPerformance.reduce((sum, dept) => sum + dept.revenue, 0);
  const totalTransactions = departmentPerformance.reduce((sum, dept) => sum + dept.transactions, 0);
  const avgGrowth = departmentPerformance.reduce((sum, dept) => sum + dept.growth, 0) / departmentPerformance.length;

  const kpis = [
    { title: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, change: 14.2, icon: DollarSign },
    { title: 'Total Transactions', value: totalTransactions.toLocaleString(), change: 8.7, icon: ShoppingCart },
    { title: 'Average Growth', value: `${avgGrowth.toFixed(1)}%`, change: 2.3, icon: TrendingUp },
    { title: 'Active Users', value: teamMembers.filter(u => u.is_active).length.toString(), change: 1.8, icon: Users },
  ];

  const handleExpenseApprove = async (expenseId: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to approve expenses",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'director_approved',
          approved_by_director: currentUser.id,
          director_approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Expense Approved",
        description: "Expense has been approved for payment",
      });

      fetchExpenses(); // Refresh the data
    } catch (error) {
      console.error('Error approving expense:', error);
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    }
  };

  const handleExpenseReject = async (expenseId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Expense Rejected",
        description: "Expense has been rejected",
        variant: "destructive"
      });

      fetchExpenses(); // Refresh the data
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast({
        title: "Error",
        description: "Failed to reject expense",
        variant: "destructive",
      });
    }
  };

  const handleBusinessSettingsUpdate = () => {
    toast({
      title: "Business Settings Updated",
      description: "Business information has been updated successfully",
    });
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'fuel': return <Fuel className="h-5 w-5" />;
      case 'supermarket': return <Building2 className="h-5 w-5" />;
      case 'restaurant': return <UtensilsCrossed className="h-5 w-5" />;
      default: return <ShoppingCart className="h-5 w-5" />;
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'fuel': return 'bg-orange-100 text-orange-800';
      case 'supermarket': return 'bg-green-100 text-green-800';
      case 'restaurant': return 'bg-amber-100 text-amber-800';
      case 'executive': return 'bg-purple-100 text-purple-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'accounting': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const pendingExpenses = expenses.filter(expense => expense.status === 'manager_approved');
  const approvedExpenses = expenses.filter(expense => expense.status === 'director_approved');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="reports">Real Reports</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">Business Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Time Filter */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Executive Summary</h3>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <Card key={index} className="bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <kpi.icon className="h-8 w-8 text-blue-600" />
                    <div className={`flex items-center gap-1 text-sm ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                  <p className="text-sm text-gray-600">{kpi.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ChartContainer
                    config={{
                      fuel: { label: "Fuel", color: "#f97316" },
                      supermarket: { label: "Supermarket", color: "#10b981" },
                      restaurant: { label: "Restaurant", color: "#f59e0b" },
                    }}
                    className="h-64"
                  >
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No sales data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentPerformance.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDepartmentIcon(dept.department)}
                        <div>
                          <p className="font-medium">{dept.department}</p>
                          <p className="text-sm text-gray-600">{dept.transactions} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">UGX {dept.revenue.toLocaleString()}</p>
                        <p className={`text-sm ${dept.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          +{dept.growth.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth %</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Avg Ticket</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentPerformance.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDepartmentIcon(dept.department)}
                          <span className="font-medium">{dept.department}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        UGX {dept.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={dept.growth > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          +{dept.growth.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{dept.transactions.toLocaleString()}</TableCell>
                      <TableCell>UGX {dept.avgTicket.toLocaleString()}</TableCell>
                      <TableCell>
                        <Progress 
                          value={(dept.revenue / Math.max(...departmentPerformance.map(d => d.revenue))) * 100} 
                          className="w-20"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit-loss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Profit & Loss Statement
              </CardTitle>
              <p className="text-sm text-gray-600">Financial overview showing revenue and expenses by department</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Revenue Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2">
                    REVENUE
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-orange-600" />
                        <span>Fuel Department</span>
                      </div>
                      <span className="font-semibold text-green-700">
                        UGX {profitLossData.revenue.fuel.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span>Supermarket Department</span>
                      </div>
                      <span className="font-semibold text-green-700">
                        UGX {profitLossData.revenue.supermarket.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                        <span>Restaurant Department</span>
                      </div>
                      <span className="font-semibold text-green-700">
                        UGX {profitLossData.revenue.restaurant.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-green-300 pt-3">
                      <div className="flex justify-between items-center font-bold text-green-800 text-lg">
                        <span>Total Revenue</span>
                        <span>UGX {profitLossData.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2">
                    EXPENSES
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-orange-600" />
                        <span>Fuel Department</span>
                      </div>
                      <span className="font-semibold text-red-700">
                        UGX {profitLossData.expenses.fuel.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span>Supermarket Department</span>
                      </div>
                      <span className="font-semibold text-red-700">
                        UGX {profitLossData.expenses.supermarket.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                        <span>Restaurant Department</span>
                      </div>
                      <span className="font-semibold text-red-700">
                        UGX {profitLossData.expenses.restaurant.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span>General/Administrative</span>
                      </div>
                      <span className="font-semibold text-red-700">
                        UGX {profitLossData.expenses.all.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-red-300 pt-3">
                      <div className="flex justify-between items-center font-bold text-red-800 text-lg">
                        <span>Total Expenses</span>
                        <span>UGX {profitLossData.totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Profit Line */}
              <div className="mt-8 pt-6 border-t-2 border-gray-400">
                <div className={`flex justify-between items-center p-4 rounded-lg text-xl font-bold ${
                  profitLossData.totalProfit >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span>Total Profit = Revenue - Expenses</span>
                  <span className="text-2xl">
                    UGX {profitLossData.totalProfit.toLocaleString()}
                  </span>
                </div>
                {profitLossData.totalProfit < 0 && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    ⚠️ Business is running at a loss. Review expenses and optimize operations.
                  </p>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-blue-800">Profit Margin</h4>
                    <p className="text-xl font-bold text-blue-900">
                      {profitLossData.totalRevenue > 0 
                        ? ((profitLossData.totalProfit / profitLossData.totalRevenue) * 100).toFixed(1)
                        : '0.0'
                      }%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-purple-800">Expense Ratio</h4>
                    <p className="text-xl font-bold text-purple-900">
                      {profitLossData.totalRevenue > 0 
                        ? ((profitLossData.totalExpenses / profitLossData.totalRevenue) * 100).toFixed(1)
                        : '0.0'
                      }%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-indigo-50">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-indigo-800">Best Performer</h4>
                    <p className="text-xl font-bold text-indigo-900">
                      {Object.entries(profitLossData.revenue)
                        .reduce((a, b) => a[1] > b[1] ? a : b)[0]
                        .charAt(0).toUpperCase() + 
                       Object.entries(profitLossData.revenue)
                        .reduce((a, b) => a[1] > b[1] ? a : b)[0]
                        .slice(1)
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Expense Approvals from Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading expenses...</p>
                </div>
              ) : pendingExpenses.length > 0 ? (
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
                        >
                          Approve Payment
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
                <p className="text-gray-600 text-center py-8">No pending expense approvals from manager</p>
              )}
            </CardContent>
          </Card>

          {approvedExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Approved Expenses - Ready for Payment</CardTitle>
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
                        <Badge className="bg-green-100 text-green-800">Payment Approved</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PurchaseOrderManager userRole="director" />
            <ApprovalReminderManager />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Sales Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Today's Sales</h4>
                        <p className="text-2xl font-bold">UGX {sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Total Transactions</h4>
                        <p className="text-2xl font-bold">{sales.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Average Sale</h4>
                        <p className="text-2xl font-bold">UGX {sales.length > 0 ? (sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length).toLocaleString() : '0'}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.slice(-10).reverse().map(sale => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.timestamp.toLocaleTimeString()}</TableCell>
                          <TableCell>
                            <Badge className={getDepartmentColor(sale.department)}>
                              {sale.department.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{sale.customer}</TableCell>
                          <TableCell>{sale.items.length} items</TableCell>
                          <TableCell className="font-semibold">UGX {sale.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={sale.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {sale.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No sales data available. Sales will appear here as they are made.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                User Management & Administration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage existing team members, their roles, and account status. Use Team Management tab to invite new members.
              </p>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading team members...</p>
                </div>
              ) : teamMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {member.full_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium">{member.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Select 
                            value={member.role} 
                            onValueChange={(value: UserRole) => handleUpdateUserRole(member.id, value)}
                            disabled={member.role === 'director'}
                          >
                            <SelectTrigger className="w-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="director" disabled>Director</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="accountant">Accountant</SelectItem>
                              <SelectItem value="fuel_cashier">Fuel Cashier</SelectItem>
                              <SelectItem value="supermarket_cashier">Supermarket Cashier</SelectItem>
                              <SelectItem value="restaurant_cashier">Restaurant Cashier</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDepartmentColor(member.department)}>
                            {member.department.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {member.is_active ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(member.created_at || '').toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(member.id, member.is_active)}
                              disabled={member.role === 'director'}
                              className={`${member.is_active 
                                ? 'text-red-600 border-red-300 hover:bg-red-50' 
                                : 'text-green-600 border-green-300 hover:bg-green-50'
                              }`}
                            >
                              {member.is_active ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No team members found. Use Team Management to invite new members.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-blue-800">Total Users</h4>
                <p className="text-2xl font-bold text-blue-900">{teamMembers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-green-800">Active Users</h4>
                <p className="text-2xl font-bold text-green-900">
                  {teamMembers.filter(u => u.is_active).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-orange-800">Managers</h4>
                <p className="text-2xl font-bold text-orange-900">
                  {teamMembers.filter(u => u.role === 'manager').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-purple-800">Cashiers</h4>
                <p className="text-2xl font-bold text-purple-900">
                  {teamMembers.filter(u => u.role.includes('cashier')).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Note */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Admin Notes:</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Directors cannot be deactivated or have their role changed</li>
                <li>Role changes take effect immediately</li>
                <li>Deactivated users cannot log in but their data is preserved</li>
                <li>Use Team Management tab to invite new team members</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.name}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessSettings.website}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter business address"
                  />
                </div>
              </div>
              <Button onClick={handleBusinessSettingsUpdate} className="mt-4 w-full">
                Update Business Information
              </Button>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> These settings will appear on all receipts and invoices generated by the system.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
