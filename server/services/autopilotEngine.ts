import { db } from "../db";
import { autopilotPolicies, autopilotActions, autopilotKillSwitches } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";

export type AutopilotMode = "manual" | "suggest" | "auto";

export interface WorkflowDef {
  key: string;
  label: string;
  category: string;
  description: string;
  /** Whether this workflow is allowed to run in fully-auto mode given regulatory constraints. */
  autoAllowed: boolean;
  /** Why auto is restricted (shown in UI). */
  autoRestrictedReason?: string;
}

export const WORKFLOWS: WorkflowDef[] = [
  // Recruitment
  { key: "resume_screening", label: "Resume Screening", category: "Recruitment", description: "Score every inbound resume against the job spec.", autoAllowed: true },
  { key: "candidate_outreach", label: "Candidate Outreach", category: "Recruitment", description: "Send personalized first-touch emails to qualified candidates.", autoAllowed: true },
  { key: "interview_scheduling", label: "Interview Scheduling", category: "Recruitment", description: "Propose interview slots, send invites, manage reschedules.", autoAllowed: true },
  { key: "offer_generation", label: "Offer Generation", category: "Recruitment", description: "Draft offers from approved templates and salary bands.", autoAllowed: true },
  { key: "hiring_decision", label: "Hiring Decision", category: "Recruitment", description: "Final hire/no-hire call.", autoAllowed: false, autoRestrictedReason: "EEOC / EU AI Act / GDPR Art. 22 require a human decision-maker." },

  // Onboarding
  { key: "onboarding_kickoff", label: "Onboarding Kickoff", category: "Onboarding", description: "Create checklist, assign buddy, schedule day-1.", autoAllowed: true },
  { key: "training_assignment", label: "Training Assignment", category: "Onboarding", description: "Auto-enroll new hires in role-based learning paths.", autoAllowed: true },

  // Performance
  { key: "performance_review_draft", label: "Performance Review Draft", category: "Performance", description: "Aggregate 360 + KPIs into a draft review.", autoAllowed: true },
  { key: "compensation_decision", label: "Compensation Decision", category: "Performance", description: "Raises, bonuses, equity grants.", autoAllowed: false, autoRestrictedReason: "Material employment decisions require manager + HR sign-off." },
  { key: "termination_decision", label: "Termination / PIP", category: "Performance", description: "Performance-based separations.", autoAllowed: false, autoRestrictedReason: "Wrongful-dismissal liability requires a human signature." },

  // Engagement
  { key: "sentiment_analysis", label: "Sentiment Analysis", category: "Engagement", description: "Continuously analyze surveys, comments, anon feedback.", autoAllowed: true },
  { key: "engagement_nudges", label: "Engagement Nudges", category: "Engagement", description: "Send recognition prompts, pulse surveys, peer shoutouts.", autoAllowed: true },
  { key: "attrition_alerts", label: "Attrition Alerts", category: "Engagement", description: "Flag at-risk employees to managers + suggest interventions.", autoAllowed: true },

  // Operations
  { key: "payroll_calculation", label: "Payroll Calculation", category: "Operations", description: "Compute wages, taxes, deductions, bonuses.", autoAllowed: true },
  { key: "payroll_release", label: "Payroll Release", category: "Operations", description: "Push funds to employee accounts.", autoAllowed: false, autoRestrictedReason: "Bank/regulator requires a named officer to authorize disbursement." },
  { key: "compliance_audit", label: "Compliance Audit", category: "Operations", description: "Continuously scan policies, contracts, GDPR/SOX evidence.", autoAllowed: true },
  { key: "policy_updates", label: "Policy Updates", category: "Operations", description: "Detect law changes and propose policy revisions.", autoAllowed: true },

  // Predictive
  { key: "workforce_planning", label: "Workforce Planning", category: "Predictive", description: "Forecast headcount needs by department.", autoAllowed: true },
  { key: "skills_gap_analysis", label: "Skills Gap Analysis", category: "Predictive", description: "Map current skills vs. future roadmap.", autoAllowed: true },

  // Communication
  { key: "hr_helpdesk", label: "HR Helpdesk", category: "Communication", description: "Answer employee questions 24/7 via chatbot.", autoAllowed: true },
  { key: "knowledge_authoring", label: "Knowledge Authoring", category: "Communication", description: "Draft and update HR knowledge base articles.", autoAllowed: true },
];

export async function isOrgPaused(orgId: number): Promise<boolean> {
  const [row] = await db.select().from(autopilotKillSwitches).where(eq(autopilotKillSwitches.organizationId, orgId));
  return !!row?.paused;
}

export async function getPolicies(orgId: number) {
  return db.select().from(autopilotPolicies).where(eq(autopilotPolicies.organizationId, orgId));
}

export async function getPolicy(orgId: number, workflowKey: string) {
  const [row] = await db.select().from(autopilotPolicies).where(and(eq(autopilotPolicies.organizationId, orgId), eq(autopilotPolicies.workflowKey, workflowKey)));
  return row;
}

export async function upsertPolicy(orgId: number, workflowKey: string, mode: AutopilotMode, enabled = true, config: Record<string, unknown> = {}) {
  const wf = WORKFLOWS.find((w) => w.key === workflowKey);
  if (!wf) throw new Error(`Unknown workflow: ${workflowKey}`);
  if (mode === "auto" && !wf.autoAllowed) {
    throw new Error(`'${wf.label}' cannot run in fully-auto mode: ${wf.autoRestrictedReason}`);
  }
  const existing = await getPolicy(orgId, workflowKey);
  if (existing) {
    const [updated] = await db.update(autopilotPolicies)
      .set({ mode, enabled, config, updatedAt: new Date() })
      .where(eq(autopilotPolicies.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(autopilotPolicies).values({ organizationId: orgId, workflowKey, mode, enabled, config }).returning();
  return created;
}

export interface RecordActionInput {
  organizationId: number;
  workflowKey: string;
  title: string;
  summary?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  entityType?: string;
  entityId?: number;
}

/**
 * Records an autopilot action respecting org policy + kill-switch.
 * Returns the recorded action with status:
 *  - "pending"  → mode=suggest, awaiting human approval
 *  - "executed" → mode=auto, executed immediately
 *  - "failed"   → kill-switch on, or workflow disabled
 */
export async function recordAction(req: RecordActionInput) {
  if (await isOrgPaused(req.organizationId)) {
    const [row] = await db.insert(autopilotActions).values({
      ...req,
      mode: "auto",
      status: "failed",
      decidedBy: "ai",
      errorMessage: "Autopilot is paused for this organization",
    } as any).returning();
    return row;
  }
  const policy = await getPolicy(req.organizationId, req.workflowKey);
  const mode = (policy?.mode as AutopilotMode) || "manual";
  const enabled = policy?.enabled !== false;

  if (!enabled || mode === "manual") {
    const [row] = await db.insert(autopilotActions).values({
      ...req,
      mode: "suggest",
      status: "rejected",
      decidedBy: "ai",
      errorMessage: "Workflow is in manual mode",
    } as any).returning();
    return row;
  }

  const wf = WORKFLOWS.find((w) => w.key === req.workflowKey);
  const finalMode: AutopilotMode = mode === "auto" && wf?.autoAllowed ? "auto" : "suggest";
  const status = finalMode === "auto" ? "executed" : "pending";

  const [row] = await db.insert(autopilotActions).values({
    ...req,
    mode: finalMode,
    status,
    decidedBy: "ai",
    completedAt: status === "executed" ? new Date() : null,
  } as any).returning();
  return row;
}

export async function listActions(orgId: number, limit = 50) {
  return db.select().from(autopilotActions)
    .where(eq(autopilotActions.organizationId, orgId))
    .orderBy(desc(autopilotActions.createdAt))
    .limit(limit);
}

export async function approveAction(orgId: number, actionId: number, userId: number) {
  const [row] = await db.update(autopilotActions)
    .set({ status: "executed", decidedBy: "human", approverUserId: userId, completedAt: new Date() })
    .where(and(eq(autopilotActions.id, actionId), eq(autopilotActions.organizationId, orgId)))
    .returning();
  return row;
}

export async function rejectAction(orgId: number, actionId: number, userId: number, reason?: string) {
  const [row] = await db.update(autopilotActions)
    .set({ status: "rejected", decidedBy: "human", approverUserId: userId, completedAt: new Date(), errorMessage: reason })
    .where(and(eq(autopilotActions.id, actionId), eq(autopilotActions.organizationId, orgId)))
    .returning();
  return row;
}

export async function setKillSwitch(orgId: number, paused: boolean, userId: number, reason?: string) {
  const existing = await db.select().from(autopilotKillSwitches).where(eq(autopilotKillSwitches.organizationId, orgId));
  if (existing.length === 0) {
    const [row] = await db.insert(autopilotKillSwitches).values({
      organizationId: orgId, paused, pausedBy: userId, pausedAt: paused ? new Date() : null, reason: reason || null,
    }).returning();
    return row;
  }
  const [row] = await db.update(autopilotKillSwitches)
    .set({ paused, pausedBy: userId, pausedAt: paused ? new Date() : null, reason: reason || null })
    .where(eq(autopilotKillSwitches.organizationId, orgId))
    .returning();
  return row;
}

export async function getKillSwitch(orgId: number) {
  const [row] = await db.select().from(autopilotKillSwitches).where(eq(autopilotKillSwitches.organizationId, orgId));
  return row || { organizationId: orgId, paused: false, pausedBy: null, pausedAt: null, reason: null };
}

export async function getStats(orgId: number) {
  const policies = await getPolicies(orgId);
  const actions = await listActions(orgId, 1000);
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent = actions.filter((a) => a.createdAt && new Date(a.createdAt).getTime() > last24h);
  return {
    workflowsTotal: WORKFLOWS.length,
    workflowsAuto: policies.filter((p) => p.mode === "auto" && p.enabled).length,
    workflowsSuggest: policies.filter((p) => p.mode === "suggest" && p.enabled).length,
    workflowsManual: WORKFLOWS.length - policies.filter((p) => (p.mode === "auto" || p.mode === "suggest") && p.enabled).length,
    actions24h: recent.length,
    actionsExecuted24h: recent.filter((a) => a.status === "executed").length,
    actionsPending: actions.filter((a) => a.status === "pending").length,
    actionsFailed24h: recent.filter((a) => a.status === "failed").length,
  };
}
