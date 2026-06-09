import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, Award, Star, Trophy, Plus, Users } from "lucide-react";
import { useState } from "react";

const BADGES = ['Star Performer', 'Team Player', 'Innovation Champion', 'Mentor', 'Problem Solver', 'Culture Builder', 'Customer Hero', 'Go-Getter'];
const CATEGORIES = ['Teamwork', 'Innovation', 'Leadership', 'Customer Focus', 'Above & Beyond', 'Mentorship', 'Technical Excellence'];

export default function PeerRecognition() {
  usePageTitle("/peer-recognition");
  const { toast } = useToast();
  const { data: recognitions = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/peer-recognition'] });
  const { data: leaderboard = [] } = useQuery<any[]>({ queryKey: ['/api/peer-recognition/leaderboard'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [giveOpen, setGiveOpen] = useState(false);
  const [form, setForm] = useState({ toEmployeeId: '', category: '', badge: '', message: '', points: 10 });

  const giveMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/peer-recognition', { ...data, toEmployeeId: parseInt(data.toEmployeeId), fromEmployeeId: employees[0]?.id || 1 }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/peer-recognition'] }); queryClient.invalidateQueries({ queryKey: ['/api/peer-recognition/leaderboard'] }); toast({ title: 'Recognition sent!' }); setGiveOpen(false); setForm({ toEmployeeId: '', category: '', badge: '', message: '', points: 10 }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-7 w-7 text-primary" /> Peer Recognition & Rewards</h1><p className="text-muted-foreground mt-1">Give kudos, badges, and points to your colleagues</p></div>
        <Dialog open={giveOpen} onOpenChange={setGiveOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Give Recognition</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Recognize a Colleague</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.toEmployeeId} onValueChange={v => setForm({ ...form, toEmployeeId: v })}><SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName} — {e.position}</SelectItem>)}</SelectContent></Select>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Select value={form.badge} onValueChange={v => setForm({ ...form, badge: v })}><SelectTrigger><SelectValue placeholder="Badge (optional)" /></SelectTrigger><SelectContent>{BADGES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
              <Textarea placeholder="Write your message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <Select value={String(form.points)} onValueChange={v => setForm({ ...form, points: parseInt(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5 points</SelectItem><SelectItem value="10">10 points</SelectItem><SelectItem value="25">25 points</SelectItem><SelectItem value="50">50 points</SelectItem></SelectContent></Select>
              <Button className="w-full" disabled={!form.toEmployeeId || !form.message || !form.category || giveMutation.isPending} onClick={() => giveMutation.mutate(form)}>{giveMutation.isPending ? 'Sending...' : 'Send Recognition'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="feed">
        <TabsList><TabsTrigger value="feed">Recognition Feed</TabsTrigger><TabsTrigger value="leaderboard">Leaderboard</TabsTrigger></TabsList>

        <TabsContent value="feed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-pink-100"><Heart className="h-5 w-5 text-pink-600" /></div><div><p className="text-sm text-muted-foreground">Total Recognitions</p><p className="text-2xl font-bold">{recognitions.length}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-yellow-100"><Star className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Points Given</p><p className="text-2xl font-bold">{recognitions.reduce((s: number, r: any) => s + r.points, 0)}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Award className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Badges Awarded</p><p className="text-2xl font-bold">{recognitions.filter((r: any) => r.badge).length}</p></div></CardContent></Card>
          </div>
          <div className="space-y-4">
            {recognitions.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Heart className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-sm"><strong>{r.fromName}</strong> recognized <strong>{r.toName}</strong></p>
                      <p className="mt-1">{r.message}</p>
                      <div className="flex items-center gap-2 mt-2"><Badge variant="outline">{r.category}</Badge>{r.badge && <Badge>{r.badge}</Badge>}<span className="text-sm text-muted-foreground">+{r.points} pts</span><span className="text-xs text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recognitions.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No recognitions yet. Be the first to recognize a colleague!</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Top Recognized Employees</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry: any, i: number) => (
                  <div key={entry.employeeId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>#{i + 1}</span>
                      <div><p className="font-medium">{entry.name}</p><p className="text-sm text-muted-foreground">{entry.position}</p></div>
                    </div>
                    <div className="text-right"><p className="font-bold text-primary">{entry.points} pts</p><p className="text-xs text-muted-foreground">{entry.count} recognitions</p></div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-center text-muted-foreground py-8">No data yet</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
