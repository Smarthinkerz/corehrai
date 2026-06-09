import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Brain, Activity, AlertTriangle, Heart, Flame, TrendingUp, Scan } from "lucide-react";
import { useState } from "react";

export default function EmotionAI() {
  usePageTitle("/emotion-ai");
  const { toast } = useToast();
  const { data: analyses = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/emotion-ai'] });
  const { data: dashboard } = useQuery<any>({ queryKey: ['/api/emotion-ai/dashboard'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const analyzeMutation = useMutation({
    mutationFn: async (employeeId: number) => { const res = await apiRequest('POST', '/api/emotion-ai/analyze', { employeeId }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/emotion-ai'] }); queryClient.invalidateQueries({ queryKey: ['/api/emotion-ai/dashboard'] }); toast({ title: 'Analysis complete' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const analyzeAllMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest('POST', '/api/emotion-ai/analyze-all'); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/emotion-ai'] }); queryClient.invalidateQueries({ queryKey: ['/api/emotion-ai/dashboard'] }); toast({ title: `Analyzed ${data.analyzed} employees` }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const getScoreColor = (score: number, inverse?: boolean) => {
    const adjusted = inverse ? 100 - score : score;
    if (adjusted > 70) return 'text-green-600';
    if (adjusted > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBurnoutLevel = (score: number) => {
    if (score > 70) return { label: 'High Risk', color: 'destructive' };
    if (score > 50) return { label: 'Moderate', color: 'secondary' };
    if (score > 30) return { label: 'Low', color: 'default' };
    return { label: 'Minimal', color: 'outline' };
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-7 w-7 text-primary" /> Emotion AI & Behavioral Analysis</h1>
          <p className="text-muted-foreground mt-1">AI-powered burnout detection and engagement monitoring</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Employee" /></SelectTrigger>
              <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!selectedEmployee || analyzeMutation.isPending} onClick={() => analyzeMutation.mutate(parseInt(selectedEmployee))}>
              <Scan className="h-4 w-4 mr-2" /> Analyze
            </Button>
          </div>
          <Button variant="outline" onClick={() => analyzeAllMutation.mutate()} disabled={analyzeAllMutation.isPending}>
            {analyzeAllMutation.isPending ? 'Analyzing...' : 'Analyze All'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Activity className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Analyzed</p><p className="text-2xl font-bold">{dashboard?.totalAnalyzed || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-red-100"><Flame className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Avg Burnout</p><p className={`text-2xl font-bold ${getScoreColor(dashboard?.avgBurnout || 0, true)}`}>{dashboard?.avgBurnout || 0}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Avg Engagement</p><p className={`text-2xl font-bold ${getScoreColor(dashboard?.avgEngagement || 0)}`}>{dashboard?.avgEngagement || 0}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-sky-100"><Heart className="h-5 w-5 text-sky-600" /></div><div><p className="text-sm text-muted-foreground">Avg Sentiment</p><p className={`text-2xl font-bold ${getScoreColor(dashboard?.avgSentiment || 0)}`}>{dashboard?.avgSentiment || 0}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><AlertTriangle className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">High Risk</p><p className="text-2xl font-bold text-red-600">{dashboard?.highRiskCount || 0}</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {analyses.map((a: any) => {
          const emp = employees.find((e: any) => e.id === a.employeeId);
          const burnout = getBurnoutLevel(a.burnoutScore || 0);
          return (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{emp?.fullName || `Employee #${a.employeeId}`}</h3>
                    <p className="text-sm text-muted-foreground">{emp?.position} {emp?.department ? `— ${emp.department}` : ''}</p>
                  </div>
                  <Badge variant={burnout.color as any}>{burnout.label} Burnout Risk</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Burnout</p>
                    <p className={`text-2xl font-bold ${getScoreColor(a.burnoutScore || 0, true)}`}>{a.burnoutScore}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${a.burnoutScore}%` }} /></div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Engagement</p>
                    <p className={`text-2xl font-bold ${getScoreColor(a.engagementScore || 0)}`}>{a.engagementScore}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${a.engagementScore}%` }} /></div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Sentiment</p>
                    <p className={`text-2xl font-bold ${getScoreColor(a.sentimentScore || 0)}`}>{a.sentimentScore}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${a.sentimentScore}%` }} /></div>
                  </div>
                </div>
                {(a.stressIndicators as any[] || []).length > 0 && (
                  <div className="mb-3"><p className="text-sm font-medium mb-1">Stress Indicators:</p><div className="flex flex-wrap gap-2">{(a.stressIndicators as any[]).map((s: string, i: number) => <Badge key={i} variant="destructive" className="text-xs">{s}</Badge>)}</div></div>
                )}
                {(a.recommendations as any[] || []).length > 0 && (
                  <div><p className="text-sm font-medium mb-1">Recommendations:</p><ul className="text-sm text-muted-foreground space-y-1">{(a.recommendations as any[]).map((r: string, i: number) => <li key={i} className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{r}</li>)}</ul></div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {analyses.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No emotion analyses yet. Select an employee and click Analyze, or run Analyze All.</CardContent></Card>}
      </div>
    </div>
  );
}
