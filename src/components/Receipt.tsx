
import React, { useState, useEffect } from 'react';
import { Fuel, Building2, Calendar, Clock, User, Receipt as ReceiptIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface ReceiptProps {
  receiptData: {
    id: string;
    customerName?: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    amountReceived?: number;
    change?: number;
    timestamp: Date;
    department: string;
    tableNumber?: string;
    pumpNumber?: string;
  };
}

export const Receipt: React.FC<ReceiptProps> = ({ receiptData }) => {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'HIPEMART OILS',
    address: 'BUKHALIHA ROAD, BUSIA',
    phone: '+256 776 429450',
    email: 'info@hipemartoils.com',
    website: 'www.hipemartoils.com'
  });

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching business settings:', error);
        return;
      }

      if (data) {
        setBusinessSettings({
          businessName: data.business_name,
          address: data.address,
          phone: data.phone,
          email: data.email || '',
          website: data.website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-UG'),
      time: date.toLocaleTimeString('en-UG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const dateTime = formatDateTime(receiptData.timestamp);

  return (
    <div className="bg-white p-6 max-w-sm mx-auto font-mono text-sm shadow-lg border rounded-lg">
      {/* Header with Logo and Station Name */}
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <div className="flex justify-center items-center mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Fuel className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-lg font-bold text-gray-800">{businessSettings.businessName}</h1>
        <h2 className="text-md font-semibold text-orange-600">{businessSettings.address}</h2>
        <p className="text-xs text-gray-600 mt-1">
          {businessSettings.phone} | {businessSettings.website}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {receiptData.department.toUpperCase()} DEPARTMENT
        </p>
      </div>

      {/* Receipt Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <ReceiptIcon className="w-3 h-3" />
            Receipt #:
          </span>
          <span className="font-semibold">{receiptData.id}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Date:
          </span>
          <span>{dateTime.date}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Time:
          </span>
          <span>{dateTime.time}</span>
        </div>
        
        {receiptData.customerName && (
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Customer:
            </span>
            <span>{receiptData.customerName}</span>
          </div>
        )}
        
        {receiptData.tableNumber && (
          <div className="flex justify-between">
            <span>Table:</span>
            <span>{receiptData.tableNumber}</span>
          </div>
        )}
        
        {receiptData.pumpNumber && (
          <div className="flex justify-between">
            <span>Pump:</span>
            <span>{receiptData.pumpNumber}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4">
        <div className="text-center font-semibold mb-2">ITEMS</div>
        {receiptData.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="truncate flex-1">{item.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{item.quantity} x {formatCurrency(item.price)}</span>
              <span className="font-semibold">{formatCurrency(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(receiptData.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (18%):</span>
          <span>{formatCurrency(receiptData.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-300 pt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(receiptData.total)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-1 mb-4 border-t border-dashed border-gray-300 pt-3">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="uppercase">{receiptData.paymentMethod}</span>
        </div>
        {receiptData.amountReceived && (
          <>
            <div className="flex justify-between">
              <span>Amount Received:</span>
              <span>{formatCurrency(receiptData.amountReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>{formatCurrency(receiptData.change || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs border-t border-dashed border-gray-300 pt-3">
        <p className="mb-2">Thank you for your business!</p>
        <p className="mb-2">Visit us again soon</p>
        <div className="text-xs text-gray-500 mt-3">
          <p>Powered by</p>
          <p className="font-semibold text-orange-600">DATACOLLECTORS LTD</p>
          <p>0701634653</p>
        </div>
      </div>
    </div>
  );
};
