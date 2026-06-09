import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Plus, Trash2, Wand2, ArrowLeftRight, Calendar } from "lucide-react";
import { useState } from "react";

const SHIFT_TYPES = [{ value: 'morning', label: 'Morning (6AM-2PM)' }, { value: 'afternoon', label: 'Afternoon (2PM-10PM)' }, { value: 'evening', label: 'Evening (10PM-6AM)' }, { value: 'regular', label: 'Regular (9AM-5PM)' }, { value: 'flexible', label: 'Flexible' }];

export default function ShiftManagement() {
  usePageTitle("/shift-management");
  const { toast } = useToast();
  const { data: allShifts = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/shift-management'] });
  const { data: swapRequests = [] } = useQuery<any[]>({ queryKey: ['/api/shift-management/swap-requests'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', shiftDate: '', startTime: '09:00', endTime: '17:00', shiftType: 'regular', department: '' });
  const [autoForm, setAutoForm] = useState({ date: '', department: '' });

  const addMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/shift-management', { ...data, employeeId: parseInt(data.employeeId) }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/shift-management'] }); toast({ title: 'Shift added' }); setAddOpen(false); },
  });

  const autoMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/shift-management/auto-schedule', data); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/shift-management'] }); toast({ title: `Auto-scheduled ${data.scheduled} shifts` }); setAutoOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/shift-management/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/shift-management'] }); toast({ title: 'Shift removed' }); },
  });

  const approveSwapMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => { const res = await apiRequest('PUT', `/api/shift-management/swap-requests/${id}`, { status, respondedAt: new Date() }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/shift-management/swap-requests'] }); toast({ title: 'Swap request updated' }); },
  });

  const shiftsByDate = allShifts.reduce((acc: any, s: any) => { if (!acc[s.shiftDate]) acc[s.shiftDate] = []; acc[s.shiftDate].push(s); return acc; }, {} as Record<string, any[]>);
  const typeColors: Record<string, string> = { morning: 'bg-yellow-100 text-yellow-700', afternoon: 'bg-blue-100 text-blue-700', evening: 'bg-purple-100 text-purple-700', regular: 'bg-green-100 text-green-700', flexible: 'bg-gray-100 text-gray-700' };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-7 w-7 text-primary" /> Shift & Schedule Management</h1><p className="text-muted-foreground mt-1">Visual scheduling with AI-optimized shift assignments</p></div>
        <div className="flex gap-2">
          <Dialog open={autoOpen} onOpenChange={setAutoOpen}><DialogTrigger asChild><Button variant="outline"><Wand2 className="h-4 w-4 mr-2" /> Auto-Schedule</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>AI Auto-Schedule</DialogTitle></DialogHeader>
              <div className="space-y-4"><Input type="date" value={autoForm.date} onChange={e => setAutoForm({ ...autoForm, date: e.target.value })} /><Input placeholder="Department (optional)" value={autoForm.department} onChange={e => setAutoForm({ ...autoForm, department: e.target.value })} /><Button className="w-full" disabled={!autoForm.date || autoMutation.isPending} onClick={() => autoMutation.mutate(autoForm)}>{autoMutation.isPending ? 'Scheduling...' : 'Auto-Schedule Shifts'}</Button></div>
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Shift</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add Shift</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent></Select>
                <Input type="date" value={form.shiftDate} onChange={e => setForm({ ...form, shiftDate: e.target.value })} />
                <div className="grid grid-cols-2 gap-4"><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
                <Select value={form.shiftType} onValueChange={v => setForm({ ...form, shiftType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SHIFT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
                <Button className="w-full" disabled={!form.employeeId || !form.shiftDate || addMutation.isPending} onClick={() => addMutation.mutate(form)}>Add Shift</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="schedule"><TabsList><TabsTrigger value="schedule">Schedule</TabsTrigger><TabsTrigger value="swaps">Swap Requests ({swapRequests.length})</TabsTrigger></TabsList>
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Calendar className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total Shifts</p><p className="text-2xl font-bold">{allShifts.length}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Clock className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Scheduled Days</p><p className="text-2xl font-bold">{Object.keys(shiftsByDate).length}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><ArrowLeftRight className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Pending Swaps</p><p className="text-2xl font-bold">{swapRequests.filter((r: any) => r.status === 'pending').length}</p></div></CardContent></Card>
          </div>
          {Object.entries(shiftsByDate).sort().map(([date, shifts]: [string, any]) => (
            <Card key={date} className="mb-4"><CardHeader className="pb-2"><CardTitle className="text-lg">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle></CardHeader>
              <CardContent><div className="space-y-2">{shifts.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3"><Badge className={typeColors[s.shiftType] || ''}>{s.shiftType}</Badge><span className="font-medium">{s.employeeName}</span><span className="text-sm text-muted-foreground">{s.startTime} — {s.endTime}</span></div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}</div></CardContent>
            </Card>
          ))}
          {allShifts.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No shifts scheduled. Add manually or use AI auto-scheduler.</CardContent></Card>}
        </TabsContent>
        <TabsContent value="swaps">
          <div className="space-y-3">{swapRequests.map((r: any) => (
            <Card key={r.id}><CardContent className="pt-4 flex items-center justify-between">
              <div><p className="font-medium">{r.requesterName} wants to swap</p><p className="text-sm text-muted-foreground">{r.reason || 'No reason given'}</p><Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'outline'}>{r.status}</Badge></div>
              {r.status === 'pending' && <div className="flex gap-2"><Button size="sm" onClick={() => approveSwapMutation.mutate({ id: r.id, status: 'approved' })}>Approve</Button><Button size="sm" variant="outline" onClick={() => approveSwapMutation.mutate({ id: r.id, status: 'denied' })}>Deny</Button></div>}
            </CardContent></Card>
          ))}{swapRequests.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No swap requests</CardContent></Card>}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
