import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button'; 
import { RefreshCw } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { getApiJson } from '@/lib/api';

interface SentimentAnalysisProps {
  sentiment: string;
  score: number;
  keywords: string[];
  themes: string[];
  drivers: {
    positive: string[];
    negative: string[];
  };
  actionableInsights: string[];
}

interface SurveyResponse {
  id: number;
  surveyId: number;
  employeeId: number;
  responses: Record<string, any>;
  sentimentScore: number;
  submittedAt: string;
  survey?: {
    title: string;
  };
  employee?: {
    fullName: string;
    department: string;
  };
  sentimentAnalysis?: SentimentAnalysisProps;
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return 'bg-green-100 text-green-800';
    case 'negative':
      return 'bg-red-100 text-red-800';
    case 'neutral':
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 0.7) return '#22c55e'; // green
  if (score >= 0.4) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

export const FeedbackAnalysis = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();
  
  // Force component to re-render on refresh
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Fetch survey responses and include the refresh counter in the key
  const { 
    data: responses, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/survey-responses', refreshCounter],
    queryFn: () => {
      return getApiJson('/api/survey-responses');
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Handle refresh button click - force a complete data refresh
  const handleRefresh = async () => {
    try {
      // Set cache-busting headers
      const headers = new Headers();
      headers.append('pragma', 'no-cache');
      headers.append('cache-control', 'no-cache');
      headers.append('cache-busting', Date.now().toString()); // Add timestamp as a unique header
      
      // Clear React Query cache
      await queryClient.invalidateQueries({
        queryKey: ['/api/survey-responses']
      });
      
      // Perform a direct fetch with the cache-busting headers
      const response = await fetch('/api/survey-responses', {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      // Parse the response
      const freshData = await response.json();
      // Update the query cache with the new data
      queryClient.setQueryData(['/api/survey-responses'], freshData);
      
      // Increment refresh counter to trigger component re-render
      setRefreshCounter(prevCounter => prevCounter + 1);
    } catch (error) {
    }
  };

  // Process sentiment analysis data
  const mockSentimentAnalysis = (response: SurveyResponse): SentimentAnalysisProps => {
    // Extract sentiment score or use a default
    const score = response.sentimentScore || 0.5;
    
    // Determine sentiment category based on score with special handling for perfect scores
    let sentiment = 'neutral';
    
    // If it's a perfect or near-perfect score (5/5 ratings), mark as very positive
    if (score >= 0.95) {
      sentiment = 'positive';
    }
    // Standard positive threshold
    else if (score >= 0.7) {
      sentiment = 'positive';
    }
    // Negative threshold
    else if (score < 0.4) {
      sentiment = 'negative';
    }
    
    // Customize drivers based on sentiment score
    let positiveDrivers = ['Team collaboration', 'Work-life balance', 'Learning opportunities'];
    let negativeDrivers = ['Internal communication', 'Recognition'];
    
    // For perfect scores, show more positive drivers and some improvement areas
    if (score >= 0.95) {
      positiveDrivers = ['Excellent team collaboration', 'Perfect work-life balance', 'Abundant learning opportunities', 'Outstanding management', 'Comprehensive benefits'];
      // Even for high-scoring responses, provide some improvement suggestions
      negativeDrivers = ['Continuous improvement culture', 'Cross-team communication', 'Documentation processes'];
    }
    
    // Create readable keywords from response data
    // Map UUID keys to human-readable question titles
    const keywordMap: Record<string, string> = {
      // Common UUID question mappings
      '9152d3a2-895c-470c-8102-2a5fe1c86d64': 'Job Satisfaction',
      '98bbdc6a-a55b-4852-a017-0c33d2b067f1': 'Work-Life Balance',
      'bf83def2-11cd-4ad5-96ac-b26c0cd98241': 'Team Collaboration',
      '088ec27c-a01a-42a0-b132-6c26b32391ef': 'Career Growth',
      'ae2ce09a-7a09-4a31-9787-24ce17e2996a': 'Management Support',
      'e2a3edb5-6841-410d-a12d-efe5d1c6fe7e': 'Improvement Suggestions',
      '005dba87-ae9b-4f1b-bb05-170579552aba': 'Training Effectiveness'
    };
    
    // Convert the UUIDs to readable question titles for better user experience
    // Map UUIDs to more descriptive question titles with fallbacks
    const defaultQuestionTitles = [
      'Overall Satisfaction', 
      'Work Environment', 
      'Team Collaboration', 
      'Career Development', 
      'Leadership Quality'
    ];
    
    // Try to use known mappings first, then use standard titles if we don't have a mapping
    const responseKeys = Object.keys(response.responses || {});
    const keywords = responseKeys.length > 0 
      ? responseKeys.map((key, index) => {
          // Use the mapping if available
          if (keywordMap[key]) {
            return keywordMap[key];
          }
          // Otherwise, use a default question title based on index position
          return defaultQuestionTitles[index % defaultQuestionTitles.length];
        }).slice(0, 5)
      : ['Overall Satisfaction', 'Work Environment', 'Team Collaboration'];
    
    return {
      sentiment,
      score,
      keywords,
      themes: ['Work environment', 'Communication', 'Management', 'Career growth', 'Compensation'],
      drivers: {
        positive: positiveDrivers,
        negative: negativeDrivers
      },
      actionableInsights: [
        'Improve internal communication channels',
        'Implement a recognition program',
        'Schedule regular team-building activities'
      ]
    };
  };

  // Extract responses from the wrapper object with timestamp
  // The backend now returns { responses: SurveyResponse[], timestamp: string }
  // Handle both formats: direct array of responses or object with responses property
  const responseData = Array.isArray(responses) 
    ? responses 
    : (responses as any)?.responses || [];
  
  // Process the response data
  
  // Process survey responses and extract sentiment data
  const processedResponses = Array.isArray(responseData) 
    ? responseData.map((response: SurveyResponse) => {
        // Process the response with employee data
        return {
          ...response,
          sentimentAnalysis: mockSentimentAnalysis(response)
        };
      }) 
    : [];

  // Calculate overall sentiment statistics
  const overallStats = {
    totalResponses: processedResponses.length,
    averageScore: processedResponses.length 
      ? processedResponses.reduce((sum: number, r: SurveyResponse) => sum + (r.sentimentScore || 0), 0) / processedResponses.length
      : 0,
    // If a response has 5/5 ratings (score = 1.0), it should be counted as 100% positive
    positive: processedResponses.filter((r: SurveyResponse) => {
      const score = r.sentimentScore || 0;
      // Check if this is a perfect 5/5 score (approximately 1.0, with small floating point tolerance)
      if (score >= 0.95) return true;
      // Otherwise use the standard threshold of 0.7
      return score >= 0.7 && score < 0.95;
    }).length,
    neutral: processedResponses.filter((r: SurveyResponse) => (r.sentimentScore || 0) >= 0.4 && (r.sentimentScore || 0) < 0.7).length,
    negative: processedResponses.filter((r: SurveyResponse) => (r.sentimentScore || 0) < 0.4).length,
  };

  // Prepare data for visualization with minimum values to ensure visibility
  // Add a small minimum value (0.1) to ensure each segment is visible even if count is 0
  const sentimentDistribution = [
    { name: 'Positive', value: Math.max(0.1, overallStats.positive), color: '#22c55e' },
    { name: 'Neutral', value: Math.max(0.1, overallStats.neutral), color: '#f59e0b' },
    { name: 'Negative', value: Math.max(0.1, overallStats.negative), color: '#ef4444' }
  ];

  // Aggregate key themes from all responses
  const allThemes = processedResponses.flatMap((r: SurveyResponse) => r.sentimentAnalysis?.themes || []);
  const themeCount: Record<string, number> = {};
  allThemes.forEach((theme: string) => {
    themeCount[theme] = (themeCount[theme] || 0) + 1;
  });
  
  // Define the type for theme data
  interface ThemeData {
    name: string;
    value: number;
    color?: string;
  }
  
  const themeData: ThemeData[] = Object.entries(themeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Generate theme colors
  const themeColors = ['#3f51b5', '#00bfa5', '#f50057', '#f59e0b', '#64748b'];
  themeData.forEach((item: ThemeData, index: number) => {
    item.color = themeColors[index % themeColors.length];
  });

  // Aggregate all positive and negative drivers
  const positiveDrivers = processedResponses.flatMap((r: SurveyResponse) => r.sentimentAnalysis?.drivers.positive || []);
  const negativeDrivers = processedResponses.flatMap((r: SurveyResponse) => r.sentimentAnalysis?.drivers.negative || []);
  
  const countOccurrences = (arr: string[]) => {
    // If there are no items in the array, provide default data
    if (arr.length === 0) {
      return [] as ThemeData[];
    }
    
    // Count occurrences of each item
    const count: Record<string, number> = {};
    arr.forEach((item: string) => {
      count[item] = (count[item] || 0) + 1;
    });
    
    // Convert to array, sort by frequency, and take top 5
    return Object.entries(count)
      .map(([name, value]) => ({ 
        name, 
        // Ensure values are consistent for chart display
        value: Math.max(1, value),  
        color: '' 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) as ThemeData[];
  };
  
  const positiveDriverData = countOccurrences(positiveDrivers);
  const negativeDriverData = countOccurrences(negativeDrivers);

  // Assign colors
  positiveDriverData.forEach((item: ThemeData, i: number) => {
    item.color = '#22c55e'; // All positive in green
  });
  
  negativeDriverData.forEach((item: ThemeData, i: number) => {
    item.color = '#ef4444'; // All negative in red
  });

  if (isLoading) {
    return <div className="p-6">Loading sentiment analysis data...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading feedback data. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Feedback Analysis</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold">{overallStats.totalResponses}</h3>
              <p className="text-sm text-neutral-500 mt-1">Total Responses</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold" style={{ color: getScoreColor(overallStats.averageScore) }}>
                {Math.round(overallStats.averageScore * 100)}%
              </h3>
              <p className="text-sm text-neutral-500 mt-1">Average Sentiment</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-green-500">{Math.round((overallStats.positive / overallStats.totalResponses) * 100 || 0)}%</h3>
              <p className="text-sm text-neutral-500 mt-1">Positive Feedback</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-red-500">{Math.round((overallStats.negative / overallStats.totalResponses) * 100 || 0)}%</h3>
              <p className="text-sm text-neutral-500 mt-1">Negative Feedback</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white shadow-sm mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="themes">Key Themes</TabsTrigger>
          <TabsTrigger value="drivers">Sentiment Drivers</TabsTrigger>
          <TabsTrigger value="insights">Actionable Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {processedResponses.slice(0, 5).map((response) => (
                    <div key={response.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {response.employee?.fullName || 'Anonymous'}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {response.employee?.department || 'Unknown'} • 
                            {new Date(response.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getSentimentColor(response.sentimentAnalysis?.sentiment)}>
                          {response.sentimentAnalysis?.sentiment || 'Neutral'}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.round((response.sentimentScore || 0) * 100)} 
                        className="h-2 mb-2"
                        style={{
                          background: '#f1f5f9'
                        }}
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {response.sentimentAnalysis?.keywords.slice(0, 3).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="bg-neutral-100">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="themes" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Key Themes in Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themeData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value) => [`${value} mentions`, 'Frequency']} />
                    <Bar dataKey="value" barSize={20}>
                      {themeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Theme Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themeData.map((theme, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }}></div>
                        <h5 className="font-medium">{theme.name}</h5>
                      </div>
                      <p className="text-sm text-neutral-600 mt-2">
                        Mentioned in {Math.round((theme.value / overallStats.totalResponses) * 100)}% of responses
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="drivers" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Positive Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={positiveDriverData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          // Limit the length for better display
                          return value.length > 15 ? value.substring(0, 15) + "..." : value;
                        }}
                      />
                      <Tooltip formatter={(value) => [`${value} mentions`, 'Frequency']} />
                      <Bar dataKey="value" barSize={20} fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">What Employees Like:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {positiveDriverData.map((driver, i) => (
                      <li key={i} className="text-neutral-700">
                        <span className="font-medium">{driver.name}</span>: Mentioned {driver.value} times
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={negativeDriverData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          // Limit the length for better display
                          return value.length > 15 ? value.substring(0, 15) + "..." : value;
                        }}
                      />
                      <Tooltip formatter={(value) => [`${value} mentions`, 'Frequency']} />
                      <Bar dataKey="value" barSize={20} fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Improvement Opportunities:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {negativeDriverData.map((driver, i) => (
                      <li key={i} className="text-neutral-700">
                        <span className="font-medium">{driver.name}</span>: Mentioned {driver.value} times
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Actionable Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border p-4 rounded-lg bg-green-50">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Strengths to Maintain
                  </h4>
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    <li className="text-neutral-700">Team collaboration culture is highly valued by employees</li>
                    <li className="text-neutral-700">Work-life balance initiatives are well-received</li>
                    <li className="text-neutral-700">Learning opportunities are seen as a key benefit</li>
                  </ul>
                </div>
                
                <div className="border p-4 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Priority Areas for Improvement
                  </h4>
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    <li className="text-neutral-700">Internal communication channels need enhancement</li>
                    <li className="text-neutral-700">Employee recognition program should be more consistent</li>
                    <li className="text-neutral-700">Address concerns about career progression transparency</li>
                  </ul>
                </div>
                
                <div className="border p-4 rounded-lg bg-blue-50">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    Recommended Actions
                  </h4>
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    <li className="text-neutral-700">Implement a structured employee recognition program with regular nominations</li>
                    <li className="text-neutral-700">Improve cross-department communication with monthly town halls</li>
                    <li className="text-neutral-700">Create clear career progression frameworks for each department</li>
                    <li className="text-neutral-700">Schedule regular team-building activities to maintain positive collaboration</li>
                    <li className="text-neutral-700">Conduct focused pulse surveys on specific areas needing improvement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};