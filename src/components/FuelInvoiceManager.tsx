import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, DollarSign, Printer } from "lucide-react";
import { useFuelInvoices } from '@/hooks/useFuelInvoices';
import { PrintableInvoice } from '@/components/PrintableInvoice';

export const FuelInvoiceManager: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [fuelQuantity, setFuelQuantity] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [printingInvoice, setPrintingInvoice] = useState<any>(null);

  const { 
    invoices, 
    createInvoice, 
    updateInvoiceStatus, 
    getInvoicesByStatus,
    isCreating,
    isUpdating 
  } = useFuelInvoices();

  const totalAmount = fuelQuantity && pricePerLiter ? 
    parseFloat(fuelQuantity) * parseFloat(pricePerLiter) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !fuelQuantity || !fuelType || !pricePerLiter) {
      return;
    }

    createInvoice.mutate({
      client_name: clientName,
      fuel_quantity: parseFloat(fuelQuantity),
      fuel_type: fuelType,
      price_per_liter: parseFloat(pricePerLiter),
      due_date: dueDate || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setClientName('');
    setFuelQuantity('');
    setFuelType('');
    setPricePerLiter('');
    setDueDate('');
    setNotes('');
  };

  const handleStatusUpdate = (invoiceId: string, status: 'paid' | 'cancelled') => {
    updateInvoiceStatus.mutate({ invoiceId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const pendingInvoices = getInvoicesByStatus('pending');
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Create Invoice Form */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <FileText className="h-6 w-6" />
            Create Fuel Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="kerosene">Kerosene</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelQuantity">Quantity (Liters)</Label>
                <Input
                  id="fuelQuantity"
                  type="number"
                  value={fuelQuantity}
                  onChange={(e) => setFuelQuantity(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerLiter">Price per Liter (UGX)</Label>
                <Input
                  id="pricePerLiter"
                  type="number"
                  value={pricePerLiter}
                  onChange={(e) => setPricePerLiter(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {totalAmount > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Total Amount:</span>
                  </div>
                  <Badge variant="default" className="text-lg">
                    UGX {totalAmount.toLocaleString()}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Total Invoices:</span>
                <span className="font-semibold">{invoices.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <Badge variant="secondary">{pendingInvoices.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pending Amount:</span>
                <span className="text-green-600 font-semibold">UGX {totalPendingAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid:</span>
                <Badge variant="default">{getInvoicesByStatus('paid').length}</Badge>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 10).map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.client_name}</TableCell>
                  <TableCell className="capitalize">{invoice.fuel_type}</TableCell>
                  <TableCell>{invoice.fuel_quantity}L</TableCell>
                  <TableCell>UGX {invoice.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrintingInvoice(invoice)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" />
                        Print
                      </Button>
                      {invoice.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                            disabled={isUpdating}
                          >
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(invoice.id, 'cancelled')}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Print Modal */}
      {printingInvoice && (
        <PrintableInvoice
          invoice={printingInvoice}
          onClose={() => setPrintingInvoice(null)}
        />
      )}
    </div>
  );
};