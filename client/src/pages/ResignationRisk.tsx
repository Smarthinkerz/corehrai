import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Shield, TrendingDown, Users, Scan, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useState } from "react";

export default function ResignationRisk() {
  usePageTitle("/resignation-risk");
  const { toast } = useToast();
  const { data: assessments = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/resignation-risk'] });
  const { data: dashboard } = useQuery<any>({ queryKey: ['/api/resignation-risk/dashboard'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const assessMutation = useMutation({
    mutationFn: async (employeeId: number) => { const res = await apiRequest('POST', `/api/resignation-risk/assess/${employeeId}`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/resignation-risk'] }); queryClient.invalidateQueries({ queryKey: ['/api/resignation-risk/dashboard'] }); toast({ title: 'Assessment complete' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const assessAllMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest('POST', '/api/resignation-risk/assess-all'); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['/api/resignation-risk'] }); queryClient.invalidateQueries({ queryKey: ['/api/resignation-risk/dashboard'] }); toast({ title: `Assessed ${data.assessed} employees` }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const riskConfig: Record<string, { color: string; icon: any; bg: string }> = {
    critical: { color: 'destructive', icon: ShieldX, bg: 'bg-red-100 text-red-700' },
    high: { color: 'destructive', icon: ShieldAlert, bg: 'bg-orange-100 text-orange-700' },
    medium: { color: 'secondary', icon: Shield, bg: 'bg-yellow-100 text-yellow-700' },
    low: { color: 'default', icon: ShieldCheck, bg: 'bg-green-100 text-green-700' },
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-7 w-7 text-primary" /> Resignation Risk Analysis</h1>
          <p className="text-muted-foreground mt-1">AI-powered prediction to identify employees at risk of leaving</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Employee" /></SelectTrigger>
            <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
          </Select>
          <Button disabled={!selectedEmployee || assessMutation.isPending} onClick={() => assessMutation.mutate(parseInt(selectedEmployee))}>
            <Scan className="h-4 w-4 mr-2" /> Assess
          </Button>
          <Button variant="outline" onClick={() => assessAllMutation.mutate()} disabled={assessAllMutation.isPending}>
            {assessAllMutation.isPending ? 'Assessing...' : 'Assess All'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Assessed</p><p className="text-2xl font-bold">{dashboard?.totalAssessed || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-red-100"><ShieldX className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Critical</p><p className="text-2xl font-bold text-red-600">{dashboard?.critical || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><ShieldAlert className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">High</p><p className="text-2xl font-bold text-orange-600">{dashboard?.high || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-yellow-100"><Shield className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Medium</p><p className="text-2xl font-bold text-yellow-600">{dashboard?.medium || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><ShieldCheck className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Low</p><p className="text-2xl font-bold text-green-600">{dashboard?.low || 0}</p></div></CardContent></Card>
      </div>

      {dashboard && dashboard.avgRiskScore > 0 && (
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Organization Average Risk Score</p>
          <p className="text-4xl font-bold mt-2">{dashboard.avgRiskScore}%</p>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-4 mt-3">
            <div className={`h-4 rounded-full ${dashboard.avgRiskScore > 50 ? 'bg-red-500' : dashboard.avgRiskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${dashboard.avgRiskScore}%` }} />
          </div>
        </CardContent></Card>
      )}

      <div className="space-y-4">
        {assessments.map((a: any) => {
          const emp = employees.find((e: any) => e.id === a.employeeId);
          const config = riskConfig[a.riskLevel] || riskConfig.low;
          const Icon = config.icon;
          return (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-semibold">{emp?.fullName || `Employee #${a.employeeId}`}</h3>
                      <p className="text-sm text-muted-foreground">{emp?.position} {emp?.department ? `— ${emp.department}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={config.color as any}>{a.riskLevel.toUpperCase()}</Badge>
                    <p className="text-2xl font-bold mt-1">{a.riskScore}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full ${a.riskScore > 70 ? 'bg-red-500' : a.riskScore > 50 ? 'bg-orange-500' : a.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${a.riskScore}%` }} />
                </div>
                {(a.factors as any[] || []).length > 0 && (
                  <div className="mb-3"><p className="text-sm font-medium mb-1">Risk Factors:</p><div className="flex flex-wrap gap-2">{(a.factors as any[]).map((f: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}</div></div>
                )}
                {(a.recommendations as any[] || []).length > 0 && (
                  <div><p className="text-sm font-medium mb-1">Recommended Actions:</p><ul className="text-sm text-muted-foreground space-y-1">{(a.recommendations as any[]).map((r: string, i: number) => <li key={i} className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{r}</li>)}</ul></div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {assessments.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No assessments yet. Select an employee or run Assess All to generate risk predictions.</CardContent></Card>}
      </div>
    </div>
  );
}
