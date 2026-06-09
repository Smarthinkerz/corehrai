import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const buddies = await storage.getAllOnboardingBuddies();
    const employees = await storage.getAllEmployees();
    const enriched = buddies.map(b => ({
      ...b,
      newHireName: employees.find(e => e.id === b.newHireId)?.fullName || 'Unknown',
      newHirePosition: employees.find(e => e.id === b.newHireId)?.position,
      buddyName: employees.find(e => e.id === b.buddyId)?.fullName || 'Unknown',
      buddyPosition: employees.find(e => e.id === b.buddyId)?.position,
      buddyDepartment: employees.find(e => e.id === b.buddyId)?.department,
    }));
    res.json(enriched);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/match', async (req, res) => {
  try {
    const { newHireId } = req.body;
    const newHire = await storage.getEmployee(newHireId);
    if (!newHire) return res.status(404).json({ error: 'New hire not found' });

    const employees = await storage.getAllEmployees();
    const existingBuddies = await storage.getAllOnboardingBuddies();
    const activeBuddyIds = existingBuddies.filter(b => b.status === 'active').map(b => b.buddyId);

    const candidates = employees.filter(e =>
      e.id !== newHireId && e.status === 'active' && !activeBuddyIds.includes(e.id)
    );

    const scored = candidates.map(c => {
      let score = 50;
      const reasons: string[] = [];

      if (c.department === newHire.department) { score += 25; reasons.push('Same department'); }
      if (c.position && newHire.position && c.position !== newHire.position) { score += 10; reasons.push('Different role perspective'); }

      const tenure = c.hireDate ? (Date.now() - new Date(c.hireDate).getTime()) / (365.25 * 86400000) : 0;
      if (tenure > 1) { score += 15; reasons.push(`${Math.round(tenure)} years experience`); }

      score += Math.random() * 10;
      return { employee: c, score: Math.round(Math.min(100, score)), reasons };
    });

    scored.sort((a, b) => b.score - a.score);
    const bestMatch = scored[0];

    if (!bestMatch) return res.status(400).json({ error: 'No suitable buddies available' });

    const buddy = await storage.createOnboardingBuddy({
      newHireId, buddyId: bestMatch.employee.id,
      matchScore: bestMatch.score, matchReasons: bestMatch.reasons,
      status: 'active', startDate: new Date()
    });

    await storage.createNotification({
      userId: bestMatch.employee.userId || 1, title: 'Buddy Assignment',
      message: `You have been matched as an onboarding buddy for ${newHire.fullName}!`,
      type: 'onboarding_buddy', isRead: false, link: '/onboarding-buddies'
    });

    await storage.createActivityLog({ userId: (req.user as any)?.id || 1, action: 'MATCH', description: `Matched buddy ${bestMatch.employee.fullName} with new hire ${newHire.fullName}`, entityType: 'onboarding_buddy', entityId: buddy.id });

    const enriched = {
      ...buddy, newHireName: newHire.fullName, buddyName: bestMatch.employee.fullName,
      buddyPosition: bestMatch.employee.position, buddyDepartment: bestMatch.employee.department,
      topCandidates: scored.slice(0, 5).map(s => ({ name: s.employee.fullName, position: s.employee.position, department: s.employee.department, score: s.score, reasons: s.reasons }))
    };

    res.status(201).json(enriched);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const b = await storage.updateOnboardingBuddy(parseInt(req.params.id), req.body);
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json(b);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deleteOnboardingBuddy(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
