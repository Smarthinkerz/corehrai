import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getApiJson, apiRequest } from '@/lib/api';
import { SurveyForm } from './SurveyForm';
import { SurveyResponseForm } from './SurveyResponseForm';
import { EngagementContext } from '../../contexts/engagement-context';
import { EngagementSurvey, SurveyQuestion, SurveyResponse } from '../../types/engagement';

export const SurveyManagement = () => {
  // Use parent component's setActiveTab
  const context = React.useContext(EngagementContext);
  if (!context) {
    throw new Error('SurveyManagement must be used within EngagementContext provider');
  }
  const { setActiveTab } = context;
  const [editSurvey, setEditSurvey] = useState<EngagementSurvey | undefined>(undefined);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<EngagementSurvey | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddTestDialog, setShowAddTestDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<EngagementSurvey | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch all surveys 
  const { 
    data: surveys, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['/api/surveys'],
    queryFn: () => getApiJson<EngagementSurvey[]>('/api/surveys'),
  });
  
  // Get responses data for participation stats
  const { 
    data: responsesData,
    isLoading: responsesLoading
  } = useQuery({
    queryKey: ['/api/survey-responses'],
    queryFn: () => getApiJson<{responses: SurveyResponse[], timestamp: string}>('/api/survey-responses'),
  });
  
  // Function to handle survey deletion
  const handleDeleteSurvey = async () => {
    if (!surveyToDelete) return;
    
    try {
      setIsDeleting(true);
      
      await apiRequest('DELETE', `/api/surveys/${surveyToDelete.id}`);
      
      toast({
        title: "Survey Deleted",
        description: "The survey has been deleted successfully."
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      
      // Close dialog
      setShowDeleteDialog(false);
      setSurveyToDelete(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to get responses count for a specific survey
  const getResponsesCount = (surveyId: number) => {
    if (!responsesData || !responsesData.responses) return 0;
    return responsesData.responses.filter(r => r.surveyId === surveyId).length;
  };
  
  // Filter surveys based on the active filter
  const filteredSurveys = useMemo(() => {
    if (!surveys) return [];
    
    if (activeFilter === 'all') return surveys;
    if (activeFilter === 'active') return surveys.filter(s => s.status === 'active');
    if (activeFilter === 'draft') return surveys.filter(s => s.status === 'draft');
    if (activeFilter === 'closed') return surveys.filter(s => s.status === 'closed');
    
    return surveys;
  }, [surveys, activeFilter]);
  
  // Format date to a readable format
  const formatDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Check if a survey is currently active
  const isSurveyActive = (survey: EngagementSurvey) => {
    // For testing purposes, always return true if status is active
    return survey.status === 'active';
  };
  
  // Parse the questions JSON into an array
  const parseQuestions = (survey: EngagementSurvey): SurveyQuestion[] => {
    try {
      if (typeof survey.questions === 'string') {
        return JSON.parse(survey.questions);
      }
      return survey.questions as unknown as SurveyQuestion[];
    } catch (e) {
      return [];
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="space-y-3">
          <svg 
            className="animate-spin h-8 w-8 text-primary mx-auto" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-center text-neutral-500">Loading surveys...</p>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error Loading Surveys</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load surveys. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Comment for reference - state declaration moved to the top

  // Create sample survey for testing scrollbars
  const createSampleSurvey = async () => {
    try {
      // The schema expects string dates in YYYY-MM-DD format
      const startDateStr = "2025-01-01";
      const endDateStr = "2025-03-31";
      
      // Create the sample survey with string dates matching what the form validation expects
      const sampleSurvey = {
        title: "Employee Satisfaction Survey - 2025 Q1",
        description: "This survey is designed to gather feedback on workplace satisfaction, team dynamics, and your overall experience at our company. Your insights will help us improve our work environment and address any concerns.",
        status: "active",
        startDate: startDateStr, // String format (YYYY-MM-DD) as expected by the form schema
        endDate: endDateStr, // String format (YYYY-MM-DD) as expected by the form schema
        createdBy: 1,
        questions: JSON.stringify([
          { id: 1, type: "rating", text: "How satisfied are you with your current role?", options: ["1", "2", "3", "4", "5"] },
          { id: 2, type: "rating", text: "How would you rate the work-life balance in your department?", options: ["1", "2", "3", "4", "5"] },
          { id: 3, type: "rating", text: "Rate your satisfaction with the leadership in your department.", options: ["1", "2", "3", "4", "5"] },
          { id: 4, type: "rating", text: "How likely are you to recommend our company as a great place to work?", options: ["1", "2", "3", "4", "5"] },
          { id: 5, type: "text", text: "What improvements would you like to see in your workplace?" },
          { id: 6, type: "text", text: "Do you feel recognized for your contributions and achievements?" },
          { id: 7, type: "text", text: "What additional resources or support would help you succeed in your role?" }
        ])
      };
      
      // Use apiRequest from our lib to ensure proper handling
      await apiRequest(
        'POST',
        '/api/surveys',
        sampleSurvey
      );
      
      toast({
        title: "Sample Survey Created",
        description: "A sample survey has been created for testing purposes.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
    } catch (error) {
      toast({
        title: "Error Creating Sample Survey",
        description: "Failed to create sample survey. See console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Employee Surveys</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage and track employee feedback surveys.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex p-1 bg-neutral-100 rounded-md">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeFilter === 'all' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeFilter === 'active' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('draft')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeFilter === 'draft' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setActiveFilter('closed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeFilter === 'closed' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Closed
            </button>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showAddTestDialog} onOpenChange={setShowAddTestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  Add Test Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Add Test Survey</DialogTitle>
                  <DialogDescription>
                    Create a sample survey with pre-defined questions.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="mb-4">This will create a pre-populated survey with the following details:</p>
                  <ul className="list-disc list-inside space-y-1 mb-4">
                    <li>Title: Employee Satisfaction Survey - 2025 Q1</li>
                    <li>Status: Active</li>
                    <li>Date Range: Jan 1, 2025 - Mar 31, 2025</li>
                    <li>7 pre-defined questions (ratings and text responses)</li>
                  </ul>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddTestDialog(false)}>Cancel</Button>
                    <Button onClick={() => {
                      createSampleSurvey();
                      setShowAddTestDialog(false);
                    }}>Create Sample Survey</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="ml-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Create New Survey</DialogTitle>
                  <DialogDescription>
                    Create a new survey to collect feedback from employees.
                  </DialogDescription>
                </DialogHeader>
                <SurveyForm 
                  onSurveyCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {filteredSurveys.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-neutral-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-neutral-900">No surveys found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {activeFilter !== 'all' 
                  ? `No ${activeFilter} surveys found. Try a different filter or create a new survey.` 
                  : 'Create your first survey to get started with employee engagement.'}
              </p>
              <div className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Create Your First Survey</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Survey</DialogTitle>
                      <DialogDescription>
                        Create a new survey to collect feedback from employees.
                      </DialogDescription>
                    </DialogHeader>
                    <SurveyForm 
                      onSurveyCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => (
            <Card key={survey.id} className="overflow-hidden flex flex-col h-[400px]">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className={
                    isSurveyActive(survey) 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : survey.status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-100'
                  }>
                    {isSurveyActive(survey) ? 'Active' : survey.status}
                  </Badge>
                  <div className="flex">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                      onClick={() => {
                        setEditSurvey(survey);
                        setShowEditDialog(true);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                      onClick={() => {
                        setSurveyToDelete(survey);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </Button>
                  </div>
                </div>
                
                {/* Combined title and description in a single scrollable area */}
                <div className="mt-3 border border-gray-300 rounded-md shadow-sm" style={{ height: '150px', overflow: 'auto' }}>
                  <div className="p-3">
                    <div className="font-semibold">{survey.title}</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {survey.description || 'No description provided.'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3 flex-1 overflow-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded-md">
                      <p className="text-neutral-500">Start Date</p>
                      <p className="font-medium">{formatDateString(survey.startDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <p className="text-neutral-500">End Date</p>
                      <p className="font-medium">{formatDateString(survey.endDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                    <div>
                      <p className="text-neutral-500">Questions</p>
                      <p className="font-medium">{parseQuestions(survey).length}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Responses</p>
                      <p className="font-medium">{responsesLoading ? '...' : getResponsesCount(survey.id)}</p>
                    </div>
                  </div>
                  
                  {/* Preview of questions */}
                  {parseQuestions(survey).length > 0 && (
                    <div className="mt-2 bg-gray-50 p-2 rounded-md">
                      <p className="text-neutral-500 text-sm font-medium">Question Preview:</p>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {parseQuestions(survey).slice(0, 3).map((question, idx) => (
                          <li key={idx} className="text-neutral-700 truncate">
                            {question.text}
                          </li>
                        ))}
                        {parseQuestions(survey).length > 3 && 
                          <li className="text-neutral-500 italic">
                            +{parseQuestions(survey).length - 3} more questions
                          </li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-2 pt-0">
                <div className="flex gap-2 w-full">
                  {survey.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedSurvey(survey);
                        setShowResponseDialog(true);
                      }}
                    >
                      Take Survey
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Open edit dialog to view/modify survey
                      setEditSurvey(survey);
                      setShowEditDialog(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
            <DialogDescription>
              Make changes to the survey details and questions.
            </DialogDescription>
          </DialogHeader>
          {editSurvey && (
            <SurveyForm 
              editSurvey={editSurvey}
              onSurveyCreated={() => {
                setShowEditDialog(false);
                setEditSurvey(undefined);
                queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Survey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this survey? {surveyToDelete && getResponsesCount(surveyToDelete.id) > 0 && 
                `This will also delete ${getResponsesCount(surveyToDelete.id)} responses.`
              } This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setSurveyToDelete(undefined);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSurvey}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Survey'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Survey Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Complete Survey</DialogTitle>
            <DialogDescription>
              Please provide your feedback by answering all questions below.
            </DialogDescription>
          </DialogHeader>
          {selectedSurvey && (
            <SurveyResponseForm 
              survey={selectedSurvey}
              onResponseComplete={() => {
                setShowResponseDialog(false);
                setSelectedSurvey(null);
                queryClient.invalidateQueries({ queryKey: ['/api/survey-responses'] });
                toast({
                  title: "Thank you!",
                  description: "Your feedback has been recorded."
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};