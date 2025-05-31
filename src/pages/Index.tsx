
import React, { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { FuelPOS } from '@/components/FuelPOS';
import { SupermarketPOS } from '@/components/SupermarketPOS';
import { RestaurantPOS } from '@/components/RestaurantPOS';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { AccountantDashboard } from '@/components/AccountantDashboard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'accountant' | 'fuel_cashier' | 'supermarket_cashier' | 'restaurant_cashier';
  department: 'management' | 'accounting' | 'fuel' | 'supermarket' | 'restaurant';
}

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

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

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'management': return 'from-blue-600 to-purple-600';
      case 'accounting': return 'from-green-600 to-teal-600';
      case 'fuel': return 'from-orange-600 to-red-600';
      case 'supermarket': return 'from-emerald-600 to-green-600';
      case 'restaurant': return 'from-amber-600 to-orange-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getDepartmentColor(currentUser.department)} text-white shadow-lg`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Multi-Department POS System</h1>
              <p className="text-blue-100">Fuel Station • Supermarket • Restaurant</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-sm text-blue-100">{getRoleDisplayName(currentUser.role)}</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-white/20 text-white">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Dashboard for Manager */}
        {currentUser.role === 'manager' && (
          <div>
            <Card className="mb-6">
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
        {currentUser.role === 'accountant' && (
          <div>
            <Card className="mb-6">
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
        {currentUser.role === 'fuel_cashier' && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Fuel Station</CardTitle>
                <p className="text-gray-600">Record fuel sales and manage pump operations</p>
              </CardHeader>
            </Card>
            <FuelPOS onSaleRecord={handleSaleRecord} />
          </div>
        )}

        {/* Supermarket POS */}
        {currentUser.role === 'supermarket_cashier' && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Supermarket</CardTitle>
                <p className="text-gray-600">Process grocery sales and manage inventory</p>
              </CardHeader>
            </Card>
            <SupermarketPOS onSaleRecord={handleSaleRecord} />
          </div>
        )}

        {/* Restaurant POS */}
        {currentUser.role === 'restaurant_cashier' && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Restaurant</CardTitle>
                <p className="text-gray-600">Take orders and process restaurant sales</p>
              </CardHeader>
            </Card>
            <RestaurantPOS onSaleRecord={handleSaleRecord} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
