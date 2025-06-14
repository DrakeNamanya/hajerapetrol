
import React, { useState } from 'react';
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
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Fuel, Building2, UtensilsCrossed, AlertTriangle, CheckCircle, Settings, UserPlus, Edit } from 'lucide-react';

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

interface User {
  id: string;
  email: string;
  name: string;
  role: 'director' | 'manager' | 'accountant' | 'fuel_cashier' | 'supermarket_cashier' | 'restaurant_cashier';
  department: 'executive' | 'management' | 'accounting' | 'fuel' | 'supermarket' | 'restaurant';
  active: boolean;
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
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    password: ''
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: 'HIPEMART OILS',
    address: 'BUKHALIHA ROAD, BUSIA',
    phone: '+256 776 429450',
    email: 'info@hipemartoils.com',
    website: 'www.hipemartoils.com'
  });

  // Mock users data
  const [users, setUsers] = useState<User[]>([
    { id: '1', email: 'director@hipemartoils.com', name: 'James Director', role: 'director', department: 'executive', active: true },
    { id: '2', email: 'manager@hipemartoils.com', name: 'John Manager', role: 'manager', department: 'management', active: true },
    { id: '3', email: 'accountant@hipemartoils.com', name: 'Sarah Accountant', role: 'accountant', department: 'accounting', active: true },
    { id: '4', email: 'fuel@hipemartoils.com', name: 'Mike Fuel', role: 'fuel_cashier', department: 'fuel', active: true },
    { id: '5', email: 'supermarket@hipemartoils.com', name: 'Lisa Market', role: 'supermarket_cashier', department: 'supermarket', active: true },
    { id: '6', email: 'restaurant@hipemartoils.com', name: 'Tom Chef', role: 'restaurant_cashier', department: 'restaurant', active: true },
  ]);

  // Mock expenses from manager
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 1,
      category: 'Equipment Maintenance',
      amount: 350000,
      description: 'Fuel pump maintenance and calibration',
      department: 'Fuel',
      requestedBy: 'John Manager',
      timestamp: new Date(),
      status: 'manager_approved'
    },
    {
      id: 2,
      category: 'Marketing Campaign',
      amount: 500000,
      description: 'Local radio advertisement campaign',
      department: 'All',
      requestedBy: 'John Manager',
      timestamp: new Date(),
      status: 'manager_approved'
    }
  ]);

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
        growth: Math.random() * 20, // Mock growth for demo
        transactions: deptSales.length,
        avgTicket: deptSales.length > 0 ? revenue / deptSales.length : 0
      };
    });
  }, [sales]);

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
    { title: 'Active Users', value: users.filter(u => u.active).length.toString(), change: 1.8, icon: Users },
  ];

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: (users.length + 1).toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as User['role'],
      department: newUser.department as User['department'],
      active: true
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: '', email: '', role: '', department: '', password: '' });
    
    toast({
      title: "User Created",
      description: `${user.name} has been created successfully`,
    });
  };

  const handleExpenseApprove = (expenseId: number) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === expenseId 
          ? { ...expense, status: 'director_approved' as const }
          : expense
      )
    );
    toast({
      title: "Expense Approved",
      description: "Expense has been approved for payment",
    });
  };

  const handleExpenseReject = (expenseId: number) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === expenseId 
          ? { ...expense, status: 'rejected' as const }
          : expense
      )
    );
    toast({
      title: "Expense Rejected",
      description: "Expense has been rejected",
      variant: "destructive"
    });
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingExpenses = expenses.filter(expense => expense.status === 'manager_approved');
  const approvedExpenses = expenses.filter(expense => expense.status === 'director_approved');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
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

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Expense Approvals from Manager
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
                            <h4 className="font-semibold text-lg">{expense.category}</h4>
                            <Badge className={getDepartmentColor(expense.department)}>
                              {expense.department.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{expense.description}</p>
                          <div className="text-sm text-gray-600">
                            <p>Approved by: {expense.requestedBy}</p>
                            <p>Date: {expense.timestamp.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-red-600">
                            UGX {expense.amount.toLocaleString()}
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
                <p className="text-gray-600 text-center py-8">No pending expense approvals</p>
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
                        <span className="font-medium">{expense.category}</span>
                        <span className="text-sm text-gray-600 ml-2">({expense.department})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">UGX {expense.amount.toLocaleString()}</div>
                        <Badge className="bg-green-100 text-green-800">Payment Approved</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <UserPlus className="h-6 w-6" />
                Create New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="fuel_cashier">Fuel Cashier</SelectItem>
                      <SelectItem value="supermarket_cashier">Supermarket Cashier</SelectItem>
                      <SelectItem value="restaurant_cashier">Restaurant Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newUser.department} onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="accounting">Accounting</SelectItem>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="supermarket">Supermarket</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <Button onClick={handleCreateUser} className="mt-4 w-full">
                Create User
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDepartmentColor(user.department)}>
                          {user.department.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
