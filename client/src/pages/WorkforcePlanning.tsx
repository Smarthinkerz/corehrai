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
import { Plus, TrendingUp, Play, Trash2, BarChart3, Users, DollarSign } from "lucide-react";
import { useState } from "react";

const FORECAST_TYPES = [{ value: 'headcount', label: 'Headcount Planning' }, { value: 'skills_gap', label: 'Skills Gap Analysis' }, { value: 'budget', label: 'Budget Forecasting' }, { value: 'attrition', label: 'Attrition Prediction' }];

export default function WorkforcePlanning() {
  usePageTitle("/workforce-planning");
  const { toast } = useToast();
  const { data: forecasts = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/workforce-planning'] });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', forecastType: 'headcount', timeframeMonths: 12 });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/workforce-planning', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/workforce-planning'] }); toast({ title: 'Forecast created' }); setCreateOpen(false); setForm({ name: '', description: '', forecastType: 'headcount', timeframeMonths: 12 }); },
  });

  const generateMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest('POST', `/api/workforce-planning/${id}/generate`); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/workforce-planning'] }); setSelectedResult(data); toast({ title: 'Forecast generated' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/workforce-planning/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/workforce-planning'] }); toast({ title: 'Deleted' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-7 w-7 text-primary" /> Predictive Workforce Planning</h1><p className="text-muted-foreground mt-1">AI-powered forecasts for hiring, skills, budget, and attrition</p></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Forecast</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create Forecast</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Forecast Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Select value={form.forecastType} onValueChange={v => setForm({ ...form, forecastType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FORECAST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
              <Input type="number" placeholder="Timeframe (months)" value={form.timeframeMonths} onChange={e => setForm({ ...form, timeframeMonths: parseInt(e.target.value) || 12 })} />
              <Button className="w-full" disabled={!form.name || createMutation.isPending} onClick={() => createMutation.mutate(form)}>{createMutation.isPending ? 'Creating...' : 'Create Forecast'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecasts.map((f: any) => (
          <Card key={f.id}>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg">{f.name}</CardTitle><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardHeader>
            <CardContent>
              {f.description && <p className="text-sm text-muted-foreground mb-3">{f.description}</p>}
              <div className="flex gap-2 mb-3"><Badge variant="outline">{FORECAST_TYPES.find(t => t.value === f.forecastType)?.label}</Badge><Badge variant={f.status === 'completed' ? 'default' : 'secondary'}>{f.status}</Badge></div>
              {f.confidenceLevel && <p className="text-sm mb-2">Confidence: <strong>{f.confidenceLevel}%</strong></p>}
              <div className="flex gap-2">{f.status !== 'completed' ? <Button size="sm" onClick={() => generateMutation.mutate(f.id)} disabled={generateMutation.isPending}><Play className="h-3 w-3 mr-1" /> Generate</Button> : <Button size="sm" variant="outline" onClick={() => setSelectedResult(f)}><BarChart3 className="h-3 w-3 mr-1" /> View Results</Button>}</div>
            </CardContent>
          </Card>
        ))}
        {forecasts.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No forecasts yet. Create one to predict workforce trends.</CardContent></Card>}
      </div>

      {selectedResult && selectedResult.projections && (
        <Card className="border-2 border-primary/20">
          <CardHeader><div className="flex items-center justify-between"><CardTitle>{selectedResult.name} — Results</CardTitle><Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>Close</Button></div></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedResult.projections as Record<string, any>).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                  {Array.isArray(value) ? <div className="space-y-1">{(value as any[]).map((v, i) => <div key={i} className="text-sm p-2 bg-background rounded border">{typeof v === 'object' ? Object.entries(v).map(([k, val]) => <span key={k} className="mr-3">{k}: <strong>{String(val)}</strong></span>) : String(v)}</div>)}</div>
                  : typeof value === 'object' ? <div className="space-y-1">{Object.entries(value).map(([k, v]) => <div key={k} className="flex justify-between text-sm"><span>{k}:</span><strong>{String(v)}</strong></div>)}</div>
                  : <p className="text-lg font-bold">{String(value)}</p>}
                </div>
              ))}
            </div>
            {selectedResult.recommendations && <div className="mt-4 p-4 bg-blue-50 rounded-lg"><h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>{(selectedResult.recommendations as string[]).map((r: string, i: number) => <p key={i} className="text-sm text-blue-700">• {r}</p>)}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
