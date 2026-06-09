import usePageTitle from "@/hooks/usePageTitle";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ComplianceTracker from '@/components/compliance/ComplianceTracker';
import { Progress } from '@/components/ui/progress';
import { exportData } from '@/lib/utils';
import { getApiJson } from '@/lib/api';
import { DocumentManagement } from '@/components/documents/DocumentManagement';

const Compliance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [exportFormat, setExportFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const { data: complianceRecords, isLoading } = useQuery({
    queryKey: ['/api/compliance'],
  });
  
  // Sample compliance data for the export feature
  const complianceData = [
    { id: 1, category: 'Data Privacy', document: 'GDPR Policy', status: 'Compliant', expiryDate: '2025-06-15', score: 98 },
    { id: 2, category: 'Employment Law', document: 'HR Handbook', status: 'Compliant', expiryDate: '2025-10-01', score: 100 },
    { id: 3, category: 'Information Security', document: 'ISO 27001', status: 'Needs Review', expiryDate: '2024-04-30', score: 92 },
    { id: 4, category: 'Workplace Safety', document: 'Safety Standards', status: 'Compliant', expiryDate: '2025-12-31', score: 100 },
    { id: 5, category: 'Training', document: 'Compliance Training', status: 'In Progress', expiryDate: '2024-06-30', score: 95 },
    { id: 6, category: 'Documentation', document: 'Policy Documentation', status: 'Compliant', expiryDate: '2025-09-15', score: 97 },
  ];
  
  // Data for deadlines
  const deadlineData = [
    { id: 1, name: 'Harassment Training Renewals', days: 12, description: '4 employees in NYC office need to renew training', status: 'warning' },
    { id: 2, name: 'GDPR Annual Review', days: 18, description: 'Required annual policy review and documentation', status: 'warning' },
    { id: 3, name: 'ISO 27001 Certification', days: -5, description: 'Security certification renewal pending', status: 'error' },
    { id: 4, name: 'Quarterly Compliance Report', days: 30, description: 'Q3 compliance status report for board review', status: 'normal' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Compliance & Security</h1>
          <p className="mt-1 text-neutral-500">Manage compliance requirements and data security with AI assistance.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <svg className="-ml-1 mr-2 h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Compliance Data</DialogTitle>
                <DialogDescription>
                  Choose the data you would like to export and the format.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Data to Export</label>
                  <Select value={exportType} onValueChange={setExportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data to export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance Records</SelectItem>
                      <SelectItem value="deadlines">Upcoming Deadlines</SelectItem>
                      <SelectItem value="documents">Document Inventory</SelectItem>
                      <SelectItem value="all">All Compliance Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
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
                          case 'compliance':
                            // Use the compliance data from state
                            dataToExport = complianceData;
                            break;
                          case 'deadlines':
                            // Use the deadlines data from state
                            dataToExport = deadlineData;
                            break;
                          case 'documents':
                            // Fetch documents data
                            dataToExport = await getApiJson<any[]>('/api/compliance/documents');
                            break;
                          case 'all':
                          default:
                            // For better compatibility with export functionality, use flattened data
                            // Fetch documents data (or use empty array if API fails)
                            const documentsData = await getApiJson<any[]>('/api/compliance/documents').catch(() => []);
                            
                            // Combine all data with section identifiers in a flat structure
                            const flattenedData = [
                              // Add compliance data with section field
                              ...complianceData.map(item => ({ 
                                section: 'Compliance Records',
                                ...item 
                              })),
                              
                              // Add deadlines data with section field
                              ...deadlineData.map(item => ({ 
                                section: 'Upcoming Deadlines',
                                ...item 
                              })),
                              
                              // Add documents data with section field if available
                              ...(Array.isArray(documentsData) ? documentsData.map(item => ({ 
                                section: 'Document Inventory',
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
                        
                        // Use the export utility to create and download the file
                        await exportData(dataToExport, 'compliance' as any, exportFormat as any);
                        
                        toast({
                          title: "Export Complete",
                          description: `Your compliance data has been downloaded.`
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
          <Button className="inline-flex items-center">
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Run compliance check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-success">98%</h3>
              <p className="text-sm text-neutral-500 mt-1">Compliance rate</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-warning-500">4</h3>
              <p className="text-sm text-neutral-500 mt-1">Issues requiring attention</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-error">2</h3>
              <p className="text-sm text-neutral-500 mt-1">Expired certifications</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-neutral-900">12</h3>
              <p className="text-sm text-neutral-500 mt-1">Days until next audit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white shadow-sm mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Document Management</TabsTrigger>
          <TabsTrigger value="training">Compliance Training</TabsTrigger>
          <TabsTrigger value="security">Data Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Tracker</CardTitle>
                  <CardDescription>Monitor compliance status across policies and regulations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComplianceTracker />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Critical compliance dates and renewals.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-neutral-900">Harassment Training Renewals</h4>
                        <span className="text-xs px-2 py-1 bg-warning-100 text-warning-800 rounded-full">12 days</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">4 employees in NYC office need to renew training</p>
                    </div>
                    
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-neutral-900">GDPR Annual Review</h4>
                        <span className="text-xs px-2 py-1 bg-warning-100 text-warning-800 rounded-full">18 days</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">Required annual policy review and documentation</p>
                    </div>
                    
                    <div className="p-3 bg-error-50 border border-error-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-neutral-900">ISO 27001 Certification</h4>
                        <span className="text-xs px-2 py-1 bg-error-100 text-error-800 rounded-full">Overdue</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">Security certification renewal pending</p>
                    </div>
                    
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-neutral-900">Quarterly Compliance Report</h4>
                        <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-800 rounded-full">30 days</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">Q3 compliance status report for board review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Compliance by Category</CardTitle>
              <CardDescription>Status of compliance across different regulatory areas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-neutral-900">Data Privacy (GDPR, CCPA)</div>
                      <div className="text-sm font-medium text-neutral-900">98%</div>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-neutral-900">Employment Law Compliance</div>
                      <div className="text-sm font-medium text-neutral-900">100%</div>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-neutral-900">Information Security</div>
                      <div className="text-sm font-medium text-neutral-900">92%</div>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-neutral-900">Workplace Safety</div>
                      <div className="text-sm font-medium text-neutral-900">100%</div>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-neutral-900">Training & Certification</div>
                      <div className="text-sm font-medium text-neutral-900">95%</div>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-neutral-900">Policy Documentation</div>
                      <div className="text-sm font-medium text-neutral-900">97%</div>
                    </div>
                    <Progress value={97} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Secure storage and management of compliance documentation.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Training</CardTitle>
              <CardDescription>Manage and track employee compliance training programs.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Compliance training content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
              <CardDescription>Monitor and manage HR data security measures.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Data security content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;
