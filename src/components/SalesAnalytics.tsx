
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, Users } from 'lucide-react';
import { useSales } from '@/hooks/useSales';

interface Sale {
  id: string;
  department: string;
  total: number;
  created_at: string;
  status: string;
  items: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DEPARTMENT_COLORS = {
  fuel: '#FF6B35',
  supermarket: '#4ECDC4', 
  restaurant: '#45B7D1'
};

export const SalesAnalytics: React.FC = () => {
  const { sales } = useSales();
  const [timeFilter, setTimeFilter] = useState('7days');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    let filtered = [...sales];
    
    // Apply time filter
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeFilter) {
      case '1day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setFullYear(2020); // All time
    }
    
    filtered = filtered.filter(sale => new Date(sale.created_at) >= cutoffDate);
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.department === departmentFilter);
    }
    
    return filtered;
  }, [sales, timeFilter, departmentFilter]);

  const analytics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalSales = filteredSales.length;
    const approvedSales = filteredSales.filter(sale => sale.status === 'director_approved').length;
    const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length;
    
    // Calculate approval rate
    const approvalRate = totalSales > 0 ? (approvedSales / totalSales) * 100 : 0;
    
    // Calculate average sale value
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Department breakdown
    const departmentStats = filteredSales.reduce((acc, sale) => {
      const dept = sale.department;
      if (!acc[dept]) {
        acc[dept] = { revenue: 0, count: 0 };
      }
      acc[dept].revenue += Number(sale.total);
      acc[dept].count += 1;
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    return {
      totalRevenue,
      totalSales,
      approvedSales,
      pendingSales,
      approvalRate,
      avgSaleValue,
      departmentStats
    };
  }, [filteredSales]);

  const chartData = useMemo(() => {
    // Group sales by date
    const salesByDate = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, count: 0 };
      }
      acc[date].revenue += Number(sale.total);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; count: number }>);

    return Object.values(salesByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredSales]);

  const departmentChartData = useMemo(() => {
    return Object.entries(analytics.departmentStats).map(([dept, stats]) => ({
      department: dept.toUpperCase(),
      revenue: stats.revenue,
      count: stats.count,
      fill: DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS] || '#8884D8'
    }));
  }, [analytics.departmentStats]);

  const hourlyData = useMemo(() => {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      sales: 0,
      revenue: 0
    }));

    filteredSales.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      hourlyStats[hour].sales += 1;
      hourlyStats[hour].revenue += Number(sale.total);
    });

    return hourlyStats.filter(data => data.sales > 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1day">Last 24h</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="fuel">Fuel</SelectItem>
            <SelectItem value="supermarket">Supermarket</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {analytics.totalRevenue.toLocaleString()}</div>
            <Badge variant="outline" className="mt-1">
              {analytics.totalSales} sales
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {Math.round(analytics.avgSaleValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            {analytics.approvalRate >= 80 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.approvedSales} of {analytics.totalSales} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingSales}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "#8884d8",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? `UGX ${Number(value).toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Sales Count'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "#8884d8",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.department}: UGX ${entry.revenue.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {departmentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Count by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Sales Count",
                      color: "#82ca9d",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Activity by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sales: {
                    label: "Sales Count",
                    color: "#8884d8",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? `UGX ${Number(value).toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Sales Count'
                      ]}
                    />
                    <Bar dataKey="sales" fill="#8884d8" />
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
