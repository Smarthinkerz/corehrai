import { Router } from "express";
import { storage } from "../storage";
import { insertCandidateSchema } from "@shared/schema";
import { analyzeCandidateResume, evaluateCandidate, redactResumePII } from "../services/openai";
import { parsePagination, paginatedResponse } from "../middleware/pagination";
import { enforceOrgScope, filterByOrg, stampOrg } from "../middleware/orgEnforce";

const router = Router();

router.use(enforceOrgScope);

router.get('/', async (req, res) => {
  try {
    const allCandidates = await storage.getAllCandidates();
    const candidates = filterByOrg(allCandidates, req.organizationId ?? undefined);
    if (req.query.page) {
      const params = parsePagination(req);
      const paginated = candidates.slice(params.offset, params.offset + params.limit);
      return res.json(paginatedResponse(paginated, candidates.length, params));
    }
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch candidates', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const candidate = await storage.getCandidate(Number(req.params.id));
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (candidate.organizationId != null && candidate.organizationId !== req.organizationId) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch candidate', error: error.message });
  }
});

router.get('/status/:status', async (req, res) => {
  try {
    const all = await storage.getCandidatesByStatus(req.params.status);
    res.json(filterByOrg(all, req.organizationId ?? undefined));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch candidates by status', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const candidateData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone || null,
      position: req.body.position,
      department: req.body.department,
      status: req.body.status || 'new',
      source: req.body.source || null,
      notes: req.body.notes || null,
      resumeUrl: req.body.resumeUrl || null,
      aiScore: req.body.aiScore || null
    };
    const validatedData = insertCandidateSchema.parse(candidateData);
    const candidate = await storage.createCandidate(stampOrg(validatedData, req.organizationId ?? undefined));
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new candidate',
      entityType: 'candidate',
      entityId: candidate.id
    });
    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create candidate', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const candidateId = Number(req.params.id);
    const validatedData = insertCandidateSchema.partial().parse(req.body);
    const updatedCandidate = await storage.updateCandidate(candidateId, validatedData);
    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated candidate details',
      entityType: 'candidate',
      entityId: candidateId
    });
    res.json(updatedCandidate);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update candidate', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const candidateId = Number(req.params.id);
    const validatedData = insertCandidateSchema.partial().parse(req.body);
    const updatedCandidate = await storage.updateCandidate(candidateId, validatedData);
    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: req.body.status
        ? `Changed candidate status to ${req.body.status}`
        : 'Updated candidate details',
      entityType: 'candidate',
      entityId: candidateId
    });
    res.json(updatedCandidate);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update candidate', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const candidateId = Number(req.params.id);
    const deleted = await storage.deleteCandidate(candidateId);
    if (!deleted) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted candidate',
      entityType: 'candidate',
      entityId: candidateId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete candidate', error: error.message });
  }
});

router.post('/analyze-resume', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText) {
      return res.status(400).json({ message: 'Resume text is required' });
    }
    const analysis = await analyzeCandidateResume(resumeText, jobDescription);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to analyze resume', error: error.message });
  }
});

router.post('/redact-resume', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) {
      return res.status(400).json({ message: 'Resume text is required' });
    }
    const result = await redactResumePII(resumeText);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'REDACT',
      description: 'AI resume PII redaction performed',
      entityType: 'candidate',
      entityId: 0
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to redact resume', error: error.message });
  }
});

router.post('/evaluate', async (req, res) => {
  try {
    const candidateId = Number(req.body.candidateId);
    if (!candidateId) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    }
    const candidate = await storage.getCandidate(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    const resumeText = req.body.resumeText || candidate.notes || "";
    const evaluation = await evaluateCandidate({
      fullName: candidate.fullName,
      position: candidate.position,
      department: candidate.department,
      source: candidate.source || undefined,
      notes: candidate.notes || undefined,
      resumeText: resumeText
    });
    const updatedCandidate = await storage.updateCandidate(candidateId, {
      aiScore: evaluation.aiScore
    });
    try {
      const { recordAction } = await import('../services/autopilotEngine');
      const orgId = (req.user as any)?.organizationId;
      if (orgId) {
        await recordAction({
          organizationId: orgId,
          workflowKey: 'resume_screening',
          title: `Scored ${candidate.fullName} for ${candidate.position}`,
          summary: `AI fit score: ${evaluation.aiScore}/100`,
          input: { candidateId, position: candidate.position },
          output: { aiScore: evaluation.aiScore },
          entityType: 'candidate',
          entityId: candidateId,
        });
      }
    } catch {}
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'EVALUATE',
      description: `AI evaluation completed for candidate (score: ${evaluation.aiScore})`,
      entityType: 'candidate',
      entityId: candidateId
    });
    res.json({ evaluation, candidate: updatedCandidate });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to evaluate candidate', error: error.message });
  }
});

export default router;
