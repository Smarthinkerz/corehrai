import usePageTitle from "@/hooks/usePageTitle";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import ResumeAnalyzer from '@/components/recruitment/ResumeAnalyzer';
import CandidateTable from '@/components/recruitment/CandidateTable';
import { JobPostings } from '@/components/recruitment/JobPostings';
import Interviews from '@/components/recruitment/Interviews';

const Recruitment = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [status, setStatus] = useState('new');
  const [source, setSource] = useState('Direct');
  const [customSource, setCustomSource] = useState('');
  const [showCustomSource, setShowCustomSource] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Filter states with initial values
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [customDepartmentFilter, setCustomDepartmentFilter] = useState('');
  
  // State to track if filters have been applied
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // For debugging filter issues
  const { toast } = useToast();
  
  // Add candidate mutation
  const addCandidateMutation = useMutation({
    mutationFn: async (candidateData: any) => {
      try {
        const response = await apiRequest('POST', '/api/candidates', candidateData);
        const responseData = await response.json();
        return responseData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      toast({
        title: "Candidate added",
        description: "New candidate has been added successfully.",
        duration: 2000
      });
      resetForm();
      setIsAddCandidateOpen(false);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to add candidate. Please try again.";
      
      // Try to extract a meaningful error message
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      }
      
      // Log detailed error information for debugging
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate form
      if (!fullName.trim()) {
        toast({
          title: "Error",
          description: "Full name is required",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!email.trim()) {
        toast({
          title: "Error",
          description: "Email is required",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!position.trim()) {
        toast({
          title: "Error",
          description: "Position is required",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Check department - either from dropdown or custom input
      const finalDepartment = showCustomDepartment ? customDepartment : department;
      if (!finalDepartment) {
        toast({
          title: "Error",
          description: "Department is required",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Check source - handle custom source if "Other" is selected
      const finalSource = source === 'Other' && showCustomSource ? customSource : source;
      
      // Create candidate object
      const newCandidate = {
        fullName,
        email,
        phone: phone || null,
        position,
        department: finalDepartment,
        status,
        source: finalSource || null,
        notes: notes || null,
        resumeUrl: null,
        aiScore: null
      };
      
      // Add candidate
      await addCandidateMutation.mutateAsync(newCandidate);
      
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPosition('');
    setDepartment('');
    setCustomDepartment('');
    setShowCustomDepartment(false);
    setStatus('new');
    setSource('Direct');
    setCustomSource('');
    setShowCustomSource(false);
    setNotes('');
  };
  
  const handleFilterApply = () => {
    // Log the current filter state for debugging
    // Mark that filters have been applied - setting this first
    setFiltersApplied(true);
    
    // Switch to the candidates tab to make filters apply immediately
    if (activeTab !== 'candidates') {
      setActiveTab('candidates');
    }
    
    // Show feedback toast to the user
    toast({
      title: "Filters Applied",
      description: `Applied ${selectedStatus.length + selectedDepartment.length} filter(s)`,
      duration: 2000
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Talent Acquisition & Recruitment</h1>
          <p className="mt-1 text-neutral-500">Manage your recruiting pipeline with AI-powered insights.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <svg className="-ml-1 mr-2 h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="right" align="start" sideOffset={5}>
              <div className="space-y-4 p-2">
                <h4 className="font-medium">Filter Candidates</h4>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Status</h5>
                  <div className="flex flex-wrap gap-2">
                    {['New', 'Screening', 'Interview', 'On Hold', 'Next Round', 'Follow Up', 'Offer', 'Rejected', 'Hired'].map((s) => {
                      // Convert UI filter text to database status format
                      const dbStatus = s.toLowerCase().replace(/ /g, '_');
                      
                      return (
                        <Button 
                          key={s}
                          variant={selectedStatus.includes(dbStatus) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (selectedStatus.includes(dbStatus)) {
                              setSelectedStatus(selectedStatus.filter(status => status !== dbStatus));
                            } else {
                              setSelectedStatus([...selectedStatus, dbStatus]);
                            }
                            // Log for debugging
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['Engineering', 'Marketing', 'Sales', 'Product', 'Human Resources', 'Finance', 'Operations'].map((d) => (
                      <Button 
                        key={d}
                        variant={selectedDepartment.includes(d) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedDepartment.includes(d)) {
                            setSelectedDepartment(selectedDepartment.filter(dept => dept !== d));
                          } else {
                            setSelectedDepartment([...selectedDepartment, d]);
                          }
                        }}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Department Input */}
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Custom department..." 
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      disabled={!customDepartment.trim()}
                      onClick={() => {
                        if (customDepartment.trim()) {
                          if (!selectedDepartment.includes(customDepartment.trim())) {
                            setSelectedDepartment([...selectedDepartment, customDepartment.trim()]);
                            setCustomDepartment('');
                            
                            // Show toast
                            toast({
                              title: `Added ${customDepartment.trim()} Filter`,
                              description: `Added ${customDepartment.trim()} to department filters.`,
                              duration: 2000
                            });
                          } else {
                            toast({
                              title: "Department already added",
                              description: `${customDepartment.trim()} is already in your filters`,
                              variant: "destructive",
                              duration: 2000
                            });
                          }
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedStatus([]);
                      setSelectedDepartment([]);
                    }}
                  >
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleFilterApply}>Apply Filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Dialog open={isAddCandidateOpen} onOpenChange={setIsAddCandidateOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Candidate</DialogTitle>
                  <DialogDescription>
                    Enter new candidate information to add them to your recruiting pipeline.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="candidate-name">Full Name</Label>
                      <Input
                        id="candidate-name"
                        placeholder="e.g. John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="candidate-email">Email</Label>
                        <Input
                          id="candidate-email"
                          type="email"
                          placeholder="e.g. john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate-phone">Phone</Label>
                        <Input
                          id="candidate-phone"
                          placeholder="e.g. (555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="candidate-position">Position</Label>
                        <Input
                          id="candidate-position"
                          placeholder="e.g. Senior Frontend Developer"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate-department">Department</Label>
                        <div className="flex flex-col space-y-2">
                          <Select 
                            value={department} 
                            onValueChange={(value) => {
                              setDepartment(value);
                              if (value === "Other") {
                                setShowCustomDepartment(true);
                              } else {
                                setShowCustomDepartment(false);
                              }
                            }}
                          >
                            <SelectTrigger id="candidate-department">
                              <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Engineering">Engineering</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Product">Product</SelectItem>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {showCustomDepartment && (
                            <Input
                              placeholder="Enter department name"
                              value={customDepartment}
                              onChange={(e) => setCustomDepartment(e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="candidate-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger id="candidate-status">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="next_round">Next Round</SelectItem>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate-source">Source</Label>
                        <div className="flex flex-col space-y-2">
                          <Select 
                            value={source} 
                            onValueChange={(value) => {
                              setSource(value);
                              if (value === "Other") {
                                setShowCustomSource(true);
                              } else {
                                setShowCustomSource(false);
                              }
                            }}
                          >
                            <SelectTrigger id="candidate-source">
                              <SelectValue placeholder="Select Source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Direct">Direct Application</SelectItem>
                              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Agency">Agency</SelectItem>
                              <SelectItem value="Job Board">Job Board</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {showCustomSource && (
                            <Input
                              placeholder="Enter source"
                              value={customSource}
                              onChange={(e) => setCustomSource(e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="candidate-notes">Notes</Label>
                      <Textarea
                        id="candidate-notes"
                        placeholder="Additional notes about the candidate..."
                        className="min-h-[100px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : 'Add Candidate'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white shadow-sm mb-6">
          <TabsTrigger value="jobs">Open Jobs</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="resume-analysis">Resume Analyzer</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>Manage current job openings and requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <JobPostings statusFilter={selectedStatus} departmentFilter={selectedDepartment} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="candidates" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>Manage and track all candidates in your pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateTable statusFilter={selectedStatus} departmentFilter={selectedDepartment} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resume-analysis" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>AI Resume Analyzer</CardTitle>
              <CardDescription>Use AI to parse and analyze resumes for candidate matching.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeAnalyzer />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interviews" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Interview Management</CardTitle>
              <CardDescription>Schedule, track, and manage candidate interviews throughout the hiring process.</CardDescription>
            </CardHeader>
            <CardContent>
              <Interviews statusFilter={selectedStatus} departmentFilter={selectedDepartment} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Recruitment;
