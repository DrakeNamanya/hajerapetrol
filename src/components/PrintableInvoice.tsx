import React from 'react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

interface PrintableInvoiceProps {
  invoice: {
    id: string;
    client_name: string;
    fuel_type: string;
    fuel_quantity: number;
    price_per_liter: number;
    total_amount: number;
    created_at: string;
    due_date?: string;
    notes?: string;
    status: string;
  };
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, onClose }) => {
  const { businessSettings } = useBusinessSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-4xl max-h-[90vh] overflow-auto m-4 rounded-lg shadow-2xl">
        {/* Print Controls - Hidden in print */}
        <div className="p-4 border-b print:hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Invoice Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print Invoice
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-4 print-content">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              {businessSettings.businessName}
            </h1>
            <p className="text-gray-600 mb-1">{businessSettings.address}</p>
            <p className="text-gray-600 mb-1">
              Phone: {businessSettings.phone} | Email: {businessSettings.email}
            </p>
            {businessSettings.website && (
              <p className="text-gray-600">Website: {businessSettings.website}</p>
            )}
          </div>

          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
              <p className="text-gray-600">Invoice #: {invoice.id.slice(-8).toUpperCase()}</p>
              <p className="text-gray-600">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
              {invoice.due_date && (
                <p className="text-gray-600">Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
              <p className="text-gray-600 font-medium">{invoice.client_name}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="border border-gray-300 rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-800">Description</th>
                  <th className="text-right p-4 font-semibold text-gray-800">Quantity</th>
                  <th className="text-right p-4 font-semibold text-gray-800">Unit Price</th>
                  <th className="text-right p-4 font-semibold text-gray-800">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-4">
                    <div className="font-medium text-gray-800 capitalize">
                      {invoice.fuel_type} Fuel
                    </div>
                    <div className="text-sm text-gray-600">
                      Premium quality fuel
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-800">
                    {invoice.fuel_quantity.toFixed(2)} L
                  </td>
                  <td className="p-4 text-right text-gray-800">
                    UGX {invoice.price_per_liter.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-gray-800 font-medium">
                    UGX {invoice.total_amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-800">UGX {invoice.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tax (0%):</span>
                  <span className="text-gray-800">UGX 0</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total:</span>
                    <span className="font-bold text-xl text-blue-600">
                      UGX {invoice.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes:</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Payment Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : invoice.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm border-t pt-4">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              For any questions regarding this invoice, please contact us at {businessSettings.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:p-4 {
              padding: 1rem;
            }
          }
        `
      }} />
    </div>
  );
};