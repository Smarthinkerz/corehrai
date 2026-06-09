import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllPolicyComplianceChecks()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const c = await storage.getPolicyComplianceCheck(parseInt(req.params.id));
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/scan', async (req, res) => {
  try {
    const { documentName, documentType, content } = req.body;
    const policyKeywords = {
      'confidentiality': ['confidential', 'proprietary', 'trade secret', 'non-disclosure'],
      'harassment': ['harassment', 'discrimination', 'hostile', 'inappropriate'],
      'safety': ['safety', 'hazard', 'emergency', 'protective equipment'],
      'data_privacy': ['personal data', 'gdpr', 'privacy', 'data protection', 'pii'],
      'conduct': ['professional conduct', 'ethics', 'conflict of interest', 'bribery'],
      'leave_policy': ['sick leave', 'vacation', 'pto', 'time off', 'absence']
    };

    const violations: any[] = [];
    const suggestions: any[] = [];
    const contentLower = (content || '').toLowerCase();
    let complianceScore = 100;

    Object.entries(policyKeywords).forEach(([policy, keywords]) => {
      const found = keywords.filter(k => contentLower.includes(k));
      if (found.length === 0 && ['confidentiality', 'data_privacy', 'conduct'].includes(policy)) {
        violations.push({ policy, severity: 'warning', message: `Missing ${policy.replace('_', ' ')} references`, keywords: keywords.slice(0, 3) });
        complianceScore -= 5;
      }
    });

    if (contentLower.includes('password') && !contentLower.includes('secure')) {
      violations.push({ policy: 'security', severity: 'high', message: 'Password mentioned without security context' });
      complianceScore -= 15;
    }
    if (contentLower.length < 100) {
      violations.push({ policy: 'completeness', severity: 'medium', message: 'Document appears too brief for adequate policy coverage' });
      complianceScore -= 10;
    }

    suggestions.push('Ensure all regulatory references are up to date');
    if (violations.length > 0) suggestions.push('Address identified violations before distribution');
    suggestions.push('Have legal team review before final approval');

    complianceScore = Math.max(0, Math.min(100, complianceScore));

    const check = await storage.createPolicyComplianceCheck({
      documentName, documentType, content, complianceScore, violations, suggestions,
      status: violations.some(v => v.severity === 'high') ? 'failed' : violations.length > 0 ? 'warnings' : 'passed',
      checkedBy: (req.user as any)?.id || 1
    });

    await storage.createActivityLog({ userId: (req.user as any)?.id || 1, action: 'SCAN', description: `Policy compliance scan: ${documentName}`, entityType: 'policy_compliance', entityId: check.id });
    res.status(201).json(check);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deletePolicyComplianceCheck(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
