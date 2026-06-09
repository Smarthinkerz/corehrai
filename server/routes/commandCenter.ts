import { Router } from "express";
import { storage } from "../storage";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_PRO = "gpt-5.5";

let cachedSummary: { text: string; ts: number; healthScore: number } | null = null;
const SUMMARY_TTL_MS = 5 * 60 * 1000;

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

router.get("/overview", async (req, res) => {
  try {
    const [
      employees,
      candidates,
      departments,
      tasks,
      surveys,
      surveyResponses,
      activities,
      jobPostings,
      interviews,
      riskAssessments,
      sentimentAnalyses,
      autopilotActions,
      announcements,
    ] = await Promise.all([
      storage.getAllEmployees(),
      storage.getAllCandidates(),
      storage.getAllDepartments(),
      storage.getAllHrTasks(),
      storage.getAllEngagementSurveys(),
      storage.getAllSurveyResponses(),
      storage.getAllActivityLogs(),
      storage.getAllJobPostings(),
      storage.getAllInterviews(),
      storage.getAllResignationRiskAssessments().catch(() => []),
      storage.getAllSentimentAnalyses2().catch(() => []),
      (storage as any).getAllAutopilotActions ? (storage as any).getAllAutopilotActions().catch(() => []) : [],
      storage.getAllAnnouncements().catch(() => []),
    ]);

    // Latest risk per employee
    const latestRisk = new Map<number, any>();
    for (const a of riskAssessments) {
      const cur = latestRisk.get(a.employeeId);
      if (!cur || new Date(a.assessedAt) > new Date(cur.assessedAt)) latestRisk.set(a.employeeId, a);
    }
    const risks = Array.from(latestRisk.values());
    const criticalRisk = risks.filter(r => r.riskLevel === "critical").length;
    const highRisk = risks.filter(r => r.riskLevel === "high").length;
    const retentionScore = risks.length > 0
      ? clamp(100 - (risks.reduce((s, r) => s + (r.riskScore || 0), 0) / risks.length))
      : 78;

    // Latest sentiment per dept
    const latestSent = new Map<string, any>();
    for (const s of sentimentAnalyses) {
      const dept = s.department || "Unassigned";
      const cur = latestSent.get(dept);
      if (!cur || new Date(s.analyzedAt || 0) > new Date(cur.analyzedAt || 0)) {
        latestSent.set(dept, s);
      }
    }
    const sents = Array.from(latestSent.values());
    const sentimentScore = sents.length > 0
      ? clamp(sents.reduce((s, r) => s + (r.sentimentScore || 60), 0) / sents.length)
      : 72;

    // Productivity proxy: completed vs open tasks
    const completed = tasks.filter(t => t.status === "completed").length;
    const total = tasks.length || 1;
    const productivityScore = clamp((completed / total) * 100);

    // Engagement proxy: active surveys + responses ratio
    const activeSurveys = surveys.filter(s => s.status === "active").length;
    const responseRate = surveys.length > 0 ? Math.min(100, (surveyResponses.length / surveys.length) * 20) : 65;
    const engagementScore = clamp(50 + responseRate * 0.5);

    // Composite Org Health
    const orgHealthScore = clamp(
      retentionScore * 0.3 +
      sentimentScore * 0.3 +
      productivityScore * 0.2 +
      engagementScore * 0.2
    );

    const healthBand =
      orgHealthScore >= 85 ? "excellent" :
      orgHealthScore >= 70 ? "healthy" :
      orgHealthScore >= 55 ? "watch" : "critical";

    // Department heatmap
    const departmentHeatmap = departments.map(d => {
      const deptEmps = employees.filter(e => e.department === d.name);
      const sent = latestSent.get(d.name);
      const deptRisks = risks.filter(r => deptEmps.some(e => e.id === r.employeeId));
      const avgRisk = deptRisks.length > 0
        ? deptRisks.reduce((s, r) => s + (r.riskScore || 0), 0) / deptRisks.length
        : 30;
      const health = clamp(((sent?.sentimentScore || 65) * 0.6) + ((100 - avgRisk) * 0.4));
      return {
        department: d.name,
        headcount: deptEmps.length,
        sentiment: sent?.sentimentScore || null,
        mood: sent?.mood || "neutral",
        riskScore: Math.round(avgRisk),
        health,
      };
    }).sort((a, b) => b.headcount - a.headcount);

    // Predictive alerts
    const alerts: Array<{ id: string; severity: "critical" | "high" | "medium"; title: string; detail: string; category: string; }> = [];
    if (criticalRisk > 0) {
      alerts.push({
        id: "risk-critical",
        severity: "critical",
        title: `${criticalRisk} employee${criticalRisk > 1 ? "s" : ""} at critical resignation risk`,
        detail: `Immediate retention conversation recommended. Combined cost of loss estimated at $${(criticalRisk * 75000).toLocaleString()}.`,
        category: "Retention",
      });
    }
    if (highRisk > 0) {
      alerts.push({
        id: "risk-high",
        severity: "high",
        title: `${highRisk} flight-risk employee${highRisk > 1 ? "s" : ""} flagged`,
        detail: "Schedule manager 1:1s within 7 days to surface concerns.",
        category: "Retention",
      });
    }
    const lowSentDepts = departmentHeatmap.filter(d => d.sentiment !== null && d.sentiment < 55);
    if (lowSentDepts.length > 0) {
      alerts.push({
        id: "sent-low",
        severity: lowSentDepts.length > 2 ? "high" : "medium",
        title: `Low sentiment in ${lowSentDepts.length} department${lowSentDepts.length > 1 ? "s" : ""}`,
        detail: `Affected: ${lowSentDepts.slice(0, 3).map(d => d.department).join(", ")}. Run a pulse survey this week.`,
        category: "Engagement",
      });
    }
    const overdueTasks = tasks.filter(t => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()).length;
    if (overdueTasks > 5) {
      alerts.push({
        id: "tasks-overdue",
        severity: overdueTasks > 20 ? "high" : "medium",
        title: `${overdueTasks} HR tasks overdue`,
        detail: "Workforce execution is slipping. Reassign or close stale tasks to recover bandwidth.",
        category: "Operations",
      });
    }
    const openRoles = jobPostings.filter(j => j.status === "active").length;
    const stalledInterviews = interviews.filter(i => i.status === "scheduled" && i.date && new Date(i.date) < new Date()).length;
    if (stalledInterviews > 3) {
      alerts.push({
        id: "interviews-stalled",
        severity: "medium",
        title: `${stalledInterviews} interviews past their scheduled time`,
        detail: "Recruiting velocity at risk. Auto-rescheduling recommended.",
        category: "Recruitment",
      });
    }

    // Recent AI actions feed (autopilot)
    const recentAIActions = (autopilotActions as any[])
      .sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime())
      .slice(0, 8)
      .map(a => ({
        id: a.id,
        title: a.title || a.workflowKey,
        summary: a.summary,
        workflowKey: a.workflowKey,
        status: a.status || "executed",
        createdAt: a.createdAt || a.timestamp,
      }));

    // Top KPIs
    const kpis = {
      totalEmployees: employees.length,
      openRoles,
      activeCandidates: candidates.filter(c => c.status !== "rejected" && c.status !== "hired").length,
      hiringVelocity: interviews.length,
      activeSurveys,
      orgHealthScore,
      retentionScore,
      sentimentScore,
      productivityScore,
      engagementScore,
      criticalAlerts: alerts.filter(a => a.severity === "critical").length,
      autopilotActionsToday: (autopilotActions as any[]).filter(a => {
        const t = new Date(a.createdAt || a.timestamp || 0);
        return Date.now() - t.getTime() < 24 * 3600 * 1000;
      }).length,
    };

    // Activity sparkline (last 14 days)
    const dailyCounts = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyCounts.set(d.toISOString().split("T")[0], 0);
    }
    activities.forEach(a => {
      const day = new Date(a.timestamp).toISOString().split("T")[0];
      if (dailyCounts.has(day)) dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    });
    const activitySparkline = Array.from(dailyCounts.entries()).map(([date, count]) => ({ date, count }));

    res.json({
      orgHealthScore,
      healthBand,
      kpis,
      alerts,
      departmentHeatmap,
      recentAIActions,
      activitySparkline,
      lastAnnouncement: announcements[0] || null,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[command-center] overview error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/exec-summary", async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedSummary && now - cachedSummary.ts < SUMMARY_TTL_MS) {
      return res.json({ summary: cachedSummary.text, healthScore: cachedSummary.healthScore, cached: true, generatedAt: new Date(cachedSummary.ts).toISOString() });
    }

    const [employees, departments, riskAssessments, sentimentAnalyses, tasks] = await Promise.all([
      storage.getAllEmployees(),
      storage.getAllDepartments(),
      storage.getAllResignationRiskAssessments().catch(() => []),
      storage.getAllSentimentAnalyses2().catch(() => []),
      storage.getAllHrTasks(),
    ]);

    const latestRisk = new Map<number, any>();
    for (const a of riskAssessments) {
      const cur = latestRisk.get(a.employeeId);
      if (!cur || new Date(a.assessedAt) > new Date(cur.assessedAt)) latestRisk.set(a.employeeId, a);
    }
    const risks = Array.from(latestRisk.values());
    const critical = risks.filter(r => r.riskLevel === "critical").length;
    const high = risks.filter(r => r.riskLevel === "high").length;
    const avgSent = sentimentAnalyses.length > 0
      ? sentimentAnalyses.reduce((s, r) => s + (r.sentimentScore || 60), 0) / sentimentAnalyses.length
      : 72;
    const completed = tasks.filter(t => t.status === "completed").length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const healthScore = clamp(70 + (avgSent - 60) * 0.5 - critical * 4 - high * 2);

    const prompt = `You are the Chief AI Strategist for an enterprise. Write a 3-sentence executive briefing for the CEO based on this workforce snapshot. Be specific, decisive, and forward-looking. No fluff.

Workforce snapshot:
- Headcount: ${employees.length} across ${departments.length} departments
- Resignation risk: ${critical} critical, ${high} high
- Average sentiment score: ${avgSent.toFixed(1)}/100
- Task completion rate: ${completionRate}%
- Composite org health: ${healthScore}/100

Format: One opening sentence stating overall posture, one sentence on the most pressing risk or opportunity, one sentence with a concrete recommendation. Speak in first person plural ("we"). Maximum 80 words total.`;

    let text = "";
    try {
      const response = await openai.chat.completions.create({
        model: MODEL_PRO,
        messages: [
          { role: "system", content: "You are a precise executive briefing writer. Output only the briefing text, no preamble." },
          { role: "user", content: prompt },
        ],
      });
      text = response.choices[0]?.message?.content?.trim() || "";
    } catch (e) {
      text = `Workforce posture is ${healthScore >= 75 ? "strong" : healthScore >= 60 ? "stable but watchful" : "under pressure"} with org health at ${healthScore}/100. ${critical + high > 0 ? `${critical + high} employees at elevated resignation risk demand immediate manager intervention.` : "No critical retention signals detected this week."} Recommend prioritizing 1:1 retention conversations with top quartile contributors and running a pulse survey across the lowest-sentiment departments by Friday.`;
    }

    cachedSummary = { text, ts: now, healthScore };
    res.json({ summary: text, healthScore, cached: false, generatedAt: new Date(now).toISOString() });
  } catch (error: any) {
    console.error("[command-center] exec-summary error", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
