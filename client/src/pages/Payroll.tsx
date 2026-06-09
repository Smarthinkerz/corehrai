import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, DollarSign, TrendingUp, Users, CreditCard, Download } from "lucide-react";
import { useState } from "react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function PayrollSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 pt-6">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-20" /></div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Payroll() {
  usePageTitle("/payroll");
  const { toast } = useToast();
  const { data: records = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/payroll'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const { data: summary } = useQuery<any>({ queryKey: ['/api/payroll/summary'] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', period: '', baseSalary: '', bonus: '0', deductions: '0', status: 'pending' });
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/payroll', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/summary'] });
      toast({ title: 'Payroll record created' });
      setOpen(false);
      setForm({ employeeId: '', period: '', baseSalary: '', bonus: '0', deductions: '0', status: 'pending' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const processPayment = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PUT', `/api/payroll/${id}`, { status: 'paid', paidAt: new Date().toISOString() });
      return res.json();
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['/api/payroll'] });
      const prev = queryClient.getQueryData<any[]>(['/api/payroll']);
      queryClient.setQueryData(['/api/payroll'], (old: any[]) =>
        (old || []).map(r => r.id === id ? { ...r, status: 'paid' } : r)
      );
      return { prev };
    },
    onError: (_e: any, _id: any, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['/api/payroll'], ctx.prev);
      toast({ title: 'Error processing payment', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/summary'] });
    },
    onSuccess: () => toast({ title: 'Payment processed' })
  });

  const handleExport = () => {
    const csv = [
      ['Employee', 'Period', 'Base Salary', 'Bonus', 'Deductions', 'Net Pay', 'Status'].join(','),
      ...records.map((r: any) => {
        const emp = employees.find((e: any) => e.id === r.employeeId);
        return [emp?.fullName || r.employeeId, r.period, r.baseSalary, r.bonus, r.deductions, r.netPay, r.status].join(',');
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payroll.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const netPay = parseFloat(form.baseSalary || '0') + parseFloat(form.bonus || '0') - parseFloat(form.deductions || '0');

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedRecords = [...records].sort((a: any, b: any) => {
    if (!sortField) return 0;
    const av = a[sortField] ?? 0, bv = b[sortField] ?? 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-xs opacity-50">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  if (isLoading) return <PayrollSkeleton />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Record</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Payroll Record</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Pay Period (e.g., 2026-06)" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
                <Input type="number" placeholder="Base Salary" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} />
                <Input type="number" placeholder="Bonus" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} />
                <Input type="number" placeholder="Deductions" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} />
                <div className="p-3 bg-muted rounded-lg text-center">
                  <span className="text-sm text-muted-foreground">Net Pay: </span>
                  <span className="font-bold text-lg tabular-nums">${fmt(netPay)}</span>
                </div>
                <Button className="w-full" disabled={!form.employeeId || !form.period || !form.baseSalary || createMutation.isPending}
                  onClick={() => createMutation.mutate({
                    employeeId: parseInt(form.employeeId), period: form.period, baseSalary: parseFloat(form.baseSalary),
                    bonus: parseFloat(form.bonus || '0'), deductions: parseFloat(form.deductions || '0'), netPay, status: form.status
                  })}>
                  {createMutation.isPending ? 'Creating...' : 'Create Record'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Total Payroll</p><p className="text-2xl font-bold tabular-nums">${fmt(summary?.totalPayroll || 0)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Avg Salary</p><p className="text-2xl font-bold tabular-nums">${fmt(summary?.averageSalary || 0)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><CreditCard className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold tabular-nums">{summary?.pendingCount || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Users className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Employees</p><p className="text-2xl font-bold tabular-nums">{summary?.totalEmployees || 0}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payroll Records</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">{records.length} records</span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('employeeId')}>Employee <SortIcon field="employeeId" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('period')}>Period <SortIcon field="period" /></TableHead>
                <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('baseSalary')}>Base Salary <SortIcon field="baseSalary" /></TableHead>
                <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('bonus')}>Bonus <SortIcon field="bonus" /></TableHead>
                <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('deductions')}>Deductions <SortIcon field="deductions" /></TableHead>
                <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('netPay')}>Net Pay <SortIcon field="netPay" /></TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record: any) => {
                const emp = employees.find((e: any) => e.id === record.employeeId);
                return (
                  <TableRow key={record.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{emp?.fullName || `#${record.employeeId}`}</TableCell>
                    <TableCell className="tabular-nums">{record.period}</TableCell>
                    <TableCell className="text-right tabular-nums">${fmt(record.baseSalary)}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-700">+${fmt(record.bonus || 0)}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">-${fmt(record.deductions || 0)}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">${fmt(record.netPay)}</TableCell>
                    <TableCell><Badge variant={record.status === 'paid' ? 'default' : 'secondary'}>{record.status}</Badge></TableCell>
                    <TableCell>
                      {record.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => processPayment.mutate(record.id)} disabled={processPayment.isPending}>Process</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {records.length === 0 && <p className="text-center text-muted-foreground py-8">No payroll records yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
