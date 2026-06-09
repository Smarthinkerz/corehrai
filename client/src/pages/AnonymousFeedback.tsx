import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquareOff, Plus, Send, Shield, AlertTriangle, Eye } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ['Workplace Concern', 'Management Issue', 'Compensation', 'Culture & Inclusion', 'Workload & Burnout', 'Career Growth', 'Safety', 'Other'];

export default function AnonymousFeedback() {
  usePageTitle("/anonymous-feedback");
  const { toast } = useToast();
  const { data: feedbacks = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/anonymous-feedback'] });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState<any>(null);
  const [form, setForm] = useState({ category: '', message: '', department: '' });
  const [response, setResponse] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/anonymous-feedback', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/anonymous-feedback'] }); toast({ title: 'Feedback submitted anonymously' }); setSubmitOpen(false); setForm({ category: '', message: '', department: '' }); },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => { const res = await apiRequest('PUT', `/api/anonymous-feedback/${id}/respond`, { response }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/anonymous-feedback'] }); toast({ title: 'Response sent' }); setRespondOpen(null); setResponse(''); },
  });

  const severityColors: Record<string, string> = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
  const sentimentColors: Record<string, string> = { positive: 'text-green-600', neutral: 'text-gray-600', negative: 'text-red-600' };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquareOff className="h-7 w-7 text-primary" /> Anonymous Feedback</h1><p className="text-muted-foreground mt-1">Safe space with AI-categorized routing to appropriate managers</p></div>
        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Submit Feedback</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Submit Anonymous Feedback</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800"><Shield className="h-4 w-4 inline mr-1" /> Your feedback is completely anonymous. No identifying information is recorded.</div>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Textarea placeholder="Share your feedback..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} />
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}><SelectTrigger><SelectValue placeholder="Department (optional)" /></SelectTrigger><SelectContent><SelectItem value="Engineering">Engineering</SelectItem><SelectItem value="Marketing">Marketing</SelectItem><SelectItem value="Sales">Sales</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Product">Product</SelectItem></SelectContent></Select>
              <Button className="w-full" disabled={!form.category || !form.message || submitMutation.isPending} onClick={() => submitMutation.mutate(form)}>{submitMutation.isPending ? 'Submitting...' : 'Submit Anonymously'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><MessageSquareOff className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{feedbacks.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-yellow-100"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">New</p><p className="text-2xl font-bold">{feedbacks.filter((f: any) => f.status === 'new').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Send className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Responded</p><p className="text-2xl font-bold">{feedbacks.filter((f: any) => f.status === 'responded').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Critical</p><p className="text-2xl font-bold">{feedbacks.filter((f: any) => f.severity === 'critical').length}</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {feedbacks.map((f: any) => (
          <Card key={f.id} className={f.severity === 'critical' ? 'border-red-200' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2"><Badge variant="outline">{f.category}</Badge><Badge className={severityColors[f.severity] || ''}>{f.severity}</Badge><Badge variant="secondary">{f.status}</Badge>{f.aiCategory && <Badge variant="outline">AI: {f.aiCategory}</Badge>}{f.aiSentiment && <span className={`text-sm font-medium ${sentimentColors[f.aiSentiment] || ''}`}>{f.aiSentiment}</span>}</div>
                  <p className="mt-2">{f.message}</p>
                  {f.aiRoutedTo && <p className="text-sm text-muted-foreground mt-2">Routed to: <strong>{f.aiRoutedTo}</strong></p>}
                  {f.adminResponse && <div className="mt-3 p-3 bg-blue-50 rounded-lg"><p className="text-sm font-medium text-blue-800">Admin Response:</p><p className="text-sm text-blue-700">{f.adminResponse}</p></div>}
                </div>
                {f.status === 'new' && <Button size="sm" variant="outline" onClick={() => setRespondOpen(f)}><Send className="h-3 w-3 mr-1" /> Respond</Button>}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{new Date(f.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
        {feedbacks.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No anonymous feedback submitted yet.</CardContent></Card>}
      </div>

      {respondOpen && <Dialog open={!!respondOpen} onOpenChange={() => setRespondOpen(null)}><DialogContent><DialogHeader><DialogTitle>Respond to Feedback</DialogTitle></DialogHeader>
        <div className="space-y-4"><div className="bg-muted p-3 rounded-lg"><p className="text-sm">{respondOpen.message}</p></div><Textarea placeholder="Write your response..." value={response} onChange={e => setResponse(e.target.value)} /><Button className="w-full" disabled={!response || respondMutation.isPending} onClick={() => respondMutation.mutate({ id: respondOpen.id, response })}>Send Response</Button></div>
      </DialogContent></Dialog>}
    </div>
  );
}
