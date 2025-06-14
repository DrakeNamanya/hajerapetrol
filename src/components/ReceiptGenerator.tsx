
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  receiptNumber: string;
  department: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  changeAmount?: number;
  tableNumber?: string;
  pumpNumber?: string;
  timestamp: Date;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receiptData,
  onPrint,
  onDownload
}) => {
  const { businessSettings, loading } = useBusinessSettings();

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleDownload = () => {
    // Simple download implementation - in a real app you'd generate a PDF
    const receiptContent = document.getElementById('receipt-content')?.innerHTML;
    const blob = new Blob([receiptContent || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  if (loading) {
    return <div className="space-y-4">Loading business settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      <Card className="max-w-md mx-auto print:shadow-none print:border-none">
        <CardContent className="p-6" id="receipt-content">
          <div className="text-center space-y-2 border-b pb-4">
            <h1 className="text-xl font-bold">{businessSettings.businessName}</h1>
            <p className="text-sm text-gray-600">{businessSettings.address}</p>
            <p className="text-sm text-gray-600">Tel: {businessSettings.phone}</p>
            <p className="text-sm text-gray-600">{businessSettings.email}</p>
            <p className="text-sm text-gray-600">{businessSettings.website}</p>
          </div>

          <div className="py-4 border-b space-y-1">
            <div className="flex justify-between text-sm">
              <span>Receipt #:</span>
              <span className="font-mono">{receiptData.receiptNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Date:</span>
              <span>{receiptData.timestamp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Department:</span>
              <span className="capitalize">{receiptData.department}</span>
            </div>
            {receiptData.customerName && (
              <div className="flex justify-between text-sm">
                <span>Customer:</span>
                <span>{receiptData.customerName}</span>
              </div>
            )}
            {receiptData.tableNumber && (
              <div className="flex justify-between text-sm">
                <span>Table:</span>
                <span>{receiptData.tableNumber}</span>
              </div>
            )}
            {receiptData.pumpNumber && (
              <div className="flex justify-between text-sm">
                <span>Pump:</span>
                <span>{receiptData.pumpNumber}</span>
              </div>
            )}
          </div>

          <div className="py-4 border-b">
            <div className="space-y-2">
              {receiptData.items.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span>UGX {item.total.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-600 text-xs">
                    {item.quantity} x UGX {item.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>UGX {receiptData.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>UGX {receiptData.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>UGX {receiptData.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="py-4 border-t space-y-1">
            <div className="flex justify-between text-sm">
              <span>Payment Method:</span>
              <span className="capitalize">{receiptData.paymentMethod}</span>
            </div>
            {receiptData.amountReceived && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Amount Received:</span>
                  <span>UGX {receiptData.amountReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span>UGX {receiptData.changeAmount?.toLocaleString() || '0'}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center text-xs text-gray-600 pt-4 border-t">
            <p>Thank you for your business!</p>
            <p>Visit us again soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
