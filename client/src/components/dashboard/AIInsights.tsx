import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Metric {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
}

interface InsightItem {
  id: string;
  title: string;
  description: string;
  category: 'recruitment' | 'performance' | 'engagement' | 'retention' | 'compliance';
  priority: 'low' | 'medium' | 'high';
  actionItems?: string[];
  metrics?: Metric[];
  type?: 'warning' | 'info' | 'success'; // For backward compatibility
}

interface InsightsResponse {
  insights: InsightItem[];
  updated: string;
}

const timeFrames = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Q3 2023', value: 'quarter' }
];

const AIInsights: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('week');
  const queryClient = useQueryClient();
  
  // Function to handle timeframe changes
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value);
    // Immediately invalidate and refetch data
    queryClient.invalidateQueries({ queryKey: ['/api/insights', value] });
  };
  
  const { data, isLoading, error } = useQuery<InsightsResponse>({
    queryKey: ['/api/insights', timeFrame],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async ({ queryKey }) => {
      const [path, tf] = queryKey;
      const response = await fetch(`${path}?timeFrame=${tf}`);
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      return response.json();
    }
  });

  const refreshInsights = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/insights', timeFrame] });
  };

  const insights: InsightItem[] = useMemo(() => {
    if (data?.insights && Array.isArray(data.insights)) {
      return data.insights;
    }
    
    // If no data yet, return empty array
    return [];
  }, [data]);

  // Get background color based on insight category
  const getCategoryBackgroundColor = (category?: string) => {
    if (!category) return 'bg-gray-100';
    
    switch (category) {
      case 'recruitment':
        return 'bg-blue-100';
      case 'performance':
        return 'bg-green-100';
      case 'engagement':
        return 'bg-indigo-100';
      case 'retention':
        return 'bg-amber-100';
      case 'compliance':
        return 'bg-red-100';
      default:
        return 'bg-indigo-100';
    }
  };

  // Get icon based on insight category or legacy type
  const getInsightIcon = (insight: InsightItem) => {
    // First check for category
    if (insight && insight.category) {
      switch (insight.category) {
        case 'recruitment':
          return (
            <svg className="h-7 w-7 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          );
        case 'performance':
          return (
            <svg className="h-7 w-7 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          );
        case 'engagement':
          return (
            <svg className="h-7 w-7 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'retention':
          return (
            <svg className="h-7 w-7 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          );
        case 'compliance':
          return (
            <svg className="h-7 w-7 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
        default:
          return (
            <svg className="h-7 w-7 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
    }
    
    // Legacy type support
    switch (insight.type) {
      case 'warning':
        return (
          <svg className="h-6 w-6 text-warning" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-6 w-6 text-info" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-6 w-6 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-info" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  // Get badge background color based on priority
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  // Get trend icon for metrics
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="mb-8 rounded-lg shadow-xl overflow-hidden border-2 border-primary-400">
        <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between bg-white">
          <div className="flex items-center">
            <div className="flex items-center justify-center flex-shrink-0 h-14 w-14 rounded-full bg-primary-600 shadow animate-pulse">
              <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="ml-5">
              <h2 className="text-3xl font-bold text-primary-700">Loading AI Insights...</h2>
              <p className="text-xl text-gray-600 font-medium">Analyzing HR data and trends</p>
            </div>
          </div>
        </div>
        <div className="bg-white px-6 py-6 sm:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-neutral-200 rounded-md"></div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-60 bg-neutral-100 rounded-lg border-2 border-neutral-200"></div>
              <div className="h-60 bg-neutral-100 rounded-lg border-2 border-neutral-200"></div>
              <div className="h-60 bg-neutral-100 rounded-lg border-2 border-neutral-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="mb-8 rounded-lg shadow-xl overflow-hidden border-2 border-red-400">
        <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between bg-white">
          <div className="flex items-center">
            <div className="flex items-center justify-center flex-shrink-0 h-14 w-14 rounded-full bg-red-600 shadow">
              <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <h2 className="text-3xl font-bold text-red-700">Unable to Load AI Insights</h2>
              <p className="text-xl text-gray-600 font-medium">There was an error retrieving the latest insights</p>
            </div>
          </div>
          <div className="mt-5 md:mt-0">
            <button 
              type="button" 
              className="px-5 py-2.5 text-lg bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-medium shadow-sm"
              onClick={refreshInsights}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-lg shadow-xl overflow-hidden border-2 border-primary-400">
      <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between bg-white">
        <div className="flex items-center">
          <div className="flex items-center justify-center flex-shrink-0 h-14 w-14 rounded-full bg-primary-600 shadow">
            <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="ml-5">
            <h2 className="text-3xl font-bold text-primary-700">AI-Powered Insights</h2>
            <p className="text-xl text-gray-600 font-medium">Based on the latest HR analytics and workforce trends</p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 flex space-x-3">
          <button 
            type="button" 
            className="px-5 py-2.5 text-lg bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium shadow-sm"
            onClick={refreshInsights}
          >
            <svg className="inline-block w-6 h-6 mr-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button type="button" className="px-5 py-2.5 text-lg bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium shadow-sm">
            View all
          </button>
        </div>
      </div>
      
      <div className="bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-5">
          <h3 className="font-semibold text-2xl text-neutral-700 mb-3 md:mb-0">Key Insights</h3>
          <Tabs value={timeFrame} className="w-auto" onValueChange={handleTimeFrameChange}>
            <TabsList className="bg-neutral-100">
              {timeFrames.map((frame) => (
                <TabsTrigger 
                  key={frame.value} 
                  value={frame.value}
                  className="data-[state=active]:bg-white text-lg"
                >
                  {frame.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className="flex flex-col p-5 rounded-lg border-2 border-neutral-300 bg-white shadow hover:shadow-lg transition-shadow duration-200 h-full">
                <div className="flex items-start w-full mb-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-12 w-12 flex items-center justify-center rounded-full shadow-md ${getCategoryBackgroundColor(insight.category)}`}>
                      {getInsightIcon(insight)}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <h3 className="text-xl font-bold text-black" title={insight.title}>{insight.title}</h3>
                      {insight.priority && (
                        <span className={`text-base px-3 py-1 rounded-full flex-shrink-0 font-semibold ${getPriorityBadgeClass(insight.priority)}`}>
                          {insight.priority}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-32 custom-scrollbar overflow-y-auto pr-1">
                      <p className="text-xl text-neutral-800 break-words leading-relaxed" title={insight.description}>{insight.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  {/* Display metrics if available */}
                  {insight.metrics && insight.metrics.length > 0 && (
                    <div className="mt-4 custom-scrollbar overflow-y-auto max-h-40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                        {insight.metrics.map((metric, metricIndex) => (
                          <div key={metricIndex} className="p-2.5 bg-neutral-50 rounded-md border border-neutral-200 flex flex-wrap items-center">
                            <div className="flex items-center flex-wrap w-full">
                              <span className="font-semibold text-base text-black mr-2">{metric.name}:</span>
                              <div className="flex items-center ml-auto">
                                <span className="text-base text-neutral-800 font-medium" title={`${metric.value}`}>
                                  {typeof metric.value === 'string' && metric.value.length > 15 ? 
                                    `${metric.value.substring(0, 12)}...` : 
                                    metric.value}
                                </span>
                                {metric.trend && (
                                  <span className="ml-2 flex-shrink-0">{getTrendIcon(metric.trend)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Display action items if available */}
                {insight.actionItems && insight.actionItems.length > 0 && (
                  <div className="mt-auto pt-4 bg-neutral-50 p-4 rounded-md border border-neutral-300 shadow-sm h-[120px] flex flex-col mt-4">
                    <p className="text-base font-semibold text-black mb-2">Action Items:</p>
                    <div className="custom-scrollbar overflow-y-auto h-20 flex-1 pr-1">
                      <ul className="text-base text-neutral-900 list-disc pl-5 space-y-1.5">
                        {insight.actionItems.map((item, itemIndex) => (
                          <li key={itemIndex} title={item} className="break-words">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Empty state if no insights available
            <div className="col-span-3 flex justify-center py-6 text-neutral-500 text-xl">
              No AI insights available for this time period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsights;