
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, Mail, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReportExport } from '@/hooks/useReportExport';
import { format } from 'date-fns';

interface InventoryReportExporterProps {
  dateFrom: Date;
  dateTo: Date;
}

export const InventoryReportExporter: React.FC<InventoryReportExporterProps> = ({ dateFrom, dateTo }) => {
  const { exportToPDF, exportToExcel, isExporting } = useReportExport();

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const { data: lowStockAlerts = [] } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_alerts')
        .select(`
          *,
          inventory_items (name, department, current_stock, minimum_stock)
        `)
        .eq('is_acknowledged', false);
      if (error) throw error;
      return data;
    }
  });

  const totalValue = inventoryItems.reduce((sum, item) => 
    sum + (Number(item.current_stock) * Number(item.unit_price)), 0
  );

  const departmentStats = inventoryItems.reduce((acc, item) => {
    const dept = item.department;
    if (!acc[dept]) {
      acc[dept] = { items: 0, value: 0, lowStock: 0 };
    }
    acc[dept].items++;
    acc[dept].value += Number(item.current_stock) * Number(item.unit_price);
    if (Number(item.current_stock) <= Number(item.minimum_stock)) {
      acc[dept].lowStock++;
    }
    return acc;
  }, {} as Record<string, { items: number; value: number; lowStock: number }>);

  const handleExportInventoryPDF = () => {
    const reportData = {
      title: 'Inventory Report',
      dateRange: `Generated on ${format(new Date(), 'MMM dd, yyyy')}`,
      summary: {
        totalItems: inventoryItems.length,
        totalValue,
        lowStockItems: lowStockAlerts.length,
        departments: Object.keys(departmentStats).length
      },
      departmentBreakdown: departmentStats,
      items: inventoryItems
    };
    exportToPDF(reportData, 'inventory-report');
  };

  const handleExportInventoryExcel = () => {
    const excelData = inventoryItems.map(item => ({
      Name: item.name,
      SKU: item.sku,
      Department: item.department.toUpperCase(),
      Category: item.category,
      'Current Stock': Number(item.current_stock),
      'Minimum Stock': Number(item.minimum_stock),
      'Unit Price': Number(item.unit_price),
      'Total Value': Number(item.current_stock) * Number(item.unit_price),
      'Unit of Measure': item.unit_of_measure,
      'Low Stock': Number(item.current_stock) <= Number(item.minimum_stock) ? 'YES' : 'NO',
      'Expiry Date': item.expiry_date || 'N/A',
      Supplier: item.supplier_name || 'N/A'
    }));
    exportToExcel(excelData, 'inventory-report');
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {inventoryItems.length}
            </div>
            <p className="text-sm text-gray-600">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              UGX {totalValue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {lowStockAlerts.length}
            </div>
            <p className="text-sm text-gray-600">Low Stock Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(departmentStats).length}
            </div>
            <p className="text-sm text-gray-600">Departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{alert.alert_level}</Badge>
                    <span className="font-medium">{alert.inventory_items?.name}</span>
                    <span className="text-sm text-gray-600">
                      ({alert.inventory_items?.department})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      Stock: {alert.current_stock} / Min: {alert.minimum_stock}
                    </div>
                  </div>
                </div>
              ))}
              {lowStockAlerts.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  +{lowStockAlerts.length - 5} more items need attention
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(departmentStats).map(([dept, stats]) => (
              <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{dept.toUpperCase()}</Badge>
                  <span className="font-medium">{stats.items} items</span>
                  {stats.lowStock > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.lowStock} low stock
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">UGX {stats.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    Avg: UGX {Math.round(stats.value / stats.items).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleExportInventoryPDF}
              disabled={isExporting}
              className="h-20 flex-col"
            >
              <FileText className="h-6 w-6 mb-2" />
              {isExporting ? 'Generating...' : 'Export PDF Report'}
            </Button>
            
            <Button 
              onClick={handleExportInventoryExcel}
              disabled={isExporting}
              variant="outline"
              className="h-20 flex-col"
            >
              <FileSpreadsheet className="h-6 w-6 mb-2" />
              {isExporting ? 'Generating...' : 'Export Excel'}
            </Button>
            
            <Button 
              variant="outline"
              className="h-20 flex-col"
              disabled={isExporting}
            >
              <Mail className="h-6 w-6 mb-2" />
              Email Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
