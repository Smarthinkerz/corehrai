import usePageTitle from "@/hooks/usePageTitle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus, Headphones, Monitor, BarChart3, Users, Trash2, Zap,
  Plug, PlugZap, ExternalLink, Play, Settings, Wifi, WifiOff,
  Rocket, Eye, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import { useState } from "react";

const PLATFORMS = [
  { value: 'virti', label: 'Virti', desc: 'AI-powered VR simulations with analytics', color: 'from-purple-500 to-indigo-600' },
  { value: 'virtway', label: 'Virtway', desc: 'Scalable gamified onboarding with AI mentors', color: 'from-blue-500 to-cyan-600' },
  { value: 'engage_xr', label: 'Engage XR', desc: 'Enterprise VR collaboration platform', color: 'from-green-500 to-emerald-600' },
  { value: 'spatial', label: 'Spatial.io', desc: 'Immersive 3D workspaces with avatars', color: 'from-orange-500 to-amber-600' },
];

const CATEGORIES = ['Onboarding', 'Compliance', 'Leadership', 'Customer Service', 'Soft Skills', 'Technical', 'Safety', 'Diversity & Inclusion'];

export default function VRTraining() {
  usePageTitle("/vr-training");
  const { toast } = useToast();
  const { data: modules = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/vr-training/modules'] });
  const { data: stats } = useQuery<any>({ queryKey: ['/api/vr-training/stats'] });
  const { data: platforms = [] } = useQuery<any[]>({ queryKey: ['/api/vr-training/platforms'] });
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const [createOpen, setCreateOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState<string | null>(null);
  const [launchOpen, setLaunchOpen] = useState<any>(null);
  const [launchResult, setLaunchResult] = useState<any>(null);
  const [detailModule, setDetailModule] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', platform: 'virti', category: '', difficulty: 'beginner', duration: 30, department: '' });
  const [connectForm, setConnectForm] = useState({ apiKey: '', apiEndpoint: '' });
  const [launchForm, setLaunchForm] = useState({ employeeId: '', deviceType: 'browser' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/vr-training/modules', data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/vr-training/modules'] }); queryClient.invalidateQueries({ queryKey: ['/api/vr-training/stats'] }); toast({ title: 'VR Training module created and linked to metaverse' }); setCreateOpen(false); setForm({ title: '', description: '', platform: 'virti', category: '', difficulty: 'beginner', duration: 30, department: '' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const connectMutation = useMutation({
    mutationFn: async ({ platform, data }: { platform: string; data: any }) => { const res = await apiRequest('POST', `/api/vr-training/platforms/${platform}/connect`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/vr-training/platforms'] }); toast({ title: 'Platform connected!' }); setConnectOpen(null); setConnectForm({ apiKey: '', apiEndpoint: '' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => { const res = await apiRequest('POST', `/api/vr-training/platforms/${platform}/disconnect`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/vr-training/platforms'] }); toast({ title: 'Platform disconnected' }); },
  });

  const launchMutation = useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: number; data: any }) => { const res = await apiRequest('POST', `/api/vr-training/modules/${moduleId}/launch`, data); return res.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vr-training/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vr-training/stats'] });
      setLaunchResult(data);
      toast({ title: 'VR Session launched!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/vr-training/modules/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/vr-training/modules'] }); queryClient.invalidateQueries({ queryKey: ['/api/vr-training/stats'] }); toast({ title: 'Module deleted' }); }
  });

  const viewModuleMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest('GET', `/api/vr-training/modules/${id}`); return res.json(); },
    onSuccess: (data) => setDetailModule(data),
  });

  const diffColors: Record<string, string> = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' };
  const statusIcons: Record<string, any> = { completed: CheckCircle, in_progress: Clock, launched: Rocket, not_started: AlertCircle, failed: AlertCircle };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Headphones className="h-7 w-7 text-primary" /> Metaverse HR Training</h1>
          <p className="text-muted-foreground mt-1">AI-driven VR employee training linked to metaverse platforms</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Module</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create VR Training Module</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Module Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Select value={form.platform} onValueChange={v => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label} — {p.desc}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Duration (min)" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} />
              </div>
              <Input placeholder="Department (optional)" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Metaverse Integration</p>
                <p className="text-muted-foreground">This module will be automatically provisioned on <strong>{PLATFORMS.find(p => p.value === form.platform)?.label}</strong> with a unique environment ID, launch URL, and real-time analytics tracking.</p>
              </div>
              <Button className="w-full" disabled={!form.title || !form.category || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? 'Creating & Provisioning...' : 'Create & Link to Metaverse'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="platforms">Platform Connections</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Monitor className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Modules</p><p className="text-2xl font-bold">{stats?.totalModules || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><Zap className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{stats?.activeModules || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><BarChart3 className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Completion Rate</p><p className="text-2xl font-bold">{stats?.avgCompletionRate || 0}%</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><Rocket className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Total Sessions</p><p className="text-2xl font-bold">{stats?.totalSessions || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-sky-100"><Plug className="h-5 w-5 text-sky-600" /></div><div><p className="text-sm text-muted-foreground">Connected</p><p className="text-2xl font-bold">{stats?.connectedPlatforms || 0}/4</p></div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m: any) => {
              const platInfo = PLATFORMS.find(p => p.value === m.platform);
              return (
                <Card key={m.id} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${platInfo?.color || 'from-gray-400 to-gray-500'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{m.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewModuleMutation.mutate(m.id)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {m.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{m.description}</p>}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{platInfo?.label || m.platform}</Badge>
                      <Badge variant="secondary">{m.category}</Badge>
                      <Badge className={diffColors[m.difficulty] || ''}>{m.difficulty}</Badge>
                    </div>

                    {m.externalModuleId && (
                      <div className="bg-muted p-2 rounded-lg mb-3">
                        <p className="text-xs text-muted-foreground">Metaverse ID</p>
                        <p className="text-xs font-mono">{m.externalModuleId}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{m.duration} min</span>
                      <div className="flex gap-1">
                        {m.launchUrl && (
                          <Button variant="outline" size="sm" onClick={() => { setLaunchOpen(m); setLaunchResult(null); setLaunchForm({ employeeId: '', deviceType: 'browser' }); }}>
                            <Rocket className="h-3 w-3 mr-1" /> Launch
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {modules.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No VR training modules yet. Create your first module to provision it on a metaverse platform.</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLATFORMS.map(p => {
              const config = platforms.find((c: any) => c.platform === p.value);
              const isConnected = config?.status === 'connected';
              return (
                <Card key={p.value} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${p.color}`} />
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {p.label}
                          {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
                        </h3>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </div>
                      <Badge variant={isConnected ? 'default' : 'secondary'}>{config?.status || 'disconnected'}</Badge>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-muted-foreground">API Endpoint</span><span className="font-mono text-xs">{config?.apiEndpoint || 'Not configured'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">API Key</span><span>{config?.apiKeyConfigured ? '••••••••configured' : 'Not set'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Modules</span><span>{modules.filter((m: any) => m.platform === p.value).length}</span></div>
                      {config?.lastSyncedAt && <div className="flex justify-between"><span className="text-muted-foreground">Last Synced</span><span>{new Date(config.lastSyncedAt).toLocaleString()}</span></div>}
                    </div>

                    <div className="flex gap-2">
                      {!isConnected ? (
                        <Dialog open={connectOpen === p.value} onOpenChange={(o) => setConnectOpen(o ? p.value : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="flex-1"><PlugZap className="h-3 w-3 mr-1" /> Connect</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Connect to {p.label}</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                                <p className="font-medium text-blue-800 mb-1">How to get your API key:</p>
                                <ol className="text-blue-700 space-y-1 list-decimal ml-4">
                                  <li>Log into your {p.label} admin dashboard</li>
                                  <li>Navigate to Settings → API & Integrations</li>
                                  <li>Generate a new API key for CoreHR AI integration</li>
                                  <li>Copy the key and paste it below</li>
                                </ol>
                              </div>
                              <Input type="password" placeholder="API Key" value={connectForm.apiKey} onChange={e => setConnectForm({ ...connectForm, apiKey: e.target.value })} />
                              <Input placeholder={`API Endpoint (default: ${config?.apiEndpoint || 'auto-detected'})`} value={connectForm.apiEndpoint} onChange={e => setConnectForm({ ...connectForm, apiEndpoint: e.target.value })} />
                              <div className="bg-muted p-3 rounded-lg text-sm">
                                <p className="font-medium mb-1">Webhook URL for {p.label}:</p>
                                <code className="text-xs bg-background p-1 rounded block">{`${window.location.origin}/api/vr-training/webhooks/${p.value}`}</code>
                                <p className="text-muted-foreground mt-1 text-xs">Add this URL in your {p.label} webhook settings to receive session completion data and scores automatically.</p>
                              </div>
                              <Button className="w-full" disabled={!connectForm.apiKey || connectMutation.isPending} onClick={() => connectMutation.mutate({ platform: p.value, data: connectForm })}>
                                {connectMutation.isPending ? 'Connecting...' : `Connect to ${p.label}`}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => disconnectMutation.mutate(p.value)}>
                          <WifiOff className="h-3 w-3 mr-1" /> Disconnect
                        </Button>
                      )}
                      {config?.apiEndpoint && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={config.docsUrl || '#'} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Docs</a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Integration Architecture</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">1. Module Creation</h4>
                  <p className="text-sm text-muted-foreground">When you create a module, CoreHR AI provisions it on the selected platform with a unique environment ID, launch URL, and tracking configuration.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">2. Session Launch</h4>
                  <p className="text-sm text-muted-foreground">Launching a session generates a personalized VR entry link for the employee. They click it to enter the metaverse training environment on any supported device.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">3. Data Sync</h4>
                  <p className="text-sm text-muted-foreground">The VR platform sends completion data, scores, and AI assessments back via webhooks. CoreHR AI automatically updates employee records and analytics.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Rocket className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Active Now</p><p className="text-2xl font-bold">{stats?.activeSessions || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{stats?.completedSessions || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><BarChart3 className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Total Sessions</p><p className="text-2xl font-bold">{stats?.totalSessions || 0}</p></div></CardContent></Card>
          </div>

          {detailModule && detailModule.sessions && detailModule.sessions.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{detailModule.title} — Sessions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setDetailModule(null)}>Close</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detailModule.sessions.map((s: any) => {
                    const SIcon = statusIcons[s.status] || AlertCircle;
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <SIcon className={`h-5 w-5 ${s.status === 'completed' ? 'text-green-500' : s.status === 'in_progress' ? 'text-blue-500' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium">{s.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{s.employeePosition}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status}</Badge>
                          {s.score !== null && <span className="font-medium">{s.score}%</span>}
                          {s.sessionUrl && s.status !== 'completed' && (
                            <Button variant="outline" size="sm" asChild><a href={s.sessionUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Enter VR</a></Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              {detailModule ? 'No sessions for this module yet.' : 'Click the eye icon on a module to view its sessions, or launch a new VR session.'}
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!launchOpen} onOpenChange={(o) => { if (!o) { setLaunchOpen(null); setLaunchResult(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Launch VR Session — {launchOpen?.title}</DialogTitle></DialogHeader>
          {!launchResult ? (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{PLATFORMS.find(p => p.value === launchOpen?.platform)?.label}</Badge>
                  <span className="text-sm text-muted-foreground">{launchOpen?.duration} min</span>
                </div>
                <p className="text-sm">{launchOpen?.description}</p>
              </div>
              <Select value={launchForm.employeeId} onValueChange={v => setLaunchForm({ ...launchForm, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.fullName} — {e.position}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={launchForm.deviceType} onValueChange={v => setLaunchForm({ ...launchForm, deviceType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">Desktop Browser</SelectItem>
                  <SelectItem value="vr_headset">VR Headset (Oculus/HTC Vive)</SelectItem>
                  <SelectItem value="mobile">Mobile Device</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" disabled={!launchForm.employeeId || launchMutation.isPending} onClick={() => launchMutation.mutate({ moduleId: launchOpen.id, data: { employeeId: parseInt(launchForm.employeeId), deviceType: launchForm.deviceType } })}>
                <Rocket className="h-4 w-4 mr-2" /> {launchMutation.isPending ? 'Launching VR Environment...' : 'Launch VR Session'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> VR Session Ready!</h4>
                <p className="text-sm text-green-700 mt-1">The metaverse environment has been provisioned for <strong>{launchResult.launchDetails.employeeName}</strong>.</p>
              </div>

              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Session Entry Link</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background p-2 rounded flex-1 break-all">{launchResult.launchDetails.sessionUrl}</code>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(launchResult.launchDetails.sessionUrl); toast({ title: 'Link copied!' }); }}>Copy</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Platform:</span> <strong>{launchResult.launchDetails.platformName}</strong></div>
                  <div><span className="text-muted-foreground">Session ID:</span> <strong className="font-mono text-xs">{launchResult.launchDetails.externalSessionId}</strong></div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Supported Devices:</p>
                  <div className="flex gap-2">{(launchResult.launchDetails.supportedDevices || []).map((d: string, i: number) => <Badge key={i} variant="outline">{d}</Badge>)}</div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Instructions:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
                    {(launchResult.launchDetails.instructions || []).map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                  </ol>
                </div>
              </div>

              <Button className="w-full" variant="outline" asChild>
                <a href={launchResult.launchDetails.sessionUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open VR Environment
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
