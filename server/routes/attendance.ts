import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const records = await storage.getAllAttendanceRecords();
    const pagination = parsePagination(req);
    const page = records.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, records.length, pagination));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const records = await storage.getAttendanceByEmployee(parseInt(req.params.employeeId));
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/date/:date', async (req, res) => {
  try {
    const records = await storage.getAttendanceByDate(req.params.date);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clock-in', async (req, res) => {
  try {
    const schema = z.object({ employeeId: z.number() });
    const { employeeId } = schema.parse(req.body);
    const now = new Date();
    const record = await storage.createAttendanceRecord({
      employeeId,
      date: now,
      clockIn: now,
      status: 'present'
    });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CLOCK_IN',
      description: `Employee ${employeeId} clocked in`,
      entityType: 'attendance',
      entityId: record.id
    });
    res.status(201).json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.post('/clock-out/:id', async (req, res) => {
  try {
    const now = new Date();
    const records = await storage.getAllAttendanceRecords();
    const record = records.find(r => r.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const clockIn = record.clockIn ? new Date(record.clockIn) : now;
    const hoursWorked = (now.getTime() - clockIn.getTime()) / 3600000;

    const updated = await storage.updateAttendanceRecord(parseInt(req.params.id), {
      clockOut: now,
      hoursWorked: Math.round(hoursWorked * 100) / 100
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const schema = z.object({
      employeeId: z.number(),
      date: z.coerce.date(),
      clockIn: z.coerce.date().optional(),
      clockOut: z.coerce.date().optional(),
      status: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const record = await storage.createAttendanceRecord(data);
    res.status(201).json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', async (_req, res) => {
  try {
    const records = await storage.getAllAttendanceRecords();
    const employees = await storage.getAllEmployees();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => new Date(r.date).toISOString().split('T')[0] === today);

    res.json({
      totalEmployees: employees.length,
      presentToday: todayRecords.filter(r => r.status === 'present').length,
      absentToday: employees.length - todayRecords.filter(r => r.status === 'present').length,
      lateToday: todayRecords.filter(r => r.status === 'late').length,
      totalRecords: records.length,
      avgHoursWorked: records.length > 0 ? Math.round(records.reduce((s, r) => s + (r.hoursWorked || 0), 0) / records.length * 10) / 10 : 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
