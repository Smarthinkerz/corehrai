import { Router } from "express";
import { storage } from "../storage";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const activities = await storage.getAllActivityLogs();
    if (req.query.page) {
      const params = parsePagination(req, 50);
      const paginated = activities.slice(params.offset, params.offset + params.limit);
      return res.json(paginatedResponse(paginated, activities.length, params));
    }
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch activities', error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const activities = await storage.getActivityLogsByUser(Number(req.params.userId));
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch activities by user', error: error.message });
  }
});

export default router;
