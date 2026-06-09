import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const templateSchema = z.object({
  name: z.string().min(1),
  templateType: z.string().min(1).default('general'),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const generateSchema = z.object({
  candidateName: z.string().min(1),
  jobTitle: z.string().min(1),
  templateId: z.number().optional(),
  department: z.string().optional(),
  salary: z.string().optional(),
  startDate: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

router.get('/templates', async (req, res) => {
  try {
    const templates = await storage.getAllOfferLetterTemplates();
    const pagination = parsePagination(req);
    const page = templates.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, templates.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/templates', async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);
    res.status(201).json(await storage.createOfferLetterTemplate({ ...data, createdBy: (req.user as any)?.id || 1 }));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try { await storage.deleteOfferLetterTemplate(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/offers', async (req, res) => {
  try {
    const offers = await storage.getAllGeneratedOffers();
    const pagination = parsePagination(req);
    const page = offers.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, offers.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/generate', async (req, res) => {
  try {
    const data = generateSchema.parse(req.body);
    const { templateId, candidateName, jobTitle, department, salary, startDate, variables } = data;
    let content = '';
    if (templateId) {
      const template = await storage.getOfferLetterTemplate(templateId);
      if (template) {
        content = template.content;
        const vars: Record<string, string> = { candidateName, jobTitle, department: department || '', salary: salary || '', startDate: startDate || '', date: new Date().toLocaleDateString(), ...variables };
        for (const [key, val] of Object.entries(vars)) { content = content.replace(new RegExp(`{{${key}}}`, 'g'), val); }
      }
    }
    if (!content) {
      content = `Dear ${candidateName},\n\nWe are pleased to offer you the position of ${jobTitle}${department ? ` in our ${department} department` : ''}.\n\n${salary ? `Compensation: ${salary} per year\n` : ''}${startDate ? `Start Date: ${startDate}\n` : ''}\nThis offer includes our comprehensive benefits package: health/dental/vision insurance, 401(k) with company match, paid time off, and professional development opportunities.\n\nPlease review and sign this offer within 5 business days.\n\nWe look forward to welcoming you to the team!\n\nBest regards,\nHR Department`;
    }
    const offer = await storage.createGeneratedOffer({ templateId, candidateName, jobTitle, department, salary, startDate, generatedContent: content, variables: variables || {}, status: 'draft', createdBy: (req.user as any)?.id || 1 });
    res.status(201).json(offer);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/offers/:id', async (req, res) => {
  try {
    const o = await storage.updateGeneratedOffer(parseInt(req.params.id), req.body);
    if (!o) return res.status(404).json({ error: 'Not found' });
    res.json(o);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
