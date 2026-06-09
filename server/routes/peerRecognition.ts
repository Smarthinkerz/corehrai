import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const BADGES = ['Star Performer', 'Team Player', 'Innovation Champion', 'Mentor', 'Problem Solver', 'Culture Builder', 'Customer Hero', 'Go-Getter'];
const CATEGORIES = ['Teamwork', 'Innovation', 'Leadership', 'Customer Focus', 'Above & Beyond', 'Mentorship', 'Technical Excellence'];

const peerRecognitionSchema = z.object({
  fromEmployeeId: z.number(),
  toEmployeeId: z.number(),
  message: z.string().min(1),
  category: z.string().min(1).default('Teamwork'),
  badge: z.string().optional(),
  points: z.number().default(10),
});

router.get('/', async (req, res) => {
  try {
    const recognitions = await storage.getAllPeerRecognitions();
    const employees = await storage.getAllEmployees();
    const enriched = recognitions.map(r => ({
      ...r,
      fromName: employees.find(e => e.id === r.fromEmployeeId)?.fullName || 'Unknown',
      toName: employees.find(e => e.id === r.toEmployeeId)?.fullName || 'Unknown',
      toPosition: employees.find(e => e.id === r.toEmployeeId)?.position,
    }));
    const pagination = parsePagination(req);
    const page = enriched.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, enriched.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const data = peerRecognitionSchema.parse(req.body);
    const r = await storage.createPeerRecognition(data);
    const toEmployee = await storage.getEmployee(r.toEmployeeId);
    if (toEmployee?.userId) {
      await storage.createNotification({ userId: toEmployee.userId, title: 'You received recognition!', message: `${req.body.fromName || 'A colleague'} recognized you: "${r.message}"`, type: 'recognition', isRead: false });
    }
    res.status(201).json(r);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const recognitions = await storage.getAllPeerRecognitions();
    const employees = await storage.getAllEmployees();
    const scores: Record<number, { name: string; position: string; points: number; count: number }> = {};
    recognitions.forEach(r => {
      if (!scores[r.toEmployeeId]) { const e = employees.find(emp => emp.id === r.toEmployeeId); scores[r.toEmployeeId] = { name: e?.fullName || 'Unknown', position: e?.position || '', points: 0, count: 0 }; }
      scores[r.toEmployeeId].points += r.points;
      scores[r.toEmployeeId].count++;
    });
    const leaderboard = Object.entries(scores).map(([id, s]) => ({ employeeId: parseInt(id), ...s })).sort((a, b) => b.points - a.points);
    res.json(leaderboard);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/badges', (_req, res) => { res.json({ badges: BADGES, categories: CATEGORIES }); });

export default router;
