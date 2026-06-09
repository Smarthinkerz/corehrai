import { Router } from "express";
import { storage } from "../storage";
import { insertWellnessProgramSchema, insertWellnessEnrollmentSchema, insertWellnessMetricSchema } from "@shared/schema";

const router = Router();

router.get('/wellness-programs', async (_req, res) => {
  try {
    const programs = await storage.getAllWellnessPrograms();
    res.json(programs);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness programs', error: error.message });
  }
});

router.get('/wellness-programs/:id', async (req, res) => {
  try {
    const program = await storage.getWellnessProgram(Number(req.params.id));
    if (!program) {
      return res.status(404).json({ message: 'Wellness program not found' });
    }
    res.json(program);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness program', error: error.message });
  }
});

router.post('/wellness-programs', async (req, res) => {
  try {
    const requestData = { ...req.body };
    if (requestData.startDate && typeof requestData.startDate === 'string') {
      requestData.startDate = new Date(requestData.startDate);
    }
    if (requestData.endDate && typeof requestData.endDate === 'string') {
      requestData.endDate = new Date(requestData.endDate);
    }
    const validatedData = insertWellnessProgramSchema.parse(requestData);
    const program = await storage.createWellnessProgram(validatedData);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created wellness program: ${program.title}`,
      entityType: 'wellnessprogram',
      entityId: program.id
    });
    res.status(201).json(program);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create wellness program', error: error.message });
  }
});

router.put('/wellness-programs/:id', async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const requestData = { ...req.body };
    if (requestData.startDate && typeof requestData.startDate === 'string') {
      requestData.startDate = new Date(requestData.startDate);
    }
    if (requestData.endDate && typeof requestData.endDate === 'string') {
      requestData.endDate = new Date(requestData.endDate);
    }
    const validatedData = insertWellnessProgramSchema.partial().parse(requestData);
    const updatedProgram = await storage.updateWellnessProgram(programId, validatedData);
    if (!updatedProgram) {
      return res.status(404).json({ message: 'Wellness program not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: `Updated wellness program: ${updatedProgram.title}`,
      entityType: 'wellnessprogram',
      entityId: programId
    });
    res.json(updatedProgram);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update wellness program', error: error.message });
  }
});

router.patch('/wellness-programs/:id', async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const requestData = { ...req.body };
    if (requestData.startDate && typeof requestData.startDate === 'string') {
      requestData.startDate = new Date(requestData.startDate);
    }
    if (requestData.endDate && typeof requestData.endDate === 'string') {
      requestData.endDate = new Date(requestData.endDate);
    }
    const validatedData = insertWellnessProgramSchema.partial().parse(requestData);
    const updatedProgram = await storage.updateWellnessProgram(programId, validatedData);
    if (!updatedProgram) {
      return res.status(404).json({ message: 'Wellness program not found' });
    }
    res.json(updatedProgram);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update wellness program', error: error.message });
  }
});

router.delete('/wellness-programs/:id', async (req, res) => {
  try {
    const programId = Number(req.params.id);
    const deleted = await storage.deleteWellnessProgram(programId);
    if (!deleted) {
      return res.status(404).json({ message: 'Wellness program not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted wellness program',
      entityType: 'wellnessprogram',
      entityId: programId
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete wellness program', error: error.message });
  }
});

router.get('/wellness-enrollments', async (_req, res) => {
  try {
    const enrollments = await storage.getAllWellnessEnrollments();
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness enrollments', error: error.message });
  }
});

router.get('/wellness-enrollments/program/:programId', async (req, res) => {
  try {
    const enrollments = await storage.getWellnessEnrollmentsByProgram(Number(req.params.programId));
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness enrollments by program', error: error.message });
  }
});

router.get('/wellness-enrollments/employee/:employeeId', async (req, res) => {
  try {
    const enrollments = await storage.getWellnessEnrollmentsByEmployee(Number(req.params.employeeId));
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness enrollments by employee', error: error.message });
  }
});

router.post('/wellness-enrollments', async (req, res) => {
  try {
    const validatedData = insertWellnessEnrollmentSchema.parse(req.body);
    const enrollment = await storage.createWellnessEnrollment(validatedData);
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: 'Created new wellness program enrollment',
      entityType: 'wellnessenrollment',
      entityId: enrollment.id
    });
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create wellness enrollment', error: error.message });
  }
});

router.put('/wellness-enrollments/:id', async (req, res) => {
  try {
    const enrollmentId = Number(req.params.id);
    const requestData = { ...req.body };
    if (requestData.completionDate && typeof requestData.completionDate === 'string') {
      requestData.completionDate = new Date(requestData.completionDate);
    }
    const validatedData = insertWellnessEnrollmentSchema.partial().parse(requestData);
    const updatedEnrollment = await storage.updateWellnessEnrollment(enrollmentId, validatedData);
    if (!updatedEnrollment) {
      return res.status(404).json({ message: 'Wellness enrollment not found' });
    }
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'UPDATE',
      description: 'Updated wellness program enrollment',
      entityType: 'wellnessenrollment',
      entityId: enrollmentId
    });
    res.json(updatedEnrollment);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update wellness enrollment', error: error.message });
  }
});

router.get('/wellness-metrics', async (_req, res) => {
  try {
    const metrics = await storage.getAllWellnessMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness metrics', error: error.message });
  }
});

router.get('/wellness-metrics/employee/:employeeId', async (req, res) => {
  try {
    const metrics = await storage.getWellnessMetricsByEmployee(Number(req.params.employeeId));
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch wellness metrics by employee', error: error.message });
  }
});

router.post('/wellness-metrics', async (req, res) => {
  try {
    const validatedData = insertWellnessMetricSchema.parse(req.body);
    const metric = await storage.createWellnessMetric(validatedData);
    res.status(201).json(metric);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create wellness metric', error: error.message });
  }
});

export default router;
