import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the structure for departments with engagement scores
interface Department {
  id: number;
  name: string;
  headCount: number;
  budget: number;
}

interface EngagementScore extends Department {
  engagementScore: number;
}

const EmployeeInsights = () => {
  const [timeRange, setTimeRange] = useState('30');

  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: surveyResponsesData } = useQuery<{ responses: any[] }>({
    queryKey: ['/api/survey-responses'],
  });
  
  const departments: EngagementScore[] = departmentsData?.map((dept) => {
    const deptResponses = surveyResponsesData?.responses?.filter(
      (r: any) => r.departmentId === dept.id
    ) || [];
    const avgScore = deptResponses.length > 0
      ? Math.round(deptResponses.reduce((sum: number, r: any) => sum + (r.overallScore || 0), 0) / deptResponses.length)
      : 0;
    return { ...dept, engagementScore: avgScore };
  }) || [];

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Employee Insights</h3>
          <div className="z-50">
            <Select value={timeRange} onValueChange={(value) => {
                setTimeRange(value);
              }}>
              <SelectTrigger className="bg-white border border-neutral-200 text-neutral-700 text-sm rounded-md px-2 py-1 w-36">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent 
                align="end" 
                className="bg-white border rounded-md shadow-md z-[100]"
                avoidCollisions={true}
                sticky="always"
                side="bottom"
              >
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-6 pb-4">
        <div className="h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {/* Satisfaction score */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Satisfaction Score</h4>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-blue-600">
                {departments.length > 0 
                  ? `${Math.round(departments.reduce((sum, d) => sum + d.engagementScore, 0) / departments.length)}%`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Satisfaction by department */}
          <div className="mt-6 bg-white p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Satisfaction by Department</h4>
            <div className="space-y-5">
              {departments && departments.length > 0 ? (
                departments.map((department: EngagementScore, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-800">{department.name}</div>
                      <div className="text-sm font-medium text-gray-800">{department.engagementScore}%</div>
                    </div>
                    <div className={`w-full h-3 rounded-full bg-gray-100 overflow-hidden`}>
                      <div 
                        className={`h-full ${
                          department.engagementScore >= 85 
                            ? 'bg-green-500' 
                            : department.engagementScore >= 80 
                              ? 'bg-amber-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${department.engagementScore}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No department data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Top sentiment drivers */}
          <div className="mt-6 bg-white p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Top Sentiment Drivers</h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-2 rounded-md bg-green-50">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-gray-800 font-medium">Work-life balance</span>
                </div>
                <span className="text-green-600 font-medium">+12%</span>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded-md bg-green-50">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-gray-800 font-medium">Career development</span>
                </div>
                <span className="text-green-600 font-medium">+8%</span>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded-md bg-red-50">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-gray-800 font-medium">Compensation</span>
                </div>
                <span className="text-red-600 font-medium">-3%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeInsights;
