import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Candidate, Interview } from '@shared/schema';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from "@/components/ui/progress";

// Define the evaluation response interface
interface EvaluationResponse {
  score: number;
  categories: Array<{ name: string; score: number }>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

interface CandidateTableProps {
  statusFilter?: string[];
  departmentFilter?: string[];
}

const CandidateTable = ({ statusFilter = [], departmentFilter = [] }: CandidateTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States for filtering and search
  const [searchQuery, setSearchQuery] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<string[]>(statusFilter);
  const [localDepartmentFilter, setLocalDepartmentFilter] = useState<string[]>(departmentFilter);
  
  // States for candidate actions
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);
  
  // Interview scheduling states
  const [interviewDate, setInterviewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [interviewDuration, setInterviewDuration] = useState('60');
  const [interviewNotes, setInterviewNotes] = useState('');
  
  // Message states
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  
  // Evaluation states
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResponse | null>(null);
  
  // Fetch candidates
  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ['/api/candidates'],
    select: (data: Candidate[]) => data || []
  });
  
  // Handle view profile
  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsViewProfileOpen(true);
  };
  
  // Handle schedule interview
  const handleScheduleInterview = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsScheduleInterviewOpen(true);
    // Reset form values
    setInterviewDate(format(new Date(), 'yyyy-MM-dd'));
    setInterviewLocation('');
    setInterviewType('technical');
    setInterviewDuration('60');
    setInterviewNotes('');
  };
  
  // Handle submit interview
  const handleSubmitInterview = async () => {
    if (!selectedCandidate) return;
    
    const interview: Partial<Interview> = {
      candidateId: selectedCandidate.id,
      date: new Date(interviewDate), // Convert string to Date object
      location: interviewLocation,
      interviewType: interviewType, // Match the schema field name
      notes: interviewNotes,
      status: 'scheduled', // Default initial status
    };
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/interviews', 
        interview
      );
      const interviewData = await response.json();
      
      if (response) {
        toast({
          title: "Interview Scheduled",
          description: `Interview with ${selectedCandidate.fullName} scheduled successfully.`,
        });
        
        // Update candidate status to interview if it's not already
        if (selectedCandidate.status !== 'interview') {
          await apiRequest(
            'PATCH',
            `/api/candidates/${selectedCandidate.id}`,
            { status: 'interview' }
          );
          queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
        }
        
        // Invalidate interviews cache
        queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
        
        // Close the dialog
        setIsScheduleInterviewOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle send message
  const handleSendMessage = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsSendMessageOpen(true);
    // Reset message form
    setMessageSubject('');
    setMessageContent('');
  };
  
  // Handle submit message
  const handleSubmitMessage = async () => {
    if (!selectedCandidate) return;
    
    // Implement message sending logic here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Message Sent",
        description: `Message sent to ${selectedCandidate.fullName} successfully.`,
      });
      
      // Close the dialog
      setIsSendMessageOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle status change
  const handleStatusChange = async (candidate: Candidate, newStatus: string) => {
    try {
      await apiRequest(
        'PATCH',
        `/api/candidates/${candidate.id}`,
        { status: newStatus }
      );
      
      toast({
        title: "Status Updated",
        description: `${candidate.fullName}'s status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.`,
      });
      
      // Refresh candidates list
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete candidate
  const handleDeleteCandidate = async (candidate: Candidate) => {
    if (!confirm(`Are you sure you want to remove ${candidate.fullName}?`)) {
      return;
    }
    
    try {
      await apiRequest('DELETE', `/api/candidates/${candidate.id}`);
      
      toast({
        title: "Candidate Removed",
        description: `${candidate.fullName} has been removed from the system.`,
      });
      
      // Refresh candidates list
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove candidate. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle AI evaluation
  const handleEvaluateCandidate = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsEvaluateOpen(true);
    setIsLoadingEvaluation(true);
    setCurrentEvaluation(null);
    
    try {
      // Make the API request
      const response = await apiRequest(
        'POST',
        '/api/candidates/evaluate',
        { candidateId: candidate.id }
      );
      
      // Parse response JSON to get the evaluation data
      const evaluationData: EvaluationResponse = await response.json();
      setCurrentEvaluation(evaluationData);
      
      // Update candidate with AI score if it doesn't have one
      if (!candidate.aiScore && evaluationData?.score) {
        await apiRequest(
          'PATCH',
          `/api/candidates/${candidate.id}`,
          { aiScore: evaluationData.score }
        );
        queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      }
    } catch (error) {
      toast({
        title: "Evaluation Failed",
        description: "Could not complete the AI evaluation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvaluation(false);
    }
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return <Badge variant="outline">New</Badge>;
      case 'screening':
        return <Badge variant="secondary">Screening</Badge>;
      case 'interview':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Interview</Badge>;
      case 'on_hold':
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">On Hold</Badge>;
      case 'next_round':
        return <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600">Next Round</Badge>;
      case 'follow_up':
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Follow Up</Badge>;
      case 'offer':
        return <Badge variant="secondary">Offer</Badge>;
      case 'hired':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Filter candidates
  const filteredCandidates = candidates?.filter(candidate => {
    // Search filter
    const matchesSearch = searchQuery === "" || (
      (candidate.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (candidate.position?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (candidate.department?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (candidate.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
    
    // Status filter (if no status filters selected, show all)
    let matchesStatus = true;
    if (localStatusFilter && localStatusFilter.length > 0) {
      const candidateStatus = (candidate.status || '').toLowerCase();
      // Check if the candidate status is in our filter list
      matchesStatus = localStatusFilter.includes(candidateStatus);
    }
    
    // Department filter (if no department filters selected, show all)
    let matchesDepartment = true;
    if (localDepartmentFilter && localDepartmentFilter.length > 0) {
      const candidateDepartment = candidate.department || '';
      matchesDepartment = localDepartmentFilter.includes(candidateDepartment);
    }
    
    // Debug individual filtering with more detailed information
    if (localStatusFilter.length > 0 && !matchesStatus) {
    }
    
    if (localDepartmentFilter.length > 0 && !matchesDepartment) {
    }
    
    // Return true only if all filters match
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input
          placeholder="Search candidates..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50" avoidCollisions={true} align="start" alignOffset={-150} sideOffset={5}>
              <div className="space-y-4 p-2">
                <h4 className="font-medium">Filter Candidates</h4>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Status</h5>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 pb-2">
                    {['New', 'Screening', 'Interview', 'On Hold', 'Next Round', 'Follow Up', 'Offer', 'Rejected', 'Hired'].map((s) => {
                      // Convert UI filter text to database status format
                      const dbStatus = s.toLowerCase().replace(/ /g, '_');
                      
                      return (
                        <Button 
                          key={s}
                          variant={localStatusFilter.includes(dbStatus) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            // Update local status filter
                            let newStatusFilter;
                            if (localStatusFilter.includes(dbStatus)) {
                              newStatusFilter = localStatusFilter.filter(status => status !== dbStatus);
                            } else {
                              newStatusFilter = [...localStatusFilter, dbStatus];
                            }
                            
                            // Set the new local filter state
                            setLocalStatusFilter(newStatusFilter);
                            
                            // Refresh the candidates list
                            queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
                            
                            // Show toast
                            toast({
                              title: localStatusFilter.includes(dbStatus) ? `Removed ${s} Filter` : `Added ${s} Filter`,
                              description: localStatusFilter.includes(dbStatus)
                                ? `Removed ${s} from status filters.` 
                                : `Added ${s} to status filters.`,
                              duration: 2000
                            });
                          }}
                        >
                          {s}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Department</h5>
                  <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-2 pb-2">
                    {['Engineering', 'Marketing', 'Sales', 'Product', 'Human Resources', 'Finance', 'Operations'].map((d) => (
                      <Button 
                        key={d}
                        variant={localDepartmentFilter.includes(d) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          // Update local department filter
                          let newDepartmentFilter;
                          if (localDepartmentFilter.includes(d)) {
                            newDepartmentFilter = localDepartmentFilter.filter(dept => dept !== d);
                          } else {
                            newDepartmentFilter = [...localDepartmentFilter, d];
                          }
                          
                          // Set the new local filter state
                          setLocalDepartmentFilter(newDepartmentFilter);
                          
                          // Refresh the candidates list
                          queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
                          
                          // Show toast
                          toast({
                            title: localDepartmentFilter.includes(d) ? `Removed ${d} Filter` : `Added ${d} Filter`,
                            description: localDepartmentFilter.includes(d)
                              ? `Removed ${d} from department filters.` 
                              : `Added ${d} to department filters.`,
                            duration: 2000
                          });
                        }}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Reset button */}
                <div className="pt-4 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setLocalStatusFilter([]);
                      setLocalDepartmentFilter([]);
                      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
                      
                      toast({
                        title: "Filters Reset",
                        description: "All filters have been cleared.",
                        duration: 2000
                      });
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline">
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-error-50 border-l-4 border-error p-4 text-sm text-error-800">
          Error loading candidates. Please try again.
        </div>
      ) : filteredCandidates && filteredCandidates.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{candidate.fullName}</span>
                    <span className="text-xs text-neutral-500">{candidate.email}</span>
                  </div>
                </TableCell>
                <TableCell>{candidate.position}</TableCell>
                <TableCell>{candidate.department}</TableCell>
                <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                <TableCell>
                  {candidate.aiScore ? (
                    <div className="flex items-center">
                      <span 
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          candidate.aiScore >= 80 ? 'bg-success' : 
                          candidate.aiScore >= 60 ? 'bg-warning-500' : 'bg-error'
                        }`}
                      ></span>
                      <span>{candidate.aiScore}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-400">--</span>
                  )}
                </TableCell>
                <TableCell>{candidate.source || 'Direct'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewProfile(candidate)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleScheduleInterview(candidate)}>
                        Schedule Interview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendMessage(candidate)}>
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEvaluateCandidate(candidate)}>
                        AI Evaluation
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'new')}>
                            New
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'screening')}>
                            Screening
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'interview')}>
                            Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'on_hold')}>
                            On Hold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'next_round')}>
                            Next Round
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'follow_up')}>
                            Follow Up
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'offer')}>
                            Offer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'hired')}>
                            <span className="text-success">Hired</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(candidate, 'rejected')}>
                            <span className="text-error">Rejected</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-error" 
                        onClick={() => handleDeleteCandidate(candidate)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-10 text-neutral-500">
          {searchQuery ? 'No candidates match your search criteria' : 'No candidates found'}
        </div>
      )}
      
      {/* View Profile Dialog */}
      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-semibold text-primary">
                  {selectedCandidate.fullName.charAt(0)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{selectedCandidate.fullName}</h3>
                  <p className="text-muted-foreground">{selectedCandidate.position}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCandidate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedCandidate.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedCandidate.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="pt-1">{getStatusBadge(selectedCandidate.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="font-medium">{selectedCandidate.source || 'Direct'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AI Score</p>
                    <p className="font-medium">{selectedCandidate.aiScore || 'Not evaluated'}</p>
                  </div>
                </div>
                
                {selectedCandidate.notes && (
                  <div className="pt-3">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedCandidate.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewProfileOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Interview - Using our enhanced component */}
      {selectedCandidate && isScheduleInterviewOpen && (
        <Dialog open={isScheduleInterviewOpen} onOpenChange={setIsScheduleInterviewOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={(e) => { 
              e.preventDefault();
              handleSubmitInterview();
            }}>
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
                <DialogDescription>
                  Schedule an interview with {selectedCandidate.fullName} for {selectedCandidate.position} position.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interview-date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="interview-date"
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      required
                    />
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
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
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
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                        <SelectItem value="culture">Culture Fit</SelectItem>
                        <SelectItem value="case">Case Study</SelectItem>
                        <SelectItem value="final">Final Round</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interview-duration" className="text-right">
                    Duration (min)
                  </Label>
                  <div className="col-span-3">
                    <Select value={interviewDuration} onValueChange={setInterviewDuration}>
                      <SelectTrigger id="interview-duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">120 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interview-notes" className="text-right">
                    Notes
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="interview-notes"
                      placeholder="Add any special instructions or topics to cover..."
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Schedule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Send Message Dialog */}
      {selectedCandidate && isSendMessageOpen && (
        <Dialog open={isSendMessageOpen} onOpenChange={setIsSendMessageOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={(e) => { 
              e.preventDefault();
              handleSubmitMessage();
            }}>
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
                <DialogDescription>
                  Send a message to {selectedCandidate.fullName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message-subject" className="text-right">
                    Subject
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="message-subject"
                      placeholder="Message subject"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message-content" className="text-right">
                    Message
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="message-content"
                      placeholder="Write your message here..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      className="resize-none min-h-[120px]"
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Send Message</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* AI Evaluation Dialog */}
      <Dialog open={isEvaluateOpen} onOpenChange={setIsEvaluateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Candidate Evaluation</DialogTitle>
            {selectedCandidate && (
              <DialogDescription>
                AI-powered evaluation of {selectedCandidate.fullName} for {selectedCandidate.position} position.
              </DialogDescription>
            )}
          </DialogHeader>
          
          {isLoadingEvaluation ? (
            <div className="py-8 space-y-4">
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-center text-muted-foreground">Analyzing candidate profile, resume and interview performance...</p>
              <Progress value={45} className="w-full" />
            </div>
          ) : currentEvaluation ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Overall Score</h3>
                  <p className="text-muted-foreground text-sm">Candidate fit for the position</p>
                </div>
                <div className="flex items-center">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      currentEvaluation.score >= 80 ? 'bg-success/20 text-success-800' : 
                      currentEvaluation.score >= 60 ? 'bg-warning-500/20 text-warning-800' : 'bg-error/20 text-error'
                    }`}
                  >
                    {currentEvaluation.score}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Category Breakdown</h3>
                <div className="space-y-3">
                  {currentEvaluation.categories.map((category: any) => (
                    <div key={category.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">{category.name}</span>
                        <span className="text-sm font-medium">{category.score}/100</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${
                            category.score >= 80 ? 'bg-success' : 
                            category.score >= 60 ? 'bg-warning-500' : 'bg-error'
                          }`}
                          style={{ width: `${category.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Analysis</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-md">
                    <h4 className="font-medium mb-1">Strengths</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {currentEvaluation.strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-sm">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-neutral-100 rounded-md">
                    <h4 className="font-medium mb-1">Areas for Improvement</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {currentEvaluation.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="text-sm">{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-3 border-l-4 border-primary/50 bg-primary/5 rounded-r-md">
                    <h4 className="font-medium mb-1">Recommendation</h4>
                    <p className="text-sm">{currentEvaluation.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to generate evaluation. Please try again.
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsEvaluateOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateTable;
