
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileSpreadsheet, Mail } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useReportExport } from '@/hooks/useReportExport';
import { format } from 'date-fns';

interface SalesReportExporterProps {
  dateFrom: Date;
  dateTo: Date;
}

export const SalesReportExporter: React.FC<SalesReportExporterProps> = ({ dateFrom, dateTo }) => {
  const { sales } = useSales();
  const { exportToPDF, exportToExcel, isExporting } = useReportExport();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    return saleDate >= dateFrom && saleDate <= dateTo &&
      (selectedDepartment === 'all' || sale.department === selectedDepartment);
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const approvedSales = filteredSales.filter(sale => sale.status === 'director_approved');
  const approvedRevenue = approvedSales.reduce((sum, sale) => sum + Number(sale.total), 0);

  const departmentBreakdown = filteredSales.reduce((acc, sale) => {
    const dept = sale.department;
    if (!acc[dept]) {
      acc[dept] = { count: 0, revenue: 0, approved: 0 };
    }
    acc[dept].count++;
    acc[dept].revenue += Number(sale.total);
    if (sale.status === 'director_approved') {
      acc[dept].approved += Number(sale.total);
    }
    return acc;
  }, {} as Record<string, { count: number; revenue: number; approved: number }>);

  const handleExportPDF = () => {
    const reportData = {
      title: 'Sales Report',
      dateRange: `${format(dateFrom, 'MMM dd, yyyy')} - ${format(dateTo, 'MMM dd, yyyy')}`,
      summary: {
        totalSales: filteredSales.length,
        totalRevenue,
        approvedSales: approvedSales.length,
        approvedRevenue,
        approvalRate: filteredSales.length > 0 ? (approvedSales.length / filteredSales.length) * 100 : 0
      },
      departmentBreakdown,
      sales: filteredSales
    };
    exportToPDF(reportData, 'sales-report');
  };

  const handleExportExcel = () => {
    const excelData = filteredSales.map(sale => ({
      Date: format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm'),
      Department: sale.department.toUpperCase(),
      Customer: sale.customer_name || 'Walk-in',
      'Sale Type': sale.sale_type,
      'Payment Method': sale.payment_method,
      Subtotal: Number(sale.subtotal),
      Tax: Number(sale.tax),
      Total: Number(sale.total),
      Status: sale.status,
      'Table/Pump': sale.table_number || sale.pump_number || 'N/A'
    }));
    exportToExcel(excelData, 'sales-report');
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredSales.length}
            </div>
            <p className="text-sm text-gray-600">Total Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              UGX {totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {approvedSales.length}
            </div>
            <p className="text-sm text-gray-600">Approved Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {filteredSales.length > 0 ? ((approvedSales.length / filteredSales.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-gray-600">Approval Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(departmentBreakdown).map(([dept, stats]) => (
              <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{dept.toUpperCase()}</Badge>
                  <span className="font-medium">{stats.count} sales</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">UGX {stats.revenue.toLocaleString()}</div>
                  <div className="text-sm text-green-600">
                    Approved: UGX {stats.approved.toLocaleString()}
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
              onClick={handleExportPDF}
              disabled={isExporting}
              className="h-20 flex-col"
            >
              <FileText className="h-6 w-6 mb-2" />
              {isExporting ? 'Generating...' : 'Export PDF Report'}
            </Button>
            
            <Button 
              onClick={handleExportExcel}
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

      {/* Recent Sales Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSales.slice(0, 10).map(sale => (
              <div key={sale.id} className="flex justify-between items-center p-2 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{sale.department}</Badge>
                  <span className="text-sm">{sale.customer_name || 'Walk-in'}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(sale.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={sale.status === 'director_approved' ? 'default' : 'secondary'}
                    className={sale.status === 'director_approved' ? 'bg-green-600' : ''}
                  >
                    {sale.status}
                  </Badge>
                  <span className="font-medium">UGX {Number(sale.total).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
