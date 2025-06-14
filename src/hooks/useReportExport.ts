
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
      let currentY = 20;
      
      // Header
      doc.setFontSize(20);
      doc.text(data.title, 20, currentY);
      currentY += 10;
      
      doc.setFontSize(12);
      doc.text(`Period: ${data.dateRange}`, 20, currentY);
      currentY += 10;
      
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, currentY);
      currentY += 30;

      // Summary section
      doc.setFontSize(16);
      doc.text('Summary', 20, currentY);
      currentY += 10;
      
      const summaryData = [
        ['Total Sales', data.summary.totalSales?.toString() || '0'],
        ['Total Revenue', `UGX ${data.summary.totalRevenue?.toLocaleString() || '0'}`],
        ['Approved Sales', data.summary.approvedSales?.toString() || '0'],
        ['Approved Revenue', `UGX ${data.summary.approvedRevenue?.toLocaleString() || '0'}`],
        ['Approval Rate', `${data.summary.approvalRate?.toFixed(1) || '0'}%`]
      ];

      doc.autoTable({
        startY: currentY,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid'
      });

      currentY = (doc as any).lastAutoTable?.finalY + 20 || currentY + 80;

      // Department breakdown
      if (data.departmentBreakdown && Object.keys(data.departmentBreakdown).length > 0) {
        const departmentData = Object.entries(data.departmentBreakdown).map(([dept, stats]: [string, any]) => [
          dept.toUpperCase(),
          stats.count?.toString() || '0',
          `UGX ${stats.revenue?.toLocaleString() || '0'}`,
          `UGX ${stats.approved?.toLocaleString() || '0'}`
        ]);

        doc.autoTable({
          startY: currentY,
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
