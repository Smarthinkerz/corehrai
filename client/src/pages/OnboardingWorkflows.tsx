import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, ClipboardList, Trash2, Play } from "lucide-react";
import { useState } from "react";

export default function OnboardingWorkflows() {
  usePageTitle("/onboarding-workflows");
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/onboarding-workflows/templates'] });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [taskItems, setTaskItems] = useState<{name: string; description: string; daysFromStart: number}[]>([{ name: '', description: '', daysFromStart: 1 }]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/onboarding-workflows/templates', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-workflows/templates'] });
      toast({ title: 'Template created successfully' });
      setOpen(false);
      setName(''); setDepartment(''); setDescription(''); setTaskItems([{ name: '', description: '', daysFromStart: 1 }]);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/onboarding-workflows/templates/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-workflows/templates'] });
      toast({ title: 'Template deleted' });
    }
  });

  const addTask = () => setTaskItems([...taskItems, { name: '', description: '', daysFromStart: 1 }]);
  const removeTask = (i: number) => setTaskItems(taskItems.filter((_, idx) => idx !== i));
  const updateTask = (i: number, field: string, value: any) => {
    const updated = [...taskItems];
    (updated[i] as any)[field] = value;
    setTaskItems(updated);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Onboarding Workflows</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Onboarding Template</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Template Name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Department (optional)" value={department} onChange={e => setDepartment(e.target.value)} />
              <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <div>
                <h4 className="font-medium mb-2">Checklist Tasks</h4>
                {taskItems.map((task, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input className="flex-1" placeholder="Task name" value={task.name} onChange={e => updateTask(i, 'name', e.target.value)} />
                    <Input className="w-24" type="number" placeholder="Days" value={task.daysFromStart} onChange={e => updateTask(i, 'daysFromStart', parseInt(e.target.value) || 1)} />
                    <Button variant="ghost" size="icon" onClick={() => removeTask(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTask}><Plus className="h-3 w-3 mr-1" /> Add Task</Button>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({ name, department, description, tasks: taskItems.filter(t => t.name) })} disabled={!name || createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template: any) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />{template.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(template.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {template.department && <Badge variant="secondary" className="mb-2">{template.department}</Badge>}
              {template.description && <p className="text-sm text-muted-foreground mb-3">{template.description}</p>}
              <div className="text-sm">
                <span className="font-medium">{(template.tasks as any[] || []).length}</span> tasks in checklist
              </div>
              {(template.tasks as any[] || []).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {(template.tasks as any[]).slice(0, 5).map((task: any, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />{task.name} <span className="text-xs">({task.daysFromStart}d)</span>
                    </li>
                  ))}
                  {(template.tasks as any[]).length > 5 && <li className="text-xs text-muted-foreground">+{(template.tasks as any[]).length - 5} more</li>}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No onboarding templates yet. Create your first template to get started.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
