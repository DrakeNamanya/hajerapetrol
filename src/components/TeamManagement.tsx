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
      console.log('Fetching team data...');
      
      // Fetch team members
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

      // Fetch pending invitations
      const { data: pendingInvitations, error: invitationsError } = await supabase
        .from('team_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
      } else {
        console.log('Pending invitations fetched:', pendingInvitations);
        setInvitations(pendingInvitations || []);
      }
    } catch (error) {
      console.error('Error in fetchTeamData:', error);
    }
  };

  const sendInvitationEmail = async (invitationEmail: string, invitationRole: string, invitationDepartment: string) => {
    try {
      console.log('Sending invitation email...');
      
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: invitationEmail,
          role: invitationRole,
          department: invitationDepartment,
          inviterName: profile?.full_name || 'Team Administrator',
          businessName: 'HIPEMART OILS'
        }
      });

      if (error) {
        console.error('Error sending invitation email:', error);
        throw new Error(`Failed to send invitation email: ${error.message}`);
      }

      console.log('Invitation email sent successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in sendInvitationEmail:', error);
      throw error;
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to send invitation...');
    
    if (!email || !role || !department) {
      setError('Please fill in all fields');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already invited or registered
    const existingInvitation = invitations.find(inv => inv.email.toLowerCase() === normalizedEmail);
    const existingMember = teamMembers.find(member => member.email.toLowerCase() === normalizedEmail);
    
    if (existingInvitation) {
      setError('This email already has a pending invitation');
      return;
    }
    
    if (existingMember) {
      setError('This email is already registered as a team member');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creating invitation record in database...');

      // First, create the invitation record in the database
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          email: normalizedEmail,
          role: role as any,
          department: department as any,
          invited_by: user.id
        })
        .select();

      if (inviteError) {
        console.error('Database invitation error:', inviteError);
        throw new Error(`Failed to create invitation: ${inviteError.message}`);
      }

      console.log('Invitation record created successfully:', inviteData);

      // Then, send the email invitation
      try {
        await sendInvitationEmail(normalizedEmail, role, department);
        
        setSuccess(`Invitation sent successfully to ${email}! They will receive an email with instructions to join the team.`);
        setEmail('');
        setRole('');
        setDepartment('');
        fetchTeamData(); // Refresh the data
      } catch (emailError: any) {
        console.error('Email sending failed, but invitation was created:', emailError);
        setSuccess(`Invitation created in system for ${email}, but email delivery failed. Please contact them directly with signup instructions.`);
        setError(`Email delivery issue: ${emailError.message}`);
        fetchTeamData(); // Still refresh to show the pending invitation
      }

    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError(`Failed to send invitation: ${error.message}`);
    }

    setLoading(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        setError('Failed to cancel invitation');
      } else {
        setSuccess('Invitation canceled successfully');
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
      setError('Failed to cancel invitation');
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
                      <p className="text-xs text-gray-500">
                        Invited {new Date(invitation.created_at || '').toLocaleDateString()}
                        {invitation.expires_at && ` • Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                      Pending
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </div>
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
                    <p className="text-xs text-gray-500">
                      Joined {new Date(member.created_at || '').toLocaleDateString()}
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

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-2">How Invitations Work:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Send an invitation with the team member's email address</li>
            <li>The team member receives an email with detailed instructions</li>
            <li>They visit the app and sign up with the EXACT same email from the invitation</li>
            <li>Upon signup, they will automatically be assigned the role you specified</li>
            <li>If they don't sign up within 7 days, the invitation expires</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
