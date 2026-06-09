import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI HR Agent API",
      version: "1.0.0",
      description: "Enterprise HR Management Platform API",
      contact: { name: "API Support", email: "support@aihr.agent" },
      license: { name: "Proprietary" },
    },
    servers: [
      { url: "/api", description: "API Server" },
    ],
    components: {
      securitySchemes: {
        session: { type: "apiKey", in: "cookie", name: "connect.sid" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" } } } },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
            hasMore: { type: "boolean" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            email: { type: "string" },
            fullName: { type: "string" },
            role: { type: "string", enum: ["admin", "hr_manager", "hr_specialist", "employee", "viewer"] },
          },
        },
        Employee: {
          type: "object",
          properties: {
            id: { type: "integer" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            position: { type: "string" },
            departmentId: { type: "integer" },
            status: { type: "string" },
            hireDate: { type: "string", format: "date" },
          },
        },
        Department: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            description: { type: "string" },
            managerId: { type: "integer" },
          },
        },
        Candidate: {
          type: "object",
          properties: {
            id: { type: "integer" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            status: { type: "string" },
            jobPostingId: { type: "integer" },
          },
        },
        JobPosting: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            departmentId: { type: "integer" },
          },
        },
      },
    },
    security: [{ session: [] }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management" },
      { name: "Employees", description: "Employee management" },
      { name: "Departments", description: "Department management" },
      { name: "Candidates", description: "Candidate tracking" },
      { name: "Job Postings", description: "Job posting management" },
      { name: "Interviews", description: "Interview scheduling" },
      { name: "Tasks", description: "HR task management" },
      { name: "Attendance", description: "Attendance tracking" },
      { name: "Payroll", description: "Payroll management" },
      { name: "Performance", description: "Performance reviews" },
      { name: "Learning", description: "Learning & development" },
      { name: "Wellness", description: "Wellness programs" },
      { name: "Surveys", description: "Employee surveys" },
      { name: "Recognition", description: "Employee recognition" },
      { name: "Compliance", description: "Compliance management" },
      { name: "Documents", description: "Document management" },
      { name: "Announcements", description: "Company announcements" },
      { name: "Notifications", description: "User notifications" },
      { name: "Analytics", description: "HR analytics" },
      { name: "AI", description: "AI-powered features" },
      { name: "Billing", description: "Billing & subscriptions" },
      { name: "Organizations", description: "Organization management" },
      { name: "GDPR", description: "Data privacy" },
      { name: "2FA", description: "Two-factor authentication" },
    ],
    paths: {
      "/login": { post: { tags: ["Auth"], summary: "Login", requestBody: { content: { "application/json": { schema: { type: "object", properties: { username: { type: "string" }, password: { type: "string" } }, required: ["username", "password"] } } } }, responses: { "200": { description: "Login successful" }, "401": { description: "Invalid credentials" } }, security: [] } },
      "/register": { post: { tags: ["Auth"], summary: "Register new user", requestBody: { content: { "application/json": { schema: { type: "object", properties: { username: { type: "string" }, password: { type: "string" }, email: { type: "string" }, fullName: { type: "string" } }, required: ["username", "password", "email", "fullName"] } } } }, responses: { "201": { description: "User created" } }, security: [] } },
      "/logout": { post: { tags: ["Auth"], summary: "Logout", responses: { "200": { description: "Logged out" } } } },
      "/user": { get: { tags: ["Auth"], summary: "Get current user", responses: { "200": { description: "Current user data", content: { "application/json": { schema: { "$ref": "#/components/schemas/User" } } } } } } },
      "/forgot-password": { post: { tags: ["Auth"], summary: "Request password reset", requestBody: { content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" } }, required: ["email"] } } } }, responses: { "200": { description: "Reset email sent" } }, security: [] } },
      "/verify-email": { post: { tags: ["Auth"], summary: "Verify email address", requestBody: { content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] } } } }, responses: { "200": { description: "Email verified" } } } },
      "/csrf-token": { get: { tags: ["Auth"], summary: "Get CSRF token", responses: { "200": { description: "CSRF token", content: { "application/json": { schema: { type: "object", properties: { csrfToken: { type: "string" } } } } } } }, security: [] } },
      "/2fa/setup": { post: { tags: ["2FA"], summary: "Setup 2FA", responses: { "200": { description: "QR code and secret" } } } },
      "/2fa/verify": { post: { tags: ["2FA"], summary: "Verify and enable 2FA", requestBody: { content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] } } } }, responses: { "200": { description: "2FA enabled" } } } },
      "/2fa/disable": { post: { tags: ["2FA"], summary: "Disable 2FA", requestBody: { content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] } } } }, responses: { "200": { description: "2FA disabled" } } } },
      "/2fa/status": { get: { tags: ["2FA"], summary: "Get 2FA status", responses: { "200": { description: "2FA status" } } } },
      "/users": { get: { tags: ["Users"], summary: "List users", parameters: [{ name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "User list" } } } },
      "/employees": { get: { tags: ["Employees"], summary: "List employees", parameters: [{ name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Employee list" } } }, post: { tags: ["Employees"], summary: "Create employee", requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Employee" } } } }, responses: { "201": { description: "Employee created" } } } },
      "/employees/{id}": { get: { tags: ["Employees"], summary: "Get employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Employee data" } } }, put: { tags: ["Employees"], summary: "Update employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Employee updated" } } }, delete: { tags: ["Employees"], summary: "Delete employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Employee deleted" } } } },
      "/departments": { get: { tags: ["Departments"], summary: "List departments", responses: { "200": { description: "Department list" } } }, post: { tags: ["Departments"], summary: "Create department", responses: { "201": { description: "Department created" } } } },
      "/departments/{id}": { get: { tags: ["Departments"], summary: "Get department", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Department data" } } }, put: { tags: ["Departments"], summary: "Update department", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Department updated" } } }, delete: { tags: ["Departments"], summary: "Delete department", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Department deleted" } } } },
      "/candidates": { get: { tags: ["Candidates"], summary: "List candidates", parameters: [{ name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Candidate list" } } }, post: { tags: ["Candidates"], summary: "Create candidate", responses: { "201": { description: "Candidate created" } } } },
      "/candidates/{id}": { get: { tags: ["Candidates"], summary: "Get candidate", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Candidate data" } } }, put: { tags: ["Candidates"], summary: "Update candidate", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Candidate updated" } } }, delete: { tags: ["Candidates"], summary: "Delete candidate", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Candidate deleted" } } } },
      "/job-postings": { get: { tags: ["Job Postings"], summary: "List job postings", responses: { "200": { description: "Job posting list" } } }, post: { tags: ["Job Postings"], summary: "Create job posting", responses: { "201": { description: "Job posting created" } } } },
      "/interviews": { get: { tags: ["Interviews"], summary: "List interviews", responses: { "200": { description: "Interview list" } } }, post: { tags: ["Interviews"], summary: "Create interview", responses: { "201": { description: "Interview created" } } } },
      "/tasks": { get: { tags: ["Tasks"], summary: "List tasks", responses: { "200": { description: "Task list" } } }, post: { tags: ["Tasks"], summary: "Create task", responses: { "201": { description: "Task created" } } } },
      "/attendance": { get: { tags: ["Attendance"], summary: "List attendance records", responses: { "200": { description: "Attendance list" } } }, post: { tags: ["Attendance"], summary: "Create record", responses: { "201": { description: "Record created" } } } },
      "/attendance/clock-in": { post: { tags: ["Attendance"], summary: "Clock in", responses: { "200": { description: "Clocked in" } } } },
      "/attendance/clock-out/{id}": { post: { tags: ["Attendance"], summary: "Clock out", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Clocked out" } } } },
      "/payroll": { get: { tags: ["Payroll"], summary: "List payroll records", responses: { "200": { description: "Payroll list" } } } },
      "/performance-reviews": { get: { tags: ["Performance"], summary: "List reviews", responses: { "200": { description: "Review list" } } }, post: { tags: ["Performance"], summary: "Create review", responses: { "201": { description: "Review created" } } } },
      "/surveys": { get: { tags: ["Surveys"], summary: "List surveys", responses: { "200": { description: "Survey list" } } }, post: { tags: ["Surveys"], summary: "Create survey", responses: { "201": { description: "Survey created" } } } },
      "/recognition": { get: { tags: ["Recognition"], summary: "List recognitions", responses: { "200": { description: "Recognition list" } } }, post: { tags: ["Recognition"], summary: "Create recognition", responses: { "201": { description: "Recognition created" } } } },
      "/wellness-programs": { get: { tags: ["Wellness"], summary: "List wellness programs", responses: { "200": { description: "Program list" } } }, post: { tags: ["Wellness"], summary: "Create program", responses: { "201": { description: "Program created" } } } },
      "/learning-dev/courses": { get: { tags: ["Learning"], summary: "List courses", responses: { "200": { description: "Course list" } } }, post: { tags: ["Learning"], summary: "Create course", responses: { "201": { description: "Course created" } } } },
      "/compliance": { get: { tags: ["Compliance"], summary: "List compliance records", responses: { "200": { description: "Compliance list" } } } },
      "/documents": { get: { tags: ["Documents"], summary: "List documents", responses: { "200": { description: "Document list" } } }, post: { tags: ["Documents"], summary: "Upload document", responses: { "201": { description: "Document uploaded" } } } },
      "/announcements": { get: { tags: ["Announcements"], summary: "List announcements", responses: { "200": { description: "Announcement list" } } }, post: { tags: ["Announcements"], summary: "Create announcement", responses: { "201": { description: "Announcement created" } } } },
      "/notifications": { get: { tags: ["Notifications"], summary: "List notifications", responses: { "200": { description: "Notification list" } } } },
      "/analytics/dashboard": { get: { tags: ["Analytics"], summary: "Get dashboard analytics", responses: { "200": { description: "Analytics data" } } } },
      "/ai/generate": { post: { tags: ["AI"], summary: "Generate AI content", responses: { "200": { description: "Generated content" } } } },
      "/billing/plans": { get: { tags: ["Billing"], summary: "List plans", responses: { "200": { description: "Available plans" } } } },
      "/billing/checkout": { post: { tags: ["Billing"], summary: "Create checkout session", responses: { "200": { description: "Checkout URL" } } } },
      "/organizations": { get: { tags: ["Organizations"], summary: "List organizations", responses: { "200": { description: "Organization list" } } }, post: { tags: ["Organizations"], summary: "Create organization", responses: { "201": { description: "Organization created" } } } },
      "/gdpr/export": { get: { tags: ["GDPR"], summary: "Export user data", responses: { "200": { description: "User data export" } } } },
      "/gdpr/delete-request": { post: { tags: ["GDPR"], summary: "Request data deletion", responses: { "200": { description: "Deletion scheduled" } } } },
      "/health": { get: { tags: ["Auth"], summary: "Health check", responses: { "200": { description: "Service healthy" } }, security: [] } },
      "/legal/terms": { get: { tags: ["Auth"], summary: "Terms of Service", responses: { "200": { description: "Terms document" } }, security: [] } },
      "/legal/privacy": { get: { tags: ["Auth"], summary: "Privacy Policy", responses: { "200": { description: "Privacy document" } }, security: [] } },
      "/legal/dpa": { get: { tags: ["Auth"], summary: "Data Processing Agreement", responses: { "200": { description: "DPA document" } }, security: [] } },
      "/self-service/profile": { put: { tags: ["Users"], summary: "Update own profile", responses: { "200": { description: "Profile updated" } } } },
      "/self-service/leave-requests": { get: { tags: ["Users"], summary: "List leave requests", responses: { "200": { description: "Leave request list" } } }, post: { tags: ["Users"], summary: "Create leave request", responses: { "201": { description: "Leave request created" } } } },
      "/shift-management": { get: { tags: ["Attendance"], summary: "List shifts", responses: { "200": { description: "Shift list" } } }, post: { tags: ["Attendance"], summary: "Create shift", responses: { "201": { description: "Shift created" } } } },
      "/knowledge-base": { get: { tags: ["Documents"], summary: "List articles", responses: { "200": { description: "Article list" } } }, post: { tags: ["Documents"], summary: "Create article", responses: { "201": { description: "Article created" } } } },
      "/talent-marketplace/projects": { get: { tags: ["Employees"], summary: "List marketplace projects", responses: { "200": { description: "Project list" } } } },
      "/offer-letters/generate": { post: { tags: ["Candidates"], summary: "Generate offer letter", responses: { "200": { description: "Offer letter generated" } } } },
      "/vr-training/modules": { get: { tags: ["Learning"], summary: "List VR training modules", responses: { "200": { description: "Module list" } } } },
      "/digital-twins/scenarios": { get: { tags: ["AI"], summary: "List digital twin scenarios", responses: { "200": { description: "Scenario list" } } } },
      "/emotion-ai/analyze": { post: { tags: ["AI"], summary: "Analyze employee emotions", responses: { "200": { description: "Analysis results" } } } },
      "/resignation-risk": { get: { tags: ["AI"], summary: "Get resignation risk assessments", responses: { "200": { description: "Risk data" } } } },
      "/sentiment-dashboard/analyze": { post: { tags: ["AI"], summary: "Analyze sentiment", responses: { "200": { description: "Sentiment data" } } } },
      "/hr-chatbot/ask": { post: { tags: ["AI"], summary: "Ask HR chatbot", responses: { "200": { description: "Chatbot response" } } } },
      "/career-paths": { get: { tags: ["Employees"], summary: "List career paths", responses: { "200": { description: "Career path list" } } } },
      "/peer-recognition": { get: { tags: ["Recognition"], summary: "List peer recognitions", responses: { "200": { description: "Peer recognition list" } } }, post: { tags: ["Recognition"], summary: "Create peer recognition", responses: { "201": { description: "Created" } } } },
      "/anonymous-feedback": { get: { tags: ["Surveys"], summary: "List anonymous feedback", responses: { "200": { description: "Feedback list" } } } },
      "/meeting-tracker": { get: { tags: ["Attendance"], summary: "List meetings", responses: { "200": { description: "Meeting list" } } }, post: { tags: ["Attendance"], summary: "Create meeting", responses: { "201": { description: "Meeting created" } } } },
      "/compliance-reports/generate": { post: { tags: ["Compliance"], summary: "Generate compliance report", responses: { "200": { description: "Report generated" } } } },
      "/workforce-planning/forecasts": { get: { tags: ["AI"], summary: "List workforce forecasts", responses: { "200": { description: "Forecast list" } } } },
      "/reports/saved": { get: { tags: ["Analytics"], summary: "List saved reports", responses: { "200": { description: "Report list" } } } },
      "/onboarding-workflows": { get: { tags: ["Employees"], summary: "List onboarding templates", responses: { "200": { description: "Template list" } } } },
      "/onboarding-buddies": { get: { tags: ["Employees"], summary: "List onboarding buddies", responses: { "200": { description: "Buddy list" } } } },
      "/policy-compliance/scan": { post: { tags: ["Compliance"], summary: "Scan policies", responses: { "200": { description: "Scan results" } } } },
      "/ai-learning/logs": { get: { tags: ["AI"], summary: "List AI learning logs", responses: { "200": { description: "Learning logs" } } }, post: { tags: ["AI"], summary: "Create learning log", responses: { "201": { description: "Log created" } } } },
      "/interview-coach/sessions": { get: { tags: ["AI"], summary: "List coaching sessions", responses: { "200": { description: "Session list" } } } },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  const uiOptions = {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "AI HR Agent API Documentation",
  };
  // Primary mount
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, uiOptions));
  // Backward-compat alias
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, uiOptions));
  app.get("/api/swagger.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.get("/api/openapi.json", (_req, res) => {
    res.json(swaggerSpec);
  });
}
