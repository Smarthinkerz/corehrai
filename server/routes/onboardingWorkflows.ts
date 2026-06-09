import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.string().optional(),
  tasks: z.any().optional(),
}).passthrough();

router.get('/templates', async (req, res) => {
  try {
    const templates = await storage.getAllOnboardingTemplates();
    const pagination = parsePagination(req);
    const page = templates.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, templates.length, pagination));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await storage.getOnboardingTemplate(parseInt(req.params.id));
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);
    const template = await storage.createOnboardingTemplate({
      ...data,
      createdBy: (req.user as any)?.id || 1
    });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created onboarding template: ${template.name}`,
      entityType: 'onboarding_template',
      entityId: template.id
    });
    res.status(201).json(template);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const data = templateSchema.partial().parse(req.body);
    const template = await storage.updateOnboardingTemplate(parseInt(req.params.id), data);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await storage.deleteOnboardingTemplate(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates/:id/apply', async (req, res) => {
  try {
    const applySchema = z.object({ employeeId: z.number() });
    const { employeeId } = applySchema.parse(req.body);
    const template = await storage.getOnboardingTemplate(parseInt(req.params.id));
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const tasks = (template.tasks as any[]) || [];
    const created = [];
    for (const task of tasks) {
      const onboardingTask = await storage.createOnboardingTask({
        employeeId,
        taskName: task.name || task.taskName,
        description: task.description || '',
        dueDate: task.daysFromStart ? new Date(Date.now() + task.daysFromStart * 86400000) : null,
        status: 'pending',
        assignedTo: (req.user as any)?.id || 1
      });
      created.push(onboardingTask);
    }

    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'APPLY',
      description: `Applied onboarding template "${template.name}" to employee ${employeeId}`,
      entityType: 'onboarding_template',
      entityId: template.id
    });

    res.json({ success: true, tasksCreated: created.length, tasks: created });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

export default router;
