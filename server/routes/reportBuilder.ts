import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const reports = await storage.getAllSavedReports();
    const filtered = reports.filter(r => r.isShared || r.createdBy === userId);
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const report = await storage.getSavedReport(parseInt(req.params.id));
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const report = await storage.createSavedReport({
      ...req.body,
      createdBy: (req.user as any)?.id || 1
    });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created report: ${report.name}`,
      entityType: 'report',
      entityId: report.id
    });
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const report = await storage.updateSavedReport(parseInt(req.params.id), req.body);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteSavedReport(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/run', async (req, res) => {
  try {
    const report = await storage.getSavedReport(parseInt(req.params.id));
    if (!report) return res.status(404).json({ error: 'Report not found' });

    let data: any[] = [];
    switch (report.reportType) {
      case 'employees': data = await storage.getAllEmployees(); break;
      case 'candidates': data = await storage.getAllCandidates(); break;
      case 'departments': data = await storage.getAllDepartments(); break;
      case 'tasks': data = await storage.getAllHrTasks(); break;
      case 'attendance': data = await storage.getAllAttendanceRecords(); break;
      case 'payroll': data = await storage.getAllPayrollRecords(); break;
      case 'leave': data = await storage.getAllLeaveRequests(); break;
      default: data = [];
    }

    const filters = report.filters as any;
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          data = data.filter((item: any) => {
            const itemVal = item[key];
            if (typeof itemVal === 'string') return itemVal.toLowerCase().includes(String(value).toLowerCase());
            return itemVal === value;
          });
        }
      });
    }

    res.json({ report, data, totalRecords: data.length, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
