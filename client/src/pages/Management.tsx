import usePageTitle from "@/hooks/usePageTitle";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { getApiJson } from '@/lib/api';
import { exportData } from '@/lib/utils';
import { PlusCircle, CalendarIcon, CheckIcon, PencilIcon, LightbulbIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Management = () => {
  const [activeTab, setActiveTab] = useState('planning');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<string>('departments');
  const [exportFormat, setExportFormat] = useState<string>('excel');
  const [isExporting, setIsExporting] = useState(false);
  
  // New state for the plan creation dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [headcountChange, setHeadcountChange] = useState('0');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  
  // AI review states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [aiReview, setAiReview] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isImplementingRevision, setIsImplementingRevision] = useState(false);
  const [implementationNotes, setImplementationNotes] = useState('');
  
  // Store review history and state for the review history dialog
  const [aiReviewHistory, setAiReviewHistory] = useState<{ [planId: number]: any }>({});
  const [reviewHistoryOpen, setReviewHistoryOpen] = useState(false);
  
  // For Performance Management section
  const [performancePeriod, setPerformancePeriod] = useState<string>("quarter");
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  
  // Sample period-based performance data
  // Define a type for the department performance data
  interface DeptPerformance {
    name: string;
    score: number;
    improvedBy: number;
  }
  
  // Define a type for the period-based performance data
  interface PerformanceByPeriod {
    month: DeptPerformance[];
    quarter: DeptPerformance[];
    year: DeptPerformance[];
  }
  
  const performanceData: PerformanceByPeriod = {
    month: [
      { name: 'Engineering', score: 86, improvedBy: 3 },
      { name: 'Marketing', score: 79, improvedBy: 2 },
      { name: 'Sales', score: 87, improvedBy: 4 },
      { name: 'Customer Support', score: 76, improvedBy: -1 },
      { name: 'Finance', score: 81, improvedBy: 0 }
    ],
    quarter: [
      { name: 'Engineering', score: 89, improvedBy: 6 },
      { name: 'Marketing', score: 82, improvedBy: 4 },
      { name: 'Sales', score: 91, improvedBy: 8 },
      { name: 'Customer Support', score: 78, improvedBy: -2 },
      { name: 'Finance', score: 84, improvedBy: 1 }
    ],
    year: [
      { name: 'Engineering', score: 92, improvedBy: 10 },
      { name: 'Marketing', score: 87, improvedBy: 8 },
      { name: 'Sales', score: 94, improvedBy: 12 },
      { name: 'Customer Support', score: 81, improvedBy: 3 },
      { name: 'Finance', score: 88, improvedBy: 5 }
    ]
  };
  
  // Extended employees list for "View All Employees"
  const allEmployees = [
    { name: 'Sarah Johnson', dept: 'Sales', score: 96, goals: '14/15' },
    { name: 'Michael Chen', dept: 'Engineering', score: 94, goals: '12/12' },
    { name: 'Jessica Williams', dept: 'Marketing', score: 93, goals: '8/9' },
    { name: 'David Miller', dept: 'Engineering', score: 92, goals: '11/12' },
    { name: 'Rachel Martinez', dept: 'Sales', score: 91, goals: '13/15' },
    { name: 'Thomas Wilson', dept: 'Engineering', score: 89, goals: '10/12' },
    { name: 'Emily Davis', dept: 'Marketing', score: 88, goals: '7/8' },
    { name: 'Ryan Taylor', dept: 'Finance', score: 87, goals: '9/10' },
    { name: 'Amanda Brown', dept: 'Customer Support', score: 86, goals: '10/12' },
    { name: 'Kevin Lewis', dept: 'Product', score: 85, goals: '8/10' },
    { name: 'Jennifer Garcia', dept: 'Marketing', score: 84, goals: '6/8' },
    { name: 'Jason Rodriguez', dept: 'Sales', score: 83, goals: '10/13' },
    { name: 'Stephanie Lee', dept: 'Engineering', score: 82, goals: '9/11' },
    { name: 'Andrew Clark', dept: 'Customer Support', score: 81, goals: '8/10' },
    { name: 'Nicole Walker', dept: 'Finance', score: 80, goals: '7/9' }
  ];
  
  // State to track created plans
  const [workforcePlans, setWorkforcePlans] = useState<Array<{
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    departmentId: string;
    departmentName: string;
    headcountChange: number;
    status: string;
    createdAt: string;
  }>>([
    {
      id: 1,
      name: "Q2 Engineering Growth",
      description: "Strategic expansion of engineering team to support new product launches",
      startDate: "2025-04-01",
      endDate: "2025-06-30",
      departmentId: "1",
      departmentName: "Engineering",
      headcountChange: 15,
      status: "Approved",
      createdAt: "2025-03-15"
    },
    {
      id: 2,
      name: "Q3 Marketing Restructure",
      description: "Realignment of marketing team to focus on digital initiatives",
      startDate: "2025-07-01",
      endDate: "2025-09-30",
      departmentId: "2",
      departmentName: "Marketing",
      headcountChange: -3,
      status: "Pending AI Review",
      createdAt: "2025-06-10"
    }
  ]);
  
  interface Department {
    id: number;
    name: string;
    headCount: number;
  }
  
  const { data: departments = [] as Department[] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Sample data for workforce planning chart
  const forecastData = [
    { month: 'Jan', headcount: 120, forecast: 120 },
    { month: 'Feb', headcount: 122, forecast: 123 },
    { month: 'Mar', headcount: 125, forecast: 126 },
    { month: 'Apr', headcount: 130, forecast: 132 },
    { month: 'May', headcount: 132, forecast: 138 },
    { month: 'Jun', headcount: 135, forecast: 145 },
    { month: 'Jul', forecast: 152 },
    { month: 'Aug', forecast: 158 },
    { month: 'Sep', forecast: 162 },
    { month: 'Oct', forecast: 165 },
    { month: 'Nov', forecast: 168 },
    { month: 'Dec', forecast: 170 },
  ];

  // Handle saving plan
  const handleSavePlan = async () => {
    try {
      // Validation
      if (!planName.trim()) {
        toast({ title: "Missing Information", description: "Please enter a plan name.", variant: "destructive" });
        return;
      }
      
      if (!planDescription.trim()) {
        toast({ title: "Missing Information", description: "Please provide a plan description.", variant: "destructive" });
        return;
      }
      
      if (!planStartDate) {
        toast({ title: "Missing Information", description: "Please select a start date.", variant: "destructive" });
        return;
      }
      
      if (!planEndDate) {
        toast({ title: "Missing Information", description: "Please select an end date.", variant: "destructive" });
        return;
      }
      
      if (!selectedDepartment) {
        toast({ title: "Missing Information", description: "Please select a department.", variant: "destructive" });
        return;
      }
      
      const headcountNum = parseInt(headcountChange, 10);
      if (isNaN(headcountNum)) {
        toast({ title: "Invalid Information", description: "Headcount change must be a number.", variant: "destructive" });
        return;
      }
      
      const startDate = new Date(planStartDate);
      const endDate = new Date(planEndDate);
      
      if (endDate <= startDate) {
        toast({ title: "Invalid Dates", description: "End date must be after start date.", variant: "destructive" });
        return;
      }
      
      // Find the department name
      const dept = departments.find(d => d.id === parseInt(selectedDepartment as string, 10));
      const departmentName = dept ? dept.name : 'Unknown';
      
      if (selectedPlan) {
        // Update existing plan
        const updatedPlan = {
          ...selectedPlan,
          name: planName,
          description: planDescription,
          startDate: planStartDate,
          endDate: planEndDate,
          departmentId: String(selectedDepartment), // Convert to string to match expected type
          departmentName,
          headcountChange: headcountNum,
          status: "Pending AI Review",
          // Maintain createdAt from original plan
          createdAt: selectedPlan.createdAt
        };
        
        setWorkforcePlans(prevPlans => 
          prevPlans.map(plan => 
            plan.id === updatedPlan.id ? updatedPlan : plan
          )
        );
        
        toast({
          title: "Plan Updated",
          description: "Your workforce plan has been revised and is ready for AI review."
        });
      } else {
        // Create new plan
        const newPlan = {
          id: Date.now(),
          name: planName,
          description: planDescription,
          startDate: planStartDate,
          endDate: planEndDate,
          departmentId: String(selectedDepartment), // Convert to string to match expected type
          departmentName,
          headcountChange: headcountNum,
          status: "Pending AI Review",
          createdAt: new Date().toISOString()
          // No lastModified field as it's not in the type definition
        };
        
        setWorkforcePlans(prevPlans => [...prevPlans, newPlan]);
        
        toast({
          title: "Plan Created",
          description: "Your new workforce plan is ready for AI review."
        });
      }
      
      // Close dialog and reset form
      setPlanDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your plan. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Central Plan Dialog
  const planDialog = (
    <Dialog 
      open={planDialogOpen} 
      onOpenChange={(open) => {
        setPlanDialogOpen(open);
        // If dialog is closing, clean up the form state
        if (!open) {
          setSelectedPlan(null);
          setPlanName('');
          setPlanDescription('');
          setPlanStartDate('');
          setPlanEndDate('');
          setSelectedDepartment('');
          setHeadcountChange('0');
        }
      }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedPlan ? 'Revise Workforce Plan' : 'Create New Workforce Plan'}</DialogTitle>
          <DialogDescription>
            {selectedPlan 
              ? 'Update your workforce plan based on AI recommendations. Make changes to address feedback points.'
              : 'Create a strategic workforce plan with AI assistance. Enter the details below.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input 
              id="plan-name"
              placeholder="Q3 Expansion Plan" 
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                id="start-date"
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input 
                id="end-date"
                type="date"
                value={planEndDate}
                onChange={(e) => setPlanEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
                <SelectItem value="all">All Departments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headcount-change">Headcount Change</Label>
            <Input 
              id="headcount-change"
              type="number"
              placeholder="0" 
              value={headcountChange}
              onChange={(e) => setHeadcountChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter positive numbers for hiring plans, negative for reduction.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description & Justification</Label>
            <Textarea 
              id="description"
              placeholder="Describe the purpose and business justification for this workforce plan..." 
              className="h-24"
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              setIsCreatingPlan(true);
              
              // Check if we're editing an existing plan (revision) or creating a new one
              const isRevision = selectedPlan !== null;
              
              // Simulate operation (save or update plan)
              setTimeout(() => {
                // Get department name from selected ID
                const deptName = selectedDepartment === 'all' 
                  ? 'All Departments'
                  : departments.find(d => d.id.toString() === selectedDepartment)?.name || 'Unknown';
                
                if (isRevision) {
                  // Update existing plan
                  setWorkforcePlans(prevPlans => 
                    prevPlans.map(plan => 
                      plan.id === selectedPlan.id
                        ? { 
                            ...plan, 
                            name: planName,
                            description: planDescription,
                            startDate: planStartDate,
                            endDate: planEndDate,
                            departmentId: String(selectedDepartment), // Convert to string to match expected type
                            departmentName: deptName,
                            headcountChange: parseInt(headcountChange),
                            status: "Pending AI Review", // Reset to pending for new review
                          }
                        : plan
                    )
                  );
                  
                  toast({
                    title: "Plan Revised Successfully",
                    description: "Your workforce plan has been updated and is ready for AI review."
                  });
                } else {
                  // Create new plan and add it to state
                  const newPlan = {
                    id: workforcePlans.length + 2, // +2 since we start with ID 1
                    name: planName,
                    description: planDescription,
                    startDate: planStartDate,
                    endDate: planEndDate,
                    departmentId: String(selectedDepartment), // Convert to string to match expected type
                    departmentName: deptName,
                    headcountChange: parseInt(headcountChange),
                    status: "Pending AI Review",
                    createdAt: new Date().toISOString().slice(0, 10)
                  };
                  
                  // Add to plans array
                  setWorkforcePlans([newPlan, ...workforcePlans]);
                  
                  toast({
                    title: "Plan Created Successfully",
                    description: "Your workforce plan has been created and is ready for AI review."
                  });
                }
                
                // Reset form and state
                setPlanName('');
                setPlanDescription('');
                setPlanStartDate('');
                setPlanEndDate('');
                setSelectedDepartment('');
                setHeadcountChange('0');
                setSelectedPlan(null);
                
                setIsCreatingPlan(false);
                setPlanDialogOpen(false);
              }, 1500);
            }}
            disabled={isCreatingPlan || !planName || !planStartDate || !planEndDate || !selectedDepartment}
          >
            {isCreatingPlan 
              ? "Saving..." 
              : selectedPlan 
                ? "Save Revised Plan" 
                : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Performance Metrics Configuration Dialog
  const configDialog = (
    <Dialog open={showConfigPanel} onOpenChange={setShowConfigPanel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Performance Metrics</DialogTitle>
          <DialogDescription>
            Customize which metrics to track and display in the performance dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Metrics to Display</h4>
            <div className="space-y-2">
              {[
                { id: 'score', label: 'Performance Score', description: 'Overall performance rating' },
                { id: 'goals', label: 'Goal Completion', description: 'Percentage of goals accomplished' },
                { id: 'reviews', label: 'Manager Reviews', description: 'Feedback from direct manager' },
                { id: 'peer', label: 'Peer Reviews', description: 'Feedback from team members' },
                { id: 'skills', label: 'Skill Development', description: 'Growth in key competencies' }
              ].map((metric: { id: string; label: string; description: string }) => (
                <div key={metric.id} className="flex items-start space-x-2">
                  <Checkbox id={metric.id} defaultChecked={['score', 'goals'].includes(metric.id)} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={metric.id} className="font-medium">{metric.label}</Label>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">Time Period Defaults</h4>
            <RadioGroup defaultValue="quarter">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="month" id="period-month" />
                <Label htmlFor="period-month">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="quarter" id="period-quarter" />
                <Label htmlFor="period-quarter">Quarterly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="year" id="period-year" />
                <Label htmlFor="period-year">Yearly</Label>
              </div>
            </RadioGroup>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">Performance Thresholds</h4>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="excellent">Excellent</Label>
                <Input 
                  id="excellent" 
                  type="number" 
                  className="col-span-2" 
                  placeholder="90" 
                  defaultValue="90"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="good">Good</Label>
                <Input 
                  id="good" 
                  type="number" 
                  className="col-span-2" 
                  placeholder="80" 
                  defaultValue="80"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="needs-improvement">Needs Improvement</Label>
                <Input 
                  id="needs-improvement" 
                  type="number" 
                  className="col-span-2" 
                  placeholder="70" 
                  defaultValue="70"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfigPanel(false)}>Cancel</Button>
          <Button onClick={() => {
            // First close the dialog immediately to prevent any overlap
            setShowConfigPanel(false);
            
            // Then show the toast notification after dialog is closed
            setTimeout(() => {
              toast({
                title: "Settings Saved",
                description: "Performance metrics configuration has been updated.",
              });
            }, 100);
          }}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {planDialog}
      {configDialog}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Workforce Management</h1>
          <p className="mt-1 text-neutral-500">Optimize workforce planning and productivity with AI-powered insights.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {/* Direct CSV Export Button for the problematic "All workforce data" */}
          <div className="flex flex-col items-center">
            <Button 
              variant="outline" 
              className="flex items-center bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              onClick={async () => {
                try {
                  setIsExporting(true);
                  // Combine all data for a full export
                  let allData: any[] = [];
                  
                  // Add department data
                  if (departments && departments.length > 0) {
                    const deptData = departments.map((d: Department) => ({ 
                      section: 'Departments', 
                      ...d 
                    }));
                    allData = [...allData, ...deptData];
                  }
                  
                  // Add forecast data
                  if (forecastData && forecastData.length > 0) {
                    const forecastWithSection = forecastData.map(f => ({ 
                      section: 'Forecasts', 
                      ...f 
                    }));
                    allData = [...allData, ...forecastWithSection];
                  }
                  
                  // Process the data to ensure it's flat and simple
                  const safeData = allData.map(item => {
                    // Extract only string and number fields for maximum compatibility
                    const safe: Record<string, string | number> = {};
                    Object.entries(item).forEach(([key, value]) => {
                      if (typeof value === 'string' || typeof value === 'number') {
                        safe[key] = value;
                      } else if (value === null || value === undefined) {
                        safe[key] = '';
                      } else {
                        try {
                          safe[key] = JSON.stringify(value);
                        } catch (e) {
                          safe[key] = String(value);
                        }
                      }
                    });
                    return safe;
                  });
                  
                  // Get all keys from all items
                  const allKeys = new Set<string>();
                  safeData.forEach(item => {
                    Object.keys(item).forEach(key => allKeys.add(key));
                  });
                  const headers = Array.from(allKeys);
                  
                  // Create CSV content
                  let csvContent = headers.join(',') + '\n';
                  safeData.forEach(row => {
                    const rowValues = headers.map(header => {
                      const val = row[header];
                      if (val === undefined || val === null) return '';
                      if (typeof val === 'string') {
                        // Escape quotes and wrap in quotes if needed
                        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                          return `"${val.replace(/"/g, '""')}"`;
                        }
                        return val;
                      }
                      return String(val);
                    });
                    csvContent += rowValues.join(',') + '\n';
                  });
                  
                  // Create download
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `all-workforce-data-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description: "All workforce data has been downloaded as CSV file which can be opened in Excel."
                    });
                  }, 300);
                } catch (error) {
                  setTimeout(() => {
                    toast({
                      title: "Export Failed",
                      description: "There was an error exporting your data. Please try again.",
                      variant: "destructive"
                    });
                  }, 300);
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? "Exporting..." : "Export (CSV)"}
            </Button>
            <span className="text-xs text-green-700 mt-1">Export all workforce data</span>
          </div>
          
          {/* Add a "Review AI Recommendations" button */}
          <Button 
            variant="outline" 
            className="inline-flex items-center mr-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300" 
            onClick={() => {
              setReviewHistoryOpen(true);
            }}
          >
            <svg 
              className="-ml-1 mr-2 h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            Review AI Recommendations
          </Button>
          
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <svg className="-ml-1 mr-2 h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Workforce Data</DialogTitle>
                <DialogDescription>
                  Choose the data you would like to export and the format.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Data to export</label>
                  <Select 
                    value={exportType} 
                    onValueChange={setExportType}
                    defaultValue="departments"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data to export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="departments">Departments only</SelectItem>
                      <SelectItem value="employees">Employees only</SelectItem>
                      <SelectItem value="forecasts">Forecasts only</SelectItem>
                      <SelectItem value="performance">Performance data only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Export format</label>
                  <Select 
                    value={exportFormat}
                    onValueChange={setExportFormat}
                    defaultValue="excel"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="clipboard">Copy to Clipboard</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={async () => {
                      setIsExporting(true);
                      
                      try {
                        // Fetch the data for export based on the type selected
                        let dataToExport: any[] = [];
                        
                        switch (exportType) {
                          case 'departments':
                            // Use the department data from the query or backend
                            dataToExport = departments ? [...departments] : await getApiJson<any[]>('/api/departments');
                            break;
                          case 'employees':
                            // Fetch employees data
                            dataToExport = await getApiJson<any[]>('/api/employees');
                            break;
                          case 'forecasts':
                            // Use the forecast data from the charts
                            dataToExport = forecastData;
                            break;
                          case 'performance':
                            // Fetch performance data
                            dataToExport = await getApiJson<any[]>('/api/performance');
                            break;
                          case 'all':
                          default:
                            // For better compatibility with export functionality, use flattened data
                            const deptData = departments ? [...departments] : await getApiJson<any[]>('/api/departments') || [];
                            const employeeData = await getApiJson<any[]>('/api/employees') || [];
                            const performanceData = await getApiJson<any[]>('/api/performance') || [];
                            
                            // Flatten the data with a section identifier
                            const flattenedData = [
                              // Add department data with section field
                              ...(Array.isArray(deptData) ? deptData.map(item => ({ 
                                section: 'Departments',
                                ...item 
                              })) : []),
                              
                              // Add employee data with section field
                              ...(Array.isArray(employeeData) ? employeeData.map(item => ({ 
                                section: 'Employees',
                                ...item 
                              })) : []),
                              
                              // Add forecast data with section field
                              ...(forecastData.map(item => ({ 
                                section: 'Workforce Forecasts',
                                ...item 
                              }))),
                              
                              // Add performance data with section field
                              ...(Array.isArray(performanceData) ? performanceData.map(item => ({ 
                                section: 'Performance Data',
                                ...item 
                              })) : [])
                            ];
                            
                            dataToExport = flattenedData;
                            break;
                        }
                        
                        // Check if we have data to export
                        if (!dataToExport || dataToExport.length === 0) {
                          throw new Error('No data available to export');
                        }
                        
                        // Log the enhanced debugging info
                        if (exportType === 'all') {
                          // Create a direct fetch to test API connectivity with a status check
                          try {
                            const testResponse = await fetch('/api/status-check', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ test: true })
                            });
                            const result = await testResponse.json();
                          } catch (connectErr) {
                          }
                          
                          // Direct download of simple CSV as a reliable fallback
                          if (exportFormat === 'excel' || exportFormat === 'csv') {
                            // Normalize the data to a very simple structure that is guaranteed to work
                            const safeData = dataToExport.map(item => {
                              // Extract only string and number fields for maximum compatibility
                              const safe: Record<string, string | number> = {};
                              Object.entries(item).forEach(([key, value]) => {
                                if (typeof value === 'string' || typeof value === 'number') {
                                  safe[key] = value;
                                } else if (value === null || value === undefined) {
                                  safe[key] = '';
                                } else {
                                  // Convert other types to string representation
                                  try {
                                    safe[key] = JSON.stringify(value);
                                  } catch (e) {
                                    safe[key] = String(value);
                                  }
                                }
                              });
                              return safe;
                            });
                            
                            // Get all keys from the first few items to ensure we capture them all
                            const allKeys = new Set<string>();
                            safeData.slice(0, 5).forEach(item => {
                              Object.keys(item).forEach(key => allKeys.add(key));
                            });
                            const headers = Array.from(allKeys);
                            
                            // Create CSV content
                            let csvContent = headers.join(',') + '\n';
                            safeData.forEach(row => {
                              const rowValues = headers.map(header => {
                                const val = row[header];
                                if (val === undefined || val === null) return '';
                                if (typeof val === 'string') {
                                  // Escape quotes and wrap in quotes if needed
                                  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                                    return `"${val.replace(/"/g, '""')}"`;
                                  }
                                  return val;
                                }
                                return String(val);
                              });
                              csvContent += rowValues.join(',') + '\n';
                            });
                            
                            // Create download
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `workforce-data-${new Date().toISOString().slice(0, 10)}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            // Inform the user with a delay to ensure dialog closes first
                            setTimeout(() => {
                              toast({
                                title: "Export Complete (Direct Method)",
                                description: `Your data has been downloaded as a CSV file which can be opened in Excel.`
                              });
                            }, 300);
                            
                            // Don't proceed with the regular export
                            setIsExporting(false);
                            setExportDialogOpen(false);
                            return;
                          }
                        }
                        
                        // Attempt direct JSON download for debugging
                        if (exportType === 'all') {
                          // Special handling for "All workforce data" - the most problematic case
                          // Ensure we have proper structure - the server expects 'section' field
                          
                          // Create a very simple fixed array for testing - SIMPLIFY to identify issue
                          // This is a temporary debug solution to isolate the problem
                          const simpleTestData = [
                            {
                              section: 'Departments',
                              id: 1, 
                              name: 'Engineering',
                              headCount: 150,
                              budget: 1500000,
                              engagementScore: 4.2
                            },
                            {
                              section: 'Departments',
                              id: 2,
                              name: 'Marketing',
                              headCount: 45,
                              budget: 750000,
                              engagementScore: 4.0
                            }
                          ];
                          
                          // Create a direct download of the original data for inspection
                          const jsonStr = JSON.stringify(dataToExport, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'debug-original-data.json';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          // Also create a download of the simple test data for comparison
                          const simpleJsonStr = JSON.stringify(simpleTestData, null, 2);
                          const simpleBlob = new Blob([simpleJsonStr], { type: 'application/json' });
                          const simpleUrl = URL.createObjectURL(simpleBlob);
                          const simpleLink = document.createElement('a');
                          simpleLink.href = simpleUrl;
                          simpleLink.download = 'debug-simple-test-data.json';
                          document.body.appendChild(simpleLink);
                          simpleLink.click();
                          document.body.removeChild(simpleLink);
                          URL.revokeObjectURL(simpleUrl);

                          try {
                            // First try with simple test data to see if structure is the issue
                            await exportData(simpleTestData, 'management', exportFormat as any);
                            // If simple test succeeds, try with real enhanced data next
                            toast({
                              title: "Test Export Completed",
                              description: "Simple test data exported successfully. Full export coming next...",
                            });
                            
                            // Create enhanced data with section fields added
                            let enhancedData: Array<Record<string, any>> = [];
                            
                            // Extract each data type and add appropriate sections
                            if (departments && departments.length > 0) {
                              const deptData = departments.map(d => ({ 
                                section: 'Departments', 
                                ...d
                              }));
                              enhancedData = [...enhancedData, ...deptData];
                            }
                            
                            if (forecastData && forecastData.length > 0) {
                              const forecastWithSection = forecastData.map(f => ({ 
                                section: 'Forecasts', 
                                ...f
                              }));
                              enhancedData = [...enhancedData, ...forecastWithSection];
                            }
                            
                            if (enhancedData.length === 0) {
                              // Fallback if no data was available
                              enhancedData = dataToExport.map((item: Record<string, any>) => ({
                                section: 'Workforce',
                                ...item
                              }));
                            }
                            
                            // Try the full export with enhanced data
                            await exportData(enhancedData, 'management', exportFormat as any);
                          } catch (err) {
                            // If both attempts fail, try one more approach - extreme simplification
                            try {
                              const ultraSimpleData = [
                                { section: 'Test', id: 1, name: 'Test Item' }
                              ];
                              
                              await exportData(ultraSimpleData, 'management', exportFormat as any);
                              // If this worked, there's a structural issue with our data
                              toast({
                                title: "Test Export Completed",
                                description: "Ultra-simple test data exported successfully. The issue is with data structure.",
                              });
                            } catch (finalErr) {
                              throw finalErr; // Rethrow to trigger the error handling
                            }
                          }
                        } else {
                          // Use our export utility to create and download the file
                          // Normal case for other export types
                          await exportData(dataToExport, 'management', exportFormat as any);
                        }
                        
                        toast({
                          title: "Export Complete",
                          description: `Your workforce data has been downloaded.`
                        });
                      } catch (error) {
                        // Get the current scope variables to avoid undefined errors
                        const currentDataToExport = (() => {
                          try {
                            switch (exportType) {
                              case 'departments':
                                return departments || [];
                              case 'employees':
                                return []; // We don't have this in this scope
                              case 'forecasts':
                                return forecastData || [];
                              case 'performance':
                                return []; // We don't have this in this scope
                              case 'all':
                              default:
                                // Create a simplified version of the flattened data structure
                                return [
                                  ...(departments || []).map(d => ({ section: 'Departments', ...d })),
                                  ...(forecastData || []).map(f => ({ section: 'Forecasts', ...f }))
                                ];
                            }
                          } catch (e) {
                            return [];
                          }
                        })();
                        
                        toast({
                          title: "Export Failed",
                          description: "There was an error exporting your data. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsExporting(false);
                        setExportDialogOpen(false);
                      }
                    }}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <svg 
                          className="animate-spin -ml-1 mr-2 h-4 w-4" 
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
                        Exporting...
                      </>
                    ) : 'Export'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            className="inline-flex items-center"
            onClick={() => {
              setSelectedPlan(null);
              setPlanName('');
              setPlanDescription('');
              setPlanStartDate('');
              setPlanEndDate('');
              setSelectedDepartment('');
              setHeadcountChange('0');
              setPlanDialogOpen(true);
            }}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New plan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white shadow-sm mb-6">
          <TabsTrigger value="planning">Workforce Planning</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planning" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-primary-500">{departments?.length || 6}</h3>
                  <p className="text-sm text-neutral-500 mt-1">Departments</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-neutral-900">1,482</h3>
                  <p className="text-sm text-neutral-500 mt-1">Total employees</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-success">+50</h3>
                  <p className="text-sm text-neutral-500 mt-1">Projected growth (Q3)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-warning-500">8.5%</h3>
                  <p className="text-sm text-neutral-500 mt-1">Turnover rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Workforce Forecast</CardTitle>
                  <CardDescription>AI-powered headcount forecasting for the next 6 months.</CardDescription>
                </div>
                <Button className="ml-auto" onClick={() => setPlanDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Plan
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="headcount" stroke="#3f51b5" name="Actual Headcount" strokeWidth={2} />
                      <Line type="monotone" dataKey="forecast" stroke="#00bfa5" name="AI Forecast" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Current headcount by department.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments ? (
                    departments.map((dept, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-neutral-900">{dept.name}</div>
                          <div className="text-sm font-medium text-neutral-900">{dept.headCount}</div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full" 
                            style={{ width: `${(dept.headCount / 1482) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Sample data if departments not loaded
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-neutral-900">Engineering</div>
                          <div className="text-sm font-medium text-neutral-900">450</div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-neutral-900">Sales</div>
                          <div className="text-sm font-medium text-neutral-900">350</div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: '24%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-neutral-900">Marketing</div>
                          <div className="text-sm font-medium text-neutral-900">250</div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: '17%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-neutral-900">Customer Support</div>
                          <div className="text-sm font-medium text-neutral-900">280</div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: '19%' }}></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>AI-Generated Workforce Insights</CardTitle>
              <CardDescription>Strategic recommendations based on current workforce data and market trends.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 border-l-4 border-primary-500 rounded">
                  <h4 className="text-sm font-semibold text-neutral-900">Skills Gap Analysis</h4>
                  <p className="mt-1 text-sm text-neutral-700">
                    Analysis indicates potential skills gaps in cloud engineering and machine learning roles. 
                    Consider proactive training for 15 existing engineers or targeted recruitment for 5 specialized roles.
                  </p>
                </div>
                
                <div className="p-4 bg-warning-50 border-l-4 border-warning-500 rounded">
                  <h4 className="text-sm font-semibold text-neutral-900">Attrition Risk</h4>
                  <p className="mt-1 text-sm text-neutral-700">
                    Predictive modeling shows elevated attrition risk in the Customer Support department (15% above baseline).
                    Primary drivers appear to be compensation and limited career progression paths.
                  </p>
                </div>
                
                <div className="p-4 bg-success-50 border-l-4 border-success-500 rounded">
                  <h4 className="text-sm font-semibold text-neutral-900">Recruitment Optimization</h4>
                  <p className="mt-1 text-sm text-neutral-700">
                    Market analysis suggests Q3 is optimal for UX designer recruitment due to increased talent availability.
                    Consider accelerating planned hires to capitalize on this trend.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Workforce Plans Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Workforce Plans</CardTitle>
                <CardDescription>Current and upcoming workforce planning initiatives.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPlanDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-6 bg-neutral-50 p-3 text-sm font-medium">
                  <div>Plan Name</div>
                  <div>Department</div>
                  <div>Period</div>
                  <div className="text-center">Headcount Change</div>
                  <div className="text-center">Status</div>
                  <div className="text-center">Created</div>
                </div>
                <div className="divide-y">
                  {workforcePlans.map((plan) => (
                    <div key={plan.id} className="grid grid-cols-6 p-3 text-sm">
                      <div className="font-medium">{plan.name}</div>
                      <div>{plan.departmentName}</div>
                      <div>{plan.startDate} to {plan.endDate}</div>
                      <div className="text-center">
                        <span className={plan.headcountChange > 0 ? "text-green-600" : plan.headcountChange < 0 ? "text-red-600" : ""}>
                          {plan.headcountChange > 0 ? "+" : ""}{plan.headcountChange}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${plan.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                            plan.status === 'Pending AI Review' ? 'bg-blue-100 text-blue-800' :
                            plan.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {plan.status}
                        </span>
                        {plan.status === 'Pending AI Review' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs ml-2 py-1 h-6 bg-blue-50 hover:bg-blue-100 text-blue-700"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setReviewDialogOpen(true);
                            }}
                          >
                            Review with AI
                          </Button>
                        )}
                        {plan.status === 'Needs Revision' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs ml-2 py-1 h-6 bg-amber-50 hover:bg-amber-100 text-amber-700"
                            onClick={() => {
                              // Set all the form fields with the current plan data
                              setPlanName(plan.name);
                              setPlanDescription(plan.description);
                              setPlanStartDate(plan.startDate);
                              setPlanEndDate(plan.endDate);
                              setSelectedDepartment(plan.departmentId);
                              setHeadcountChange(String(plan.headcountChange));
                              
                              // Open the dialog in "edit mode"
                              setPlanDialogOpen(true);
                              
                              // Store the plan ID for later update
                              setSelectedPlan(plan);
                            }}
                          >
                            Revise Plan
                          </Button>
                        )}
                      </div>
                      <div className="text-center">{plan.createdAt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Performance Management</CardTitle>
              <CardDescription>Track and analyze employee performance metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Metrics Overview */}
              <div>
                <h3 className="text-lg font-medium mb-4">Performance Metrics Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-green-700 uppercase">Average Performance Score</p>
                          <h4 className="text-2xl font-bold text-green-800">86%</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 mt-2">+4% from previous quarter</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-blue-700 uppercase">Goal Completion Rate</p>
                          <h4 className="text-2xl font-bold text-blue-800">72%</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">142 goals completed out of 197</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-indigo-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-indigo-700 uppercase">Top Performers</p>
                          <h4 className="text-2xl font-bold text-indigo-800">18%</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-700 mt-2">27 employees in top performance tier</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Department Performance Comparison */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Department Performance</h3>
                  {/* Period selection that updates the displayed data */}
                  <Select 
                    value={performancePeriod}
                    onValueChange={(value) => {
                      setPerformancePeriod(value);
                      toast({
                        title: "Time Period Changed",
                        description: `Showing performance data for ${
                          value === 'month' ? 'the past month' : 
                          value === 'quarter' ? 'the past quarter' : 
                          'the past year'
                        }`
                      });
                    }}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Past Month</SelectItem>
                      <SelectItem value="quarter">Past Quarter</SelectItem>
                      <SelectItem value="year">Past Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  {performanceData[performancePeriod as keyof typeof performanceData].map((dept) => (
                    <div key={dept.name} className="bg-white p-3 rounded-lg border">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-sm font-bold">{dept.score}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            dept.score >= 90 ? 'bg-green-500' : 
                            dept.score >= 80 ? 'bg-blue-500' : 
                            dept.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${dept.score}%` }}
                        ></div>
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs ${dept.improvedBy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {dept.improvedBy >= 0 ? '↑' : '↓'} {Math.abs(dept.improvedBy)}% from previous period
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Performance Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Top Performers</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => {
                      setShowAllEmployees(!showAllEmployees);
                      toast({
                        title: showAllEmployees ? "Showing Top Performers" : "Viewing All Employees",
                        description: showAllEmployees 
                          ? "Displaying top 5 employee performers." 
                          : "Displaying complete employee performance data.",
                      });
                    }}
                  >
                    <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {showAllEmployees ? "Hide All Employees" : "View All Employees"}
                  </Button>
                </div>
                
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Employee</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Score</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Goal Completion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {(showAllEmployees ? allEmployees : allEmployees.slice(0, 5)).map((employee, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">{employee.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-neutral-600">{employee.dept}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {employee.score}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                            {employee.goals}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Performance Review Actions */}
              <div className="flex justify-between items-center pt-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    toast({
                      title: "Review Scheduled",
                      description: "Performance review has been scheduled for next week.",
                      variant: "default"
                    });
                  }}
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Schedule Review
                </Button>
                <div className="space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      try {
                        // Prepare the data for export
                        const performanceExportData = showAllEmployees ? allEmployees : allEmployees.slice(0, 5);
                        
                        // Create headers and rows for the Excel export
                        const headers = ["Employee Name", "Department", "Performance Score", "Goal Completion"];
                        const rows = performanceExportData.map(emp => [
                          emp.name,
                          emp.dept,
                          `${emp.score}%`,
                          emp.goals
                        ]);
                        
                        // Export data using Excel.js
                        import('exceljs').then(({ default: ExcelJS }) => {
                          // Create a new Excel workbook and worksheet
                          const workbook = new ExcelJS.Workbook();
                          const worksheet = workbook.addWorksheet('Performance Report');
                          
                          // Add a title row
                          worksheet.addRow([`Employee Performance Report - ${new Date().toLocaleDateString()}`]);
                          worksheet.mergeCells('A1:D1');
                          const titleRow = worksheet.getRow(1);
                          titleRow.font = { bold: true, size: 16 };
                          titleRow.alignment = { horizontal: 'center' };
                          
                          // Add a period row
                          worksheet.addRow([`Time Period: ${
                            performancePeriod === 'month' ? 'Past Month' : 
                            performancePeriod === 'quarter' ? 'Past Quarter' : 
                            'Past Year'
                          }`]);
                          worksheet.mergeCells('A2:D2');
                          
                          // Add empty row for spacing
                          worksheet.addRow([]);
                          
                          // Add header row
                          const headerRow = worksheet.addRow(headers);
                          headerRow.font = { bold: true };
                          headerRow.eachCell(cell => {
                            cell.fill = {
                              type: 'pattern',
                              pattern: 'solid',
                              fgColor: { argb: 'FFE0E0E0' }
                            };
                            cell.border = {
                              top: { style: 'thin' },
                              bottom: { style: 'thin' },
                              left: { style: 'thin' },
                              right: { style: 'thin' }
                            };
                          });
                          
                          // Add data rows
                          rows.forEach(rowData => {
                            const row = worksheet.addRow(rowData);
                            row.eachCell(cell => {
                              cell.border = {
                                top: { style: 'thin' },
                                bottom: { style: 'thin' },
                                left: { style: 'thin' },
                                right: { style: 'thin' }
                              };
                            });
                          });
                          
                          // Auto-adjust column widths
                          worksheet.columns.forEach(column => {
                            column.width = 20;
                          });
                          
                          // Create blob and download
                          workbook.xlsx.writeBuffer().then(buffer => {
                            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `performance-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            toast({
                              title: "Report Exported Successfully",
                              description: "Performance report has been exported to Excel format.",
                              variant: "default"
                            });
                          });
                        }).catch(err => {
                          toast({
                            title: "Export Failed",
                            description: "There was an error creating the Excel file. Please try again.",
                            variant: "destructive"
                          });
                        });
                      } catch (error) {
                        toast({
                          title: "Export Failed",
                          description: "There was an error exporting the report. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowConfigPanel(true);
                      toast({
                        title: "Configure Performance Metrics",
                        description: "Opening performance metrics configuration panel.",
                        variant: "default"
                      });
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compensation" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Compensation Management</CardTitle>
              <CardDescription>Optimize compensation strategies based on market trends and performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compensation Overview */}
              <div>
                <h3 className="text-lg font-medium mb-4">Compensation Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-emerald-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-emerald-700 uppercase">Total Compensation Budget</p>
                          <h4 className="text-2xl font-bold text-emerald-800">$12.4M</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-700 mt-2">+8.2% YoY increase</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-amber-700 uppercase">Average Salary</p>
                          <h4 className="text-2xl font-bold text-amber-800">$82,450</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-amber-700 mt-2">+4.5% from last year</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-indigo-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-indigo-700 uppercase">Pay Equity Index</p>
                          <h4 className="text-2xl font-bold text-indigo-800">96.8%</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-700 mt-2">+1.2% improvement since last audit</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Salary Bands */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Salary Bands by Department</h3>
                  <div className="flex space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="support">Customer Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="space-y-4">
                    {[
                      { role: 'Senior Engineer', min: 120000, max: 165000, median: 142500, market: 145000 },
                      { role: 'Engineer', min: 85000, max: 125000, median: 105000, market: 110000 },
                      { role: 'Junior Engineer', min: 65000, max: 85000, median: 75000, market: 72000 },
                      { role: 'Design Lead', min: 110000, max: 150000, median: 130000, market: 135000 },
                      { role: 'Product Designer', min: 80000, max: 120000, median: 100000, market: 105000 }
                    ].map((band) => (
                      <div key={band.role} className="border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{band.role}</span>
                          <span className="text-sm text-neutral-600">${band.min.toLocaleString()} - ${band.max.toLocaleString()}</span>
                        </div>
                        <div className="relative h-5 bg-neutral-100 rounded w-full">
                          {/* Salary range bar */}
                          <div 
                            className="absolute top-0 h-5 bg-blue-100 rounded" 
                            style={{ left: '0%', width: '100%' }}
                          ></div>
                          
                          {/* Median line */}
                          <div 
                            className="absolute top-0 h-5 border-l-2 border-blue-700"
                            style={{ left: `${((band.median - band.min) / (band.max - band.min)) * 100}%` }}
                          >
                            <span className="absolute top-7 left-0 transform -translate-x-1/2 text-xs text-blue-700 font-medium">
                              Median: ${band.median.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Market line */}
                          <div 
                            className="absolute top-0 h-5 border-l-2 border-green-700"
                            style={{ left: `${((band.market - band.min) / (band.max - band.min)) * 100}%` }}
                          >
                            <span className="absolute top-7 left-0 transform -translate-x-1/2 text-xs text-green-700 font-medium">
                              Market: ${band.market.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department Compensation */}
              <div>
                <h3 className="text-lg font-medium mb-4">Department Compensation Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Compensation by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { dept: 'Engineering', avgSalary: 110450, headcount: 45, totalComp: 4970250, marketRatio: 0.98 },
                          { dept: 'Sales', avgSalary: 94800, headcount: 32, totalComp: 3033600, marketRatio: 1.05 },
                          { dept: 'Marketing', avgSalary: 88700, headcount: 18, totalComp: 1596600, marketRatio: 1.01 },
                          { dept: 'Customer Support', avgSalary: 65300, headcount: 24, totalComp: 1567200, marketRatio: 0.96 },
                          { dept: 'Product', avgSalary: 102800, headcount: 12, totalComp: 1233600, marketRatio: 0.99 }
                        ].map((dept) => (
                          <div key={dept.dept} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <div className="font-medium">{dept.dept}</div>
                              <div className="text-xs text-neutral-500">
                                {dept.headcount} employees · ${dept.totalComp.toLocaleString()} total
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${dept.avgSalary.toLocaleString()}</div>
                              <div className={`text-xs ${dept.marketRatio >= 1 ? 'text-green-600' : 'text-amber-600'}`}>
                                {(dept.marketRatio * 100).toFixed(0)}% of market
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Budget Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-full h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
                          <div className="text-center text-neutral-400">
                            Pie chart showing budget allocation by department
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {[
                          { dept: 'Engineering', percent: 40, color: 'bg-blue-500' },
                          { dept: 'Sales', percent: 24, color: 'bg-green-500' },
                          { dept: 'Marketing', percent: 13, color: 'bg-yellow-500' },
                          { dept: 'Support', percent: 13, color: 'bg-indigo-500' },
                          { dept: 'Product', percent: 10, color: 'bg-rose-500' }
                        ].map((item) => (
                          <div key={item.dept} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <div className="text-xs">{item.dept} ({item.percent}%)</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Compensation Actions */}
              <div className="flex justify-between items-center pt-4">
                <div className="space-x-2">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Run Pay Equity Analysis
                  </Button>
                  <Button variant="outline">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Market Comparison
                  </Button>
                </div>
                <div className="space-x-2">
                  <Button variant="outline">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                  </Button>
                  <Button variant="outline">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduling" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Employee Scheduling</CardTitle>
              <CardDescription>AI-optimized scheduling and workforce allocation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scheduling Overview */}
              <div>
                <h3 className="text-lg font-medium mb-4">Scheduling Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-teal-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-teal-700 uppercase">Hours Scheduled</p>
                          <h4 className="text-2xl font-bold text-teal-800">3,240</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-teal-700 mt-2">Next 7 days</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-violet-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-violet-700 uppercase">Schedule Efficiency</p>
                          <h4 className="text-2xl font-bold text-violet-800">92%</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-violet-700 mt-2">+4% from last month</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-rose-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-rose-700 uppercase">Coverage Gaps</p>
                          <h4 className="text-2xl font-bold text-rose-800">3</h4>
                        </div>
                        <div className="bg-white p-2 rounded-full">
                          <svg className="h-5 w-5 text-rose-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-rose-700 mt-2">Need attention</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Weekly Schedule Calendar */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Weekly Schedule</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Button>
                    <span className="text-sm font-medium">May 1 - May 7, 2025</span>
                    <Button variant="outline" size="sm" className="h-8">
                      Next
                      <svg className="h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                {/* Weekly calendar grid */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-8 border-b bg-neutral-50">
                    <div className="py-2 px-3 text-xs font-medium text-neutral-500 border-r"></div>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="py-2 px-3 text-xs font-medium text-neutral-500 text-center border-r last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Time slots */}
                  {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map((time, i) => (
                    <div key={time} className={`grid grid-cols-8 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} border-b last:border-b-0`}>
                      <div className="py-3 px-3 text-xs font-medium text-neutral-500 border-r">
                        {time}
                      </div>
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <div key={day} className="py-3 px-1 border-r last:border-r-0 relative">
                          {/* Example scheduled blocks */}
                          {i === 1 && day === 0 && (
                            <div className="absolute inset-1 rounded bg-blue-100 border border-blue-300 text-xs p-1 overflow-hidden">
                              <div className="font-medium text-blue-800">Team Meeting</div>
                              <div className="text-blue-600 text-xs">10AM - 11AM</div>
                            </div>
                          )}
                          {i === 3 && day === 2 && (
                            <div className="absolute inset-1 rounded bg-indigo-100 border border-indigo-300 text-xs p-1 overflow-hidden">
                              <div className="font-medium text-indigo-800">Training</div>
                              <div className="text-indigo-600 text-xs">12PM - 2PM</div>
                            </div>
                          )}
                          {i === 6 && day === 4 && (
                            <div className="absolute inset-1 rounded bg-green-100 border border-green-300 text-xs p-1 overflow-hidden">
                              <div className="font-medium text-green-800">Review</div>
                              <div className="text-green-600 text-xs">3PM - 4PM</div>
                            </div>
                          )}
                          {i === 5 && day === 1 && (
                            <div className="absolute inset-1 rounded bg-yellow-100 border border-yellow-300 text-xs p-1 overflow-hidden">
                              <div className="font-medium text-yellow-800">Client Call</div>
                              <div className="text-yellow-600 text-xs">2PM - 3PM</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Team Allocation & Productivity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Team Workload</CardTitle>
                    <CardDescription>Current allocation across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { team: 'Development', allocated: 92, count: 12 },
                        { team: 'Customer Support', allocated: 78, count: 8 },
                        { team: 'Sales', allocated: 86, count: 6 },
                        { team: 'Marketing', allocated: 64, count: 4 },
                        { team: 'Design', allocated: 87, count: 5 }
                      ].map((team) => (
                        <div key={team.team} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{team.team}</span>
                            <span className="text-sm text-neutral-500">{team.count} members · {team.allocated}% allocated</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                team.allocated > 90 ? 'bg-red-500' : 
                                team.allocated > 80 ? 'bg-amber-500' : 
                                team.allocated > 70 ? 'bg-green-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${team.allocated}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Coverage Optimization</CardTitle>
                    <CardDescription>AI scheduling recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start space-x-3">
                          <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-blue-900">Shift Rebalancing</div>
                            <div className="text-sm text-blue-700">Redistribute Wednesday afternoon coverage to improve customer response times.</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="flex items-start space-x-3">
                          <div className="p-1.5 bg-amber-100 rounded-full text-amber-600">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-amber-900">Coverage Gap Alert</div>
                            <div className="text-sm text-amber-700">Friday 3-5PM technical support lacks sufficient coverage. Add 2 team members.</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-start space-x-3">
                          <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-green-900">Optimal Scheduling</div>
                            <div className="text-sm text-green-700">Development team's current sprint allocation is well-balanced with appropriate resources.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Scheduling Actions */}
              <div className="flex justify-between items-center pt-4">
                <div className="space-x-2">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Schedule Shift
                  </Button>
                  <Button variant="outline">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Schedule
                  </Button>
                  <Button variant="outline">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Run AI Optimization
                  </Button>
                </div>
                <div>
                  <Button variant="outline">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* AI Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Review: {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Our AI is analyzing your workforce plan to provide strategic recommendations.
            </DialogDescription>
          </DialogHeader>
          
          {!aiReview ? (
            <div className="py-8 flex flex-col items-center justify-center">
              {isReviewing ? (
                <>
                  <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-200 border-l-blue-200 border-r-blue-200 rounded-full animate-spin mb-4" />
                  <p className="text-blue-600 font-medium">AI is reviewing your workforce plan...</p>
                  <p className="mt-2 text-sm text-neutral-500 max-w-md text-center">
                    We're analyzing your plan for business impact, financial considerations, timing, and alignment with strategic objectives.
                  </p>
                </>
              ) : selectedPlan?.status === 'Approved' || selectedPlan?.status === 'Needs Revision' ? (
                <div className="text-center">
                  <p className="text-amber-600 mb-4">The AI review information for this plan could not be loaded.</p>
                  <Button 
                    onClick={() => {
                      // Close review dialog and open history
                      setReviewDialogOpen(false);
                      setReviewHistoryOpen(true);
                    }}
                  >
                    View Review History
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 mb-4"
                    onClick={async () => {
                      setIsReviewing(true);
                      
                      try {
                        if (!selectedPlan) {
                          throw new Error("No plan selected for review");
                        }
                        
                        // Call the AI review API
                        const response = await fetch('/api/workforce-plans/review', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            name: selectedPlan.name,
                            description: selectedPlan.description,
                            departmentName: selectedPlan.departmentName,
                            startDate: selectedPlan.startDate,
                            endDate: selectedPlan.endDate,
                            headcountChange: selectedPlan.headcountChange
                          })
                        });
                        
                        if (!response.ok) {
                          throw new Error("Failed to get AI review");
                        }
                        
                        const reviewData = await response.json();
                        setAiReview(reviewData);
                        
                        // Save review to history with the plan's ID as the key
                        setAiReviewHistory(prevHistory => ({
                          ...prevHistory,
                          [selectedPlan.id]: {
                            planName: selectedPlan.name,
                            departmentName: selectedPlan.departmentName,
                            headcountChange: selectedPlan.headcountChange,
                            createdAt: selectedPlan.createdAt,
                            review: reviewData
                          }
                        }));
                        
                        // Update plan status based on review
                        setWorkforcePlans(prevPlans => 
                          prevPlans.map(plan => 
                            plan.id === selectedPlan.id
                              ? { 
                                  ...plan, 
                                  status: reviewData.approved ? "Approved" : "Needs Revision" 
                                }
                              : plan
                          )
                        );
                        
                      } catch (error) {
                        toast({
                          title: "Review Failed",
                          description: "There was an error reviewing your workforce plan. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsReviewing(false);
                      }
                    }}
                  >
                    Start AI Review
                  </Button>
                  <p className="text-sm text-neutral-500 max-w-md text-center">
                    Click to have our AI analyze this workforce plan for strategic alignment, financial impact, and optimization opportunities.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="py-4 space-y-6">
              {/* Review Status */}
              <div className="flex items-center justify-center mb-6">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  aiReview.approved 
                    ? 'bg-green-100 text-green-600 border-4 border-green-200' 
                    : 'bg-amber-100 text-amber-600 border-4 border-amber-200'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{aiReview.score}/100</div>
                    <div className="text-sm font-medium mt-1">
                      {aiReview.approved ? 'APPROVED' : 'REVISION NEEDED'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feedback */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h3 className="font-medium text-neutral-900 mb-2">Feedback</h3>
                <p className="text-neutral-700">{aiReview.feedback}</p>
              </div>
              
              {/* Recommendations */}
              {aiReview.recommendations && aiReview.recommendations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiReview.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-blue-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Risks */}
              {aiReview.risks && aiReview.risks.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">Potential Risks</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiReview.risks.map((risk: string, i: number) => (
                      <li key={i} className="text-red-700">{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Opportunities */}
              {aiReview.opportunities && aiReview.opportunities.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Opportunities</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiReview.opportunities.map((opp: string, i: number) => (
                      <li key={i} className="text-green-700">{opp}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Financial Impact */}
              {aiReview.financialImpact && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-900 mb-2">Financial Impact</h3>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {aiReview.financialImpact.costSavings !== undefined && (
                      <div className="bg-white p-3 rounded shadow-sm">
                        <div className="text-xs text-indigo-500 uppercase">Cost Savings</div>
                        <div className="text-xl font-bold text-indigo-700">${aiReview.financialImpact.costSavings.toLocaleString()}</div>
                      </div>
                    )}
                    {aiReview.financialImpact.additionalCosts !== undefined && (
                      <div className="bg-white p-3 rounded shadow-sm">
                        <div className="text-xs text-indigo-500 uppercase">Additional Costs</div>
                        <div className="text-xl font-bold text-indigo-700">${aiReview.financialImpact.additionalCosts.toLocaleString()}</div>
                      </div>
                    )}
                    {aiReview.financialImpact.roi !== undefined && (
                      <div className="bg-white p-3 rounded shadow-sm">
                        <div className="text-xs text-indigo-500 uppercase">ROI</div>
                        <div className="text-xl font-bold text-indigo-700">{aiReview.financialImpact.roi.toLocaleString()}%</div>
                      </div>
                    )}
                  </div>
                  <p className="text-indigo-700">{aiReview.financialImpact.description}</p>
                </div>
              )}
              
              {/* AI-Suggested Plan Revision (only shows if the plan wasn't approved) */}
              {aiReview && !aiReview.approved && aiReview.revisedPlan && (
                <div className="mt-6 border border-green-200 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2 flex items-center">
                    <LightbulbIcon className="h-5 w-5 mr-2 text-green-600" />
                    AI-Suggested Plan Revision
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-1">Original Plan</h4>
                        <div className="bg-white p-3 rounded shadow-sm text-sm border border-gray-200">
                          <p className="font-medium">{selectedPlan?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedPlan?.departmentName} | 
                            {selectedPlan?.headcountChange > 0 ? '+' : ''}{selectedPlan?.headcountChange} headcount
                          </p>
                          <p className="mt-2 text-xs line-clamp-2">{selectedPlan?.description}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-1">Suggested Revision</h4>
                        <div className="bg-white p-3 rounded shadow-sm text-sm border border-green-200">
                          <p className="font-medium">{aiReview.revisedPlan.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedPlan?.departmentName} | 
                            {aiReview.revisedPlan.headcountChange > 0 ? '+' : ''}{aiReview.revisedPlan.headcountChange} headcount
                          </p>
                          <p className="mt-2 text-xs line-clamp-2">{aiReview.revisedPlan.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-1">Changes Explanation</h4>
                      <p className="text-sm bg-white p-3 rounded border border-gray-200">
                        {aiReview.revisedPlan.changesExplanation}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-1">Rationale</h4>
                      <p className="text-sm bg-white p-3 rounded border border-gray-200">
                        {aiReview.revisedPlan.rationale}
                      </p>
                    </div>
                    
                    {!isImplementingRevision && (
                      <div className="pt-2">
                        <Button 
                          variant="default"
                          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 w-full"
                          onClick={() => setIsImplementingRevision(true)}
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Implement AI Revision
                        </Button>
                      </div>
                    )}
                    
                    {isImplementingRevision && (
                      <div className="space-y-4 bg-white p-4 rounded-lg border border-green-200">
                        <h4 className="text-sm font-medium text-green-700">Implementation Notes</h4>
                        <Textarea
                          placeholder="Add any notes about implementing this revision..."
                          value={implementationNotes}
                          onChange={(e) => setImplementationNotes(e.target.value)}
                          className="h-20"
                        />
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsImplementingRevision(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              try {
                                // Call API to implement the revision
                                const response = await fetch('/api/workforce-plans/implement-revision', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    originalPlan: selectedPlan,
                                    revisedPlan: aiReview.revisedPlan,
                                    implementationNotes
                                  })
                                });
                                
                                if (!response.ok) {
                                  throw new Error("Failed to implement the revised plan");
                                }
                                
                                // Update local state with the revised plan
                                setWorkforcePlans(prevPlans => 
                                  prevPlans.map(plan => 
                                    plan.id === selectedPlan.id
                                      ? {
                                          ...plan,
                                          name: aiReview.revisedPlan.name,
                                          description: aiReview.revisedPlan.description,
                                          headcountChange: aiReview.revisedPlan.headcountChange,
                                          status: "Approved", // Mark as approved since it's an AI-revised plan
                                        }
                                      : plan
                                  )
                                );
                                
                                // Show success message
                                toast({
                                  title: "AI Revision Implemented",
                                  description: "The AI-suggested plan revision has been successfully implemented."
                                });
                                
                                // Reset and close the dialog
                                setAiReview(null);
                                setSelectedPlan(null);
                                setIsImplementingRevision(false);
                                setImplementationNotes('');
                                setReviewDialogOpen(false);
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Implementation Failed",
                                  description: "There was an error implementing the AI revision."
                                });
                              }
                            }}
                          >
                            Confirm Implementation
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {aiReview && !isImplementingRevision && (
              <>
                {!aiReview.approved && !aiReview.revisedPlan && (
                  <Button 
                    onClick={() => {
                      // Open plan edit dialog with current plan details
                      setPlanName(selectedPlan.name);
                      setPlanDescription(selectedPlan.description);
                      setPlanStartDate(selectedPlan.startDate);
                      setPlanEndDate(selectedPlan.endDate);
                      setSelectedDepartment(selectedPlan.departmentId);
                      setHeadcountChange(selectedPlan.headcountChange.toString());
                      
                      // Close this dialog and open the plan dialog
                      setReviewDialogOpen(false);
                      setPlanDialogOpen(true);
                    }}
                    variant="outline"
                    className="mr-2"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Plan Manually
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAiReview(null);
                    setSelectedPlan(null);
                    setReviewDialogOpen(false);
                  }}
                >
                  Close
                </Button>
              </>
            )}
            {!aiReview && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setReviewDialogOpen(false);
                }}
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Recommendation History Dialog */}
      <Dialog open={reviewHistoryOpen} onOpenChange={setReviewHistoryOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Recommendation History</DialogTitle>
            <DialogDescription>
              Review all past AI recommendations for your workforce plans.
            </DialogDescription>
          </DialogHeader>
          
          {Object.keys(aiReviewHistory).length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg 
                  className="h-8 w-8 text-neutral-400" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No review history yet</h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                Once you review a workforce plan with AI, the recommendations will appear here for future reference.
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(aiReviewHistory).map(([planId, data]) => (
                  <div 
                    key={planId} 
                    className="border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-neutral-50 p-4 border-b">
                      <div>
                        <h3 className="font-medium text-lg">{data.planName}</h3>
                        <div className="text-neutral-600 text-sm flex items-center gap-2">
                          <span>{data.departmentName}</span>
                          <span>•</span>
                          <span>Headcount change: {data.headcountChange > 0 ? '+' : ''}{data.headcountChange}</span>
                          <span>•</span>
                          <span>Reviewed: {data.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                          data.review.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'}`}>
                          {data.review.approved ? 'APPROVED' : 'REVISION NEEDED'} ({data.review.score}/100)
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs py-1 h-7"
                          onClick={() => {
                            // Set the selected plan and AI review
                            setSelectedPlan({
                              id: parseInt(planId),
                              name: data.planName,
                              description: data.description || '',
                              startDate: data.startDate || '',
                              endDate: data.endDate || '',
                              departmentId: data.departmentId || '',
                              departmentName: data.departmentName,
                              headcountChange: data.headcountChange,
                              status: data.review.approved ? 'Approved' : 'Needs Revision',
                              createdAt: data.createdAt
                            });
                            setAiReview(data.review);
                            
                            // Close history and open review dialog
                            setReviewHistoryOpen(false);
                            setReviewDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-neutral-900 mb-1">Feedback</h4>
                        <p className="text-sm text-neutral-700">{data.review.feedback}</p>
                      </div>
                      
                      {data.review.recommendations && data.review.recommendations.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Key Recommendations</h4>
                          <ul className="text-xs text-blue-700 list-disc pl-5">
                            {data.review.recommendations.slice(0, 2).map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                            {data.review.recommendations.length > 2 && (
                              <li className="text-blue-500 font-medium">+{data.review.recommendations.length - 2} more recommendations</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {data.review.financialImpact && (
                      <div className="bg-indigo-50 p-3 border-t">
                        <h4 className="text-xs font-medium text-indigo-900 mb-1">Financial Impact</h4>
                        <div className="flex items-center gap-3">
                          {data.review.financialImpact.costSavings !== undefined && (
                            <div className="text-xs">
                              <span className="text-indigo-500">Cost Savings:</span> 
                              <span className="font-medium text-indigo-700"> ${data.review.financialImpact.costSavings.toLocaleString()}</span>
                            </div>
                          )}
                          {data.review.financialImpact.roi !== undefined && (
                            <div className="text-xs">
                              <span className="text-indigo-500">ROI:</span> 
                              <span className="font-medium text-indigo-700"> {data.review.financialImpact.roi.toLocaleString()}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewHistoryOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Management;
