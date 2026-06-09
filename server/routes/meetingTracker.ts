import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const meetingSchema = z.object({
  managerId: z.number(),
  reportId: z.number(),
  scheduledAt: z.coerce.date(),
  duration: z.number().optional(),
  agenda: z.any().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

const meetingUpdateSchema = meetingSchema.partial();

router.get('/', async (req, res) => {
  try {
    const meetings = await storage.getAllOneOnOneMeetings();
    const employees = await storage.getAllEmployees();
    const enriched = meetings.map(m => ({ ...m, managerName: employees.find(e => e.id === m.managerId)?.fullName || 'Unknown', reportName: employees.find(e => e.id === m.reportId)?.fullName || 'Unknown', reportPosition: employees.find(e => e.id === m.reportId)?.position }));
    const pagination = parsePagination(req);
    const page = enriched.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, enriched.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const data = meetingSchema.parse(req.body);
    res.status(201).json(await storage.createOneOnOneMeeting(data));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = meetingUpdateSchema.parse(req.body);
    const m = await storage.updateOneOnOneMeeting(parseInt(req.params.id), data);
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const m = await storage.getOneOnOneMeeting(parseInt(req.params.id));
    if (!m) return res.status(404).json({ error: 'Not found' });
    const notes = req.body.notes || m.notes || '';
    const aiSummary = `Meeting covered: ${((m.agenda as any[]) || []).map((a: any) => a.topic || a).join(', ') || 'general discussion'}. ${notes ? 'Key points discussed. ' : ''}${((req.body.actionItems || m.actionItems || []) as any[]).length} action items identified.`;
    const updated = await storage.updateOneOnOneMeeting(m.id, { status: 'completed', completedAt: new Date(), notes: req.body.notes || m.notes, actionItems: req.body.actionItems || m.actionItems, aiSummary, mood: req.body.mood || 'neutral' });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deleteOneOnOneMeeting(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/overdue', async (_req, res) => {
  try {
    const meetings = await storage.getAllOneOnOneMeetings();
    const employees = await storage.getAllEmployees();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    // Derive (manager, report) pairs from historical meetings since employees
    // table stores manager as a name string rather than a FK.
    const pairKeys = new Set<string>();
    meetings.forEach(m => { pairKeys.add(`${m.managerId}|${m.reportId}`); });
    const overdue: any[] = [];
    pairKeys.forEach(key => {
      const [mgrStr, repStr] = key.split('|');
      const managerId = parseInt(mgrStr);
      const reportId = parseInt(repStr);
      const lastMeeting = meetings
        .filter(m => m.managerId === managerId && m.reportId === reportId && m.status === 'completed')
        .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];
      if (!lastMeeting || new Date(lastMeeting.completedAt || 0) < twoWeeksAgo) {
        overdue.push({
          managerId,
          reportId,
          managerName: employees.find(e => e.id === managerId)?.fullName,
          reportName: employees.find(e => e.id === reportId)?.fullName,
          lastMeetingDate: lastMeeting?.completedAt || null,
          daysSince: lastMeeting
            ? Math.floor((Date.now() - new Date(lastMeeting.completedAt || 0).getTime()) / (24 * 60 * 60 * 1000))
            : null,
        });
      }
    });
    res.json(overdue);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
