import { toast } from '@/hooks/use-toast';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      let errorText = await res.text();
      let errorObj = null;
      
      // Try to parse error as JSON
      try {
        if (errorText) {
          errorObj = JSON.parse(errorText);
        }
      } catch (e) {
        // Keep errorText as is if JSON parsing fails
      }
      
      const errorMessage = 
        (errorObj && errorObj.error) ? errorObj.error :
        (errorObj && errorObj.message) ? errorObj.message :
        errorText || res.statusText || `API Error (${res.status})`;
      
      // Show toast notification for user-facing errors
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 2000
      });
      
      // Create an enhanced error object to be caught by calling code
      const enhancedError: any = new Error(`${res.status}: ${errorMessage}`);
      enhancedError.status = res.status;
      enhancedError.data = errorObj;
      enhancedError.message = errorMessage;
      
      throw enhancedError;
    }

    return res;
  } catch (error) {
    // Handle network errors (like CORS, connection issues)
    if (!(error instanceof Error) || !error.message.startsWith(`${method} ${url}`)) {
      toast({
        title: "Connection Error",
        description: "There was a problem connecting to the server. Please try again.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}

export async function getApiJson<T>(url: string): Promise<T> {
  const response = await apiRequest('GET', url);
  return response.json();
}

export async function postApiJson<T>(url: string, data: unknown): Promise<T> {
  const response = await apiRequest('POST', url, data);
  return response.json();
}

export async function putApiJson<T>(url: string, data: unknown): Promise<T> {
  const response = await apiRequest('PUT', url, data);
  return response.json();
}

export async function deleteApiJson<T>(url: string): Promise<T> {
  const response = await apiRequest('DELETE', url);
  return response.json();
}

// File upload function
export async function uploadFile(url: string, file: File, additionalData?: Record<string, any>): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!res.ok) {
    let errorText = await res.text();
    let errorObj = null;
    
    // Try to parse error as JSON
    try {
      if (errorText) {
        errorObj = JSON.parse(errorText);
      }
    } catch (e) {
      // Keep errorText as is if JSON parsing fails
    }
    
    const errorMessage = 
      (errorObj && errorObj.error) ? errorObj.error :
      (errorObj && errorObj.message) ? errorObj.message :
      errorText || res.statusText || `Upload Error (${res.status})`;
    
    toast({
      title: "Upload Error",
      description: errorMessage,
      variant: "destructive",
      duration: 2000
    });
    
    // Create an enhanced error object to be caught by calling code
    const enhancedError: any = new Error(`${res.status}: ${errorMessage}`);
    enhancedError.status = res.status;
    enhancedError.data = errorObj;
    enhancedError.message = errorMessage;
    
    throw enhancedError;
  }
  
  return res;
}

// Data export function - handles different export formats
export const exportData = async (data: any[], type: string, format: 'pdf' | 'excel' | 'csv' = 'excel'): Promise<void> => {
  try {
    // Export properly formatted data to the selected format
    const endpoint = `/api/exports/${format}`;
    
    // Set the correct Content-Type header based on the format
    const contentType = 'application/json';
    
    // Add additional debugging info
    // Process data before sending to ensure consistent structure
    // This helps normalize data from different sources
    let processedData = data;
    
    // Special handling for workforce/management type - most problematic case
    if (type === 'management' || type === 'workforce') {
      // Check if we have section information
      const hasSectionField = data.length > 0 && 'section' in data[0];
      
      // If data already has a section field, keep it as is
      if (hasSectionField) {
        processedData = data;
      }
      // Otherwise, try to add the section field
      else {
        // Add a default section attribute if missing
        processedData = data.map(item => ({
          section: 'Workforce',
          ...item
        }));
      }
      
      // Log the structure we're sending
    }
    
    // For Excel/PDF, make a POST request to server for server-side generation
    if (format === 'excel' || format === 'pdf') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body: JSON.stringify({ 
          type, 
          data: processedData,
          // Add additional metadata to help server processing
          metadata: {
            exportFormat: format,
            clientType: type,
            hasSection: processedData.length > 0 && 'section' in processedData[0],
            recordCount: processedData.length
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.statusText} (${response.status})`);
      }
      
      // Get blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } 
    // For CSV, we'll do the processing on the client side for now
    else if (format === 'csv') {
      let csvContent = '';
      
      // If data array is not empty, extract headers from first item
      if (processedData.length > 0) {
        // Get headers from the first object
        const headers = Object.keys(processedData[0]);
        csvContent += headers.join(',') + '\n';
        
        // Add data rows
        processedData.forEach(item => {
          const row = headers.map(header => {
            const cell = item[header];
            // Handle different value types properly
            if (cell === null || cell === undefined) {
              return '';
            }
            // Handle string values with commas by enclosing in quotes
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
              // Escape quotes within the string by doubling them
              return `"${cell.replace(/"/g, '""')}"`;
            }
            // Handle objects by converting to JSON
            if (typeof cell === 'object') {
              return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
            }
            return cell;
          }).join(',');
          csvContent += row + '\n';
        });
      }
      
      // Create Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    throw error;
  }
};

// Candidate API functions
export interface Candidate {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  resumeUrl: string | null;
  status: string;
  aiScore: number | null;
  source: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Get all candidates
export async function fetchAllCandidates(): Promise<Candidate[]> {
  return getApiJson<Candidate[]>('/api/candidates');
}

// Get a specific candidate by ID
export async function fetchCandidate(id: number): Promise<Candidate> {
  return getApiJson<Candidate>(`/api/candidates/${id}`);
}

// Get candidates by status
export async function fetchCandidatesByStatus(status: string): Promise<Candidate[]> {
  return getApiJson<Candidate[]>(`/api/candidates/status/${status}`);
}

// Interview API functions
export interface Interview {
  id: number;
  candidateId: number;
  date: Date;
  location: string;
  interviewType: string;
  status: string;
  interviewers: string | null;
  notes: string | null;
  feedback: string | null;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInterviewRequest {
  candidateId: number;
  date: Date | string;
  location: string;
  interviewType: string;
  status?: string;
  interviewers?: string | null;
  notes?: string | null;
}

export interface UpdateInterviewRequest {
  date?: Date | string;
  location?: string;
  interviewType?: string;
  status?: string;
  interviewers?: string | null;
  notes?: string | null;
  feedback?: string | null;
  result?: string | null;
}

// Get all interviews
export async function fetchAllInterviews(): Promise<Interview[]> {
  return getApiJson<Interview[]>('/api/interviews');
}

// Get scheduled interviews
export async function fetchScheduledInterviews(): Promise<Interview[]> {
  return getApiJson<Interview[]>('/api/interviews/scheduled');
}

// Get completed interviews
export async function fetchCompletedInterviews(): Promise<Interview[]> {
  return getApiJson<Interview[]>('/api/interviews/completed');
}

// Get interviews for a specific candidate
export async function fetchCandidateInterviews(candidateId: number): Promise<Interview[]> {
  return getApiJson<Interview[]>(`/api/interviews/candidate/${candidateId}`);
}

// Get a specific interview by ID
export async function fetchInterview(id: number): Promise<Interview> {
  return getApiJson<Interview>(`/api/interviews/${id}`);
}

// Create a new interview
export async function createInterview(interview: CreateInterviewRequest): Promise<Interview> {
  return postApiJson<Interview>('/api/interviews', interview);
}

// Update an existing interview
export async function updateInterview(id: number, interview: UpdateInterviewRequest): Promise<Interview> {
  return putApiJson<Interview>(`/api/interviews/${id}`, interview);
}

// Delete an interview
export async function deleteInterview(id: number): Promise<{ success: boolean }> {
  return deleteApiJson<{ success: boolean }>(`/api/interviews/${id}`);
}

// Email API functions
export interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  result?: {
    messageId: string;
    previewUrl?: string;
  };
}

// Send an email
export async function sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
  return postApiJson<EmailResponse>('/api/email/send', emailData);
}
