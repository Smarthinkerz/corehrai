import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarCheck, Plus, CheckCircle, AlertTriangle, Trash2, Clock, Users } from "lucide-react";
import { useState } from "react";

export default function MeetingTracker() {
  usePageTitle("/meeting-tracker");
  const { toast } = useToast();
  const { data: meetings = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/meeting-tracker'] });
  const { data: overdue = [] } = useQuery<any[]>({ queryKey: ['/api/meeting-tracker/overdue'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [addOpen, setAddOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState<any>(null);
  const [form, setForm] = useState({ managerId: '', reportId: '', scheduledAt: '', duration: 30, agenda: '' });
  const [completeForm, setCompleteForm] = useState({ notes: '', mood: 'neutral', actionItems: '' });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const agenda = data.agenda ? data.agenda.split('\n').filter((a: string) => a.trim()).map((a: string) => ({ topic: a.trim() })) : [];
      const res = await apiRequest('POST', '/api/meeting-tracker', { managerId: parseInt(data.managerId), reportId: parseInt(data.reportId), scheduledAt: new Date(data.scheduledAt), duration: data.duration, agenda });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/meeting-tracker'] }); toast({ title: '1:1 scheduled' }); setAddOpen(false); setForm({ managerId: '', reportId: '', scheduledAt: '', duration: 30, agenda: '' }); },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const actionItems = data.actionItems ? data.actionItems.split('\n').filter((a: string) => a.trim()).map((a: string) => ({ item: a.trim(), done: false })) : [];
      const res = await apiRequest('POST', `/api/meeting-tracker/${id}/complete`, { notes: data.notes, mood: data.mood, actionItems });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/meeting-tracker'] }); queryClient.invalidateQueries({ queryKey: ['/api/meeting-tracker/overdue'] }); toast({ title: 'Meeting completed with AI summary' }); setCompleteOpen(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/meeting-tracker/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/meeting-tracker'] }); toast({ title: 'Meeting deleted' }); },
  });

  const moodEmojis: Record<string, string> = { positive: '😊', neutral: '😐', negative: '😟', concerned: '😰' };
  const scheduled = meetings.filter((m: any) => m.status === 'scheduled');
  const completed = meetings.filter((m: any) => m.status === 'completed');

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><CalendarCheck className="h-7 w-7 text-primary" /> Meeting & 1:1 Tracker</h1><p className="text-muted-foreground mt-1">Track 1:1s, generate AI summaries, flag overdue check-ins</p></div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Schedule 1:1</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Schedule 1:1 Meeting</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.managerId} onValueChange={v => setForm({ ...form, managerId: v })}><SelectTrigger><SelectValue placeholder="Manager" /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName} (Manager)</SelectItem>)}</SelectContent></Select>
              <Select value={form.reportId} onValueChange={v => setForm({ ...form, reportId: v })}><SelectTrigger><SelectValue placeholder="Direct Report" /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent></Select>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
              <Input type="number" placeholder="Duration (min)" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} />
              <Textarea placeholder="Agenda items (one per line)" value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} />
              <Button className="w-full" disabled={!form.managerId || !form.reportId || !form.scheduledAt || addMutation.isPending} onClick={() => addMutation.mutate(form)}>Schedule Meeting</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><CalendarCheck className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Upcoming</p><p className="text-2xl font-bold">{scheduled.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{completed.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold">{overdue.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Users className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{meetings.length}</p></div></CardContent></Card>
      </div>

      {overdue.length > 0 && <Card className="border-red-200"><CardHeader><CardTitle className="text-lg text-red-700 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Overdue 1:1s</CardTitle></CardHeader><CardContent><div className="space-y-2">{overdue.map((o: any, i: number) => <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-red-100"><div><p className="font-medium">{o.managerName} → {o.reportName}</p><p className="text-sm text-muted-foreground">{o.daysSince ? `${o.daysSince} days since last meeting` : 'No meetings recorded'}</p></div><Button size="sm" onClick={() => { setForm({ managerId: String(o.managerId), reportId: String(o.reportId), scheduledAt: '', duration: 30, agenda: '' }); setAddOpen(true); }}>Schedule Now</Button></div>)}</div></CardContent></Card>}

      <Tabs defaultValue="upcoming"><TabsList><TabsTrigger value="upcoming">Upcoming ({scheduled.length})</TabsTrigger><TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger></TabsList>
        <TabsContent value="upcoming">
          <div className="space-y-3">{scheduled.map((m: any) => (
            <Card key={m.id}><CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{m.managerName} ↔ {m.reportName}</p>
                <p className="text-sm text-muted-foreground">{new Date(m.scheduledAt).toLocaleString()} — {m.duration} min</p>
                {(m.agenda as any[])?.length > 0 && <div className="flex gap-1 mt-1">{(m.agenda as any[]).map((a: any, i: number) => <Badge key={i} variant="outline" className="text-xs">{a.topic || a}</Badge>)}</div>}
              </div>
              <div className="flex gap-2"><Button size="sm" onClick={() => setCompleteOpen(m)}><CheckCircle className="h-3 w-3 mr-1" /> Complete</Button><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            </CardContent></Card>
          ))}{scheduled.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No upcoming meetings</CardContent></Card>}</div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="space-y-3">{completed.map((m: any) => (
            <Card key={m.id}><CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2"><p className="font-medium">{m.managerName} ↔ {m.reportName} {m.mood && <span className="ml-2">{moodEmojis[m.mood] || ''}</span>}</p><span className="text-sm text-muted-foreground">{new Date(m.completedAt || m.scheduledAt).toLocaleDateString()}</span></div>
              {m.aiSummary && <div className="bg-muted p-3 rounded-lg mb-2"><p className="text-sm font-medium mb-1">AI Summary</p><p className="text-sm">{m.aiSummary}</p></div>}
              {m.notes && <p className="text-sm text-muted-foreground">{m.notes}</p>}
              {(m.actionItems as any[])?.length > 0 && <div className="mt-2">{(m.actionItems as any[]).map((a: any, i: number) => <p key={i} className="text-sm">☐ {a.item || a}</p>)}</div>}
            </CardContent></Card>
          ))}</div>
        </TabsContent>
      </Tabs>

      {completeOpen && <Dialog open={!!completeOpen} onOpenChange={() => setCompleteOpen(null)}><DialogContent><DialogHeader><DialogTitle>Complete 1:1: {completeOpen.managerName} ↔ {completeOpen.reportName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Textarea placeholder="Meeting notes..." value={completeForm.notes} onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })} rows={4} />
          <Select value={completeForm.mood} onValueChange={v => setCompleteForm({ ...completeForm, mood: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="positive">😊 Positive</SelectItem><SelectItem value="neutral">😐 Neutral</SelectItem><SelectItem value="negative">😟 Negative</SelectItem><SelectItem value="concerned">😰 Concerned</SelectItem></SelectContent></Select>
          <Textarea placeholder="Action items (one per line)" value={completeForm.actionItems} onChange={e => setCompleteForm({ ...completeForm, actionItems: e.target.value })} rows={3} />
          <Button className="w-full" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate({ id: completeOpen.id, data: completeForm })}>{completeMutation.isPending ? 'Completing...' : 'Complete & Generate AI Summary'}</Button>
        </div>
      </DialogContent></Dialog>}
    </div>
  );
}
