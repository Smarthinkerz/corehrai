import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const recognitionSchema = z.object({
  toUserId: z.number(),
  message: z.string().min(1),
  category: z.string().min(1),
  points: z.number().optional(),
}).passthrough();

router.get('/', async (req, res) => {
  try {
    const recognitions = await storage.getAllRecognitions();
    const users = await storage.getAllUsers();
    const enriched = recognitions.map(r => {
      const from = users.find(u => u.id === r.fromUserId);
      const to = users.find(u => u.id === r.toUserId);
      return { ...r, fromUserName: from?.fullName || 'Unknown', toUserName: to?.fullName || 'Unknown' };
    });
    const pagination = parsePagination(req);
    const page = enriched.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, enriched.length, pagination));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const recognitions = await storage.getRecognitionsByUser(parseInt(req.params.userId));
    res.json(recognitions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = recognitionSchema.parse(req.body);
    const recognition = await storage.createRecognition({
      ...data,
      fromUserId: (req.user as any)?.id || 1
    });
    await storage.createNotification({
      userId: recognition.toUserId,
      title: 'New Recognition!',
      message: `You received a ${recognition.category} recognition: "${recognition.message}"`,
      type: 'recognition',
      isRead: false,
      link: '/recognition'
    });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Gave recognition to user ${recognition.toUserId}: ${recognition.category}`,
      entityType: 'recognition',
      entityId: recognition.id
    });
    res.status(201).json(recognition);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteRecognition(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const recognitions = await storage.getAllRecognitions();
    const users = await storage.getAllUsers();
    const counts: Record<number, number> = {};
    recognitions.forEach(r => { counts[r.toUserId] = (counts[r.toUserId] || 0) + 1; });
    const leaderboard = Object.entries(counts)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === parseInt(userId));
        return { userId: parseInt(userId), name: user?.fullName || 'Unknown', department: user?.department, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
