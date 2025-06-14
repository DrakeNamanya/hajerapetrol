
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Fuel, Building2 } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'director' | 'manager' | 'accountant' | 'fuel_cashier' | 'supermarket_cashier' | 'restaurant_cashier';
  department: 'executive' | 'management' | 'accounting' | 'fuel' | 'supermarket' | 'restaurant';
}

const users: User[] = [
  { id: '1', email: 'director@hipemartoils.com', name: 'James Director', role: 'director', department: 'executive' },
  { id: '2', email: 'manager@hipemartoils.com', name: 'John Manager', role: 'manager', department: 'management' },
  { id: '3', email: 'accountant@hipemartoils.com', name: 'Sarah Accountant', role: 'accountant', department: 'accounting' },
  { id: '4', email: 'fuel@hipemartoils.com', name: 'Mike Fuel', role: 'fuel_cashier', department: 'fuel' },
  { id: '5', email: 'supermarket@hipemartoils.com', name: 'Lisa Market', role: 'supermarket_cashier', department: 'supermarket' },
  { id: '6', email: 'restaurant@hipemartoils.com', name: 'Tom Chef', role: 'restaurant_cashier', department: 'restaurant' },
];

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!selectedUser || !password) {
      setError('Please select a user and enter password');
      return;
    }

    if (password !== 'password123') {
      setError('Invalid password');
      return;
    }

    const user = users.find(u => u.id === selectedUser);
    if (user) {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-6">
          {/* Petrol Station Logo and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
                <Fuel className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">HIPEMART OILS</h1>
            <p className="text-lg text-orange-600 font-semibold">BUKHALIHA ROAD, BUSIA</p>
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Multi-Department POS System
          </CardTitle>
          <p className="text-gray-600 mt-2">Fuel • Supermarket • Restaurant</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="border-2 border-orange-200 focus:border-orange-500">
                <SelectValue placeholder="Choose your role" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg">
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.role.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (password123)"
              className="border-2 border-orange-200 focus:border-orange-500"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
          >
            Login
          </Button>

          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p><strong>Demo credentials:</strong></p>
            <p>Password: password123</p>
            <p>Select any user role to explore the system</p>
          </div>
        </CardContent>
        
        {/* Powered by footer */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Powered by <span className="font-semibold text-orange-600">DATACOLLECTORS LTD</span><br />
          <span className="text-gray-500">0701634653</span>
        </div>
      </Card>
    </div>
  );
};
