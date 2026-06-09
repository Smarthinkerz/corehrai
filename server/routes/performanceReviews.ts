import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const reviewSchema = z.object({
  employeeId: z.number(),
  period: z.string().min(1),
  overallRating: z.number().optional(),
  goals: z.any().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  comments: z.string().optional(),
  status: z.string().optional(),
});

const reviewUpdateSchema = reviewSchema.partial();

router.get('/', async (req, res) => {
  try {
    const reviews = await storage.getAllPerformanceReviews();
    const params = parsePagination(req);
    const paginated = reviews.slice(params.offset, params.offset + params.limit);
    res.json(paginatedResponse(paginated, reviews.length, params));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const review = await storage.getPerformanceReview(parseInt(req.params.id));
    if (!review) return res.status(404).json({ error: 'Review not found' });
    const feedback = await storage.getReviewFeedbackByReview(review.id);
    res.json({ ...review, feedback });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const reviews = await storage.getPerformanceReviewsByEmployee(parseInt(req.params.employeeId));
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = reviewSchema.parse(req.body);
    const review = await storage.createPerformanceReview({
      ...data,
      reviewerId: (req.user as any)?.id || 1
    });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created performance review for employee ${review.employeeId}`,
      entityType: 'performance_review',
      entityId: review.id
    });
    res.status(201).json(review);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = reviewUpdateSchema.parse(req.body);
    const review = await storage.updatePerformanceReview(parseInt(req.params.id), data);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await storage.deletePerformanceReview(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/feedback', async (req, res) => {
  try {
    const feedbackSchema = z.object({
      rating: z.number().optional(),
      feedback: z.string().optional(),
      relationship: z.string().min(1).default('peer'),
    });
    const data = feedbackSchema.parse(req.body);
    const feedback = await storage.createReviewFeedback({
      ...data,
      reviewId: parseInt(req.params.id),
      feedbackFrom: (req.user as any)?.id || 1
    });
    res.status(201).json(feedback);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/feedback', async (req, res) => {
  try {
    const feedback = await storage.getReviewFeedbackByReview(parseInt(req.params.id));
    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
