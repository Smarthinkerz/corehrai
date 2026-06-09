import usePageTitle from "@/hooks/usePageTitle";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Briefcase, ClipboardList, TrendingUp, BarChart3, Download } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Analytics = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery<any>({
    queryKey: ['/api/analytics/overview'],
  });

  const { data: deptStats = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/department-stats'],
  });

  const { data: hiringFunnel = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/hiring-funnel'],
  });

  const { data: activityTrends = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/activity-trends'],
  });

  const { data: taskDist } = useQuery<any>({
    queryKey: ['/api/analytics/task-distribution'],
  });

  const { data: candidateSources = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/candidate-sources'],
  });

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      overview,
      departmentStats: deptStats,
      hiringFunnel,
      activityTrends,
      taskDistribution: taskDist,
      candidateSources,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analytics Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">Comprehensive workforce analytics and trends</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Employees', value: overview?.totalEmployees, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Candidates', value: overview?.totalCandidates, icon: Briefcase, color: 'text-green-600 bg-green-100' },
          { label: 'Open Tasks', value: overview?.openTasks, icon: ClipboardList, color: 'text-amber-600 bg-amber-100' },
          { label: 'Active Jobs', value: overview?.activeJobPostings, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-100' },
          { label: 'Interviews', value: overview?.scheduledInterviews, icon: BarChart3, color: 'text-sky-600 bg-sky-100' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value ?? 0}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {activityTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-neutral-400">No activity data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Headcount</CardTitle>
          </CardHeader>
          <CardContent>
            {deptStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="employeeCount" fill="#3b82f6" name="Current" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="headcount" fill="#e5e7eb" name="Target" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-neutral-400">No department data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hiring Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {hiringFunnel.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hiringFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-neutral-400">No hiring data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-2 text-center">By Status</p>
                {taskDist?.byStatus?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={taskDist.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={false}>
                        {taskDist.byStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-neutral-400 text-xs">No data</div>
                )}
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {taskDist?.byStatus?.map((item: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: COLORS[i % COLORS.length] }}>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-2 text-center">By Priority</p>
                {taskDist?.byPriority?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={taskDist.byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={false}>
                        {taskDist.byPriority.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-neutral-400 text-xs">No data</div>
                )}
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {taskDist?.byPriority?.map((item: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: COLORS[(i + 3) % COLORS.length] }}>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Candidate Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {candidateSources.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="40%" height={200}>
                  <PieChart>
                    <Pie data={candidateSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {candidateSources.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {candidateSources.map((source: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-neutral-700">{source.name}</span>
                      <span className="text-sm font-medium ml-auto">{source.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-neutral-400">No candidate source data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
