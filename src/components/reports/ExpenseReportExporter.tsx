
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReportExport } from '@/hooks/useReportExport';
import { format } from 'date-fns';

interface ExpenseReportExporterProps {
  dateFrom: Date;
  dateTo: Date;
}

export const ExpenseReportExporter: React.FC<ExpenseReportExporterProps> = ({ dateFrom, dateTo }) => {
  const { exportToPDF, exportToExcel, isExporting } = useReportExport();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const approvedExpenses = expenses.filter(expense => expense.status === 'approved');
  const approvedAmount = approvedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending');
  const pendingAmount = pendingExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const departmentBreakdown = expenses.reduce((acc, expense) => {
    const dept = expense.department;
    if (!acc[dept]) {
      acc[dept] = { count: 0, amount: 0, approved: 0, pending: 0 };
    }
    acc[dept].count++;
    acc[dept].amount += Number(expense.amount);
    if (expense.status === 'approved') {
      acc[dept].approved += Number(expense.amount);
    } else if (expense.status === 'pending') {
      acc[dept].pending += Number(expense.amount);
    }
    return acc;
  }, {} as Record<string, { count: number; amount: number; approved: number; pending: number }>);

  const typeBreakdown = expenses.reduce((acc, expense) => {
    const type = expense.type;
    if (!acc[type]) {
      acc[type] = { count: 0, amount: 0 };
    }
    acc[type].count++;
    acc[type].amount += Number(expense.amount);
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const handleExportExpensePDF = () => {
    const reportData = {
      title: 'Expense Report',
      dateRange: `${format(dateFrom, 'MMM dd, yyyy')} - ${format(dateTo, 'MMM dd, yyyy')}`,
      summary: {
        totalExpenses: expenses.length,
        totalAmount: totalExpenses,
        approvedExpenses: approvedExpenses.length,
        approvedAmount,
        pendingExpenses: pendingExpenses.length,
        pendingAmount
      },
      departmentBreakdown,
      typeBreakdown,
      expenses
    };
    exportToPDF(reportData, 'expense-report');
  };

  const handleExportExpenseExcel = () => {
    const excelData = expenses.map(expense => ({
      Date: format(new Date(expense.created_at), 'yyyy-MM-dd HH:mm'),
      Department: expense.department.toUpperCase(),
      Type: expense.type,
      Description: expense.description,
      Amount: Number(expense.amount),
      Status: expense.status,
      'Requested By': expense.requested_by,
      'Approved By Accountant': expense.approved_by_accountant || 'N/A',
      'Approved By Manager': expense.approved_by_manager || 'N/A',
      'Approved By Director': expense.approved_by_director || 'N/A',
      'Rejection Reason': expense.rejection_reason || 'N/A'
    }));
    exportToExcel(excelData, 'expense-report');
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {expenses.length}
            </div>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              UGX {totalExpenses.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              UGX {approvedAmount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Approved Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              UGX {pendingAmount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Pending Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(departmentBreakdown).map(([dept, stats]) => (
              <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{dept.toUpperCase()}</Badge>
                  <span className="font-medium">{stats.count} requests</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">UGX {stats.amount.toLocaleString()}</div>
                  <div className="text-sm text-green-600">
                    Approved: UGX {stats.approved.toLocaleString()}
                  </div>
                  {stats.pending > 0 && (
                    <div className="text-sm text-orange-600">
                      Pending: UGX {stats.pending.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(typeBreakdown).map(([type, stats]) => (
              <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{type}</div>
                  <div className="text-sm text-gray-600">{stats.count} requests</div>
                </div>
                <div className="font-semibold">UGX {stats.amount.toLocaleString()}</div>
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
              onClick={handleExportExpensePDF}
              disabled={isExporting}
              className="h-20 flex-col"
            >
              <FileText className="h-6 w-6 mb-2" />
              {isExporting ? 'Generating...' : 'Export PDF Report'}
            </Button>
            
            <Button 
              onClick={handleExportExpenseExcel}
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

      {/* Recent Expenses Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenses.slice(0, 10).map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-2 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{expense.department}</Badge>
                  <span className="text-sm font-medium">{expense.type}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(expense.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={expense.status === 'approved' ? 'default' : 
                             expense.status === 'rejected' ? 'destructive' : 'secondary'}
                    className={expense.status === 'approved' ? 'bg-green-600' : ''}
                  >
                    {expense.status}
                  </Badge>
                  <span className="font-medium">UGX {Number(expense.amount).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
