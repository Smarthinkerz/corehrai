import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, UserCheck, UserX, AlertTriangle, LogIn, LogOut, Download } from "lucide-react";
import { useState } from "react";

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 pt-6">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-12" /></div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Attendance() {
  usePageTitle("/attendance");
  const { toast } = useToast();
  const { data: records = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/attendance'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const { data: summary } = useQuery<any>({ queryKey: ['/api/attendance/summary'] });
  const [clockInOpen, setClockInOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const clockInMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const res = await apiRequest('POST', '/api/attendance/clock-in', { employeeId });
      return res.json();
    },
    onMutate: async (employeeId: number) => {
      await queryClient.cancelQueries({ queryKey: ['/api/attendance'] });
      const prev = queryClient.getQueryData<any[]>(['/api/attendance']);
      const emp = (employees as any[]).find(e => e.id === employeeId);
      const optimistic = {
        id: Date.now(),
        employeeId,
        date: new Date().toISOString(),
        clockIn: new Date().toISOString(),
        clockOut: null,
        status: 'present',
        hoursWorked: null,
        _optimistic: true,
      };
      queryClient.setQueryData(['/api/attendance'], (old: any[]) => [optimistic, ...(old || [])]);
      return { prev };
    },
    onError: (_e: any, _id: any, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['/api/attendance'], ctx.prev);
      toast({ title: 'Clock-in failed', variant: 'destructive' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/attendance'] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/summary'] });
      toast({ title: 'Clocked in successfully' });
      setClockInOpen(false);
      setSelectedEmployee('');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/attendance/clock-out/${id}`);
      return res.json();
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['/api/attendance'] });
      const prev = queryClient.getQueryData<any[]>(['/api/attendance']);
      queryClient.setQueryData(['/api/attendance'], (old: any[]) =>
        (old || []).map(r => r.id === id ? { ...r, clockOut: new Date().toISOString() } : r)
      );
      return { prev };
    },
    onError: (_e: any, _id: any, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['/api/attendance'], ctx.prev);
      toast({ title: 'Clock-out failed', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/summary'] });
    },
    onSuccess: () => toast({ title: 'Clocked out successfully' }),
  });

  const handleExport = () => {
    const csv = [
      ['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status'].join(','),
      ...(records as any[]).map(r => {
        const emp = (employees as any[]).find(e => e.id === r.employeeId);
        return [
          emp?.fullName || r.employeeId,
          new Date(r.date).toLocaleDateString(),
          r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '',
          r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '',
          r.hoursWorked ? Number(r.hoursWorked).toFixed(2) : '',
          r.status
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendance.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const statusColors: Record<string, string> = { present: 'default', absent: 'destructive', late: 'secondary', 'half-day': 'outline' };

  if (isLoading) return <AttendanceSkeleton />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Tracking</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={clockInOpen} onOpenChange={setClockInOpen}>
            <DialogTrigger asChild><Button><LogIn className="h-4 w-4 mr-2" /> Clock In</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Clock In Employee</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>{(employees as any[]).map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground tabular-nums">Current time: {new Date().toLocaleString()}</p>
                <Button className="w-full" disabled={!selectedEmployee || clockInMutation.isPending} onClick={() => clockInMutation.mutate(parseInt(selectedEmployee))}>
                  {clockInMutation.isPending ? 'Clocking in...' : 'Clock In Now'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><UserCheck className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Present Today</p><p className="text-2xl font-bold tabular-nums">{summary?.presentToday || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-red-100"><UserX className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Absent Today</p><p className="text-2xl font-bold tabular-nums">{summary?.absentToday || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-yellow-100"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Late Today</p><p className="text-2xl font-bold tabular-nums">{summary?.lateToday || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Clock className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Avg Hours</p><p className="text-2xl font-bold tabular-nums">{Number(summary?.avgHoursWorked || 0).toFixed(1)}h</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attendance Records</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">{(records as any[]).length} records</span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(records as any[]).slice(0, 50).map((record: any) => {
                const emp = (employees as any[]).find((e: any) => e.id === record.employeeId);
                return (
                  <TableRow key={record.id} className={`hover:bg-muted/40 transition-colors ${record._optimistic ? 'opacity-70 italic' : ''}`}>
                    <TableCell className="font-medium">{emp?.fullName || `#${record.employeeId}`}</TableCell>
                    <TableCell className="tabular-nums">{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell className="tabular-nums">{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '—'}</TableCell>
                    <TableCell className="tabular-nums">{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '—'}</TableCell>
                    <TableCell className="tabular-nums">{record.hoursWorked ? `${Number(record.hoursWorked).toFixed(1)}h` : '—'}</TableCell>
                    <TableCell><Badge variant={statusColors[record.status] as any || 'secondary'}>{record.status}</Badge></TableCell>
                    <TableCell>
                      {record.clockIn && !record.clockOut && !record._optimistic && (
                        <Button size="sm" variant="outline" onClick={() => clockOutMutation.mutate(record.id)} disabled={clockOutMutation.isPending}>
                          <LogOut className="h-3 w-3 mr-1" /> Clock Out
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {(records as any[]).length === 0 && <p className="text-center text-muted-foreground py-8">No attendance records yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
