import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Star, TrendingUp, Target, Trash2 } from "lucide-react";
import { useState } from "react";

export default function PerformanceReviews() {
  usePageTitle("/performance-reviews");
  const { toast } = useToast();
  const { data: reviews = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/performance-reviews'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', period: '', overallRating: '', strengths: '', improvements: '', comments: '', status: 'draft' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/performance-reviews', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance-reviews'] });
      toast({ title: 'Review created successfully' });
      setOpen(false);
      setForm({ employeeId: '', period: '', overallRating: '', strengths: '', improvements: '', comments: '', status: 'draft' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/performance-reviews/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance-reviews'] });
      toast({ title: 'Review deleted' });
    }
  });

  const statusColors: Record<string, string> = { draft: 'secondary', 'in-progress': 'default', completed: 'default', cancelled: 'destructive' };
  const ratingStars = (rating: number | null) => {
    if (rating == null || isNaN(rating)) return 'Not rated';
    // Normalize 0-100 scale to 0-5 if needed, then clamp into [0,5]
    const normalized = rating > 5 ? rating / 20 : rating;
    const stars = Math.max(0, Math.min(5, Math.round(normalized)));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const avgRating = reviews.length > 0 ? (reviews.filter((r: any) => r.overallRating).reduce((s: number, r: any) => s + (r.overallRating || 0), 0) / reviews.filter((r: any) => r.overallRating).length || 0).toFixed(1) : '0';

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Performance Reviews</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Review</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Performance Review</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Review Period (e.g., Q1 2026)" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
              <Select value={form.overallRating} onValueChange={v => setForm({ ...form, overallRating: v })}>
                <SelectTrigger><SelectValue placeholder="Overall Rating (1-5)" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={String(r)}>{r} - {['Poor', 'Below Average', 'Average', 'Good', 'Excellent'][r - 1]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Strengths" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} />
              <Textarea placeholder="Areas for Improvement" value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} />
              <Textarea placeholder="Additional Comments" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} />
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" disabled={!form.employeeId || !form.period || createMutation.isPending} onClick={() => createMutation.mutate({
                employeeId: parseInt(form.employeeId), period: form.period, overallRating: form.overallRating ? parseInt(form.overallRating) : null,
                strengths: form.strengths || null, improvements: form.improvements || null, comments: form.comments || null, status: form.status
              })}>
                {createMutation.isPending ? 'Creating...' : 'Create Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-yellow-100"><Star className="h-5 w-5 text-yellow-600" /></div>
            <div><p className="text-sm text-muted-foreground">Avg Rating</p><p className="text-2xl font-bold">{avgRating}/5</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-sm text-muted-foreground">Total Reviews</p><p className="text-2xl font-bold">{reviews.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-green-100"><Target className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{reviews.filter((r: any) => r.status === 'completed').length}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.map((review: any) => {
          const emp = employees.find((e: any) => e.id === review.employeeId);
          return (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{emp?.fullName || `Employee #${review.employeeId}`}</h3>
                      <Badge variant={statusColors[review.status] as any || 'secondary'}>{review.status}</Badge>
                      <span className="text-sm text-muted-foreground">{review.period}</span>
                    </div>
                    <div className="text-lg text-yellow-500 mb-2">{ratingStars(review.overallRating)}</div>
                    {review.strengths && <p className="text-sm mb-1"><span className="font-medium">Strengths:</span> {review.strengths}</p>}
                    {review.improvements && <p className="text-sm mb-1"><span className="font-medium">Improvements:</span> {review.improvements}</p>}
                    {review.comments && <p className="text-sm text-muted-foreground">{review.comments}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(review.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {reviews.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No performance reviews yet. Create your first review to get started.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
