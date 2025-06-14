
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Fuel, Building2, UtensilsCrossed, AlertTriangle, CheckCircle } from 'lucide-react';

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

interface DirectorDashboardProps {
  sales: Sale[];
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ sales }) => {
  const [timeFilter, setTimeFilter] = useState('month');
  
  // Mock data for comprehensive business overview
  const mockSalesData = [
    { name: 'Jan', fuel: 2400000, supermarket: 1800000, restaurant: 900000, total: 5100000 },
    { name: 'Feb', fuel: 2200000, supermarket: 1900000, restaurant: 950000, total: 5050000 },
    { name: 'Mar', fuel: 2600000, supermarket: 2100000, restaurant: 1100000, total: 5800000 },
    { name: 'Apr', fuel: 2800000, supermarket: 2000000, restaurant: 1050000, total: 5850000 },
    { name: 'May', fuel: 3000000, supermarket: 2200000, restaurant: 1200000, total: 6400000 },
    { name: 'Jun', fuel: 2900000, supermarket: 2150000, restaurant: 1150000, total: 6200000 },
  ];

  const departmentPerformance = [
    { department: 'Fuel Station', revenue: 17900000, growth: 12.5, transactions: 2450, avgTicket: 7306 },
    { department: 'Supermarket', revenue: 12350000, growth: 8.3, transactions: 4200, avgTicket: 2940 },
    { department: 'Restaurant', revenue: 6450000, growth: 15.2, transactions: 1800, avgTicket: 3583 },
  ];

  const pieData = [
    { name: 'Fuel', value: 17900000, color: '#f97316' },
    { name: 'Supermarket', value: 12350000, color: '#10b981' },
    { name: 'Restaurant', value: 6450000, color: '#f59e0b' },
  ];

  const totalRevenue = departmentPerformance.reduce((sum, dept) => sum + dept.revenue, 0);
  const totalTransactions = departmentPerformance.reduce((sum, dept) => sum + dept.transactions, 0);
  const avgGrowth = departmentPerformance.reduce((sum, dept) => sum + dept.growth, 0) / departmentPerformance.length;

  // Mock KPI data
  const kpis = [
    { title: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, change: 14.2, icon: DollarSign },
    { title: 'Total Transactions', value: totalTransactions.toLocaleString(), change: 8.7, icon: ShoppingCart },
    { title: 'Average Growth', value: `${avgGrowth.toFixed(1)}%`, change: 2.3, icon: TrendingUp },
    { title: 'Customer Satisfaction', value: '94.5%', change: 1.8, icon: Users },
  ];

  // Mock expense data
  const expenses = [
    { category: 'Fuel Purchases', amount: 8500000, approved: true, department: 'Fuel' },
    { category: 'Inventory Restocking', amount: 4200000, approved: true, department: 'Supermarket' },
    { category: 'Staff Salaries', amount: 2800000, approved: false, department: 'All' },
    { category: 'Equipment Maintenance', amount: 650000, approved: true, department: 'All' },
    { category: 'Marketing Campaign', amount: 1200000, approved: false, department: 'All' },
  ];

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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Business Overview</TabsTrigger>
          <TabsTrigger value="performance">Department Performance</TabsTrigger>
          <TabsTrigger value="financials">Financial Analysis</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
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

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  fuel: { label: "Fuel", color: "#f97316" },
                  supermarket: { label: "Supermarket", color: "#10b981" },
                  restaurant: { label: "Restaurant", color: "#f59e0b" },
                }}
                className="h-80"
              >
                <AreaChart data={mockSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="fuel" stackId="1" fill="#f97316" />
                  <Area type="monotone" dataKey="supermarket" stackId="1" fill="#10b981" />
                  <Area type="monotone" dataKey="restaurant" stackId="1" fill="#f59e0b" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Department Revenue Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
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
                          +{dept.growth}%
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
                          +{dept.growth}%
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

        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-gray-600">{expense.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">UGX {expense.amount.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          {expense.approved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className={`text-xs ${expense.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                            {expense.approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Margin Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentPerformance.map((dept, index) => {
                    const margin = (dept.revenue * 0.25) / dept.revenue * 100; // Mock 25% margin
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{dept.department}</span>
                          <span className="text-sm text-gray-600">{margin.toFixed(1)}%</span>
                        </div>
                        <Progress value={margin} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Revenue: UGX {dept.revenue.toLocaleString()}</span>
                          <span>Profit: UGX {(dept.revenue * 0.25).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>System Uptime</span>
                    <Badge className="bg-green-100 text-green-800">99.8%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Users</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Approvals</span>
                    <Badge className="bg-yellow-100 text-yellow-800">8</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inventory Alerts</span>
                    <Badge className="bg-red-100 text-red-800">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Fuel Cashiers</span>
                    <div className="text-right">
                      <p className="font-semibold">4 Active</p>
                      <p className="text-xs text-green-600">95% Efficiency</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Supermarket Staff</span>
                    <div className="text-right">
                      <p className="font-semibold">8 Active</p>
                      <p className="text-xs text-green-600">92% Efficiency</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Restaurant Staff</span>
                    <div className="text-right">
                      <p className="font-semibold">6 Active</p>
                      <p className="text-xs text-yellow-600">88% Efficiency</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Low Fuel Inventory</p>
                      <p className="text-xs text-red-600">Premium fuel below 500L</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Pending Manager Approval</p>
                      <p className="text-xs text-yellow-600">5 sales awaiting approval</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">System Backup</p>
                      <p className="text-xs text-blue-600">Completed successfully</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
