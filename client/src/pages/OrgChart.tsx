import usePageTitle from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ChevronDown, ChevronRight, User } from "lucide-react";
import { useState } from "react";

export default function OrgChart() {
  usePageTitle("/org-chart");
  const { data: orgData = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/org-chart'] });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleDept = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const totalEmployees = orgData.reduce((sum: number, d: any) => sum + d.headCount, 0);
  const totalDepts = orgData.length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Organization Chart</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-blue-100"><Building2 className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-sm text-muted-foreground">Departments</p><p className="text-2xl font-bold">{totalDepts}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-green-100"><Users className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-sm text-muted-foreground">Total Employees</p><p className="text-2xl font-bold">{totalEmployees}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-indigo-100"><User className="h-5 w-5 text-indigo-600" /></div>
            <div><p className="text-sm text-muted-foreground">Avg Team Size</p><p className="text-2xl font-bold">{totalDepts > 0 ? Math.round(totalEmployees / totalDepts) : 0}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {orgData.map((dept: any) => (
          <Card key={dept.id} className="overflow-hidden">
            <div className="cursor-pointer" onClick={() => toggleDept(dept.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expanded[dept.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{dept.headCount} members</Badge>
                    {dept.budget && <Badge variant="outline">${(dept.budget / 1000).toFixed(0)}K budget</Badge>}
                  </div>
                </div>
              </CardHeader>
            </div>
            {expanded[dept.id] && (
              <CardContent className="pt-0">
                {dept.managers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Leadership</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dept.managers.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{m.name.split(' ').map((n: string) => n[0]).join('')}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.position}</p>
                          </div>
                          <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="ml-auto text-xs">{m.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {dept.members.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Team Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dept.members.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">{m.name.split(' ').map((n: string) => n[0]).join('')}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.position}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {dept.managers.length === 0 && dept.members.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No employees in this department</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        {orgData.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No departments found. Create departments first to see the org chart.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
