import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/api';
import { Loader2, Upload } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobPosting {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  type: string;
  status: string;
  postedDate: string;
  updatedDate: string;
  applicantCount: number;
  createdBy: number | null;
}

interface JobPostingsProps {
  statusFilter?: string[];
  departmentFilter?: string[];
}

export const JobPostings = ({ statusFilter: initialStatusFilter = [], departmentFilter: initialDepartmentFilter = [] }: JobPostingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  
  // Internal filter state (initialized from props)
  const [statusFilter, setStatusFilter] = useState<string[]>(initialStatusFilter);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>(initialDepartmentFilter);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Update local filters when prop filters change
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setDepartmentFilter(initialDepartmentFilter);
  }, [initialStatusFilter, initialDepartmentFilter]);
  
  // Form states for creating a new job
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDepartment, setJobDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('text');
  
  // Form states for editing a job
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobDescription, setEditJobDescription] = useState('');
  const [editJobDepartment, setEditJobDepartment] = useState('');
  const [editCustomDepartment, setEditCustomDepartment] = useState('');
  const [editJobLocation, setEditJobLocation] = useState('');
  const [editJobType, setEditJobType] = useState('');
  const [editJobStatus, setEditJobStatus] = useState('');
  
  const { toast } = useToast();
  
  // Fetch job postings
  const { data: jobs = [], isLoading: isLoadingJobs, isError, error } = useQuery({
    queryKey: ['/api/job-postings'],
    select: (data: any) => data as JobPosting[],
  });
  
  // Create job posting mutation
  const { mutate: createJob, isPending: isCreating } = useMutation({
    mutationFn: (jobData: Partial<JobPosting>) => 
      apiRequest('POST', '/api/job-postings', jobData),
    onSuccess: () => {
      // Make sure to invalidate the query with the correct endpoint
      queryClient.invalidateQueries({ queryKey: ['/api/job-postings'] });
      setIsOpen(false);
      resetForm();
      toast({
        title: "Job Posted",
        description: "The job has been posted successfully.",
        duration: 2000
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to post job: ${error.message || "Unknown error"}`,
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  // Update job posting mutation
  const { mutate: updateJob, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, jobData }: { id: number, jobData: Partial<JobPosting> }) => 
      apiRequest('PATCH', `/api/job-postings/${id}`, jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-postings'] });
      setIsEditing(false);
      setSelectedJobId(null);
      toast({
        title: "Job Updated",
        description: "The job posting has been updated successfully.",
        duration: 2000
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update job: ${error.message || "Unknown error"}`,
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  // Delete job posting mutation
  const { mutate: deleteJob, isPending: isDeleting2 } = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/job-postings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-postings'] });
      setIsDeleting(false);
      setSelectedJobId(null);
      toast({
        title: "Job Deleted",
        description: "The job posting has been deleted.",
        duration: 2000
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete job: ${error.message || "Unknown error"}`,
        variant: "destructive",
        duration: 2000
      });
    }
  });
  
  // Reset form fields
  const resetForm = () => {
    setJobTitle('');
    setJobDescription('');
    setJobDepartment('');
    setCustomDepartment('');
    setJobLocation('');
    setJobType('Full-time');
    setJobFile(null);
    setActiveTab('text');
  };
  
  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const department = jobDepartment === 'Other' ? customDepartment : jobDepartment;
    
    const newJob: Partial<JobPosting> = {
      title: jobTitle,
      description: jobDescription,
      department,
      location: jobLocation,
      type: jobType,
      status: 'active',
    };
    
    createJob(newJob);
  };
  
  // Edit job handler
  const handleEditJob = (job: JobPosting) => {
    setSelectedJobId(job.id);
    setEditJobTitle(job.title);
    setEditJobDescription(job.description);
    setEditJobDepartment(job.department);
    setEditJobLocation(job.location);
    setEditJobType(job.type);
    setEditJobStatus(job.status);
    setIsEditing(true);
  };
  
  // Save edit handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJobId) return;
    
    const department = editJobDepartment === 'Other' ? editCustomDepartment : editJobDepartment;
    
    const updatedJob: Partial<JobPosting> = {
      title: editJobTitle,
      description: editJobDescription,
      department,
      location: editJobLocation,
      type: editJobType,
      status: editJobStatus,
    };
    
    updateJob({ id: selectedJobId, jobData: updatedJob });
  };
  
  // Delete job handler
  const handleDeleteJob = (id: number) => {
    setSelectedJobId(id);
    setIsDeleting(true);
  };
  
  // Confirm delete handler
  const confirmDelete = () => {
    if (selectedJobId) {
      deleteJob(selectedJobId);
    }
  };
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJobFile(e.target.files[0]);
      // TODO: Read file content and populate the description
      // For now, let's just set a placeholder
      setJobDescription(`Content of ${e.target.files[0].name} will be processed here.`);
    }
  };
  
  // Filter jobs based on search and filter criteria
  const filterJobs = (jobs: JobPosting[]): JobPosting[] => {
    if (!jobs || !Array.isArray(jobs)) {
      return [];
    }
    
    return jobs.filter(job => {
      // Search filter
      if (searchQuery && 
          !job.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !job.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter.length > 0 && 
          !statusFilter.includes(job.status.toLowerCase())) {
        return false;
      }
      
      // Department filter
      if (departmentFilter.length > 0 &&
          !departmentFilter.includes(job.department)) {
        return false;
      }
      
      // Type filter
      if (typeFilter.length > 0 &&
          !typeFilter.includes(job.type)) {
        return false;
      }
      
      return true;
    });
  };
  
  // Filter jobs once all filters are applied
  const filteredJobs = filterJobs(jobs);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50" avoidCollisions={true} side="top" align="start" alignOffset={-150} sideOffset={5}>
                <div className="space-y-4 p-2">
                  <h4 className="font-medium">Filter Job Postings</h4>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Job Type</h5>
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 pb-2">
                      {['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Remote', 'Hybrid', 'On-site', 'Seasonal'].map((type) => (
                        <Button 
                          key={type}
                          variant={typeFilter.includes(type) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            // Use callback form of setState to ensure we're working with latest state
                            setTypeFilter(currentFilters => {
                              let newFilters;
                              const isCurrentlySelected = currentFilters.includes(type);
                              
                              if (isCurrentlySelected) {
                                // Remove from filter
                                newFilters = currentFilters.filter(t => t !== type);
                              } else {
                                // Add to filter
                                newFilters = [...currentFilters, type];
                              }
                              
                              // Log the updated state
                              // Show notification
                              toast({
                                title: isCurrentlySelected ? `Removed ${type} Filter` : `Added ${type} Filter`,
                                description: isCurrentlySelected 
                                  ? `Removed ${type} from job type filters.` 
                                  : `Filtering job postings by ${type} type.`,
                                duration: 2000
                              });
                              
                              return newFilters;
                            });
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Department</h5>
                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-2 pb-2">
                      {['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Product', 'Finance', 'Operations', 'Legal', 'Customer Support', 'Research', 'Design'].map((dept) => (
                        <Button 
                          key={dept}
                          variant={departmentFilter.includes(dept) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            // Force immediate state update using callback pattern
                            setDepartmentFilter(currentFilters => {
                              let newDepartmentFilter;
                              const isCurrentlySelected = currentFilters.includes(dept);
                              
                              if (isCurrentlySelected) {
                                // Remove from filter
                                newDepartmentFilter = currentFilters.filter(d => d !== dept);
                              } else {
                                // Add to filter
                                newDepartmentFilter = [...currentFilters, dept];
                              }
                              
                              // Log the updated state
                              // Show toast here within the callback where we have access to currentFilters
                              toast({
                                title: isCurrentlySelected ? `Removed ${dept} Filter` : `Added ${dept} Filter`,
                                description: isCurrentlySelected
                                  ? `Removed ${dept} from department filters.` 
                                  : `Filtering job postings by ${dept} department.`,
                                duration: 2000
                              });
                              
                              return newDepartmentFilter;
                            });
                          }}
                        >
                          {dept}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Status</h5>
                    <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2 pb-2">
                      {['Active', 'Draft', 'Closed', 'Paused', 'Archived'].map((status) => (
                        <Button 
                          key={status}
                          variant={statusFilter.includes(status.toLowerCase()) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const statusLower = status.toLowerCase();
                            
                            // Force immediate state update using callback pattern
                            setStatusFilter(currentFilters => {
                              let newStatusFilter;
                              const isCurrentlySelected = currentFilters.includes(statusLower);
                              
                              if (isCurrentlySelected) {
                                // Remove from filter
                                newStatusFilter = currentFilters.filter(s => s !== statusLower);
                              } else {
                                // Add to filter
                                newStatusFilter = [...currentFilters, statusLower];
                              }
                              
                              // Log status filter change
                              // Show toast here within the callback where we have access to currentFilters
                              toast({
                                title: isCurrentlySelected ? `Removed ${status} Filter` : `Added ${status} Filter`,
                                description: isCurrentlySelected
                                  ? `Removed ${status} from status filters.` 
                                  : `Filtering job postings by ${status} status.`,
                                duration: 2000
                              });
                              
                              return newStatusFilter;
                            });
                          }}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setStatusFilter([]);
                        setDepartmentFilter([]);
                        setTypeFilter([]);
                        setSearchQuery("");
                        toast({
                          title: "Filters Reset",
                          description: "All filters have been cleared.",
                          duration: 2000
                        });
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        const filtered = filterJobs(jobs);
                        toast({
                          title: "Filters Applied",
                          description: `Showing ${filtered.length} job posting(s) matching your filters.`,
                          duration: 2000
                        });
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Post a New Job</DialogTitle>
                <DialogDescription>
                  Create a new job posting. You can either enter the details manually or upload a job description file.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      placeholder="e.g. Senior Frontend Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-department">Department</Label>
                      <Select value={jobDepartment} onValueChange={setJobDepartment}>
                        <SelectTrigger id="job-department">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Human Resources">Human Resources</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {jobDepartment === 'Other' && (
                        <div className="mt-2">
                          <Input
                            placeholder="Enter department name"
                            value={customDepartment}
                            onChange={(e) => setCustomDepartment(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-location">Location</Label>
                      <Input
                        id="job-location"
                        placeholder="e.g. Remote, New York, San Francisco"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="job-type">Job Type</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger id="job-type">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">Enter Text</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="job-description">Job Description</Label>
                        <Textarea
                          id="job-description"
                          placeholder="Enter the full job description..."
                          className="min-h-[200px]"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="upload" className="mt-4">
                      <div className="space-y-2">
                        <Label>Upload Job Description File</Label>
                        <div className="border-2 border-dashed border-neutral-200 rounded-md p-6 text-center">
                          <Upload className="mx-auto h-10 w-10 text-neutral-400" />
                          <div className="mt-2">
                            <Label
                              htmlFor="file-upload"
                              className="cursor-pointer relative font-medium text-primary hover:text-primary/90"
                            >
                              <span>Upload a file</span>
                              <Input
                                id="file-upload"
                                type="file"
                                className="sr-only"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                              />
                            </Label>
                            <p className="text-xs text-neutral-500 mt-1">
                              PDF, Word, or plain text up to 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Job"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoadingJobs ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <p className="text-destructive">Error loading job postings: {error?.toString()}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })}
          >
            Try Again
          </Button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-muted-foreground">No job postings available.</p>
          <p className="text-sm text-muted-foreground mt-2">
            {jobs.length > 0 
              ? "Try adjusting your filter criteria."
              : "Click 'Post New Job' to create your first job posting."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.department}</p>
                    </div>
                    <Badge variant={
                      job.status === 'active' ? "default" : 
                      job.status === 'draft' ? "outline" : 
                      job.status === 'closed' ? "destructive" : 
                      "secondary"
                    }>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <svg className="mr-2 h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location || "No location specified"}
                    </div>
                    <div className="flex items-center text-sm">
                      <svg className="mr-2 h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {job.type}
                    </div>
                    <div className="flex items-center text-sm">
                      <svg className="mr-2 h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {job.applicantCount} Applicant{job.applicantCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <p className="text-sm line-clamp-3 mb-4">{job.description}</p>
                </div>
                
                <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Posted {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditJob(job)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Job Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Job Posting</DialogTitle>
              <DialogDescription>
                Update the job posting information.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-job-title">Job Title</Label>
                  <Input
                    id="edit-job-title"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-department">Department</Label>
                    <Select value={editJobDepartment} onValueChange={setEditJobDepartment}>
                      <SelectTrigger id="edit-job-department">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {editJobDepartment === 'Other' && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter department name"
                          value={editCustomDepartment}
                          onChange={(e) => setEditCustomDepartment(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-location">Location</Label>
                    <Input
                      id="edit-job-location"
                      value={editJobLocation}
                      onChange={(e) => setEditJobLocation(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-type">Job Type</Label>
                    <Select value={editJobType} onValueChange={setEditJobType}>
                      <SelectTrigger id="edit-job-type">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-status">Status</Label>
                    <Select value={editJobStatus} onValueChange={setEditJobStatus}>
                      <SelectTrigger id="edit-job-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-job-description">Job Description</Label>
                  <Textarea
                    id="edit-job-description"
                    className="min-h-[200px]"
                    value={editJobDescription}
                    onChange={(e) => setEditJobDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting 
              and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting2}
            >
              {isDeleting2 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};