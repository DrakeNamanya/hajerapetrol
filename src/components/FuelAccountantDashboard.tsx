import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar
} from "lucide-react";
import { useFuelEntries } from '@/hooks/useFuelEntries';
import { toast } from '@/hooks/use-toast';

export const FuelAccountantDashboard: React.FC = () => {
  const { entries, updateEntryStatus, getEntriesByStatus, isUpdating } = useFuelEntries();

  const submittedEntries = getEntriesByStatus('submitted');
  const approvedEntries = getEntriesByStatus('approved_by_accountant');
  const finalizedEntries = getEntriesByStatus('approved_by_manager');

  const handleApprove = (entryId: string) => {
    updateEntryStatus.mutate({ 
      entryId, 
      status: 'approved_by_accountant',
      approvalType: 'accountant'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'approved_by_accountant': return 'default';
      case 'approved_by_manager': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Pending Review';
      case 'approved_by_accountant': return 'Approved by Accountant';
      case 'approved_by_manager': return 'Approved by Manager';
      default: return status;
    }
  };

  const getTotalRevenue = (entries: any[]) => {
    return entries.reduce((sum, entry) => sum + entry.revenue_received, 0);
  };

  const getTotalFuelSold = (entries: any[]) => {
    return entries.reduce((sum, entry) => sum + entry.fuel_sold, 0);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel Accountant Dashboard</h1>
          <p className="text-muted-foreground">Review and approve fuel entries from attendants</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{submittedEntries.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedEntries.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">UGX {getTotalRevenue(entries).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fuel Sold</p>
                <p className="text-2xl font-bold">{getTotalFuelSold(entries).toFixed(0)}L</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Entries for Review */}
      {submittedEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Entries Pending Review
              <Badge variant="secondary">{submittedEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-orange-800">
                Review and approve fuel entries submitted by attendants. Check the calculations and revenue figures before approving.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Opening Stock</TableHead>
                  <TableHead>Closing Stock</TableHead>
                  <TableHead>Fuel Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{entry.fuel_type}</TableCell>
                    <TableCell>{entry.opening_stock}L</TableCell>
                    <TableCell>{entry.closing_stock}L</TableCell>
                    <TableCell>{entry.fuel_sold}L</TableCell>
                    <TableCell>UGX {entry.revenue_received.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(entry.status)}>
                        {getStatusText(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(entry.id)}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Entries History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            All Entries History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium">Submitted</p>
                <p className="text-2xl font-bold text-orange-600">{submittedEntries.length}</p>
              </div>
              <div className="text-center">
                <p className="font-medium">Approved by Accountant</p>
                <p className="text-2xl font-bold text-green-600">{approvedEntries.length}</p>
              </div>
              <div className="text-center">
                <p className="font-medium">Approved by Manager</p>
                <p className="text-2xl font-bold text-blue-600">{finalizedEntries.length}</p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Fuel Sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.slice(0, 20).map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{entry.fuel_type}</TableCell>
                  <TableCell>{entry.fuel_sold}L</TableCell>
                  <TableCell>UGX {entry.revenue_received.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(entry.status)}>
                      {getStatusText(entry.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.accountant_approved_at ? 
                      new Date(entry.accountant_approved_at).toLocaleDateString() : 
                      '-'
                    }
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