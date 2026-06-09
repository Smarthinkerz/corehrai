import { apiRequest } from './api';
import { toast } from '@/hooks/use-toast';

export interface AIInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
}

export interface AIResumeAnalysis {
  match_score: number;
  key_skills: string[];
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface AISentimentAnalysis {
  sentiment_score: number;
  key_positive_aspects: string[];
  key_negative_aspects: string[];
  overall_tone: string;
  recommendations: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAssistantResponse {
  message: string;
  suggestions?: string[];
}

/**
 * Analyzes a resume text against a job description
 */
export async function analyzeResume(resumeText: string, jobDescription?: string): Promise<AIResumeAnalysis> {
  try {
    const response = await apiRequest('POST', '/api/candidates/analyze-resume', {
      resumeText,
      jobDescription
    });
    
    return await response.json();
  } catch (error) {
    throw new Error('Failed to analyze resume. Please try again.');
  }
}

/**
 * Gets AI-generated HR insights based on employee data
 */
export async function getHRInsights(): Promise<AIInsight[]> {
  try {
    const response = await apiRequest('GET', '/api/insights');
    const data = await response.json();
    
    if (data && Array.isArray(data.insights)) {
      return data.insights;
    }
    
    return [];
  } catch (error) {
    throw new Error('Failed to retrieve AI insights. Please try again.');
  }
}

/**
 * Performs sentiment analysis on text (like employee feedback)
 */
export async function analyzeSentiment(text: string): Promise<AISentimentAnalysis> {
  try {
    const response = await apiRequest('POST', '/api/sentiment-analysis', { text });
    return await response.json();
  } catch (error) {
    throw new Error('Failed to analyze sentiment. Please try again.');
  }
}

/**
 * Sends a message to the AI assistant and returns the response
 */
export async function sendAssistantMessage(
  message: string, 
  conversationHistory: ChatMessage[] = []
): Promise<AIAssistantResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai-assistant/chat', {
      message,
      context: {
        conversationHistory
      }
    });
    
    return await response.json();
  } catch (error) {
    toast({
      title: "AI Assistant Error",
      description: "Sorry, I encountered an error processing your request. Please try again.",
      variant: "destructive",
    });
    
    // Return a fallback response
    return {
      message: "Sorry, I encountered an error processing your request. Please try again.",
      suggestions: ["Try a different question", "Contact support if the problem persists"]
    };
  }
}

/**
 * Generates a personalized learning path for an employee
 */
export async function generateLearningPath(
  employeeId: number, 
  role: string, 
  skills: string[]
): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/learning-path', {
      employeeId,
      role,
      skills
    });
    
    return await response.json();
  } catch (error) {
    throw new Error('Failed to generate learning path. Please try again.');
  }
}

/**
 * Generates workforce planning predictions
 */
export async function generateWorkforceForecasting(
  departments: string[], 
  timeframe: number
): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/workforce-forecasting', {
      departments,
      timeframe
    });
    
    return await response.json();
  } catch (error) {
    throw new Error('Failed to generate workforce forecasting. Please try again.');
  }
}
