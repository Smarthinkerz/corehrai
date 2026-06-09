import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import jsPDF from 'jspdf'
// @ts-ignore - Extend jsPDF with autotable
import 'jspdf-autotable'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export type DataType = 'all' | 'employees' | 'metrics' | 'insights' | 'onboarding' | 'engagement' | 'management' | 'workforce' | 'compliance';
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'clipboard';

/**
 * Generic data export function for all sections
 * Can be used by all parts of the application with appropriate data
 */
export async function exportData(data: any, dataType: DataType, format: ExportFormat): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hr-dashboard-${dataType}-${timestamp}`;
  
  // Handle special case for workforce management data (most problematic case)
  if (dataType === 'management' || dataType === 'workforce') {
    // Ensure data is in the correct format with sections
    if (Array.isArray(data) && data.length > 0) {
      // Make sure section field exists, if not, add one
      if (!data[0].hasOwnProperty('section')) {
        data = data.map((item: any) => ({
          section: 'Workforce',
          ...item
        }));
      }
      
      // Try a direct POST test to see if we can access the server
      try {
        const testResponse = await fetch('/api/status-check', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
      } catch (err) {
      }
    }
  }
  
  // Process data based on the format
  switch (format) {
    case 'csv':
      try {
        // Use server-side CSV generation
        const response = await fetch('/api/exports/csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: dataType,
            data: data
          }),
        });
        
        if (!response.ok) {
          // If server-side CSV generation fails, fall back to client-side
          throw new Error('Server-side CSV generation failed');
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Download the CSV file
        downloadFile(blob, 'text/csv', `${filename}.csv`);
      } catch (error) {
        // Fall back to client-side generation
        const csvContent = convertToCSV(data, dataType);
        downloadFile(csvContent, 'text/csv', `${filename}.csv`);
      }
      break;
      
    case 'excel':
      try {
        // Call the server-side Excel export API that uses ExcelJS for proper Excel format
        const response = await fetch('/api/exports/excel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: dataType,
            data: data
          }),
        });
        
        if (!response.ok) {
          // If server-side Excel generation fails, fall back to client-side TSV
          throw new Error('Server-side Excel generation failed');
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Download the Excel file
        downloadFile(blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `${filename}.xlsx`);
      } catch (error) {
        // Use fallback method - convert to TSV and copy to clipboard or download
        const tsvText = convertToExcelTSV(data, dataType);
        
        // Try to copy to clipboard
        try {
          navigator.clipboard.writeText(tsvText)
            .then(() => {
              alert('Server-side Excel export failed. As a fallback, Excel-formatted data has been copied to your clipboard.\n\n1. Open Excel\n2. Create a new spreadsheet\n3. Click in cell A1\n4. Press Ctrl+V or Cmd+V to paste');
            })
            .catch(err => {
              alert('Could not copy to clipboard. Using fallback download method.');
              // Fallback to downloading as TSV
              downloadFile(tsvText, 'text/tab-separated-values', `${filename}.tsv`);
            });
        } catch (e) {
          alert('Could not access clipboard. Using fallback download method.');
          // Fallback to downloading as TSV
          downloadFile(tsvText, 'text/tab-separated-values', `${filename}.tsv`);
        }
      }
      break;
      
    case 'clipboard':
      // New option - just copy formatted TSV data to clipboard
      const clipboardText = convertToExcelTSV(data, dataType);
      try {
        navigator.clipboard.writeText(clipboardText)
          .then(() => {
            alert('Data has been copied to your clipboard. You can now paste it into Excel, Google Sheets, or any other spreadsheet application.');
          })
          .catch(err => {
            alert('Could not copy to clipboard due to a browser restriction. Please try another export method.');
          });
      } catch (e) {
        alert('Could not access clipboard. Please try another export method.');
      }
      break;
      
    case 'pdf':
      try {
        // Use server-side PDF generation
        const response = await fetch('/api/exports/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: dataType,
            data: data
          }),
        });
        
        if (!response.ok) {
          // If server-side PDF generation fails, fall back to client-side HTML
          throw new Error('Server-side PDF generation failed');
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Download the PDF file
        downloadFile(blob, 'application/pdf', `${filename}.pdf`);
      } catch (error) {
        // Fall back to the HTML approach
        const pdfHtml = convertToPdfHTML(data, dataType);
        downloadFile(pdfHtml, 'text/html', `${filename}-print-to-pdf.html`);
        
        // Show instructions for creating PDF
        setTimeout(() => {
          alert('Server-side PDF generation failed. As a fallback, an HTML file has been downloaded.\n\nTo create a PDF from this HTML file:\n\n1. Open the HTML file in your browser\n2. Press Ctrl+P or Cmd+P\n3. In the print dialog, select "Save as PDF"\n4. Click Save');
        }, 500);
      }
      break;
      
    case 'json':
    default:
      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, 'application/json', `${filename}.json`);
      break;
  }
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string | Blob, mimeType: string, filename: string): void {
  let blob;
  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = content;
  }
  
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generates a PDF file using jsPDF and downloads it
 */
function generatePDF(data: any, dataType: DataType, filename: string): void {
  // Skip if no data
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No data to export to PDF');
    return;
  }
  
  try {
    // Create new PDF document
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(23, 37, 84); // Dark blue
    doc.text(`HR Dashboard - ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`, 14, 22);
    
    // Add subtitle with date
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99); // Gray
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Extract column headers and data
    let tableHeaders: string[] = [];
    let tableData: any[][] = [];
    
    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach((item: any) => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    // Set column headers
    tableHeaders = Array.from(allKeys);
    
    // Prepare table data
    data.forEach((item: any) => {
      const row: any[] = tableHeaders.map(header => {
        const value = item[header];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      });
      tableData.push(row);
    });
    
    // Add table
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo
      alternateRowStyles: { fillColor: [249, 250, 251] }, // Light gray for alternating rows
      margin: { top: 40, left: 14, right: 14, bottom: 20 },
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width;
      const pageHeight = pageSize.height;
      
      doc.text(
        `© ${new Date().getFullYear()} CoreHR AI - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    alert('Failed to generate PDF. Check console for details.');
  }
}

/**
 * Converts data to CSV format
 * @param data The data array to convert
 * @param dataType The type of data being exported
 * @param delimiter The delimiter to use (defaults to comma)
 */
function convertToCSV(data: any, dataType: DataType, delimiter: string = ','): string {
  if (!data || !Array.isArray(data)) {
    return '';
  }
  
  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach((item: any) => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  let csv = headers.join(delimiter) + '\n';
  
  // Add each row of data
  data.forEach((item: any) => {
    const row = headers.map(header => {
      const value = item[header];
      // Format the value properly for CSV
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      if (typeof value === 'string') {
        // Make sure the value is properly escaped
        const needsQuotes = value.includes(delimiter) || value.includes('"') || value.includes('\n');
        return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
      }
      return value;
    });
    csv += row.join(delimiter) + '\n';
  });
  
  return csv;
}

/**
 * Converts data to Tab-Separated Values that Excel can properly open
 */
function convertToExcelTSV(data: any, dataType: DataType): string {
  if (!data || !Array.isArray(data)) {
    return '';
  }
  
  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach((item: any) => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  let tsv = headers.join('\t') + '\r\n'; // Excel prefers CRLF line endings
  
  // Add each row of data
  data.forEach((item: any) => {
    const row = headers.map(header => {
      const value = item[header];
      // Format the value properly for TSV
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        // Double quotes need to be escaped with double quotes in TSV too
        return JSON.stringify(value).replace(/"/g, '""');
      }
      if (typeof value === 'string') {
        // Handle tab characters in strings by replacing them
        return value.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
      }
      return value;
    });
    tsv += row.join('\t') + '\r\n';
  });
  
  return tsv;
}

/**
 * Creates a proper Excel-compatible HTML table 
 * This browser-compatible approach produces files that Excel can open natively
 */
function createExcelTable(data: any, dataType: DataType): string {
  if (!data || !Array.isArray(data)) {
    return '';
  }
  
  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach((item: any) => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Create a simplified HTML table with Excel XML namespaces
  // Adding BOM marker at the start for proper UTF-8 detection
  let excelContent = '\ufeff';
  
  // Add Excel XML namespaces and mso-specific styles
  excelContent += `
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:x="urn:schemas-microsoft-com:office:excel" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>HR Data Export</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    table {
      border-collapse: collapse;
      width: 100%;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: left;
      padding: 8px;
      border: 1px solid #ddd;
    }
    td {
      text-align: left;
      padding: 8px;
      border: 1px solid #ddd;
    }
    .report-header {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .report-meta {
      font-size: 12px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="report-header">HR Dashboard - ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}</div>
  <div class="report-meta">Generated: ${new Date().toLocaleString()}</div>
  <table>
    <thead>
      <tr>
        ${headers.map(header => `<th>${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
`;

  // Add data rows
  data.forEach((item: any) => {
    excelContent += '<tr>';
    headers.forEach(header => {
      const value = item[header];
      if (value === null || value === undefined) {
        excelContent += '<td></td>';
      } else if (typeof value === 'object') {
        excelContent += `<td>${JSON.stringify(value)}</td>`;
      } else {
        excelContent += `<td>${value}</td>`;
      }
    });
    excelContent += '</tr>';
  });
  
  excelContent += `
    </tbody>
  </table>
</body>
</html>`;
  
  return excelContent;
}

/**
 * Uses jsPDF to generate a PDF document and download it
 */
function generatePDFDocument(data: any, dataType: DataType, filename: string): void {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No data to export to PDF');
    return;
  }
  
  // Create new PDF document
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(23, 37, 84); // Dark blue
  doc.text(`HR Dashboard - ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`, 14, 22);
  
  // Add subtitle with date
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99); // Gray
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  // Extract column headers and data
  let tableHeaders: string[] = [];
  let tableData: any[][] = [];
  
  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach((item: any) => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  // Set column headers
  tableHeaders = Array.from(allKeys);
  
  // Prepare table data
  data.forEach((item: any) => {
    const row: any[] = tableHeaders.map(header => {
      const value = item[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    });
    tableData.push(row);
  });
  
  // Add table
  (doc as any).autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo
    alternateRowStyles: { fillColor: [249, 250, 251] }, // Light gray for alternating rows
    margin: { top: 40, left: 14, right: 14, bottom: 20 },
  });
  
  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageSize = doc.internal.pageSize;
    const pageWidth = pageSize.width;
    const pageHeight = pageSize.height;
    
    doc.text(
      `© ${new Date().getFullYear()} CoreHR AI - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Save PDF
  doc.save(filename);
}

/**
 * Converts data to a simple HTML table for PDF display
 */
function convertToPdfHTML(data: any, dataType: DataType): string {
  if (!data || !Array.isArray(data)) {
    return '<html><body><h1>No data to export</h1></body></html>';
  }
  
  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach((item: any) => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Create HTML table
  let html = `
  <html>
  <head>
    <title>HR Dashboard Export - ${dataType}</title>
    <style>
      body { 
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f9f9f9;
        color: #333;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 4px;
      }
      .header {
        border-bottom: 2px solid #f2f2f2;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .logo {
        font-size: 22px;
        font-weight: bold;
        color: #4f46e5;
        margin-bottom: 5px;
      }
      .report-title {
        font-size: 28px;
        margin: 10px 0;
        color: #111827;
      }
      .meta {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 20px;
        font-size: 14px;
      }
      th, td { 
        padding: 12px 15px; 
        text-align: left; 
        border-bottom: 1px solid #e5e7eb; 
      }
      th { 
        background-color: #f9fafb; 
        font-weight: 500;
        color: #374151;
        position: sticky;
        top: 0;
      }
      tr:hover { background-color: #f9fafb; }
      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
        font-size: 13px;
        color: #6b7280;
        text-align: center;
      }
      @media print {
        body { background-color: white; margin: 0; padding: 0; }
        .container { box-shadow: none; padding: 10px; max-width: 100%; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        @page { margin: 0.5cm; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">HR AGENT</div>
        <h1 class="report-title">Dashboard Export - ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}</h1>
        <div class="meta">
          <div>Generated: ${new Date().toLocaleString()}</div>
          <div>Time Range: Current</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add each row of data
  data.forEach((item: any) => {
    html += '<tr>';
    headers.forEach(header => {
      const value = item[header];
      if (value === null || value === undefined) {
        html += '<td></td>';
      } else if (typeof value === 'object') {
        html += `<td>${JSON.stringify(value)}</td>`;
      } else {
        html += `<td>${value}</td>`;
      }
    });
    html += '</tr>';
  });
  
  html += `
      </tbody>
    </table>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CoreHR AI - Confidential and Proprietary</p>
    </div>
    </div>
  </body>
  </html>
  `;
  
  return html;
}
