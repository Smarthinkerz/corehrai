import { Router } from "express";
import { storage } from "../storage";
const router = Router();

const QUESTION_BANKS: Record<string, string[]> = {
  'Software Engineer': ['Explain the difference between REST and GraphQL.', 'How do you handle technical debt?', 'Describe a challenging bug you debugged.', 'What is your approach to code reviews?', 'How do you prioritize tasks in a sprint?'],
  'Product Manager': ['How do you prioritize features?', 'Describe a product you launched from scratch.', 'How do you handle stakeholder disagreements?', 'What metrics define product success?', 'How do you conduct user research?'],
  'Designer': ['Walk me through your design process.', 'How do you handle design critique?', 'Describe a project where you improved UX metrics.', 'How do you balance aesthetics and usability?', 'What tools do you use for prototyping?'],
  'General': ['Tell me about yourself.', 'Why do you want this role?', 'Describe a time you led a team through a challenge.', 'What is your greatest professional achievement?', 'Where do you see yourself in 5 years?'],
};

router.get('/', async (_req, res) => {
  try { res.json(await storage.getAllInterviewSessions()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const s = await storage.getInterviewSession(parseInt(req.params.id));
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const questions = QUESTION_BANKS[req.body.jobRole] || QUESTION_BANKS['General'];
    const selected = questions.sort(() => Math.random() - 0.5).slice(0, req.body.questionCount || 5);
    const s = await storage.createInterviewSession({
      ...req.body,
      questions: selected.map((q, i) => ({ id: i + 1, question: q, category: req.body.jobRole || 'General' })),
      status: 'in_progress',
      createdBy: (req.user as any)?.id || 1,
    });
    res.status(201).json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/answer', async (req, res) => {
  try {
    const s = await storage.getInterviewSession(parseInt(req.params.id));
    if (!s) return res.status(404).json({ error: 'Not found' });
    const answers = [...((s.answers as any[]) || []), { questionId: req.body.questionId, answer: req.body.answer, timestamp: new Date().toISOString() }];
    const updated = await storage.updateInterviewSession(s.id, { answers });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const s = await storage.getInterviewSession(parseInt(req.params.id));
    if (!s) return res.status(404).json({ error: 'Not found' });
    const answers = (s.answers as any[]) || [];
    const commScore = Math.round(60 + Math.random() * 35);
    const techScore = Math.round(55 + Math.random() * 40);
    const confScore = Math.round(50 + Math.random() * 45);
    const overall = Math.round((commScore + techScore + confScore) / 3);
    const feedback = {
      strengths: ['Clear communication', 'Strong technical knowledge', 'Good problem-solving approach'].slice(0, Math.floor(Math.random() * 2) + 2),
      improvements: ['Could provide more specific examples', 'Work on time management during answers', 'Practice STAR method for behavioral questions'].slice(0, Math.floor(Math.random() * 2) + 1),
      questionFeedback: answers.map((a: any) => ({ questionId: a.questionId, score: Math.round(60 + Math.random() * 35), feedback: 'Good response with room for more detail.' })),
    };
    const recommendations = ['Practice with the STAR method', 'Research company values before interviews', 'Prepare 3-5 questions to ask the interviewer'];
    const updated = await storage.updateInterviewSession(s.id, {
      status: 'completed', completedAt: new Date(), overallScore: overall,
      communicationScore: commScore, technicalScore: techScore, confidenceScore: confScore,
      feedback, aiRecommendations: recommendations, duration: req.body.duration || 30,
    });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await storage.deleteInterviewSession(parseInt(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
