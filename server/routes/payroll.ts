import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const payrollSchema = z.object({
  employeeId: z.number(),
  period: z.string().min(1),
  baseSalary: z.number(),
  bonus: z.number().default(0),
  deductions: z.number().default(0),
  netPay: z.number(),
  status: z.string().default('pending'),
});

router.get('/', async (req, res) => {
  try {
    const records = await storage.getAllPayrollRecords();
    const params = parsePagination(req);
    const paginated = records.slice(params.offset, params.offset + params.limit);
    res.json(paginatedResponse(paginated, records.length, params));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const records = await storage.getPayrollRecordsByEmployee(parseInt(req.params.employeeId));
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = payrollSchema.parse(req.body);
    const record = await storage.createPayrollRecord(data);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created payroll record for employee ${record.employeeId} - Period: ${record.period}`,
      entityType: 'payroll',
      entityId: record.id
    });
    try {
      const { recordAction } = await import('../services/autopilotEngine');
      const orgId = (req.user as any)?.organizationId;
      if (orgId) {
        await recordAction({
          organizationId: orgId,
          workflowKey: 'payroll_calculation',
          title: `Payroll calculated for employee #${record.employeeId} (${record.period})`,
          summary: `Net pay: ${record.netPay} OMR. Status: ${record.status}.`,
          input: { employeeId: record.employeeId, period: record.period, baseSalary: data.baseSalary },
          output: { netPay: record.netPay, bonus: data.bonus, deductions: data.deductions },
          entityType: 'payroll',
          entityId: record.id,
        });
      }
    } catch {}
    res.status(201).json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = payrollSchema.partial().parse(req.body);
    const record = await storage.updatePayrollRecord(parseInt(req.params.id), data);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', async (_req, res) => {
  try {
    const records = await storage.getAllPayrollRecords();
    const employees = await storage.getAllEmployees();
    const totalPayroll = records.reduce((sum, r) => sum + r.netPay, 0);
    const avgSalary = employees.length > 0 ? employees.reduce((sum, e) => sum + (e.salary || 0), 0) / employees.length : 0;
    const pendingCount = records.filter(r => r.status === 'pending').length;
    const paidCount = records.filter(r => r.status === 'paid').length;

    res.json({
      totalPayroll,
      averageSalary: Math.round(avgSalary),
      totalRecords: records.length,
      pendingCount,
      paidCount,
      totalEmployees: employees.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
