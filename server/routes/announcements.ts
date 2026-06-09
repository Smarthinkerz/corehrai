import { Router } from "express";
import { storage } from "../storage";
import { insertAnnouncementSchema } from "@shared/schema";
import { translateText } from "../services/openai";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const announcements = await storage.getAllAnnouncements();
    const pagination = parsePagination(req);
    const page = announcements.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, announcements.length, pagination));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
});

router.get('/published', async (_req, res) => {
  try {
    const announcements = await storage.getPublishedAnnouncements();
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch published announcements', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const announcement = await storage.getAnnouncement(Number(req.params.id));
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch announcement', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdBy: (req.user as any)?.id || 1
    };
    const validatedData = insertAnnouncementSchema.parse(data);
    const announcement = await storage.createAnnouncement(validatedData);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created announcement: ${announcement.title}`,
      entityType: 'announcement',
      entityId: announcement.id
    });
    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create announcement', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    const validatedData = insertAnnouncementSchema.partial().parse(req.body);
    const updated = await storage.updateAnnouncement(announcementId, validatedData);
    if (!updated) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: `Updated announcement: ${updated.title}`,
      entityType: 'announcement',
      entityId: announcementId
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update announcement', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    const deleted = await storage.deleteAnnouncement(announcementId);
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted announcement',
      entityType: 'announcement',
      entityId: announcementId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
});

router.post('/:id/translate', async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    const { targetLanguage } = req.body;
    if (!targetLanguage) {
      return res.status(400).json({ message: 'Target language is required' });
    }
    const announcement = await storage.getAnnouncement(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const [titleResult, contentResult] = await Promise.all([
      translateText(announcement.title, targetLanguage, "HR announcement title"),
      translateText(announcement.content, targetLanguage, "HR announcement")
    ]);

    const existingTranslations = (announcement.translations as Record<string, any>) || {};
    const updatedTranslations = {
      ...existingTranslations,
      [targetLanguage]: {
        title: titleResult.translatedText,
        content: contentResult.translatedText,
        translatedAt: new Date().toISOString()
      }
    };

    const updated = await storage.updateAnnouncement(announcementId, {
      translations: updatedTranslations
    });

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'TRANSLATE',
      description: `Translated announcement to ${targetLanguage}`,
      entityType: 'announcement',
      entityId: announcementId
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to translate announcement', error: error.message });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    const updated = await storage.updateAnnouncement(announcementId, {
      isPublished: true,
      publishedAt: new Date()
    });
    if (!updated) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'PUBLISH',
      description: `Published announcement: ${updated.title}`,
      entityType: 'announcement',
      entityId: announcementId
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to publish announcement', error: error.message });
  }
});

export default router;
