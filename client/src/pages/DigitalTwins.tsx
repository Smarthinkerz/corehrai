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
  Plus, Brain, Play, Trash2, Cpu, GitBranch, FlaskConical,
  Plug, PlugZap, ExternalLink, Wifi, WifiOff, Users,
  RefreshCw, Eye, Database, Activity, Settings, BarChart3, CheckCircle
} from "lucide-react";
import { useState } from "react";

const DT_PLATFORMS = [
  { value: 'azure_digital_twins', label: 'Azure Digital Twins', desc: 'Enterprise-grade with IoT & AI analytics', color: 'from-blue-600 to-cyan-500' },
  { value: 'microsoft_mesh', label: 'Microsoft Mesh', desc: 'Immersive 3D workforce simulations', color: 'from-purple-600 to-indigo-500' },
  { value: 'unity_ai', label: 'Unity + AI Plugins', desc: 'Custom digital twin environments', color: 'from-gray-700 to-gray-500' },
  { value: 'virti', label: 'Virti Digital Twins', desc: 'AI-driven employee avatars & analytics', color: 'from-green-600 to-emerald-500' },
];

const SCENARIO_TYPES = [
  { value: 'restructuring', label: 'Organizational Restructuring', icon: '🏢' },
  { value: 'hiring', label: 'Hiring Plan Simulation', icon: '👥' },
  { value: 'attrition', label: 'Attrition Impact Analysis', icon: '📉' },
  { value: 'budget', label: 'Budget Scenario Planning', icon: '💰' },
  { value: 'growth', label: 'Growth Projection', icon: '📈' },
];

export default function DigitalTwins() {
  usePageTitle("/digital-twins");
  const { toast } = useToast();
  const { data: scenarios = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/digital-twins'] });
  const { data: dtStats } = useQuery<any>({ queryKey: ['/api/digital-twins/stats/overview'] });
  const { data: platforms = [] } = useQuery<any[]>({ queryKey: ['/api/digital-twins/platforms/all'] });
  const [createOpen, setCreateOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailScenario, setDetailScenario] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', scenarioType: '', platform: 'azure_digital_twins' });
  const [connectForm, setConnectForm] = useState({ apiKey: '', apiEndpoint: '' });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest('POST', '/api/digital-twins', data); return res.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/digital-twins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/digital-twins/stats/overview'] });
      toast({ title: 'Scenario created with employee digital twins' });
      setCreateOpen(false);
      setForm({ name: '', description: '', scenarioType: '', platform: 'azure_digital_twins' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const simulateMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest('POST', `/api/digital-twins/${id}/simulate`); return res.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/digital-twins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/digital-twins/stats/overview'] });
      setSelectedResult(data);
      toast({ title: 'Simulation complete' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest('POST', `/api/digital-twins/${id}/sync-data`); return res.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/digital-twins'] });
      toast({ title: `Synced ${data.twinsUpdated} digital twins` });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const connectMutation = useMutation({
    mutationFn: async ({ platform, data }: { platform: string; data: any }) => { const res = await apiRequest('POST', `/api/digital-twins/platforms/${platform}/connect`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/digital-twins/platforms/all'] }); toast({ title: 'Platform connected!' }); setConnectOpen(null); setConnectForm({ apiKey: '', apiEndpoint: '' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => { await apiRequest('POST', `/api/digital-twins/platforms/${platform}/disconnect`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/digital-twins/platforms/all'] }); toast({ title: 'Disconnected' }); },
  });

  const viewDetailMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest('GET', `/api/digital-twins/${id}`); return res.json(); },
    onSuccess: (data) => setDetailScenario(data),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/digital-twins/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/digital-twins'] }); queryClient.invalidateQueries({ queryKey: ['/api/digital-twins/stats/overview'] }); toast({ title: 'Scenario deleted' }); }
  });

  const statusColors: Record<string, string> = { draft: 'secondary', running: 'default', completed: 'default' };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-7 w-7 text-primary" /> Employee Digital Twins</h1>
          <p className="text-muted-foreground mt-1">Simulated workforce scenarios linked to digital twin platforms</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Scenario</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Digital Twin Scenario</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Scenario Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Select value={form.scenarioType} onValueChange={v => setForm({ ...form, scenarioType: v })}>
                <SelectTrigger><SelectValue placeholder="Scenario Type" /></SelectTrigger>
                <SelectContent>{SCENARIO_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.platform} onValueChange={v => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DT_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label} — {p.desc}</SelectItem>)}</SelectContent>
              </Select>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Digital Twin Provisioning</p>
                <p className="text-muted-foreground">A digital twin of each employee will be created on <strong>{DT_PLATFORMS.find(p => p.value === form.platform)?.label}</strong> using real HR data (attendance, performance, surveys). The platform will generate a unique scenario ID, simulation URL, and analytics dashboard.</p>
              </div>
              <Button className="w-full" disabled={!form.name || !form.scenarioType || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? 'Creating Twins & Provisioning...' : 'Create & Provision on Platform'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="scenarios">
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="platforms">Platform Connections</TabsTrigger>
          <TabsTrigger value="architecture">How It Works</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-indigo-100"><Cpu className="h-5 w-5 text-indigo-600" /></div><div><p className="text-sm text-muted-foreground">Scenarios</p><p className="text-2xl font-bold">{dtStats?.totalScenarios || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-green-100"><FlaskConical className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{dtStats?.completedSimulations || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Employee Twins</p><p className="text-2xl font-bold">{dtStats?.totalEmployeeTwins || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-orange-100"><GitBranch className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Types Used</p><p className="text-2xl font-bold">{dtStats?.scenarioTypes?.length || 0}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><div className="p-2 rounded-lg bg-sky-100"><Plug className="h-5 w-5 text-sky-600" /></div><div><p className="text-sm text-muted-foreground">Connected</p><p className="text-2xl font-bold">{dtStats?.connectedPlatforms || 0}/4</p></div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((s: any) => {
              const platInfo = DT_PLATFORMS.find(p => p.value === s.platform);
              const twinCount = (s.employeeTwins as any[] || []).length;
              return (
                <Card key={s.id} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${platInfo?.color || 'from-gray-400 to-gray-500'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewDetailMutation.mutate(s.id)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => syncMutation.mutate(s.id)} disabled={syncMutation.isPending}><RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {s.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{platInfo?.label || s.platform}</Badge>
                      <Badge variant="secondary">{SCENARIO_TYPES.find(t => t.value === s.scenarioType)?.label || s.scenarioType}</Badge>
                      <Badge variant={statusColors[s.status] as any || 'secondary'}>{s.status}</Badge>
                    </div>

                    {s.externalScenarioId && (
                      <div className="bg-muted p-2 rounded-lg mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Platform ID</p>
                          <p className="text-xs font-mono">{s.externalScenarioId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Twins</p>
                          <p className="text-sm font-bold">{twinCount}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {s.simulationUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={s.simulationUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> View on Platform</a>
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {s.status !== 'completed' && (
                          <Button variant="default" size="sm" onClick={() => simulateMutation.mutate(s.id)} disabled={simulateMutation.isPending}>
                            <Play className="h-3 w-3 mr-1" /> {simulateMutation.isPending ? 'Running...' : 'Run Simulation'}
                          </Button>
                        )}
                        {s.status === 'completed' && <Button variant="outline" size="sm" onClick={() => setSelectedResult(s)}><BarChart3 className="h-3 w-3 mr-1" /> Results</Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {scenarios.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No scenarios yet. Create one to provision digital twins of your workforce on a simulation platform.</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DT_PLATFORMS.map(p => {
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
                      <div className="flex justify-between"><span className="text-muted-foreground">API Endpoint</span><span className="font-mono text-xs truncate max-w-[200px]">{config?.apiEndpoint || 'Not configured'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">API Key</span><span>{config?.apiKeyConfigured ? 'Configured' : 'Not set'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Scenarios</span><span>{scenarios.filter((s: any) => s.platform === p.value).length}</span></div>
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
                                <p className="font-medium text-blue-800 mb-1">Setup instructions:</p>
                                <ol className="text-blue-700 space-y-1 list-decimal ml-4">
                                  {p.value === 'azure_digital_twins' && <>
                                    <li>Go to Azure Portal and create a Digital Twins instance</li>
                                    <li>Navigate to Settings and generate an API key / service principal</li>
                                    <li>Copy the endpoint URL and credentials</li>
                                  </>}
                                  {p.value === 'microsoft_mesh' && <>
                                    <li>Open the Microsoft 365 Admin Center</li>
                                    <li>Enable Mesh and register your app in Azure AD</li>
                                    <li>Copy the Graph API credentials</li>
                                  </>}
                                  {p.value === 'unity_ai' && <>
                                    <li>Log into Unity Cloud Dashboard</li>
                                    <li>Create a new project for HR Digital Twins</li>
                                    <li>Generate a Cloud API key under Settings</li>
                                  </>}
                                  {p.value === 'virti' && <>
                                    <li>Log into your Virti admin dashboard</li>
                                    <li>Navigate to API and Integrations</li>
                                    <li>Generate a Digital Twins API key</li>
                                  </>}
                                  <li>Paste the credentials below</li>
                                </ol>
                              </div>
                              <Input type="password" placeholder="API Key / Service Principal Secret" value={connectForm.apiKey} onChange={e => setConnectForm({ ...connectForm, apiKey: e.target.value })} />
                              <Input placeholder={`API Endpoint (default: auto-detected)`} value={connectForm.apiEndpoint} onChange={e => setConnectForm({ ...connectForm, apiEndpoint: e.target.value })} />
                              <div className="bg-muted p-3 rounded-lg text-sm">
                                <p className="font-medium mb-1">Webhook URL for {p.label}:</p>
                                <code className="text-xs bg-background p-1 rounded block break-all">{`${window.location.origin}/api/digital-twins/webhooks/${p.value}`}</code>
                                <p className="text-muted-foreground mt-1 text-xs">Configure this in your {p.label} settings to receive simulation results and twin updates automatically.</p>
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
                      <Button variant="ghost" size="sm" asChild>
                        <a href={config?.docsUrl || '#'} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Docs</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Digital Twin Integration Architecture</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Database className="h-5 w-5 text-blue-600" /></div>
                  <h4 className="font-semibold text-sm">1. Data Ingestion</h4>
                  <p className="text-sm text-muted-foreground">Employee records, attendance, performance reviews, surveys, and org structure are pulled from the HR database to create each digital twin's data profile.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center"><Users className="h-5 w-5 text-indigo-600" /></div>
                  <h4 className="font-semibold text-sm">2. Twin Provisioning</h4>
                  <p className="text-sm text-muted-foreground">Each employee gets a unique digital twin ID on the selected platform. The twin mirrors their role, department, tenure, skills, and behavioral data.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><Activity className="h-5 w-5 text-green-600" /></div>
                  <h4 className="font-semibold text-sm">3. Simulation Engine</h4>
                  <p className="text-sm text-muted-foreground">Run what-if scenarios (restructuring, hiring, attrition) and the platform's AI processes all twins simultaneously, predicting impacts across the organization.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-orange-600" /></div>
                  <h4 className="font-semibold text-sm">4. Results & Sync</h4>
                  <p className="text-sm text-muted-foreground">Simulation results flow back via webhooks with per-employee predictions, risk scores, and AI recommendations. Data stays synced with live HR records.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Data Sources for Digital Twins</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['Employee Records', 'Org Structure', 'Performance Reviews', 'Attendance Data', 'Survey Responses'].map((src, i) => (
                  <div key={i} className="text-center p-3 rounded-lg border">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">{src}</p>
                    <p className="text-xs text-muted-foreground">Auto-synced</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {detailScenario && (
        <Dialog open={!!detailScenario} onOpenChange={() => setDetailScenario(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{detailScenario.name} — Details</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Platform:</span> <strong>{DT_PLATFORMS.find(p => p.value === detailScenario.platform)?.label}</strong></div>
                <div><span className="text-muted-foreground">Scenario ID:</span> <strong className="font-mono text-xs">{detailScenario.externalScenarioId}</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusColors[detailScenario.status] as any}>{detailScenario.status}</Badge></div>
                <div><span className="text-muted-foreground">Type:</span> <strong>{SCENARIO_TYPES.find(t => t.value === detailScenario.scenarioType)?.label}</strong></div>
              </div>

              {detailScenario.simulationUrl && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Simulation URL</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs flex-1 break-all">{detailScenario.simulationUrl}</code>
                    <Button size="sm" variant="outline" asChild><a href={detailScenario.simulationUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>
                  </div>
                </div>
              )}

              {(detailScenario.employeeTwins as any[] || []).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Employee Digital Twins ({(detailScenario.employeeTwins as any[]).length})</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {(detailScenario.employeeTwins as any[]).map((twin: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div>
                          <p className="font-medium">{twin.name}</p>
                          <p className="text-xs text-muted-foreground">{twin.position} — {twin.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs">{twin.twinId}</p>
                          <Badge variant={twin.status === 'synced' ? 'default' : 'secondary'} className="text-xs">{twin.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(detailScenario.dataSources as any[] || []).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Data Sources</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {(detailScenario.dataSources as any[]).map((ds: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                        <span>{ds.source}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{ds.records} records</span>
                          <Badge variant={ds.synced ? 'default' : 'secondary'}>{ds.synced ? 'Synced' : 'Pending'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedResult && selectedResult.results && Object.keys(selectedResult.results).length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Simulation Results: {selectedResult.name}</CardTitle>
                {selectedResult.simulationMetrics && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedResult.simulationMetrics as any).twinsProcessed} twins processed | {(selectedResult.simulationMetrics as any).dataPointsAnalyzed} data points | {(selectedResult.simulationMetrics as any).confidenceLevel}% confidence | AI: {(selectedResult.simulationMetrics as any).aiModelVersion}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {selectedResult.launchDetails?.dashboardUrl && (
                  <Button variant="outline" size="sm" asChild><a href={selectedResult.launchDetails.dashboardUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Platform Dashboard</a></Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedResult.results as Record<string, any>).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                  {Array.isArray(value) ? (
                    <div className="space-y-1">
                      {(value as any[]).map((v, i) => (
                        <div key={i} className="text-sm">
                          {typeof v === 'object' ? (
                            <div className="p-2 rounded border bg-background text-xs">
                              {Object.entries(v).map(([vk, vv]) => (
                                <div key={vk} className="flex justify-between">
                                  <span className="text-muted-foreground">{vk.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="font-medium">{String(vv)}</span>
                                </div>
                              ))}
                            </div>
                          ) : <span>{String(v)}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-semibold">{typeof value === 'number' ? value.toLocaleString() : String(value)}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
