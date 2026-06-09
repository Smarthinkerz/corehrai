import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  department: z.string().optional(),
  requiredSkills: z.any().optional(),
  duration: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

router.get('/projects', async (req, res) => {
  try {
    const projects = await storage.getAllTalentMarketplaceProjects();
    const pagination = parsePagination(req);
    const page = projects.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, projects.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const p = await storage.getTalentMarketplaceProject(parseInt(req.params.id));
    if (!p) return res.status(404).json({ error: 'Not found' });
    const apps = await storage.getTalentMarketplaceApplicationsByProject(p.id);
    const employees = await storage.getAllEmployees();
    const enrichedApps = apps.map(a => {
      const emp = employees.find(e => e.id === a.employeeId);
      return { ...a, employeeName: emp?.fullName || 'Unknown', position: emp?.position };
    });
    res.json({ ...p, applications: enrichedApps });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/projects', async (req, res) => {
  try {
    const data = projectSchema.parse(req.body);
    const p = await storage.createTalentMarketplaceProject({ ...data, createdBy: (req.user as any)?.id || 1 });
    await storage.createActivityLog({ userId: (req.user as any)?.id || 1, action: 'CREATE', description: `Created marketplace project: ${p.title}`, entityType: 'talent_marketplace', entityId: p.id });
    res.status(201).json(p);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const p = await storage.updateTalentMarketplaceProject(parseInt(req.params.id), data);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try { await storage.deleteTalentMarketplaceProject(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/projects/:id/apply', async (req, res) => {
  try {
    const appSchema = z.object({ employeeId: z.number(), coverLetter: z.string().optional() }).passthrough();
    const data = appSchema.parse(req.body);
    const app = await storage.createTalentMarketplaceApplication({
      ...data, projectId: parseInt(req.params.id)
    });
    const project = await storage.getTalentMarketplaceProject(parseInt(req.params.id));
    if (project?.createdBy) {
      await storage.createNotification({ userId: project.createdBy, title: 'New Application', message: `New application for "${project.title}"`, type: 'talent_marketplace', isRead: false, link: '/talent-marketplace' });
    }
    res.status(201).json(app);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/applications/:id', async (req, res) => {
  try {
    const app = await storage.updateTalentMarketplaceApplication(parseInt(req.params.id), req.body);
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
