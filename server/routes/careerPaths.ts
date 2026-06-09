import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllCareerPaths()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/employee/:employeeId', async (req, res) => {
  try { res.json(await storage.getCareerPathsByEmployee(parseInt(req.params.employeeId))); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const path = await storage.createCareerPath(req.body);
    await storage.createActivityLog({ userId: (req.user as any)?.id || 1, action: 'CREATE', description: `Created career path: ${path.currentRole} → ${path.targetRole}`, entityType: 'career_path', entityId: path.id });
    res.status(201).json(path);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const p = await storage.updateCareerPath(parseInt(req.params.id), req.body);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deleteCareerPath(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/generate/:employeeId', async (req, res) => {
  try {
    const employee = await storage.getEmployee(parseInt(req.params.employeeId));
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const { targetRole } = req.body;
    const currentSkills = ['Communication', 'Teamwork', 'Problem Solving'];
    const roleSkillMap: Record<string, string[]> = {
      'Senior Engineer': ['System Design', 'Mentoring', 'Architecture', 'Code Review', 'Technical Writing'],
      'Engineering Manager': ['People Management', 'Strategic Planning', 'Budget Management', 'Stakeholder Management', 'Performance Reviews'],
      'Product Manager': ['Product Strategy', 'User Research', 'Data Analysis', 'Roadmapping', 'Agile Methodology'],
      'Director': ['Executive Presence', 'Organizational Design', 'P&L Management', 'Board Presentations', 'Talent Development'],
      'Team Lead': ['Project Management', 'Conflict Resolution', 'Technical Leadership', 'Sprint Planning', 'Team Building'],
    };

    const requiredSkills = roleSkillMap[targetRole] || ['Leadership', 'Strategy', 'Domain Expertise', 'Management', 'Innovation'];
    const skillGaps = requiredSkills.filter(s => !currentSkills.includes(s));
    const milestones = skillGaps.map((skill, i) => ({
      skill, status: 'pending', targetDate: new Date(Date.now() + (i + 1) * 90 * 86400000).toISOString(),
      resources: [`${skill} training course`, `${skill} mentorship program`]
    }));

    const path = await storage.createCareerPath({
      employeeId: employee.id, currentRole: employee.position, targetRole,
      currentSkills, requiredSkills, skillGaps, milestones,
      progress: 0, estimatedTimeMonths: skillGaps.length * 3, status: 'active'
    });

    res.status(201).json(path);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
