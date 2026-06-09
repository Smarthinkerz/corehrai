// Survey question types
export type QuestionType = 'text' | 'rating' | 'multiple_choice' | 'single_choice';

// Survey question interface
export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

// Survey interface
export interface EngagementSurvey {
  id: number;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: number | null;
  questions: SurveyQuestion[] | string;
}

// Survey response interface
export interface SurveyResponse {
  id: number;
  surveyId: number;
  employeeId: number | null;
  responses: Record<string, any>;
  sentimentScore: number | null;
  submittedAt: string;
}