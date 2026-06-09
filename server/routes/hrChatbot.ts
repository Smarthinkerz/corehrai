import { Router } from "express";
import { storage } from "../storage";
const router = Router();

const KB_ANSWERS: Record<string, string> = {
  'vacation': 'Full-time employees receive 15 days of paid vacation per year, accruing at 1.25 days per month. After 5 years, this increases to 20 days.',
  'sick': 'You have 10 paid sick days per year. Unused sick days do not carry over. For extended illness, contact HR about FMLA options.',
  'benefits': 'Our benefits package includes health/dental/vision insurance, 401(k) with 4% match, life insurance, and an Employee Assistance Program.',
  'remote': 'We offer a hybrid work model. Employees can work remotely up to 3 days per week with manager approval.',
  'parental': 'We offer 12 weeks of paid parental leave for all new parents, regardless of gender.',
  'expenses': 'Submit expense reports through the self-service portal within 30 days. Receipts required for amounts over $25.',
  'review': 'Performance reviews are conducted semi-annually in June and December. Your manager will schedule a 1:1 meeting.',
  'salary': 'Compensation reviews happen annually in January. Raises are based on performance, market data, and company budget.',
};

router.get('/conversations', async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 1;
    res.json(await storage.getChatbotConversationsByUser(userId));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const c = await storage.getChatbotConversation(parseInt(req.params.id));
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/ask', async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    const userId = (req.user as any)?.id || 1;
    const q = question.toLowerCase();
    let answer = 'I\'m not sure about that. Let me connect you with an HR representative who can help. You can also check the Knowledge Base for more information.';
    for (const [key, val] of Object.entries(KB_ANSWERS)) {
      if (q.includes(key)) { answer = val; break; }
    }

    const articles = await storage.getAllKnowledgeArticles();
    const relevant = articles.filter(a => q.split(' ').some((w: string) => a.title.toLowerCase().includes(w) || a.content.toLowerCase().includes(w)));
    if (relevant.length > 0 && answer.includes('not sure')) {
      answer = `Based on our knowledge base: ${relevant[0].content.slice(0, 300)}...`;
    }

    const userMsg = { role: 'user', content: question, timestamp: new Date().toISOString() };
    const botMsg = { role: 'assistant', content: answer, timestamp: new Date().toISOString(), sources: relevant.slice(0, 2).map(a => ({ id: a.id, title: a.title })) };

    let conversation;
    if (conversationId) {
      const existing = await storage.getChatbotConversation(conversationId);
      if (existing) {
        const messages = [...((existing.messages as any[]) || []), userMsg, botMsg];
        conversation = await storage.updateChatbotConversation(existing.id, { messages });
      }
    }
    if (!conversation) {
      conversation = await storage.createChatbotConversation({ userId, messages: [userMsg, botMsg] });
    }

    res.json({ answer, conversation, relatedArticles: relevant.slice(0, 3) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/articles', async (_req, res) => {
  try { res.json(await storage.getAllKnowledgeArticles()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/articles', async (req, res) => {
  try {
    const a = await storage.createKnowledgeArticle({ ...req.body, createdBy: (req.user as any)?.id || 1 });
    res.status(201).json(a);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
