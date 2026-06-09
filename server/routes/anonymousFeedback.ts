import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const feedbackSchema = z.object({
  message: z.string().min(5, "Feedback must be at least 5 characters"),
  category: z.string().optional(),
  severity: z.string().optional(),
}).passthrough();

const AI_CATEGORIES: Record<string, string[]> = {
  'harassment': ['harassment', 'bullying', 'hostile', 'inappropriate', 'uncomfortable'],
  'compensation': ['pay', 'salary', 'bonus', 'compensation', 'underpaid', 'raise'],
  'management': ['manager', 'supervisor', 'leadership', 'micromanage', 'boss'],
  'workload': ['overwork', 'burnout', 'stress', 'hours', 'workload', 'overtime'],
  'culture': ['culture', 'morale', 'toxic', 'environment', 'values', 'inclusion'],
  'career': ['promotion', 'growth', 'career', 'opportunity', 'stuck', 'development'],
};

const ROUTING: Record<string, string> = {
  harassment: 'Legal & HR Compliance', compensation: 'Compensation & Benefits', management: 'HR Business Partner',
  workload: 'Employee Wellness', culture: 'People & Culture', career: 'Learning & Development',
};

router.get('/', async (req, res) => {
  try {
    const feedbacks = await storage.getAllAnonymousFeedbacks();
    const pagination = parsePagination(req);
    const page = feedbacks.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, feedbacks.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const msg = data.message.toLowerCase();
    let aiCategory = 'general';
    for (const [cat, keywords] of Object.entries(AI_CATEGORIES)) {
      if (keywords.some(k => msg.includes(k))) { aiCategory = cat; break; }
    }
    const sentimentWords = { negative: ['frustrated', 'angry', 'unfair', 'terrible', 'worst', 'hate'], positive: ['appreciate', 'great', 'love', 'thank', 'excellent'] };
    const aiSentiment = sentimentWords.negative.some(w => msg.includes(w)) ? 'negative' : sentimentWords.positive.some(w => msg.includes(w)) ? 'positive' : 'neutral';
    const severity = aiSentiment === 'negative' && aiCategory === 'harassment' ? 'critical' : aiSentiment === 'negative' ? 'high' : data.severity || 'medium';

    const f = await storage.createAnonymousFeedback({ ...data, category: data.category || aiCategory, aiCategory, aiSentiment, aiRoutedTo: ROUTING[aiCategory] || 'General HR', severity, status: 'new' });
    res.status(201).json(f);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/respond', async (req, res) => {
  try {
    const responseSchema = z.object({ response: z.string().min(1) });
    const { response } = responseSchema.parse(req.body);
    const f = await storage.updateAnonymousFeedback(parseInt(req.params.id), { adminResponse: response, status: 'responded', respondedAt: new Date() });
    if (!f) return res.status(404).json({ error: 'Not found' });
    res.json(f);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const statusSchema = z.object({ status: z.enum(['new', 'in_review', 'responded', 'resolved', 'dismissed']) });
    const { status } = statusSchema.parse(req.body);
    const f = await storage.updateAnonymousFeedback(parseInt(req.params.id), { status });
    if (!f) return res.status(404).json({ error: 'Not found' });
    res.json(f);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

export default router;
