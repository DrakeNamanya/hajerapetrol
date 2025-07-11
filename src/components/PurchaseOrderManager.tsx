import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Clock, CheckCircle, XCircle, ShoppingCart, User } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PurchaseOrderRequest {
  id: string;
  type: string;
  description: string;
  amount: number;
  department: string;
  status: string;
  created_at: string;
  requested_by: string;
  rejection_reason?: string;
}

interface PurchaseOrderManagerProps {
  userRole: 'accountant' | 'manager' | 'director';
}

export const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({ userRole }) => {
  const [requests, setRequests] = useState<PurchaseOrderRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [newRequest, setNewRequest] = useState({
    type: '',
    description: '',
    amount: '',
    department: '',
    justification: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('type', 'purchase_order_request')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching purchase order requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase order requests",
        variant: "destructive",
      });
    }
  };

  const submitRequest = async () => {
    if (!newRequest.type || !newRequest.description || !newRequest.amount || !newRequest.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
      const { error } = await supabase
        .from('expenses')
        .insert({
          type: 'purchase_order_request',
          description: `${newRequest.description}\n\nJustification: ${newRequest.justification}`,
          amount: parseFloat(newRequest.amount),
          department: newRequest.department,
          requested_by: currentUser.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase order request submitted for approval",
      });

      setNewRequest({
        type: '',
        description: '',
        amount: '',
        department: '',
        justification: ''
      });

      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit purchase order request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string, rejectionReason?: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to update requests",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (userRole === 'manager' && newStatus === 'manager_approved') {
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
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Purchase order request ${newStatus === 'rejected' ? 'rejected' : 'approved'}`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Manager</Badge>;
      case 'manager_approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Pending Director</Badge>;
      case 'director_approved':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canApprove = (request: PurchaseOrderRequest) => {
    if (userRole === 'manager' && request.status === 'pending') return true;
    if (userRole === 'director' && request.status === 'manager_approved') return true;
    return false;
  };

  const getNextApprovalStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'manager_approved';
      case 'manager_approved': return 'director_approved';
      default: return currentStatus;
    }
  };

  const pendingRequests = requests.filter(req => {
    if (userRole === 'accountant') return req.requested_by === currentUser?.id;
    if (userRole === 'manager') return req.status === 'pending';
    if (userRole === 'director') return req.status === 'manager_approved';
    return false;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue={userRole === 'accountant' ? 'create' : 'approval'} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {userRole === 'accountant' && <TabsTrigger value="create">Create Request</TabsTrigger>}
          <TabsTrigger value="approval">
            {userRole === 'accountant' ? 'My Requests' : 'Approval Queue'}
          </TabsTrigger>
        </TabsList>

        {userRole === 'accountant' && (
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Request Purchase Order
                  {currentUser && (
                    <Badge variant="outline" className="ml-auto">
                      <User className="h-3 w-3 mr-1" />
                      {currentUser.email || 'User'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select value={newRequest.type} onValueChange={(value) => setNewRequest({...newRequest, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory_restock">Inventory Restock</SelectItem>
                        <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                        <SelectItem value="supplies">Office/Store Supplies</SelectItem>
                        <SelectItem value="maintenance_items">Maintenance Items</SelectItem>
                        <SelectItem value="emergency_purchase">Emergency Purchase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={newRequest.department} onValueChange={(value) => setNewRequest({...newRequest, department: value})}>
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
                  <Label>Estimated Amount (UGX)</Label>
                  <Input
                    type="number"
                    value={newRequest.amount}
                    onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})}
                    placeholder="Enter estimated amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Items/Description</Label>
                  <Textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    placeholder="List the items or describe what needs to be purchased..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Justification</Label>
                  <Textarea
                    value={newRequest.justification}
                    onChange={(e) => setNewRequest({...newRequest, justification: e.target.value})}
                    placeholder="Explain why this purchase is necessary and how it benefits the business..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={submitRequest} 
                  disabled={loading || !currentUser} 
                  className="w-full"
                >
                  {loading ? 'Submitting...' : 'Submit Purchase Request'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="approval" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === 'accountant' ? 'My Purchase Order Requests' : 'Purchase Order Approval Queue'}
              </CardTitle>
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
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="capitalize">{request.type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {request.description}
                        </div>
                      </TableCell>
                      <TableCell>UGX {request.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="capitalize">{request.department}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {canApprove(request) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, getNextApprovalStatus(request.status))}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) updateRequestStatus(request.id, 'rejected', reason);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.status === 'rejected' && request.rejection_reason && (
                          <div className="text-sm text-red-600">
                            <XCircle className="h-3 w-3 inline mr-1" />
                            {request.rejection_reason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pendingRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {userRole === 'accountant' 
                    ? 'No purchase order requests found. Create your first request above.'
                    : 'No purchase order requests pending your approval.'
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};