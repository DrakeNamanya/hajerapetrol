import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Fuel
} from "lucide-react";
import { FuelEntryForm } from '@/components/FuelEntryForm';
import { useFuelEntries } from '@/hooks/useFuelEntries';

export const FuelAttendantDashboard: React.FC = () => {
  const { entries, getTodaysEntries, getEntriesByStatus } = useFuelEntries();

  const todaysEntries = getTodaysEntries();
  const submittedEntries = getEntriesByStatus('submitted');
  const approvedEntries = getEntriesByStatus('approved_by_accountant');
  const finalizedEntries = getEntriesByStatus('approved_by_manager');

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

  const getTodaysRevenue = () => {
    return todaysEntries.reduce((sum, entry) => sum + entry.revenue_received, 0);
  };

  const getTodaysFuelSold = () => {
    return todaysEntries.reduce((sum, entry) => sum + (entry.fuel_sold || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel Attendant Dashboard</h1>
          <p className="text-muted-foreground">Record daily fuel entries and track approvals</p>
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
                <p className="text-sm text-muted-foreground">Today's Entries</p>
                <p className="text-2xl font-bold">{todaysEntries.length}</p>
              </div>
              <Fuel className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">UGX {getTodaysRevenue().toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Fuel Sold</p>
                <p className="text-2xl font-bold">{getTodaysFuelSold().toFixed(0)}L</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Entry Form */}
      <FuelEntryForm />

      {/* Today's Entries */}
      {todaysEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Entries
              <Badge variant="secondary">{todaysEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Opening Stock</TableHead>
                  <TableHead>Closing Stock</TableHead>
                  <TableHead>Fuel Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.created_at).toLocaleTimeString()}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Entries History
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.slice(0, 10).map(entry => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};