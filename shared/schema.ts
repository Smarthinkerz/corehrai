import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table for multi-tenancy
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3B82F6"),
  plan: text("plan").notNull().default("free"),
  maxEmployees: integer("max_employees").default(10),
  maxUsers: integer("max_users").default(3),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("active"),
  billingEmail: text("billing_email"),
  features: jsonb("features").default([]),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  department: text("department"),
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").notNull().default(true),
  organizationId: integer("organization_id").references(() => organizations.id),
  emailVerified: boolean("email_verified").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Email Verification Tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

// Login Audit Log
export const loginAuditLog = pgTable("login_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
  profilePicture: true,
});

// Candidate table for recruiting
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  resumeUrl: text("resume_url"),
  status: text("status").notNull().default("new"), // new, screening, interview, on_hold, next_round, follow_up, offer, rejected, hired
  aiScore: integer("ai_score"), // 0-100
  source: text("source"),
  notes: text("notes"),
  organizationId: integer("organization_id").references(() => organizations.id),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hireDate: timestamp("hire_date").notNull(),
  manager: text("manager"),
  managerId: integer("manager_id").references((): AnyPgColumn => employees.id),
  status: text("status").notNull().default("active"), // active, onLeave, terminated
  salary: real("salary"),
  performanceScore: integer("performance_score"), // 0-100
  engagementScore: integer("engagement_score"), // 0-100
  organizationId: integer("organization_id").references(() => organizations.id),
  deletedAt: timestamp("deleted_at"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  deletedAt: true,
});

// Onboarding tasks
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  taskName: text("task_name").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed
  assignedTo: integer("assigned_to").references(() => users.id),
});

export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({
  id: true,
});

// HR Tasks table
export const hrTasks = pgTable("hr_tasks", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, in-progress, completed
  category: text("category").notNull(), // recruitment, onboarding, compliance, etc.
  organizationId: integer("organization_id").references(() => organizations.id),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHrTaskSchema = createInsertSchema(hrTasks).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});

// Department table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  headCount: integer("head_count").notNull().default(0),
  budget: real("budget"),
  engagementScore: integer("engagement_score"), // 0-100
  organizationId: integer("organization_id").references(() => organizations.id),
  deletedAt: timestamp("deleted_at"),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  deletedAt: true,
});

// Compliance records
export const complianceRecords = pgTable("compliance_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  documentType: text("document_type").notNull(), // training, policy, certification
  documentName: text("document_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, verified, expired
  expiryDate: timestamp("expiry_date"),
  verifiedBy: integer("verified_by").references(() => users.id),
  verificationDate: timestamp("verification_date"),
});

export const insertComplianceRecordSchema = createInsertSchema(complianceRecords).omit({
  id: true,
});

// Feedback/Engagement surveys
export const engagementSurveys = pgTable("engagement_surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed
  createdBy: integer("created_by").references(() => users.id),
  questions: jsonb("questions").notNull(), // array of question objects
});

export const insertEngagementSurveySchema = createInsertSchema(engagementSurveys).omit({
  id: true,
});

// Survey responses
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => engagementSurveys.id),
  employeeId: integer("employee_id").references(() => employees.id),
  responses: jsonb("responses").notNull(), // array of response objects
  sentimentScore: real("sentiment_score"), // 0-1
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  submittedAt: true,
});

// Activity logs for tracking HR actions
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  description: text("description"),
  entityType: text("entity_type").notNull(), // employee, candidate, task, etc.
  entityId: integer("entity_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // pdf, doc, xls, etc.
  fileSize: integer("file_size").notNull(), // in bytes
  category: text("category").notNull(), // policies, templates, contracts, general
  department: text("department"), // optional department association
  employeeId: integer("employee_id").references(() => employees.id), // optional employee association
  isPublic: boolean("is_public").notNull().default(false), // whether document is accessible to all employees
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  version: text("version").default("1.0"),
  tags: jsonb("tags").default([]), // array of tags for search and filtering
  organizationId: integer("organization_id").references(() => organizations.id),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Export all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;

export type HrTask = typeof hrTasks.$inferSelect;
export type InsertHrTask = z.infer<typeof insertHrTaskSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type ComplianceRecord = typeof complianceRecords.$inferSelect;
export type InsertComplianceRecord = z.infer<typeof insertComplianceRecordSchema>;

export type EngagementSurvey = typeof engagementSurveys.$inferSelect;
export type InsertEngagementSurvey = z.infer<typeof insertEngagementSurveySchema>;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Job postings table
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // Full-time, Part-time, Contract
  status: text("status").notNull().default("active"), // active, draft, closed
  postedDate: timestamp("posted_date").notNull().defaultNow(),
  updatedDate: timestamp("updated_date").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  applicantCount: integer("applicant_count").notNull().default(0),
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  postedDate: true,
  updatedDate: true,
  applicantCount: true,
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;

// Interviews table
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  date: timestamp("date").notNull(),
  interviewType: text("interview_type").notNull().default("initial"), // initial, technical, cultural, final
  interviewers: text("interviewers"), // comma-separated names or IDs
  location: text("location").notNull().default("video call"), // office, video call, phone
  notes: text("notes"),
  feedback: text("feedback"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  result: text("result"), // pass, fail, on_hold, move_forward, needs_follow_up
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

// Candidate evaluation interface for AI evaluation
export interface CandidateEvaluation {
  aiScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  fitAssessment: string;
  recommendations: string[];
  interviewQuestions: string[];
}

// Wellness programs table
export const wellnessPrograms = pgTable("wellness_programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // mental, physical, financial, social
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  enrollmentCap: integer("enrollment_cap"), // optional maximum participants
  location: text("location").notNull(), // online, office, hybrid, external
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed, cancelled
  organizer: text("organizer").notNull(),
  contactEmail: text("contact_email").notNull(),
  imageUrl: text("image_url"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  materials: jsonb("materials").default([]), // array of material links or documents
  tags: jsonb("tags").default([]), // array of tags for filtering
});

export const insertWellnessProgramSchema = createInsertSchema(wellnessPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Wellness program enrollments
export const wellnessEnrollments = pgTable("wellness_enrollments", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => wellnessPrograms.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  status: text("status").notNull().default("enrolled"), // enrolled, completed, cancelled
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  completionDate: timestamp("completion_date"),
  feedback: text("feedback"),
  satisfactionRating: integer("satisfaction_rating"), // 1-5
});

export const insertWellnessEnrollmentSchema = createInsertSchema(wellnessEnrollments).omit({
  id: true,
  enrollmentDate: true,
});

// Wellness metrics to track employee wellness over time
export const wellnessMetrics = pgTable("wellness_metrics", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  recordDate: timestamp("record_date").notNull().defaultNow(),
  stressLevel: integer("stress_level"), // 1-10
  workLifeBalance: integer("work_life_balance"), // 1-10
  satisfaction: integer("satisfaction"), // 1-10
  energyLevel: integer("energy_level"), // 1-10
  physicalActivity: integer("physical_activity"), // minutes per week
  notes: text("notes"),
});

export const insertWellnessMetricSchema = createInsertSchema(wellnessMetrics).omit({
  id: true,
  recordDate: true,
});

export type WellnessProgram = typeof wellnessPrograms.$inferSelect;
export type InsertWellnessProgram = z.infer<typeof insertWellnessProgramSchema>;

export type WellnessEnrollment = typeof wellnessEnrollments.$inferSelect;
export type InsertWellnessEnrollment = z.infer<typeof insertWellnessEnrollmentSchema>;

export type WellnessMetric = typeof wellnessMetrics.$inferSelect;
export type InsertWellnessMetric = z.infer<typeof insertWellnessMetricSchema>;

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  priority: text("priority").notNull().default("normal"),
  targetDepartments: jsonb("target_departments").default([]),
  translations: jsonb("translations").default({}),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

// Performance Reviews
export const performanceReviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  period: text("period").notNull(),
  overallRating: integer("overall_rating"),
  goals: jsonb("goals").default([]),
  strengths: text("strengths"),
  improvements: text("improvements"),
  comments: text("comments"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;

// Review Feedback (360-degree)
export const reviewFeedback = pgTable("review_feedback", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => performanceReviews.id).notNull(),
  feedbackFrom: integer("feedback_from").references(() => users.id).notNull(),
  relationship: text("relationship").notNull(),
  rating: integer("rating"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertReviewFeedbackSchema = createInsertSchema(reviewFeedback).omit({
  id: true,
  submittedAt: true,
});

export type ReviewFeedback = typeof reviewFeedback.$inferSelect;
export type InsertReviewFeedback = z.infer<typeof insertReviewFeedbackSchema>;

// Payroll Records
export const payrollRecords = pgTable("payroll_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  period: text("period").notNull(),
  baseSalary: real("base_salary").notNull(),
  bonus: real("bonus").default(0),
  deductions: real("deductions").default(0),
  netPay: real("net_pay").notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({
  id: true,
  createdAt: true,
});

export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;

// Saved Reports
export const savedReports = pgTable("saved_reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull(),
  filters: jsonb("filters").default({}),
  columns: jsonb("columns").default([]),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSavedReportSchema = createInsertSchema(savedReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SavedReport = typeof savedReports.$inferSelect;
export type InsertSavedReport = z.infer<typeof insertSavedReportSchema>;

// Recognitions (kudos/awards)
export const recognitions = pgTable("recognitions", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  badge: text("badge"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecognitionSchema = createInsertSchema(recognitions).omit({
  id: true,
  createdAt: true,
});

export type Recognition = typeof recognitions.$inferSelect;
export type InsertRecognition = z.infer<typeof insertRecognitionSchema>;

// Knowledge Base Articles
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").default([]),
  authorId: integer("author_id").references(() => users.id).notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  date: timestamp("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  hoursWorked: real("hours_worked"),
  status: text("status").notNull().default("present"),
  notes: text("notes"),
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

// Onboarding Templates
export const onboardingTemplates = pgTable("onboarding_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department"),
  description: text("description"),
  tasks: jsonb("tasks").default([]),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOnboardingTemplateSchema = createInsertSchema(onboardingTemplates).omit({
  id: true,
  createdAt: true,
});

export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type InsertOnboardingTemplate = z.infer<typeof insertOnboardingTemplateSchema>;

// VR Training Modules
export const vrTrainingModules = pgTable("vr_training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform").notNull().default("virti"),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  duration: integer("duration").notNull().default(30),
  objectives: jsonb("objectives").default([]),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  completionRate: real("completion_rate").default(0),
  avgScore: real("avg_score").default(0),
  externalModuleId: text("external_module_id"),
  launchUrl: text("launch_url"),
  embedUrl: text("embed_url"),
  environmentConfig: jsonb("environment_config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVrTrainingModuleSchema = createInsertSchema(vrTrainingModules).omit({ id: true, completionRate: true, avgScore: true, createdAt: true });
export type VrTrainingModule = typeof vrTrainingModules.$inferSelect;
export type InsertVrTrainingModule = z.infer<typeof insertVrTrainingModuleSchema>;

// VR Training Sessions
export const vrTrainingSessions = pgTable("vr_training_sessions", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => vrTrainingModules.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  status: text("status").notNull().default("not_started"),
  score: real("score"),
  timeSpent: integer("time_spent"),
  feedback: text("feedback"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  externalSessionId: text("external_session_id"),
  sessionUrl: text("session_url"),
  platformData: jsonb("platform_data").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVrTrainingSessionSchema = createInsertSchema(vrTrainingSessions).omit({ id: true, createdAt: true });
export type VrTrainingSession = typeof vrTrainingSessions.$inferSelect;
export type InsertVrTrainingSession = z.infer<typeof insertVrTrainingSessionSchema>;

// VR Platform Configurations
export const vrPlatformConfigs = pgTable("vr_platform_configs", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(),
  displayName: text("display_name").notNull(),
  apiEndpoint: text("api_endpoint"),
  apiKeyConfigured: boolean("api_key_configured").notNull().default(false),
  webhookSecret: text("webhook_secret"),
  settings: jsonb("settings").default({}),
  status: text("status").notNull().default("disconnected"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVrPlatformConfigSchema = createInsertSchema(vrPlatformConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type VrPlatformConfig = typeof vrPlatformConfigs.$inferSelect;
export type InsertVrPlatformConfig = z.infer<typeof insertVrPlatformConfigSchema>;

// Digital Twin Scenarios
export const digitalTwinScenarios = pgTable("digital_twin_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  scenarioType: text("scenario_type").notNull(),
  platform: text("platform").notNull().default("azure_digital_twins"),
  parameters: jsonb("parameters").default({}),
  results: jsonb("results").default({}),
  status: text("status").notNull().default("draft"),
  externalScenarioId: text("external_scenario_id"),
  simulationUrl: text("simulation_url"),
  dashboardUrl: text("dashboard_url"),
  platformConfig: jsonb("platform_config").default({}),
  simulationMetrics: jsonb("simulation_metrics").default({}),
  dataSources: jsonb("data_sources").default([]),
  employeeTwins: jsonb("employee_twins").default([]),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDigitalTwinScenarioSchema = createInsertSchema(digitalTwinScenarios).omit({ id: true, createdAt: true, updatedAt: true });
export type DigitalTwinScenario = typeof digitalTwinScenarios.$inferSelect;
export type InsertDigitalTwinScenario = z.infer<typeof insertDigitalTwinScenarioSchema>;

// Digital Twin Platform Configurations
export const dtPlatformConfigs = pgTable("dt_platform_configs", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(),
  displayName: text("display_name").notNull(),
  apiEndpoint: text("api_endpoint"),
  apiKeyConfigured: boolean("api_key_configured").notNull().default(false),
  webhookSecret: text("webhook_secret"),
  settings: jsonb("settings").default({}),
  status: text("status").notNull().default("disconnected"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDtPlatformConfigSchema = createInsertSchema(dtPlatformConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type DtPlatformConfig = typeof dtPlatformConfigs.$inferSelect;
export type InsertDtPlatformConfig = z.infer<typeof insertDtPlatformConfigSchema>;

// Emotion Analyses
export const emotionAnalyses = pgTable("emotion_analyses", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  burnoutScore: real("burnout_score").default(0),
  engagementScore: real("engagement_score").default(0),
  sentimentScore: real("sentiment_score").default(0),
  stressIndicators: jsonb("stress_indicators").default([]),
  recommendations: jsonb("recommendations").default([]),
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const insertEmotionAnalysisSchema = createInsertSchema(emotionAnalyses).omit({ id: true, analyzedAt: true });
export type EmotionAnalysis = typeof emotionAnalyses.$inferSelect;
export type InsertEmotionAnalysis = z.infer<typeof insertEmotionAnalysisSchema>;

// Talent Marketplace Projects
export const talentMarketplaceProjects = pgTable("talent_marketplace_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  department: text("department"),
  requiredSkills: jsonb("required_skills").default([]),
  projectType: text("project_type").notNull().default("project"),
  duration: text("duration"),
  status: text("status").notNull().default("open"),
  maxParticipants: integer("max_participants").default(5),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTalentMarketplaceProjectSchema = createInsertSchema(talentMarketplaceProjects).omit({ id: true, createdAt: true });
export type TalentMarketplaceProject = typeof talentMarketplaceProjects.$inferSelect;
export type InsertTalentMarketplaceProject = z.infer<typeof insertTalentMarketplaceProjectSchema>;

// Talent Marketplace Applications
export const talentMarketplaceApplications = pgTable("talent_marketplace_applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => talentMarketplaceProjects.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  motivation: text("motivation"),
  skills: jsonb("skills").default([]),
  status: text("status").notNull().default("pending"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
});

export const insertTalentMarketplaceApplicationSchema = createInsertSchema(talentMarketplaceApplications).omit({ id: true, appliedAt: true });
export type TalentMarketplaceApplication = typeof talentMarketplaceApplications.$inferSelect;
export type InsertTalentMarketplaceApplication = z.infer<typeof insertTalentMarketplaceApplicationSchema>;

// Resignation Risk Assessments
export const resignationRiskAssessments = pgTable("resignation_risk_assessments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  riskScore: real("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  factors: jsonb("factors").default([]),
  recommendations: jsonb("recommendations").default([]),
  assessedAt: timestamp("assessed_at").notNull().defaultNow(),
});

export const insertResignationRiskAssessmentSchema = createInsertSchema(resignationRiskAssessments).omit({ id: true, assessedAt: true });
export type ResignationRiskAssessment = typeof resignationRiskAssessments.$inferSelect;
export type InsertResignationRiskAssessment = z.infer<typeof insertResignationRiskAssessmentSchema>;

// Policy Compliance Checks
export const policyComplianceChecks = pgTable("policy_compliance_checks", {
  id: serial("id").primaryKey(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(),
  content: text("content"),
  complianceScore: real("compliance_score"),
  violations: jsonb("violations").default([]),
  suggestions: jsonb("suggestions").default([]),
  status: text("status").notNull().default("pending"),
  checkedBy: integer("checked_by").references(() => users.id),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const insertPolicyComplianceCheckSchema = createInsertSchema(policyComplianceChecks).omit({ id: true, checkedAt: true });
export type PolicyComplianceCheck = typeof policyComplianceChecks.$inferSelect;
export type InsertPolicyComplianceCheck = z.infer<typeof insertPolicyComplianceCheckSchema>;

// Career Paths
export const careerPaths = pgTable("career_paths", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  currentRole: text("current_role").notNull(),
  targetRole: text("target_role").notNull(),
  currentSkills: jsonb("current_skills").default([]),
  requiredSkills: jsonb("required_skills").default([]),
  skillGaps: jsonb("skill_gaps").default([]),
  milestones: jsonb("milestones").default([]),
  progress: real("progress").default(0),
  estimatedTimeMonths: integer("estimated_time_months"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCareerPathSchema = createInsertSchema(careerPaths).omit({ id: true, createdAt: true, updatedAt: true });
export type CareerPath = typeof careerPaths.$inferSelect;
export type InsertCareerPath = z.infer<typeof insertCareerPathSchema>;

// Onboarding Buddies
export const onboardingBuddies = pgTable("onboarding_buddies", {
  id: serial("id").primaryKey(),
  newHireId: integer("new_hire_id").references(() => employees.id).notNull(),
  buddyId: integer("buddy_id").references(() => employees.id).notNull(),
  status: text("status").notNull().default("active"),
  matchScore: real("match_score"),
  matchReasons: jsonb("match_reasons").default([]),
  feedback: text("feedback"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
});

export const insertOnboardingBuddySchema = createInsertSchema(onboardingBuddies).omit({ id: true });
export type OnboardingBuddy = typeof onboardingBuddies.$inferSelect;
export type InsertOnboardingBuddy = z.infer<typeof insertOnboardingBuddySchema>;

// AI Learning Logs (for self-improving AI)
export const aiLearningLogs = pgTable("ai_learning_logs", {
  id: serial("id").primaryKey(),
  interactionType: text("interaction_type").notNull(),
  query: text("query").notNull(),
  response: text("response"),
  feedback: text("feedback"),
  rating: integer("rating"),
  improved: boolean("improved").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiLearningLogSchema = createInsertSchema(aiLearningLogs).omit({ id: true, createdAt: true });
export type AiLearningLog = typeof aiLearningLogs.$inferSelect;
export type InsertAiLearningLog = z.infer<typeof insertAiLearningLogSchema>;

// ===================== PHASE 7 FEATURES =====================

// AI Interview Coach
export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id),
  employeeId: integer("employee_id").references(() => employees.id),
  sessionType: text("session_type").notNull().default("mock"),
  jobRole: text("job_role").notNull(),
  difficulty: text("difficulty").notNull().default("intermediate"),
  questions: jsonb("questions").default([]),
  answers: jsonb("answers").default([]),
  feedback: jsonb("feedback").default({}),
  overallScore: real("overall_score"),
  communicationScore: real("communication_score"),
  technicalScore: real("technical_score"),
  confidenceScore: real("confidence_score"),
  status: text("status").notNull().default("scheduled"),
  duration: integer("duration"),
  aiRecommendations: jsonb("ai_recommendations").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({ id: true, createdAt: true });
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;

// Predictive Workforce Planning
export const workforceForecasts = pgTable("workforce_forecasts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  forecastType: text("forecast_type").notNull(),
  timeframeMonths: integer("timeframe_months").notNull().default(12),
  department: text("department"),
  currentMetrics: jsonb("current_metrics").default({}),
  projections: jsonb("projections").default({}),
  recommendations: jsonb("recommendations").default([]),
  assumptions: jsonb("assumptions").default([]),
  confidenceLevel: real("confidence_level"),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkforceForecastSchema = createInsertSchema(workforceForecasts).omit({ id: true, createdAt: true, updatedAt: true });
export type WorkforceForecast = typeof workforceForecasts.$inferSelect;
export type InsertWorkforceForecast = z.infer<typeof insertWorkforceForecastSchema>;

// Sentiment Dashboard
export const sentimentAnalyses = pgTable("sentiment_analyses", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  department: text("department"),
  sentimentScore: real("sentiment_score").notNull(),
  mood: text("mood").notNull(),
  keywords: jsonb("keywords").default([]),
  themes: jsonb("themes").default([]),
  employeeCount: integer("employee_count"),
  details: jsonb("details").default({}),
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const insertSentimentAnalysisSchema = createInsertSchema(sentimentAnalyses).omit({ id: true, analyzedAt: true });
export type SentimentAnalysis = typeof sentimentAnalyses.$inferSelect;
export type InsertSentimentAnalysis = z.infer<typeof insertSentimentAnalysisSchema>;

// Chatbot Conversations
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  messages: jsonb("messages").default([]),
  resolved: boolean("resolved").notNull().default(false),
  satisfaction: integer("satisfaction"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({ id: true, createdAt: true, updatedAt: true });
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;

// Multi-Copilot Conversations (Phase B)
export const copilotConversations = pgTable("copilot_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  copilotKey: text("copilot_key").notNull(), // chro | manager | recruiter | employee | strategy | learning | compliance
  title: text("title").notNull().default("New conversation"),
  messages: jsonb("messages").default([]).notNull(), // [{role, content, ts, sources?}]
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertCopilotConversationSchema = createInsertSchema(copilotConversations).omit({ id: true, createdAt: true, updatedAt: true });
export type CopilotConversation = typeof copilotConversations.$inferSelect;
export type InsertCopilotConversation = z.infer<typeof insertCopilotConversationSchema>;

// Peer Recognition
export const peerRecognitions = pgTable("peer_recognitions", {
  id: serial("id").primaryKey(),
  fromEmployeeId: integer("from_employee_id").references(() => employees.id).notNull(),
  toEmployeeId: integer("to_employee_id").references(() => employees.id).notNull(),
  category: text("category").notNull(),
  badge: text("badge"),
  message: text("message").notNull(),
  points: integer("points").notNull().default(10),
  isPublic: boolean("is_public").notNull().default(true),
  reactions: jsonb("reactions").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPeerRecognitionSchema = createInsertSchema(peerRecognitions).omit({ id: true, createdAt: true });
export type PeerRecognition = typeof peerRecognitions.$inferSelect;
export type InsertPeerRecognition = z.infer<typeof insertPeerRecognitionSchema>;

// Learning Courses
export const learningCourses = pgTable("learning_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  provider: text("provider"),
  url: text("url"),
  durationHours: real("duration_hours"),
  skills: jsonb("skills").default([]),
  difficulty: text("difficulty").notNull().default("beginner"),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  department: text("department"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLearningCourseSchema = createInsertSchema(learningCourses).omit({ id: true, createdAt: true });
export type LearningCourse = typeof learningCourses.$inferSelect;
export type InsertLearningCourse = z.infer<typeof insertLearningCourseSchema>;

// Learning Enrollments
export const learningEnrollments = pgTable("learning_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => learningCourses.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  status: text("status").notNull().default("enrolled"),
  progress: real("progress").notNull().default(0),
  score: real("score"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  certificateUrl: text("certificate_url"),
});

export const insertLearningEnrollmentSchema = createInsertSchema(learningEnrollments).omit({ id: true });
export type LearningEnrollment = typeof learningEnrollments.$inferSelect;
export type InsertLearningEnrollment = z.infer<typeof insertLearningEnrollmentSchema>;

// Offer Letter Templates
export const offerLetterTemplates = pgTable("offer_letter_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateType: text("template_type").notNull(),
  content: text("content").notNull(),
  variables: jsonb("variables").default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferLetterTemplateSchema = createInsertSchema(offerLetterTemplates).omit({ id: true, createdAt: true });
export type OfferLetterTemplate = typeof offerLetterTemplates.$inferSelect;
export type InsertOfferLetterTemplate = z.infer<typeof insertOfferLetterTemplateSchema>;

// Generated Offers
export const generatedOffers = pgTable("generated_offers", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => offerLetterTemplates.id),
  candidateId: integer("candidate_id").references(() => candidates.id),
  candidateName: text("candidate_name").notNull(),
  jobTitle: text("job_title").notNull(),
  department: text("department"),
  salary: text("salary"),
  startDate: text("start_date"),
  generatedContent: text("generated_content").notNull(),
  variables: jsonb("variables").default({}),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  signedAt: timestamp("signed_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGeneratedOfferSchema = createInsertSchema(generatedOffers).omit({ id: true, createdAt: true });
export type GeneratedOffer = typeof generatedOffers.$inferSelect;
export type InsertGeneratedOffer = z.infer<typeof insertGeneratedOfferSchema>;

// Compliance Reports
export const complianceReports = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  name: text("name").notNull(),
  period: text("period").notNull(),
  findings: jsonb("findings").default([]),
  metrics: jsonb("metrics").default({}),
  riskLevel: text("risk_level"),
  recommendations: jsonb("recommendations").default([]),
  status: text("status").notNull().default("generated"),
  generatedBy: integer("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({ id: true, generatedAt: true });
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;

// Shifts
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  shiftDate: text("shift_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  shiftType: text("shift_type").notNull().default("regular"),
  department: text("department"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true, createdAt: true });
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

// Shift Swap Requests
export const shiftSwapRequests = pgTable("shift_swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => employees.id).notNull(),
  shiftId: integer("shift_id").references(() => shifts.id).notNull(),
  targetEmployeeId: integer("target_employee_id").references(() => employees.id),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShiftSwapRequestSchema = createInsertSchema(shiftSwapRequests).omit({ id: true, createdAt: true });
export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;
export type InsertShiftSwapRequest = z.infer<typeof insertShiftSwapRequestSchema>;

// Anonymous Feedback
export const anonymousFeedbacks = pgTable("anonymous_feedbacks", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  department: text("department"),
  severity: text("severity").notNull().default("medium"),
  aiCategory: text("ai_category"),
  aiSentiment: text("ai_sentiment"),
  aiRoutedTo: text("ai_routed_to"),
  status: text("status").notNull().default("new"),
  adminResponse: text("admin_response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnonymousFeedbackSchema = createInsertSchema(anonymousFeedbacks).omit({ id: true, createdAt: true });
export type AnonymousFeedback = typeof anonymousFeedbacks.$inferSelect;
export type InsertAnonymousFeedback = z.infer<typeof insertAnonymousFeedbackSchema>;

// One-on-One Meetings
export const oneOnOneMeetings = pgTable("one_on_one_meetings", {
  id: serial("id").primaryKey(),
  managerId: integer("manager_id").references(() => employees.id).notNull(),
  reportId: integer("report_id").references(() => employees.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(30),
  agenda: jsonb("agenda").default([]),
  notes: text("notes"),
  actionItems: jsonb("action_items").default([]),
  aiSummary: text("ai_summary"),
  mood: text("mood"),
  status: text("status").notNull().default("scheduled"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOneOnOneMeetingSchema = createInsertSchema(oneOnOneMeetings).omit({ id: true, createdAt: true });
export type OneOnOneMeeting = typeof oneOnOneMeetings.$inferSelect;
export type InsertOneOnOneMeeting = z.infer<typeof insertOneOnOneMeetingSchema>;

// Autopilot Policies — per-org rules for which workflows run autonomously
export const autopilotPolicies = pgTable("autopilot_policies", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  workflowKey: text("workflow_key").notNull(),
  mode: text("mode").notNull().default("manual"), // manual | suggest | auto
  config: jsonb("config").default({}),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertAutopilotPolicySchema = createInsertSchema(autopilotPolicies).omit({ id: true, createdAt: true, updatedAt: true });
export type AutopilotPolicy = typeof autopilotPolicies.$inferSelect;
export type InsertAutopilotPolicy = z.infer<typeof insertAutopilotPolicySchema>;

// Autopilot Actions — every autonomous decision the AI makes/proposes
export const autopilotActions = pgTable("autopilot_actions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  workflowKey: text("workflow_key").notNull(),
  mode: text("mode").notNull(), // suggest | auto
  status: text("status").notNull().default("pending"), // pending | approved | rejected | executed | failed
  title: text("title").notNull(),
  summary: text("summary"),
  input: jsonb("input").default({}),
  output: jsonb("output").default({}),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  decidedBy: text("decided_by").notNull().default("ai"), // ai | human
  approverUserId: integer("approver_user_id").references(() => users.id),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});
export const insertAutopilotActionSchema = createInsertSchema(autopilotActions).omit({ id: true, createdAt: true, completedAt: true });
export type AutopilotAction = typeof autopilotActions.$inferSelect;
export type InsertAutopilotAction = z.infer<typeof insertAutopilotActionSchema>;

// Autopilot Kill-Switch — global per-org pause
export const autopilotKillSwitches = pgTable("autopilot_kill_switches", {
  organizationId: integer("organization_id").references(() => organizations.id).primaryKey(),
  paused: boolean("paused").notNull().default(false),
  pausedBy: integer("paused_by").references(() => users.id),
  pausedAt: timestamp("paused_at"),
  reason: text("reason"),
});
export type AutopilotKillSwitch = typeof autopilotKillSwitches.$inferSelect;
