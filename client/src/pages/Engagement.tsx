import usePageTitle from "@/hooks/usePageTitle";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { getApiJson } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { EngagementContext } from '@/contexts/engagement-context';
import { SurveyForm } from '@/components/engagement/SurveyForm';
import { SurveyManagement } from '@/components/engagement/SurveyManagement';
import { FeedbackAnalysis } from '@/components/engagement/FeedbackAnalysis';

const Engagement = () => {
  // State for active tab management
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for export functionality
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<string>('excel');
  const [isExporting, setIsExporting] = useState(false);

  // Sentiment data for chart
  const sentimentData = [
    { department: 'Engineering', score: 92, color: '#22c55e' },
    { department: 'Marketing', score: 88, color: '#22c55e' },
    { department: 'Sales', score: 84, color: '#22c55e' },
    { department: 'Customer Support', score: 79, color: '#f59e0b' },
    { department: 'Finance', score: 82, color: '#22c55e' },
    { department: 'HR', score: 90, color: '#22c55e' },
  ];

  // Sentiment drivers data for pie chart
  const driverData = [
    { name: 'Work-life balance', value: 35, color: '#3f51b5' },
    { name: 'Career development', value: 25, color: '#00bfa5' },
    { name: 'Compensation', value: 15, color: '#f50057' },
    { name: 'Team culture', value: 20, color: '#f59e0b' },
    { name: 'Management', value: 5, color: '#64748b' },
  ];

  return (
    <EngagementContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Employee Engagement</h1>
            <p className="mt-1 text-neutral-500">Monitor and enhance employee experience with AI-powered insights.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="inline-flex items-center">
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New survey
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <SurveyForm onSurveyCreated={() => {
                  setActiveTab('surveys');
                  queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-primary-500">87%</h3>
                <p className="text-sm text-neutral-500 mt-1">Overall satisfaction</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-success">+2%</h3>
                <p className="text-sm text-neutral-500 mt-1">vs last quarter</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-warning-500">3</h3>
                <p className="text-sm text-neutral-500 mt-1">Departments at risk</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-neutral-900">92%</h3>
                <p className="text-sm text-neutral-500 mt-1">Survey participation</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white shadow-sm mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
            <TabsTrigger value="wellness">Wellness Program</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Satisfaction by Department</h3>
                  <p className="text-sm text-neutral-500 mb-4">Overall employee satisfaction across departments.</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sentimentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="department" width={100} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Satisfaction Score']} 
                          labelFormatter={(value) => `Department: ${value}`}
                        />
                        <Bar dataKey="score" barSize={20}>
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Key Sentiment Drivers</h3>
                  <p className="text-sm text-neutral-500 mb-4">Factors affecting employee satisfaction.</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={driverData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {driverData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="surveys" className="mt-0">
            <SurveyManagement />
          </TabsContent>
          
          <TabsContent value="feedback" className="mt-0">
            <FeedbackAnalysis />
          </TabsContent>
          
          <TabsContent value="wellness" className="mt-0">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold">Wellness Program</h3>
                <p className="text-neutral-500 mt-1 mb-4">Manage employee wellness initiatives and track engagement.</p>
                <p>Wellness program content will be implemented in a future update.</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EngagementContext.Provider>
  );
};

export default Engagement;