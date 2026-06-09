import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPlus, Users, Heart, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function OnboardingBuddies() {
  usePageTitle("/onboarding-buddies");
  const { toast } = useToast();
  const { data: buddies = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/onboarding-buddies'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [selectedNewHire, setSelectedNewHire] = useState('');

  const matchMutation = useMutation({
    mutationFn: async (newHireId: number) => { const res = await apiRequest('POST', '/api/onboarding-buddies/match', { newHireId }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/onboarding-buddies'] }); toast({ title: 'Buddy matched successfully!' }); setSelectedNewHire(''); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/onboarding-buddies/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/onboarding-buddies'] }); toast({ title: 'Buddy pair removed' }); }
  });

  const activeBuddies = buddies.filter((b: any) => b.status === 'active');

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-7 w-7 text-primary" /> Onboarding Buddy System</h1>
          <p className="text-muted-foreground mt-1">AI-powered matching of new hires with experienced buddies</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedNewHire} onValueChange={setSelectedNewHire}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select New Hire" /></SelectTrigger>
            <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
          </Select>
          <Button disabled={!selectedNewHire || matchMutation.isPending} onClick={() => matchMutation.mutate(parseInt(selectedNewHire))}>
            <Sparkles className="h-4 w-4 mr-2" /> {matchMutation.isPending ? 'Matching...' : 'Find Buddy'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total Pairs</p><p className="text-2xl font-bold">{buddies.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Heart className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Active Pairs</p><p className="text-2xl font-bold">{activeBuddies.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Sparkles className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Avg Match Score</p><p className="text-2xl font-bold">{buddies.length > 0 ? Math.round(buddies.reduce((s: number, b: any) => s + (b.matchScore || 0), 0) / buddies.length) : 0}%</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {buddies.map((buddy: any) => (
          <Card key={buddy.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                      <span className="text-lg font-bold text-blue-600">{(buddy.newHireName || '??').split(' ').map((n: string) => n[0]).join('')}</span>
                    </div>
                    <p className="font-medium text-sm">{buddy.newHireName}</p>
                    <p className="text-xs text-muted-foreground">{buddy.newHirePosition || 'New Hire'}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-6 w-6 text-primary" />
                    <Badge variant="outline" className="mt-1 text-xs">{buddy.matchScore || 0}% match</Badge>
                  </div>

                  <div className="text-center">
                    <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-1">
                      <span className="text-lg font-bold text-green-600">{(buddy.buddyName || '??').split(' ').map((n: string) => n[0]).join('')}</span>
                    </div>
                    <p className="font-medium text-sm">{buddy.buddyName}</p>
                    <p className="text-xs text-muted-foreground">{buddy.buddyPosition} {buddy.buddyDepartment ? `— ${buddy.buddyDepartment}` : ''}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge variant={buddy.status === 'active' ? 'default' : 'secondary'}>{buddy.status}</Badge>
                  <p className="text-xs text-muted-foreground">Since {new Date(buddy.startDate).toLocaleDateString()}</p>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(buddy.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>

              {(buddy.matchReasons as any[] || []).length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-sm font-medium mb-1">Match Reasons:</p>
                  <div className="flex flex-wrap gap-2">{(buddy.matchReasons as any[]).map((r: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{r}</Badge>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {buddies.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No buddy pairs yet. Select a new hire and click Find Buddy to create an AI-powered match.</CardContent></Card>}
      </div>
    </div>
  );
}
