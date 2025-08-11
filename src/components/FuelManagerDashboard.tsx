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
  Calendar,
  BarChart3,
  FileText
} from "lucide-react";
import { useFuelEntries } from '@/hooks/useFuelEntries';
import { useFuelInvoices } from '@/hooks/useFuelInvoices';
import { useLubricantSales } from '@/hooks/useLubricantSales';
import { FuelTankManager } from '@/components/FuelTankManager';
import { FuelTankDisplay } from '@/components/FuelTankDisplay';

export const FuelManagerDashboard: React.FC = () => {
  const { entries, updateEntryStatus, getEntriesByStatus, isUpdating } = useFuelEntries();
  const { invoices, getInvoicesByStatus } = useFuelInvoices();
  const { sales, getTotalSales } = useLubricantSales();

  const accountantApprovedEntries = getEntriesByStatus('approved_by_accountant');
  const managerApprovedEntries = getEntriesByStatus('approved_by_manager');
  const pendingInvoices = getInvoicesByStatus('pending');
  const paidInvoices = getInvoicesByStatus('paid');

  const handleFinalize = (entryId: string) => {
    updateEntryStatus.mutate({ 
      entryId, 
      status: 'approved_by_manager',
      approvalType: 'manager'
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
      case 'submitted': return 'Submitted';
      case 'approved_by_accountant': return 'Approved by Accountant';
      case 'approved_by_manager': return 'Finalized';
      default: return status;
    }
  };

  const getTotalRevenue = (entries: any[]) => {
    return entries.reduce((sum, entry) => sum + entry.revenue_received, 0);
  };

  const getTotalFuelSold = (entries: any[]) => {
    return entries.reduce((sum, entry) => sum + entry.fuel_sold, 0);
  };

  const getTotalInvoiceAmount = (invoices: any[]) => {
    return invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  };

  // Get recent performance metrics
  const last7Days = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel Manager Dashboard</h1>
          <p className="text-muted-foreground">Monitor fuel operations and finalize approved entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tank Levels Overview */}
      <FuelTankDisplay />

      {/* Tank Manager Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tank Management</CardTitle>
        </CardHeader>
        <CardContent>
          <FuelTankManager />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Finalization</p>
                <p className="text-2xl font-bold">{accountantApprovedEntries.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalized</p>
                <p className="text-2xl font-bold">{managerApprovedEntries.length}</p>
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
                <p className="text-sm text-muted-foreground">Invoice Revenue</p>
                <p className="text-2xl font-bold">UGX {getTotalInvoiceAmount(paidInvoices).toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                  <p className="text-2xl font-bold">{last7Days.length}</p>
                  <p className="text-sm text-blue-600">Entries</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lubricant Sales</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                  <p className="text-sm text-green-600">UGX {getTotalSales().toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Invoices</p>
                  <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                  <p className="text-sm text-purple-600">UGX {getTotalInvoiceAmount(pendingInvoices).toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Pending Finalization */}
      {accountantApprovedEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Entries Pending Finalization
              <Badge variant="secondary">{accountantApprovedEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-orange-800">
                These entries have been approved by the accountant and are ready for final approval.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Fuel Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountantApprovedEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{entry.fuel_type}</TableCell>
                    <TableCell>{entry.fuel_sold}L</TableCell>
                    <TableCell>UGX {entry.revenue_received.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Accountant</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(entry.status)}>
                        {getStatusText(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleFinalize(entry.id)}
                        disabled={isUpdating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finalize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Entries Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            All Entries Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium">Total Entries</p>
                <p className="text-2xl font-bold text-blue-600">{entries.length}</p>
              </div>
              <div className="text-center">
                <p className="font-medium">Finalized</p>
                <p className="text-2xl font-bold text-green-600">{managerApprovedEntries.length}</p>
              </div>
              <div className="text-center">
                <p className="font-medium">Total Fuel Sold</p>
                <p className="text-2xl font-bold text-orange-600">{getTotalFuelSold(entries).toFixed(0)}L</p>
              </div>
              <div className="text-center">
                <p className="font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">UGX {getTotalRevenue(entries).toLocaleString()}</p>
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
                <TableHead>Finalized At</TableHead>
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
                    {entry.manager_approved_at ? 
                      new Date(entry.manager_approved_at).toLocaleDateString() : 
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