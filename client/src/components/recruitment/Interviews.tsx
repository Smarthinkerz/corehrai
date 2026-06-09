import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon, XIcon, X, AlertCircle, Calendar, Clock, MapPin, Users, FileText, Inbox, User, Pause as PauseIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Interview,
  CreateInterviewRequest,
  fetchAllInterviews,
  fetchScheduledInterviews,
  fetchCompletedInterviews,
  fetchCandidateInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  Candidate,
  fetchCandidate,
  fetchCandidatesByStatus
} from "@/lib/api";

interface ScheduleInterviewProps {
  candidateId: number;
  candidateName: string;
  position: string;
  onScheduled?: () => void;
}

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"
];

const interviewTypes = [
  "Phone Screen", "Technical Interview", "HR Interview", "Cultural Fit", 
  "Case Study", "Final Round", "Panel Interview", "Hiring Manager"
];

export const ScheduleInterview = ({ candidateId, candidateName, position, onScheduled }: ScheduleInterviewProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string>("");
  const [interviewType, setInterviewType] = useState<string>("");
  const [interviewers, setInterviewers] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [open, setOpen] = useState(true);
  
  const { toast } = useToast();
  
  const resetForm = () => {
    setDate(undefined);
    setTime(undefined);
    setLocation("");
    setInterviewType("");
    setInterviewers("");
    setNotes("");
  };
  
  const scheduleMutation = useMutation({
    mutationFn: createInterview,
    onSuccess: () => {
      toast({
        title: "Interview Scheduled",
        description: `Interview for ${candidateName} has been scheduled successfully.`,
        duration: 2000
      });
      
      // Invalidate the cache for all interview-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/candidate', candidateId] });
      
      // Also invalidate candidates in case status was updated
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      queryClient.invalidateQueries({ queryKey: [`/api/candidates/${candidateId}`] });
      
      // Force a refetch of scheduled interviews
      queryClient.refetchQueries({ queryKey: ['/api/interviews/scheduled'] });
      
      resetForm();
      setOpen(false);
      if (onScheduled) onScheduled();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview. Please try again.",
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Missing Information",
        description: "Please select a date for the interview.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    if (!time) {
      toast({
        title: "Missing Information",
        description: "Please select a time for the interview.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    if (!location) {
      toast({
        title: "Missing Information",
        description: "Please specify a location for the interview.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    if (!interviewType) {
      toast({
        title: "Missing Information",
        description: "Please select the type of interview.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    // Parse time and combine with date
    const [hours, minutes] = time.replace(" AM", "").replace(" PM", "").split(":");
    let parsedHours = parseInt(hours);
    
    if (time.includes("PM") && parsedHours < 12) {
      parsedHours += 12;
    }
    if (time.includes("AM") && parsedHours === 12) {
      parsedHours = 0;
    }
    
    const interviewDate = new Date(date);
    interviewDate.setHours(parsedHours, parseInt(minutes), 0, 0);
    
    const interviewData: CreateInterviewRequest = {
      candidateId,
      date: interviewDate,
      location,
      interviewType,
      interviewers: interviewers || null,
      notes: notes || null,
      status: "scheduled"
    };
    
    scheduleMutation.mutate(interviewData);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full py-6 text-lg font-medium shadow-md flex items-center justify-center space-x-2">
          <Calendar className="h-5 w-5 mr-2" />
          <span>Schedule Interview</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule an Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {candidateName} for {position} position.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interview-date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="interview-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" side="right" align="start" sideOffset={5}>
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interview-time" className="text-right">
                Time
              </Label>
              <div className="col-span-3">
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="interview-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interview-location" className="text-right">
                Location
              </Label>
              <div className="col-span-3">
                <Input
                  id="interview-location"
                  placeholder="Office, Zoom, Phone, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interview-type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger id="interview-type">
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interviewers" className="text-right">
                Interviewers
              </Label>
              <div className="col-span-3">
                <Input
                  id="interviewers"
                  placeholder="Names of interviewers"
                  value={interviewers}
                  onChange={(e) => setInterviewers(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right align-top pt-2">
                Notes
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  placeholder="Any additional notes for this interview"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-zinc-200" />
              )}
              Schedule Interview
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface InterviewCardProps {
  interview: Interview;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
  onUpdate: (id: number, data: any) => void;
}

const InterviewCard = ({ interview, onComplete, onCancel, onUpdate }: InterviewCardProps) => {
  const interviewDate = new Date(interview.date);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch candidate details when component mounts
  useEffect(() => {
    const getCandidateDetails = async () => {
      try {
        setIsLoading(true);
        const candidateData = await fetchCandidate(interview.candidateId);
        setCandidate(candidateData);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    
    getCandidateDetails();
  }, [interview.candidateId]);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex flex-col">
              {/* Candidate name as the main title */}
              {candidate && (
                <CardTitle className="text-lg flex items-center">
                  <span>{candidate.fullName}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                    {format(interviewDate, "MMM d")}
                  </span>
                </CardTitle>
              )}
            </div>
            
            <CardDescription className="mt-1">
              {format(interviewDate, "EEEE, MMMM d, yyyy")} at {format(interviewDate, "h:mm a")}
            </CardDescription>
            
            {/* Candidate information */}
            {candidate && (
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <span className="font-medium">Position:</span>
                  <span className="ml-2">{candidate.position}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Department:</span>
                  <span className="ml-2">{candidate.department}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {interview.status === "scheduled" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center text-green-600"
                  onClick={() => onComplete(interview.id)}
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center text-red-600"
                  onClick={() => onCancel(interview.id)}
                >
                  <XIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{interview.location}</span>
          </div>
          
          {interview.interviewers && (
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{interview.interviewers}</span>
            </div>
          )}
          
          {/* Candidate email and phone if available */}
          {candidate && (
            <div className="flex items-center text-sm">
              <div className="h-4 w-4 mr-2 flex items-center justify-center text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </div>
              <span>{candidate.email}</span>
              {candidate.phone && (
                <>
                  <span className="mx-2">•</span>
                  <span>{candidate.phone}</span>
                </>
              )}
            </div>
          )}
          
          {interview.notes && (
            <div className="flex items-start text-sm mt-2">
              <FileText className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
              <div>
                <div className="font-medium mb-1">Notes:</div>
                <p className="text-muted-foreground">{interview.notes}</p>
              </div>
            </div>
          )}
          
          {interview.feedback && (
            <div className="flex items-start text-sm mt-2">
              <Inbox className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
              <div>
                <div className="font-medium mb-1">Feedback:</div>
                <p className="text-muted-foreground">{interview.feedback}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 border-t flex justify-between">
        {interview.status === "completed" && interview.result === "pass" && (
          <div className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckIcon className="h-3 w-3 mr-1" />
            Passed
          </div>
        )}
        {interview.status === "completed" && interview.result === "fail" && (
          <div className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center">
            <XIcon className="h-3 w-3 mr-1" />
            Failed
          </div>
        )}
        {interview.status === "completed" && interview.result === "on_hold" && (
          <div className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            On Hold
          </div>
        )}
        {interview.status === "completed" && !interview.result && (
          <div className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckIcon className="h-3 w-3 mr-1" />
            Completed
          </div>
        )}
        {interview.status === "cancelled" && (
          <div className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center">
            <XIcon className="h-3 w-3 mr-1" />
            Cancelled
          </div>
        )}
        {interview.status === "scheduled" && (
          <div className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Last updated: {format(new Date(interview.updatedAt), "MMM d, yyyy")}
        </div>
      </CardFooter>
    </Card>
  );
};

interface InterviewsProps {
  statusFilter?: string[];
  departmentFilter?: string[];
}

const Interviews = ({ statusFilter: initialStatusFilter = [], departmentFilter: initialDepartmentFilter = [] }: InterviewsProps) => {
  const [activeTab, setActiveTab] = useState("scheduled");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [interviewToCancel, setInterviewToCancel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Make our own internal state for filters that initialize from props
  const [statusFilter, setStatusFilter] = useState<string[]>(initialStatusFilter);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>(initialDepartmentFilter);
  
  // Update internal filters when props change
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setDepartmentFilter(initialDepartmentFilter);
  }, [initialStatusFilter, initialDepartmentFilter]);
  
  const { toast } = useToast();
  
  // Fetch all candidates with interview status
  const candidatesWithInterviewStatusQuery = useQuery({
    queryKey: ['/api/candidates/status/interview'],
    queryFn: () => fetchCandidatesByStatus('interview')
  });
  
  // Fetch scheduled interviews
  const scheduledQuery = useQuery({
    queryKey: ['/api/interviews/scheduled'],
    queryFn: fetchScheduledInterviews,
    staleTime: 0, // Don't use cached data
    refetchOnWindowFocus: true // Refetch when window gains focus
  });
  
  // For debugging
  useEffect(() => {
    if (scheduledQuery.data) {
    }
  }, [scheduledQuery.data]);
  
  // Fetch completed interviews
  const completedQuery = useQuery({
    queryKey: ['/api/interviews/completed'],
    queryFn: fetchCompletedInterviews,
    staleTime: 0, // Don't use cached data
    refetchOnWindowFocus: true // Refetch when window gains focus
  });
  
  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return updateInterview(id, data);
    },
    onSuccess: (updatedInterview, variables) => {
      // Get the result from variables
      const { data } = variables;
      
      // Invalidate interview queries
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/completed'] });
      
      // Also invalidate candidates query since candidate status will be updated
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      
      // If we have the specific candidate ID, also invalidate that specific query
      if (selectedInterview && selectedInterview.candidateId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/candidates/${selectedInterview.candidateId}`] 
        });
      }
      
      // Reset state
      setFeedbackDialogOpen(false);
      setSelectedInterview(null);
      setFeedback("");
      setResult(null);
      
      // Show success message with details about what happened
      let resultMessage = "Interview has been marked as completed with feedback.";
      
      if (data && data.result) {
        if (data.result === 'pass') {
          resultMessage = "The candidate has been moved to the Offer stage.";
        } else if (data.result === 'fail') {
          resultMessage = "The candidate has been marked as Rejected.";
        } else if (data.result === 'on_hold') {
          resultMessage = "The candidate has been put on hold with an On Hold status.";
        } else if (data.result === 'move_forward') {
          resultMessage = "The candidate has been moved to the next round of interviews.";
        } else if (data.result === 'needs_follow_up') {
          resultMessage = "The candidate has been marked for follow-up.";
        }
      }
      
      toast({
        title: "Interview Completed",
        description: resultMessage,
        duration: 3000
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete interview. Please try again.",
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  // Cancel interview mutation
  const cancelInterviewMutation = useMutation({
    mutationFn: async (id: number) => {
      return updateInterview(id, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/scheduled'] });
      setCancelDialogOpen(false);
      setInterviewToCancel(null);
      
      toast({
        title: "Interview Cancelled",
        description: "Interview has been cancelled.",
        duration: 2000
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel interview. Please try again.",
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  const handleComplete = (id: number) => {
    const interview = scheduledQuery.data?.find(i => i.id === id);
    if (interview) {
      setSelectedInterview(interview);
      setFeedbackDialogOpen(true);
    }
  };
  
  const handleCancel = (id: number) => {
    setInterviewToCancel(id);
    setCancelDialogOpen(true);
  };
  
  const handleUpdate = (id: number, data: any) => {
    // Implementation for updating interview details
  };
  
  const submitFeedback = () => {
    if (!selectedInterview) return;
    
    if (!feedback.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide feedback for this interview.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    if (!result) {
      toast({
        title: "Missing Information",
        description: "Please select a result for this interview.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    // Create the data object to pass to the mutation
    const data = {
      status: "completed",
      feedback,
      result
    };
    
    completeInterviewMutation.mutate({
      id: selectedInterview.id,
      data: data
    });
  };
  
  const confirmCancel = () => {
    if (interviewToCancel !== null) {
      cancelInterviewMutation.mutate(interviewToCancel);
    }
  };
  
  // Store candidate data for filtering
  const [candidatesMap, setCandidatesMap] = useState<Map<number, Candidate>>(new Map());
  
  // Fetch all candidate data for filtering
  useEffect(() => {
    const fetchAllCandidates = async () => {
      try {
        // Get all candidate IDs from both scheduled and completed interviews
        const allInterviews = [...(scheduledQuery.data || []), ...(completedQuery.data || [])];
        
        // Create a Set of unique candidate IDs and convert to array
        const uniqueCandidateIdsSet = new Set<number>();
        allInterviews.forEach(interview => uniqueCandidateIdsSet.add(interview.candidateId));
        const uniqueCandidateIds = Array.from(uniqueCandidateIdsSet);
        
        // Create a new map to store candidate data
        const newCandidatesMap = new Map<number, Candidate>();
        
        // Fetch data for each candidate
        for (const candidateId of uniqueCandidateIds) {
          try {
            const candidate = await fetchCandidate(candidateId);
            if (candidate) {
              newCandidatesMap.set(candidateId, candidate);
            }
          } catch (error) {
          }
        }
        
        setCandidatesMap(newCandidatesMap);
      } catch (error) {
      }
    };
    
    if (!scheduledQuery.isLoading && !completedQuery.isLoading && 
        (scheduledQuery.data?.length || completedQuery.data?.length)) {
      fetchAllCandidates();
    }
  }, [scheduledQuery.data, completedQuery.data, scheduledQuery.isLoading, completedQuery.isLoading]);
  
  // Debug effect for filters and show toast notifications when filter changes
  useEffect(() => {
    // Only show notifications when filters are explicitly set (not on initial load)
    if (departmentFilter.length > 0 || statusFilter.length > 0) {
      // Format the filter message for the toast
      const filterDescription = [];
      
      if (statusFilter.length > 0) {
        filterDescription.push(`Status: ${statusFilter.join(', ')}`);
      }
      
      if (departmentFilter.length > 0) {
        filterDescription.push(`Department: ${departmentFilter.join(', ')}`);
      }
      
      // Show toast notification about applied filters
      toast({
        title: "Filters Applied",
        description: `${filterDescription.join(' | ')}`,
        duration: 2000
      });
    }
  }, [departmentFilter, statusFilter, candidatesMap.size]);
  
  // Filter interviews based on search query, status, and department
  const filterInterviews = (interviews: Interview[]) => {
    if (!interviews) return [];
    
    return interviews.filter((interview) => {
      // Get candidate information from our map
      const candidate = candidatesMap.get(interview.candidateId);
      
      // Text search filter
      const matchesSearch = searchQuery === "" || 
        (candidate?.fullName && candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (candidate?.position && candidate.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (candidate?.department && candidate.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        interview.interviewType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (interview.interviewers && interview.interviewers.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Department filter - skip if we don't have department info yet
      const matchesDepartment = departmentFilter.length === 0 || 
        (candidate?.department && departmentFilter.some(dept => 
          candidate.department.toLowerCase().includes(dept.toLowerCase())
        ));
      
      // Status filter (custom logic, since interview status works differently than candidate status)
      // Map interview status to match the structure of statusFilter
      const interviewStatus = interview.status || '';
      const matchesStatus = statusFilter.length === 0 || 
        statusFilter.some(status => {
          if (status === 'interview' && interviewStatus === 'scheduled') return true;
          return interviewStatus.toLowerCase().includes(status.toLowerCase());
        });
      
      // For debugging, output some detailed filter info
      if (departmentFilter.length > 0 || statusFilter.length > 0 || searchQuery !== "") {
      }
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  };
  
  // Auto-schedule interviews for candidates with "interview" status
  const autoScheduleInterviewMutation = useMutation({
    mutationFn: async (candidate: Candidate) => {
      const newInterview: CreateInterviewRequest = {
        candidateId: candidate.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
        location: "To be determined",
        interviewType: "Initial Interview",
        interviewers: null,
        notes: "Auto-scheduled for candidate with interview status",
        status: "scheduled"
      };
      
      return createInterview(newInterview);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/scheduled'] });
      toast({
        title: "Interview Scheduled",
        description: "Interview automatically scheduled for candidate with interview status",
        duration: 2000
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to auto-schedule interview. Please try again.",
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  // Effect to detect candidates with interview status but no scheduled interviews
  useEffect(() => {
    const detectCandidatesNeedingInterviews = async () => {
      if (
        candidatesWithInterviewStatusQuery.isSuccess && 
        scheduledQuery.isSuccess && 
        candidatesWithInterviewStatusQuery.data && 
        scheduledQuery.data
      ) {
        // Get candidates with interview status
        const interviewCandidates = candidatesWithInterviewStatusQuery.data;
        
        // Get all candidate IDs with scheduled interviews
        const scheduledCandidateIds = new Set(
          scheduledQuery.data.map(interview => interview.candidateId)
        );
        
        // Find candidates that have interview status but no scheduled interviews
        const candidatesNeedingInterviews = interviewCandidates.filter(
          (candidate: Candidate) => !scheduledCandidateIds.has(candidate.id)
        );
        
        if (candidatesNeedingInterviews.length > 0) {
          // Ask user if they want to schedule interviews for these candidates
          if (candidatesNeedingInterviews.length === 1) {
            toast({
              title: "Candidate Needs Interview",
              description: (
                <div className="flex flex-col gap-2">
                  <p>{candidatesNeedingInterviews[0].fullName} has interview status but no scheduled interview.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      autoScheduleInterviewMutation.mutate(candidatesNeedingInterviews[0]);
                    }}
                  >
                    Schedule Interview
                  </Button>
                </div>
              ),
              duration: 10000
            });
          } else {
            toast({
              title: "Candidates Need Interviews",
              description: (
                <div className="flex flex-col gap-2">
                  <p>{candidatesNeedingInterviews.length} candidates have interview status but no scheduled interviews.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Schedule for the first candidate as an example
                      autoScheduleInterviewMutation.mutate(candidatesNeedingInterviews[0]);
                    }}
                  >
                    Schedule First Interview
                  </Button>
                </div>
              ),
              duration: 10000
            });
          }
        }
      }
    };
    
    detectCandidatesNeedingInterviews();
  }, [
    candidatesWithInterviewStatusQuery.data, 
    candidatesWithInterviewStatusQuery.isSuccess,
    scheduledQuery.data,
    scheduledQuery.isSuccess,
    autoScheduleInterviewMutation,
    toast
  ]);

  // Apply filters to both scheduled and completed interviews
  const filteredScheduledInterviews = filterInterviews(scheduledQuery.data || []);
  const filteredCompletedInterviews = filterInterviews(completedQuery.data || []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Search interviews by candidate, position, department..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              
              // Show toast notification for search (but only if not empty)
              if (e.target.value.trim() && e.target.value !== searchQuery) {
                toast({
                  title: "Search Applied",
                  description: `Searching for "${e.target.value}"`,
                  duration: 2000
                });
              }
            }}
            className="pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scheduled" className="mt-6">
          {scheduledQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary" />
            </div>
          ) : scheduledQuery.isError ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error loading scheduled interviews. Please try again.
            </div>
          ) : filteredScheduledInterviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {scheduledQuery.data?.length === 0 ? (
                <>
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">No scheduled interviews</h3>
                  <p className="text-sm">Schedule interviews with candidates to prepare for hiring.</p>
                </>
              ) : (
                <>
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">No interviews match your filters</h3>
                  <p className="text-sm">Try adjusting your search criteria.</p>
                </>
              )}
            </div>
          ) : (
            <div>
              {filteredScheduledInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {completedQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary" />
            </div>
          ) : completedQuery.isError ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error loading completed interviews. Please try again.
            </div>
          ) : filteredCompletedInterviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {completedQuery.data?.length === 0 ? (
                <>
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">No completed interviews</h3>
                  <p className="text-sm">Complete scheduled interviews to see them here.</p>
                </>
              ) : (
                <>
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">No interviews match your filters</h3>
                  <p className="text-sm">Try adjusting your search criteria.</p>
                </>
              )}
            </div>
          ) : (
            <div>
              {filteredCompletedInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Interview Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Complete Interview</DialogTitle>
            <DialogDescription>
              Provide feedback and result for this interview.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interview-result" className="text-right">
                Result
              </Label>
              <div className="col-span-3">
                <Select value={result || ''} onValueChange={setResult}>
                  <SelectTrigger id="interview-result">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="move_forward">Move Forward</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback" className="text-right align-top pt-2">
                Feedback
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback about this interview"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="resize-none"
                  rows={5}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackDialogOpen(false);
                setSelectedInterview(null);
                setFeedback("");
                setResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitFeedback}
              disabled={completeInterviewMutation.isPending}
            >
              {completeInterviewMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-zinc-200" />
              )}
              Complete Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Interview Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this interview? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelInterviewMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelInterviewMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-zinc-200" />
              )}
              Yes, cancel interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Interviews;