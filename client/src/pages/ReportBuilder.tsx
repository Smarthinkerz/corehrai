import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, FileText, Play, Trash2, Share2, Download } from "lucide-react";
import { useState } from "react";

const REPORT_TYPES = [
  { value: 'employees', label: 'Employees' },
  { value: 'candidates', label: 'Candidates' },
  { value: 'departments', label: 'Departments' },
  { value: 'tasks', label: 'HR Tasks' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'leave', label: 'Leave Requests' },
];

export default function ReportBuilder() {
  usePageTitle("/reports");
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/reports'] });
  const [open, setOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', reportType: '', isShared: false });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/reports', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: 'Report saved' });
      setOpen(false);
      setForm({ name: '', description: '', reportType: '', isShared: false });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/reports/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: 'Report deleted' });
    }
  });

  const runReport = async (id: number) => {
    try {
      const res = await apiRequest('POST', `/api/reports/${id}/run`);
      const data = await res.json();
      setReportData(data);
    } catch (e: any) {
      toast({ title: 'Error running report', description: e.message, variant: 'destructive' });
    }
  };

  const exportCsv = () => {
    if (!reportData?.data?.length) return;
    const headers = Object.keys(reportData.data[0]);
    const csv = [headers.join(','), ...reportData.data.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${reportData.report.name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Report Builder</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Report</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Report</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Report Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Select value={form.reportType} onValueChange={v => setForm({ ...form, reportType: v })}>
                <SelectTrigger><SelectValue placeholder="Data Source" /></SelectTrigger>
                <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={form.isShared} onCheckedChange={v => setForm({ ...form, isShared: v })} />
                <span className="text-sm">Share with team</span>
              </div>
              <Button className="w-full" disabled={!form.name || !form.reportType || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? 'Saving...' : 'Save Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report: any) => (
          <Card key={report.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{report.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => runReport(report.id)}><Play className="h-4 w-4 text-green-600" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(report.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {report.description && <p className="text-sm text-muted-foreground mb-2">{report.description}</p>}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{REPORT_TYPES.find(t => t.value === report.reportType)?.label || report.reportType}</Badge>
                {report.isShared && <Badge variant="outline"><Share2 className="h-3 w-3 mr-1" />Shared</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No saved reports. Create your first custom report to get started.</CardContent></Card>
        )}
      </div>

      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{reportData.report.name} Results</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{reportData.totalRecords} records</Badge>
                <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
                <Button size="sm" variant="ghost" onClick={() => setReportData(null)}>Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(reportData.data[0]).slice(0, 8).map((key: string) => (
                        <TableHead key={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.data.slice(0, 50).map((row: any, i: number) => (
                      <TableRow key={i}>
                        {Object.values(row).slice(0, 8).map((val: any, j: number) => (
                          <TableCell key={j}>{typeof val === 'object' ? JSON.stringify(val) : String(val ?? '-')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {reportData.data.length > 50 && <p className="text-sm text-muted-foreground mt-2 text-center">Showing 50 of {reportData.data.length} records</p>}
              </div>
            ) : <p className="text-center text-muted-foreground py-8">No data matches this report criteria.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
