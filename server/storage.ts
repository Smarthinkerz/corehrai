import { 
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

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  getAllCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidatesByStatus(status: string): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: number): Promise<boolean>;

  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeesByDepartment(department: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  getAllOnboardingTasks(): Promise<OnboardingTask[]>;
  getOnboardingTask(id: number): Promise<OnboardingTask | undefined>;
  getOnboardingTasksByEmployee(employeeId: number): Promise<OnboardingTask[]>;
  createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask>;
  updateOnboardingTask(id: number, task: Partial<InsertOnboardingTask>): Promise<OnboardingTask | undefined>;
  deleteOnboardingTask(id: number): Promise<boolean>;

  getAllHrTasks(): Promise<HrTask[]>;
  getHrTask(id: number): Promise<HrTask | undefined>;
  getHrTasksByCategory(category: string): Promise<HrTask[]>;
  getHrTasksByAssignee(assignedTo: number): Promise<HrTask[]>;
  createHrTask(task: InsertHrTask): Promise<HrTask>;
  updateHrTask(id: number, task: Partial<InsertHrTask>): Promise<HrTask | undefined>;
  deleteHrTask(id: number): Promise<boolean>;

  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  getAllComplianceRecords(): Promise<ComplianceRecord[]>;
  getComplianceRecord(id: number): Promise<ComplianceRecord | undefined>;
  getComplianceRecordsByEmployee(employeeId: number): Promise<ComplianceRecord[]>;
  getExpiredComplianceRecords(): Promise<ComplianceRecord[]>;
  createComplianceRecord(record: InsertComplianceRecord): Promise<ComplianceRecord>;
  updateComplianceRecord(id: number, record: Partial<InsertComplianceRecord>): Promise<ComplianceRecord | undefined>;
  deleteComplianceRecord(id: number): Promise<boolean>;

  getAllEngagementSurveys(): Promise<EngagementSurvey[]>;
  getEngagementSurvey(id: number): Promise<EngagementSurvey | undefined>;
  getActiveEngagementSurveys(): Promise<EngagementSurvey[]>;
  createEngagementSurvey(survey: InsertEngagementSurvey): Promise<EngagementSurvey>;
  updateEngagementSurvey(id: number, survey: Partial<InsertEngagementSurvey>): Promise<EngagementSurvey | undefined>;
  deleteEngagementSurvey(id: number): Promise<boolean>;

  getAllSurveyResponses(): Promise<SurveyResponse[]>;
  getSurveyResponse(id: number): Promise<SurveyResponse | undefined>;
  getSurveyResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]>;
  getSurveyResponsesByEmployee(employeeId: number): Promise<SurveyResponse[]>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  deleteSurveyResponse(id: number): Promise<boolean>;

  getAllActivityLogs(): Promise<ActivityLog[]>;
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  getAllJobPostings(): Promise<JobPosting[]>;
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  getActiveJobPostings(): Promise<JobPosting[]>;
  createJobPosting(job: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, job: Partial<InsertJobPosting>): Promise<JobPosting | undefined>;
  deleteJobPosting(id: number): Promise<boolean>;
  
  getAllInterviews(): Promise<Interview[]>;
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviewsByCandidate(candidateId: number): Promise<Interview[]>;
  getScheduledInterviews(): Promise<Interview[]>;
  getCompletedInterviews(): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: number, interview: Partial<InsertInterview>): Promise<Interview | undefined>;
  deleteInterview(id: number): Promise<boolean>;
  
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  getDocumentsByDepartment(department: string): Promise<Document[]>;
  getDocumentsByEmployee(employeeId: number): Promise<Document[]>;
  getPublicDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  getAllWellnessPrograms(): Promise<WellnessProgram[]>;
  getWellnessProgram(id: number): Promise<WellnessProgram | undefined>;
  createWellnessProgram(program: InsertWellnessProgram): Promise<WellnessProgram>;
  updateWellnessProgram(id: number, program: Partial<InsertWellnessProgram>): Promise<WellnessProgram | undefined>;
  deleteWellnessProgram(id: number): Promise<boolean>;

  getAllWellnessEnrollments(): Promise<WellnessEnrollment[]>;
  getWellnessEnrollmentsByProgram(programId: number): Promise<WellnessEnrollment[]>;
  getWellnessEnrollmentsByEmployee(employeeId: number): Promise<WellnessEnrollment[]>;
  createWellnessEnrollment(enrollment: InsertWellnessEnrollment): Promise<WellnessEnrollment>;
  updateWellnessEnrollment(id: number, enrollment: Partial<InsertWellnessEnrollment>): Promise<WellnessEnrollment | undefined>;

  getAllWellnessMetrics(): Promise<WellnessMetric[]>;
  getWellnessMetricsByEmployee(employeeId: number): Promise<WellnessMetric[]>;
  createWellnessMetric(metric: InsertWellnessMetric): Promise<WellnessMetric>;

  getAllAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getPublishedAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;

  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getLeaveRequestsByUser(userId: number): Promise<LeaveRequest[]>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined>;
  deleteLeaveRequest(id: number): Promise<boolean>;

  getAllPerformanceReviews(): Promise<PerformanceReview[]>;
  getPerformanceReview(id: number): Promise<PerformanceReview | undefined>;
  getPerformanceReviewsByEmployee(employeeId: number): Promise<PerformanceReview[]>;
  createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview>;
  updatePerformanceReview(id: number, review: Partial<InsertPerformanceReview>): Promise<PerformanceReview | undefined>;
  deletePerformanceReview(id: number): Promise<boolean>;

  getReviewFeedbackByReview(reviewId: number): Promise<ReviewFeedback[]>;
  createReviewFeedback(feedback: InsertReviewFeedback): Promise<ReviewFeedback>;

  getAllPayrollRecords(): Promise<PayrollRecord[]>;
  getPayrollRecordsByEmployee(employeeId: number): Promise<PayrollRecord[]>;
  createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord>;
  updatePayrollRecord(id: number, record: Partial<InsertPayrollRecord>): Promise<PayrollRecord | undefined>;

  getAllSavedReports(): Promise<SavedReport[]>;
  getSavedReport(id: number): Promise<SavedReport | undefined>;
  getSavedReportsByUser(userId: number): Promise<SavedReport[]>;
  createSavedReport(report: InsertSavedReport): Promise<SavedReport>;
  updateSavedReport(id: number, report: Partial<InsertSavedReport>): Promise<SavedReport | undefined>;
  deleteSavedReport(id: number): Promise<boolean>;

  getAllRecognitions(): Promise<Recognition[]>;
  getRecognitionsByUser(userId: number): Promise<Recognition[]>;
  createRecognition(recognition: InsertRecognition): Promise<Recognition>;
  deleteRecognition(id: number): Promise<boolean>;

  getAllKnowledgeArticles(): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: number): Promise<KnowledgeArticle | undefined>;
  getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: number, article: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle | undefined>;
  deleteKnowledgeArticle(id: number): Promise<boolean>;

  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceByEmployee(employeeId: number): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: number, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord | undefined>;

  getAllOnboardingTemplates(): Promise<OnboardingTemplate[]>;
  getOnboardingTemplate(id: number): Promise<OnboardingTemplate | undefined>;
  createOnboardingTemplate(template: InsertOnboardingTemplate): Promise<OnboardingTemplate>;
  updateOnboardingTemplate(id: number, template: Partial<InsertOnboardingTemplate>): Promise<OnboardingTemplate | undefined>;
  deleteOnboardingTemplate(id: number): Promise<boolean>;

  getAllVrTrainingModules(): Promise<VrTrainingModule[]>;
  getVrTrainingModule(id: number): Promise<VrTrainingModule | undefined>;
  createVrTrainingModule(module: InsertVrTrainingModule): Promise<VrTrainingModule>;
  updateVrTrainingModule(id: number, module: Partial<InsertVrTrainingModule>): Promise<VrTrainingModule | undefined>;
  deleteVrTrainingModule(id: number): Promise<boolean>;

  getVrTrainingSessionsByModule(moduleId: number): Promise<VrTrainingSession[]>;
  getVrTrainingSessionsByEmployee(employeeId: number): Promise<VrTrainingSession[]>;
  createVrTrainingSession(session: InsertVrTrainingSession): Promise<VrTrainingSession>;
  updateVrTrainingSession(id: number, session: Partial<InsertVrTrainingSession>): Promise<VrTrainingSession | undefined>;

  getAllVrPlatformConfigs(): Promise<VrPlatformConfig[]>;
  getVrPlatformConfig(platform: string): Promise<VrPlatformConfig | undefined>;
  upsertVrPlatformConfig(config: InsertVrPlatformConfig): Promise<VrPlatformConfig>;
  updateVrPlatformConfig(id: number, config: Partial<InsertVrPlatformConfig>): Promise<VrPlatformConfig | undefined>;

  getAllDigitalTwinScenarios(): Promise<DigitalTwinScenario[]>;
  getDigitalTwinScenario(id: number): Promise<DigitalTwinScenario | undefined>;
  createDigitalTwinScenario(scenario: InsertDigitalTwinScenario): Promise<DigitalTwinScenario>;
  updateDigitalTwinScenario(id: number, scenario: Partial<InsertDigitalTwinScenario>): Promise<DigitalTwinScenario | undefined>;
  deleteDigitalTwinScenario(id: number): Promise<boolean>;

  getAllDtPlatformConfigs(): Promise<DtPlatformConfig[]>;
  getDtPlatformConfig(platform: string): Promise<DtPlatformConfig | undefined>;
  upsertDtPlatformConfig(config: InsertDtPlatformConfig): Promise<DtPlatformConfig>;
  updateDtPlatformConfig(id: number, config: Partial<InsertDtPlatformConfig>): Promise<DtPlatformConfig | undefined>;

  getAllEmotionAnalyses(): Promise<EmotionAnalysis[]>;
  getEmotionAnalysesByEmployee(employeeId: number): Promise<EmotionAnalysis[]>;
  createEmotionAnalysis(analysis: InsertEmotionAnalysis): Promise<EmotionAnalysis>;

  getAllTalentMarketplaceProjects(): Promise<TalentMarketplaceProject[]>;
  getTalentMarketplaceProject(id: number): Promise<TalentMarketplaceProject | undefined>;
  createTalentMarketplaceProject(project: InsertTalentMarketplaceProject): Promise<TalentMarketplaceProject>;
  updateTalentMarketplaceProject(id: number, project: Partial<InsertTalentMarketplaceProject>): Promise<TalentMarketplaceProject | undefined>;
  deleteTalentMarketplaceProject(id: number): Promise<boolean>;

  getTalentMarketplaceApplicationsByProject(projectId: number): Promise<TalentMarketplaceApplication[]>;
  getTalentMarketplaceApplicationsByEmployee(employeeId: number): Promise<TalentMarketplaceApplication[]>;
  createTalentMarketplaceApplication(application: InsertTalentMarketplaceApplication): Promise<TalentMarketplaceApplication>;
  updateTalentMarketplaceApplication(id: number, application: Partial<InsertTalentMarketplaceApplication>): Promise<TalentMarketplaceApplication | undefined>;

  getAllResignationRiskAssessments(): Promise<ResignationRiskAssessment[]>;
  getResignationRiskByEmployee(employeeId: number): Promise<ResignationRiskAssessment[]>;
  createResignationRiskAssessment(assessment: InsertResignationRiskAssessment): Promise<ResignationRiskAssessment>;

  getAllPolicyComplianceChecks(): Promise<PolicyComplianceCheck[]>;
  getPolicyComplianceCheck(id: number): Promise<PolicyComplianceCheck | undefined>;
  createPolicyComplianceCheck(check: InsertPolicyComplianceCheck): Promise<PolicyComplianceCheck>;
  updatePolicyComplianceCheck(id: number, check: Partial<InsertPolicyComplianceCheck>): Promise<PolicyComplianceCheck | undefined>;
  deletePolicyComplianceCheck(id: number): Promise<boolean>;

  getAllCareerPaths(): Promise<CareerPath[]>;
  getCareerPathsByEmployee(employeeId: number): Promise<CareerPath[]>;
  createCareerPath(path: InsertCareerPath): Promise<CareerPath>;
  updateCareerPath(id: number, path: Partial<InsertCareerPath>): Promise<CareerPath | undefined>;
  deleteCareerPath(id: number): Promise<boolean>;

  getAllOnboardingBuddies(): Promise<OnboardingBuddy[]>;
  getOnboardingBuddiesByNewHire(newHireId: number): Promise<OnboardingBuddy[]>;
  createOnboardingBuddy(buddy: InsertOnboardingBuddy): Promise<OnboardingBuddy>;
  updateOnboardingBuddy(id: number, buddy: Partial<InsertOnboardingBuddy>): Promise<OnboardingBuddy | undefined>;
  deleteOnboardingBuddy(id: number): Promise<boolean>;

  getAllAiLearningLogs(): Promise<AiLearningLog[]>;
  createAiLearningLog(log: InsertAiLearningLog): Promise<AiLearningLog>;
  updateAiLearningLog(id: number, log: Partial<InsertAiLearningLog>): Promise<AiLearningLog | undefined>;

  // Phase 7
  getAllInterviewSessions(): Promise<InterviewSession[]>;
  getInterviewSession(id: number): Promise<InterviewSession | undefined>;
  createInterviewSession(s: InsertInterviewSession): Promise<InterviewSession>;
  updateInterviewSession(id: number, s: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined>;
  deleteInterviewSession(id: number): Promise<boolean>;

  getAllWorkforceForecasts(): Promise<WorkforceForecast[]>;
  getWorkforceForecast(id: number): Promise<WorkforceForecast | undefined>;
  createWorkforceForecast(f: InsertWorkforceForecast): Promise<WorkforceForecast>;
  updateWorkforceForecast(id: number, f: Partial<InsertWorkforceForecast>): Promise<WorkforceForecast | undefined>;
  deleteWorkforceForecast(id: number): Promise<boolean>;

  getAllSentimentAnalyses2(): Promise<SentimentAnalysis[]>;
  createSentimentAnalysis2(a: InsertSentimentAnalysis): Promise<SentimentAnalysis>;

  getAllChatbotConversations(): Promise<ChatbotConversation[]>;
  getChatbotConversation(id: number): Promise<ChatbotConversation | undefined>;
  getChatbotConversationsByUser(userId: number): Promise<ChatbotConversation[]>;
  createChatbotConversation(c: InsertChatbotConversation): Promise<ChatbotConversation>;
  updateChatbotConversation(id: number, c: Partial<InsertChatbotConversation>): Promise<ChatbotConversation | undefined>;

  getAllPeerRecognitions(): Promise<PeerRecognition[]>;
  getPeerRecognitionsByEmployee(employeeId: number): Promise<PeerRecognition[]>;
  createPeerRecognition(r: InsertPeerRecognition): Promise<PeerRecognition>;

  getAllLearningCourses(): Promise<LearningCourse[]>;
  getLearningCourse(id: number): Promise<LearningCourse | undefined>;
  createLearningCourse(c: InsertLearningCourse): Promise<LearningCourse>;
  updateLearningCourse(id: number, c: Partial<InsertLearningCourse>): Promise<LearningCourse | undefined>;
  deleteLearningCourse(id: number): Promise<boolean>;

  getAllLearningEnrollments(): Promise<LearningEnrollment[]>;
  getLearningEnrollmentsByCourse(courseId: number): Promise<LearningEnrollment[]>;
  getLearningEnrollmentsByEmployee(employeeId: number): Promise<LearningEnrollment[]>;
  createLearningEnrollment(e: InsertLearningEnrollment): Promise<LearningEnrollment>;
  updateLearningEnrollment(id: number, e: Partial<InsertLearningEnrollment>): Promise<LearningEnrollment | undefined>;

  getAllOfferLetterTemplates(): Promise<OfferLetterTemplate[]>;
  getOfferLetterTemplate(id: number): Promise<OfferLetterTemplate | undefined>;
  createOfferLetterTemplate(t: InsertOfferLetterTemplate): Promise<OfferLetterTemplate>;
  updateOfferLetterTemplate(id: number, t: Partial<InsertOfferLetterTemplate>): Promise<OfferLetterTemplate | undefined>;
  deleteOfferLetterTemplate(id: number): Promise<boolean>;

  getAllGeneratedOffers(): Promise<GeneratedOffer[]>;
  getGeneratedOffer(id: number): Promise<GeneratedOffer | undefined>;
  createGeneratedOffer(o: InsertGeneratedOffer): Promise<GeneratedOffer>;
  updateGeneratedOffer(id: number, o: Partial<InsertGeneratedOffer>): Promise<GeneratedOffer | undefined>;

  getAllComplianceReports(): Promise<ComplianceReport[]>;
  getComplianceReport(id: number): Promise<ComplianceReport | undefined>;
  createComplianceReport(r: InsertComplianceReport): Promise<ComplianceReport>;
  updateComplianceReport(id: number, r: Partial<InsertComplianceReport>): Promise<ComplianceReport | undefined>;

  getAllShifts(): Promise<Shift[]>;
  getShiftsByEmployee(employeeId: number): Promise<Shift[]>;
  getShiftsByDate(date: string): Promise<Shift[]>;
  createShift(s: InsertShift): Promise<Shift>;
  updateShift(id: number, s: Partial<InsertShift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  getAllShiftSwapRequests(): Promise<ShiftSwapRequest[]>;
  createShiftSwapRequest(r: InsertShiftSwapRequest): Promise<ShiftSwapRequest>;
  updateShiftSwapRequest(id: number, r: Partial<InsertShiftSwapRequest>): Promise<ShiftSwapRequest | undefined>;

  getAllAnonymousFeedbacks(): Promise<AnonymousFeedback[]>;
  getAnonymousFeedback(id: number): Promise<AnonymousFeedback | undefined>;
  createAnonymousFeedback(f: InsertAnonymousFeedback): Promise<AnonymousFeedback>;
  updateAnonymousFeedback(id: number, f: Partial<InsertAnonymousFeedback>): Promise<AnonymousFeedback | undefined>;

  getAllOneOnOneMeetings(): Promise<OneOnOneMeeting[]>;
  getOneOnOneMeeting(id: number): Promise<OneOnOneMeeting | undefined>;
  getOneOnOneMeetingsByManager(managerId: number): Promise<OneOnOneMeeting[]>;
  getOneOnOneMeetingsByReport(reportId: number): Promise<OneOnOneMeeting[]>;
  createOneOnOneMeeting(m: InsertOneOnOneMeeting): Promise<OneOnOneMeeting>;
  updateOneOnOneMeeting(id: number, m: Partial<InsertOneOnOneMeeting>): Promise<OneOnOneMeeting | undefined>;
  deleteOneOnOneMeeting(id: number): Promise<boolean>;
}

import { DatabaseStorage } from "./dbStorage";
export const storage: IStorage = new DatabaseStorage();
