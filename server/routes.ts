import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { setupAuth } from "./auth";
import { setupSecurity } from "./middleware/security";
import { csrfProtection, csrfTokenRoute } from "./middleware/csrf";
import { httpLogger, logger } from "./middleware/logger";
import { setupSwagger } from "./swagger";

import usersRoutes from "./routes/users";
import candidatesRoutes from "./routes/candidates";
import employeesRoutes from "./routes/employees";
import tasksRoutes from "./routes/tasks";
import departmentsRoutes from "./routes/departments";
import complianceRoutes from "./routes/compliance";
import activitiesRoutes from "./routes/activities";
import documentsRoutes from "./routes/documents";
import jobPostingsRoutes from "./routes/jobPostings";
import interviewsRoutes from "./routes/interviews";
import surveysRoutes from "./routes/surveys";
import surveyResponsesRoutes from "./routes/surveyResponses";
import wellnessRoutes from "./routes/wellness";
import aiRoutes from "./routes/ai";
import exportsRoutes from "./routes/exports";
import emailRoutes from "./routes/email";
import settingsRoutes from "./routes/settings";
import integrationsRoutes from "./routes/integrations";
import announcementsRoutes from "./routes/announcements";
import notificationsRoutes from "./routes/notifications";
import selfServiceRoutes from "./routes/selfService";
import analyticsRoutes from "./routes/analytics";
import commandCenterRoutes from "./routes/commandCenter";
import copilotsRoutes from "./routes/copilots";
import calendarRoutes from "./routes/calendar";
import orgChartRoutes from "./routes/orgChart";
import onboardingWorkflowsRoutes from "./routes/onboardingWorkflows";
import performanceReviewsRoutes from "./routes/performanceReviews";
import payrollRoutes from "./routes/payroll";
import reportBuilderRoutes from "./routes/reportBuilder";
import recognitionRoutes from "./routes/recognition";
import knowledgeBaseRoutes from "./routes/knowledgeBase";
import attendanceRoutes from "./routes/attendance";
import vrTrainingRoutes from "./routes/vrTraining";
import digitalTwinsRoutes from "./routes/digitalTwins";
import emotionAiRoutes from "./routes/emotionAi";
import talentMarketplaceRoutes from "./routes/talentMarketplace";
import resignationRiskRoutes from "./routes/resignationRisk";
import policyComplianceRoutes from "./routes/policyCompliance";
import careerPathsRoutes from "./routes/careerPaths";
import onboardingBuddiesRoutes from "./routes/onboardingBuddies";
import aiLearningRoutes from "./routes/aiLearning";
import interviewCoachRoutes from "./routes/interviewCoach";
import workforcePlanningRoutes from "./routes/workforcePlanning";
import sentimentDashboardRoutes from "./routes/sentimentDashboard";
import hrChatbotRoutes from "./routes/hrChatbot";
import peerRecognitionRoutes from "./routes/peerRecognition";
import learningDevRoutes from "./routes/learningDev";
import offerLettersRoutes from "./routes/offerLetters";
import complianceReportsRoutes from "./routes/complianceReports";
import shiftManagementRoutes from "./routes/shiftManagement";
import anonymousFeedbackRoutes from "./routes/anonymousFeedback";
import meetingTrackerRoutes from "./routes/meetingTracker";
import organizationsRoutes from "./routes/organizations";
import legalRoutes from "./routes/legal";
import billingRoutes from "./routes/billing";
import gdprRoutes from "./routes/gdpr";
import twoFactorRoutes from "./routes/twoFactor";
import tapPaymentsRoutes from "./routes/tapPaymentsRoutes";
import autopilotRoutes from "./routes/autopilotRoutes";
import { requireMinRole } from "./middleware/rbac";
import { setupMetrics } from "./metrics";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  app.use(httpLogger);
  setupMetrics(app);
  setupSecurity(app);
  setupAuth(app);
  setupSwagger(app);

  const httpServer = createServer(app);

  app.get('/api/csrf-token', csrfTokenRoute);
  app.use('/api/legal', legalRoutes);
  app.use('/api/tap-payments', tapPaymentsRoutes);
  app.use('/api/autopilot', requireAuth, autopilotRoutes);

  app.get('/api/health', async (_req, res) => {
    let dbStatus = 'connected';
    let dbLatencyMs = 0;
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Date.now() - start;
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }
    const healthy = dbStatus === 'connected';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      services: { auth: 'ok', billing: 'ok', ai: 'ok' },
    });
  });

  app.use('/api/2fa', requireAuth, twoFactorRoutes);
  app.use('/api/users', requireAuth, usersRoutes);
  app.use('/api/candidates', requireAuth, candidatesRoutes);
  app.use('/api/employees', requireAuth, employeesRoutes);
  app.use('/api/tasks', requireAuth, tasksRoutes);
  app.use('/api/departments', requireAuth, departmentsRoutes);
  app.use('/api/compliance', requireAuth, complianceRoutes);
  app.use('/api/activities', requireAuth, activitiesRoutes);
  app.use('/api/documents', requireAuth, documentsRoutes);
  app.use('/api/job-postings', requireAuth, jobPostingsRoutes);
  app.use('/api/interviews', requireAuth, interviewsRoutes);
  app.use('/api/surveys', requireAuth, surveysRoutes);
  app.use('/api/survey-responses', requireAuth, surveyResponsesRoutes);
  app.use('/api/exports', requireAuth, exportsRoutes);
  app.use('/api/email', requireAuth, emailRoutes);
  app.use('/api/settings', requireAuth, settingsRoutes);
  app.use('/api/integrations', requireAuth, integrationsRoutes);
  app.use('/api', requireAuth, wellnessRoutes);
  app.use('/api/announcements', requireAuth, announcementsRoutes);
  app.use('/api', requireAuth, aiRoutes);
  app.use('/api/notifications', requireAuth, notificationsRoutes);
  app.use('/api/self-service', requireAuth, selfServiceRoutes);
  app.use('/api/analytics', requireAuth, analyticsRoutes);
  app.use('/api/command-center', requireAuth, commandCenterRoutes);
  app.use('/api/copilots', requireAuth, copilotsRoutes);
  app.use('/api/calendar', requireAuth, calendarRoutes);
  app.use('/api/org-chart', requireAuth, orgChartRoutes);
  app.use('/api/onboarding-workflows', requireAuth, onboardingWorkflowsRoutes);
  app.use('/api/performance-reviews', requireAuth, performanceReviewsRoutes);
  app.use('/api/payroll', requireAuth, payrollRoutes);
  app.use('/api/reports', requireAuth, reportBuilderRoutes);
  app.use('/api/recognition', requireAuth, recognitionRoutes);
  app.use('/api/knowledge-base', requireAuth, knowledgeBaseRoutes);
  app.use('/api/attendance', requireAuth, attendanceRoutes);
  app.use('/api/vr-training', requireAuth, vrTrainingRoutes);
  app.use('/api/digital-twins', requireAuth, digitalTwinsRoutes);
  app.use('/api/emotion-ai', requireAuth, emotionAiRoutes);
  app.use('/api/talent-marketplace', requireAuth, talentMarketplaceRoutes);
  app.use('/api/resignation-risk', requireAuth, resignationRiskRoutes);
  app.use('/api/policy-compliance', requireAuth, policyComplianceRoutes);
  app.use('/api/career-paths', requireAuth, careerPathsRoutes);
  app.use('/api/onboarding-buddies', requireAuth, onboardingBuddiesRoutes);
  app.use('/api/ai-learning', requireAuth, aiLearningRoutes);
  app.use('/api/interview-coach', requireAuth, interviewCoachRoutes);
  app.use('/api/workforce-planning', requireAuth, workforcePlanningRoutes);
  app.use('/api/sentiment-dashboard', requireAuth, sentimentDashboardRoutes);
  app.use('/api/hr-chatbot', requireAuth, hrChatbotRoutes);
  app.use('/api/peer-recognition', requireAuth, peerRecognitionRoutes);
  app.use('/api/learning-dev', requireAuth, learningDevRoutes);
  app.use('/api/offer-letters', requireAuth, offerLettersRoutes);
  app.use('/api/compliance-reports', requireAuth, complianceReportsRoutes);
  app.use('/api/shift-management', requireAuth, shiftManagementRoutes);
  app.use('/api/anonymous-feedback', requireAuth, anonymousFeedbackRoutes);
  app.use('/api/meeting-tracker', requireAuth, meetingTrackerRoutes);
  app.use('/api/organizations', requireAuth, organizationsRoutes);
  app.use('/api/billing', requireAuth, billingRoutes);
  app.use('/api/gdpr', requireAuth, gdprRoutes);
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal server error";
    if (status >= 500) {
      logger.error({ err, reqId: (req as any).id, url: req.url, method: req.method }, `${status} ${message}`);
    } else {
      logger.warn({ url: req.url, method: req.method, status }, message);
    }
    res.status(status).json({
      error: status >= 500 ? "Internal server error" : message,
      ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { detail: message } : {}),
    });
  });

  return httpServer;
}
