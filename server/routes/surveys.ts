import { Router } from "express";
import { storage } from "../storage";
import { insertEngagementSurveySchema, insertSurveyResponseSchema } from "@shared/schema";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const surveys = await storage.getAllEngagementSurveys();
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

router.get('/active', async (_req, res) => {
  try {
    const surveys = await storage.getActiveEngagementSurveys();
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch active surveys' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    const survey = await storage.getEngagementSurvey(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    res.json(survey);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

router.post('/', async (req, res) => {
  try {
    const formData = { ...req.body };
    if (formData.startDate && typeof formData.startDate === 'string') {
      formData.startDate = new Date(formData.startDate);
    }
    if (formData.endDate && typeof formData.endDate === 'string') {
      formData.endDate = new Date(formData.endDate);
    }
    const result = insertEngagementSurveySchema.safeParse(formData);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid survey data', details: result.error.format() });
    }
    const newSurvey = await storage.createEngagementSurvey(result.data);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created new engagement survey: ${newSurvey.title}`,
      entityType: 'engagement_survey',
      entityId: newSurvey.id
    });
    res.status(201).json(newSurvey);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    const existingSurvey = await storage.getEngagementSurvey(id);
    if (!existingSurvey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    const updateData = { ...req.body };
    if (updateData.startDate && typeof updateData.startDate === 'string') {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate && typeof updateData.endDate === 'string') {
      updateData.endDate = new Date(updateData.endDate);
    }
    const result = insertEngagementSurveySchema.partial().safeParse(updateData);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid update data', details: result.error.format() });
    }
    const updatedSurvey = await storage.updateEngagementSurvey(id, result.data);
    if (!updatedSurvey) {
      return res.status(404).json({ error: 'Survey not found after update' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: `Updated engagement survey: ${updatedSurvey.title}`,
      entityType: 'engagement_survey',
      entityId: id
    });
    res.json(updatedSurvey);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    const existingSurvey = await storage.getEngagementSurvey(id);
    if (!existingSurvey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    const updateData = { ...req.body };
    if (updateData.startDate && typeof updateData.startDate === 'string') {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate && typeof updateData.endDate === 'string') {
      updateData.endDate = new Date(updateData.endDate);
    }
    const result = insertEngagementSurveySchema.partial().safeParse(updateData);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid update data', details: result.error.format() });
    }
    const updatedSurvey = await storage.updateEngagementSurvey(id, result.data);
    if (!updatedSurvey) {
      return res.status(404).json({ error: 'Survey not found after update' });
    }
    res.json(updatedSurvey);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    const deleted = await storage.deleteEngagementSurvey(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted engagement survey',
      entityType: 'engagement_survey',
      entityId: id
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

export default router;
