import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Mic, BarChart3, CheckCircle, Play, Trash2, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function InterviewCoach() {
  usePageTitle("/interview-coach");
  const { toast } = useToast();
  const { data: sessions = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/interview-coach'] });
  const [createOpen, setCreateOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [form, setForm] = useState({ jobRole: 'Software Engineer', difficulty: 'intermediate', sessionType: 'mock' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/interview-coach', data); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/interview-coach'] }); setActiveSession(data); setCurrentQ(0); setCreateOpen(false); toast({ title: 'Interview session started!' }); },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest('POST', `/api/interview-coach/${id}/answer`, data); return res.json(); },
    onSuccess: (data) => { setActiveSession(data); setAnswer(''); if (currentQ < ((data.questions as any[]) || []).length - 1) setCurrentQ(c => c + 1); },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest('POST', `/api/interview-coach/${id}/complete`, { duration: 30 }); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/interview-coach'] }); setActiveSession(data); toast({ title: 'Interview scored!' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/interview-coach/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/interview-coach'] }); toast({ title: 'Session deleted' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Mic className="h-7 w-7 text-primary" /> AI Interview Coach</h1><p className="text-muted-foreground mt-1">Practice mock interviews with AI-powered feedback and scoring</p></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Start Practice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Mock Interview</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.jobRole} onValueChange={v => setForm({ ...form, jobRole: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Software Engineer">Software Engineer</SelectItem><SelectItem value="Product Manager">Product Manager</SelectItem><SelectItem value="Designer">Designer</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select>
              <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select>
              <Button className="w-full" disabled={createMutation.isPending} onClick={() => createMutation.mutate(form)}>{createMutation.isPending ? 'Generating Questions...' : 'Start Interview'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeSession && activeSession.status === 'in_progress' && (
        <Card className="border-2 border-primary/20">
          <CardHeader><CardTitle>Question {currentQ + 1} of {((activeSession.questions as any[]) || []).length}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg"><p className="text-lg font-medium">{((activeSession.questions as any[]) || [])[currentQ]?.question}</p></div>
            <Textarea placeholder="Type your answer..." value={answer} onChange={e => setAnswer(e.target.value)} rows={4} />
            <div className="flex gap-2">
              <Button disabled={!answer || answerMutation.isPending} onClick={() => answerMutation.mutate({ id: activeSession.id, data: { questionId: currentQ + 1, answer } })}><MessageSquare className="h-4 w-4 mr-2" /> Submit Answer</Button>
              {currentQ >= ((activeSession.questions as any[]) || []).length - 1 && <Button variant="outline" onClick={() => completeMutation.mutate(activeSession.id)}><CheckCircle className="h-4 w-4 mr-2" /> Finish & Score</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      {activeSession && activeSession.status === 'completed' && activeSession.feedback && (
        <Card className="border-2 border-green-200">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Interview Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Overall</p><p className="text-3xl font-bold text-primary">{activeSession.overallScore}%</p></div>
              <div className="text-center p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Communication</p><p className="text-3xl font-bold">{activeSession.communicationScore}%</p></div>
              <div className="text-center p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Technical</p><p className="text-3xl font-bold">{activeSession.technicalScore}%</p></div>
              <div className="text-center p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Confidence</p><p className="text-3xl font-bold">{activeSession.confidenceScore}%</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg"><h4 className="font-semibold text-green-800 mb-2">Strengths</h4>{((activeSession.feedback as any).strengths || []).map((s: string, i: number) => <p key={i} className="text-sm text-green-700">+ {s}</p>)}</div>
              <div className="p-4 bg-amber-50 rounded-lg"><h4 className="font-semibold text-amber-800 mb-2">Areas to Improve</h4>{((activeSession.feedback as any).improvements || []).map((s: string, i: number) => <p key={i} className="text-sm text-amber-700">- {s}</p>)}</div>
            </div>
            <Button className="mt-4" variant="outline" onClick={() => setActiveSession(null)}>Close Results</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Mic className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Total Sessions</p><p className="text-2xl font-bold">{sessions.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{sessions.filter((s: any) => s.status === 'completed').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><BarChart3 className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Avg Score</p><p className="text-2xl font-bold">{sessions.filter((s: any) => s.overallScore).length > 0 ? Math.round(sessions.filter((s: any) => s.overallScore).reduce((a: number, s: any) => a + s.overallScore, 0) / sessions.filter((s: any) => s.overallScore).length) : 0}%</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{s.jobRole} Interview</h3>
                <div className="flex gap-1">
                  {s.status === 'completed' && <Button variant="ghost" size="sm" onClick={() => setActiveSession(s)}>View Results</Button>}
                  {s.status === 'in_progress' && <Button variant="ghost" size="sm" onClick={() => { setActiveSession(s); setCurrentQ(((s.answers as any[]) || []).length); }}><Play className="h-3 w-3 mr-1" /> Resume</Button>}
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2"><Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status}</Badge><Badge variant="outline">{s.difficulty}</Badge>{s.overallScore && <span className="text-sm font-bold text-primary">{s.overallScore}%</span>}</div>
              <p className="text-xs text-muted-foreground mt-2">{new Date(s.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
