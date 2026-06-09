import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Compass, TrendingUp, Target, Trash2, Sparkles, ArrowRight, GraduationCap } from "lucide-react";
import { useState } from "react";

const TARGET_ROLES = ['Senior Engineer', 'Engineering Manager', 'Product Manager', 'Director', 'Team Lead', 'Principal Engineer', 'VP of Engineering', 'CTO'];

export default function CareerPaths() {
  usePageTitle("/career-paths");
  const { toast } = useToast();
  const { data: paths = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/career-paths'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', targetRole: '' });

  const generateMutation = useMutation({
    mutationFn: async (data: { employeeId: number; targetRole: string }) => {
      const res = await apiRequest('POST', `/api/career-paths/generate/${data.employeeId}`, { targetRole: data.targetRole });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/career-paths'] }); toast({ title: 'Career path generated!' }); setOpen(false); setForm({ employeeId: '', targetRole: '' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/career-paths/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/career-paths'] }); toast({ title: 'Career path removed' }); }
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Compass className="h-7 w-7 text-primary" /> Career Pathing & Skill Gaps</h1>
          <p className="text-muted-foreground mt-1">AI-driven career progression recommendations and skill gap analysis</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Sparkles className="h-4 w-4 mr-2" /> Generate Path</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Career Path</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName} — {e.position}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.targetRole} onValueChange={v => setForm({ ...form, targetRole: v })}>
                <SelectTrigger><SelectValue placeholder="Target Role" /></SelectTrigger>
                <SelectContent>{TARGET_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="w-full" disabled={!form.employeeId || !form.targetRole || generateMutation.isPending} onClick={() => generateMutation.mutate({ employeeId: parseInt(form.employeeId), targetRole: form.targetRole })}>
                {generateMutation.isPending ? 'Generating...' : 'Generate Career Path'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Compass className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Active Paths</p><p className="text-2xl font-bold">{paths.filter((p: any) => p.status === 'active').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Avg Progress</p><p className="text-2xl font-bold">{paths.length > 0 ? Math.round(paths.reduce((s: number, p: any) => s + (p.progress || 0), 0) / paths.length) : 0}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><GraduationCap className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Total Skill Gaps</p><p className="text-2xl font-bold">{paths.reduce((s: number, p: any) => s + ((p.skillGaps as any[]) || []).length, 0)}</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {paths.map((path: any) => {
          const emp = employees.find((e: any) => e.id === path.employeeId);
          return (
            <Card key={path.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{emp?.fullName || `Employee #${path.employeeId}`}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{path.currentRole}</Badge>
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <Badge variant="default">{path.targetRole}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {path.estimatedTimeMonths && <span className="text-sm text-muted-foreground">{path.estimatedTimeMonths} months</span>}
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(path.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1"><span>Progress</span><span>{path.progress || 0}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${path.progress || 0}%` }} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-600">Current Skills</h4>
                    <div className="flex flex-wrap gap-1">{(path.currentSkills as any[] || []).map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs bg-green-50">{s}</Badge>)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">Skill Gaps</h4>
                    <div className="flex flex-wrap gap-1">{(path.skillGaps as any[] || []).map((s: string, i: number) => <Badge key={i} variant="destructive" className="text-xs">{s}</Badge>)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-blue-600">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">{(path.requiredSkills as any[] || []).map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                  </div>
                </div>

                {(path.milestones as any[] || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Milestones</h4>
                    <div className="space-y-2">
                      {(path.milestones as any[]).map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className={`h-3 w-3 rounded-full ${m.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium">{m.skill}</span>
                          {m.targetDate && <span className="text-muted-foreground">{new Date(m.targetDate).toLocaleDateString()}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {paths.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No career paths generated yet. Select an employee and target role to create an AI-powered career plan.</CardContent></Card>}
      </div>
    </div>
  );
}
