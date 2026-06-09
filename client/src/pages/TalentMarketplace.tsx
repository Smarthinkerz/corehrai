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
import { Plus, Briefcase, Users, Target, Trash2, Rocket, UserPlus } from "lucide-react";
import { useState } from "react";

const PROJECT_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'stretch_assignment', label: 'Stretch Assignment' },
  { value: 'cross_functional', label: 'Cross-Functional' },
  { value: 'innovation', label: 'Innovation Lab' },
];

export default function TalentMarketplace() {
  usePageTitle("/talent-marketplace");
  const { toast } = useToast();
  const { data: projects = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/talent-marketplace/projects'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [open, setOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', department: '', projectType: 'project', duration: '', requiredSkills: '', maxParticipants: 5 });
  const [applyForm, setApplyForm] = useState({ employeeId: '', motivation: '' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/talent-marketplace/projects', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/talent-marketplace/projects'] }); toast({ title: 'Project created' }); setOpen(false); setForm({ title: '', description: '', department: '', projectType: 'project', duration: '', requiredSkills: '', maxParticipants: 5 }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const applyMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: any }) => { const res = await apiRequest('POST', `/api/talent-marketplace/projects/${projectId}/apply`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/talent-marketplace/projects'] }); toast({ title: 'Application submitted!' }); setApplyOpen(null); setApplyForm({ employeeId: '', motivation: '' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/talent-marketplace/projects/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/talent-marketplace/projects'] }); toast({ title: 'Project removed' }); }
  });

  const typeIcons: Record<string, any> = { project: Briefcase, mentorship: Users, stretch_assignment: Rocket, cross_functional: Target, innovation: Rocket };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="h-7 w-7 text-primary" /> Talent Marketplace</h1>
          <p className="text-muted-foreground mt-1">Connect employees with internal projects and mentorship opportunities</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Post Opportunity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Opportunity</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Select value={form.projectType} onValueChange={v => setForm({ ...form, projectType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              <Input placeholder="Duration (e.g., 3 months)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
              <Input placeholder="Required Skills (comma-separated)" value={form.requiredSkills} onChange={e => setForm({ ...form, requiredSkills: e.target.value })} />
              <Input type="number" placeholder="Max Participants" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: parseInt(e.target.value) || 5 })} />
              <Button className="w-full" disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate({ ...form, requiredSkills: form.requiredSkills ? form.requiredSkills.split(',').map(s => s.trim()) : [] })}>
                {createMutation.isPending ? 'Creating...' : 'Post Opportunity'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Briefcase className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Open Opportunities</p><p className="text-2xl font-bold">{projects.filter((p: any) => p.status === 'open').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Users className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Total Positions</p><p className="text-2xl font-bold">{projects.reduce((s: number, p: any) => s + (p.maxParticipants || 0), 0)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Rocket className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Categories</p><p className="text-2xl font-bold">{[...new Set(projects.map((p: any) => p.projectType))].length}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project: any) => {
          const Icon = typeIcons[project.projectType] || Briefcase;
          return (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{project.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(project.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">{PROJECT_TYPES.find(t => t.value === project.projectType)?.label}</Badge>
                  <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>{project.status}</Badge>
                  {project.department && <Badge variant="outline">{project.department}</Badge>}
                </div>
                {(project.requiredSkills as any[] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(project.requiredSkills as any[]).map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{project.duration || 'Ongoing'} | Max {project.maxParticipants}</span>
                  {project.status === 'open' && (
                    <Dialog open={applyOpen === project.id} onOpenChange={(o) => setApplyOpen(o ? project.id : null)}>
                      <DialogTrigger asChild><Button size="sm"><UserPlus className="h-3 w-3 mr-1" /> Apply</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Apply for: {project.title}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <Select value={applyForm.employeeId} onValueChange={v => setApplyForm({ ...applyForm, employeeId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                            <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
                          </Select>
                          <Textarea placeholder="Why are you interested?" value={applyForm.motivation} onChange={e => setApplyForm({ ...applyForm, motivation: e.target.value })} />
                          <Button className="w-full" disabled={!applyForm.employeeId || applyMutation.isPending} onClick={() => applyMutation.mutate({ projectId: project.id, data: { employeeId: parseInt(applyForm.employeeId), motivation: applyForm.motivation } })}>
                            {applyMutation.isPending ? 'Applying...' : 'Submit Application'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {projects.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No opportunities posted yet. Create your first project or mentorship opportunity.</CardContent></Card>}
      </div>
    </div>
  );
}
