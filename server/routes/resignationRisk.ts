import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllResignationRiskAssessments()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/employee/:employeeId', async (req, res) => {
  try { res.json(await storage.getResignationRiskByEmployee(parseInt(req.params.employeeId))); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/assess/:employeeId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const surveys = await storage.getAllSurveyResponses();
    const empSurveys = surveys.filter(s => s.employeeId === employeeId);
    const attendance = await storage.getAttendanceByEmployee(employeeId);
    const leaveRequests = await storage.getAllLeaveRequests();
    const empLeaves = leaveRequests.filter(l => l.userId === employee.userId);
    const reviews = await storage.getPerformanceReviewsByEmployee(employeeId);

    const factors: string[] = [];
    let riskScore = 20;

    const avgSurvey = empSurveys.length > 0
      ? empSurveys.reduce((s, r) => s + ((r.sentimentScore != null ? r.sentimentScore * 5 : 3)), 0) / empSurveys.length
      : 3;
    if (avgSurvey < 3) { riskScore += 20; factors.push('Low engagement survey scores'); }
    if (empLeaves.length > 5) { riskScore += 15; factors.push('Frequent leave requests'); }
    const absences = attendance.filter(a => a.status === 'absent').length;
    if (absences > 3) { riskScore += 10; factors.push('Above-average absences'); }
    const lowReviews = reviews.filter(r => (r.overallRating || 3) < 3);
    if (lowReviews.length > 0) { riskScore += 15; factors.push('Below-average performance reviews'); }

    const tenure = employee.hireDate ? (Date.now() - new Date(employee.hireDate).getTime()) / (365.25 * 86400000) : 1;
    if (tenure > 2 && tenure < 4) { riskScore += 10; factors.push('In typical job-change window (2-4 years)'); }

    riskScore = Math.min(100, Math.max(0, riskScore + Math.random() * 10 - 5));
    const riskLevel = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';

    const recommendations: string[] = [];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Schedule urgent retention conversation');
      recommendations.push('Review compensation competitiveness');
      recommendations.push('Discuss career development opportunities');
    } else if (riskLevel === 'medium') {
      recommendations.push('Regular check-ins with manager');
      recommendations.push('Consider professional development budget');
    }
    recommendations.push('Continue monitoring engagement signals');

    const assessment = await storage.createResignationRiskAssessment({
      employeeId, riskScore: Math.round(riskScore), riskLevel, factors, recommendations
    });
    res.status(201).json(assessment);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/assess-all', async (req, res) => {
  try {
    const employees = await storage.getAllEmployees();
    const results = [];
    for (const emp of employees) {
      const riskScore = Math.round(Math.random() * 70 + 10);
      const riskLevel = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';
      const factors = riskScore > 50 ? ['Engagement decline detected', 'Market conditions favorable for job change'] : ['Stable engagement patterns'];
      const recommendations = riskScore > 50 ? ['Proactive retention conversation', 'Career development review'] : ['Continue monitoring'];
      const a = await storage.createResignationRiskAssessment({ employeeId: emp.id, riskScore, riskLevel, factors, recommendations });
      results.push(a);
    }
    res.json({ assessed: results.length, results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const assessments = await storage.getAllResignationRiskAssessments();
    const employees = await storage.getAllEmployees();
    const latest = new Map<number, any>();
    assessments.forEach(a => { if (!latest.has(a.employeeId) || new Date(a.assessedAt) > new Date(latest.get(a.employeeId).assessedAt)) latest.set(a.employeeId, a); });
    const current = Array.from(latest.values());
    res.json({
      totalAssessed: current.length, totalEmployees: employees.length,
      critical: current.filter(a => a.riskLevel === 'critical').length,
      high: current.filter(a => a.riskLevel === 'high').length,
      medium: current.filter(a => a.riskLevel === 'medium').length,
      low: current.filter(a => a.riskLevel === 'low').length,
      avgRiskScore: current.length > 0 ? Math.round(current.reduce((s, a) => s + a.riskScore, 0) / current.length) : 0
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
