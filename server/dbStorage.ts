import { 
  users, candidates, employees, onboardingTasks, hrTasks, interviews,
  departments, complianceRecords, engagementSurveys, surveyResponses, activityLogs, jobPostings, documents,
  wellnessPrograms, wellnessEnrollments, wellnessMetrics, announcements, notifications, leaveRequests,
  performanceReviews, reviewFeedback, payrollRecords, savedReports, recognitions, knowledgeArticles, attendanceRecords, onboardingTemplates,
  type User, type InsertUser, type Candidate, type InsertCandidate,
  type Employee, type InsertEmployee, type OnboardingTask, type InsertOnboardingTask,
  type HrTask, type InsertHrTask, type Department, type InsertDepartment,
  type ComplianceRecord, type InsertComplianceRecord, type EngagementSurvey, 
  type InsertEngagementSurvey, type SurveyResponse, type InsertSurveyResponse,
  type ActivityLog, type InsertActivityLog, type JobPosting, type InsertJobPosting,
  type Interview, type InsertInterview, type Document, type InsertDocument,
  type WellnessProgram, type InsertWellnessProgram, type WellnessEnrollment, 
  type InsertWellnessEnrollment, type WellnessMetric, type InsertWellnessMetric,
  type Announcement, type InsertAnnouncement,
  type Notification, type InsertNotification,
  type LeaveRequest, type InsertLeaveRequest,
  type PerformanceReview, type InsertPerformanceReview,
  type ReviewFeedback, type InsertReviewFeedback,
  type PayrollRecord, type InsertPayrollRecord,
  type SavedReport, type InsertSavedReport,
  type Recognition, type InsertRecognition,
  type KnowledgeArticle, type InsertKnowledgeArticle,
  type AttendanceRecord, type InsertAttendanceRecord,
  type OnboardingTemplate, type InsertOnboardingTemplate,
  type VrTrainingModule, type InsertVrTrainingModule,
  type VrTrainingSession, type InsertVrTrainingSession,
  type VrPlatformConfig, type InsertVrPlatformConfig,
  type DigitalTwinScenario, type InsertDigitalTwinScenario,
  type DtPlatformConfig, type InsertDtPlatformConfig,
  type EmotionAnalysis, type InsertEmotionAnalysis,
  type TalentMarketplaceProject, type InsertTalentMarketplaceProject,
  type TalentMarketplaceApplication, type InsertTalentMarketplaceApplication,
  type ResignationRiskAssessment, type InsertResignationRiskAssessment,
  type PolicyComplianceCheck, type InsertPolicyComplianceCheck,
  type CareerPath, type InsertCareerPath,
  type OnboardingBuddy, type InsertOnboardingBuddy,
  type AiLearningLog, type InsertAiLearningLog,
  type InterviewSession, type InsertInterviewSession,
  type WorkforceForecast, type InsertWorkforceForecast,
  type SentimentAnalysis, type InsertSentimentAnalysis,
  type ChatbotConversation, type InsertChatbotConversation,
  type PeerRecognition, type InsertPeerRecognition,
  type LearningCourse, type InsertLearningCourse,
  type LearningEnrollment, type InsertLearningEnrollment,
  type OfferLetterTemplate, type InsertOfferLetterTemplate,
  type GeneratedOffer, type InsertGeneratedOffer,
  type ComplianceReport, type InsertComplianceReport,
  type Shift, type InsertShift,
  type ShiftSwapRequest, type InsertShiftSwapRequest,
  type AnonymousFeedback, type InsertAnonymousFeedback,
  type OneOnOneMeeting, type InsertOneOnOneMeeting
} from "@shared/schema";
import {
  vrTrainingModules, vrTrainingSessions, vrPlatformConfigs, digitalTwinScenarios, dtPlatformConfigs, emotionAnalyses,
  talentMarketplaceProjects, talentMarketplaceApplications, resignationRiskAssessments,
  policyComplianceChecks, careerPaths, onboardingBuddies, aiLearningLogs,
  interviewSessions, workforceForecasts, sentimentAnalyses, chatbotConversations,
  peerRecognitions, learningCourses, learningEnrollments, offerLetterTemplates,
  generatedOffers, complianceReports, shifts, shiftSwapRequests, anonymousFeedbacks, oneOnOneMeetings
} from "@shared/schema";
import { db } from "./db";
import { eq, lt, and, isNull, gte, lte, or, desc, sql, count } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  // Candidate management (soft-delete aware)
  async getAllCandidates(): Promise<Candidate[]> {
    return db.select().from(candidates).where(isNull(candidates.deletedAt));
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates)
      .where(and(eq(candidates.id, id), isNull(candidates.deletedAt)));
    return candidate || undefined;
  }

  async getCandidatesByStatus(status: string): Promise<Candidate[]> {
    return db.select().from(candidates)
      .where(and(eq(candidates.status, status), isNull(candidates.deletedAt)));
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidates).values(candidate).returning();
    return newCandidate;
  }

  async updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set(candidate)
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate || undefined;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    const [row] = await db.update(candidates)
      .set({ deletedAt: new Date() })
      .where(and(eq(candidates.id, id), isNull(candidates.deletedAt)))
      .returning();
    return !!row;
  }

  // Employee management (soft-delete aware)
  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(employees).where(isNull(employees.deletedAt));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees)
      .where(and(eq(employees.id, id), isNull(employees.deletedAt)));
    return employee || undefined;
  }

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return db.select().from(employees)
      .where(and(eq(employees.department, department), isNull(employees.deletedAt)));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee || undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const [row] = await db.update(employees)
      .set({ deletedAt: new Date() })
      .where(and(eq(employees.id, id), isNull(employees.deletedAt)))
      .returning();
    return !!row;
  }

  // Onboarding tasks
  async getAllOnboardingTasks(): Promise<OnboardingTask[]> {
    return db.select().from(onboardingTasks);
  }

  async getOnboardingTask(id: number): Promise<OnboardingTask | undefined> {
    const [task] = await db.select().from(onboardingTasks).where(eq(onboardingTasks.id, id));
    return task || undefined;
  }

  async getOnboardingTasksByEmployee(employeeId: number): Promise<OnboardingTask[]> {
    return db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.employeeId, employeeId));
  }

  async createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask> {
    const [newTask] = await db.insert(onboardingTasks).values(task).returning();
    return newTask;
  }

  async updateOnboardingTask(id: number, task: Partial<InsertOnboardingTask>): Promise<OnboardingTask | undefined> {
    const [updatedTask] = await db
      .update(onboardingTasks)
      .set(task)
      .where(eq(onboardingTasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteOnboardingTask(id: number): Promise<boolean> {
    const result = await db.delete(onboardingTasks).where(eq(onboardingTasks.id, id));
    return !!result;
  }

  // HR Tasks (soft-delete aware)
  async getAllHrTasks(): Promise<HrTask[]> {
    return db.select().from(hrTasks).where(isNull(hrTasks.deletedAt));
  }

  async getHrTask(id: number): Promise<HrTask | undefined> {
    const [task] = await db.select().from(hrTasks)
      .where(and(eq(hrTasks.id, id), isNull(hrTasks.deletedAt)));
    return task || undefined;
  }

  async getHrTasksByCategory(category: string): Promise<HrTask[]> {
    return db.select().from(hrTasks)
      .where(and(eq(hrTasks.category, category), isNull(hrTasks.deletedAt)));
  }

  async getHrTasksByAssignee(assignedTo: number): Promise<HrTask[]> {
    return db.select().from(hrTasks)
      .where(and(eq(hrTasks.assignedTo, assignedTo), isNull(hrTasks.deletedAt)));
  }

  async createHrTask(task: InsertHrTask): Promise<HrTask> {
    const [newTask] = await db.insert(hrTasks).values(task).returning();
    return newTask;
  }

  async updateHrTask(id: number, task: Partial<InsertHrTask>): Promise<HrTask | undefined> {
    try {
      const [updatedTask] = await db
        .update(hrTasks)
        .set(task)
        .where(eq(hrTasks.id, id))
        .returning();
      
      if (!updatedTask) {
        return await this.getHrTask(id);
      }
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  }

  async deleteHrTask(id: number): Promise<boolean> {
    const [row] = await db.update(hrTasks)
      .set({ deletedAt: new Date() })
      .where(and(eq(hrTasks.id, id), isNull(hrTasks.deletedAt)))
      .returning();
    return !!row;
  }

  // Department management (soft-delete aware)
  async getAllDepartments(): Promise<Department[]> {
    return db.select().from(departments).where(isNull(departments.deletedAt));
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments)
      .where(and(eq(departments.id, id), isNull(departments.deletedAt)));
    return department || undefined;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updatedDepartment] = await db
      .update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment || undefined;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const [row] = await db.update(departments)
      .set({ deletedAt: new Date() })
      .where(and(eq(departments.id, id), isNull(departments.deletedAt)))
      .returning();
    return !!row;
  }

  // Compliance records
  async getAllComplianceRecords(): Promise<ComplianceRecord[]> {
    return db.select().from(complianceRecords);
  }

  async getComplianceRecord(id: number): Promise<ComplianceRecord | undefined> {
    const [record] = await db.select().from(complianceRecords).where(eq(complianceRecords.id, id));
    return record || undefined;
  }

  async getComplianceRecordsByEmployee(employeeId: number): Promise<ComplianceRecord[]> {
    return db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords.employeeId, employeeId));
  }

  async getExpiredComplianceRecords(): Promise<ComplianceRecord[]> {
    const now = new Date();
    return db
      .select()
      .from(complianceRecords)
      .where(and(
        complianceRecords.expiryDate, 
        lt(complianceRecords.expiryDate, now)
      ));
  }

  async createComplianceRecord(record: InsertComplianceRecord): Promise<ComplianceRecord> {
    const [newRecord] = await db.insert(complianceRecords).values(record).returning();
    return newRecord;
  }

  async updateComplianceRecord(id: number, record: Partial<InsertComplianceRecord>): Promise<ComplianceRecord | undefined> {
    const [updatedRecord] = await db
      .update(complianceRecords)
      .set(record)
      .where(eq(complianceRecords.id, id))
      .returning();
    return updatedRecord || undefined;
  }

  async deleteComplianceRecord(id: number): Promise<boolean> {
    const result = await db.delete(complianceRecords).where(eq(complianceRecords.id, id));
    return !!result;
  }

  // Engagement surveys
  async getAllEngagementSurveys(): Promise<EngagementSurvey[]> {
    return db.select().from(engagementSurveys);
  }

  async getEngagementSurvey(id: number): Promise<EngagementSurvey | undefined> {
    const [survey] = await db.select().from(engagementSurveys).where(eq(engagementSurveys.id, id));
    return survey || undefined;
  }

  async getActiveEngagementSurveys(): Promise<EngagementSurvey[]> {
    const now = new Date();
    return db
      .select()
      .from(engagementSurveys)
      .where(
        and(
          lte(engagementSurveys.startDate, now),
          or(
            isNull(engagementSurveys.endDate),
            gte(engagementSurveys.endDate, now)
          )
        )
      );
  }

  async createEngagementSurvey(survey: InsertEngagementSurvey): Promise<EngagementSurvey> {
    const [newSurvey] = await db.insert(engagementSurveys).values(survey).returning();
    return newSurvey;
  }

  async updateEngagementSurvey(id: number, survey: Partial<InsertEngagementSurvey>): Promise<EngagementSurvey | undefined> {
    const [updatedSurvey] = await db
      .update(engagementSurveys)
      .set(survey)
      .where(eq(engagementSurveys.id, id))
      .returning();
    return updatedSurvey || undefined;
  }

  async deleteEngagementSurvey(id: number): Promise<boolean> {
    try {
      // First, get all responses for this survey
      const responses = await this.getSurveyResponsesBySurvey(id);
      
      // Delete all responses for this survey
      if (responses.length > 0) {
        for (const response of responses) {
          await db.delete(surveyResponses).where(eq(surveyResponses.id, response.id));
        }
      }
      
      // Then, delete the survey itself
      const result = await db.delete(engagementSurveys).where(eq(engagementSurveys.id, id));
      return !!result;
    } catch (error) {
      
      throw error;
    }
  }

  // Survey responses
  async getAllSurveyResponses(): Promise<SurveyResponse[]> {
    // Join with employees to get employee names and departments
    const responses = await db
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        employeeId: surveyResponses.employeeId,
        responses: surveyResponses.responses,
        sentimentScore: surveyResponses.sentimentScore,
        submittedAt: surveyResponses.submittedAt,
        // Get employee data if available
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department
      })
      .from(surveyResponses)
      .leftJoin(employees, eq(surveyResponses.employeeId, employees.id));
    
    // Convert to expected format with nested employee object
    return responses.map(response => ({
      id: response.id,
      surveyId: response.surveyId,
      employeeId: response.employeeId,
      responses: response.responses,
      sentimentScore: response.sentimentScore,
      submittedAt: response.submittedAt,
      // Create the nested employee object if we have employee data
      employee: response.employeeFullName ? {
        fullName: response.employeeFullName,
        department: response.employeeDepartment
      } : undefined
    }));
  }

  async getSurveyResponse(id: number): Promise<SurveyResponse | undefined> {
    const [response] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
    return response || undefined;
  }

  async getSurveyResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]> {
    // Join with employees to get employee names and departments
    const responses = await db
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        employeeId: surveyResponses.employeeId,
        responses: surveyResponses.responses,
        sentimentScore: surveyResponses.sentimentScore,
        submittedAt: surveyResponses.submittedAt,
        // Get employee data if available
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department
      })
      .from(surveyResponses)
      .leftJoin(employees, eq(surveyResponses.employeeId, employees.id))
      .where(eq(surveyResponses.surveyId, surveyId));
    
    // Convert to expected format with nested employee object
    return responses.map(response => ({
      id: response.id,
      surveyId: response.surveyId,
      employeeId: response.employeeId,
      responses: response.responses,
      sentimentScore: response.sentimentScore,
      submittedAt: response.submittedAt,
      // Create the nested employee object if we have employee data
      employee: response.employeeFullName ? {
        fullName: response.employeeFullName,
        department: response.employeeDepartment
      } : undefined
    }));
  }

  async getSurveyResponsesByEmployee(employeeId: number): Promise<SurveyResponse[]> {
    // Join with employees to get employee names and departments
    const responses = await db
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        employeeId: surveyResponses.employeeId,
        responses: surveyResponses.responses,
        sentimentScore: surveyResponses.sentimentScore,
        submittedAt: surveyResponses.submittedAt,
        // Get employee data if available
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department
      })
      .from(surveyResponses)
      .leftJoin(employees, eq(surveyResponses.employeeId, employees.id))
      .where(eq(surveyResponses.employeeId, employeeId));
    
    // Convert to expected format with nested employee object
    return responses.map(response => ({
      id: response.id,
      surveyId: response.surveyId,
      employeeId: response.employeeId,
      responses: response.responses,
      sentimentScore: response.sentimentScore,
      submittedAt: response.submittedAt,
      // Create the nested employee object if we have employee data
      employee: response.employeeFullName ? {
        fullName: response.employeeFullName,
        department: response.employeeDepartment
      } : undefined
    }));
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [newResponse] = await db.insert(surveyResponses).values(response).returning();
    return newResponse;
  }

  async deleteSurveyResponse(id: number): Promise<boolean> {
    const result = await db.delete(surveyResponses).where(eq(surveyResponses.id, id));
    return !!result;
  }

  // Activity logs
  async getAllActivityLogs(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs);
  }

  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log || undefined;
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId));
  }

  async getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.entityType, entityType),
          eq(activityLogs.entityId, entityId)
        )
      );
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Job Postings
  async getAllJobPostings(): Promise<JobPosting[]> {
    return db.select().from(jobPostings);
  }

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    const [jobPosting] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return jobPosting || undefined;
  }

  async getActiveJobPostings(): Promise<JobPosting[]> {
    return db.select().from(jobPostings).where(eq(jobPostings.status, 'active'));
  }

  async createJobPosting(job: InsertJobPosting): Promise<JobPosting> {
    const [newJobPosting] = await db.insert(jobPostings).values(job).returning();
    return newJobPosting;
  }

  async updateJobPosting(id: number, job: Partial<InsertJobPosting>): Promise<JobPosting | undefined> {
    const [updatedJobPosting] = await db
      .update(jobPostings)
      .set(job)
      .where(eq(jobPostings.id, id))
      .returning();
    return updatedJobPosting || undefined;
  }

  async deleteJobPosting(id: number): Promise<boolean> {
    const result = await db.delete(jobPostings).where(eq(jobPostings.id, id));
    return !!result;
  }

  // Interviews
  async getAllInterviews(): Promise<Interview[]> {
    return db.select().from(interviews);
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview || undefined;
  }

  async getInterviewsByCandidate(candidateId: number): Promise<Interview[]> {
    return db
      .select()
      .from(interviews)
      .where(eq(interviews.candidateId, candidateId));
  }

  async getScheduledInterviews(): Promise<Interview[]> {
    return db
      .select()
      .from(interviews)
      .where(eq(interviews.status, 'scheduled'));
  }

  async getCompletedInterviews(): Promise<Interview[]> {
    return db
      .select()
      .from(interviews)
      .where(eq(interviews.status, 'completed'));
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values(interview).returning();
    return newInterview;
  }

  async updateInterview(id: number, interview: Partial<InsertInterview>): Promise<Interview | undefined> {
    const [updatedInterview] = await db
      .update(interviews)
      .set(interview)
      .where(eq(interviews.id, id))
      .returning();
    return updatedInterview || undefined;
  }

  async deleteInterview(id: number): Promise<boolean> {
    const result = await db.delete(interviews).where(eq(interviews.id, id));
    return !!result;
  }

  // Document management (soft-delete aware)
  async getAllDocuments(): Promise<Document[]> {
    return db.select().from(documents).where(isNull(documents.deletedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents)
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)));
    return document || undefined;
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return db.select().from(documents)
      .where(and(eq(documents.category, category), isNull(documents.deletedAt)));
  }

  async getDocumentsByDepartment(department: string): Promise<Document[]> {
    return db.select().from(documents)
      .where(and(eq(documents.department, department), isNull(documents.deletedAt)));
  }

  async getDocumentsByEmployee(employeeId: number): Promise<Document[]> {
    return db.select().from(documents)
      .where(and(eq(documents.employeeId, employeeId), isNull(documents.deletedAt)));
  }

  async getPublicDocuments(): Promise<Document[]> {
    return db.select().from(documents)
      .where(and(eq(documents.isPublic, true), isNull(documents.deletedAt)));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const [row] = await db.update(documents)
      .set({ deletedAt: new Date() })
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
      .returning();
    return !!row;
  }

  // Wellness Programs
  async getAllWellnessPrograms(): Promise<WellnessProgram[]> {
    return db.select().from(wellnessPrograms);
  }

  async getWellnessProgram(id: number): Promise<WellnessProgram | undefined> {
    const [program] = await db.select().from(wellnessPrograms).where(eq(wellnessPrograms.id, id));
    return program || undefined;
  }

  async createWellnessProgram(program: InsertWellnessProgram): Promise<WellnessProgram> {
    const [newProgram] = await db.insert(wellnessPrograms).values(program).returning();
    return newProgram;
  }

  async updateWellnessProgram(id: number, program: Partial<InsertWellnessProgram>): Promise<WellnessProgram | undefined> {
    const [updatedProgram] = await db
      .update(wellnessPrograms)
      .set(program)
      .where(eq(wellnessPrograms.id, id))
      .returning();
    return updatedProgram || undefined;
  }

  async deleteWellnessProgram(id: number): Promise<boolean> {
    const result = await db.delete(wellnessPrograms).where(eq(wellnessPrograms.id, id));
    return !!result;
  }

  // Wellness Enrollments
  async getAllWellnessEnrollments(): Promise<WellnessEnrollment[]> {
    return db.select().from(wellnessEnrollments);
  }

  async getWellnessEnrollmentsByProgram(programId: number): Promise<WellnessEnrollment[]> {
    return db.select().from(wellnessEnrollments).where(eq(wellnessEnrollments.programId, programId));
  }

  async getWellnessEnrollmentsByEmployee(employeeId: number): Promise<WellnessEnrollment[]> {
    return db.select().from(wellnessEnrollments).where(eq(wellnessEnrollments.employeeId, employeeId));
  }

  async createWellnessEnrollment(enrollment: InsertWellnessEnrollment): Promise<WellnessEnrollment> {
    const [newEnrollment] = await db.insert(wellnessEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateWellnessEnrollment(id: number, enrollment: Partial<InsertWellnessEnrollment>): Promise<WellnessEnrollment | undefined> {
    const [updatedEnrollment] = await db
      .update(wellnessEnrollments)
      .set(enrollment)
      .where(eq(wellnessEnrollments.id, id))
      .returning();
    return updatedEnrollment || undefined;
  }

  // Wellness Metrics
  async getAllWellnessMetrics(): Promise<WellnessMetric[]> {
    return db.select().from(wellnessMetrics);
  }

  async getWellnessMetricsByEmployee(employeeId: number): Promise<WellnessMetric[]> {
    return db.select().from(wellnessMetrics).where(eq(wellnessMetrics.employeeId, employeeId));
  }

  async createWellnessMetric(metric: InsertWellnessMetric): Promise<WellnessMetric> {
    const [newMetric] = await db.insert(wellnessMetrics).values(metric).returning();
    return newMetric;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements);
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || undefined;
  }

  async getPublishedAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements).where(eq(announcements.isPublished, true));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [updated] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return !!result;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return updated || undefined;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return !!result;
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequestsByUser(userId: number): Promise<LeaveRequest[]> {
    return db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newRequest] = await db.insert(leaveRequests).values(request).returning();
    return newRequest;
  }

  async updateLeaveRequest(id: number, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined> {
    const [updated] = await db.update(leaveRequests).set(request).where(eq(leaveRequests.id, id)).returning();
    return updated || undefined;
  }

  async deleteLeaveRequest(id: number): Promise<boolean> {
    const result = await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return !!result;
  }

  async getAllPerformanceReviews(): Promise<PerformanceReview[]> {
    return db.select().from(performanceReviews).orderBy(desc(performanceReviews.createdAt));
  }
  async getPerformanceReview(id: number): Promise<PerformanceReview | undefined> {
    const [r] = await db.select().from(performanceReviews).where(eq(performanceReviews.id, id));
    return r || undefined;
  }
  async getPerformanceReviewsByEmployee(employeeId: number): Promise<PerformanceReview[]> {
    return db.select().from(performanceReviews).where(eq(performanceReviews.employeeId, employeeId));
  }
  async createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview> {
    const [r] = await db.insert(performanceReviews).values(review).returning();
    return r;
  }
  async updatePerformanceReview(id: number, review: Partial<InsertPerformanceReview>): Promise<PerformanceReview | undefined> {
    const [r] = await db.update(performanceReviews).set({ ...review, updatedAt: new Date() }).where(eq(performanceReviews.id, id)).returning();
    return r || undefined;
  }
  async deletePerformanceReview(id: number): Promise<boolean> {
    const result = await db.delete(performanceReviews).where(eq(performanceReviews.id, id));
    return !!result;
  }

  async getReviewFeedbackByReview(reviewId: number): Promise<ReviewFeedback[]> {
    return db.select().from(reviewFeedback).where(eq(reviewFeedback.reviewId, reviewId));
  }
  async createReviewFeedback(feedback: InsertReviewFeedback): Promise<ReviewFeedback> {
    const [r] = await db.insert(reviewFeedback).values(feedback).returning();
    return r;
  }

  async getAllPayrollRecords(): Promise<PayrollRecord[]> {
    return db.select().from(payrollRecords).orderBy(desc(payrollRecords.createdAt));
  }
  async getPayrollRecordsByEmployee(employeeId: number): Promise<PayrollRecord[]> {
    return db.select().from(payrollRecords).where(eq(payrollRecords.employeeId, employeeId));
  }
  async createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord> {
    const [r] = await db.insert(payrollRecords).values(record).returning();
    return r;
  }
  async updatePayrollRecord(id: number, record: Partial<InsertPayrollRecord>): Promise<PayrollRecord | undefined> {
    const [r] = await db.update(payrollRecords).set(record).where(eq(payrollRecords.id, id)).returning();
    return r || undefined;
  }

  async getAllSavedReports(): Promise<SavedReport[]> {
    return db.select().from(savedReports).orderBy(desc(savedReports.createdAt));
  }
  async getSavedReport(id: number): Promise<SavedReport | undefined> {
    const [r] = await db.select().from(savedReports).where(eq(savedReports.id, id));
    return r || undefined;
  }
  async getSavedReportsByUser(userId: number): Promise<SavedReport[]> {
    return db.select().from(savedReports).where(eq(savedReports.createdBy, userId));
  }
  async createSavedReport(report: InsertSavedReport): Promise<SavedReport> {
    const [r] = await db.insert(savedReports).values(report).returning();
    return r;
  }
  async updateSavedReport(id: number, report: Partial<InsertSavedReport>): Promise<SavedReport | undefined> {
    const [r] = await db.update(savedReports).set({ ...report, updatedAt: new Date() }).where(eq(savedReports.id, id)).returning();
    return r || undefined;
  }
  async deleteSavedReport(id: number): Promise<boolean> {
    const result = await db.delete(savedReports).where(eq(savedReports.id, id));
    return !!result;
  }

  async getAllRecognitions(): Promise<Recognition[]> {
    return db.select().from(recognitions).orderBy(desc(recognitions.createdAt));
  }
  async getRecognitionsByUser(userId: number): Promise<Recognition[]> {
    return db.select().from(recognitions).where(or(eq(recognitions.fromUserId, userId), eq(recognitions.toUserId, userId)));
  }
  async createRecognition(recognition: InsertRecognition): Promise<Recognition> {
    const [r] = await db.insert(recognitions).values(recognition).returning();
    return r;
  }
  async deleteRecognition(id: number): Promise<boolean> {
    const result = await db.delete(recognitions).where(eq(recognitions.id, id));
    return !!result;
  }

  async getAllKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.updatedAt));
  }
  async getKnowledgeArticle(id: number): Promise<KnowledgeArticle | undefined> {
    const [r] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id));
    return r || undefined;
  }
  async getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
    return db.select().from(knowledgeArticles).where(eq(knowledgeArticles.category, category));
  }
  async createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [r] = await db.insert(knowledgeArticles).values(article).returning();
    return r;
  }
  async updateKnowledgeArticle(id: number, article: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle | undefined> {
    const [r] = await db.update(knowledgeArticles).set({ ...article, updatedAt: new Date() }).where(eq(knowledgeArticles.id, id)).returning();
    return r || undefined;
  }
  async deleteKnowledgeArticle(id: number): Promise<boolean> {
    const result = await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id));
    return !!result;
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.date));
  }
  async getAttendanceByEmployee(employeeId: number): Promise<AttendanceRecord[]> {
    return db.select().from(attendanceRecords).where(eq(attendanceRecords.employeeId, employeeId));
  }
  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    return db.select().from(attendanceRecords).where(and(gte(attendanceRecords.date, d), lt(attendanceRecords.date, nextDay)));
  }
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [r] = await db.insert(attendanceRecords).values(record).returning();
    return r;
  }
  async updateAttendanceRecord(id: number, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [r] = await db.update(attendanceRecords).set(record).where(eq(attendanceRecords.id, id)).returning();
    return r || undefined;
  }

  async getAllOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    return db.select().from(onboardingTemplates).orderBy(desc(onboardingTemplates.createdAt));
  }
  async getOnboardingTemplate(id: number): Promise<OnboardingTemplate | undefined> {
    const [r] = await db.select().from(onboardingTemplates).where(eq(onboardingTemplates.id, id));
    return r || undefined;
  }
  async createOnboardingTemplate(template: InsertOnboardingTemplate): Promise<OnboardingTemplate> {
    const [r] = await db.insert(onboardingTemplates).values(template).returning();
    return r;
  }
  async updateOnboardingTemplate(id: number, template: Partial<InsertOnboardingTemplate>): Promise<OnboardingTemplate | undefined> {
    const [r] = await db.update(onboardingTemplates).set(template).where(eq(onboardingTemplates.id, id)).returning();
    return r || undefined;
  }
  async deleteOnboardingTemplate(id: number): Promise<boolean> {
    const result = await db.delete(onboardingTemplates).where(eq(onboardingTemplates.id, id));
    return !!result;
  }

  async getAllVrTrainingModules(): Promise<VrTrainingModule[]> {
    return db.select().from(vrTrainingModules).orderBy(desc(vrTrainingModules.createdAt));
  }
  async getVrTrainingModule(id: number): Promise<VrTrainingModule | undefined> {
    const [r] = await db.select().from(vrTrainingModules).where(eq(vrTrainingModules.id, id));
    return r || undefined;
  }
  async createVrTrainingModule(m: InsertVrTrainingModule): Promise<VrTrainingModule> {
    const [r] = await db.insert(vrTrainingModules).values(m).returning();
    return r;
  }
  async updateVrTrainingModule(id: number, m: Partial<InsertVrTrainingModule>): Promise<VrTrainingModule | undefined> {
    const [r] = await db.update(vrTrainingModules).set(m).where(eq(vrTrainingModules.id, id)).returning();
    return r || undefined;
  }
  async deleteVrTrainingModule(id: number): Promise<boolean> {
    const result = await db.delete(vrTrainingModules).where(eq(vrTrainingModules.id, id));
    return !!result;
  }

  async getVrTrainingSessionsByModule(moduleId: number): Promise<VrTrainingSession[]> {
    return db.select().from(vrTrainingSessions).where(eq(vrTrainingSessions.moduleId, moduleId));
  }
  async getVrTrainingSessionsByEmployee(employeeId: number): Promise<VrTrainingSession[]> {
    return db.select().from(vrTrainingSessions).where(eq(vrTrainingSessions.employeeId, employeeId));
  }
  async createVrTrainingSession(s: InsertVrTrainingSession): Promise<VrTrainingSession> {
    const [r] = await db.insert(vrTrainingSessions).values(s).returning();
    return r;
  }
  async updateVrTrainingSession(id: number, s: Partial<InsertVrTrainingSession>): Promise<VrTrainingSession | undefined> {
    const [r] = await db.update(vrTrainingSessions).set(s).where(eq(vrTrainingSessions.id, id)).returning();
    return r || undefined;
  }

  async getAllVrPlatformConfigs(): Promise<VrPlatformConfig[]> {
    return db.select().from(vrPlatformConfigs);
  }
  async getVrPlatformConfig(platform: string): Promise<VrPlatformConfig | undefined> {
    const [r] = await db.select().from(vrPlatformConfigs).where(eq(vrPlatformConfigs.platform, platform));
    return r || undefined;
  }
  async upsertVrPlatformConfig(config: InsertVrPlatformConfig): Promise<VrPlatformConfig> {
    const existing = await this.getVrPlatformConfig(config.platform);
    if (existing) {
      const [r] = await db.update(vrPlatformConfigs).set({ ...config, updatedAt: new Date() }).where(eq(vrPlatformConfigs.id, existing.id)).returning();
      return r;
    }
    const [r] = await db.insert(vrPlatformConfigs).values(config).returning();
    return r;
  }
  async updateVrPlatformConfig(id: number, config: Partial<InsertVrPlatformConfig>): Promise<VrPlatformConfig | undefined> {
    const [r] = await db.update(vrPlatformConfigs).set({ ...config, updatedAt: new Date() }).where(eq(vrPlatformConfigs.id, id)).returning();
    return r || undefined;
  }

  async getAllDigitalTwinScenarios(): Promise<DigitalTwinScenario[]> {
    return db.select().from(digitalTwinScenarios).orderBy(desc(digitalTwinScenarios.createdAt));
  }
  async getDigitalTwinScenario(id: number): Promise<DigitalTwinScenario | undefined> {
    const [r] = await db.select().from(digitalTwinScenarios).where(eq(digitalTwinScenarios.id, id));
    return r || undefined;
  }
  async createDigitalTwinScenario(s: InsertDigitalTwinScenario): Promise<DigitalTwinScenario> {
    const [r] = await db.insert(digitalTwinScenarios).values(s).returning();
    return r;
  }
  async updateDigitalTwinScenario(id: number, s: Partial<InsertDigitalTwinScenario>): Promise<DigitalTwinScenario | undefined> {
    const [r] = await db.update(digitalTwinScenarios).set({ ...s, updatedAt: new Date() }).where(eq(digitalTwinScenarios.id, id)).returning();
    return r || undefined;
  }
  async deleteDigitalTwinScenario(id: number): Promise<boolean> {
    const result = await db.delete(digitalTwinScenarios).where(eq(digitalTwinScenarios.id, id));
    return !!result;
  }

  async getAllDtPlatformConfigs(): Promise<DtPlatformConfig[]> {
    return db.select().from(dtPlatformConfigs);
  }
  async getDtPlatformConfig(platform: string): Promise<DtPlatformConfig | undefined> {
    const [r] = await db.select().from(dtPlatformConfigs).where(eq(dtPlatformConfigs.platform, platform));
    return r || undefined;
  }
  async upsertDtPlatformConfig(config: InsertDtPlatformConfig): Promise<DtPlatformConfig> {
    const existing = await this.getDtPlatformConfig(config.platform);
    if (existing) {
      const [r] = await db.update(dtPlatformConfigs).set({ ...config, updatedAt: new Date() }).where(eq(dtPlatformConfigs.id, existing.id)).returning();
      return r;
    }
    const [r] = await db.insert(dtPlatformConfigs).values(config).returning();
    return r;
  }
  async updateDtPlatformConfig(id: number, config: Partial<InsertDtPlatformConfig>): Promise<DtPlatformConfig | undefined> {
    const [r] = await db.update(dtPlatformConfigs).set({ ...config, updatedAt: new Date() }).where(eq(dtPlatformConfigs.id, id)).returning();
    return r || undefined;
  }

  async getAllEmotionAnalyses(): Promise<EmotionAnalysis[]> {
    return db.select().from(emotionAnalyses).orderBy(desc(emotionAnalyses.analyzedAt));
  }
  async getEmotionAnalysesByEmployee(employeeId: number): Promise<EmotionAnalysis[]> {
    return db.select().from(emotionAnalyses).where(eq(emotionAnalyses.employeeId, employeeId));
  }
  async createEmotionAnalysis(a: InsertEmotionAnalysis): Promise<EmotionAnalysis> {
    const [r] = await db.insert(emotionAnalyses).values(a).returning();
    return r;
  }

  async getAllTalentMarketplaceProjects(): Promise<TalentMarketplaceProject[]> {
    return db.select().from(talentMarketplaceProjects).orderBy(desc(talentMarketplaceProjects.createdAt));
  }
  async getTalentMarketplaceProject(id: number): Promise<TalentMarketplaceProject | undefined> {
    const [r] = await db.select().from(talentMarketplaceProjects).where(eq(talentMarketplaceProjects.id, id));
    return r || undefined;
  }
  async createTalentMarketplaceProject(p: InsertTalentMarketplaceProject): Promise<TalentMarketplaceProject> {
    const [r] = await db.insert(talentMarketplaceProjects).values(p).returning();
    return r;
  }
  async updateTalentMarketplaceProject(id: number, p: Partial<InsertTalentMarketplaceProject>): Promise<TalentMarketplaceProject | undefined> {
    const [r] = await db.update(talentMarketplaceProjects).set(p).where(eq(talentMarketplaceProjects.id, id)).returning();
    return r || undefined;
  }
  async deleteTalentMarketplaceProject(id: number): Promise<boolean> {
    const result = await db.delete(talentMarketplaceProjects).where(eq(talentMarketplaceProjects.id, id));
    return !!result;
  }

  async getTalentMarketplaceApplicationsByProject(projectId: number): Promise<TalentMarketplaceApplication[]> {
    return db.select().from(talentMarketplaceApplications).where(eq(talentMarketplaceApplications.projectId, projectId));
  }
  async getTalentMarketplaceApplicationsByEmployee(employeeId: number): Promise<TalentMarketplaceApplication[]> {
    return db.select().from(talentMarketplaceApplications).where(eq(talentMarketplaceApplications.employeeId, employeeId));
  }
  async createTalentMarketplaceApplication(a: InsertTalentMarketplaceApplication): Promise<TalentMarketplaceApplication> {
    const [r] = await db.insert(talentMarketplaceApplications).values(a).returning();
    return r;
  }
  async updateTalentMarketplaceApplication(id: number, a: Partial<InsertTalentMarketplaceApplication>): Promise<TalentMarketplaceApplication | undefined> {
    const [r] = await db.update(talentMarketplaceApplications).set(a).where(eq(talentMarketplaceApplications.id, id)).returning();
    return r || undefined;
  }

  async getAllResignationRiskAssessments(): Promise<ResignationRiskAssessment[]> {
    return db.select().from(resignationRiskAssessments).orderBy(desc(resignationRiskAssessments.assessedAt));
  }
  async getResignationRiskByEmployee(employeeId: number): Promise<ResignationRiskAssessment[]> {
    return db.select().from(resignationRiskAssessments).where(eq(resignationRiskAssessments.employeeId, employeeId));
  }
  async createResignationRiskAssessment(a: InsertResignationRiskAssessment): Promise<ResignationRiskAssessment> {
    const [r] = await db.insert(resignationRiskAssessments).values(a).returning();
    return r;
  }

  async getAllPolicyComplianceChecks(): Promise<PolicyComplianceCheck[]> {
    return db.select().from(policyComplianceChecks).orderBy(desc(policyComplianceChecks.checkedAt));
  }
  async getPolicyComplianceCheck(id: number): Promise<PolicyComplianceCheck | undefined> {
    const [r] = await db.select().from(policyComplianceChecks).where(eq(policyComplianceChecks.id, id));
    return r || undefined;
  }
  async createPolicyComplianceCheck(c: InsertPolicyComplianceCheck): Promise<PolicyComplianceCheck> {
    const [r] = await db.insert(policyComplianceChecks).values(c).returning();
    return r;
  }
  async updatePolicyComplianceCheck(id: number, c: Partial<InsertPolicyComplianceCheck>): Promise<PolicyComplianceCheck | undefined> {
    const [r] = await db.update(policyComplianceChecks).set(c).where(eq(policyComplianceChecks.id, id)).returning();
    return r || undefined;
  }
  async deletePolicyComplianceCheck(id: number): Promise<boolean> {
    const result = await db.delete(policyComplianceChecks).where(eq(policyComplianceChecks.id, id));
    return !!result;
  }

  async getAllCareerPaths(): Promise<CareerPath[]> {
    return db.select().from(careerPaths).orderBy(desc(careerPaths.updatedAt));
  }
  async getCareerPathsByEmployee(employeeId: number): Promise<CareerPath[]> {
    return db.select().from(careerPaths).where(eq(careerPaths.employeeId, employeeId));
  }
  async createCareerPath(p: InsertCareerPath): Promise<CareerPath> {
    const [r] = await db.insert(careerPaths).values(p).returning();
    return r;
  }
  async updateCareerPath(id: number, p: Partial<InsertCareerPath>): Promise<CareerPath | undefined> {
    const [r] = await db.update(careerPaths).set({ ...p, updatedAt: new Date() }).where(eq(careerPaths.id, id)).returning();
    return r || undefined;
  }
  async deleteCareerPath(id: number): Promise<boolean> {
    const result = await db.delete(careerPaths).where(eq(careerPaths.id, id));
    return !!result;
  }

  async getAllOnboardingBuddies(): Promise<OnboardingBuddy[]> {
    return db.select().from(onboardingBuddies).orderBy(desc(onboardingBuddies.startDate));
  }
  async getOnboardingBuddiesByNewHire(newHireId: number): Promise<OnboardingBuddy[]> {
    return db.select().from(onboardingBuddies).where(eq(onboardingBuddies.newHireId, newHireId));
  }
  async createOnboardingBuddy(b: InsertOnboardingBuddy): Promise<OnboardingBuddy> {
    const [r] = await db.insert(onboardingBuddies).values(b).returning();
    return r;
  }
  async updateOnboardingBuddy(id: number, b: Partial<InsertOnboardingBuddy>): Promise<OnboardingBuddy | undefined> {
    const [r] = await db.update(onboardingBuddies).set(b).where(eq(onboardingBuddies.id, id)).returning();
    return r || undefined;
  }
  async deleteOnboardingBuddy(id: number): Promise<boolean> {
    const result = await db.delete(onboardingBuddies).where(eq(onboardingBuddies.id, id));
    return !!result;
  }

  async getAllAiLearningLogs(): Promise<AiLearningLog[]> {
    return db.select().from(aiLearningLogs).orderBy(desc(aiLearningLogs.createdAt));
  }
  async createAiLearningLog(l: InsertAiLearningLog): Promise<AiLearningLog> {
    const [r] = await db.insert(aiLearningLogs).values(l).returning();
    return r;
  }
  async updateAiLearningLog(id: number, l: Partial<InsertAiLearningLog>): Promise<AiLearningLog | undefined> {
    const [r] = await db.update(aiLearningLogs).set(l).where(eq(aiLearningLogs.id, id)).returning();
    return r || undefined;
  }

  // Phase 7
  async getAllInterviewSessions(): Promise<InterviewSession[]> { return db.select().from(interviewSessions).orderBy(desc(interviewSessions.createdAt)); }
  async getInterviewSession(id: number): Promise<InterviewSession | undefined> { const [r] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id)); return r || undefined; }
  async createInterviewSession(s: InsertInterviewSession): Promise<InterviewSession> { const [r] = await db.insert(interviewSessions).values(s).returning(); return r; }
  async updateInterviewSession(id: number, s: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined> { const [r] = await db.update(interviewSessions).set(s).where(eq(interviewSessions.id, id)).returning(); return r || undefined; }
  async deleteInterviewSession(id: number): Promise<boolean> { await db.delete(interviewSessions).where(eq(interviewSessions.id, id)); return true; }

  async getAllWorkforceForecasts(): Promise<WorkforceForecast[]> { return db.select().from(workforceForecasts).orderBy(desc(workforceForecasts.createdAt)); }
  async getWorkforceForecast(id: number): Promise<WorkforceForecast | undefined> { const [r] = await db.select().from(workforceForecasts).where(eq(workforceForecasts.id, id)); return r || undefined; }
  async createWorkforceForecast(f: InsertWorkforceForecast): Promise<WorkforceForecast> { const [r] = await db.insert(workforceForecasts).values(f).returning(); return r; }
  async updateWorkforceForecast(id: number, f: Partial<InsertWorkforceForecast>): Promise<WorkforceForecast | undefined> { const [r] = await db.update(workforceForecasts).set({ ...f, updatedAt: new Date() }).where(eq(workforceForecasts.id, id)).returning(); return r || undefined; }
  async deleteWorkforceForecast(id: number): Promise<boolean> { await db.delete(workforceForecasts).where(eq(workforceForecasts.id, id)); return true; }

  async getAllSentimentAnalyses2(): Promise<SentimentAnalysis[]> { return db.select().from(sentimentAnalyses).orderBy(desc(sentimentAnalyses.analyzedAt)); }
  async createSentimentAnalysis2(a: InsertSentimentAnalysis): Promise<SentimentAnalysis> { const [r] = await db.insert(sentimentAnalyses).values(a).returning(); return r; }

  async getAllChatbotConversations(): Promise<ChatbotConversation[]> { return db.select().from(chatbotConversations).orderBy(desc(chatbotConversations.createdAt)); }
  async getChatbotConversation(id: number): Promise<ChatbotConversation | undefined> { const [r] = await db.select().from(chatbotConversations).where(eq(chatbotConversations.id, id)); return r || undefined; }
  async getChatbotConversationsByUser(userId: number): Promise<ChatbotConversation[]> { return db.select().from(chatbotConversations).where(eq(chatbotConversations.userId, userId)).orderBy(desc(chatbotConversations.createdAt)); }
  async createChatbotConversation(c: InsertChatbotConversation): Promise<ChatbotConversation> { const [r] = await db.insert(chatbotConversations).values(c).returning(); return r; }
  async updateChatbotConversation(id: number, c: Partial<InsertChatbotConversation>): Promise<ChatbotConversation | undefined> { const [r] = await db.update(chatbotConversations).set({ ...c, updatedAt: new Date() }).where(eq(chatbotConversations.id, id)).returning(); return r || undefined; }

  async getAllPeerRecognitions(): Promise<PeerRecognition[]> { return db.select().from(peerRecognitions).orderBy(desc(peerRecognitions.createdAt)); }
  async getPeerRecognitionsByEmployee(employeeId: number): Promise<PeerRecognition[]> { return db.select().from(peerRecognitions).where(or(eq(peerRecognitions.fromEmployeeId, employeeId), eq(peerRecognitions.toEmployeeId, employeeId))).orderBy(desc(peerRecognitions.createdAt)); }
  async createPeerRecognition(r: InsertPeerRecognition): Promise<PeerRecognition> { const [res] = await db.insert(peerRecognitions).values(r).returning(); return res; }

  async getAllLearningCourses(): Promise<LearningCourse[]> { return db.select().from(learningCourses).orderBy(desc(learningCourses.createdAt)); }
  async getLearningCourse(id: number): Promise<LearningCourse | undefined> { const [r] = await db.select().from(learningCourses).where(eq(learningCourses.id, id)); return r || undefined; }
  async createLearningCourse(c: InsertLearningCourse): Promise<LearningCourse> { const [r] = await db.insert(learningCourses).values(c).returning(); return r; }
  async updateLearningCourse(id: number, c: Partial<InsertLearningCourse>): Promise<LearningCourse | undefined> { const [r] = await db.update(learningCourses).set(c).where(eq(learningCourses.id, id)).returning(); return r || undefined; }
  async deleteLearningCourse(id: number): Promise<boolean> { await db.delete(learningCourses).where(eq(learningCourses.id, id)); return true; }

  async getAllLearningEnrollments(): Promise<LearningEnrollment[]> { return db.select().from(learningEnrollments).orderBy(desc(learningEnrollments.startedAt)); }
  async getLearningEnrollmentsByCourse(courseId: number): Promise<LearningEnrollment[]> { return db.select().from(learningEnrollments).where(eq(learningEnrollments.courseId, courseId)); }
  async getLearningEnrollmentsByEmployee(employeeId: number): Promise<LearningEnrollment[]> { return db.select().from(learningEnrollments).where(eq(learningEnrollments.employeeId, employeeId)); }
  async createLearningEnrollment(e: InsertLearningEnrollment): Promise<LearningEnrollment> { const [r] = await db.insert(learningEnrollments).values(e).returning(); return r; }
  async updateLearningEnrollment(id: number, e: Partial<InsertLearningEnrollment>): Promise<LearningEnrollment | undefined> { const [r] = await db.update(learningEnrollments).set(e).where(eq(learningEnrollments.id, id)).returning(); return r || undefined; }

  async getAllOfferLetterTemplates(): Promise<OfferLetterTemplate[]> { return db.select().from(offerLetterTemplates).orderBy(desc(offerLetterTemplates.createdAt)); }
  async getOfferLetterTemplate(id: number): Promise<OfferLetterTemplate | undefined> { const [r] = await db.select().from(offerLetterTemplates).where(eq(offerLetterTemplates.id, id)); return r || undefined; }
  async createOfferLetterTemplate(t: InsertOfferLetterTemplate): Promise<OfferLetterTemplate> { const [r] = await db.insert(offerLetterTemplates).values(t).returning(); return r; }
  async updateOfferLetterTemplate(id: number, t: Partial<InsertOfferLetterTemplate>): Promise<OfferLetterTemplate | undefined> { const [r] = await db.update(offerLetterTemplates).set(t).where(eq(offerLetterTemplates.id, id)).returning(); return r || undefined; }
  async deleteOfferLetterTemplate(id: number): Promise<boolean> { await db.delete(offerLetterTemplates).where(eq(offerLetterTemplates.id, id)); return true; }

  async getAllGeneratedOffers(): Promise<GeneratedOffer[]> { return db.select().from(generatedOffers).orderBy(desc(generatedOffers.createdAt)); }
  async getGeneratedOffer(id: number): Promise<GeneratedOffer | undefined> { const [r] = await db.select().from(generatedOffers).where(eq(generatedOffers.id, id)); return r || undefined; }
  async createGeneratedOffer(o: InsertGeneratedOffer): Promise<GeneratedOffer> { const [r] = await db.insert(generatedOffers).values(o).returning(); return r; }
  async updateGeneratedOffer(id: number, o: Partial<InsertGeneratedOffer>): Promise<GeneratedOffer | undefined> { const [r] = await db.update(generatedOffers).set(o).where(eq(generatedOffers.id, id)).returning(); return r || undefined; }

  async getAllComplianceReports(): Promise<ComplianceReport[]> { return db.select().from(complianceReports).orderBy(desc(complianceReports.generatedAt)); }
  async getComplianceReport(id: number): Promise<ComplianceReport | undefined> { const [r] = await db.select().from(complianceReports).where(eq(complianceReports.id, id)); return r || undefined; }
  async createComplianceReport(r: InsertComplianceReport): Promise<ComplianceReport> { const [res] = await db.insert(complianceReports).values(r).returning(); return res; }
  async updateComplianceReport(id: number, r: Partial<InsertComplianceReport>): Promise<ComplianceReport | undefined> { const [res] = await db.update(complianceReports).set(r).where(eq(complianceReports.id, id)).returning(); return res || undefined; }

  async getAllShifts(): Promise<Shift[]> { return db.select().from(shifts).orderBy(desc(shifts.createdAt)); }
  async getShiftsByEmployee(employeeId: number): Promise<Shift[]> { return db.select().from(shifts).where(eq(shifts.employeeId, employeeId)); }
  async getShiftsByDate(date: string): Promise<Shift[]> { return db.select().from(shifts).where(eq(shifts.shiftDate, date)); }
  async createShift(s: InsertShift): Promise<Shift> { const [r] = await db.insert(shifts).values(s).returning(); return r; }
  async updateShift(id: number, s: Partial<InsertShift>): Promise<Shift | undefined> { const [r] = await db.update(shifts).set(s).where(eq(shifts.id, id)).returning(); return r || undefined; }
  async deleteShift(id: number): Promise<boolean> { await db.delete(shifts).where(eq(shifts.id, id)); return true; }

  async getAllShiftSwapRequests(): Promise<ShiftSwapRequest[]> { return db.select().from(shiftSwapRequests).orderBy(desc(shiftSwapRequests.createdAt)); }
  async createShiftSwapRequest(r: InsertShiftSwapRequest): Promise<ShiftSwapRequest> { const [res] = await db.insert(shiftSwapRequests).values(r).returning(); return res; }
  async updateShiftSwapRequest(id: number, r: Partial<InsertShiftSwapRequest>): Promise<ShiftSwapRequest | undefined> { const [res] = await db.update(shiftSwapRequests).set(r).where(eq(shiftSwapRequests.id, id)).returning(); return res || undefined; }

  async getAllAnonymousFeedbacks(): Promise<AnonymousFeedback[]> { return db.select().from(anonymousFeedbacks).orderBy(desc(anonymousFeedbacks.createdAt)); }
  async getAnonymousFeedback(id: number): Promise<AnonymousFeedback | undefined> { const [r] = await db.select().from(anonymousFeedbacks).where(eq(anonymousFeedbacks.id, id)); return r || undefined; }
  async createAnonymousFeedback(f: InsertAnonymousFeedback): Promise<AnonymousFeedback> { const [r] = await db.insert(anonymousFeedbacks).values(f).returning(); return r; }
  async updateAnonymousFeedback(id: number, f: Partial<InsertAnonymousFeedback>): Promise<AnonymousFeedback | undefined> { const [r] = await db.update(anonymousFeedbacks).set(f).where(eq(anonymousFeedbacks.id, id)).returning(); return r || undefined; }

  async getAllOneOnOneMeetings(): Promise<OneOnOneMeeting[]> { return db.select().from(oneOnOneMeetings).orderBy(desc(oneOnOneMeetings.scheduledAt)); }
  async getOneOnOneMeeting(id: number): Promise<OneOnOneMeeting | undefined> { const [r] = await db.select().from(oneOnOneMeetings).where(eq(oneOnOneMeetings.id, id)); return r || undefined; }
  async getOneOnOneMeetingsByManager(managerId: number): Promise<OneOnOneMeeting[]> { return db.select().from(oneOnOneMeetings).where(eq(oneOnOneMeetings.managerId, managerId)).orderBy(desc(oneOnOneMeetings.scheduledAt)); }
  async getOneOnOneMeetingsByReport(reportId: number): Promise<OneOnOneMeeting[]> { return db.select().from(oneOnOneMeetings).where(eq(oneOnOneMeetings.reportId, reportId)).orderBy(desc(oneOnOneMeetings.scheduledAt)); }
  async createOneOnOneMeeting(m: InsertOneOnOneMeeting): Promise<OneOnOneMeeting> { const [r] = await db.insert(oneOnOneMeetings).values(m).returning(); return r; }
  async updateOneOnOneMeeting(id: number, m: Partial<InsertOneOnOneMeeting>): Promise<OneOnOneMeeting | undefined> { const [r] = await db.update(oneOnOneMeetings).set(m).where(eq(oneOnOneMeetings.id, id)).returning(); return r || undefined; }
  async deleteOneOnOneMeeting(id: number): Promise<boolean> { await db.delete(oneOnOneMeetings).where(eq(oneOnOneMeetings.id, id)); return true; }
}