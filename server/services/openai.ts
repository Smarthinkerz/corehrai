import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Tiered models (user-requested upgrade):
//   MODEL      = high-volume default (chat, sentiment, translation, redaction, etc.)
//   MODEL_PRO  = high-stakes reasoning (candidate evaluation, workforce planning, strategic insights)
const MODEL = "gpt-5.4-mini";
const MODEL_PRO = "gpt-5.5";
const GEMINI_MODEL = "gemini-2.0-flash";

// Re-export the functions used elsewhere in the application
export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: 'recruitment' | 'performance' | 'engagement' | 'retention' | 'compliance';
  priority: 'low' | 'medium' | 'high';
  actionItems?: string[];
  metrics?: {
    name: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export async function generateAIInsights(departments: any[], employees: any[], timeFrame: string) {
  try {
    const departmentNames = departments.map(d => d.name).join(', ');
    const employeeCount = employees.length;
    const departmentSummary = departments.map(d => `${d.name} (${d.headCount || 0} headcount, budget: ${d.budget || 'N/A'})`).join('; ');

    const prompt = `
You are an expert HR analytics AI. Analyze the following workforce data and generate 5 strategic insights.

Company Data:
- Time frame: ${timeFrame}
- Departments (${departments.length}): ${departmentSummary}
- Total employees: ${employeeCount}

Generate exactly 5 insights covering these categories: recruitment, performance, engagement, retention, compliance.
Each insight should have actionable recommendations and realistic metrics based on the data provided.

Respond in JSON format:
{
  "insights": [
    {
      "id": "1",
      "title": "string",
      "description": "string (2-3 sentences of analysis)",
      "category": "recruitment|performance|engagement|retention|compliance",
      "priority": "low|medium|high",
      "actionItems": ["string", "string", "string"],
      "metrics": [
        {"name": "string", "value": "string or number", "trend": "up|down|stable"},
        {"name": "string", "value": "string or number", "trend": "up|down|stable"},
        {"name": "string", "value": "string or number", "trend": "up|down|stable"}
      ]
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL_PRO,
      messages: [
        { role: "system", content: "You are an expert HR analytics AI that generates actionable workforce insights." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");
    const parsed = JSON.parse(content);

    return {
      insights: parsed.insights as AIInsight[],
      updated: new Date().toISOString()
    };
  } catch (error) {
    // In case of error, return a basic set of insights rather than empty array
    return {
      insights: [
        {
          id: 'error-1',
          title: 'Workforce Planning Recommendations',
          description: 'Based on current staffing levels, consider strategic hiring in key departments to support growth objectives.',
          category: 'recruitment' as const,
          priority: 'medium' as const
        }
      ],
      updated: new Date().toISOString()
    };
  }
}

export interface CandidateEvaluation {
  aiScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  fitAssessment: string;
  recommendations: string[];
  interviewQuestions: string[];
}

export async function evaluateCandidate(candidate: {
  fullName: string;
  position: string;
  department: string;
  source?: string;
  notes?: string;
  resumeText?: string;
}): Promise<CandidateEvaluation> {
  try {
    // Prepare the data for evaluation
    const resumeContent = candidate.resumeText || "Resume not provided";
    const notes = candidate.notes || "No additional notes";
    
    // Check if we have minimal information
    const hasMinimalInfo = 
      (!candidate.resumeText || candidate.resumeText.trim().length < 50) && 
      (!candidate.notes || candidate.notes.trim().length < 20);
    
    const prompt = `
You are an expert HR AI assistant that evaluates job candidates. 
You will be given details about a candidate, and you need to evaluate their fit for the position.

Candidate Details:
- Name: ${candidate.fullName}
- Position Applied For: ${candidate.position}
- Department: ${candidate.department}
- Source: ${candidate.source || "Direct application"}

Additional Information:
${notes}

Resume Content:
${resumeContent}

${hasMinimalInfo ? 
  "IMPORTANT: There is very minimal information provided for this candidate. The evaluation score should reflect this lack of data with a score below 10. Be very cautious in your assessment and emphasize the need for more information." : 
  ""}

Please analyze this candidate and provide your assessment in a structured JSON format with the following fields:
- aiScore: number (0-100 score representing overall fit for the position)
- strengths: array of strings (candidate's key strengths relevant to the position)
- weaknesses: array of strings (areas where the candidate might need development)
- fitAssessment: string (overall assessment of fit for the role)
- recommendations: array of strings (next steps or recommendations in the hiring process)
- interviewQuestions: array of strings (5 specific questions to ask this candidate in an interview)

Base your assessment on the candidate's background, skills, and experience in relation to the position.
Be fair and objective in your evaluation.
${hasMinimalInfo ? 
  "Given the minimal information provided, your aiScore MUST be under 10 to accurately reflect the insufficient data for a proper evaluation." : 
  ""}
`;

    const response = await openai.chat.completions.create({
      model: MODEL_PRO,
      messages: [
        { role: "system", content: "You are an expert HR AI assistant that specializes in candidate evaluation." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const evaluationData = JSON.parse(content) as CandidateEvaluation;
    
    // Ensure the AI score is within the 0-100 range
    evaluationData.aiScore = Math.max(0, Math.min(100, evaluationData.aiScore));
    
    return evaluationData;
  } catch (error) {
    
    // Return a fallback evaluation if API call fails
    return {
      aiScore: 5, // Very low score since we can't properly evaluate
      strengths: ["Insufficient data to determine strengths accurately."],
      weaknesses: ["Lack of detailed resume information.", "Insufficient background details for thorough evaluation."],
      fitAssessment: "Unable to properly assess candidate fit due to technical issues and/or insufficient information. A proper evaluation requires a detailed resume and more candidate information.",
      recommendations: [
        "Request a detailed resume from the candidate.",
        "Gather more information through an initial screening call.",
        "Review the candidate's application manually with standard criteria."
      ],
      interviewQuestions: [
        "Can you walk me through your relevant experience for this position?",
        "What specific skills do you have that relate to the requirements?",
        "Why are you interested in this role and our company?",
        "Could you provide examples of projects or work relevant to this position?",
        "What are your career goals and how does this position align with them?"
      ]
    };
  }
}

export async function redactResumePII(resumeText: string): Promise<{ redactedText: string; redactedItems: string[] }> {
  try {
    const prompt = `
You are an expert HR AI assistant specializing in resume anonymization for unbiased hiring.
Remove ALL personally identifiable information (PII) from the following resume text to enable fair, unbiased candidate evaluation.

Replace the following with appropriate placeholders:
- Full name → [CANDIDATE]
- Email addresses → [EMAIL]
- Phone numbers → [PHONE]
- Physical addresses, cities, zip codes → [LOCATION]
- LinkedIn/social media URLs → [SOCIAL_PROFILE]
- Personal websites → [WEBSITE]
- Age, date of birth → [DOB]
- Gender references → [GENDER]
- Nationality/ethnicity references → [NATIONALITY]
- Photos/image references → [PHOTO]
- Religious references → [RELIGION]
- Marital status → [MARITAL_STATUS]
- Names of references → [REFERENCE_NAME]

Keep ALL professional content intact: work experience, skills, education institutions, job titles, certifications, achievements, and technical qualifications.

Resume Text:
${resumeText}

Respond in JSON format:
{
  "redactedText": "the full resume text with PII replaced by placeholders",
  "redactedItems": ["list of types of PII that were found and redacted, e.g. 'Full name', 'Email address', 'Phone number'"]
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert HR AI assistant that removes personally identifiable information from resumes for unbiased hiring practices." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return JSON.parse(content);
  } catch (error) {
    return {
      redactedText: resumeText,
      redactedItems: ["Error: Unable to process resume redaction at this time."]
    };
  }
}

export async function translateText(text: string, targetLanguage: string, context: string = "HR announcement"): Promise<{ translatedText: string; detectedSourceLanguage: string }> {
  try {
    const prompt = `
Translate the following ${context} text into ${targetLanguage}.
Maintain professional HR tone and terminology. Preserve any formatting, bullet points, or structure.

Text to translate:
${text}

Respond in JSON format:
{
  "translatedText": "the translated text",
  "detectedSourceLanguage": "the detected source language name in English"
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a professional translator specializing in HR and corporate communications." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return JSON.parse(content);
  } catch (error) {
    return {
      translatedText: text,
      detectedSourceLanguage: "unknown"
    };
  }
}

export async function analyzeCandidateResume(resumeText: string, jobDescription?: string) {
  try {
    const prompt = `
You are an expert HR AI assistant that analyzes resumes.
Please analyze the following resume in relation to the job description provided.

Resume Text:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}` : 'No specific job description provided. Please analyze general qualifications.'}

Provide your analysis in a structured JSON format with the following fields:
- match: number (0-100 indicating how well the resume matches the job requirements)
- skills: array of strings (key skills identified in the resume)
- experience: array of strings (key work experiences relevant to the position)
- education: array of strings (education qualifications)
- recommendations: array of strings (suggestions for how the candidate might improve their application)
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert HR AI assistant that specializes in resume analysis." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    
    // Return a fallback analysis if API call fails
    return {
      match: 0,
      skills: [],
      experience: [],
      education: [],
      recommendations: ["Unable to analyze resume at this time. Please try again later."]
    };
  }
}

export async function generateSentimentAnalysis(text: string) {
  try {
    const prompt = `
Analyze the sentiment of the following survey response or employee feedback.
Provide detailed analysis with:
1. Overall sentiment (positive, negative, or neutral)
2. Sentiment score (0.0 to 1.0, where 0 is very negative, 0.5 is neutral, and 1.0 is very positive)
3. Key themes or topics mentioned
4. Key sentiment drivers (what's making the employee happy or unhappy)
5. Any actionable insights for HR

Feedback text:
${text}

Respond in the following JSON format:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.XX,
  "keywords": ["keyword1", "keyword2", ...],
  "themes": ["theme1", "theme2", ...],
  "drivers": {
    "positive": ["driver1", "driver2", ...],
    "negative": ["issue1", "issue2", ...]
  },
  "actionableInsights": ["insight1", "insight2", ...]
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert HR sentiment analysis AI specializing in employee feedback." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const analysisData = JSON.parse(content);
    
    // Ensure the sentiment score is within the 0-1 range
    analysisData.score = Math.max(0, Math.min(1, analysisData.score));
    
    return analysisData;
  } catch (error) {
    
    // Return a fallback analysis if API call fails
    return {
      sentiment: "neutral",
      score: 0.5,
      keywords: ["feedback", "survey"],
      themes: ["general feedback"],
      drivers: {
        positive: [],
        negative: []
      },
      actionableInsights: ["Review feedback again when sentiment analysis is available."]
    };
  }
}

const HR_SYSTEM_PROMPT = `You are an AI-powered HR assistant helping employees with HR-related questions and issues.
You work within an HR management platform that has these features:
- Employee Management (profiles, onboarding, documents)
- Leave & Time Off (submit requests via Self-Service page, check balances, approvals)
- Recruitment (candidate pipeline, interviews, job postings)
- Compliance (policy tracking, training requirements, document status)
- Analytics (workforce metrics, department stats, hiring funnel)
- Wellness Programs (enrollment, engagement initiatives)
- Audit Log (activity tracking)

Focus on providing helpful, accurate information about company policies, benefits, career development,
and other HR matters. Always maintain a professional, supportive tone. When you don't know something,
suggest contacting the HR department directly. Keep responses concise and practical.
Use bullet points and bold text (**like this**) for readability when listing items.`;

async function processChatWithGemini(message: string, conversationHistory: any[]): Promise<string> {
  const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
  
  const historyForGemini = conversationHistory
    .filter((msg: any) => msg.role !== 'system')
    .map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

  const chat = model.startChat({
    history: historyForGemini,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  });

  const result = await chat.sendMessage(`${HR_SYSTEM_PROMPT}\n\nUser question: ${message}`);
  const response = result.response;
  return response.text();
}

async function processChatWithOpenAI(message: string, conversationHistory: any[]): Promise<string> {
  const formattedHistory = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  if (!formattedHistory.some(msg => msg.role === 'system')) {
    formattedHistory.unshift({ role: 'system', content: HR_SYSTEM_PROMPT });
  }

  formattedHistory.push({ role: 'user', content: message });

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: formattedHistory,
    temperature: 0.7
  });

  return response.choices[0].message.content || "I apologize, but I'm unable to process your request at the moment.";
}

export async function processChatMessage(message: string, conversationHistory: any[]) {
  let responseText: string | null = null;

  // Try Gemini first (Google API key is available and working)
  try {
    responseText = await processChatWithGemini(message, conversationHistory);
  } catch (geminiError) {
    // Gemini failed, try OpenAI
    try {
      responseText = await processChatWithOpenAI(message, conversationHistory);
    } catch (openaiError) {
      // Both failed, use keyword fallback
      responseText = getFallbackResponse(message, conversationHistory);
    }
  }

  return {
    response: responseText,
    conversationHistory: [
      ...conversationHistory,
      { role: "user", content: message },
      { role: "assistant", content: responseText }
    ]
  };
}

interface TopicMatch {
  topic: string;
  score: number;
  keywords: string[];
}

function detectTopics(msg: string): TopicMatch[] {
  const topicKeywords: Record<string, string[]> = {
    greeting: ["hello", "good morning", "good afternoon", "greetings", "howdy"],
    thanks: ["thank", "thanks", "thx", "appreciate", "grateful"],
    capabilities: ["what can you do", "help me", "what do you do", "capabilities", "how can you help", "features", "what are you"],
    leave: ["leave", "time off", "vacation", "pto", "sick day", "day off", "absence", "holiday", "request leave", "leave balance", "annual leave"],
    employee: ["employee", "staff", "personnel", "worker", "colleague", "profile", "directory", "onboarding", "new hire"],
    performance: ["performance", "enhance", "improve", "productivity", "goals", "review", "feedback", "appraisal", "evaluation", "growth", "development", "skill", "coaching", "mentoring", "career path"],
    recruitment: ["recruit", "hiring", "candidate", "interview", "job posting", "resume", "applicant", "vacancy", "job opening", "talent"],
    compliance: ["compliance", "regulation", "gdpr", "audit", "legal", "requirement", "certification", "expiry"],
    analytics: ["analytics", "report", "metric", "stat", "dashboard", "chart", "kpi"],
    wellness: ["wellness", "wellbeing", "well-being", "mental health", "fitness", "engagement", "satisfaction"],
    documents: ["document", "file", "upload", "download", "paperwork", "form", "contract", "attachment", "pdf"],
    department: ["department", "division", "unit", "org chart", "organization", "structure"],
    tasks: ["task", "to-do", "todo", "assignment", "action item", "pending", "overdue", "deadline"],
    salary: ["salary", "pay", "compensation", "payroll", "wage", "bonus", "benefits", "raise", "promotion"],
    settings: ["setting", "config", "preference", "account", "password"],
    policy: ["policy", "policies", "rule", "rules", "guideline", "guidelines", "handbook", "procedure", "remote work", "work from home", "dress code", "code of conduct"],
    training: ["training", "course", "certification", "learning", "workshop", "seminar", "education"],
    team: ["team", "teamwork", "collaboration", "team building", "morale", "culture"],
    survey: ["survey", "feedback form", "questionnaire", "poll", "opinion"],
  };

  const matches: TopicMatch[] = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matched = keywords.filter(kw => {
      if (kw.includes(' ')) return msg.includes(kw);
      return new RegExp(`\\b${kw}\\b`).test(msg);
    });
    if (matched.length > 0) {
      matches.push({ topic, score: matched.length, keywords: matched });
    }
  }
  return matches.sort((a, b) => b.score - a.score);
}

function getLastAssistantTopic(conversationHistory: any[]): string | null {
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    if (conversationHistory[i].role === 'assistant') {
      const content = conversationHistory[i].content.toLowerCase();
      if (content.includes('performance') || content.includes('enhance') || content.includes('productivity')) return 'performance';
      if (content.includes('learning path') || content.includes('training')) return 'training';
      if (content.includes('survey') || content.includes('questionnaire')) return 'survey';
      if (content.includes('employee') || content.includes('profile')) return 'employee';
      if (content.includes('leave') || content.includes('time off')) return 'leave';
      if (content.includes('recruit') || content.includes('candidate') || content.includes('hiring pipeline')) return 'recruitment';
      if (content.includes('compliance')) return 'compliance';
      if (content.includes('policy') || content.includes('handbook') || content.includes('guideline')) return 'policy';
      if (content.includes('analytics') || content.includes('metrics')) return 'analytics';
      if (content.includes('wellness') || content.includes('well-being')) return 'wellness';
      if (content.includes('document') || content.includes('file')) return 'documents';
      if (content.includes('department')) return 'department';
      if (content.includes('task')) return 'tasks';
      if (content.includes('team') || content.includes('collaboration')) return 'team';
    }
  }
  return null;
}

const topicResponses: Record<string, string[]> = {
  greeting: [
    "Hello! I'm your AI HR Assistant. How can I help you today? Feel free to ask about employees, leave, recruitment, compliance, or anything else HR-related!",
    "Hey there! Welcome to the HR Assistant. What can I help you with? I can assist with employee management, leave requests, hiring, and much more.",
    "Hi! Great to see you. I'm here to help with any HR-related questions. What's on your mind?",
  ],
  thanks: [
    "You're welcome! Let me know if there's anything else I can help with.",
    "Happy to help! Don't hesitate to ask if you need anything else.",
    "Glad I could help! I'm here whenever you need me.",
  ],
  capabilities: [
    `I'm your AI HR Assistant! Here's what I can help you with:

• **Employee Management** — Look up employee info, onboarding status, and team details
• **Leave & Time Off** — Submit leave requests, check balances, and track approvals
• **Recruitment** — Review candidate pipelines, interview schedules, and hiring progress
• **Compliance** — Check policy deadlines, training requirements, and document status
• **Analytics** — Get workforce metrics, department stats, and hiring funnel data
• **Wellness** — Explore wellness programs and employee engagement initiatives
• **Documents** — Access and manage employee documents
• **Tasks** — Track HR tasks and action items

Just ask me about any of these topics!`,
  ],
  leave: [
    `Here's how leave and time off works in the system:

• **Submit a request** — Go to **Self-Service** in the sidebar, then click the **Leave** tab to submit a new leave request
• **Check status** — Your pending and approved requests are visible in the same Self-Service page
• **Types** — You can request vacation, sick leave, personal days, and more
• **Approvals** — Your manager will be notified automatically and can approve or reject from their dashboard

Would you like to know about a specific type of leave, or need help submitting a request?`,
    `For time off and leave management:

1. Click **Self-Service** in the left sidebar
2. Go to the **Leave** tab
3. Click **Request Leave** to submit a new request
4. Fill in the type, dates, and reason
5. Your manager gets notified automatically

You can track all your requests there too. Anything specific about leave I can clarify?`,
  ],
  employee: [
    `To find employee profiles and information:

1. Click **Employees** in the left sidebar — this shows the full employee directory
2. Click on any employee's name to see their detailed profile
3. You can view contact info, department, role, and onboarding status

As an admin, you can also:
• Add new employees
• Edit employee details
• Manage onboarding tasks
• View employee documents

What specific information are you looking for?`,
    `The employee directory is in the **Employees** section in the left sidebar. From there you can:

• **Browse** all employees with search and filters
• **View profiles** — Click any name to see full details
• **Manage onboarding** — Track new hire progress
• **Edit info** — Update employee details as needed

Is there a specific employee or piece of information you need?`,
  ],
  recruitment: [
    `The recruitment section helps you manage your entire hiring pipeline:

• **Candidates** — Click **Recruitment** in the sidebar to view all candidates and their status
• **Job Postings** — Create and manage open positions
• **Interviews** — Schedule interviews and track feedback
• **Pipeline stages** — Candidates move through: New → Screening → Interview → Offer → Hired

You can also use the **Analytics** page to see your hiring funnel metrics. What part of recruitment do you need help with?`,
  ],
  compliance: [
    `For compliance and policy management, go to the **Compliance** section in the sidebar:

• **Compliance Tracker** — See all policies, certifications, and their expiry status
• **Status indicators** — Green (compliant), yellow (at risk), red (non-compliant)
• **Run Checks** — Click "Run Compliance Check" to scan for issues
• **Training** — Track required training completion for employees

The system automatically flags items approaching their expiry dates. Want to know about a specific policy or requirement?`,
  ],
  analytics: [
    `The **Analytics** page gives you a bird's-eye view of your HR data:

• **Overview Cards** — Total employees, candidates, departments, open tasks
• **Department Breakdown** — Employee distribution by department (bar chart)
• **Hiring Funnel** — See where candidates are in the pipeline (funnel chart)
• **Activity Trends** — Recent activity patterns over time (line chart)
• **Export** — Download your analytics data as a JSON report

Click **Analytics** in the left sidebar to access it. What metrics are you most interested in?`,
  ],
  wellness: [
    `The wellness features help you track employee well-being:

• **Wellness Programs** — Browse and manage available wellness programs
• **Enrollment** — Track which employees are enrolled in programs
• **Engagement Surveys** — Create and review employee engagement surveys
• **Survey Results** — Analyze survey responses for trends and insights

You can access surveys from the **Surveys** section in the sidebar. Need help with a specific wellness initiative?`,
  ],
  documents: [
    `For document management:

• **Employee Documents** — View documents through the Employees section or Self-Service
• **Self-Service > Documents** — Click **Self-Service** in the sidebar, then the **Documents** tab to see your own documents
• **Upload** — Admins can upload documents for employees
• **Compliance Docs** — Track policy and certification documents in the Compliance section

What type of document are you looking for?`,
  ],
  department: [
    `Department information is available in a few places:

• **Departments** — Click **Departments** in the sidebar for the full department list with headcounts
• **Analytics** — The Analytics page shows employee distribution across departments
• **Employee Profiles** — Each employee's profile shows their department assignment

Need details about a specific department?`,
  ],
  tasks: [
    `For task management:

• **Tasks** — Click **Tasks** in the sidebar to see all HR tasks
• **Status** — Tasks show as pending, in progress, or completed
• **Create** — You can create new tasks and assign them
• **Onboarding Tasks** — New hire onboarding tasks are tracked separately in the Employees section

The Analytics overview also shows your open vs. completed task counts. What do you need to do?`,
  ],
  salary: [
    `Salary and compensation information is managed through the HR department. Here's what's available in the system:

• **Employee Profiles** — Basic compensation details may be in employee records (Employees section)
• **Benefits** — Contact your HR representative for benefits enrollment questions
• **Payroll** — For payroll inquiries, please reach out to the finance/payroll team directly

For sensitive compensation matters, I'd recommend speaking with your HR manager directly. Can I help with anything else?`,
  ],
  settings: [
    `For system settings and preferences:

• **Settings** — Click **Settings** in the left sidebar to access system configuration
• **Profile** — Update your personal info through **Self-Service** > **Profile** tab
• **Notifications** — The bell icon in the top-right shows your notifications
• **Password** — Account security settings are available in Settings

What would you like to configure?`,
  ],
  performance: [
    `Great question! Here are some effective ways to enhance employee performance:

**Set Clear Goals & Expectations**
• Define measurable objectives for each role
• Use the **Tasks** section to assign and track specific action items
• Set regular check-in milestones

**Provide Regular Feedback**
• Don't wait for annual reviews — give ongoing constructive feedback
• Use **Surveys** to gather 360-degree feedback from peers and managers
• Document feedback in employee profiles for continuity

**Invest in Development**
• Use the **Learning Path** generator (AI-powered) to create personalized development plans
• Identify skill gaps and recommend relevant training
• Encourage mentoring and cross-team collaboration

**Track & Measure**
• Monitor engagement through **Surveys** and wellness programs
• Use the **Analytics** dashboard to spot trends in performance data
• Review department-level metrics for team health

**Recognize & Reward**
• Acknowledge achievements promptly
• Connect performance to career growth opportunities
• Consider compensation reviews for high performers

Would you like help with any specific aspect — like setting up performance reviews, creating learning paths, or running engagement surveys?`,
    `To improve employee performance, consider this approach:

1. **Assess Current State** — Use **Surveys** to gauge employee engagement and satisfaction
2. **Set Goals** — Create clear, measurable objectives in the **Tasks** section
3. **Develop Skills** — Generate AI-powered **Learning Paths** tailored to each role
4. **Monitor Progress** — Track metrics on the **Analytics** dashboard
5. **Give Feedback** — Provide regular, constructive feedback and coaching
6. **Support Wellbeing** — Enroll employees in **Wellness Programs** to prevent burnout

The system can help you with each of these steps. What would you like to start with?`,
  ],
  policy: [
    `For company policies and guidelines:

• **Compliance Section** — Go to **Compliance** in the sidebar to view all tracked policies and their status
• **Employee Handbook** — Check with your HR department for the latest handbook version
• **Documents** — Policy documents may be available in the **Documents** section or **Self-Service** > **Documents**

For specific policy questions (remote work, dress code, conduct, etc.), I'd recommend checking the compliance tracker first, then reaching out to your HR representative for clarification. What policy are you interested in?`,
  ],
  training: [
    `For training and professional development:

• **Learning Paths** — Use the AI-powered Learning Path generator to create personalized development plans based on role and skills
• **Compliance Training** — Track required training completion in the **Compliance** section
• **Certifications** — Monitor certification expiry dates and renewal requirements

To generate a custom learning path, you can use the AI features in the system. Would you like to know more about a specific type of training?`,
  ],
  team: [
    `For team management and building strong teams:

• **Department View** — Check **Departments** in the sidebar to see team composition and headcounts
• **Employee Directory** — Browse team members in the **Employees** section
• **Engagement** — Use **Surveys** to measure team morale and satisfaction
• **Wellness** — Enroll team members in wellness programs to support well-being
• **Analytics** — Review team-level metrics on the **Analytics** dashboard

Strong teams are built on clear communication, shared goals, and psychological safety. What aspect of team management can I help with?`,
  ],
  survey: [
    `For surveys and feedback collection:

• **Create Surveys** — Go to **Surveys** in the left sidebar to create new engagement surveys
• **Review Responses** — View and analyze survey results with charts and breakdowns
• **Templates** — Use pre-built survey templates for common topics like job satisfaction, manager feedback, and work environment
• **Insights** — The AI can analyze survey responses for sentiment and trends

Would you like to create a new survey or review existing results?`,
  ],
};

function getNavigationHelp(msg: string, previousTopic: string | null): string | null {
  const navPatterns = /where is|where are|where do i find|can't find|cant find|don't see|dont see|locate the|look for the|navigate to|go to the|how do i get to|how do i open|show me where/i;
  const isLost = navPatterns.test(msg);
  if (!isLost) return null;

  const topic = previousTopic;
  const pageMap: Record<string, string> = {
    employee: "Click **Employees** in the left sidebar. You'll see the full employee directory with all profiles listed there.",
    leave: "Go to **Self-Service** in the left sidebar, then click the **Leave** tab. That's where you can submit and track leave requests.",
    recruitment: "Click **Recruitment** in the left sidebar. You'll find candidates, job postings, and interview management there.",
    compliance: "Go to **Compliance** in the left sidebar. The compliance tracker with all policies and status indicators is there.",
    analytics: "Click **Analytics** in the left sidebar. You'll see charts, metrics, and the option to export reports.",
    wellness: "Wellness programs are under the **Surveys** section in the sidebar. You can also check the wellness section from there.",
    documents: "For your own documents, go to **Self-Service** > **Documents** tab. For managing employee documents, go to **Employees** and click on a profile.",
    department: "Click **Departments** in the left sidebar to see all departments with headcounts and details.",
    tasks: "Click **Tasks** in the left sidebar to see all HR tasks, their status, and create new ones.",
    settings: "Click **Settings** at the bottom of the left sidebar to access system configuration.",
  };

  if (topic && pageMap[topic]) {
    return pageMap[topic];
  }

  if (msg.match(/employee|profile|staff/i)) return pageMap.employee;
  if (msg.match(/leave|time off|vacation/i)) return pageMap.leave;
  if (msg.match(/recruit|candidate|interview|hiring/i)) return pageMap.recruitment;
  if (msg.match(/compliance|policy/i)) return pageMap.compliance;
  if (msg.match(/analytics|report|metric|chart/i)) return pageMap.analytics;
  if (msg.match(/document|file/i)) return pageMap.documents;
  if (msg.match(/department/i)) return pageMap.department;
  if (msg.match(/task/i)) return pageMap.tasks;
  if (msg.match(/setting/i)) return pageMap.settings;

  return "Here's where to find things in the app — use the **left sidebar** to navigate:\n\n• **Dashboard** — Overview of key metrics\n• **Employees** — Employee directory and profiles\n• **Recruitment** — Candidates and job postings\n• **Tasks** — HR tasks and action items\n• **Departments** — Department list and headcounts\n• **Surveys** — Employee engagement surveys\n• **Compliance** — Policy and certification tracking\n• **Audit Log** — Activity history\n• **Self-Service** — Your profile, leave requests, and documents\n• **Analytics** — Charts, metrics, and reports\n• **Settings** — System configuration\n\nWhat are you trying to find?";
}

function getFallbackResponse(message: string, conversationHistory: any[] = []): string {
  const msg = message.toLowerCase().trim();
  const topics = detectTopics(msg);
  const previousTopic = getLastAssistantTopic(conversationHistory);

  const navHelp = getNavigationHelp(msg, previousTopic);
  if (navHelp) return navHelp;

  if (topics.length > 0) {
    const bestTopic = topics[0].topic;
    const responses = topicResponses[bestTopic];
    if (responses) {
      const idx = Math.floor(Math.random() * responses.length);
      return responses[idx];
    }
  }

  if (previousTopic) {
    const contextResponses: Record<string, string> = {
      employee: "Regarding employees — could you tell me more about what you're looking for? For example, are you trying to find a specific person, view a profile, or manage onboarding?",
      leave: "Still about leave — what specifically do you need? I can help with submitting a request, checking your balance, or understanding the approval process.",
      recruitment: "On recruitment — what would you like to know more about? I can help with candidates, interviews, job postings, or the hiring pipeline.",
      compliance: "About compliance — what's your specific question? I can help with policy status, training requirements, or running compliance checks.",
      analytics: "For analytics — what data are you interested in? I can point you to department stats, hiring metrics, activity trends, or task reports.",
      wellness: "On wellness — what would you like to know? I can help with wellness programs, surveys, or employee engagement data.",
      documents: "About documents — are you looking for your own documents, employee documents, or compliance-related documents?",
      tasks: "On tasks — do you need to create a new task, check on existing ones, or something else?",
    };
    if (contextResponses[previousTopic]) {
      return contextResponses[previousTopic];
    }
  }

  if (msg.match(/yes|yeah|yep|sure|ok|okay|please|go ahead|tell me more/)) {
    if (previousTopic && topicResponses[previousTopic]) {
      const responses = topicResponses[previousTopic];
      return responses[responses.length - 1];
    }
    return "Sure! What would you like to know more about? I can help with employees, leave, recruitment, compliance, analytics, wellness, documents, or tasks.";
  }

  if (msg.match(/no|nope|nah|not really|never mind|nevermind/)) {
    return "No problem! Feel free to ask me anything whenever you need help with HR-related tasks.";
  }

  if (msg.length < 10) {
    return "Could you tell me a bit more about what you need? I can help with topics like employee management, leave requests, recruitment, compliance, and more.";
  }

  return `I understand you're asking about "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}". While I may not have a specific answer for that, here are some things I can definitely help with:

• **Employees** — profiles, onboarding, and team info
• **Leave** — submit requests and track approvals (Self-Service page)
• **Recruitment** — candidates, interviews, and job postings
• **Compliance** — policy tracking and training status
• **Analytics** — workforce metrics and reports

Try asking about one of these topics, or rephrase your question and I'll do my best to help!`;
}

export interface LearningPathModule {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'workshop' | 'certification' | 'project' | 'mentorship' | 'reading' | 'assessment'; 
  duration: string; // e.g., "2 weeks", "4 hours"
  priority: 'essential' | 'recommended' | 'optional';
  resources: {
    title: string;
    url?: string;
    description: string;
    type: 'video' | 'article' | 'book' | 'tool' | 'course' | 'other';
  }[];
  skills: string[];
  milestones: {
    title: string;
    description: string;
    completionCriteria: string;
  }[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedCompletionTime: string;
  requiredSkills: string[];
  suggestedSkills: string[];
  modules: LearningPathModule[];
  assessmentMethod: string;
  nextSteps: string[];
}

export async function generateLearningPath(
  role: string,
  currentSkills: string[] = [],
  department: string = '',
  experienceLevel: 'entry' | 'mid' | 'senior' = 'mid'
): Promise<LearningPath> {
  try {
    const prompt = `
You are an expert HR Learning & Development specialist creating personalized learning paths for employees.
Generate a highly detailed and role-specific learning path for the following role and parameters:

Role: ${role}
Department: ${department || 'Not specified'}
Experience Level: ${experienceLevel}
Current Skills: ${currentSkills.length > 0 ? currentSkills.join(', ') : 'Not provided'}

MANDATORY REQUIREMENTS (FOLLOW EXACTLY):
1. All content must be generated in English only. Do not use any other languages in your response.
2. Create a COMPLETELY UNIQUE learning path with highly specialized content for this exact role.
3. Each module MUST focus on a different specific technical/professional skill.
4. EVERY module title and description MUST explicitly mention actual tools, methodologies, or platforms used in this profession.
5. AVOID ALL GENERIC CONTENT - no general "communication skills", "project management", or "leadership" modules.
6. Module titles MUST include specific technical terminology from the industry.
7. INCLUDE ACTUAL NAMES of software tools, platforms, frameworks, methodologies, and certifications specific to this role.
8. Resources must be very specialized, technical courses rather than general professional development content.

The learning path should follow this 7-stage comprehensive framework:

🟢 1. User & Business Context Gathering
- Employee Profile Creation: Role, department, seniority, skill level
- Goals: promotion, skill gap closing, project readiness
- Business Objectives: Team/department priorities, compliance/training needs, budget and time constraints

⚙️ 2. AI Analysis & Skill Mapping
- Skills Inference: Based on job role, industry standards, etc.
- Gap Analysis: Compare current skills vs. role expectations or future roles

🤖 3. Path Generation
- AI Curates Personalized Path: Modular learning units tailored to skill gaps
- Mix of internal content and third-party content (LinkedIn Learning, Coursera, etc.)
- Custom pacing based on role and experience level

🧠 4. Learning Delivery
- Multi-Format Learning: Videos, readings, simulations, peer-learning
- Checkpoints & Assessments: Short quizzes, projects, or scenario-based tasks

📈 5. Progress Tracking & Nudges
- Dashboard: Milestones, completion rates, skill growth metrics
- Smart Nudges: Reminders, motivational prompts, milestone celebration

📊 6. Impact Measurement
- Skill Validation: Post-assessments, peer reviews, on-the-job application
- Business Outcomes: Team productivity, promotion readiness, retention impact
- Learning ROI Reporting: For HR/L&D teams

🔄 7. Continuous Optimization
- AI fine-tunes paths based on learner performance, content effectiveness, and evolving business needs

Create a structured response in JSON format with the following properties:
- id: a unique string identifier (use a UUID format)
- title: a descriptive title for the learning path
- description: a brief overview of the learning path and its objectives (mention the 7-stage framework)
- targetRole: the specific role this learning path is designed for
- estimatedCompletionTime: total time to complete the learning path (e.g., "3 months")
- requiredSkills: array of skills that are essential for the role
- suggestedSkills: array of additional skills that would be beneficial
- modules: array of learning modules, each containing:
  - id: unique identifier for the module
  - title: descriptive title (consider prefixing with the stage number for clarity)
  - description: detailed description of what will be learned
  - type: one of ['course', 'workshop', 'certification', 'project', 'mentorship', 'reading', 'assessment']
  - duration: estimated time to complete this module
  - priority: one of ['essential', 'recommended', 'optional']
  - resources: array of specific learning resources with:
    - title: name of the resource (MUST be a specific real course title, not generic)
    - url: web address where applicable (use real websites and courses)
    - description: brief description of the resource
    - type: one of ['video', 'article', 'book', 'tool', 'course', 'other']
  - skills: array of skills that will be developed
  - milestones: array of checkpoints to measure progress with:
    - title: name of the milestone
    - description: what should be accomplished
    - completionCriteria: how to know when it's complete
- assessmentMethod: how progress and completion will be evaluated (include impact measurement)
- nextSteps: array of recommendations for after completing the learning path (include continuous optimization)

EXTREMELY IMPORTANT: For all resources, provide ONLY real-world courses, books, platforms, and materials that actually exist and are industry-recognized. Every resource MUST have:
1. A specific title (e.g., "Coursera - Machine Learning by Andrew Ng" not "Machine Learning Course")
2. Exact platform identification (e.g., LinkedIn Learning, Coursera, Udemy, edX, etc.)
3. Real author names where applicable
4. Descriptive content that matches what the actual course covers

Examples of proper resource titles:
- "LinkedIn Learning - Python for Data Science Essential Training with Lillian Pierson"
- "Coursera - Google Project Management: Professional Certificate"
- "Udemy - The Complete 2023 Web Development Bootcamp by Dr. Angela Yu"
- "O'Reilly - Designing Data-Intensive Applications by Martin Kleppmann"
- "Harvard Business Review - Managing Yourself article by Peter Drucker"

Ensure your learning path explicitly covers all 7 stages of the framework in a cohesive, interconnected way.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `You are an expert HR learning and development specialist with deep knowledge of industry-specific learning paths.
          
          CRITICALLY IMPORTANT REQUIREMENTS:
          1. All your responses must be in ENGLISH only. Do not use any other language.
          2. Create HIGHLY specialized learning paths - each role must have completely different module content than any other role.
          3. EACH MODULE MUST TEACH A DISTINCT SKILL SET with zero content overlap between modules.
          4. EVERY MODULE TITLE AND DESCRIPTION MUST EXPLICITLY REFERENCE ROLE-SPECIFIC TOOLS, SOFTWARE, METHODOLOGIES USED IN THAT EXACT PROFESSION.
          5. AVOID GENERIC SKILLS like "communication" or "project management" - focus on specialized technical skills only.
          6. Include actual names of industry-standard tools, software platforms, methodologies, and certifications specific to the role.
          7. For example:
             - For Financial Analyst: Include Bloomberg Terminal, Excel modeling, SQL, Python for finance, DCF analysis
             - For Software Engineer: Include specific frameworks, programming languages, CI/CD pipelines, architecture patterns
             - For Graphic Designer: Include specific design software, typography principles, color theory, specific design methodologies
          
          Your task is to create learning paths that would satisfy the most demanding industry expert in that field. Use highly technical language appropriate to the specific profession.`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const learningPath = JSON.parse(content) as LearningPath;
    return learningPath;
  } catch (error) {
    
    
    // Return a fallback learning path based on the 7-stage framework
    return {
      id: "error-lp-1",
      title: "Comprehensive Development Plan for " + role,
      description: "A structured 7-stage learning path to develop essential skills required for the role, focusing on context gathering, skill mapping, personalized path creation, multi-format learning delivery, progress tracking, impact measurement, and continuous optimization.",
      targetRole: role,
      estimatedCompletionTime: "3-6 months",
      requiredSkills: currentSkills.length > 0 ? currentSkills : ["Technical knowledge", "Communication", "Problem solving"],
      suggestedSkills: ["Leadership", "Project management", "Strategic thinking", "Adaptability", "Data analysis"],
      modules: [
        {
          id: "mod-1",
          title: "1. Context & Goal Setting Workshop",
          description: "Establish your professional development baseline and objectives, aligned with business needs and career aspirations",
          type: "workshop",
          duration: "1 week",
          priority: "essential",
          resources: [
            {
              title: "LinkedIn Learning - Setting Meaningful Career Goals",
              description: "Learn to create SMART goals for professional development",
              type: "course"
            },
            {
              title: "Skills Self-Assessment Template",
              description: "Structured tool for evaluating current capabilities",
              type: "tool"
            }
          ],
          skills: ["Self-assessment", "Goal setting", "Career planning"],
          milestones: [
            {
              title: "Personal Development Plan",
              description: "Create a detailed development plan with clear objectives",
              completionCriteria: "Completed plan document with measurable goals approved by manager"
            }
          ]
        },
        {
          id: "mod-2",
          title: "2. Skill Gap Analysis",
          description: "Identify the specific skills needed for success in your role and measure current proficiency",
          type: "assessment",
          duration: "2 weeks",
          priority: "essential",
          resources: [
            {
              title: "Udemy - Role-Based Skills Assessment",
              description: "Comprehensive assessment of role-specific competencies",
              type: "course"
            }
          ],
          skills: ["Self-evaluation", "Gap analysis", "Prioritization"],
          milestones: [
            {
              title: "Skills Inventory Completion",
              description: "Document current skills and prioritize areas for improvement",
              completionCriteria: "Completed skills inventory with prioritized development areas"
            }
          ]
        },
        {
          id: "mod-3",
          title: "3. Core Technical Skills Development",
          description: "Build the essential technical capabilities required for your role through structured learning",
          type: "course",
          duration: "4 weeks",
          priority: "essential",
          resources: [
            {
              title: "Coursera - Professional Certificate Program",
              description: "Industry-recognized certification program covering key technical competencies",
              type: "course"
            },
            {
              title: "Industry Best Practices Guide",
              description: "Comprehensive overview of current standards and approaches",
              type: "article"
            }
          ],
          skills: ["Technical fundamentals", "Industry knowledge", "Best practices"],
          milestones: [
            {
              title: "Technical Assessment",
              description: "Complete knowledge check evaluations",
              completionCriteria: "Score at least 80% on technical assessment"
            }
          ]
        },
        {
          id: "mod-4",
          title: "4. Applied Learning Project",
          description: "Apply your newly acquired skills in a real-world project scenario with mentorship support",
          type: "project",
          duration: "3 weeks",
          priority: "recommended",
          resources: [
            {
              title: "Project Brief and Guidelines",
              description: "Structured framework for applied learning project execution",
              type: "tool"
            },
            {
              title: "LinkedIn Learning - Project Management Fundamentals",
              description: "Essential skills for planning and executing projects effectively",
              type: "course"
            }
          ],
          skills: ["Project management", "Problem solving", "Practical application"],
          milestones: [
            {
              title: "Project Completion",
              description: "Successfully deliver a project that demonstrates key skills application",
              completionCriteria: "Project deliverables meet defined quality standards and business requirements"
            }
          ]
        },
        {
          id: "mod-5",
          title: "5. Progress Review & Optimization",
          description: "Evaluate learning progress, measure impact, and refine your development approach",
          type: "mentorship",
          duration: "2 weeks",
          priority: "recommended",
          resources: [
            {
              title: "Self-Reflection Framework",
              description: "Structured approach to analyzing learning outcomes and effectiveness",
              type: "tool"
            },
            {
              title: "Manager Feedback Session Guide",
              description: "Template for conducting productive development feedback discussions",
              type: "article"
            }
          ],
          skills: ["Self-reflection", "Feedback integration", "Continuous improvement"],
          milestones: [
            {
              title: "Development Progress Review",
              description: "Comprehensive assessment of skills gained and areas for improvement",
              completionCriteria: "Completed review document with specific action plan for continued growth"
            }
          ]
        }
      ],
      assessmentMethod: "Multi-dimensional evaluation including final project assessment by manager, knowledge assessments covering key concepts, self-reflection on skill development, and performance improvement metrics to measure business impact",
      nextSteps: [
        "Schedule quarterly skill review sessions with manager",
        "Apply for role-specific projects that utilize new skills",
        "Identify potential mentorship opportunities for continued growth",
        "Update learning path based on emerging skills needs and business priorities",
        "Measure ROI of learning through performance metrics and growth indicators"
      ]
    };
  }
}

export interface WorkforcePlanReview {
  approved: boolean;
  score: number; // 0-100
  feedback: string;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  financialImpact: {
    costSavings?: number;
    additionalCosts?: number;
    roi?: number;
    description: string;
  };
  revisedPlan?: {
    name: string;
    description: string;
    headcountChange: number;
    rationale: string;
    changesExplanation: string;
  };
}

export async function reviewWorkforcePlan(plan: {
  name: string;
  description: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  headcountChange: number;
}): Promise<WorkforcePlanReview> {
  try {
    const prompt = `
You are an expert HR AI assistant that reviews workforce plans. 
You will be given details about a workforce plan, and you need to evaluate it thoroughly and provide approval or recommendations.

Workforce Plan Details:
- Plan Name: ${plan.name}
- Department: ${plan.departmentName}
- Description/Justification: ${plan.description}
- Timeframe: ${plan.startDate} to ${plan.endDate}
- Headcount Change: ${plan.headcountChange > 0 ? '+' : ''}${plan.headcountChange} employees

Please analyze this plan and provide your assessment in a structured JSON format with the following fields:
- approved: boolean (true if plan should be approved, false if it needs revision)
- score: number (0-100 score for the plan quality)
- feedback: string (overall feedback explaining the decision)
- recommendations: array of strings (specific action items to improve the plan)
- risks: array of strings (potential risks associated with this plan)
- opportunities: array of strings (potential benefits beyond those mentioned)
- financialImpact: object containing estimated financial analysis with:
  - costSavings (optional number): potential yearly cost savings
  - additionalCosts (optional number): potential additional yearly costs
  - roi (optional number): estimated return on investment percentage
  - description: string explaining financial impact assessment

If the plan is not approved (score < 70), please also provide a revised version with the following structure:
- revisedPlan: object containing:
  - name: string (suggested improved name for the plan)
  - description: string (improved description/justification)
  - headcountChange: number (suggested headcount change, which might differ from original)
  - rationale: string (explanation of why this revision is better)
  - changesExplanation: string (explanation of what was changed from the original plan and why)

Base your assessment on HR best practices, business strategy alignment, financial impact, and timing considerations.
Include specific, actionable recommendations if the plan is not approved.
`;

    const response = await openai.chat.completions.create({
      model: MODEL_PRO,
      messages: [
        { role: "system", content: "You are an expert HR AI assistant that specializes in workforce planning analysis." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const reviewData = JSON.parse(content) as WorkforcePlanReview;
    return reviewData;
  } catch (error) {
    
    // Return a fallback review if API call fails
    return {
      approved: false,
      score: 50,
      feedback: "Unable to complete AI review at this time. Please try again later.",
      recommendations: ["System is currently unavailable for AI-powered reviews."],
      risks: [],
      opportunities: [],
      financialImpact: {
        description: "Financial impact could not be assessed at this time."
      }
    };
  }
}