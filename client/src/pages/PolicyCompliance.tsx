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
import { FileSearch, CheckCircle, AlertTriangle, XCircle, Trash2, Shield } from "lucide-react";
import { useState } from "react";

const DOC_TYPES = ['Policy Document', 'Employee Handbook', 'Contract', 'Communication', 'Report', 'Procedure', 'Training Material'];

export default function PolicyCompliance() {
  usePageTitle("/policy-compliance");
  const { toast } = useToast();
  const { data: checks = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/policy-compliance'] });
  const [open, setOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [form, setForm] = useState({ documentName: '', documentType: '', content: '' });

  const scanMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/policy-compliance/scan', data); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/policy-compliance'] }); toast({ title: `Scan complete: ${data.status}` }); setSelectedCheck(data); setOpen(false); setForm({ documentName: '', documentType: '', content: '' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/policy-compliance/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/policy-compliance'] }); toast({ title: 'Check removed' }); }
  });

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    passed: { icon: CheckCircle, color: 'default', bg: 'bg-green-100 text-green-700' },
    warnings: { icon: AlertTriangle, color: 'secondary', bg: 'bg-yellow-100 text-yellow-700' },
    failed: { icon: XCircle, color: 'destructive', bg: 'bg-red-100 text-red-700' },
    pending: { icon: FileSearch, color: 'outline', bg: 'bg-gray-100 text-gray-700' },
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-primary" /> Policy Compliance Checks</h1>
          <p className="text-muted-foreground mt-1">AI-powered scanning for policy adherence and regulatory compliance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><FileSearch className="h-4 w-4 mr-2" /> Scan Document</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Policy Compliance Scan</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Document Name" value={form.documentName} onChange={e => setForm({ ...form, documentName: e.target.value })} />
              <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                <SelectTrigger><SelectValue placeholder="Document Type" /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea className="min-h-[200px]" placeholder="Paste document content here for compliance scanning..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <Button className="w-full" disabled={!form.documentName || !form.documentType || !form.content || scanMutation.isPending} onClick={() => scanMutation.mutate(form)}>
                {scanMutation.isPending ? 'Scanning...' : 'Run Compliance Scan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><FileSearch className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total Scans</p><p className="text-2xl font-bold">{checks.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Passed</p><p className="text-2xl font-bold text-green-600">{checks.filter((c: any) => c.status === 'passed').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-yellow-100"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Warnings</p><p className="text-2xl font-bold text-yellow-600">{checks.filter((c: any) => c.status === 'warnings').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-red-100"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Failed</p><p className="text-2xl font-bold text-red-600">{checks.filter((c: any) => c.status === 'failed').length}</p></div></CardContent></Card>
      </div>

      {selectedCheck && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scan Results: {selectedCheck.documentName}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCheck(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className={`text-4xl font-bold ${(selectedCheck.complianceScore || 0) > 80 ? 'text-green-600' : (selectedCheck.complianceScore || 0) > 50 ? 'text-yellow-600' : 'text-red-600'}`}>{selectedCheck.complianceScore}%</p>
              </div>
              <div>
                <Badge variant={statusConfig[selectedCheck.status]?.color as any || 'secondary'} className="text-lg px-4 py-1">{selectedCheck.status.toUpperCase()}</Badge>
                <p className="text-sm text-muted-foreground mt-1">{selectedCheck.documentType}</p>
              </div>
            </div>
            {(selectedCheck.violations as any[] || []).length > 0 && (
              <div className="mb-4"><h4 className="font-medium mb-2">Violations ({(selectedCheck.violations as any[]).length})</h4>
                {(selectedCheck.violations as any[]).map((v: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border mb-2">
                    <div className="flex items-center gap-2 mb-1"><Badge variant={v.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">{v.severity}</Badge><span className="font-medium text-sm">{v.policy}</span></div>
                    <p className="text-sm text-muted-foreground">{v.message}</p>
                  </div>
                ))}
              </div>
            )}
            {(selectedCheck.suggestions as any[] || []).length > 0 && (
              <div><h4 className="font-medium mb-2">Suggestions</h4><ul className="text-sm text-muted-foreground space-y-1">{(selectedCheck.suggestions as any[]).map((s: string, i: number) => <li key={i} className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500" />{s}</li>)}</ul></div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {checks.map((check: any) => {
          const config = statusConfig[check.status] || statusConfig.pending;
          const Icon = config.icon;
          return (
            <Card key={check.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCheck(check)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-semibold">{check.documentName}</h3>
                      <p className="text-sm text-muted-foreground">{check.documentType} — {new Date(check.checkedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{check.complianceScore}%</p>
                      <Badge variant={config.color as any}>{check.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(check.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {checks.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No compliance checks yet. Scan your first document to get started.</CardContent></Card>}
      </div>
    </div>
  );
}
