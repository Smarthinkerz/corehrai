import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "dashboard", "employees", "departments", "tasks", "announcements",
    "self_service", "basic_reports", "notifications",
  ],
  pro: [
    "dashboard", "employees", "departments", "tasks", "announcements",
    "self_service", "basic_reports", "notifications",
    "recruitment", "onboarding", "surveys", "compliance", "documents",
    "attendance", "leave_management", "performance_reviews", "payroll",
    "recognition", "knowledge_base", "calendar", "analytics",
    "wellness", "communications", "email", "org_chart",
  ],
  enterprise: [
    "dashboard", "employees", "departments", "tasks", "announcements",
    "self_service", "basic_reports", "notifications",
    "recruitment", "onboarding", "surveys", "compliance", "documents",
    "attendance", "leave_management", "performance_reviews", "payroll",
    "recognition", "knowledge_base", "calendar", "analytics",
    "wellness", "communications", "email", "org_chart",
    "ai_insights", "vr_training", "digital_twins", "emotion_ai",
    "talent_marketplace", "resignation_risk", "career_paths",
    "interview_coach", "workforce_planning", "sentiment_dashboard",
    "hr_chatbot", "peer_recognition", "learning_dev", "offer_letters",
    "compliance_reports", "shift_management", "anonymous_feedback",
    "meeting_tracker", "report_builder", "integrations", "api_access",
    "custom_branding", "sso", "audit_log", "data_export",
  ],
};

const PLAN_LIMITS: Record<string, { maxUsers: number; maxEmployees: number }> = {
  free: { maxUsers: 3, maxEmployees: 10 },
  pro: { maxUsers: 25, maxEmployees: 100 },
  enterprise: { maxUsers: -1, maxEmployees: -1 },
};

export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Authentication required" });

      if (user.role === "super_admin") return next();

      if (!user.organizationId) return next();

      const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!org) return next();

      const planFeatures = PLAN_FEATURES[org.plan] || PLAN_FEATURES.free;
      if (!planFeatures.includes(feature)) {
        return res.status(403).json({
          error: "Feature not available",
          message: `This feature requires a ${getMinimumPlan(feature)} plan or higher.`,
          requiredPlan: getMinimumPlan(feature),
          currentPlan: org.plan,
        });
      }

      next();
    } catch (error) {
      next();
    }
  };
}

function getMinimumPlan(feature: string): string {
  if (PLAN_FEATURES.free.includes(feature)) return "free";
  if (PLAN_FEATURES.pro.includes(feature)) return "pro";
  return "enterprise";
}

export function getPlanFeatures(plan: string): string[] {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
