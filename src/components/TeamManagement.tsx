
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Users, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type UserProfile = Database['public']['Tables']['profiles']['Row'];
type TeamInvitation = Database['public']['Tables']['team_invitations']['Row'];

export const TeamManagement: React.FC = () => {
  const { profile, user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);

  useEffect(() => {
    if (profile?.role === 'director') {
      fetchTeamData();
    }
  }, [profile]);

  const fetchTeamData = async () => {
    try {
      // Fetch team members
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (members) setTeamMembers(members);

      // Fetch pending invitations
      const { data: pendingInvitations } = await supabase
        .from('team_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (pendingInvitations) setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role || !department) {
      setError('Please fill in all fields');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          email,
          role: role as any,
          department: department as any,
          invited_by: user.id
        });

      if (inviteError) {
        setError(inviteError.message);
      } else {
        setSuccess(`Invitation sent to ${email}. They can now sign up with this email to join your team.`);
        setEmail('');
        setRole('');
        setDepartment('');
        fetchTeamData();
      }
    } catch (error: any) {
      setError(error.message);
    }

    setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Invite New Team Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
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
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </form>
          
          {error && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 mt-4">
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        {getRoleDisplayName(invitation.role)} • {invitation.department}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getDepartmentColor(member.department)}>
                    {member.department}
                  </Badge>
                  <Badge variant="outline">
                    {getRoleDisplayName(member.role)}
                  </Badge>
                  {member.is_active ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
