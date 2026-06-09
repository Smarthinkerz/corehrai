import usePageTitle from "@/hooks/usePageTitle";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getApiJson } from '@/lib/api';
import { exportData } from '@/lib/utils';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import OnboardingTemplates from '@/components/onboarding/OnboardingTemplates';
import { DocumentManagement } from '@/components/documents/DocumentManagement';
import LearningPathGenerator from '@/components/learning/LearningPathGenerator';

// Define interfaces to match the API response
interface Employee {
  id: number;
  fullName: string;
  position: string;
  department: string;
  email?: string;
  status?: string;
  hireDate?: string;
}

const Onboarding = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<string>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [newOnboardingDialogOpen, setNewOnboardingDialogOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeePosition, setNewEmployeePosition] = useState('');
  const [newEmployeeDepartment, setNewEmployeeDepartment] = useState('');
  const [newEmployeeStartDate, setNewEmployeeStartDate] = useState('');
  
  const { data: onboardingTasks, isLoading } = useQuery({
    queryKey: ['/api/tasks/category/onboarding'],
  });
  
  const { data: employeesData } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Employee Onboarding</h1>
          <p className="mt-1 text-neutral-500">Streamline your employee onboarding with AI-powered guidance.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <svg className="-ml-1 mr-2 h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Onboarding Data</DialogTitle>
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
                    defaultValue="all"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data to export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All onboarding data</SelectItem>
                      <SelectItem value="employees">Onboarding employees only</SelectItem>
                      <SelectItem value="tasks">Onboarding tasks only</SelectItem>
                      <SelectItem value="templates">Templates only</SelectItem>
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
                          case 'employees':
                            // Fetch employees in onboarding process
                            dataToExport = await getApiJson<any[]>('/api/employees?status=onboarding');
                            break;
                          case 'tasks':
                            // Fetch onboarding tasks
                            dataToExport = await getApiJson<any[]>('/api/tasks/category/onboarding');
                            break;
                          case 'templates':
                            // Fetch onboarding templates
                            dataToExport = [
                              { name: 'Engineering Onboarding', steps: 15, duration: '21 days' },
                              { name: 'Sales Onboarding', steps: 12, duration: '14 days' },
                              { name: 'Executive Onboarding', steps: 18, duration: '30 days' },
                              { name: 'Remote Employee Onboarding', steps: 10, duration: '7 days' },
                            ];
                            break;
                          case 'all':
                          default:
                            // Fetch all onboarding-related data
                            const [employeesData, tasksData] = await Promise.all([
                              getApiJson<any[]>('/api/employees?status=onboarding'),
                              getApiJson<any[]>('/api/tasks/category/onboarding')
                            ]);
                            
                            // Combine all data with section markers
                            dataToExport = [
                              { section: 'Onboarding Employees', data: employeesData },
                              { section: 'Onboarding Tasks', data: tasksData },
                              { section: 'Templates', data: [
                                { name: 'Engineering Onboarding', steps: 15, duration: '21 days' },
                                { name: 'Sales Onboarding', steps: 12, duration: '14 days' },
                                { name: 'Executive Onboarding', steps: 18, duration: '30 days' },
                                { name: 'Remote Employee Onboarding', steps: 10, duration: '7 days' },
                              ]}
                            ];
                            break;
                        }
                        
                        // Use our export utility to create and download the file
                        await exportData(dataToExport, 'onboarding' as any, exportFormat as any);
                        
                        toast({
                          title: "Export Complete",
                          description: `Your onboarding data has been downloaded.`
                        });
                      } catch (error) {
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

          <Dialog open={newOnboardingDialogOpen} onOpenChange={setNewOnboardingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center" id="new-onboarding-trigger">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New onboarding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Employee Onboarding</DialogTitle>
                <DialogDescription>
                  Start onboarding for a new employee by entering their details.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Employee</label>
                  <div className="grid grid-cols-1 gap-2">
                    <Select 
                      value={newEmployeeName || "new"} 
                      onValueChange={(value) => {
                        if (value === "new") {
                          // Reset to custom entry mode
                          setNewEmployeeName("");
                          setNewEmployeePosition("");
                          setNewEmployeeDepartment("");
                        } else if (value === "custom") {
                          // Keep the existing values
                        } else {
                          // Find the selected employee from our data
                          const selectedEmployee = employeesData?.find(emp => emp.id.toString() === value);
                          if (selectedEmployee) {
                            setNewEmployeeName(selectedEmployee.fullName);
                            setNewEmployeePosition(selectedEmployee.position);
                            setNewEmployeeDepartment(selectedEmployee.department);
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Add New Employee</SelectItem>
                        {employeesData?.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.fullName} - {emp.position}
                          </SelectItem>
                        ))}
                        {newEmployeeName && newEmployeeName.trim() !== "" && !employeesData?.find(emp => emp.fullName === newEmployeeName) && (
                          <SelectItem value="custom">{newEmployeeName} (Custom)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    {(!newEmployeeName || newEmployeeName === "new") && (
                      <input 
                        type="text" 
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter new employee's full name"
                        value={newEmployeeName}
                        onChange={(e) => setNewEmployeeName(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Position</label>
                  <input 
                    type="text" 
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter employee's position"
                    value={newEmployeePosition}
                    onChange={(e) => setNewEmployeePosition(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Department</label>
                  <Select 
                    value={newEmployeeDepartment} 
                    onValueChange={setNewEmployeeDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Start Date</label>
                  <input 
                    type="date" 
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newEmployeeStartDate}
                    onChange={(e) => setNewEmployeeStartDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setNewOnboardingDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={() => {
                      // Here we would make an API call to create a new onboarding
                      // For now, we'll just show a success toast and close the dialog
                      
                      if (!newEmployeeName || !newEmployeePosition || !newEmployeeDepartment || !newEmployeeStartDate) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill out all fields to create a new onboarding.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      toast({
                        title: "Onboarding Created",
                        description: `Onboarding process started for ${newEmployeeName}.`
                      });
                      
                      setNewEmployeeName('');
                      setNewEmployeePosition('');
                      setNewEmployeeDepartment('');
                      setNewEmployeeStartDate('');
                      setNewOnboardingDialogOpen(false);
                    }}
                  >
                    Create Onboarding
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-neutral-900">5</h3>
              <p className="text-sm text-neutral-500 mt-1">Employees onboarding</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-success">12</h3>
              <p className="text-sm text-neutral-500 mt-1">Completed this month</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-primary-500">92%</h3>
              <p className="text-sm text-neutral-500 mt-1">Onboarding satisfaction</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-neutral-900">7 days</h3>
              <p className="text-sm text-neutral-500 mt-1">Average completion time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white rounded-lg shadow-md border mb-6 p-1">
          <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active Onboarding
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            Templates
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documents
          </TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Training Paths
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active Onboarding Processes</CardTitle>
                  <CardDescription>Track onboarding progress for new employees.</CardDescription>
                </CardHeader>
                <CardContent>
                  <OnboardingChecklist />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Onboarding Steps</CardTitle>
                  <CardDescription>Standard onboarding procedure steps.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-neutral-900">Document Collection</div>
                        <div className="text-sm font-medium text-neutral-900">100%</div>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-neutral-900">System Access</div>
                        <div className="text-sm font-medium text-neutral-900">80%</div>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-neutral-900">Training Modules</div>
                        <div className="text-sm font-medium text-neutral-900">65%</div>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-neutral-900">Team Integration</div>
                        <div className="text-sm font-medium text-neutral-900">45%</div>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-neutral-900">Performance Goals</div>
                        <div className="text-sm font-medium text-neutral-900">30%</div>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="mt-0">
          <OnboardingTemplates />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Manage and track required onboarding documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="mt-0">
          <LearningPathGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Onboarding;
