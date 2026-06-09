import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { parsePagination, paginatedResponse } from "../middleware/pagination";

const router = Router();

const articleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.any().optional(),
  isPublished: z.boolean().optional(),
}).passthrough();

router.get('/', async (req, res) => {
  try {
    const articles = await storage.getAllKnowledgeArticles();
    const pagination = parsePagination(req);
    const page = articles.slice(pagination.offset, pagination.offset + pagination.limit);
    res.json(paginatedResponse(page, articles.length, pagination));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const articles = await storage.getAllKnowledgeArticles();
    const categories = [...new Set(articles.map(a => a.category))];
    const categoryCounts = categories.map(cat => ({
      name: cat,
      count: articles.filter(a => a.category === cat).length
    }));
    res.json(categoryCounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await storage.getKnowledgeArticle(parseInt(req.params.id));
    if (!article) return res.status(404).json({ error: 'Article not found' });
    await storage.updateKnowledgeArticle(article.id, { viewCount: article.viewCount + 1 } as any);
    res.json(article);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const articles = await storage.getKnowledgeArticlesByCategory(req.params.category);
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = articleSchema.parse(req.body);
    const article = await storage.createKnowledgeArticle({
      ...data,
      authorId: (req.user as any)?.id || 1
    });
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'CREATE',
      description: `Created knowledge article: ${article.title}`,
      entityType: 'knowledge_article',
      entityId: article.id
    });
    res.status(201).json(article);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = articleSchema.partial().parse(req.body);
    const article = await storage.updateKnowledgeArticle(parseInt(req.params.id), data);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteKnowledgeArticle(parseInt(req.params.id));
    await storage.createActivityLog({
      userId: (req.user as any)?.id || 1,
      action: 'DELETE',
      description: 'Deleted knowledge article',
      entityType: 'knowledge_article',
      entityId: parseInt(req.params.id)
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
