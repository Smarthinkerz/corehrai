// @ts-nocheck
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { exportData } from "@/lib/utils";

// Define the types of metrics for type safety
export type MetricType = 
  'employees' | 
  'positions' | 
  'timeToHire' | 
  'satisfaction' | 
  'turnover' | 
  'training';

interface MetricDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: MetricType | null;
  timeRange: string;
}

const MetricDetailsDialog: React.FC<MetricDetailsDialogProps> = ({
  open,
  onOpenChange,
  metricType,
  timeRange
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | 'json'>('excel');
  
  if (!metricType) return null;

  // Get metric title based on the type
  const getMetricTitle = () => {
    switch (metricType) {
      case 'employees': return 'Total Employees';
      case 'positions': return 'Open Positions';
      case 'timeToHire': return 'Time to Hire';
      case 'satisfaction': return 'Employee Satisfaction';
      case 'turnover': return 'Turnover Rate';
      case 'training': return 'Training Completion';
      default: return '';
    }
  };

  // Sample data generators for each metric type
  const getMetricData = () => {
    switch (metricType) {
      case 'employees':
        return {
          current: timeRange === 'month' ? 1482 : timeRange === 'quarter' ? 1465 : 1510,
          previous: timeRange === 'month' ? 1420 : timeRange === 'quarter' ? 1348 : 1480, 
          breakdown: [
            { department: 'Engineering', count: 482, change: '+4.3%' },
            { department: 'Sales', count: 315, change: '+2.8%' },
            { department: 'Marketing', count: 175, change: '+1.1%' },
            { department: 'Product', count: 203, change: '+6.2%' },
            { department: 'Operations', count: 207, change: '+0.5%' },
            { department: 'HR', count: 67, change: '+5.9%' },
            { department: 'Finance', count: 33, change: '+0%' },
          ],
          trend: [1410, 1425, 1430, 1445, 1455, 1470, 1482]
        };
      case 'positions':
        return {
          current: timeRange === 'month' ? 27 : timeRange === 'quarter' ? 42 : 18,
          previous: timeRange === 'month' ? 24 : timeRange === 'quarter' ? 37 : 16, 
          breakdown: [
            { department: 'Engineering', count: 12, change: '+20%' },
            { department: 'Sales', count: 7, change: '+16.7%' },
            { department: 'Marketing', count: 3, change: '0%' },
            { department: 'Product', count: 2, change: '+100%' },
            { department: 'Operations', count: 2, change: '-33.3%' },
            { department: 'HR', count: 1, change: '0%' },
          ],
          trend: [22, 23, 24, 26, 25, 28, 27]
        };
      case 'timeToHire':
        return {
          current: timeRange === 'month' ? 18 : timeRange === 'quarter' ? 22 : 15,
          previous: timeRange === 'month' ? 19 : timeRange === 'quarter' ? 24 : 16,
          industry: 19,
          breakdown: [
            { department: 'Engineering', days: 21, change: '-4.5%' },
            { department: 'Sales', days: 15, change: '-6.3%' },
            { department: 'Marketing', days: 17, change: '-5.6%' },
            { department: 'Product', days: 22, change: '-8.3%' },
            { department: 'Operations', days: 14, change: '-3.4%' },
            { department: 'HR', days: 16, change: '-5.9%' },
          ],
          trend: [19, 19, 18, 18, 17, 18, 18]
        };
      case 'satisfaction':
        return {
          current: timeRange === 'month' ? 87 : timeRange === 'quarter' ? 83 : 89,
          previous: timeRange === 'month' ? 86 : timeRange === 'quarter' ? 85 : 88,
          breakdown: [
            { department: 'Engineering', score: 88, change: '+1.1%' },
            { department: 'Sales', score: 82, change: '+2.5%' },
            { department: 'Marketing', score: 91, change: '+1.1%' },
            { department: 'Product', score: 89, change: '+1.1%' },
            { department: 'Operations', score: 84, change: '-1.2%' },
            { department: 'HR', score: 93, change: '+2.2%' },
            { department: 'Finance', score: 86, change: '+1.2%' },
          ],
          areas: [
            { category: 'Work-Life Balance', score: 82 },
            { category: 'Compensation', score: 78 },
            { category: 'Career Growth', score: 85 },
            { category: 'Management', score: 87 },
            { category: 'Culture', score: 92 },
          ],
          trend: [85, 85, 86, 86, 87, 87, 87]
        };
      case 'turnover':
        return {
          current: timeRange === 'month' ? 2.7 : timeRange === 'quarter' ? 5.3 : 1.9,
          previous: timeRange === 'month' ? 2.8 : timeRange === 'quarter' ? 5.4 : 2.0,
          industry: 3.2,
          breakdown: [
            { department: 'Engineering', rate: 2.1, change: '-0.2%' },
            { department: 'Sales', rate: 3.4, change: '-0.3%' },
            { department: 'Marketing', rate: 2.8, change: '-0.1%' },
            { department: 'Product', rate: 2.0, change: '-0.3%' },
            { department: 'Operations', rate: 3.1, change: '+0.2%' },
            { department: 'HR', rate: 1.8, change: '-0.4%' },
            { department: 'Finance', rate: 2.2, change: '-0.1%' },
          ],
          trend: [2.9, 2.8, 2.8, 2.7, 2.7, 2.6, 2.7]
        };
      case 'training':
        return {
          current: timeRange === 'month' ? 92 : timeRange === 'quarter' ? 87 : 94,
          previous: timeRange === 'month' ? 89 : timeRange === 'quarter' ? 85 : 90,
          breakdown: [
            { department: 'Engineering', rate: 94, change: '+3.3%' },
            { department: 'Sales', rate: 91, change: '+4.6%' },
            { department: 'Marketing', rate: 95, change: '+2.2%' },
            { department: 'Product', rate: 93, change: '+3.3%' },
            { department: 'Operations', rate: 89, change: '+3.5%' },
            { department: 'HR', rate: 97, change: '+2.1%' },
            { department: 'Finance', rate: 90, change: '+3.4%' },
          ],
          types: [
            { type: 'Compliance', completion: 98 },
            { type: 'Technical', completion: 87 },
            { type: 'Soft Skills', completion: 91 },
            { type: 'Leadership', completion: 82 },
            { type: 'Onboarding', completion: 95 },
          ],
          trend: [88, 89, 90, 91, 92, 92, 92]
        };
      default:
        return { current: 0, previous: 0, breakdown: [] };
    }
  };

  const metricData = getMetricData() as any;
  
  // Render different content based on metric type
  const renderMetricContent = () => {
    switch (metricType) {
      case 'employees':
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-3xl font-bold">{metricData.current}</CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-600">Current Total</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-3xl font-bold">{metricData.previous}</CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-600">Previous {timeRange}</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-3xl font-bold text-green-600">+{((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%</CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-600">Growth Rate</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Key Statistics</CardTitle>
                  <CardDescription>Employee statistics for {timeRange}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <dt className="text-sm font-medium text-gray-600">Average Tenure</dt>
                      <dd className="mt-2 text-xl font-bold">{timeRange === 'month' ? '2.7 years' : timeRange === 'quarter' ? '2.6 years' : '2.8 years'}</dd>
                      <div className="mt-1 text-xs text-gray-500">+0.2 years from previous {timeRange}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <dt className="text-sm font-medium text-gray-600">New Hires</dt>
                      <dd className="mt-2 text-xl font-bold">{timeRange === 'month' ? '83' : timeRange === 'quarter' ? '127' : '42'}</dd>
                      <div className="mt-1 text-xs text-green-600">+12% from previous {timeRange}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <dt className="text-sm font-medium text-gray-600">Voluntary Exits</dt>
                      <dd className="mt-2 text-xl font-bold">{timeRange === 'month' ? '21' : timeRange === 'quarter' ? '43' : '11'}</dd>
                      <div className="mt-1 text-xs text-green-600">-5% from previous {timeRange}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <dt className="text-sm font-medium text-gray-600">Full-time Ratio</dt>
                      <dd className="mt-2 text-xl font-bold">92%</dd>
                      <div className="mt-1 text-xs text-gray-500">Unchanged from previous {timeRange}</div>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown by Department</CardTitle>
                  <CardDescription>Number of employees per department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs font-medium text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th scope="col" className="px-6 py-3">Department</th>
                          <th scope="col" className="px-6 py-3 text-right">Headcount</th>
                          <th scope="col" className="px-6 py-3 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.breakdown.map((dept, index) => (
                          <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                            <td className="px-6 py-4 font-medium">{dept.department}</td>
                            <td className="px-6 py-4 text-right">{dept.count}</td>
                            <td className={`px-6 py-4 text-right font-medium ${dept.change.startsWith('+') ? 'text-green-600' : dept.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'}`}>
                              {dept.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Count Trend</CardTitle>
                  <CardDescription>Last 7 {timeRange}s</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex h-64 items-end space-x-2">
                      {metricData.trend.map((value, index) => (
                        <div key={index} className="bg-primary rounded-t w-9 transition-all" 
                             style={{ height: `${(value / Math.max(...metricData.trend)) * 100}%` }}>
                          <div className="text-xs text-center mt-2 -rotate-90 origin-bottom-left transform translate-y-full">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        );
      
      case 'positions':
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.current}</CardTitle>
                    <CardDescription>Current Open Positions</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.previous}</CardTitle>
                    <CardDescription>Previous {timeRange}</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-green-600">+{((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%</CardTitle>
                    <CardDescription>Growth Rate</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Open Position Statistics</CardTitle>
                  <CardDescription>Recruitment status for {timeRange}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Newly Posted</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '10' : timeRange === 'quarter' ? '18' : '6'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">In Interview Stage</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '15' : timeRange === 'quarter' ? '22' : '9'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Avg. Applicants per Role</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '47' : timeRange === 'quarter' ? '52' : '41'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Offer Acceptance Rate</dt>
                      <dd className="mt-1 text-lg font-semibold">88%</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions by Department</CardTitle>
                  <CardDescription>Current open roles per department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Department</th>
                          <th scope="col" className="px-6 py-3 text-right">Open Roles</th>
                          <th scope="col" className="px-6 py-3 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.breakdown.map((dept, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{dept.department}</td>
                            <td className="px-6 py-4 text-right">{dept.count}</td>
                            <td className={`px-6 py-4 text-right ${dept.change.startsWith('+') ? 'text-green-600' : dept.change.startsWith('-') ? 'text-red-600' : ''}`}>
                              {dept.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions Trend</CardTitle>
                  <CardDescription>Last 7 {timeRange}s</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex h-64 items-end space-x-2">
                      {metricData.trend.map((value, index) => (
                        <div key={index} className="bg-secondary rounded-t w-9 transition-all" 
                             style={{ height: `${(value / Math.max(...metricData.trend)) * 100}%` }}>
                          <div className="text-xs text-center mt-2 -rotate-90 origin-bottom-left transform translate-y-full">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        );
        
      case 'timeToHire':
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.current} days</CardTitle>
                    <CardDescription>Current Average</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.previous} days</CardTitle>
                    <CardDescription>Previous {timeRange}</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-green-600">{((metricData.previous - metricData.current) / metricData.previous * 100).toFixed(1)}%</CardTitle>
                    <CardDescription>Improvement</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Time to Hire Breakdown</CardTitle>
                  <CardDescription>Hiring efficiency metrics for {timeRange}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Industry Average</dt>
                      <dd className="mt-1 text-lg font-semibold">{metricData.industry} days</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Screening Phase</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '5' : timeRange === 'quarter' ? '6' : '4'} days</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Interview Phase</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '9' : timeRange === 'quarter' ? '11' : '8'} days</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Offer & Negotiation</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '4' : timeRange === 'quarter' ? '5' : '3'} days</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Time to Hire by Department</CardTitle>
                  <CardDescription>Average days to hire per department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Department</th>
                          <th scope="col" className="px-6 py-3 text-right">Days to Hire</th>
                          <th scope="col" className="px-6 py-3 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.breakdown.map((dept, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{dept.department}</td>
                            <td className="px-6 py-4 text-right">{dept.days} days</td>
                            <td className={`px-6 py-4 text-right ${dept.change.startsWith('+') ? 'text-red-600' : dept.change.startsWith('-') ? 'text-green-600' : ''}`}>
                              {dept.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Time to Hire Trend</CardTitle>
                  <CardDescription>Last 7 {timeRange}s (days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex h-64 items-end space-x-2">
                      {metricData.trend.map((value, index) => (
                        <div key={index} className="bg-accent rounded-t w-9 transition-all" 
                             style={{ height: `${(value / Math.max(...metricData.trend)) * 100}%` }}>
                          <div className="text-xs text-center mt-2 -rotate-90 origin-bottom-left transform translate-y-full">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        );

      case 'satisfaction':
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="areas">By Area</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.current}%</CardTitle>
                    <CardDescription>Current Satisfaction</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.previous}%</CardTitle>
                    <CardDescription>Previous {timeRange}</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-2xl ${metricData.current >= metricData.previous ? 'text-green-600' : 'text-red-600'}`}>
                      {metricData.current >= metricData.previous ? '+' : ''}{((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%
                    </CardTitle>
                    <CardDescription>Change</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Statistics</CardTitle>
                  <CardDescription>Employee satisfaction metrics for {timeRange}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Survey Response Rate</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '92%' : timeRange === 'quarter' ? '89%' : '94%'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">eNPS Score</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '67' : timeRange === 'quarter' ? '64' : '69'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Promoters</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '72%' : timeRange === 'quarter' ? '70%' : '73%'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Detractors</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '5%' : timeRange === 'quarter' ? '6%' : '4%'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction by Department</CardTitle>
                  <CardDescription>Employee satisfaction scores per department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Department</th>
                          <th scope="col" className="px-6 py-3 text-right">Score</th>
                          <th scope="col" className="px-6 py-3 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.breakdown.map((dept, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{dept.department}</td>
                            <td className="px-6 py-4 text-right">{dept.score}%</td>
                            <td className={`px-6 py-4 text-right ${dept.change.startsWith('+') ? 'text-green-600' : dept.change.startsWith('-') ? 'text-red-600' : ''}`}>
                              {dept.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="areas" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction by Area</CardTitle>
                  <CardDescription>Satisfaction scores across different categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Category</th>
                          <th scope="col" className="px-6 py-3 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.areas.map((area, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{area.category}</td>
                            <td className="px-6 py-4 text-right">{area.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        );

      case 'turnover':
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.current}%</CardTitle>
                    <CardDescription>Current Turnover Rate</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.previous}%</CardTitle>
                    <CardDescription>Previous {timeRange}</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-green-600">-{((metricData.previous - metricData.current) / metricData.previous * 100).toFixed(1)}%</CardTitle>
                    <CardDescription>Improvement</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Turnover & Retention</CardTitle>
                  <CardDescription>Workforce stability metrics for {timeRange}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Industry Average</dt>
                      <dd className="mt-1 text-lg font-semibold">{metricData.industry}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Voluntary Turnover</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '1.8%' : timeRange === 'quarter' ? '3.6%' : '1.3%'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Involuntary Turnover</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '0.9%' : timeRange === 'quarter' ? '1.7%' : '0.6%'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">1-Year Retention Rate</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '91%' : timeRange === 'quarter' ? '90%' : '92%'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turnover by Department</CardTitle>
                  <CardDescription>Turnover rates per department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Department</th>
                          <th scope="col" className="px-6 py-3 text-right">Rate</th>
                          <th scope="col" className="px-6 py-3 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.breakdown.map((dept, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{dept.department}</td>
                            <td className="px-6 py-4 text-right">{dept.rate}%</td>
                            <td className={`px-6 py-4 text-right ${dept.change.startsWith('+') ? 'text-red-600' : dept.change.startsWith('-') ? 'text-green-600' : ''}`}>
                              {dept.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turnover Rate Trend</CardTitle>
                  <CardDescription>Last 7 {timeRange}s (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex h-64 items-end space-x-2">
                      {metricData.trend.map((value, index) => (
                        <div key={index} className="bg-error rounded-t w-9 transition-all" 
                             style={{ height: `${(value / Math.max(...metricData.trend)) * 100}%` }}>
                          <div className="text-xs text-center mt-2 -rotate-90 origin-bottom-left transform translate-y-full">
                            {value}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        );

      case 'training':
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="types">By Type</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.current}%</CardTitle>
                    <CardDescription>Current Completion Rate</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{metricData.previous}%</CardTitle>
                    <CardDescription>Previous {timeRange}</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-green-600">+{((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%</CardTitle>
                    <CardDescription>Improvement</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Training Statistics</CardTitle>
                  <CardDescription>Employee development metrics for {timeRange}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Training Programs</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '27' : timeRange === 'quarter' ? '42' : '18'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Training Hours/Employee</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '8.2' : timeRange === 'quarter' ? '12.7' : '5.8'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Training Satisfaction</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '89%' : timeRange === 'quarter' ? '87%' : '91%'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cost per Employee</dt>
                      <dd className="mt-1 text-lg font-semibold">{timeRange === 'month' ? '$345' : timeRange === 'quarter' ? '$578' : '$210'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Training by Department</CardTitle>
                  <CardDescription>Completion rates per department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Department</th>
                          <th scope="col" className="px-6 py-3 text-right">Rate</th>
                          <th scope="col" className="px-6 py-3 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.breakdown.map((dept, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{dept.department}</td>
                            <td className="px-6 py-4 text-right">{dept.rate}%</td>
                            <td className={`px-6 py-4 text-right ${dept.change.startsWith('+') ? 'text-green-600' : dept.change.startsWith('-') ? 'text-red-600' : ''}`}>
                              {dept.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="types" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Training by Type</CardTitle>
                  <CardDescription>Completion rates by training category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Training Type</th>
                          <th scope="col" className="px-6 py-3 text-right">Completion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricData.types.map((type, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{type.type}</td>
                            <td className="px-6 py-4 text-right">{type.completion}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        );

      default:
        return <div>No data available for this metric.</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{getMetricTitle()} Details</DialogTitle>
              <DialogDescription className="mt-1">
                Detailed analytics for the selected time range: {timeRange}
              </DialogDescription>
            </div>
            <div className="p-2 rounded-full bg-primary-50 text-primary-600">
              {metricType === 'employees' && (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              {metricType === 'positions' && (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {metricType === 'timeToHire' && (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {metricType === 'satisfaction' && (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {metricType === 'turnover' && (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              )}
              {metricType === 'training' && (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto py-4 pr-2">
          {renderMetricContent()}
        </div>
        
        <DialogFooter className="flex justify-between items-center mt-4 pt-2 border-t">
          <div className="text-sm text-gray-500">
            Data as of {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  setIsExporting(true);
                  // Prepare data for export based on the metric type
                  let dataToExport = [];
                  
                  // Get all the relevant data for the current metric type
                  if (metricType === 'employees') {
                    // Employee data
                    dataToExport = [
                      { title: 'Total Employees', value: metricData.current, change: `${((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%` },
                      ...metricData.breakdown
                    ];
                  } else if (metricType === 'positions') {
                    // Positions data
                    dataToExport = [
                      { title: 'Open Positions', value: metricData.current, change: `${((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%` },
                      ...metricData.breakdown
                    ];
                  } else if (metricType === 'timeToHire') {
                    // Time to hire data
                    dataToExport = [
                      { title: 'Average Time to Hire (days)', value: metricData.current, change: `${((metricData.previous - metricData.current) / metricData.previous * 100).toFixed(1)}%`, industry: metricData.industry },
                      ...metricData.breakdown.map(dept => ({
                        department: dept.department,
                        days: dept.days,
                        change: dept.change
                      }))
                    ];
                  } else if (metricType === 'satisfaction') {
                    // Satisfaction data
                    dataToExport = [
                      { title: 'Employee Satisfaction Score', value: `${metricData.current}%`, change: `${((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%` },
                      ...metricData.breakdown.map(dept => ({
                        department: dept.department,
                        satisfaction_score: `${dept.score}%`,
                        change: dept.change
                      }))
                    ];
                    
                    // Add areas if available
                    if (metricData.areas) {
                      dataToExport.push({ title: 'Satisfaction Areas', value: '' });
                      metricData.areas.forEach(area => {
                        dataToExport.push({
                          category: area.category,
                          score: `${area.score}%`
                        });
                      });
                    }
                  } else if (metricType === 'turnover') {
                    // Turnover data
                    dataToExport = [
                      { title: 'Turnover Rate', value: `${metricData.current}%`, change: `${((metricData.previous - metricData.current) / metricData.previous * 100).toFixed(1)}%`, industry: `${metricData.industry}%` },
                      ...metricData.breakdown.map(dept => ({
                        department: dept.department,
                        turnover_rate: `${dept.rate}%`,
                        change: dept.change
                      }))
                    ];
                  } else if (metricType === 'training') {
                    // Training data
                    dataToExport = [
                      { title: 'Training Completion Rate', value: `${metricData.current}%`, change: `${((metricData.current - metricData.previous) / metricData.previous * 100).toFixed(1)}%` },
                      ...metricData.breakdown.map(dept => ({
                        department: dept.department,
                        completion_rate: `${dept.rate}%`,
                        change: dept.change
                      }))
                    ];
                    
                    // Add training types if available
                    if (metricData.types) {
                      dataToExport.push({ title: 'Training Types', value: '' });
                      metricData.types.forEach(type => {
                        dataToExport.push({
                          training_type: type.type,
                          completion: `${type.completion}%`
                        });
                      });
                    }
                  }
                  
                  // Now use the exportData utility to create and download the file
                  await exportData(dataToExport, metricType, exportFormat);
                  
                  toast({
                    title: "Export Complete",
                    description: `Your ${getMetricTitle()} data has been exported as ${exportFormat.toUpperCase()}.`
                  });
                } catch (error) {
                  toast({
                    title: "Export Failed",
                    description: "There was an error exporting your data. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsExporting(false);
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
              ) : 'Export Data'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MetricDetailsDialog;