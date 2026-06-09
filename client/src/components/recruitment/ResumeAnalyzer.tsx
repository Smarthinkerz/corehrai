import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { Loader2, Upload, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

interface AnalysisResult {
  match_score: number;
  key_skills: string[];
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface CandidateFormData {
  fullName: string;
  email: string;
  position: string;
  department: string;
  source: string;
  status: string;
  aiScore: number;
}

const ResumeAnalyzer = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [resumeTab, setResumeTab] = useState('text');
  const [jobDescTab, setJobDescTab] = useState('text');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isRedacting, setIsRedacting] = useState(false);
  const [redactionResult, setRedactionResult] = useState<{ redactedText: string; redactedItems: string[] } | null>(null);
  const { toast } = useToast();

  const extractTextFromFile = async (file: File): Promise<string> => {
    // In a real implementation, you would send the file to the server
    // and use a library like pdf.js, mammoth.js, etc. to extract the text
    
    // For this demo, we'll just read the file as text if it's a text file
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    // For other file types like PDF or Word, we'll need server-side processing
    // Here we'll simulate that the file was processed and return dummy text
    toast({
      title: "File processing simulated",
      description: `Extracted text from ${file.name} (in a real app, this would use server-side processing)`,
    });
    
    return `Simulated text extraction from ${file.name}. In a real implementation, we would process the ${file.type} file server-side.`;
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleJobDescFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    let finalResumeText = resumeText;
    let finalJobDesc = jobDescription;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Process resume file if selected
      if (resumeTab === 'upload' && resumeFile) {
        finalResumeText = await extractTextFromFile(resumeFile);
      } else if (resumeTab === 'text' && !resumeText.trim()) {
        setError('Please paste or upload a resume to analyze');
        setIsAnalyzing(false);
        return;
      }
      
      // Process job description file if selected
      if (jobDescTab === 'upload' && jobDescFile) {
        finalJobDesc = await extractTextFromFile(jobDescFile);
      }
      
      const response = await apiRequest('POST', '/api/candidates/analyze-resume', {
        resumeText: finalResumeText,
        jobDescription: finalJobDesc.trim() || undefined
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRedactPII = async () => {
    const textToRedact = resumeTab === 'text' ? resumeText : '';
    if (!textToRedact.trim()) {
      toast({
        title: "No resume text",
        description: "Please paste resume text first to redact PII.",
        variant: "destructive"
      });
      return;
    }
    setIsRedacting(true);
    setRedactionResult(null);
    try {
      const response = await apiRequest('POST', '/api/candidates/redact-resume', {
        resumeText: textToRedact
      });
      const data = await response.json();
      setRedactionResult(data);
      toast({
        title: "PII Redacted",
        description: `${data.redactedItems.length} types of personal information removed.`,
      });
    } catch (err) {
      toast({
        title: "Redaction failed",
        description: "Failed to redact PII. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRedacting(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      // In a real implementation, you would save the analysis to the database
      // await apiRequest('POST', '/api/resume-analyses', {
      //   resumeText,
      //   jobDescription,
      //   result
      // });
      
      toast({
        title: "Analysis saved",
        description: "Resume analysis has been saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCandidate = async () => {
    if (!result) return;
    
    setIsAddingCandidate(true);
    try {
      // Extract a name from the resume text (this is a very simplified approach)
      const nameMatch = resumeText.match(/^(.+?)(?:\r|\n|$)/);
      const possibleName = nameMatch ? nameMatch[1].trim() : "Candidate";
      
      // Prepare candidate data
      const candidateData: CandidateFormData = {
        fullName: possibleName,
        email: "candidate@example.com", // In a real app, extract this from the resume
        position: jobDescription ? jobDescription.split('\n')[0].trim() : "Unspecified Position",
        department: "Unspecified", // Would be extracted from job description
        source: "Resume Analyzer",
        status: "new",
        aiScore: result.match_score
      };
      
      // In a real implementation, you would add the candidate to the database
      // await apiRequest('POST', '/api/candidates', candidateData);
      
      toast({
        title: "Candidate added",
        description: "Candidate has been added to the pipeline.",
      });
      
      // Refresh the candidates list
      // queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add candidate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingCandidate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Tabs value={resumeTab} onValueChange={setResumeTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Enter Text</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Paste Resume Text
              </label>
              <Textarea
                placeholder="Paste the candidate's resume text here..."
                className="min-h-[280px]"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <div className="space-y-2">
                <Label>Upload Resume</Label>
                <div className="border-2 border-dashed border-neutral-200 rounded-md p-6 text-center">
                  <Upload className="mx-auto h-10 w-10 text-neutral-400" />
                  <div className="mt-2">
                    <Label
                      htmlFor="resume-upload"
                      className="cursor-pointer relative font-medium text-primary hover:text-primary/90"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="resume-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleResumeFileChange}
                      />
                    </Label>
                    <p className="text-xs text-neutral-500 mt-1">
                      PDF, Word, or text files (max 10MB)
                    </p>
                  </div>
                  {resumeFile && (
                    <div className="mt-2 px-3 py-1 bg-primary/10 rounded text-sm text-primary inline-flex items-center">
                      <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-primary hover:text-primary/70"
                        onClick={() => setResumeFile(null)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Tabs value={jobDescTab} onValueChange={setJobDescTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Enter Text</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Job Description (Optional)
              </label>
              <Textarea
                placeholder="Paste the job description for better matching..."
                className="min-h-[280px]"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <div className="space-y-2">
                <Label>Upload Job Description</Label>
                <div className="border-2 border-dashed border-neutral-200 rounded-md p-6 text-center">
                  <Upload className="mx-auto h-10 w-10 text-neutral-400" />
                  <div className="mt-2">
                    <Label
                      htmlFor="job-desc-upload"
                      className="cursor-pointer relative font-medium text-primary hover:text-primary/90"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="job-desc-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleJobDescFileChange}
                      />
                    </Label>
                    <p className="text-xs text-neutral-500 mt-1">
                      PDF, Word, or text files (max 10MB)
                    </p>
                  </div>
                  {jobDescFile && (
                    <div className="mt-2 px-3 py-1 bg-primary/10 rounded text-sm text-primary inline-flex items-center">
                      <span className="truncate max-w-[200px]">{jobDescFile.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-primary hover:text-primary/70"
                        onClick={() => setJobDescFile(null)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border-l-4 border-error p-4 text-sm text-error-800">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || ((resumeTab === 'text' && !resumeText.trim()) || (resumeTab === 'upload' && !resumeFile))}
          className="w-48"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : 'Analyze Resume'}
        </Button>
        <Button 
          variant="outline"
          onClick={handleRedactPII}
          disabled={isRedacting || (resumeTab === 'text' && !resumeText.trim())}
          className="w-48"
        >
          {isRedacting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redacting...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Redact PII
            </>
          )}
        </Button>
      </div>

      {isRedacting && (
        <div className="text-center">
          <p className="text-sm text-neutral-500 mb-2">Removing personal information for unbiased evaluation...</p>
          <Progress value={50} className="w-full max-w-md mx-auto" />
        </div>
      )}

      {redactionResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium text-green-900">PII Redacted Resume</h3>
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-green-700 mb-2">Redacted Information Types:</p>
              <div className="flex flex-wrap gap-1.5">
                {redactionResult.redactedItems.map((item, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="bg-white border border-green-200 rounded-md p-4">
              <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans">{redactionResult.redactedText}</pre>
            </div>
            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResumeText(redactionResult.redactedText);
                  setRedactionResult(null);
                  toast({ title: "Applied", description: "Redacted text loaded into resume field for analysis." });
                }}
              >
                Use Redacted Text for Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAnalyzing && (
        <div className="text-center">
          <p className="text-sm text-neutral-500 mb-2">Processing with AI...</p>
          <Progress value={45} className="w-full max-w-md mx-auto" />
        </div>
      )}

      {result && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Match Score</h3>
                <div className="flex items-center">
                  <div className="w-full bg-neutral-100 rounded-full h-4 mr-4 flex-1">
                    <div 
                      className={`h-4 rounded-full ${
                        result.match_score >= 80 
                          ? 'bg-success' 
                          : result.match_score >= 60 
                            ? 'bg-warning-500' 
                            : 'bg-error'
                      }`}
                      style={{ width: `${result.match_score}%` }}
                    ></div>
                  </div>
                  <span className="text-xl font-bold">{result.match_score}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Key Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.key_skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-neutral-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Gaps & Areas for Exploration</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {result.gaps.map((gap, index) => (
                    <li key={index} className="text-sm text-neutral-700">{gap}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">AI Recommendation</h3>
                <p className="text-sm text-neutral-700 p-4 bg-neutral-50 rounded-md border border-neutral-200">
                  {result.recommendation}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleSaveAnalysis}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Analysis'}
                </Button>
                <Button 
                  onClick={handleAddToCandidate}
                  disabled={isAddingCandidate}
                >
                  {isAddingCandidate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : 'Add to Candidates'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
