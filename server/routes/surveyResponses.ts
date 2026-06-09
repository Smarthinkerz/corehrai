import { Router } from "express";
import { storage } from "../storage";
import { insertSurveyResponseSchema } from "@shared/schema";
import { generateSentimentAnalysis } from "../services/openai";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const responses = await storage.getAllSurveyResponses();
    res.json(responses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
});

router.get('/survey/:surveyId', async (req, res) => {
  try {
    const responses = await storage.getSurveyResponsesBySurvey(Number(req.params.surveyId));
    res.json(responses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const responses = await storage.getSurveyResponsesByEmployee(Number(req.params.employeeId));
    res.json(responses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = insertSurveyResponseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid response data', details: result.error.format() });
    }
    const responseData = result.data;
    let sentimentScore = null;
    try {
      if (typeof responseData.responses === 'object' && responseData.responses) {
        const responseText = JSON.stringify(responseData.responses);
        const sentimentAnalysis = await generateSentimentAnalysis(responseText);
        sentimentScore = sentimentAnalysis.score;
        responseData.sentimentScore = sentimentScore;
      }
    } catch (_sentimentError) {
      // Continue without sentiment analysis if it fails
    }
    const newResponse = await storage.createSurveyResponse(responseData);
    if (responseData.employeeId && sentimentScore !== null) {
      try {
        const employee = await storage.getEmployee(responseData.employeeId);
        if (employee) {
          const engagementScore = Math.round(sentimentScore * 100);
          await storage.updateEmployee(responseData.employeeId, { engagementScore });
        }
      } catch (_empError) {
        // Continue even if this fails
      }
    }
    await storage.createActivityLog({
      userId: responseData.employeeId || 1,
      action: 'CREATE',
      description: `Submitted survey response for survey ID: ${responseData.surveyId}`,
      entityType: 'survey_response',
      entityId: newResponse.id
    });
    res.status(201).json(newResponse);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create survey response' });
  }
});

export default router;
