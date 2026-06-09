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
import { BookOpen, Plus, GraduationCap, Trophy, Trash2, UserPlus, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function LearningDev() {
  usePageTitle("/learning-dev");
  const { toast } = useToast();
  const { data: courses = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/learning-dev/courses'] });
  const { data: enrollments = [] } = useQuery<any[]>({ queryKey: ['/api/learning-dev/enrollments'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [addOpen, setAddOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', provider: '', url: '', durationHours: 0, difficulty: 'beginner' });
  const [enrollForm, setEnrollForm] = useState({ employeeId: '' });

  const addMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/learning-dev/courses', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/learning-dev/courses'] }); toast({ title: 'Course added' }); setAddOpen(false); setForm({ title: '', description: '', category: '', provider: '', url: '', durationHours: 0, difficulty: 'beginner' }); },
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/learning-dev/enrollments', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/learning-dev/enrollments'] }); toast({ title: 'Employee enrolled' }); setEnrollOpen(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/learning-dev/courses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/learning-dev/courses'] }); toast({ title: 'Course deleted' }); },
  });

  const completedCount = enrollments.filter((e: any) => e.status === 'completed').length;
  const avgProgress = enrollments.length > 0 ? Math.round(enrollments.reduce((s: number, e: any) => s + (e.progress || 0), 0) / enrollments.length) : 0;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-7 w-7 text-primary" /> Learning & Development</h1><p className="text-muted-foreground mt-1">Track certifications, courses, and skill progression</p></div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Course</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Add Learning Course</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Course Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="Technical">Technical</SelectItem><SelectItem value="Leadership">Leadership</SelectItem><SelectItem value="Compliance">Compliance</SelectItem><SelectItem value="Soft Skills">Soft Skills</SelectItem><SelectItem value="Certification">Certification</SelectItem></SelectContent></Select>
              <div className="grid grid-cols-2 gap-4"><Input placeholder="Provider" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} /><Input type="number" placeholder="Hours" value={form.durationHours || ''} onChange={e => setForm({ ...form, durationHours: parseFloat(e.target.value) || 0 })} /></div>
              <Input placeholder="Course URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select>
              <Button className="w-full" disabled={!form.title || !form.category || addMutation.isPending} onClick={() => addMutation.mutate(form)}>Add Course</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><BookOpen className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Courses</p><p className="text-2xl font-bold">{courses.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Trophy className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{completedCount}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><UserPlus className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Enrollments</p><p className="text-2xl font-bold">{enrollments.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><BarChart3 className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Avg Progress</p><p className="text-2xl font-bold">{avgProgress}%</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="courses"><TabsList><TabsTrigger value="courses">Courses</TabsTrigger><TabsTrigger value="enrollments">Enrollments</TabsTrigger></TabsList>
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c: any) => (
              <Card key={c.id}><CardContent className="pt-6">
                <div className="flex justify-between mb-2"><h3 className="font-semibold">{c.title}</h3><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                {c.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}
                <div className="flex flex-wrap gap-2 mb-3"><Badge variant="outline">{c.category}</Badge><Badge variant="secondary">{c.difficulty}</Badge>{c.provider && <Badge variant="outline">{c.provider}</Badge>}</div>
                {c.durationHours > 0 && <p className="text-sm text-muted-foreground">{c.durationHours}h</p>}
                <Button size="sm" className="mt-2" onClick={() => setEnrollOpen(c)}><UserPlus className="h-3 w-3 mr-1" /> Enroll</Button>
              </CardContent></Card>
            ))}
            {courses.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No courses yet. Add your first learning course.</CardContent></Card>}
          </div>
        </TabsContent>
        <TabsContent value="enrollments">
          <div className="space-y-3">
            {enrollments.map((e: any) => (
              <Card key={e.id}><CardContent className="pt-4 flex items-center justify-between">
                <div><p className="font-medium">{e.employeeName} — {e.courseName}</p><div className="flex items-center gap-2 mt-1"><Badge variant={e.status === 'completed' ? 'default' : 'secondary'}>{e.status}</Badge><span className="text-sm text-muted-foreground">{e.progress}% complete</span></div></div>
                <div className="w-32 bg-gray-200 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${e.progress}%` }} /></div>
              </CardContent></Card>
            ))}
            {enrollments.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No enrollments yet.</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!enrollOpen} onOpenChange={() => setEnrollOpen(null)}><DialogContent><DialogHeader><DialogTitle>Enroll in {enrollOpen?.title}</DialogTitle></DialogHeader>
        <div className="space-y-4"><Select value={enrollForm.employeeId} onValueChange={v => setEnrollForm({ employeeId: v })}><SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent></Select><Button className="w-full" disabled={!enrollForm.employeeId || enrollMutation.isPending} onClick={() => enrollMutation.mutate({ courseId: enrollOpen.id, employeeId: parseInt(enrollForm.employeeId) })}>Enroll</Button></div>
      </DialogContent></Dialog>
    </div>
  );
}
