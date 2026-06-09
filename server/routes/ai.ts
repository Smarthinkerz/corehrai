import { Router } from "express";
import { storage } from "../storage";
import {
  generateAIInsights,
  generateSentimentAnalysis,
  processChatMessage,
  generateLearningPath,
  reviewWorkforcePlan
} from "../services/openai";

const router = Router();

router.get('/insights', async (req, res) => {
  try {
    const timeFrame = req.query.timeFrame as string || 'week';
    const departments = await storage.getAllDepartments();
    const employees = await storage.getAllEmployees();
    const insights = await generateAIInsights(departments, employees, timeFrame);
    res.json(insights);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to generate insights', error: error.message });
  }
});

router.post('/workforce-plans/review', async (req, res) => {
  try {
    const { name, description, departmentName, startDate, endDate, headcountChange } = req.body;
    if (!name || !description || !departmentName || !startDate || !endDate || headcountChange === undefined) {
      return res.status(400).json({ message: 'Missing required workforce plan details' });
    }
    const review = await reviewWorkforcePlan({ name, description, departmentName, startDate, endDate, headcountChange });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'REVIEW',
      description: `AI-reviewed workforce plan: ${name}`,
      entityType: 'workforce_plan',
      entityId: 0
    });
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to review workforce plan', error: error.message });
  }
});

router.post('/workforce-plans/implement-revision', async (req, res) => {
  try {
    const { originalPlan, revisedPlan, implementationNotes } = req.body;
    if (!originalPlan || !revisedPlan) {
      return res.status(400).json({ message: 'Missing required plan details' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'IMPLEMENT',
      description: `Implemented AI-revised workforce plan: ${revisedPlan.name}`,
      entityType: 'workforce_plan',
      entityId: 0
    });
    res.json({
      success: true,
      message: 'Workforce plan revision implemented successfully',
      implementedAt: new Date().toISOString(),
      planName: revisedPlan.name
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to implement revised plan', error: error.message });
  }
});

router.post('/sentiment-analysis', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required for sentiment analysis' });
    }
    const sentiment = await generateSentimentAnalysis(text);
    res.json(sentiment);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to analyze sentiment', error: error.message });
  }
});

router.post('/learning-path', async (req, res) => {
  try {
    const { role, currentSkills, department, experienceLevel } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required to generate a learning path' });
    }
    const learningPath = await generateLearningPath(role, currentSkills || [], department, experienceLevel || 'mid');
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'GENERATE',
      description: `Generated AI learning path for ${role}`,
      entityType: 'learning-path',
      entityId: 0
    });
    res.json(learningPath);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to generate learning path', error: error.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Chat message is required' });
    }
    const response = await processChatMessage(message, conversationHistory || []);
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to process chat request', error: error.message });
  }
});

router.post('/ai-assistant/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const conversationHistory = context?.conversationHistory || [];
    const response = await processChatMessage(message, conversationHistory);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'AI_CHAT',
      description: 'Interaction with AI assistant',
      entityType: 'ai_assistant',
      entityId: 0
    });
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to process AI assistant request', error: error.message });
  }
});

export default router;
