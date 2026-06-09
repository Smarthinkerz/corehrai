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
import { FileText, Plus, Send, Eye, Trash2, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function OfferLetters() {
  usePageTitle("/offer-letters");
  const { toast } = useToast();
  const { data: templates = [] } = useQuery<any[]>({ queryKey: ['/api/offer-letters/templates'] });
  const { data: offers = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/offer-letters/offers'] });
  const [generateOpen, setGenerateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOffer, setPreviewOffer] = useState<any>(null);
  const [form, setForm] = useState({ templateId: '', candidateName: '', jobTitle: '', department: '', salary: '', startDate: '' });
  const [tplForm, setTplForm] = useState({ name: '', templateType: 'offer_letter', content: 'Dear {{candidateName}},\n\nWe are pleased to offer you the position of {{jobTitle}} in our {{department}} department.\n\nCompensation: {{salary}} per year\nStart Date: {{startDate}}\n\nThis offer includes our comprehensive benefits package.\n\nPlease sign and return within 5 business days.\n\nBest regards,\nHR Department' });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/offer-letters/generate', { ...data, templateId: data.templateId ? parseInt(data.templateId) : undefined }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/offer-letters/offers'] }); toast({ title: 'Offer letter generated' }); setGenerateOpen(false); setForm({ templateId: '', candidateName: '', jobTitle: '', department: '', salary: '', startDate: '' }); },
  });

  const addTemplateMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/offer-letters/templates', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/offer-letters/templates'] }); toast({ title: 'Template saved' }); setTemplateOpen(false); },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest('PUT', `/api/offer-letters/offers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/offer-letters/offers'] }); toast({ title: 'Offer updated' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-7 w-7 text-primary" /> Offer Letter Generator</h1><p className="text-muted-foreground mt-1">AI-powered offer letters, NDAs, and employment contracts</p></div>
        <div className="flex gap-2">
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}><DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Template</Button></DialogTrigger>
            <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Template Name" value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value })} />
                <Select value={tplForm.templateType} onValueChange={v => setTplForm({ ...tplForm, templateType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="offer_letter">Offer Letter</SelectItem><SelectItem value="nda">NDA</SelectItem><SelectItem value="contract">Employment Contract</SelectItem></SelectContent></Select>
                <Textarea rows={8} value={tplForm.content} onChange={e => setTplForm({ ...tplForm, content: e.target.value })} />
                <p className="text-xs text-muted-foreground">Variables: {'{{candidateName}}, {{jobTitle}}, {{department}}, {{salary}}, {{startDate}}'}</p>
                <Button className="w-full" disabled={!tplForm.name || addTemplateMutation.isPending} onClick={() => addTemplateMutation.mutate(tplForm)}>Save Template</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}><DialogTrigger asChild><Button><FileText className="h-4 w-4 mr-2" /> Generate Offer</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Generate Offer Letter</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {templates.length > 0 && <Select value={form.templateId} onValueChange={v => setForm({ ...form, templateId: v })}><SelectTrigger><SelectValue placeholder="Select Template (optional)" /></SelectTrigger><SelectContent>{templates.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select>}
                <Input placeholder="Candidate Name" value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} />
                <Input placeholder="Job Title" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
                <div className="grid grid-cols-2 gap-4"><Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /><Input placeholder="Salary" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                <Button className="w-full" disabled={!form.candidateName || !form.jobTitle || generateMutation.isPending} onClick={() => generateMutation.mutate(form)}>{generateMutation.isPending ? 'Generating...' : 'Generate Offer Letter'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><FileText className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total Offers</p><p className="text-2xl font-bold">{offers.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Send className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Sent</p><p className="text-2xl font-bold">{offers.filter((o: any) => o.status === 'sent').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><CheckCircle className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Signed</p><p className="text-2xl font-bold">{offers.filter((o: any) => o.status === 'signed').length}</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {offers.map((o: any) => (
          <Card key={o.id}><CardContent className="pt-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{o.candidateName}</h3>
              <p className="text-sm text-muted-foreground">{o.jobTitle}{o.department ? ` — ${o.department}` : ''}{o.salary ? ` — ${o.salary}` : ''}</p>
              <div className="flex gap-2 mt-1"><Badge variant={o.status === 'signed' ? 'default' : o.status === 'sent' ? 'outline' : 'secondary'}>{o.status}</Badge></div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreviewOffer(o)}><Eye className="h-4 w-4 mr-1" /> Preview</Button>
              {o.status === 'draft' && <Button variant="outline" size="sm" onClick={() => updateOfferMutation.mutate({ id: o.id, data: { status: 'sent', sentAt: new Date() } })}><Send className="h-4 w-4 mr-1" /> Send</Button>}
              {o.status === 'sent' && <Button variant="outline" size="sm" onClick={() => updateOfferMutation.mutate({ id: o.id, data: { status: 'signed', signedAt: new Date() } })}><CheckCircle className="h-4 w-4 mr-1" /> Mark Signed</Button>}
            </div>
          </CardContent></Card>
        ))}
        {offers.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No offer letters generated yet.</CardContent></Card>}
      </div>

      {previewOffer && <Dialog open={!!previewOffer} onOpenChange={() => setPreviewOffer(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Offer Letter — {previewOffer.candidateName}</DialogTitle></DialogHeader><div className="bg-white border rounded-lg p-8 whitespace-pre-wrap font-serif text-sm">{previewOffer.generatedContent}</div></DialogContent></Dialog>}
    </div>
  );
}
