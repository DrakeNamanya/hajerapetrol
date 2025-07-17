import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Fuel, 
  FileText, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { FuelEntryForm } from './FuelEntryForm';
import { FuelInvoiceManager } from './FuelInvoiceManager';
import { LubricantSalesManager } from './LubricantSalesManager';
import { useFuelEntries } from '@/hooks/useFuelEntries';
import { useFuelInvoices } from '@/hooks/useFuelInvoices';
import { useLubricantSales } from '@/hooks/useLubricantSales';

export const FuelAttendantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("entries");
  
  const { entries, getTodaysEntries, getEntriesByStatus } = useFuelEntries();
  const { invoices, getInvoicesByStatus } = useFuelInvoices();
  const { sales, getTodaysSales, getTotalSales } = useLubricantSales();

  const todaysEntries = getTodaysEntries();
  const submittedEntries = getEntriesByStatus('submitted');
  const pendingInvoices = getInvoicesByStatus('pending');
  const todaysLubricantSales = getTodaysSales();

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
      case 'approved_by_manager': return 'Approved by Manager';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel Attendant Dashboard</h1>
          <p className="text-muted-foreground">Manage daily fuel operations and track performance</p>
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
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-2xl font-bold">{pendingInvoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lubricant Sales</p>
                <p className="text-2xl font-bold">{todaysLubricantSales.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">UGX {getTotalSales().toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entries">Fuel Entries</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="lubricants">Lubricants</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <FuelEntryForm />
          
          {todaysEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
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
        </TabsContent>

        <TabsContent value="invoices">
          <FuelInvoiceManager />
        </TabsContent>

        <TabsContent value="lubricants">
          <LubricantSalesManager />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Submission Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Submitted Entries</span>
                    <Badge variant="secondary">{submittedEntries.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entries waiting for accountant approval
                  </p>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};