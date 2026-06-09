import { Router } from "express";
import Excel from 'exceljs';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const router = Router();

function processExportData(data: any[]): any[] {
  if (!Array.isArray(data)) return [];
  if (data.length > 0 && data[0].section && data[0].data && Array.isArray(data[0].data)) {
    let processedData: any[] = [];
    data.forEach(section => {
      if (section.data && Array.isArray(section.data)) {
        const sectionData = section.data.map((item: any) => ({ section: section.section, ...item }));
        processedData = [...processedData, ...sectionData];
      }
    });
    return processedData.length > 0 ? processedData : data;
  }
  return data;
}

router.post('/csv', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ message: 'Invalid export request. Type and data are required.' });
    }
    const processedData = processExportData(data);
    if (!Array.isArray(processedData) || processedData.length === 0) {
      return res.status(400).json({ message: 'No data to export after processing.' });
    }
    const headers = Object.keys(processedData[0]);
    let csvContent = headers.join(',') + '\r\n';
    processedData.forEach(item => {
      const rowValues = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return String(value);
      });
      csvContent += rowValues.join(',') + '\r\n';
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csvContent);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create CSV report", details: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/pdf', async (req, res) => {
  try {
    const { type = 'unknown', metadata = {} } = req.body;
    let { data = [] } = req.body;
    if (!type || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Invalid export request. Type and non-empty data array are required.' });
    }
    const normalizedType = type === 'workforce' ? 'management' : type;
    if ((type === 'management' || type === 'workforce') && data.length > 0 && !('section' in data[0])) {
      data = data.map(item => ({ section: 'Workforce', ...item }));
    }
    const processedData = processExportData(data);
    if (processedData.length === 0) {
      return res.status(400).json({ message: 'No data to export after processing.' });
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    const { default: autoTable } = await import('jspdf-autotable');
    const reportTitle = `${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).replace(/-/g, ' ')} Report`;
    doc.setFontSize(18);
    doc.setTextColor(23, 37, 84);
    doc.text(reportTitle, 14, 22);
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(`Generated on: ${currentDate}`, 14, 30);
    const allKeysSet = new Set<string>();
    processedData.forEach((item: any) => Object.keys(item).forEach(key => allKeysSet.add(key)));
    const headers = Array.from(allKeysSet);
    const rows = processedData.map((item: any) => headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    }));
    autoTable(doc, { head: [headers], body: rows, startY: 40, theme: 'grid', styles: { fontSize: 9, cellPadding: 3 } });
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(23, 37, 84);
    doc.text('Report Summary', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(`Generated on: ${currentDate}`, 14, 30);
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [['Report Type', reportTitle], ['Number of Records', processedData.length.toString()], ['Generated Date', currentDate]],
      startY: 40, theme: 'grid', styles: { fontSize: 10, cellPadding: 4 }
    });
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create PDF report", details: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/excel', async (req, res) => {
  try {
    let { type = 'unknown', data = [], metadata = {} } = req.body;
    if (!type || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Invalid export request. Type and non-empty data array are required.' });
    }
    const normalizedType = type === 'workforce' ? 'management' : type;
    if ((type === 'management' || type === 'workforce') && data.length > 0 && !('section' in data[0])) {
      data = data.map(item => ({ section: 'Workforce', ...item }));
    }
    const processedData = processExportData(data);
    if (processedData.length === 0) {
      return res.status(400).json({ message: 'No data to export after processing.' });
    }
    const workbook = new Excel.Workbook();
    const dataSheet = workbook.addWorksheet('Report Data');
    const summarySheet = workbook.addWorksheet('Summary');
    dataSheet.properties.defaultColWidth = 20;
    summarySheet.properties.defaultColWidth = 25;
    const reportTitle = `${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).replace(/-/g, ' ')} Report`;
    const currentDate = new Date().toLocaleDateString();
    const titleRow = dataSheet.addRow([reportTitle]);
    titleRow.font = { bold: true, size: 16 };
    dataSheet.mergeCells('A1:F1');
    dataSheet.getCell('A1').alignment = { horizontal: 'center' };
    const summaryTitleRow = summarySheet.addRow([reportTitle]);
    summaryTitleRow.font = { bold: true, size: 16 };
    summarySheet.mergeCells('A1:B1');
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };
    const dateRow = dataSheet.addRow([`Generated on ${currentDate}`]);
    dateRow.font = { italic: true };
    dataSheet.mergeCells('A2:F2');
    dataSheet.getCell('A2').alignment = { horizontal: 'center' };
    const summaryDateRow = summarySheet.addRow([`Generated on ${currentDate}`]);
    summaryDateRow.font = { italic: true };
    summarySheet.mergeCells('A2:B2');
    summarySheet.getCell('A2').alignment = { horizontal: 'center' };
    dataSheet.addRow([]);
    summarySheet.addRow([]);
    if (processedData.length > 0) {
      const headersArray = Object.keys(processedData[0]);
      const headerRow = dataSheet.addRow(headersArray);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center' };
      });
      processedData.forEach((row: any) => {
        const rowValues = Object.keys(row).map(key => {
          const value = row[key];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return value;
        });
        const dataRow = dataSheet.addRow(rowValues);
        dataRow.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });
      headersArray.forEach((_, colIndex: number) => {
        dataSheet.getColumn(colIndex + 1).width = 20;
      });
    }
    const summaryHeaderRow = summarySheet.addRow(['Report Statistics']);
    summaryHeaderRow.font = { bold: true, size: 14 };
    summarySheet.mergeCells('A5:B5');
    summarySheet.addRow([]);
    const metricsHeaderRow = summarySheet.addRow(['Metric', 'Value']);
    metricsHeaderRow.font = { bold: true };
    metricsHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    const summaryStats = [
      ['Report Type', reportTitle],
      ['Total Records', processedData.length.toString()],
      ['Generated Date', currentDate]
    ];
    summaryStats.forEach(row => {
      const dataRow = summarySheet.addRow(row);
      dataRow.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
    res.setHeader('Content-Length', (buffer as Buffer).length);
    res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create Excel report", details: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
