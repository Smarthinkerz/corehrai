import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Download, Filter, Activity, Clock, User, FileText } from 'lucide-react';
import type { ActivityLog } from '@shared/schema';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  REDACT: 'bg-amber-100 text-amber-800',
  TRANSLATE: 'bg-sky-100 text-sky-800',
  PUBLISH: 'bg-indigo-100 text-indigo-800',
  SEND: 'bg-rose-100 text-rose-800',
  EXPORT: 'bg-orange-100 text-orange-800',
  ENROLL: 'bg-teal-100 text-teal-800',
};

const ENTITY_ICONS: Record<string, string> = {
  employee: 'Employee',
  candidate: 'Candidate',
  task: 'Task',
  document: 'Document',
  survey: 'Survey',
  compliance: 'Compliance',
  wellnessprogram: 'Wellness',
  announcement: 'Announcement',
  interview: 'Interview',
  jobposting: 'Job Posting',
};

const PAGE_SIZE = 25;

const AuditLogDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activities'],
  });

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs]);

  const actions = useMemo(() => {
    const unique = new Set(logs.map(l => l.action));
    return Array.from(unique).sort();
  }, [logs]);

  const entityTypes = useMemo(() => {
    const unique = new Set(logs.map(l => l.entityType));
    return Array.from(unique).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return sortedLogs.filter(log => {
      const matchesSearch = !searchTerm ||
        (log.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [sortedLogs, searchTerm, actionFilter, entityFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => new Date(l.timestamp) >= today);
    const actionCounts = logs.reduce((acc, l) => {
      acc[l.action] = (acc[l.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
    const uniqueUsers = new Set(logs.map(l => l.userId)).size;
    return {
      total: logs.length,
      today: todayLogs.length,
      topAction: topAction ? `${topAction[0]} (${topAction[1]})` : 'N/A',
      uniqueUsers,
    };
  }, [logs]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Description'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.action,
      log.entityType,
      log.entityId?.toString() || '',
      log.userId?.toString() || '',
      `"${(log.description || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Audit Log</h2>
          <p className="text-sm text-neutral-500 mt-1">Track all system activities and user actions</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={filteredLogs.length === 0}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-neutral-500">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-neutral-500">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold truncate text-sm">{stats.topAction}</p>
                <p className="text-xs text-neutral-500">Most Common</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-neutral-500">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search audit logs..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityTypes.map(e => (
                    <SelectItem key={e} value={e}>{ENTITY_ICONS[e] || e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[120px]">Entity</TableHead>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[80px]">User</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                      No audit log entries found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-neutral-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ENTITY_ICONS[log.entityType] || log.entityType}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500 font-mono">
                        {log.entityId || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500 font-mono">
                        {log.userId || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-700 max-w-md truncate">
                        {log.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-neutral-500">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} entries
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogDashboard;
