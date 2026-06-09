import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Smile, Frown, Meh, TrendingUp, BarChart3, RefreshCw, Users } from "lucide-react";
import { useState } from "react";

const moodIcons: Record<string, any> = { positive: Smile, negative: Frown, neutral: Meh, mixed: Meh };
const moodColors: Record<string, string> = { positive: 'text-green-500', negative: 'text-red-500', neutral: 'text-yellow-500', mixed: 'text-orange-500' };

export default function SentimentDashboard() {
  usePageTitle("/sentiment-dashboard");
  const { toast } = useToast();
  const { data: analyses = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/sentiment-dashboard'] });
  const [latestScan, setLatestScan] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest('POST', '/api/sentiment-dashboard/analyze'); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/sentiment-dashboard'] }); setLatestScan(data); toast({ title: `Org sentiment: ${data.orgScore}/100 (${data.mood})` }); },
  });

  const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((s: number, a: any) => s + a.sentimentScore, 0) / analyses.length * 10) / 10 : 0;
  const deptGroups = analyses.reduce((acc: any, a: any) => { if (a.department) { if (!acc[a.department]) acc[a.department] = []; acc[a.department].push(a); } return acc; }, {} as Record<string, any[]>);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Smile className="h-7 w-7 text-primary" /> Sentiment Dashboard</h1><p className="text-muted-foreground mt-1">Real-time organization-wide mood tracking with NLP analysis</p></div>
        <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}><RefreshCw className={`h-4 w-4 mr-2 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} /> Run Analysis</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Smile className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Org Score</p><p className="text-2xl font-bold">{avgScore}/100</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><BarChart3 className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Analyses</p><p className="text-2xl font-bold">{analyses.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Users className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Departments</p><p className="text-2xl font-bold">{Object.keys(deptGroups).length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><TrendingUp className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Positive %</p><p className="text-2xl font-bold">{analyses.length > 0 ? Math.round(analyses.filter((a: any) => a.mood === 'positive').length / analyses.length * 100) : 0}%</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(deptGroups).map(([dept, items]: [string, any]) => {
          const latest = items[0];
          const MoodIcon = moodIcons[latest.mood] || Meh;
          return (
            <Card key={dept}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{dept}</h3>
                  <MoodIcon className={`h-6 w-6 ${moodColors[latest.mood]}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Score</span><span className="font-bold">{latest.sentimentScore}/100</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${latest.sentimentScore > 70 ? 'bg-green-500' : latest.sentimentScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${latest.sentimentScore}%` }} /></div>
                  <div className="flex flex-wrap gap-1 mt-2">{((latest.keywords as any[]) || []).map((k: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{k}</Badge>)}</div>
                  {latest.details && <p className="text-xs text-muted-foreground mt-1">Trend: {(latest.details as any).trend} | vs last month: {(latest.details as any).comparedToLastMonth}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {analyses.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No sentiment data yet. Click "Run Analysis" to analyze organization-wide mood from surveys, messages, and reviews.</CardContent></Card>}
    </div>
  );
}
