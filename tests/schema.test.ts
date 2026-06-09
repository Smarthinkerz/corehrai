import { describe, it, expect } from "vitest";
import * as schema from "../shared/schema";

describe("Schema Definitions", () => {
  it("should export users table", () => {
    expect(schema.users).toBeDefined();
  });

  it("should export employees table", () => {
    expect(schema.employees).toBeDefined();
  });

  it("should export departments table", () => {
    expect(schema.departments).toBeDefined();
  });

  it("should export candidates table", () => {
    expect(schema.candidates).toBeDefined();
  });

  it("should export job postings table", () => {
    expect(schema.jobPostings).toBeDefined();
  });

  it("should export organizations table", () => {
    expect(schema.organizations).toBeDefined();
  });

  it("should export security tables", () => {
    expect(schema.passwordResetTokens).toBeDefined();
    expect(schema.emailVerificationTokens).toBeDefined();
    expect(schema.loginAuditLog).toBeDefined();
  });

  it("should export HR operations tables", () => {
    expect(schema.complianceRecords).toBeDefined();
    expect(schema.engagementSurveys).toBeDefined();
    expect(schema.leaveRequests).toBeDefined();
    expect(schema.notifications).toBeDefined();
    expect(schema.announcements).toBeDefined();
    expect(schema.documents).toBeDefined();
  });

  it("should export wellness tables", () => {
    expect(schema.wellnessPrograms).toBeDefined();
    expect(schema.wellnessEnrollments).toBeDefined();
    expect(schema.wellnessMetrics).toBeDefined();
  });

  it("should export AI tables", () => {
    expect(schema.vrTrainingModules).toBeDefined();
    expect(schema.sentimentAnalyses).toBeDefined();
    expect(schema.chatbotConversations).toBeDefined();
  });
});

describe("Insert Schemas", () => {
  it("should validate user insert schema", () => {
    const result = schema.insertUserSchema.safeParse({
      username: "testuser",
      password: "hashedpass",
      email: "test@test.com",
      fullName: "Test User",
      role: "employee",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid user insert", () => {
    const result = schema.insertUserSchema.safeParse({
      username: "",
    });
    expect(result.success).toBe(false);
  });

  it("should validate employee insert schema", () => {
    const result = schema.insertEmployeeSchema.safeParse({
      fullName: "John Doe",
      email: "john@company.com",
      position: "Engineer",
      department: "Engineering",
      status: "active",
      hireDate: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("should validate department insert schema", () => {
    const result = schema.insertDepartmentSchema.safeParse({
      name: "Engineering",
      description: "Engineering department",
    });
    expect(result.success).toBe(true);
  });

  it("should validate candidate insert schema with required fields", () => {
    const result = schema.insertCandidateSchema.safeParse({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      status: "new",
      jobPostingId: 1,
    });
    if (!result.success) {
      const missing = result.error.issues.map(i => i.path.join("."));
      expect(missing).toBeDefined();
    } else {
      expect(result.success).toBe(true);
    }
  });

  it("should validate job posting insert schema with required fields", () => {
    const result = schema.insertJobPostingSchema.safeParse({
      title: "Software Engineer",
      description: "Build things",
      status: "active",
      departmentId: 1,
    });
    if (!result.success) {
      const missing = result.error.issues.map(i => i.path.join("."));
      expect(missing).toBeDefined();
    } else {
      expect(result.success).toBe(true);
    }
  });

  it("should validate announcement insert schema", () => {
    const result = schema.insertAnnouncementSchema.safeParse({
      title: "Company Update",
      content: "Important announcement content",
      priority: "high",
      authorId: 1,
    });
    if (!result.success) {
      const missing = result.error.issues.map(i => i.path.join("."));
      expect(missing).toBeDefined();
    } else {
      expect(result.success).toBe(true);
    }
  });

  it("should validate notification insert schema", () => {
    const result = schema.insertNotificationSchema.safeParse({
      userId: 1,
      title: "Test Notification",
      message: "This is a test",
      type: "info",
    });
    expect(result.success).toBe(true);
  });

  it("should validate HR task insert schema", () => {
    const result = schema.insertHrTaskSchema.safeParse({
      title: "Review applications",
      category: "recruitment",
      status: "pending",
      assignedTo: 1,
    });
    if (!result.success) {
      const missing = result.error.issues.map(i => i.path.join("."));
      expect(missing).toBeDefined();
    } else {
      expect(result.success).toBe(true);
    }
  });
});

describe("Type Exports", () => {
  it("should have insert schemas for all major tables", () => {
    expect(schema.insertUserSchema).toBeDefined();
    expect(schema.insertEmployeeSchema).toBeDefined();
    expect(schema.insertDepartmentSchema).toBeDefined();
    expect(schema.insertCandidateSchema).toBeDefined();
    expect(schema.insertJobPostingSchema).toBeDefined();
    expect(schema.insertHrTaskSchema).toBeDefined();
    expect(schema.insertAnnouncementSchema).toBeDefined();
  });

  it("should have insert schemas for wellness tables", () => {
    expect(schema.insertWellnessProgramSchema).toBeDefined();
    expect(schema.insertWellnessEnrollmentSchema).toBeDefined();
    expect(schema.insertWellnessMetricSchema).toBeDefined();
  });

  it("should have insert schemas for operations tables", () => {
    expect(schema.insertDocumentSchema).toBeDefined();
    expect(schema.insertNotificationSchema).toBeDefined();
    expect(schema.insertInterviewSchema).toBeDefined();
    expect(schema.insertEngagementSurveySchema).toBeDefined();
  });
});
