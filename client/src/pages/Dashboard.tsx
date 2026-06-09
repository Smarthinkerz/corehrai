import usePageTitle from "@/hooks/usePageTitle";
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import MetricDetailsDialog, { MetricType } from '@/components/dashboard/MetricDetailsDialog';
import AIInsights from '@/components/dashboard/AIInsights';
import MetricCard from '@/components/dashboard/MetricCard';
import RecruitmentOverview from '@/components/dashboard/RecruitmentOverview';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import EmployeeInsights from '@/components/dashboard/EmployeeInsights';
import EmployeeDirectory from '@/components/dashboard/EmployeeDirectory';
import TasksSection from '@/components/dashboard/TasksSection';
import type { Department, Employee, InsertEmployee } from '@shared/schema';
import { toast } from '@/hooks/use-toast';
import { postApiJson, getApiJson } from '@/lib/api';
import { exportData } from '@/lib/utils';

// Time range options

const timeRanges = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
];

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [customizeMetricsDialogOpen, setCustomizeMetricsDialogOpen] = useState(false);
  const [metricDetailsDialogOpen, setMetricDetailsDialogOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState({
    employees: true,
    positions: true,
    timeToHire: true,
    satisfaction: true,
    turnover: false,
    training: false
  });
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'engineering',
    customDepartment: '',
    position: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [exportType, setExportType] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: departments, isLoading: isDepartmentsLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments', timeRange],
  });

  const { data: employees, isLoading: isEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees', timeRange],
  });
  
  const refreshData = () => {
    setIsRefreshing(true);
    
    // Invalidate all cached queries to refresh everything
    queryClient.invalidateQueries();
    
    // Specifically invalidate the key queries
    queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
    queryClient.invalidateQueries({ queryKey: ['/api/insights'] });
    
    // Set a timeout to simulate the refresh taking some time
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date());
      
      // Show success toast
      toast({
        title: "Data Refreshed",
        description: "Dashboard metrics have been refreshed with the latest data"
      });
    }, 1000);
  };
  
  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: (employeeData: InsertEmployee) => 
      postApiJson<Employee>('/api/employees', employeeData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee was added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      // Reset the form
      setNewEmployee({
        firstName: '',
        lastName: '',
        email: '',
        department: 'engineering',
        customDepartment: '',
        position: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="container px-4 py-2 mx-auto" style={{ maxWidth: '1600px' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">HR Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center">
            <span className="mr-2 text-sm text-neutral-500">Time range:</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-1" 
              onClick={refreshData}
              title="Refresh data"
            >
              <svg className="h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
          <div className="flex space-x-3">
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
                  <DialogTitle>Export Dashboard Data</DialogTitle>
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
                        <SelectItem value="all">All dashboard data</SelectItem>
                        <SelectItem value="employees">Employee data only</SelectItem>
                        <SelectItem value="metrics">Metrics only</SelectItem>
                        <SelectItem value="insights">AI insights only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Export format</label>
                    <Select 
                      value={exportFormat}
                      onValueChange={setExportFormat}
                      defaultValue="csv"
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
                              // Fetch employee data
                              dataToExport = await getApiJson<Employee[]>('/api/employees');
                              break;
                            case 'metrics':
                              // Create metrics summary data
                              dataToExport = [
                                { metric: 'Total Employees', value: employees?.length || 0 },
                                { metric: 'Open Positions', value: 12 },
                                { metric: 'Average Time to Hire', value: '21 days' },
                                { metric: 'Employee Satisfaction', value: '4.2/5' },
                                { metric: 'Turnover Rate', value: '8%' },
                                { metric: 'Training Completion', value: '92%' },
                              ];
                              break;
                            case 'insights':
                              // Fetch AI insights
                              const insightsData = await getApiJson<any>('/api/insights');
                              dataToExport = insightsData.insights || [];
                              break;
                            case 'all':
                            default:
                              // Fetch all data types
                              const [employeesData, departmentsData, insightsResponse] = await Promise.all([
                                getApiJson<Employee[]>('/api/employees'),
                                getApiJson<Department[]>('/api/departments'),
                                getApiJson<any>('/api/insights')
                              ]);
                              
                              // Combine all data with section markers
                              dataToExport = [
                                { section: 'Employees', data: employeesData },
                                { section: 'Departments', data: departmentsData },
                                { section: 'Insights', data: insightsResponse.insights || [] }
                              ];
                              break;
                          }
                          
                          // Use our export utility to create and download the file
                          await exportData(dataToExport, exportType as any, exportFormat as any);
                          
                          toast({
                            title: "Export Complete",
                            description: `Your data has been downloaded.`
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

            <Dialog open={addEmployeeDialogOpen} onOpenChange={setAddEmployeeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="inline-flex items-center">
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Enter employee details to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-neutral-700">First Name</label>
                      <input 
                        type="text" 
                        className="px-3 py-2 border border-neutral-300 rounded-md"
                        value={newEmployee.firstName}
                        onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium text-neutral-700">Last Name</label>
                      <input 
                        type="text" 
                        className="px-3 py-2 border border-neutral-300 rounded-md"
                        value={newEmployee.lastName}
                        onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Email</label>
                    <input 
                      type="email" 
                      className="px-3 py-2 border border-neutral-300 rounded-md"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Department</label>
                    <div className="relative">
                      <Select 
                        value={newEmployee.department}
                        onValueChange={(value) => setNewEmployee({...newEmployee, department: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="custom">Custom department...</SelectItem>
                        </SelectContent>
                      </Select>
                      {newEmployee.department === 'custom' && (
                        <input 
                          type="text" 
                          className="mt-2 px-3 py-2 border border-neutral-300 rounded-md w-full placeholder-neutral-400"
                          placeholder="Type your department name here" 
                          value={newEmployee.customDepartment}
                          onChange={(e) => setNewEmployee({...newEmployee, customDepartment: e.target.value})}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Position</label>
                    <input 
                      type="text" 
                      className="px-3 py-2 border border-neutral-300 rounded-md"
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={() => setAddEmployeeDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => {
                        // Create a valid employee object
                        const department = newEmployee.department === 'custom' 
                          ? newEmployee.customDepartment 
                          : newEmployee.department;

                        if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !department || !newEmployee.position) {
                          toast({
                            title: "Validation Error",
                            description: "Please fill out all required fields.",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Create employee data
                        const employeeData: InsertEmployee = {
                          userId: 1, // Using default admin user ID
                          fullName: `${newEmployee.firstName} ${newEmployee.lastName}`,
                          email: newEmployee.email,
                          department,
                          position: newEmployee.position,
                          hireDate: new Date(),
                          status: 'active',
                          phone: '', // Add empty values for optional fields that might be required by validation
                          manager: '',
                        };

                        // Submit the data
                        createEmployeeMutation.mutate(employeeData);
                        setAddEmployeeDialogOpen(false);
                      }}
                      disabled={createEmployeeMutation.isPending}
                    >
                      {createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <AIInsights />

      {/* Dashboard Metrics */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-neutral-700">Key Metrics</h3>
          <div className="flex space-x-2">
            <div className="flex flex-col">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={refreshData}
                disabled={isRefreshing || isDepartmentsLoading || isEmployeesLoading}
              >
                <svg 
                  className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
              </Button>
              {lastRefreshed && (
                <div className="text-xs text-neutral-500 mt-1 text-center">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </div>
              )}
            </div>
            <Dialog open={customizeMetricsDialogOpen} onOpenChange={setCustomizeMetricsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Customize View
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Customize Metrics View</DialogTitle>
                  <DialogDescription>
                    Select which metrics you want to display on your dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="metric-employees" 
                      className="rounded" 
                      checked={visibleMetrics.employees}
                      onChange={(e) => setVisibleMetrics({...visibleMetrics, employees: e.target.checked})}
                    />
                    <label htmlFor="metric-employees">Total Employees</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="metric-positions" 
                      className="rounded"
                      checked={visibleMetrics.positions}
                      onChange={(e) => setVisibleMetrics({...visibleMetrics, positions: e.target.checked})}
                    />
                    <label htmlFor="metric-positions">Open Positions</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="metric-time" 
                      className="rounded"
                      checked={visibleMetrics.timeToHire}
                      onChange={(e) => setVisibleMetrics({...visibleMetrics, timeToHire: e.target.checked})}
                    />
                    <label htmlFor="metric-time">Time to Hire</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="metric-satisfaction" 
                      className="rounded"
                      checked={visibleMetrics.satisfaction}
                      onChange={(e) => setVisibleMetrics({...visibleMetrics, satisfaction: e.target.checked})}
                    />
                    <label htmlFor="metric-satisfaction">Employee Satisfaction</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="metric-turnover" 
                      className="rounded"
                      checked={visibleMetrics.turnover}
                      onChange={(e) => setVisibleMetrics({...visibleMetrics, turnover: e.target.checked})}
                    />
                    <label htmlFor="metric-turnover">Turnover Rate</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="metric-training" 
                      className="rounded"
                      checked={visibleMetrics.training}
                      onChange={(e) => setVisibleMetrics({...visibleMetrics, training: e.target.checked})}
                    />
                    <label htmlFor="metric-training">Training Completion</label>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCustomizeMetricsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      setCustomizeMetricsDialogOpen(false);
                      refreshData();
                      toast({
                        title: "Metrics Updated",
                        description: "Your dashboard metrics have been updated successfully",
                      });
                    }}>Apply Changes</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleMetrics.employees && (
            <MetricCard
              title="Total Employees"
              value={employees?.length?.toString() || '1482'}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              trend={{
                value: timeRange === 'month' ? "4.3%" : timeRange === 'quarter' ? "8.7%" : "2.1%",
                isPositive: true,
                label: `vs last ${timeRange}`
              }}
              onClick={() => {
                setSelectedMetricType('employees');
                setMetricDetailsDialogOpen(true);
              }}
            />
          )}

          {visibleMetrics.positions && (
            <MetricCard
              title="Open Positions"
              value={timeRange === 'month' ? "27" : timeRange === 'quarter' ? "42" : "18"}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              iconBgColor="bg-secondary-100"
              iconColor="text-secondary-600"
              trend={{
                value: timeRange === 'month' ? "12.8%" : timeRange === 'quarter' ? "15.3%" : "7.2%",
                isPositive: true,
                label: `vs last ${timeRange}`
              }}
              onClick={() => {
                setSelectedMetricType('positions');
                setMetricDetailsDialogOpen(true);
              }}
            />
          )}

          {visibleMetrics.timeToHire && (
            <MetricCard
              title="Time to Hire (Avg)"
              value={timeRange === 'month' ? "18 days" : timeRange === 'quarter' ? "22 days" : "15 days"}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconBgColor="bg-accent-100"
              iconColor="text-accent-600"
              trend={{
                value: timeRange === 'month' ? "5.2%" : timeRange === 'quarter' ? "8.1%" : "3.4%",
                isPositive: false,
                label: "vs industry avg"
              }}
              onClick={() => {
                setSelectedMetricType('timeToHire');
                setMetricDetailsDialogOpen(true);
              }}
            />
          )}

          {visibleMetrics.satisfaction && (
            <MetricCard
              title="Employee Satisfaction"
              value={timeRange === 'month' ? "87%" : timeRange === 'quarter' ? "83%" : "89%"}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              iconBgColor="bg-warning-100"
              iconColor="text-warning-600"
              trend={{
                value: timeRange === 'month' ? "1.4%" : timeRange === 'quarter' ? "2.7%" : "0.8%",
                isPositive: timeRange !== 'quarter',
                label: `vs last ${timeRange === 'quarter' ? 'year' : 'quarter'}`
              }}
              onClick={() => {
                setSelectedMetricType('satisfaction');
                setMetricDetailsDialogOpen(true);
              }}
            />
          )}
          
          {visibleMetrics.turnover && (
            <MetricCard
              title="Turnover Rate"
              value={timeRange === 'month' ? "2.7%" : timeRange === 'quarter' ? "5.3%" : "1.9%"}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
              }
              iconBgColor="bg-error-100"
              iconColor="text-error-600"
              trend={{
                value: timeRange === 'month' ? "0.5%" : timeRange === 'quarter' ? "1.2%" : "0.3%",
                isPositive: true,
                label: "below industry avg"
              }}
              onClick={() => {
                setSelectedMetricType('turnover');
                setMetricDetailsDialogOpen(true);
              }}
            />
          )}
          
          {visibleMetrics.training && (
            <MetricCard
              title="Training Completion"
              value={timeRange === 'month' ? "92%" : timeRange === 'quarter' ? "87%" : "94%"}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              iconBgColor="bg-success-100"
              iconColor="text-success-600"
              trend={{
                value: timeRange === 'month' ? "3.2%" : timeRange === 'quarter' ? "1.5%" : "4.1%",
                isPositive: true,
                label: `vs last ${timeRange}`
              }}
              onClick={() => {
                setSelectedMetricType('training');
                setMetricDetailsDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Main Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Overview */}
        <RecruitmentOverview />

        {/* Recent Activities */}
        <ActivityFeed />

        {/* Employee Insights */}
        <EmployeeInsights />
      </div>

      {/* Employee Directory - Full width like Tasks */}
      <div className="mt-8 mb-8 w-full">
        <EmployeeDirectory />
      </div>


      {/* Upcoming Tasks */}
      <TasksSection />

      {/* Metric Details Dialog */}
      <MetricDetailsDialog
        open={metricDetailsDialogOpen}
        onOpenChange={setMetricDetailsDialogOpen}
        metricType={selectedMetricType}
        timeRange={timeRange}
      />
    </div>
  );
};

export default Dashboard;
