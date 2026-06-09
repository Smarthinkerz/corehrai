import { db } from "./db";
import {
  users, departments, employees, candidates, hrTasks,
  complianceRecords, engagementSurveys, activityLogs,
  jobPostings, wellnessPrograms, documents, organizations,
  announcements, notifications, leaveRequests, payrollRecords,
  recognitions, peerRecognitions, knowledgeArticles, learningCourses,
  learningEnrollments, performanceReviews, sentimentAnalyses,
  resignationRiskAssessments, autopilotPolicies, autopilotActions,
  attendanceRecords, wellnessMetrics, interviews, onboardingTemplates,
  offerLetterTemplates, generatedOffers, complianceReports,
  policyComplianceChecks, careerPaths, oneOnOneMeetings,
  chatbotConversations, emotionAnalyses, talentMarketplaceProjects,
  workforceForecasts, savedReports, aiLearningLogs,
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log("[SEED] Checking if database needs seeding...");

  // Ensure default organization exists and backfill org_id on legacy rows
  const existingOrgs = await db.select().from(organizations);
  let defaultOrgId: number;
  if (existingOrgs.length === 0) {
    const [org] = await db.insert(organizations).values({
      name: "SmartHinkerz Corp",
      slug: "smarthinkerz",
      plan: "ai_intelligence",
    } as any).returning();
    defaultOrgId = org.id;
  } else {
    defaultOrgId = existingOrgs[0].id;
  }

  await db.execute(sql`UPDATE users SET organization_id = ${defaultOrgId} WHERE organization_id IS NULL`);
  await db.execute(sql`UPDATE employees SET organization_id = ${defaultOrgId} WHERE organization_id IS NULL`);
  await db.execute(sql`UPDATE candidates SET organization_id = ${defaultOrgId} WHERE organization_id IS NULL`);
  await db.execute(sql`UPDATE departments SET organization_id = ${defaultOrgId} WHERE organization_id IS NULL`);
  await db.execute(sql`UPDATE hr_tasks SET organization_id = ${defaultOrgId} WHERE organization_id IS NULL`);
  await db.execute(sql`UPDATE documents SET organization_id = ${defaultOrgId} WHERE organization_id IS NULL`);

  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("[SEED] Database already has data, skipping seed.");
    return;
  }

  console.log("[SEED] Seeding database with initial data...");

  const hashedPassword = await hashPassword("Welcome1!");

  const [adminUser] = await db.insert(users).values([
    { username: "sarah.johnson", password: hashedPassword, email: "sarah.johnson@company.com", fullName: "Sarah Johnson", role: "admin", department: "HR" },
    { username: "michael.brown", password: hashedPassword, email: "michael.brown@company.com", fullName: "Michael Brown", role: "manager", department: "Engineering" },
    { username: "lisa.chen", password: hashedPassword, email: "lisa.chen@company.com", fullName: "Lisa Chen", role: "manager", department: "Marketing" },
    { username: "james.wilson", password: hashedPassword, email: "james.wilson@company.com", fullName: "James Wilson", role: "user", department: "Sales" },
  ]).returning();

  const deptData = await db.insert(departments).values([
    { name: "Engineering", headCount: 34, budget: 450000, engagementScore: 82 },
    { name: "Marketing", headCount: 12, budget: 250000, engagementScore: 76 },
    { name: "Sales", headCount: 18, budget: 350000, engagementScore: 80 },
    { name: "HR", headCount: 8, budget: 180000, engagementScore: 90 },
    { name: "Product", headCount: 15, budget: 320000, engagementScore: 85 },
    { name: "Design", headCount: 9, budget: 210000, engagementScore: 82 },
    { name: "Customer Support", headCount: 16, budget: 280000, engagementScore: 78 },
    { name: "Finance", headCount: 7, budget: 190000, engagementScore: 74 },
  ]).returning();

  const empData = await db.insert(employees).values([
    { userId: adminUser.id, fullName: "Sarah Johnson", email: "sarah.johnson@company.com", phone: "+1 (555) 100-0001", position: "HR Director", department: "HR", hireDate: new Date("2019-03-15"), manager: "CEO", status: "active", salary: 130000, performanceScore: 92, engagementScore: 95 },
    { fullName: "Michael Brown", email: "michael.brown@company.com", phone: "+1 (555) 100-0002", position: "Engineering Manager", department: "Engineering", hireDate: new Date("2020-01-10"), manager: "CTO", status: "active", salary: 140000, performanceScore: 88, engagementScore: 85 },
    { fullName: "Lisa Chen", email: "lisa.chen@company.com", phone: "+1 (555) 100-0003", position: "Marketing Director", department: "Marketing", hireDate: new Date("2020-06-20"), manager: "CMO", status: "active", salary: 125000, performanceScore: 90, engagementScore: 82 },
    { fullName: "James Wilson", email: "james.wilson@company.com", phone: "+1 (555) 100-0004", position: "Sales Lead", department: "Sales", hireDate: new Date("2021-02-01"), manager: "VP Sales", status: "active", salary: 105000, performanceScore: 85, engagementScore: 78 },
    { fullName: "Emily Davis", email: "emily.davis@company.com", phone: "+1 (555) 100-0005", position: "Senior Developer", department: "Engineering", hireDate: new Date("2021-06-15"), manager: "Michael Brown", status: "active", salary: 115000, performanceScore: 91, engagementScore: 88 },
    { fullName: "David Park", email: "david.park@company.com", phone: "+1 (555) 100-0006", position: "Product Manager", department: "Product", hireDate: new Date("2021-09-01"), manager: "VP Product", status: "active", salary: 120000, performanceScore: 87, engagementScore: 84 },
    { fullName: "Rachel Kim", email: "rachel.kim@company.com", phone: "+1 (555) 100-0007", position: "UX Designer", department: "Design", hireDate: new Date("2022-01-15"), manager: "Design Lead", status: "active", salary: 100000, performanceScore: 89, engagementScore: 86 },
    { fullName: "Carlos Rivera", email: "carlos.rivera@company.com", phone: "+1 (555) 100-0008", position: "Support Manager", department: "Customer Support", hireDate: new Date("2020-11-05"), manager: "VP Operations", status: "active", salary: 90000, performanceScore: 83, engagementScore: 80 },
  ]).returning();

  await db.insert(candidates).values([
    { fullName: "Alex Taylor", email: "alex.taylor@example.com", phone: "+1 (555) 111-2233", position: "Frontend Developer", department: "Engineering", status: "screening", aiScore: 87, source: "LinkedIn", notes: "Strong React skills, 5 years of experience" },
    { fullName: "Jordan Smith", email: "jordan.smith@example.com", phone: "+1 (555) 444-5566", position: "Content Strategist", department: "Marketing", status: "interview", aiScore: 92, source: "Internal Referral", notes: "Previously worked at a major content agency" },
    { fullName: "Morgan Patel", email: "morgan.patel@example.com", phone: "+1 (555) 777-8899", position: "UI/UX Designer", department: "Design", status: "offer", aiScore: 95, source: "Design Conference", notes: "Exceptional portfolio" },
    { fullName: "Casey Brown", email: "casey.brown@example.com", phone: "+1 (555) 222-3344", position: "Backend Developer", department: "Engineering", status: "new", aiScore: null, source: "Job Board", notes: "Applied recently" },
    { fullName: "Taylor Green", email: "taylor.green@example.com", phone: "+1 (555) 333-4455", position: "Data Analyst", department: "Product", status: "interview", aiScore: 78, source: "University Career Fair", notes: "Strong analytical background" },
  ]);

  await db.insert(hrTasks).values([
    { taskName: "Review Q2 performance evaluations", status: "in-progress", category: "performance", description: "Complete review of Q2 performance evaluations for Engineering team", dueDate: new Date(Date.now() + 5 * 86400000), assignedTo: adminUser.id, priority: "high" },
    { taskName: "Update employee handbook", status: "pending", category: "documentation", description: "Update the employee handbook with new remote work policies", dueDate: new Date(Date.now() + 14 * 86400000), assignedTo: adminUser.id, priority: "medium" },
    { taskName: "Schedule training session", status: "completed", category: "training", description: "Schedule diversity and inclusion training session", dueDate: new Date(Date.now() - 2 * 86400000), assignedTo: adminUser.id, priority: "medium" },
    { taskName: "Prepare new hire onboarding", status: "in-progress", category: "onboarding", description: "Prepare onboarding materials for new Marketing team members", dueDate: new Date(Date.now() + 3 * 86400000), assignedTo: adminUser.id, priority: "high" },
    { taskName: "Review benefits package", status: "pending", category: "benefits", description: "Review and update employee benefits package for the next fiscal year", dueDate: new Date(Date.now() + 30 * 86400000), assignedTo: adminUser.id, priority: "low" },
  ]);

  await db.insert(complianceRecords).values([
    { employeeId: empData[0].id, documentType: "certification", documentName: "SHRM Certification", status: "verified", expiryDate: new Date(Date.now() + 180 * 86400000), verifiedBy: adminUser.id, verificationDate: new Date() },
    { employeeId: empData[1].id, documentType: "training", documentName: "Security Awareness Training", status: "verified", expiryDate: new Date(Date.now() + 90 * 86400000), verifiedBy: adminUser.id, verificationDate: new Date() },
    { employeeId: empData[2].id, documentType: "policy", documentName: "Code of Conduct Acknowledgment", status: "pending", expiryDate: new Date(Date.now() + 30 * 86400000) },
    { employeeId: empData[3].id, documentType: "certification", documentName: "Sales Compliance Certification", status: "expired", expiryDate: new Date(Date.now() - 15 * 86400000) },
    { employeeId: empData[4].id, documentType: "training", documentName: "Data Privacy Training", status: "verified", expiryDate: new Date(Date.now() + 120 * 86400000), verifiedBy: adminUser.id, verificationDate: new Date() },
  ]);

  await db.insert(engagementSurveys).values([
    { title: "Q2 Employee Satisfaction Survey", description: "Quarterly survey to measure employee satisfaction and engagement across all departments", startDate: new Date(Date.now() - 7 * 86400000), endDate: new Date(Date.now() + 14 * 86400000), status: "active", createdBy: adminUser.id, questions: JSON.stringify([
      { id: 1, text: "How satisfied are you with your current role?", type: "rating" },
      { id: 2, text: "How would you rate your work-life balance?", type: "rating" },
      { id: 3, text: "Do you feel recognized for your contributions?", type: "rating" },
      { id: 4, text: "What improvements would you suggest?", type: "text" },
    ]) },
    { title: "Remote Work Experience Survey", description: "Survey to assess the remote work experience and identify areas for improvement", startDate: new Date(Date.now() + 7 * 86400000), endDate: new Date(Date.now() + 21 * 86400000), status: "draft", createdBy: adminUser.id, questions: JSON.stringify([
      { id: 1, text: "How productive do you feel working remotely?", type: "rating" },
      { id: 2, text: "Do you have adequate tools and resources?", type: "rating" },
      { id: 3, text: "How connected do you feel to your team?", type: "rating" },
    ]) },
  ]);

  await db.insert(jobPostings).values([
    { title: "Senior Frontend Developer", description: "Looking for an experienced frontend developer with React expertise", department: "Engineering", location: "Remote", type: "Full-time", status: "active", createdBy: adminUser.id, applicantCount: 12 },
    { title: "Marketing Coordinator", description: "Seeking a marketing coordinator to support campaign execution", department: "Marketing", location: "Hybrid", type: "Full-time", status: "active", createdBy: adminUser.id, applicantCount: 8 },
    { title: "Sales Representative", description: "Entry-level sales position with growth opportunities", department: "Sales", location: "On-site", type: "Full-time", status: "active", createdBy: adminUser.id, applicantCount: 15 },
  ]);

  await db.insert(wellnessPrograms).values([
    { title: "Mindfulness Meditation", description: "Daily guided meditation sessions to reduce stress and improve focus", category: "mental", startDate: new Date("2026-05-01"), endDate: new Date("2026-08-31"), location: "online", status: "active", organizer: "Dr. Sarah Johnson", contactEmail: "wellness@company.com", enrollmentCap: 100 },
    { title: "Fitness Challenge", description: "A 12-week fitness program designed to improve physical health", category: "physical", startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31"), location: "hybrid", status: "upcoming", organizer: "Alex Chen, Certified Trainer", contactEmail: "fitness@company.com", enrollmentCap: 50 },
    { title: "Financial Wellness Workshop", description: "Educational series on personal finance and retirement planning", category: "financial", startDate: new Date("2026-05-15"), endDate: new Date("2026-06-30"), location: "office", status: "active", organizer: "Michael Brown, Financial Planner", contactEmail: "finance@company.com", enrollmentCap: 75 },
    { title: "Team Building Activities", description: "Monthly team building events to foster connection and collaboration", category: "social", startDate: new Date("2026-04-01"), endDate: new Date("2026-12-31"), location: "hybrid", status: "active", organizer: "HR Department", contactEmail: "hr@company.com", enrollmentCap: 200 },
  ]);

  await db.insert(documents).values([
    { title: "Employee Handbook 2026", description: "Complete company policies and procedures", fileUrl: "/uploads/docs/handbook-2026.pdf", fileType: "pdf", fileSize: 2048000, category: "policies", department: "HR", isPublic: true, uploadedBy: adminUser.id, version: "3.0" },
    { title: "Remote Work Policy", description: "Guidelines for remote and hybrid work arrangements", fileUrl: "/uploads/docs/remote-work-policy.pdf", fileType: "pdf", fileSize: 512000, category: "policies", department: "HR", isPublic: true, uploadedBy: adminUser.id, version: "2.0" },
    { title: "Onboarding Checklist Template", description: "Standard checklist for new employee onboarding", fileUrl: "/uploads/docs/onboarding-checklist.pdf", fileType: "pdf", fileSize: 256000, category: "templates", department: "HR", isPublic: true, uploadedBy: adminUser.id, version: "1.5" },
  ]);

  await db.insert(activityLogs).values([
    { userId: adminUser.id, action: "CREATE", description: "System initialized with seed data", entityType: "system", entityId: 0 },
    { userId: adminUser.id, action: "CREATE", description: "Created initial departments", entityType: "department", entityId: 0 },
    { userId: adminUser.id, action: "CREATE", description: "Added initial employee records", entityType: "employee", entityId: 0 },
  ]);

  console.log("[SEED] Database seeded successfully!");
  console.log("[SEED] Admin login: sarah.johnson / Welcome1!");

  await seedAuxiliaryData();
}

/**
 * Populates any empty supplemental tables. Safe to run on every boot —
 * each table check uses a count query and skips inserts if rows exist.
 * This makes the demo experience rich without ever overwriting real data.
 */
export async function seedAuxiliaryData() {
  const orgRow = await db.select().from(organizations).limit(1);
  if (orgRow.length === 0) return;
  const orgId = orgRow[0].id;

  const empRows = await db.select().from(employees).limit(50);
  if (empRows.length === 0) return;
  const userRows = await db.select().from(users).limit(20);
  const adminId = userRows[0]?.id;
  if (!adminId) return;

  const fillIfEmpty = async <T>(name: string, table: any, rows: T[]) => {
    try {
      const existing = await db.select().from(table).limit(1);
      if (existing.length > 0) return;
      if (rows.length === 0) return;
      await db.insert(table).values(rows as any);
      console.log(`[SEED+] Populated ${name} (${rows.length} rows)`);
    } catch (e: any) {
      console.warn(`[SEED+] Failed to seed ${name}: ${e.message}`);
    }
  };

  const now = Date.now();
  const day = 86400000;

  // Announcements
  await fillIfEmpty("announcements", announcements, [
    { title: "Welcome to CoreHR AI", content: "We're excited to launch our new AI-powered HR platform. Explore the AI Copilots, Command Center, and Virtual Office.", category: "general", priority: "high", isPublished: true, publishedAt: new Date(now - 2 * day), createdBy: adminId },
    { title: "Q4 All-Hands Meeting", content: "Join us this Friday at 2 PM for the quarterly all-hands meeting. Agenda includes Q4 results, 2026 roadmap, and a fireside chat with leadership.", category: "event", priority: "normal", isPublished: true, publishedAt: new Date(now - 5 * day), createdBy: adminId },
    { title: "New Wellness Program: Mindfulness Mondays", content: "Starting next week, join optional 15-minute guided meditation sessions every Monday at 9 AM.", category: "wellness", priority: "normal", isPublished: true, publishedAt: new Date(now - 7 * day), createdBy: adminId },
    { title: "Open Enrollment Period", content: "Annual benefits open enrollment runs through end of month. Visit Self-Service > Benefits to make changes.", category: "benefits", priority: "high", isPublished: true, publishedAt: new Date(now - day), createdBy: adminId },
  ]);

  // Notifications
  const notifRows = userRows.flatMap(u => ([
    { userId: u.id, title: "Welcome!", message: "Your CoreHR AI account is ready. Take the product tour from the help menu.", type: "info" },
    { userId: u.id, title: "Action required: Review pending", message: "You have 2 performance review tasks awaiting your input.", type: "warning", link: "/performance-reviews" },
    { userId: u.id, title: "Recognition received", message: "A peer recognized your contribution this week. View it in the Recognition tab.", type: "success", link: "/peer-recognition" },
  ]));
  await fillIfEmpty("notifications", notifications, notifRows);

  // Leave requests
  await fillIfEmpty("leaveRequests", leaveRequests, [
    { userId: userRows[0].id, type: "vacation", startDate: new Date(now + 14 * day), endDate: new Date(now + 21 * day), reason: "Family vacation", status: "pending" },
    { userId: userRows[1]?.id || adminId, type: "sick", startDate: new Date(now - 2 * day), endDate: new Date(now - day), reason: "Flu", status: "approved", reviewedBy: adminId, reviewedAt: new Date(now - day) },
    { userId: userRows[2]?.id || adminId, type: "personal", startDate: new Date(now + 5 * day), endDate: new Date(now + 6 * day), reason: "Doctor appointment", status: "approved", reviewedBy: adminId, reviewedAt: new Date() },
  ]);

  // Payroll records (current period for each employee)
  const period = new Date().toISOString().slice(0, 7);
  await fillIfEmpty("payrollRecords", payrollRecords, empRows.map(e => ({
    employeeId: e.id, period,
    baseSalary: (e as any).salary || 80000,
    bonus: Math.round(((e as any).performanceScore || 80) * 30),
    deductions: Math.round(((e as any).salary || 80000) * 0.22),
    netPay: Math.round(((e as any).salary || 80000) * 0.78 / 12),
    status: "paid", paidAt: new Date(now - 3 * day),
  })));

  // Recognitions
  await fillIfEmpty("recognitions", recognitions, empRows.slice(0, 6).map((e, i) => ({
    fromUserId: adminId,
    toUserId: (e as any).userId || adminId,
    category: ["teamwork", "innovation", "leadership", "customer-focus", "excellence", "mentorship"][i % 6],
    message: `Outstanding contribution to the team this quarter — your work on cross-functional initiatives stood out.`,
    badge: ["⭐ Star Player", "💡 Innovator", "🎯 Leader", "❤️ Customer Hero", "🏆 Excellence", "🤝 Mentor"][i % 6],
    isPublic: true,
  })));

  // Peer recognitions
  await fillIfEmpty("peerRecognitions", peerRecognitions, empRows.slice(0, 4).map((e, i) => ({
    fromEmployeeId: empRows[(i + 1) % empRows.length].id,
    toEmployeeId: e.id,
    badge: ["Team Player", "Innovator", "Mentor", "Problem Solver"][i % 4],
    message: "Always going above and beyond — thanks for the support last week!",
    visibility: "public",
  })));

  // Knowledge articles
  await fillIfEmpty("knowledgeArticles", knowledgeArticles, [
    { title: "How to request time off", content: "Navigate to Self-Service > Time Off, click 'New Request', select dates and type, then submit. Your manager will be notified automatically.", category: "policies", tags: ["time-off", "self-service"], authorId: adminId, isPublished: true },
    { title: "Setting up your workstation", content: "On day 1, IT will provision your laptop. Follow the welcome email to set up SSO, install required apps from the company portal, and connect to VPN.", category: "onboarding", tags: ["it", "setup"], authorId: adminId, isPublished: true },
    { title: "Performance review process", content: "Reviews happen quarterly. Self-assessment is due 1 week before manager 1:1. Use the SBI framework (Situation-Behavior-Impact) for examples.", category: "performance", tags: ["reviews"], authorId: adminId, isPublished: true },
    { title: "Remote work best practices", content: "Block focus time on your calendar, over-communicate in writing, and join video calls with camera on for team meetings.", category: "guides", tags: ["remote", "productivity"], authorId: adminId, isPublished: true },
    { title: "Submitting an expense report", content: "Use the Self-Service portal. Attach itemized receipts. Reports are reimbursed within 7 business days of approval.", category: "policies", tags: ["expenses", "finance"], authorId: adminId, isPublished: true },
  ]);

  // Learning courses
  const courseRows = await db.insert(learningCourses).values([
    { title: "Foundations of Inclusive Leadership", description: "A 4-week program for new and aspiring managers", category: "leadership", provider: "CoreHR Academy", durationHours: 8, skills: ["leadership", "inclusion", "feedback"], difficulty: "intermediate", isMandatory: false },
    { title: "GDPR & Data Privacy Essentials", description: "Mandatory annual training for all employees", category: "compliance", provider: "CoreHR Academy", durationHours: 1.5, skills: ["compliance", "privacy"], difficulty: "beginner", isMandatory: true },
    { title: "Effective 1:1 Meetings", description: "Best practices for managers and reports", category: "soft-skills", provider: "Internal", durationHours: 2, skills: ["communication", "management"], difficulty: "beginner", isMandatory: false },
    { title: "Advanced React Patterns", description: "Deep dive into hooks, suspense, and server components", category: "technical", provider: "Frontend Masters", durationHours: 12, skills: ["react", "javascript"], difficulty: "advanced", isMandatory: false, department: "Engineering" },
    { title: "Cybersecurity Awareness", description: "Phishing, password hygiene, and incident reporting", category: "security", provider: "KnowBe4", durationHours: 1, skills: ["security"], difficulty: "beginner", isMandatory: true },
  ]).returning().catch(() => [] as any[]);

  if (courseRows.length > 0) {
    await fillIfEmpty("learningEnrollments", learningEnrollments, empRows.flatMap(e =>
      courseRows.slice(0, 3).map((c, i) => ({
        courseId: c.id, employeeId: e.id,
        status: ["completed", "in_progress", "enrolled"][i % 3],
        progress: [100, 65, 0][i % 3],
        score: i === 0 ? 92 : null,
        completedAt: i === 0 ? new Date(now - 30 * day) : null,
      }))
    ));
  }

  // Performance reviews
  await fillIfEmpty("performanceReviews", performanceReviews, empRows.slice(0, 6).map(e => ({
    employeeId: e.id, reviewerId: adminId,
    period: "Q3 2026",
    overallRating: 4,
    goals: [
      { title: "Lead cross-functional project", status: "completed" },
      { title: "Improve team velocity by 20%", status: "in_progress" },
    ],
    strengths: "Strong technical execution, excellent team collaboration, and consistent delivery.",
    improvements: "Could benefit from more proactive stakeholder communication.",
    comments: "Solid quarter. On track for promotion review next cycle.",
    status: "completed",
  })));

  // Sentiment analyses
  const depts = ["Engineering", "Marketing", "Sales", "HR", "Product", "Design"];
  await fillIfEmpty("sentimentAnalyses", sentimentAnalyses, depts.map(d => ({
    source: "engagement-survey", department: d,
    sentimentScore: 0.55 + Math.random() * 0.35,
    mood: ["positive", "neutral", "very_positive"][Math.floor(Math.random() * 3)],
    keywords: ["growth", "collaboration", "workload", "recognition", "remote"],
    themes: ["work-life-balance", "career-growth", "team-dynamics"],
    employeeCount: 8 + Math.floor(Math.random() * 25),
    details: { topPositive: ["team support", "flexibility"], topConcerns: ["workload", "career path clarity"] },
  })));

  // Resignation risk assessments
  await fillIfEmpty("resignationRiskAssessments", resignationRiskAssessments, empRows.slice(0, 5).map((e, i) => ({
    employeeId: e.id,
    riskScore: [12, 28, 45, 68, 82][i % 5],
    riskLevel: ["low", "low", "medium", "high", "critical"][i % 5],
    factors: [
      { name: "Engagement score declining", weight: 0.3 },
      { name: "Tenure > 4 years without promotion", weight: 0.25 },
      { name: "Recent peer departures", weight: 0.2 },
    ],
    recommendations: [
      "Schedule stay interview within 2 weeks",
      "Discuss career growth path",
      "Review compensation benchmark",
    ],
  })));

  // Autopilot policies
  await fillIfEmpty("autopilotPolicies", autopilotPolicies, [
    { organizationId: orgId, workflowKey: "auto_approve_pto_under_3_days", mode: "auto", config: { maxDays: 3, requireBalance: true }, enabled: true },
    { organizationId: orgId, workflowKey: "auto_send_birthday_message", mode: "auto", config: {}, enabled: true },
    { organizationId: orgId, workflowKey: "auto_flag_high_resignation_risk", mode: "suggest", config: { threshold: 70 }, enabled: true },
    { organizationId: orgId, workflowKey: "auto_schedule_onboarding_buddy", mode: "auto", config: {}, enabled: true },
    { organizationId: orgId, workflowKey: "auto_compliance_reminders", mode: "auto", config: { daysBeforeExpiry: 30 }, enabled: true },
  ]);

  // Autopilot actions (recent feed)
  await fillIfEmpty("autopilotActions", autopilotActions, [
    { organizationId: orgId, workflowKey: "auto_approve_pto_under_3_days", mode: "auto", status: "executed", title: "Auto-approved 2-day PTO request", summary: "James Wilson — Aug 12-13, vacation balance sufficient", input: { employeeId: empRows[3]?.id, days: 2 }, output: { approved: true }, decidedBy: "ai", completedAt: new Date(now - 2 * 3600000) },
    { organizationId: orgId, workflowKey: "auto_flag_high_resignation_risk", mode: "suggest", status: "pending", title: "High resignation risk flagged", summary: "Emily Davis — risk score 78. Recommend stay interview.", input: { employeeId: empRows[4]?.id, score: 78 }, decidedBy: "ai" },
    { organizationId: orgId, workflowKey: "auto_send_birthday_message", mode: "auto", status: "executed", title: "Sent birthday message", summary: "Posted in #general for Carlos Rivera", decidedBy: "ai", completedAt: new Date(now - 8 * 3600000) },
    { organizationId: orgId, workflowKey: "auto_compliance_reminders", mode: "auto", status: "executed", title: "Sent 12 compliance reminders", summary: "Q4 mandatory training expiring within 30 days", decidedBy: "ai", completedAt: new Date(now - 12 * 3600000) },
  ]);

  // Attendance records
  await fillIfEmpty("attendanceRecords", attendanceRecords, empRows.flatMap(e =>
    [0, 1, 2, 3, 4].map(d => ({
      employeeId: e.id,
      date: new Date(now - d * day),
      clockIn: new Date(now - d * day - (8.5 - 9) * 3600000),
      clockOut: new Date(now - d * day - (17.5 - 9) * 3600000),
      status: "present",
      hoursWorked: 8 + Math.random() * 1.5,
    }))
  ));

  // Wellness metrics
  await fillIfEmpty("wellnessMetrics", wellnessMetrics, empRows.map(e => ({
    employeeId: e.id,
    stressLevel: 3 + Math.floor(Math.random() * 5),
    workLifeBalance: 5 + Math.floor(Math.random() * 4),
    satisfaction: 6 + Math.floor(Math.random() * 4),
    energyLevel: 5 + Math.floor(Math.random() * 5),
    physicalActivity: 90 + Math.floor(Math.random() * 200),
    notes: "Auto-collected from weekly wellness pulse",
  })));

  // Interviews — link to existing candidates if any
  const candRows = await db.select().from(candidates).limit(3).catch(() => [] as any[]);
  if (candRows.length > 0) {
    await fillIfEmpty("interviews", interviews, candRows.map((c: any, i: number) => ({
      candidateId: c.id,
      date: new Date(now + (i + 2) * day),
      interviewType: ["initial", "technical", "final"][i % 3],
      interviewers: "Sarah Johnson, Michael Brown",
      location: "video call",
      notes: ["Initial screening call", "Coding + system design", "Panel of 4"][i % 3],
      status: "scheduled",
    })));
  }

  // Onboarding templates
  await fillIfEmpty("onboardingTemplates", onboardingTemplates, [
    { name: "Engineering Onboarding", department: "Engineering", description: "30-60-90 day plan for new engineers", tasks: [
      { day: 1, title: "Set up dev environment", category: "setup" },
      { day: 3, title: "Complete first PR (docs typo)", category: "code" },
      { day: 14, title: "Pair with team lead on feature", category: "code" },
      { day: 30, title: "Ship first feature to production", category: "milestone" },
      { day: 60, title: "Lead a technical design discussion", category: "growth" },
      { day: 90, title: "Quarterly review with manager", category: "review" },
    ], createdBy: adminId },
    { name: "Standard New-Hire Onboarding", department: null, description: "Universal 30-day onboarding plan", tasks: [
      { day: 1, title: "Welcome lunch with team", category: "social" },
      { day: 1, title: "Complete I-9 + tax forms", category: "paperwork" },
      { day: 7, title: "Meet your onboarding buddy", category: "social" },
      { day: 14, title: "Complete compliance training", category: "compliance" },
      { day: 30, title: "30-day check-in with manager", category: "review" },
    ], createdBy: adminId },
  ]);

  // Offer letter templates
  const offerTemplateRows = await db.insert(offerLetterTemplates).values([
    { name: "Standard Full-Time Offer", templateType: "full-time", content: "Dear {{candidate_name}},\\n\\nWe are pleased to offer you the position of {{position}} at CoreHR AI, reporting to {{manager}}. Your start date will be {{start_date}} with an annual salary of {{salary}}.\\n\\nWelcome aboard!", variables: ["candidate_name", "position", "manager", "start_date", "salary"], isActive: true, createdBy: adminId },
    { name: "Internship Offer", templateType: "internship", content: "Dear {{candidate_name}},\\n\\nWe're excited to offer you a {{duration}}-week internship as a {{position}} starting {{start_date}}.", variables: ["candidate_name", "position", "duration", "start_date"], isActive: true, createdBy: adminId },
  ]).returning().catch(() => [] as any[]);

  // Compliance reports
  await fillIfEmpty("complianceReports", complianceReports, [
    { reportType: "GDPR_AUDIT", title: "Q3 GDPR Compliance Audit", findings: { passed: 47, failed: 2, warnings: 5 }, recommendations: ["Update data retention policy", "Quarterly DPO training"], status: "completed", generatedBy: adminId },
    { reportType: "SOC2", title: "SOC 2 Type II Readiness", findings: { passed: 89, failed: 0, warnings: 12 }, recommendations: ["Document incident response runbook"], status: "completed", generatedBy: adminId },
  ]);

  // Policy compliance checks
  await fillIfEmpty("policyComplianceChecks", policyComplianceChecks, [
    { documentName: "Remote Work Policy 2026", documentType: "policy", complianceScore: 0.92, violations: [], suggestions: ["Add section on async-first communication norms"], status: "passed", checkedBy: adminId },
    { documentName: "Code of Conduct", documentType: "policy", complianceScore: 0.95, violations: [], suggestions: ["Reference updated EEO laws"], status: "passed", checkedBy: adminId },
  ]);

  // Career paths
  await fillIfEmpty("careerPaths", careerPaths, empRows.slice(0, 4).map(e => ({
    employeeId: e.id,
    currentRole: (e as any).position || "Specialist",
    targetRole: "Senior " + ((e as any).position || "Specialist"),
    currentSkills: ["communication", "domain-expertise"],
    requiredSkills: ["leadership", "strategic-thinking", "mentoring"],
    skillGaps: ["leadership", "mentoring"],
    milestones: [
      { title: "Complete Inclusive Leadership course", target: "Q1 2026" },
      { title: "Mentor 1 junior team member", target: "Q2 2026" },
      { title: "Lead a cross-functional project", target: "Q3 2026" },
    ],
  })));

  // 1:1 meetings
  await fillIfEmpty("oneOnOneMeetings", oneOnOneMeetings, empRows.slice(0, 5).map(e => ({
    managerId: adminId,
    employeeId: e.id,
    scheduledAt: new Date(now + 7 * day),
    durationMinutes: 30,
    agenda: ["Career goals check-in", "Current blockers", "Feedback for manager"],
    notes: null,
    status: "scheduled",
  }))).catch(() => {});

  // Talent marketplace projects
  await fillIfEmpty("talentMarketplaceProjects", talentMarketplaceProjects, [
    { title: "AI Hackathon Mentor", description: "Looking for senior engineers to mentor junior teams during the Q4 AI hackathon", department: "Engineering", requiredSkills: ["python", "machine-learning"], projectType: "mentorship", duration: "2 weeks", maxParticipants: 4, status: "open", createdBy: adminId },
    { title: "Brand Refresh Working Group", description: "Cross-functional team to refresh CoreHR AI brand guidelines", department: "Marketing", requiredSkills: ["design", "writing"], projectType: "project", duration: "6 weeks", maxParticipants: 6, status: "open", createdBy: adminId },
    { title: "Onboarding Buddy Program Lead", description: "Run our buddy-pairing program for the next quarter", department: "HR", requiredSkills: ["mentoring", "operations"], projectType: "program", duration: "1 quarter", maxParticipants: 1, status: "open", createdBy: adminId },
  ]);

  // Workforce forecasts
  await fillIfEmpty("workforceForecasts", workforceForecasts, depts.map(d => ({
    department: d,
    forecastPeriod: "Q1 2026",
    currentHeadcount: 8 + Math.floor(Math.random() * 30),
    predictedAttrition: 1 + Math.floor(Math.random() * 4),
    predictedHires: 2 + Math.floor(Math.random() * 6),
    skillsGaps: ["AI/ML", "data-engineering", "product-strategy"],
    confidence: 0.7 + Math.random() * 0.25,
    recommendations: ["Upskill 3 mid-level engineers in ML", "Open req for senior data engineer"],
  }))).catch(() => {});

  // Saved reports
  await fillIfEmpty("savedReports", savedReports, [
    { name: "Monthly Headcount Trends", description: "Headcount by department, month-over-month", reportType: "headcount", filters: { groupBy: "department", interval: "month" }, columns: ["department", "month", "headcount"], createdBy: adminId, isShared: true },
    { name: "Q4 Engagement Snapshot", description: "Survey response rates + sentiment by team", reportType: "engagement", filters: { period: "Q4-2026" }, columns: ["team", "responseRate", "sentiment"], createdBy: adminId, isShared: true },
  ]);

  // AI learning logs
  await fillIfEmpty("aiLearningLogs", aiLearningLogs, [
    { sourceType: "feedback", sourceId: "fb_001", input: "User rejected suggested PTO approval", outcome: "model adjusted", confidence: 0.84, modelVersion: "gpt-5.4-mini" },
    { sourceType: "correction", sourceId: "corr_002", input: "Manager corrected sentiment classification", outcome: "training-set updated", confidence: 0.91, modelVersion: "gpt-5.4-mini" },
  ]).catch(() => {});

  // Emotion analyses
  await fillIfEmpty("emotionAnalyses", emotionAnalyses, empRows.slice(0, 5).map(e => ({
    employeeId: e.id,
    source: "1on1-transcript",
    primaryEmotion: ["calm", "engaged", "concerned", "enthusiastic", "neutral"][Math.floor(Math.random() * 5)],
    emotionScores: { joy: 0.4, sadness: 0.05, anger: 0.05, fear: 0.05, neutral: 0.45 },
    confidence: 0.75 + Math.random() * 0.2,
    insights: "Generally positive tone. Minor concerns around workload pacing.",
  }))).catch(() => {});
}
