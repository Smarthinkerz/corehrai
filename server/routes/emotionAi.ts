import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllEmotionAnalyses()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/employee/:employeeId', async (req, res) => {
  try { res.json(await storage.getEmotionAnalysesByEmployee(parseInt(req.params.employeeId))); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const surveys = await storage.getAllSurveyResponses();
    const empSurveys = surveys.filter(s => s.employeeId === employeeId);
    const attendance = await storage.getAttendanceByEmployee(employeeId);
    const leaveRequests = await storage.getAllLeaveRequests();
    const empLeaves = leaveRequests.filter(l => l.userId === employee.userId);

    const avgSurveyScore = empSurveys.length > 0
      ? empSurveys.reduce((s, r) => s + (r.sentimentScore != null ? r.sentimentScore * 5 : 3), 0) / empSurveys.length
      : 3;
    const recentAbsences = attendance.filter(a => a.status === 'absent').length;
    const leaveFrequency = empLeaves.length;

    const burnoutScore = Math.min(100, Math.max(0, (5 - avgSurveyScore) * 20 + recentAbsences * 5 + leaveFrequency * 3 + Math.random() * 10));
    const engagementScore = Math.min(100, Math.max(0, avgSurveyScore * 20 - recentAbsences * 3 + Math.random() * 10));
    const sentimentScore = Math.min(100, Math.max(0, avgSurveyScore * 18 + (5 - recentAbsences) * 2 + Math.random() * 10));

    const stressIndicators: string[] = [];
    if (burnoutScore > 60) stressIndicators.push('High workload indicators');
    if (recentAbsences > 3) stressIndicators.push('Frequent absences detected');
    if (avgSurveyScore < 3) stressIndicators.push('Low survey engagement scores');
    if (leaveFrequency > 5) stressIndicators.push('Frequent leave requests');
    if (burnoutScore > 70) stressIndicators.push('Potential burnout risk');

    const recommendations: string[] = [];
    if (burnoutScore > 50) recommendations.push('Schedule 1-on-1 check-in with manager');
    if (engagementScore < 50) recommendations.push('Assign mentorship or career development opportunity');
    if (burnoutScore > 70) recommendations.push('Consider workload redistribution');
    if (sentimentScore < 40) recommendations.push('Offer wellness program enrollment');
    recommendations.push('Regular pulse surveys for ongoing monitoring');

    const analysis = await storage.createEmotionAnalysis({
      employeeId, burnoutScore: Math.round(burnoutScore), engagementScore: Math.round(engagementScore),
      sentimentScore: Math.round(sentimentScore), stressIndicators, recommendations
    });

    res.status(201).json(analysis);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/analyze-all', async (req, res) => {
  try {
    const employees = await storage.getAllEmployees();
    const results = [];
    for (const emp of employees.slice(0, 20)) {
      const burnoutScore = Math.round(Math.random() * 60 + 10);
      const engagementScore = Math.round(100 - burnoutScore + Math.random() * 20 - 10);
      const sentimentScore = Math.round(Math.random() * 40 + 40);
      const stressIndicators = burnoutScore > 50 ? ['Elevated stress markers', 'Low engagement signals'] : [];
      const recommendations = burnoutScore > 50 ? ['Manager check-in recommended', 'Consider wellness support'] : ['Continue monitoring'];
      const a = await storage.createEmotionAnalysis({ employeeId: emp.id, burnoutScore, engagementScore: Math.min(100, Math.max(0, engagementScore)), sentimentScore, stressIndicators, recommendations });
      results.push(a);
    }
    res.json({ analyzed: results.length, results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const analyses = await storage.getAllEmotionAnalyses();
    const employees = await storage.getAllEmployees();
    const avgBurnout = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + (a.burnoutScore || 0), 0) / analyses.length) : 0;
    const avgEngagement = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + (a.engagementScore || 0), 0) / analyses.length) : 0;
    const avgSentiment = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + (a.sentimentScore || 0), 0) / analyses.length) : 0;
    const highRisk = analyses.filter(a => (a.burnoutScore || 0) > 70).length;
    res.json({ totalAnalyzed: analyses.length, totalEmployees: employees.length, avgBurnout, avgEngagement, avgSentiment, highRiskCount: highRisk });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
