import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, BookOpen, Search, Eye, Trash2, Edit, FolderOpen } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ['General', 'Policies', 'Benefits', 'IT & Security', 'Onboarding', 'Training', 'FAQ'];

export default function KnowledgeBase() {
  usePageTitle("/knowledge-base");
  const { toast } = useToast();
  const { data: articles = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/knowledge-base'] });
  const [open, setOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ title: '', content: '', category: '', isPublished: true, tags: '' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/knowledge-base', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base'] });
      toast({ title: 'Article created' });
      setOpen(false);
      setForm({ title: '', content: '', category: '', isPublished: true, tags: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/knowledge-base/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base'] });
      toast({ title: 'Article deleted' });
      setSelectedArticle(null);
    }
  });

  const filtered = articles.filter((a: any) => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(articles.map((a: any) => a.category))];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedArticle(null)}>&larr; Back</Button>
          <h1 className="text-2xl font-bold">{selectedArticle.title}</h1>
          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(selectedArticle.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{selectedArticle.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {selectedArticle.viewCount} views</span>
              <span className="text-sm text-muted-foreground">{new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="prose max-w-none whitespace-pre-wrap">{selectedArticle.content}</div>
            {(selectedArticle.tags as any[])?.length > 0 && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {(selectedArticle.tags as any[]).map((tag: string, i: number) => <Badge key={i} variant="outline">{tag}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Article</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Article</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Article Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea className="min-h-[200px]" placeholder="Article content..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <Input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={v => setForm({ ...form, isPublished: v })} />
                <span className="text-sm">Publish immediately</span>
              </div>
              <Button className="w-full" disabled={!form.title || !form.content || !form.category || createMutation.isPending} onClick={() => createMutation.mutate({
                ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
              })}>
                {createMutation.isPending ? 'Creating...' : 'Create Article'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><BookOpen className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total Articles</p><p className="text-2xl font-bold">{articles.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><FolderOpen className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Categories</p><p className="text-2xl font-bold">{categories.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Eye className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Total Views</p><p className="text-2xl font-bold">{articles.reduce((s: number, a: any) => s + (a.viewCount || 0), 0)}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((article: any) => (
          <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedArticle(article)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />{article.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.content}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{article.category}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{article.viewCount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">{search ? 'No articles match your search.' : 'No knowledge base articles yet.'}</CardContent></Card>
        )}
      </div>
    </div>
  );
}
