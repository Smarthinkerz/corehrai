import { Router } from "express";
import { storage } from "../storage";
import { insertInterviewSchema } from "@shared/schema";

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const interviews = await storage.getAllInterviews();
    res.json(interviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch interviews', error: error.message });
  }
});

router.get('/scheduled', async (_req, res) => {
  try {
    const interviews = await storage.getScheduledInterviews();
    res.json(interviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch scheduled interviews', error: error.message });
  }
});

router.get('/completed', async (_req, res) => {
  try {
    const interviews = await storage.getCompletedInterviews();
    res.json(interviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch completed interviews', error: error.message });
  }
});

router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const interviews = await storage.getInterviewsByCandidate(Number(req.params.candidateId));
    res.json(interviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch interviews by candidate', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const interview = await storage.getInterview(Number(req.params.id));
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.json(interview);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch interview', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const requestData = { ...req.body };
    if (requestData.date && typeof requestData.date === 'string') {
      requestData.date = new Date(requestData.date);
    }
    if (requestData.scheduledDate && typeof requestData.scheduledDate === 'string') {
      requestData.scheduledDate = new Date(requestData.scheduledDate);
    }
    if (!requestData.status) {
      requestData.status = 'scheduled';
    }
    const validatedData = insertInterviewSchema.parse(requestData);
    const interview = await storage.createInterview(validatedData);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Scheduled interview for candidate #${interview.candidateId}`,
      entityType: 'interview',
      entityId: interview.id
    });
    res.status(201).json(interview);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create interview', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const interviewId = Number(req.params.id);
    const requestData = { ...req.body };
    if (requestData.date && typeof requestData.date === 'string') {
      requestData.date = new Date(requestData.date);
    }
    if (requestData.scheduledDate && typeof requestData.scheduledDate === 'string') {
      requestData.scheduledDate = new Date(requestData.scheduledDate);
    }
    const validatedData = insertInterviewSchema.partial().parse(requestData);
    const updatedInterview = await storage.updateInterview(interviewId, validatedData);
    if (!updatedInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (validatedData.status === 'completed' && validatedData.result) {
      try {
        const candidate = await storage.getCandidate(updatedInterview.candidateId);
        if (candidate) {
          let newStatus = candidate.status;
          let shouldUpdateStatus = true;
          if (validatedData.result === 'pass') {
            newStatus = 'offer';
          } else if (validatedData.result === 'fail') {
            newStatus = 'rejected';
          } else if (validatedData.result === 'move_forward') {
            newStatus = 'next_round';
          } else if (validatedData.result === 'on_hold') {
            newStatus = 'on_hold';
          } else if (validatedData.result === 'needs_follow_up') {
            newStatus = 'follow_up';
          } else {
            shouldUpdateStatus = false;
          }
          if (shouldUpdateStatus && newStatus !== candidate.status) {
            await storage.updateCandidate(candidate.id, { status: newStatus });
          }
        }
      } catch (_candidateError) {
        // Continue even if candidate status update fails
      }
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: `Updated interview for candidate #${updatedInterview.candidateId}`,
      entityType: 'interview',
      entityId: interviewId
    });
    res.json(updatedInterview);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update interview', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const interviewId = Number(req.params.id);
    const interview = await storage.getInterview(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    const deleted = await storage.deleteInterview(interviewId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete interview' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: `Deleted interview for candidate #${interview.candidateId}`,
      entityType: 'interview',
      entityId: interviewId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete interview', error: error.message });
  }
});

export default router;
