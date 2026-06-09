import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const shiftSchema = z.object({
  employeeId: z.number(),
  shiftDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  shiftType: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

router.get('/', async (req, res) => {
  try {
    const allShifts = await storage.getAllShifts();
    const employees = await storage.getAllEmployees();
    const enriched = allShifts.map(s => ({ ...s, employeeName: employees.find(e => e.id === s.employeeId)?.fullName || 'Unknown', employeePosition: employees.find(e => e.id === s.employeeId)?.position }));
    const pagination = parsePagination(req);
    const page = enriched.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, enriched.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/date/:date', async (req, res) => {
  try {
    const shifts = await storage.getShiftsByDate(req.params.date);
    const employees = await storage.getAllEmployees();
    res.json(shifts.map(s => ({ ...s, employeeName: employees.find(e => e.id === s.employeeId)?.fullName })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const data = shiftSchema.parse(req.body);
    res.status(201).json(await storage.createShift(data));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = shiftSchema.partial().parse(req.body);
    const s = await storage.updateShift(parseInt(req.params.id), data);
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deleteShift(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/auto-schedule', async (req, res) => {
  try {
    const { date, department } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });
    const employees = await storage.getAllEmployees();
    const filtered = department ? employees.filter(e => e.department === department) : employees;
    const shiftTypes = [{ type: 'morning', start: '06:00', end: '14:00' }, { type: 'afternoon', start: '14:00', end: '22:00' }, { type: 'evening', start: '22:00', end: '06:00' }];
    const created = [];
    for (const emp of filtered) {
      const shift = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
      const s = await storage.createShift({ employeeId: emp.id, shiftDate: date, startTime: shift.start, endTime: shift.end, shiftType: shift.type, department: emp.department || department, status: 'scheduled' });
      created.push({ ...s, employeeName: emp.fullName });
    }
    res.json({ scheduled: created.length, shifts: created });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/swap-requests', async (req, res) => {
  try {
    const requests = await storage.getAllShiftSwapRequests();
    const employees = await storage.getAllEmployees();
    const allShifts = await storage.getAllShifts();
    const enriched = requests.map(r => ({ ...r, requesterName: employees.find(e => e.id === r.requesterId)?.fullName, targetName: r.targetEmployeeId ? employees.find(e => e.id === r.targetEmployeeId)?.fullName : null, shift: allShifts.find(s => s.id === r.shiftId) }));
    const pagination = parsePagination(req);
    const page = enriched.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, enriched.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/swap-requests', async (req, res) => {
  try {
    const swapSchema = z.object({ shiftId: z.number(), requesterId: z.number(), targetEmployeeId: z.number().optional(), reason: z.string().optional() }).passthrough();
    const data = swapSchema.parse(req.body);
    res.status(201).json(await storage.createShiftSwapRequest(data));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/swap-requests/:id', async (req, res) => {
  try {
    const r = await storage.updateShiftSwapRequest(parseInt(req.params.id), req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
