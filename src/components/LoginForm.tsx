
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormProps {
  onLogin: (user: any) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'accountant' | 'fuel_cashier' | 'supermarket_cashier' | 'restaurant_cashier';
  department: 'management' | 'accounting' | 'fuel' | 'supermarket' | 'restaurant';
}

const users: User[] = [
  { id: '1', email: 'manager@company.com', name: 'John Manager', role: 'manager', department: 'management' },
  { id: '2', email: 'accountant@company.com', name: 'Sarah Accountant', role: 'accountant', department: 'accounting' },
  { id: '3', email: 'fuel@company.com', name: 'Mike Fuel', role: 'fuel_cashier', department: 'fuel' },
  { id: '4', email: 'supermarket@company.com', name: 'Lisa Market', role: 'supermarket_cashier', department: 'supermarket' },
  { id: '5', email: 'restaurant@company.com', name: 'Tom Chef', role: 'restaurant_cashier', department: 'restaurant' },
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Multi-Department POS
          </CardTitle>
          <p className="text-gray-600 mt-2">Fuel • Supermarket • Restaurant</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Login
          </Button>

          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p><strong>Demo credentials:</strong></p>
            <p>Password: password123</p>
            <p>Select any user role to explore the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
