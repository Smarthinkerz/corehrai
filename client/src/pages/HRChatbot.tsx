import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Send, BookOpen, Plus, ThumbsUp, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function HRChatbot() {
  usePageTitle("/hr-chatbot");
  const { toast } = useToast();
  const { data: conversations = [] } = useQuery<any[]>({ queryKey: ['/api/hr-chatbot/conversations'] });
  const { data: articles = [] } = useQuery<any[]>({ queryKey: ['/api/hr-chatbot/articles'] });
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [addArticleOpen, setAddArticleOpen] = useState(false);
  const [articleForm, setArticleForm] = useState({ title: '', content: '', category: 'General', tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const askMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/hr-chatbot/ask', data); return res.json(); },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: 'user', content: question }, { role: 'assistant', content: data.answer, sources: data.relatedArticles?.map((a: any) => a.title) }]);
      setConversationId(data.conversation?.id || conversationId);
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: ['/api/hr-chatbot/conversations'] });
    },
  });

  const addArticleMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/hr-chatbot/articles', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/hr-chatbot/articles'] }); toast({ title: 'Article added to knowledge base' }); setAddArticleOpen(false); setArticleForm({ title: '', content: '', category: 'General', tags: [] }); },
  });

  const suggestions = ['How many vacation days do I have?', 'What are my health benefits?', 'How do I submit an expense report?', 'What is the remote work policy?', 'When are performance reviews?', 'What is the parental leave policy?'];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-7 w-7 text-primary" /> HR Knowledge Base & Chatbot</h1><p className="text-muted-foreground mt-1">Ask questions and get instant answers from company policies</p></div>
      </div>

      <Tabs defaultValue="chat">
        <TabsList><TabsTrigger value="chat">Chat</TabsTrigger><TabsTrigger value="articles">Knowledge Base ({articles.length})</TabsTrigger></TabsList>

        <TabsContent value="chat">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-2"><CardTitle className="text-lg">Ask HR Assistant</CardTitle></CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 && <div className="text-center py-8"><MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Ask any HR question and get instant answers</p><div className="flex flex-wrap gap-2 justify-center mt-4">{suggestions.slice(0, 4).map((s, i) => <Button key={i} variant="outline" size="sm" onClick={() => setQuestion(s)}>{s}</Button>)}</div></div>}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.sources && msg.sources.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{msg.sources.map((s: string, j: number) => <Badge key={j} variant="outline" className="text-xs">{s}</Badge>)}</div>}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </CardContent>
                <div className="p-4 border-t flex gap-2">
                  <Input placeholder="Ask a question..." value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && question) askMutation.mutate({ question, conversationId }); }} />
                  <Button disabled={!question || askMutation.isPending} onClick={() => askMutation.mutate({ question, conversationId })}><Send className="h-4 w-4" /></Button>
                </div>
              </Card>
            </div>
            <div>
              <Card><CardHeader><CardTitle className="text-lg">Quick Questions</CardTitle></CardHeader><CardContent className="space-y-2">{suggestions.map((s, i) => <Button key={i} variant="ghost" className="w-full justify-start text-left h-auto py-2" size="sm" onClick={() => setQuestion(s)}><Search className="h-3 w-3 mr-2 flex-shrink-0" /><span className="truncate">{s}</span></Button>)}</CardContent></Card>
              <Card className="mt-4"><CardHeader><CardTitle className="text-sm">Recent Conversations</CardTitle></CardHeader><CardContent>{conversations.length === 0 ? <p className="text-sm text-muted-foreground">No conversations yet</p> : conversations.slice(0, 5).map((c: any) => <div key={c.id} className="py-2 border-b last:border-0"><p className="text-sm truncate">{((c.messages as any[])?.[0] as any)?.content || 'Conversation'}</p><p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p></div>)}</CardContent></Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="articles">
          <div className="flex justify-end mb-4">
            <Dialog open={addArticleOpen} onOpenChange={setAddArticleOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Article</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Add Knowledge Base Article</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Title" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} />
                  <Textarea placeholder="Content" value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} rows={6} />
                  <Select value={articleForm.category} onValueChange={v => setArticleForm({ ...articleForm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Benefits">Benefits</SelectItem><SelectItem value="Leave">Leave & Time Off</SelectItem><SelectItem value="Policies">Policies</SelectItem><SelectItem value="Compensation">Compensation</SelectItem><SelectItem value="IT">IT & Security</SelectItem></SelectContent></Select>
                  <div className="flex gap-2"><Input placeholder="Add tag" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagInput) { setArticleForm({ ...articleForm, tags: [...articleForm.tags, tagInput] }); setTagInput(''); } }} /><Button variant="outline" onClick={() => { if (tagInput) { setArticleForm({ ...articleForm, tags: [...articleForm.tags, tagInput] }); setTagInput(''); } }}>Add</Button></div>
                  <div className="flex flex-wrap gap-1">{articleForm.tags.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div>
                  <Button className="w-full" disabled={!articleForm.title || !articleForm.content || addArticleMutation.isPending} onClick={() => addArticleMutation.mutate(articleForm)}>Add Article</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((a: any) => (
              <Card key={a.id}><CardContent className="pt-6"><div className="flex items-start justify-between mb-2"><h3 className="font-semibold">{a.title}</h3><Badge variant="outline">{a.category}</Badge></div><p className="text-sm text-muted-foreground line-clamp-3">{a.content}</p><div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{a.viewCount} views</span><span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{a.helpfulCount} helpful</span></div></CardContent></Card>
            ))}
            {articles.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No articles yet. Add your first knowledge base article above.</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
