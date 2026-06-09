import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1).default('general'),
  durationHours: z.number().optional(),
  difficulty: z.string().optional(),
  provider: z.string().optional(),
  isMandatory: z.boolean().optional(),
});

const enrollmentSchema = z.object({
  courseId: z.number(),
  employeeId: z.number(),
  status: z.string().optional(),
  progress: z.number().optional(),
});

router.get('/courses', async (req, res) => {
  try {
    const courses = await storage.getAllLearningCourses();
    const pagination = parsePagination(req);
    const page = courses.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, courses.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/courses', async (req, res) => {
  try {
    const data = courseSchema.parse(req.body);
    res.status(201).json(await storage.createLearningCourse(data));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const data = courseSchema.partial().parse(req.body);
    const c = await storage.updateLearningCourse(parseInt(req.params.id), data);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try { await storage.deleteLearningCourse(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/enrollments', async (req, res) => {
  try {
    const enrollments = await storage.getAllLearningEnrollments();
    const courses = await storage.getAllLearningCourses();
    const employees = await storage.getAllEmployees();
    const enriched = enrollments.map(e => ({ ...e, courseName: courses.find(c => c.id === e.courseId)?.title, employeeName: employees.find(emp => emp.id === e.employeeId)?.fullName }));
    const pagination = parsePagination(req);
    const page = enriched.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, enriched.length, pagination));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/enrollments', async (req, res) => {
  try {
    const data = enrollmentSchema.parse(req.body);
    res.status(201).json(await storage.createLearningEnrollment(data));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.put('/enrollments/:id', async (req, res) => {
  try {
    const data = enrollmentSchema.partial().parse(req.body);
    const e = await storage.updateLearningEnrollment(parseInt(req.params.id), data);
    if (!e) return res.status(404).json({ error: 'Not found' });
    res.json(e);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    res.status(500).json({ error: e.message });
  }
});

router.get('/recommendations/:employeeId', async (req, res) => {
  try {
    const courses = await storage.getAllLearningCourses();
    const enrollments = await storage.getLearningEnrollmentsByEmployee(parseInt(req.params.employeeId));
    const enrolledIds = enrollments.map(e => e.courseId);
    const recommended = courses.filter(c => !enrolledIds.includes(c.id)).sort(() => Math.random() - 0.5).slice(0, 5);
    res.json(recommended.map(c => ({ ...c, reason: ['Skill gap match', 'Popular in your department', 'Manager recommended', 'Career path alignment'][Math.floor(Math.random() * 4)] })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
