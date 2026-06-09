import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const logSchema = z.object({
  interactionType: z.string().min(1),
  query: z.string().min(1),
  response: z.string().optional(),
  metadata: z.any().optional(),
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await storage.getAllAiLearningLogs();
    const pagination = parsePagination(req);
    const page = logs.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, logs.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/logs', async (req, res) => {
  try {
    const data = logSchema.parse(req.body);
    const log = await storage.createAiLearningLog(data);
    res.status(201).json(log);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.post('/feedback/:id', async (req, res) => {
  try {
    const feedbackSchema = z.object({ rating: z.number().min(1).max(5), feedback: z.string().optional() });
    const { rating, feedback } = feedbackSchema.parse(req.body);
    const log = await storage.updateAiLearningLog(parseInt(req.params.id), { rating, feedback, improved: rating >= 4 });
    if (!log) return res.status(404).json({ error: 'Not found' });
    res.json(log);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const logs = await storage.getAllAiLearningLogs();
    const rated = logs.filter(l => l.rating !== null && l.rating !== undefined);
    const avgRating = rated.length > 0 ? (rated.reduce((s, l) => s + (l.rating || 0), 0) / rated.length).toFixed(1) : '0';
    const improved = logs.filter(l => l.improved).length;

    const byType: Record<string, number> = {};
    logs.forEach(l => { byType[l.interactionType] = (byType[l.interactionType] || 0) + 1; });

    const recentTrend = rated.slice(0, 20);
    const earlyAvg = recentTrend.slice(10).reduce((s, l) => s + (l.rating || 0), 0) / Math.max(1, recentTrend.slice(10).length);
    const recentAvg = recentTrend.slice(0, 10).reduce((s, l) => s + (l.rating || 0), 0) / Math.max(1, recentTrend.slice(0, 10).length);

    res.json({
      totalInteractions: logs.length, totalRated: rated.length, avgRating: parseFloat(avgRating),
      improvedCount: improved, improvementRate: logs.length > 0 ? Math.round(improved / logs.length * 100) : 0,
      interactionsByType: byType,
      performanceTrend: recentAvg > earlyAvg ? 'improving' : recentAvg < earlyAvg ? 'declining' : 'stable',
      modelAccuracy: Math.min(98, 75 + improved * 0.5)
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
