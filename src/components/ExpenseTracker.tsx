import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Expense {
  id: string;
  type: string;
  description: string;
  amount: number;
  department: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

interface ExpenseTrackerProps {
  userRole: 'employee' | 'accountant' | 'manager' | 'director';
  department?: string;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ userRole, department = 'supermarket' }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    type: '',
    description: '',
    amount: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.log('Auth error:', error.message);
        setAuthError(error.message);
        // For demo purposes, create a mock user
        setCurrentUser({
          id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
          email: 'demo@example.com',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          confirmed_at: new Date().toISOString()
        });
        return;
      }
      setCurrentUser(user);
      setAuthError(null);
      console.log('Current user:', user);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      setAuthError('Authentication system not available');
      // For demo purposes, create a mock user
      setCurrentUser({
        id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
        email: 'demo@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmed_at: new Date().toISOString()
      });
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    }
  };

  const submitExpense = async () => {
    if (!newExpense.type || !newExpense.description || !newExpense.amount || !newExpense.department) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "User session not available",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting expense with user:', currentUser.id);
      
      const { error } = await supabase
        .from('expenses')
        .insert({
          type: newExpense.type,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          department: newExpense.department,
          requested_by: currentUser.id
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Expense submitted for approval",
      });

      setNewExpense({
        type: '',
        description: '',
        amount: '',
        department: ''
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast({
        title: "Error",
        description: `Failed to submit expense: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpenseStatus = async (expenseId: string, newStatus: string, rejectionReason?: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to update expenses",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set the appropriate approval fields based on user role
      if (userRole === 'accountant' && newStatus === 'accountant_approved') {
        updateData.approved_by_accountant = currentUser.id;
        updateData.accountant_approved_at = new Date().toISOString();
      } else if (userRole === 'manager' && newStatus === 'manager_approved') {
        updateData.approved_by_manager = currentUser.id;
        updateData.manager_approved_at = new Date().toISOString();
      } else if (userRole === 'director' && newStatus === 'director_approved') {
        updateData.approved_by_director = currentUser.id;
        updateData.director_approved_at = new Date().toISOString();
      }

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Expense ${newStatus === 'rejected' ? 'rejected' : 'approved'}`,
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accountant_approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Accountant Approved</Badge>;
      case 'manager_approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Manager Approved</Badge>;
      case 'director_approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Fully Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canApprove = (expense: Expense) => {
    if (userRole === 'accountant' && expense.status === 'pending') return true;
    if (userRole === 'manager' && expense.status === 'accountant_approved') return true;
    if (userRole === 'director' && expense.status === 'manager_approved') return true;
    return false;
  };

  const getNextApprovalStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'accountant_approved';
      case 'accountant_approved': return 'manager_approved';
      case 'manager_approved': return 'director_approved';
      default: return currentStatus;
    }
  };

  return (
    <div className="space-y-6">
      {authError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <p className="font-medium">Authentication Notice</p>
                <p className="text-sm">Running in demo mode - authentication system not fully configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(userRole === 'employee' || userRole === 'accountant') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Submit New Expense
              {currentUser && (
                <Badge variant="outline" className="ml-auto">
                  <User className="h-3 w-3 mr-1" />
                  {currentUser.email || 'Demo User'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expense Type</Label>
                <Select value={newExpense.type} onValueChange={(value) => setNewExpense({...newExpense, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplies">Office Supplies</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="inventory">Inventory Purchase</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={newExpense.department} onValueChange={(value) => setNewExpense({...newExpense, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="fuel">Fuel Station</SelectItem>
                    <SelectItem value="all">All Departments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount (UGX)</Label>
              <Input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Describe the expense..."
                rows={3}
              />
            </div>
            <Button 
              onClick={submitExpense} 
              disabled={loading || !currentUser} 
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expense Approval Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="capitalize">{expense.type}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>UGX {expense.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  <TableCell className="capitalize">{expense.department}</TableCell>
                  <TableCell>{new Date(expense.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {canApprove(expense) && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateExpenseStatus(expense.id, getNextApprovalStatus(expense.status))}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) updateExpenseStatus(expense.id, 'rejected', reason);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {expense.status === 'rejected' && expense.rejection_reason && (
                      <div className="text-sm text-red-600">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {expense.rejection_reason}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
