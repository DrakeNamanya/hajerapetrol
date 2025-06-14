import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { FuelPOS } from '@/components/FuelPOS';
import { SupermarketPOS } from '@/components/SupermarketPOS';
import { RestaurantPOS } from '@/components/RestaurantPOS';
import { AccountantDashboard } from '@/components/AccountantDashboard';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { ManagerApprovalDashboard } from '@/components/ManagerApprovalDashboard';
import { DirectorDashboard } from '@/components/DirectorDashboard';
import { TeamManagement } from '@/components/TeamManagement';
import { Fuel, ShoppingCart, UtensilsCrossed, Calculator, Users, Building, CheckCircle, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user, profile, loading } = useAuth();
  
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive",
        });
      } else {
        setSales(data || []);
      }
    };

    if (user) {
      fetchSales();
    }
  }, [user]);

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

  const handleSaleRecord = (sale: any) => {
    setSales(prev => [sale, ...prev]);
    console.log('Sale recorded:', sale);
  };

  const handleSaleApproval = (saleId: number) => {
    setSales(prev => prev.map(sale => 
      sale.id === saleId 
        ? { ...sale, status: 'accountant_approved' }
        : sale
    ));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const renderUserContent = () => {
    if (profile.role === 'director') {
      return (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Director Overview</TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="approvals">Sales Approvals</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <DirectorDashboard />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="approvals">Sales Approvals</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="management">
            <ManagerDashboard sales={sales} onApprove={handleSaleApproval} />
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
      return <AccountantDashboard />;
    }

    if (profile.role === 'fuel_cashier') {
      return <FuelPOS onSaleRecord={handleSaleRecord} />;
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
                onClick={handleLogout}
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
        {renderUserContent()}
      </main>
    </div>
  );
};

export default Index;
