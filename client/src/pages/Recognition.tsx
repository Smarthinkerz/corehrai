import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, Heart, Star, Trophy, Users, Trash2, ThumbsUp, Target, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const CATEGORIES = [
  { value: 'teamwork', label: 'Teamwork', icon: Users, color: 'bg-blue-100 text-blue-600' },
  { value: 'innovation', label: 'Innovation', icon: Zap, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'leadership', label: 'Leadership', icon: Target, color: 'bg-green-100 text-green-600' },
  { value: 'customer-focus', label: 'Customer Focus', icon: Heart, color: 'bg-red-100 text-red-600' },
  { value: 'excellence', label: 'Excellence', icon: Trophy, color: 'bg-yellow-100 text-yellow-600' },
  { value: 'helping-hand', label: 'Helping Hand', icon: ThumbsUp, color: 'bg-orange-100 text-orange-600' },
];

const BADGES = ['🌟', '🏆', '💎', '🔥', '⭐', '🎯', '💪', '🙌'];

export default function Recognition() {
  usePageTitle("/recognition");
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: recognitions = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/recognition'] });
  const { data: leaderboard = [] } = useQuery<any[]>({ queryKey: ['/api/recognition/leaderboard'] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ['/api/users'] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ toUserId: '', category: '', message: '', badge: '🌟' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/recognition', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recognition'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recognition/leaderboard'] });
      toast({ title: 'Recognition sent!' });
      setOpen(false);
      setForm({ toUserId: '', category: '', message: '', badge: '🌟' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/recognition/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recognition'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recognition/leaderboard'] });
      toast({ title: 'Recognition removed' });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recognition & Awards</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Award className="h-4 w-4 mr-2" /> Give Recognition</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Recognize a Colleague</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.toUserId} onValueChange={v => setForm({ ...form, toUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Person" /></SelectTrigger>
                <SelectContent>{users.filter((u: any) => u.id !== user?.id).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="What did they do that deserves recognition?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <div>
                <p className="text-sm font-medium mb-2">Choose a badge</p>
                <div className="flex gap-2 flex-wrap">
                  {BADGES.map(b => (
                    <button key={b} onClick={() => setForm({ ...form, badge: b })} className={`text-2xl p-2 rounded-lg border-2 ${form.badge === b ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted'}`}>{b}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full" disabled={!form.toUserId || !form.category || !form.message || createMutation.isPending} onClick={() => createMutation.mutate({
                toUserId: parseInt(form.toUserId), category: form.category, message: form.message, badge: form.badge
              })}>
                {createMutation.isPending ? 'Sending...' : 'Send Recognition'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Leaderboard</CardTitle></CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? <p className="text-muted-foreground text-center py-4">No recognitions yet</p> : (
              <div className="space-y-3">
                {leaderboard.map((entry: any, i: number) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <span className={`text-lg font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>#{i + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-xs font-bold">{entry.name?.split(' ').map((n: string) => n[0]).join('')}</span></div>
                    <div className="flex-1"><p className="font-medium text-sm">{entry.name}</p>{entry.department && <p className="text-xs text-muted-foreground">{entry.department}</p>}</div>
                    <Badge variant="secondary">{entry.count} kudos</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted"><p className="text-3xl font-bold">{recognitions.length}</p><p className="text-sm text-muted-foreground">Total Recognitions</p></div>
              <div className="text-center p-4 rounded-lg bg-muted"><p className="text-3xl font-bold">{[...new Set(recognitions.map((r: any) => r.toUserId))].length}</p><p className="text-sm text-muted-foreground">People Recognized</p></div>
              {CATEGORIES.slice(0, 4).map(cat => {
                const count = recognitions.filter((r: any) => r.category === cat.value).length;
                return (
                  <div key={cat.value} className="flex items-center gap-2 p-2">
                    <div className={`p-1.5 rounded ${cat.color}`}><cat.icon className="h-4 w-4" /></div>
                    <div><p className="text-sm font-medium">{cat.label}</p><p className="text-xs text-muted-foreground">{count} given</p></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Recognitions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recognitions.map((rec: any) => {
              const catInfo = CATEGORIES.find(c => c.value === rec.category);
              return (
                <div key={rec.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <span className="text-3xl">{rec.badge || '🌟'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{rec.fromUserName}</span>
                      <span className="text-muted-foreground">recognized</span>
                      <span className="font-medium">{rec.toUserName}</span>
                    </div>
                    <p className="text-sm mb-2">{rec.message}</p>
                    <div className="flex items-center gap-2">
                      {catInfo && <Badge variant="secondary" className="text-xs">{catInfo.label}</Badge>}
                      <span className="text-xs text-muted-foreground">{new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {user?.id === rec.fromUserId && (
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(rec.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              );
            })}
            {recognitions.length === 0 && <p className="text-center text-muted-foreground py-8">No recognitions yet. Be the first to recognize someone!</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
