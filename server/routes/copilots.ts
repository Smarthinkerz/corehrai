import { Router } from "express";
import { db } from "../db";
import { copilotConversations } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { storage } from "../storage";
import OpenAI from "openai";
import { z } from "zod";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-5.4-mini";
const MODEL_PRO = "gpt-5.5";

type CopilotKey = "chro" | "manager" | "recruiter" | "employee" | "strategy" | "learning" | "compliance";

interface CopilotDef {
  key: CopilotKey;
  name: string;
  title: string;
  tagline: string;
  icon: string;
  accent: string;
  model: string;
  systemPrompt: string;
  contextBuilder: () => Promise<string>;
  starters: string[];
}

async function workforceContext(): Promise<string> {
  const [emps, depts, risks, sents, openRoles] = await Promise.all([
    storage.getAllEmployees().catch(() => []),
    storage.getAllDepartments().catch(() => []),
    storage.getAllResignationRiskAssessments().catch(() => []),
    storage.getAllSentimentAnalyses2().catch(() => []),
    storage.getAllJobPostings().catch(() => []),
  ]);
  const critical = risks.filter(r => r.riskLevel === "critical").length;
  const high = risks.filter(r => r.riskLevel === "high").length;
  const avgSent = sents.length > 0 ? (sents.reduce((s, r) => s + (r.sentimentScore || 0), 0) / sents.length).toFixed(1) : "n/a";
  const open = openRoles.filter(j => j.status === "active").length;
  return `Org snapshot: ${emps.length} employees across ${depts.length} departments. ${critical} critical resignation risks, ${high} high. Avg sentiment ${avgSent}/100. ${open} open roles.`;
}

async function recruiterContext(): Promise<string> {
  const [cands, jobs, interviews] = await Promise.all([
    storage.getAllCandidates().catch(() => []),
    storage.getAllJobPostings().catch(() => []),
    storage.getAllInterviews().catch(() => []),
  ]);
  return `Recruiting snapshot: ${cands.length} candidates in pipeline (${cands.filter(c => c.status === "interview").length} in interview, ${cands.filter(c => c.status === "offer").length} in offer). ${jobs.filter(j => j.status === "active").length} active job postings. ${interviews.filter(i => i.status === "scheduled").length} interviews scheduled.`;
}

async function complianceContext(): Promise<string> {
  const [docs, audit] = await Promise.all([
    storage.getAllDocuments().catch(() => []),
    storage.getAllActivityLogs().catch(() => []),
  ]);
  const recent = audit.slice(0, 10).map(a => a.action).join(", ");
  return `Compliance snapshot: ${docs.length} documents on file. Recent audit actions: ${recent || "none"}.`;
}

async function learningContext(): Promise<string> {
  return `Learning snapshot available via storage. Focus on skills gaps, role-based learning paths, and certification deadlines.`;
}

async function employeeContext(): Promise<string> {
  return `Employee self-service context: leave balances, payslips, benefits, policies, time-off requests, expense reports.`;
}

const COPILOTS: Record<CopilotKey, CopilotDef> = {
  chro: {
    key: "chro",
    name: "CHRO Copilot",
    title: "Chief Human Resources Officer",
    tagline: "Strategic workforce intelligence for the C-suite",
    icon: "Crown",
    accent: "from-violet-500 via-purple-500 to-fuchsia-500",
    model: MODEL_PRO,
    systemPrompt: `You are the CHRO Copilot for CoreHR AI, a senior workforce strategist advising the Chief Human Resources Officer of a modern enterprise. You speak with executive precision: data-driven, decisive, forward-looking. You use the live workforce snapshot to ground every recommendation. Never invent numbers. When you make a recommendation, structure it as: Insight → Risk → Recommended Action → Expected Impact. Maximum 250 words per response unless the user asks for more depth.`,
    contextBuilder: workforceContext,
    starters: [
      "What's our biggest retention risk this quarter?",
      "Draft a board update on workforce health.",
      "Where should I invest my next $500K in HR?",
      "Compare engagement vs productivity by department.",
    ],
  },
  manager: {
    key: "manager",
    name: "Manager Copilot",
    title: "People Manager",
    tagline: "Coaching and team operations on demand",
    icon: "Users",
    accent: "from-blue-500 via-cyan-500 to-sky-500",
    model: MODEL,
    systemPrompt: `You are the Manager Copilot for CoreHR AI, helping people-managers run effective teams. You give practical, empathetic, action-oriented advice. You can help draft 1:1 agendas, performance feedback, recognition messages, PIP plans, hiring requests, team rituals, and conflict-resolution scripts. Always assume the manager is busy — give crisp checklists and ready-to-send drafts. Maximum 200 words unless asked for more.`,
    contextBuilder: workforceContext,
    starters: [
      "Help me prep for a tough 1:1 about underperformance.",
      "Draft a recognition message for a team milestone.",
      "Write a PIP for an engineer missing deadlines.",
      "Suggest a team ritual to boost morale.",
    ],
  },
  recruiter: {
    key: "recruiter",
    name: "Recruiter Copilot",
    title: "Talent Acquisition Specialist",
    tagline: "Source, screen, and close faster",
    icon: "Search",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    model: MODEL,
    systemPrompt: `You are the Recruiter Copilot for CoreHR AI, an expert talent acquisition partner. You help draft job descriptions, screening questions, outbound messages, interview rubrics, candidate evaluations, offer negotiation scripts, and Boolean sourcing strings. Be specific about role, level, and market. Never create biased screening criteria. Maximum 200 words unless asked for more.`,
    contextBuilder: recruiterContext,
    starters: [
      "Write a JD for a Senior Backend Engineer (remote, $180K-$220K).",
      "Draft an outbound message to a passive Staff Designer.",
      "Build a structured rubric for a VP Sales interview.",
      "Suggest 5 Boolean strings to source DevOps in Berlin.",
    ],
  },
  employee: {
    key: "employee",
    name: "Employee Copilot",
    title: "Personal HR Assistant",
    tagline: "Your private guide to benefits, leave, and policy",
    icon: "User",
    accent: "from-pink-500 via-rose-500 to-orange-500",
    model: MODEL,
    systemPrompt: `You are the Employee Copilot for CoreHR AI, a friendly, confidential personal HR assistant for individual employees. You answer questions about leave, payroll, benefits, expense policies, learning opportunities, and career growth. You are warm, supportive, and concise. If a question requires accessing private personal data you don't have, tell the user how to find it in the app (e.g. "Open Self-Service > Leave"). Never give legal advice — escalate to HR. Maximum 150 words.`,
    contextBuilder: employeeContext,
    starters: [
      "How do I apply for parental leave?",
      "What's our remote work policy?",
      "How do I submit a wellness expense?",
      "Can I see my career growth options?",
    ],
  },
  strategy: {
    key: "strategy",
    name: "Strategy Copilot",
    title: "Workforce Strategist",
    tagline: "Plan moves, restructures, and growth",
    icon: "Target",
    accent: "from-amber-500 via-orange-500 to-red-500",
    model: MODEL_PRO,
    systemPrompt: `You are the Strategy Copilot for CoreHR AI, an organizational design and workforce planning expert. You help leaders model headcount plans, restructures, M&A people-integration, geographic expansion, and skills strategy. Use the live workforce snapshot. Always quantify your recommendations (cost, timeline, risk) and surface trade-offs. Maximum 250 words.`,
    contextBuilder: workforceContext,
    starters: [
      "Model a 25% engineering headcount expansion in Q3.",
      "What if we consolidate Sales and Marketing?",
      "Plan a 3-year skills strategy for AI/ML.",
      "Where should we open our next office?",
    ],
  },
  learning: {
    key: "learning",
    name: "Learning Copilot",
    title: "Learning & Development Lead",
    tagline: "Personalized growth paths and skills development",
    icon: "GraduationCap",
    accent: "from-indigo-500 via-blue-500 to-purple-500",
    model: MODEL,
    systemPrompt: `You are the Learning Copilot for CoreHR AI, an L&D specialist who designs personalized learning paths, skill gap analyses, certification roadmaps, and training programs. You suggest concrete courses (specify provider when possible), set realistic timelines, and tie learning to business outcomes. Maximum 200 words.`,
    contextBuilder: learningContext,
    starters: [
      "Build a 6-month learning path for a junior PM → senior PM.",
      "What skills should our engineers learn for AI readiness?",
      "Design a leadership academy for new managers.",
      "Recommend certifications for our cybersecurity team.",
    ],
  },
  compliance: {
    key: "compliance",
    name: "Compliance Copilot",
    title: "Compliance & Policy Officer",
    tagline: "Keep the organization audit-ready",
    icon: "Shield",
    accent: "from-slate-600 via-zinc-600 to-stone-700",
    model: MODEL_PRO,
    systemPrompt: `You are the Compliance Copilot for CoreHR AI, an employment law and HR compliance expert. You help draft policies (parental leave, code of conduct, AI use, remote work), audit current policies, summarize regulatory changes (EEOC, GDPR, CCPA, NLRA, SOX), and identify compliance risks. CRITICAL: You always include the disclaimer "This is informational guidance only and is not legal advice. Consult licensed counsel before acting." Maximum 250 words.`,
    contextBuilder: complianceContext,
    starters: [
      "Draft an AI Acceptable Use policy for employees.",
      "Audit our parental leave policy for US compliance.",
      "Summarize 2026 EEOC guidance on AI hiring.",
      "What documents should we retain after termination?",
    ],
  },
};

// GET /api/copilots — list all copilots
router.get("/", (_req, res) => {
  const list = Object.values(COPILOTS).map(c => ({
    key: c.key, name: c.name, title: c.title, tagline: c.tagline,
    icon: c.icon, accent: c.accent, starters: c.starters,
  }));
  res.json(list);
});

// GET /api/copilots/:key/conversations
router.get("/:key/conversations", async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const key = req.params.key as CopilotKey;
    if (!COPILOTS[key]) return res.status(404).json({ error: "unknown copilot" });
    const rows = await db.select().from(copilotConversations)
      .where(and(eq(copilotConversations.userId, userId), eq(copilotConversations.copilotKey, key)))
      .orderBy(desc(copilotConversations.updatedAt));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/copilots/conversations/:id
router.get("/conversations/:id", async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(copilotConversations).where(eq(copilotConversations.id, id));
    if (!row || row.userId !== userId) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/copilots/conversations/:id
router.delete("/conversations/:id", async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(copilotConversations).where(eq(copilotConversations.id, id));
    if (!row || row.userId !== userId) return res.status(404).json({ error: "not found" });
    await db.delete(copilotConversations).where(eq(copilotConversations.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/copilots/:key/chat  { message, conversationId? }
const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  conversationId: z.number().optional(),
});

router.post("/:key/chat", async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const key = req.params.key as CopilotKey;
    const copilot = COPILOTS[key];
    if (!copilot) return res.status(404).json({ error: "unknown copilot" });

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const { message, conversationId } = parsed.data;

    let convo: any = null;
    if (conversationId) {
      const [row] = await db.select().from(copilotConversations).where(eq(copilotConversations.id, conversationId));
      if (row && row.userId === userId && row.copilotKey === key) convo = row;
    }
    if (!convo) {
      const title = message.slice(0, 60) + (message.length > 60 ? "…" : "");
      const [created] = await db.insert(copilotConversations).values({
        userId, copilotKey: key, title, messages: [],
      }).returning();
      convo = created;
    }

    const history = (convo.messages as any[]) || [];
    const userMsg = { role: "user", content: message, ts: new Date().toISOString() };

    const liveContext = await copilot.contextBuilder().catch(() => "");

    const messages: any[] = [
      { role: "system", content: copilot.systemPrompt + (liveContext ? `\n\nLIVE CONTEXT (use this data, don't fabricate):\n${liveContext}` : "") },
      ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let answer = "";
    try {
      const completion = await openai.chat.completions.create({
        model: copilot.model,
        messages,
      });
      answer = completion.choices[0]?.message?.content?.trim() || "I couldn't generate a response.";
    } catch (e: any) {
      console.error(`[copilot:${key}] OpenAI error`, e?.message);
      answer = `I'm temporarily unable to reach my reasoning model. ${e?.message || ""}`;
    }

    const aiMsg = { role: "assistant", content: answer, ts: new Date().toISOString() };
    const newMessages = [...history, userMsg, aiMsg];

    const [updated] = await db.update(copilotConversations)
      .set({ messages: newMessages, updatedAt: new Date() })
      .where(eq(copilotConversations.id, convo.id))
      .returning();

    res.json({ conversation: updated, answer });
  } catch (e: any) {
    console.error("[copilots/chat] error", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
