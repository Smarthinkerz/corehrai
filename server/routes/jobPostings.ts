import { Router } from "express";
import { storage } from "../storage";
import { insertJobPostingSchema } from "@shared/schema";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const jobPostings = await storage.getAllJobPostings();
    if (!jobPostings) {
      return res.json([]);
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(jobPostings);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch job postings', error: error.message });
  }
});

router.get('/active', async (_req, res) => {
  try {
    const activeJobPostings = await storage.getActiveJobPostings();
    res.json(activeJobPostings);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch active job postings', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const jobPosting = await storage.getJobPosting(Number(req.params.id));
    if (!jobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }
    res.json(jobPosting);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch job posting', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const requestData = { ...req.body };
    const validatedData = insertJobPostingSchema.parse(requestData);
    const jobPosting = await storage.createJobPosting(validatedData);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new job posting',
      entityType: 'job-posting',
      entityId: jobPosting.id
    });
    res.status(201).json(jobPosting);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create job posting', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const jobPostingId = Number(req.params.id);
    const validatedData = insertJobPostingSchema.partial().parse(req.body);
    const updatedJobPosting = await storage.updateJobPosting(jobPostingId, validatedData);
    if (!updatedJobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated job posting details',
      entityType: 'job-posting',
      entityId: jobPostingId
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(updatedJobPosting);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update job posting', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const jobPostingId = Number(req.params.id);
    const validatedData = insertJobPostingSchema.partial().parse(req.body);
    const updatedJobPosting = await storage.updateJobPosting(jobPostingId, validatedData);
    if (!updatedJobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated job posting details',
      entityType: 'job-posting',
      entityId: jobPostingId
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(updatedJobPosting);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update job posting', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const jobPostingId = Number(req.params.id);
    if (isNaN(jobPostingId)) {
      return res.status(400).json({ message: 'Invalid job posting ID' });
    }
    const deleted = await storage.deleteJobPosting(jobPostingId);
    if (!deleted) {
      return res.status(404).json({ message: 'Job posting not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted job posting',
      entityType: 'job-posting',
      entityId: jobPostingId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete job posting', error: error.message });
  }
});

export default router;
