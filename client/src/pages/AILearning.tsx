import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Brain, TrendingUp, Star, MessageSquare, Zap, ThumbsUp, ThumbsDown, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function AILearning() {
  usePageTitle("/ai-learning");
  const { toast } = useToast();
  const { data: logs = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/ai-learning/logs'] });
  const { data: stats } = useQuery<any>({ queryKey: ['/api/ai-learning/stats'] });

  const feedbackMutation = useMutation({
    mutationFn: async ({ id, rating, feedback }: { id: number; rating: number; feedback: string }) => {
      const res = await apiRequest('POST', `/api/ai-learning/feedback/${id}`, { rating, feedback });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/ai-learning/logs'] }); queryClient.invalidateQueries({ queryKey: ['/api/ai-learning/stats'] }); toast({ title: 'Feedback recorded' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const trendColor = stats?.performanceTrend === 'improving' ? 'text-green-600' : stats?.performanceTrend === 'declining' ? 'text-red-600' : 'text-yellow-600';

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-7 w-7 text-primary" /> Self-Improving AI Agent</h1>
        <p className="text-muted-foreground mt-1">Continuous learning via reinforcement learning and user feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><MessageSquare className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Interactions</p><p className="text-2xl font-bold">{stats?.totalInteractions || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-yellow-100"><Star className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Avg Rating</p><p className="text-2xl font-bold">{stats?.avgRating || 0}/5</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Zap className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Improvement Rate</p><p className="text-2xl font-bold">{stats?.improvementRate || 0}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><BarChart3 className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Model Accuracy</p><p className="text-2xl font-bold">{Math.round(stats?.modelAccuracy || 0)}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><TrendingUp className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Trend</p><p className={`text-2xl font-bold capitalize ${trendColor}`}>{stats?.performanceTrend || 'stable'}</p></div></CardContent></Card>
      </div>

      {stats?.interactionsByType && Object.keys(stats.interactionsByType).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Interaction Types</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.interactionsByType as Record<string, number>).map(([type, count]) => (
                <div key={type} className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Learning History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.slice(0, 30).map((log: any) => (
              <div key={log.id} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs capitalize">{log.interactionType.replace(/_/g, ' ')}</Badge>
                      {log.improved && <Badge variant="default" className="text-xs">Improved</Badge>}
                      {log.rating && (
                        <span className="text-yellow-500 text-sm">{(() => { const r = Math.max(0, Math.min(5, Math.round((log.rating ?? 0) > 5 ? (log.rating ?? 0) / 20 : (log.rating ?? 0)))); return '★'.repeat(r) + '☆'.repeat(5 - r); })()}</span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{log.query}</p>
                    {log.response && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{log.response}</p>}
                    {log.feedback && <p className="text-sm mt-1 italic text-blue-600">Feedback: {log.feedback}</p>}
                  </div>
                  {!log.rating && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => feedbackMutation.mutate({ id: log.id, rating: 5, feedback: 'Helpful response' })}><ThumbsUp className="h-4 w-4 text-green-600" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => feedbackMutation.mutate({ id: log.id, rating: 2, feedback: 'Needs improvement' })}><ThumbsDown className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center text-muted-foreground py-8">No AI learning data yet. The AI will begin logging interactions as users engage with the assistant.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
