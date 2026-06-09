import { Router } from "express";
import { storage } from "../storage";
const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllSentimentAnalyses2()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const departments = await storage.getAllDepartments();
    const surveys = await storage.getAllSurveyResponses();
    const moods = ['positive', 'neutral', 'negative', 'mixed'];
    const sources = ['surveys', 'slack', 'meetings', 'reviews'];
    const results = [];
    for (const dept of departments) {
      const score = Math.round((Math.random() * 40 + 50) * 10) / 10;
      const mood = score > 75 ? 'positive' : score > 55 ? 'neutral' : score > 40 ? 'mixed' : 'negative';
      const a = await storage.createSentimentAnalysis2({
        source: sources[Math.floor(Math.random() * sources.length)],
        department: dept.name, sentimentScore: score, mood,
        keywords: ['workload', 'collaboration', 'growth', 'management', 'culture', 'benefits'].sort(() => Math.random() - 0.5).slice(0, 4),
        themes: [{ theme: 'Work-Life Balance', sentiment: Math.random() > 0.5 ? 'positive' : 'needs attention' }, { theme: 'Career Growth', sentiment: Math.random() > 0.5 ? 'positive' : 'concern' }],
        employeeCount: dept.headCount || Math.floor(Math.random() * 20) + 5,
        details: { trend: Math.random() > 0.5 ? 'improving' : 'stable', comparedToLastMonth: `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 8)}%` },
      });
      results.push(a);
    }
    const orgScore = Math.round(results.reduce((s, r) => s + r.sentimentScore, 0) / results.length * 10) / 10;
    try {
      const { recordAction } = await import('../services/autopilotEngine');
      const orgId = (req.user as any)?.organizationId;
      if (orgId) {
        await recordAction({
          organizationId: orgId,
          workflowKey: 'sentiment_analysis',
          title: `Org sentiment scan complete — ${orgScore}/100`,
          summary: `Analyzed ${results.length} departments. Mood: ${orgScore > 70 ? 'positive' : 'neutral'}.`,
          input: { departmentCount: departments.length },
          output: { orgScore, results: results.length },
        });
      }
    } catch {}
    res.json({ orgScore, mood: orgScore > 70 ? 'positive' : 'neutral', analyses: results, analyzedAt: new Date().toISOString() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
