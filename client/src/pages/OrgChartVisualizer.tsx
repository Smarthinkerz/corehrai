import usePageTitle from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Users, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function OrgChartVisualizer() {
  usePageTitle("/org-chart-visualizer");
  const { data: employees = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const { data: departments = [] } = useQuery<any[]>({ queryKey: ['/api/departments'] });
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const toggleDept = (dept: string) => {
    const next = new Set(expandedDepts);
    next.has(dept) ? next.delete(dept) : next.add(dept);
    setExpandedDepts(next);
  };

  const deptEmployees = departments.map(d => ({
    ...d,
    employees: employees.filter(e => e.department?.toLowerCase() === d.name.toLowerCase()),
  }));

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Network className="h-7 w-7 text-primary" /> Organization Chart</h1>
        <p className="text-muted-foreground mt-1">Interactive org chart auto-updated from employee data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total Employees</p><p className="text-2xl font-bold">{employees.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Building2 className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Departments</p><p className="text-2xl font-bold">{departments.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Network className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Avg Team Size</p><p className="text-2xl font-bold">{departments.length > 0 ? Math.round(employees.length / departments.length) : 0}</p></div></CardContent></Card>
      </div>

      <div className="flex justify-center">
        <div className="inline-block">
          <Card className="bg-primary text-primary-foreground border-primary mb-4 mx-auto w-64">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="font-bold text-lg">Organization</p>
              <p className="text-sm opacity-80">{employees.length} employees across {departments.length} departments</p>
            </CardContent>
          </Card>
          <div className="flex justify-center mb-2"><div className="w-0.5 h-6 bg-border" /></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deptEmployees.map(dept => (
              <Card key={dept.id} className="min-w-[220px]">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleDept(dept.name)}>
                  <CardTitle className="text-base flex items-center gap-2">
                    {expandedDepts.has(dept.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {dept.name}
                    <Badge variant="secondary" className="ml-auto">{dept.employees.length}</Badge>
                  </CardTitle>
                </CardHeader>
                {expandedDepts.has(dept.name) && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 border-l-2 border-primary/20 ml-2 pl-3">
                      {dept.employees.map((emp: any) => (
                        <div key={emp.id} className="py-1">
                          <p className="text-sm font-medium">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.position}</p>
                        </div>
                      ))}
                      {dept.employees.length === 0 && <p className="text-xs text-muted-foreground py-1">No employees</p>}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
