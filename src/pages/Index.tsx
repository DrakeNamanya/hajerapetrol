
import React, { useState } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { TeamManagement } from '@/components/TeamManagement';
import { FuelPOS } from '@/components/FuelPOS';
import { SupermarketPOS } from '@/components/SupermarketPOS';
import { RestaurantPOS } from '@/components/RestaurantPOS';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { AccountantDashboard } from '@/components/AccountantDashboard';
import { DirectorDashboard } from '@/components/DirectorDashboard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, Building2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);

  const handleSaleRecord = (sale: Sale) => {
    setSales(prevSales => [...prevSales, sale]);
  };

  const handleAccountantApprove = (saleId: number) => {
    setSales(prevSales => 
      prevSales.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: 'accountant_approved' }
          : sale
      )
    );
  };

  const handleManagerApprove = (saleId: number) => {
    setSales(prevSales => 
      prevSales.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: 'approved' }
          : sale
      )
    );
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user || !profile) {
    return <AuthPage />;
  }

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'executive': return 'from-purple-600 to-indigo-600';
      case 'management': return 'from-blue-600 to-purple-600';
      case 'accounting': return 'from-green-600 to-teal-600';
      case 'fuel': return 'from-orange-600 to-red-600';
      case 'supermarket': return 'from-emerald-600 to-green-600';
      case 'restaurant': return 'from-amber-600 to-orange-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-red-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className={`bg-gradient-to-r ${getDepartmentColor(profile.department)} text-white shadow-xl relative z-10`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Fuel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">HIPEMART OILS</h1>
                  <p className="text-sm opacity-90">Multi-Department POS System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{profile.full_name}</p>
                <p className="text-sm opacity-90">{getRoleDisplayName(profile.role)}</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-white/20 text-white">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Dashboard for Director */}
        {profile.role === 'director' && (
          <div>
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Executive Dashboard</CardTitle>
                <p className="text-gray-600">Strategic overview of all business operations</p>
              </CardHeader>
            </Card>
            
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Business Overview</TabsTrigger>
                <TabsTrigger value="team">Team Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <DirectorDashboard sales={sales} />
              </TabsContent>
              
              <TabsContent value="team">
                <TeamManagement />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Dashboard for Manager */}
        {profile.role === 'manager' && (
          <div>
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Manager Dashboard</CardTitle>
                <p className="text-gray-600">Monitor all departments and approve sales</p>
              </CardHeader>
            </Card>
            <ManagerDashboard 
              sales={sales} 
              onApprove={handleManagerApprove}
            />
          </div>
        )}

        {/* Dashboard for Accountant */}
        {profile.role === 'accountant' && (
          <div>
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Accountant Dashboard</CardTitle>
                <p className="text-gray-600">Review and approve sales from all departments</p>
              </CardHeader>
            </Card>
            <AccountantDashboard 
              sales={sales} 
              onApprove={handleAccountantApprove}
            />
          </div>
        )}

        {/* Fuel Station POS */}
        {profile.role === 'fuel_cashier' && (
          <div>
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Fuel className="text-orange-600" />
                  Fuel Station
                </CardTitle>
                <p className="text-gray-600">Record fuel sales and manage pump operations</p>
              </CardHeader>
            </Card>
            <FuelPOS onSaleRecord={handleSaleRecord} />
          </div>
        )}

        {/* Supermarket POS */}
        {profile.role === 'supermarket_cashier' && (
          <div>
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="text-green-600" />
                  Supermarket
                </CardTitle>
                <p className="text-gray-600">Process grocery sales and manage inventory</p>
              </CardHeader>
            </Card>
            <SupermarketPOS onSaleRecord={handleSaleRecord} />
          </div>
        )}

        {/* Restaurant POS */}
        {profile.role === 'restaurant_cashier' && (
          <div>
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Restaurant</CardTitle>
                <p className="text-gray-600">Take orders and process restaurant sales</p>
              </CardHeader>
            </Card>
            <RestaurantPOS onSaleRecord={handleSaleRecord} />
          </div>
        )}
      </div>

      {/* Powered by footer - fixed position */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg z-20">
        Powered by <span className="font-semibold text-orange-600">DATACOLLECTORS LTD</span><br />
        <span className="text-gray-600">0701634653</span>
      </div>
    </div>
  );
};

export default Index;
