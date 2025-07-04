import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, UserCheck, UserX, Trash2, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { ConnectionTest } from './ConnectionTest';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export const TeamManagement: React.FC = () => {
  const { profile, user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (profile?.role === 'director') {
      fetchTeamData();
    }
  }, [profile]);

  const fetchTeamData = async () => {
    try {
      console.log('Fetching team data...');
      
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (membersError) {
        console.error('Error fetching team members:', membersError);
      } else {
        console.log('Team members fetched:', members);
        setTeamMembers(members || []);
      }
    } catch (error) {
      console.error('Error in fetchTeamData:', error);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Starting account creation process ===');
    console.log('Form data:', { email, role, department, fullName });
    
    if (!email || !role || !department || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingMember = teamMembers.find(member => member.email.toLowerCase() === normalizedEmail);
    
    if (existingMember) {
      setError('This email is already registered as a team member');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Step 1: Checking Supabase connection...');
      
      // Test basic Supabase connectivity first
      const { data: testConnection, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('Supabase connection test failed:', connectionError);
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }
      
      console.log('Step 2: Supabase connection OK, getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session?.access_token) {
        console.error('No valid session found');
        throw new Error('Please sign out and sign in again to refresh your session.');
      }

      console.log('Step 3: Session verified, preparing Edge Function request...');
      const requestPayload = {
        email: normalizedEmail,
        role: role,
        department: department,
        fullName: fullName.trim(),
        inviterName: profile?.full_name || 'Director',
        businessName: 'HIPEMART OILS'
      };
      
      console.log('Step 4: Request payload prepared:', requestPayload);
      
      // Add timeout and better error handling for the Edge Function call
      console.log('Step 5: Calling Edge Function with 30 second timeout...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let functionResponse;
      try {
        functionResponse = await supabase.functions.invoke('create-team-account', {
          body: requestPayload,
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (invokeError: any) {
        clearTimeout(timeoutId);
        console.error('Edge Function invoke error:', invokeError);
        
        if (invokeError.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds. Please check your internet connection and try again.');
        }
        
        if (invokeError.message?.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
        }
        
        if (invokeError.message?.includes('NetworkError')) {
          throw new Error('Network error occurred. Please check your internet connection and try again.');
        }
        
        throw new Error(`Failed to send request to Edge Function: ${invokeError.message}`);
      }

      const { data, error: functionError } = functionResponse;
      
      console.log('Step 6: Edge Function response received:', { data, error: functionError });

      if (functionError) {
        console.error('Edge Function error details:', {
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code
        });
        
        // More specific error handling
        if (functionError.message?.includes('already exists') || functionError.details?.includes('already exists')) {
          throw new Error('An account with this email already exists in the system.');
        }
        
        if (functionError.message?.includes('authorization') || functionError.message?.includes('Invalid authorization')) {
          throw new Error('Authentication failed. Please sign out and sign in again.');
        }
        
        if (functionError.message?.includes('validation') || functionError.message?.includes('Missing required fields')) {
          throw new Error('Please check that all fields are filled correctly.');
        }
        
        if (functionError.message?.includes('email') && functionError.message?.includes('invalid')) {
          throw new Error('Please provide a valid email address.');
        }
        
        // Generic error with more details
        const errorMsg = functionError.message || functionError.details || 'Unknown error occurred';
        throw new Error(`Account creation failed: ${errorMsg}`);
      }

      if (!data) {
        console.error('No data returned from Edge Function');
        throw new Error('Account creation failed - no response from server. Please try again.');
      }

      if (!data.success) {
        console.error('Edge Function returned failure:', data);
        throw new Error(data.error || 'Account creation failed for unknown reason.');
      }

      console.log('Step 7: Account created successfully:', data);
      
      setSuccess(`✅ Account created successfully for ${fullName}!
      
📧 Login credentials have been sent to ${email}.
      
🔐 They can login immediately with the provided credentials and will be prompted to change their password on first login.`);
      
      // Clear form
      setEmail('');
      setRole('');
      setDepartment('');
      setFullName('');
      
      // Refresh team data
      fetchTeamData();

    } catch (error: any) {
      console.error('=== Account creation error ===');
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let displayError = error.message || 'An unexpected error occurred';
      
      // Handle common network errors
      if (displayError.includes('Failed to fetch') || displayError.includes('NetworkError')) {
        displayError = 'Network error. Please check your internet connection and try again.';
      } else if (displayError.includes('timeout') || displayError.includes('timed out')) {
        displayError = 'Request timed out. Please check your internet connection and try again.';
      } else if (displayError.includes('Edge Function returned a non-2xx status code')) {
        displayError = 'Server error occurred. Please try again in a few moments. If the issue persists, check that all required information is provided correctly.';
      }
      
      setError(displayError);
    } finally {
      setLoading(false);
      console.log('=== Account creation process completed ===');
    }
  };

  const handleToggleAccount = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error toggling account status:', error);
        setError('Failed to update account status');
      } else {
        setSuccess(`Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error toggling account:', error);
      setError('Failed to update account status');
    }
  };

  const handleDeleteAccount = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${memberName}'s account? This action cannot be undone.`)) {
      return;
    }

    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deleting account:', error);
        setError('Failed to delete account');
      } else {
        setSuccess(`Account for ${memberName} has been deleted successfully`);
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case 'executive': return 'bg-purple-100 text-purple-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'accounting': return 'bg-green-100 text-green-800';
      case 'fuel': return 'bg-orange-100 text-orange-800';
      case 'supermarket': return 'bg-emerald-100 text-emerald-800';
      case 'restaurant': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (profile?.role !== 'director') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Only directors can manage team members.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out deleted accounts
  const activeTeamMembers = teamMembers.filter(member => !member.deleted_at);

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <ConnectionTest />

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Direct Account Creation System
          </h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li><strong>Create complete accounts</strong> - Enter employee details and create their account instantly</li>
            <li><strong>Automatic credentials</strong> - System generates secure password and sends login details via email</li>
            <li><strong>Immediate access</strong> - Employees can login right away (no signup required)</li>
            <li><strong>Password security</strong> - Users must change password on first login</li>
            <li><strong>Full control</strong> - Activate, deactivate, or delete accounts as needed</li>
          </ol>
        </CardContent>
      </Card>

      {/* Create New Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create Team Member Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
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
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="accounting">Accounting</SelectItem>
                    <SelectItem value="fuel">Fuel Station</SelectItem>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Creating Account...' : 'Create Account & Send Credentials'}
            </Button>
          </form>
          
          {error && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-600 whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-600 whitespace-pre-line">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({activeTeamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeTeamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(member.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getDepartmentColor(member.department)}>
                    {member.department}
                  </Badge>
                  <Badge variant="outline">
                    {getRoleDisplayName(member.role)}
                  </Badge>
                  <Badge className={getStatusColor(member.is_active || false)}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  
                  {/* Account Management Controls */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAccount(member.id, member.is_active || false)}
                      className={`${member.is_active ? 'text-red-600 border-red-300 hover:bg-red-50' : 'text-green-600 border-green-300 hover:bg-green-50'}`}
                    >
                      {member.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAccount(member.id, member.full_name)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {activeTeamMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members yet. Create the first account above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
