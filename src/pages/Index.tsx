import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { FuelPOS } from '@/components/FuelPOS';
import { SupermarketPOS } from '@/components/SupermarketPOS';
import { RestaurantPOS } from '@/components/RestaurantPOS';
import { AccountantDashboard } from '@/components/AccountantDashboard';
import { FuelAttendantDashboard } from '@/components/FuelAttendantDashboard';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { ManagerApprovalDashboard } from '@/components/ManagerApprovalDashboard';
import { DirectorDashboard } from '@/components/DirectorDashboard';
import { TeamManagement } from '@/components/TeamManagement';
import { SalesAnalytics } from '@/components/SalesAnalytics';
import { InventoryManagement } from '@/components/InventoryManagement';
import { Fuel, ShoppingCart, UtensilsCrossed, Building, LogOut, BarChart3, Package } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useAuth as useAuthOperations } from '@/contexts/AuthContext';
import { RealtimeNotifications } from '@/components/RealtimeNotifications';

// Transform database sales data to match the expected Sale interface
const transformSalesData = (dbSales: any[]) => {
  return dbSales.map(sale => ({
    id: sale.id,
    department: sale.department,
    type: sale.sale_type,
    customer: sale.customer_name || 'Unknown Customer',
    items: sale.items,
    total: sale.total,
    paymentMethod: sale.payment_method,
    timestamp: new Date(sale.created_at),
    status: sale.status,
    tableNumber: sale.table_number
  }));
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { sales: rawSales, error: salesError, isLoading: salesLoading } = useSales();
  const { signOut } = useAuthOperations();

  console.log('Index component state:', { 
    user: !!user, 
    profile: !!profile, 
    loading, 
    salesError: !!salesError,
    salesLoading,
    salesCount: rawSales?.length || 0
  });

  // Transform the sales data to match expected interface
  const sales = rawSales ? transformSalesData(rawSales) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  // Show error if sales failed to load for roles that need it
  if (salesError && ['director', 'manager', 'accountant'].includes(profile.role)) {
    console.error('Sales loading error for', profile.role, ':', salesError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Unable to Load Sales Data</h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the sales data. Error details:
            </p>
            <div className="text-left text-sm text-gray-500 mb-6 p-3 bg-gray-100 rounded">
              <p><strong>Error:</strong> {salesError?.message || 'Unknown error'}</p>
              {(salesError as any)?.code && <p><strong>Code:</strong> {(salesError as any).code}</p>}
              {(salesError as any)?.hint && <p><strong>Hint:</strong> {(salesError as any).hint}</p>}
            </div>
            <p className="text-gray-600 mb-4">This might be due to:</p>
            <ul className="text-left text-sm text-gray-500 mb-6 space-y-1">
              <li>• Network connectivity issues</li>
              <li>• Database access permissions</li>
              <li>• Your user profile setup</li>
              <li>• Row Level Security policies</li>
            </ul>
            <Button onClick={() => window.location.reload()} className="mr-2">
              Retry
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaleRecord = (sale: any) => {
    console.log('Sale recorded:', sale);
    // Sales will be automatically updated via real-time subscription in useSales hook
  };

  const handleSaleApproval = (saleId: number) => {
    console.log('Sale approved:', saleId);
    // Sales will be automatically updated via real-time subscription in useSales hook
  };

  const renderUserContent = () => {
    if (profile.role === 'director') {
      return (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Director Overview</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="approvals">Sales Approvals</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <DirectorDashboard sales={sales} />
          </TabsContent>
          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>
          <TabsContent value="approvals">
            <ManagerApprovalDashboard />
          </TabsContent>
        </Tabs>
      );
    }

    if (profile.role === 'manager') {
      return (
        <Tabs defaultValue="management" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="approvals">Sales Approvals</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="management">
            <ManagerDashboard sales={sales} onApprove={handleSaleApproval} />
          </TabsContent>
          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
          <TabsContent value="approvals">
            <ManagerApprovalDashboard />
          </TabsContent>
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>
        </Tabs>
      );
    }

    if (profile.role === 'accountant') {
      return (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <AccountantDashboard />
          </TabsContent>
          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
        </Tabs>
      );
    }

    if (profile.role === 'fuel_cashier') {
      return <FuelAttendantDashboard />;
    }

    if (profile.role === 'supermarket_cashier') {
      return <SupermarketPOS onSaleRecord={handleSaleRecord} />;
    }

    if (profile.role === 'restaurant_cashier') {
      return <RestaurantPOS onSaleRecord={handleSaleRecord} />;
    }

    return (
      <Card>
        <CardContent className="p-6">
          <p>Welcome! Your role dashboard is being set up.</p>
        </CardContent>
      </Card>
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'accountant': return 'bg-green-100 text-green-800';
      case 'fuel_cashier': return 'bg-orange-100 text-orange-800';
      case 'supermarket_cashier': return 'bg-emerald-100 text-emerald-800';
      case 'restaurant_cashier': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Real-time notifications - only show for accountants, managers, and directors */}
      {(profile?.role === 'accountant' || profile?.role === 'manager' || profile?.role === 'director') && (
        <RealtimeNotifications />
      )}
      
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">HIPEMART OILS</h1>
                <p className="text-sm text-gray-600">Business Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(profile.role)}>
                    {profile.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {profile.department.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {salesLoading && ['director', 'manager', 'accountant'].includes(profile.role) ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sales data...</p>
            </CardContent>
          </Card>
        ) : (
          renderUserContent()
        )}
      </main>
    </div>
  );
};

export default Index;
