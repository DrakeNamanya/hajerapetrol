
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const useReportExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: any, filename: string) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text(data.title, 20, 20);
      doc.setFontSize(12);
      doc.text(`Period: ${data.dateRange}`, 20, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);

      // Summary section
      doc.setFontSize(16);
      doc.text('Summary', 20, 60);
      
      const summaryData = [
        ['Total Sales', data.summary.totalSales.toString()],
        ['Total Revenue', `UGX ${data.summary.totalRevenue.toLocaleString()}`],
        ['Approved Sales', data.summary.approvedSales.toString()],
        ['Approved Revenue', `UGX ${data.summary.approvedRevenue.toLocaleString()}`],
        ['Approval Rate', `${data.summary.approvalRate.toFixed(1)}%`]
      ];

      doc.autoTable({
        startY: 70,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid'
      });

      // Department breakdown
      if (data.departmentBreakdown && Object.keys(data.departmentBreakdown).length > 0) {
        const departmentData = Object.entries(data.departmentBreakdown).map(([dept, stats]: [string, any]) => [
          dept.toUpperCase(),
          stats.count.toString(),
          `UGX ${stats.revenue.toLocaleString()}`,
          `UGX ${stats.approved.toLocaleString()}`
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Department', 'Sales Count', 'Total Revenue', 'Approved Revenue']],
          body: departmentData,
          theme: 'grid'
        });
      }

      doc.save(`${filename}.pdf`);
      
      toast({
        title: "Export Successful",
        description: `${data.title} exported as PDF`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (data: any[], filename: string) => {
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      
      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Report exported as Excel file",
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate Excel report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    exportToExcel,
    isExporting
  };
};
