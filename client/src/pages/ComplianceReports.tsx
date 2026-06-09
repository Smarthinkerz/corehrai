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
import { Shield, Plus, Eye, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

const REPORT_TYPES = [{ value: 'SOC2', label: 'SOC 2 Compliance' }, { value: 'GDPR', label: 'GDPR Assessment' }, { value: 'EEOC', label: 'EEOC Compliance' }, { value: 'HIPAA', label: 'HIPAA Review' }];

export default function ComplianceReports() {
  usePageTitle("/compliance-reports");
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/compliance-reports'] });
  const { data: auditTrail = [] } = useQuery<any[]>({ queryKey: ['/api/compliance-reports/audit-trail'] });
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [form, setForm] = useState({ reportType: 'SOC2', name: '', period: '' });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/compliance-reports/generate', data); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/compliance-reports'] }); setSelectedReport(data); toast({ title: 'Compliance report generated' }); setGenerateOpen(false); },
  });

  const riskColors: Record<string, string> = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };
  const statusIcons: Record<string, any> = { compliant: CheckCircle, review: AlertTriangle, 'non-compliant': AlertTriangle };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-primary" /> Audit Trail & Compliance Reports</h1><p className="text-muted-foreground mt-1">Exportable compliance reports for SOC2, GDPR, EEOC with full audit logging</p></div>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Generate Report</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Generate Compliance Report</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.reportType} onValueChange={v => setForm({ ...form, reportType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
              <Input placeholder="Report Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Period (e.g., Q1 2026)" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
              <Button className="w-full" disabled={!form.name || !form.period || generateMutation.isPending} onClick={() => generateMutation.mutate(form)}>{generateMutation.isPending ? 'Generating...' : 'Generate Report'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reports"><TabsList><TabsTrigger value="reports">Reports</TabsTrigger><TabsTrigger value="audit">Audit Trail ({auditTrail.length})</TabsTrigger></TabsList>
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r: any) => (
              <Card key={r.id}><CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">{r.name}</h3><Button variant="ghost" size="sm" onClick={() => setSelectedReport(r)}><Eye className="h-4 w-4 mr-1" /> View</Button></div>
                <div className="flex gap-2"><Badge variant="outline">{r.reportType}</Badge><Badge className={riskColors[r.riskLevel] || ''}>{r.riskLevel} risk</Badge><Badge variant="secondary">{r.period}</Badge></div>
              </CardContent></Card>
            ))}
            {reports.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No reports yet. Generate a compliance report.</CardContent></Card>}
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <Card><CardContent className="pt-6"><div className="space-y-2 max-h-96 overflow-y-auto">{auditTrail.slice(0, 50).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b">
              <div><p className="text-sm font-medium">{a.action}: {a.description}</p><p className="text-xs text-muted-foreground">{a.entityType} #{a.entityId}</p></div>
              <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}</div></CardContent></Card>
        </TabsContent>
      </Tabs>

      {selectedReport && selectedReport.findings && (
        <Card className="border-2 border-primary/20">
          <CardHeader><div className="flex justify-between"><CardTitle>{selectedReport.name} — {selectedReport.reportType}</CardTitle><Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>Close</Button></div></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {Object.entries((selectedReport.metrics || {}) as Record<string, any>).map(([k, v]) => (
                <div key={k} className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p><p className="text-lg font-bold">{String(v)}</p></div>
              ))}
            </div>
            <h4 className="font-semibold mb-2">Findings</h4>
            <div className="space-y-2 mb-4">{((selectedReport.findings || []) as any[]).map((f: any, i: number) => {
              const Icon = statusIcons[f.status] || CheckCircle;
              return <div key={i} className="flex items-start gap-3 p-3 border rounded-lg"><Icon className={`h-5 w-5 mt-0.5 ${f.status === 'compliant' ? 'text-green-500' : 'text-yellow-500'}`} /><div><p className="font-medium">{f.area}</p><p className="text-sm text-muted-foreground">{f.detail}</p></div><Badge variant={f.status === 'compliant' ? 'default' : 'secondary'}>{f.status}</Badge></div>;
            })}</div>
            {selectedReport.recommendations && <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>{(selectedReport.recommendations as string[]).map((r: string, i: number) => <p key={i} className="text-sm text-blue-700">• {r}</p>)}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
