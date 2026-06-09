import { Router } from "express";
import { storage } from "../storage";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const notifications = await storage.getNotificationsByUser(userId);
    const pagination = parsePagination(req);
    const page = notifications.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, notifications.length, pagination));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch unread count', error: error.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await storage.markNotificationRead(Number(req.params.id));
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    await storage.markAllNotificationsRead(userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await storage.deleteNotification(Number(req.params.id));
    if (!success) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
});

export default router;
