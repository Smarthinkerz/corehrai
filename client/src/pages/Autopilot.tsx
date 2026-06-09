import usePageTitle from "@/hooks/usePageTitle";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, AlertTriangle, Bot, CheckCircle2, Clock, Pause, Play,
  Shield, Sparkles, XCircle, Zap, Loader2,
} from "lucide-react";

type Mode = "manual" | "suggest" | "auto";

interface Workflow {
  key: string;
  label: string;
  category: string;
  description: string;
  autoAllowed: boolean;
  autoRestrictedReason?: string;
}

interface Policy {
  id: number;
  workflowKey: string;
  mode: Mode;
  enabled: boolean;
}

interface Action {
  id: number;
  workflowKey: string;
  mode: string;
  status: string;
  title: string;
  summary: string | null;
  decidedBy: string;
  createdAt: string;
  errorMessage: string | null;
}

interface Stats {
  workflowsTotal: number;
  workflowsAuto: number;
  workflowsSuggest: number;
  workflowsManual: number;
  actions24h: number;
  actionsExecuted24h: number;
  actionsPending: number;
  actionsFailed24h: number;
}

interface KillSwitch { paused: boolean; reason: string | null; }

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent: string }) {
  usePageTitle("/autopilot");
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent}`}><Icon className="h-5 w-5 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModePill({ mode, autoAllowed }: { mode: Mode; autoAllowed: boolean }) {
  if (mode === "auto") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Zap className="h-3 w-3 mr-1" />Auto</Badge>;
  if (mode === "suggest") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Sparkles className="h-3 w-3 mr-1" />Suggest</Badge>;
  return <Badge variant="secondary">{autoAllowed ? "Manual" : "Manual (locked)"}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    executed: { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Executed" },
    pending: { cls: "bg-amber-100 text-amber-700", icon: Clock, label: "Pending approval" },
    approved: { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Approved" },
    rejected: { cls: "bg-slate-100 text-slate-700", icon: XCircle, label: "Rejected" },
    failed: { cls: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Failed" },
  };
  const m = map[status] || map.rejected;
  const Icon = m.icon;
  return <Badge className={`${m.cls} hover:${m.cls}`}><Icon className="h-3 w-3 mr-1" />{m.label}</Badge>;
}

export default function Autopilot() {
  const { toast } = useToast();
  const [confirmingPause, setConfirmingPause] = useState(false);

  const { data: workflows = [] } = useQuery<Workflow[]>({ queryKey: ["/api/autopilot/workflows"] });
  const { data: policies = [] } = useQuery<Policy[]>({ queryKey: ["/api/autopilot/policies"] });
  const { data: actions = [], isLoading: actionsLoading } = useQuery<Action[]>({
    queryKey: ["/api/autopilot/actions"],
    refetchInterval: 5000,
  });
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/autopilot/stats"], refetchInterval: 10000 });
  const { data: killSwitch } = useQuery<KillSwitch>({ queryKey: ["/api/autopilot/kill-switch"] });

  const policyByKey = new Map(policies.map((p) => [p.workflowKey, p]));

  const updatePolicy = useMutation({
    mutationFn: async (vars: { workflowKey: string; mode: Mode; enabled?: boolean }) => {
      const res = await apiRequest("PUT", "/api/autopilot/policies", vars);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/stats"] });
    },
    onError: (e: any) => toast({ title: "Cannot update policy", description: e.message, variant: "destructive" }),
  });

  const approveAction = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/autopilot/actions/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/stats"] });
      toast({ title: "Action approved" });
    },
  });

  const rejectAction = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/autopilot/actions/${id}/reject`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/stats"] });
      toast({ title: "Action rejected" });
    },
  });

  const toggleKill = useMutation({
    mutationFn: async (paused: boolean) => {
      const res = await apiRequest("POST", "/api/autopilot/kill-switch", { paused, reason: paused ? "Manual pause from operations center" : null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopilot/kill-switch"] });
      setConfirmingPause(false);
    },
  });

  const groupedWorkflows = workflows.reduce<Record<string, Workflow[]>>((acc, w) => {
    (acc[w.category] = acc[w.category] || []).push(w);
    return acc;
  }, {});

  const isPaused = !!killSwitch?.paused;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            AI Autopilot
          </h1>
          <p className="text-muted-foreground mt-1">Run your HR operations on autopilot. Choose Manual, Suggest, or Auto for every workflow.</p>
        </div>
        <div className="flex items-center gap-2">
          {isPaused ? (
            <Button onClick={() => toggleKill.mutate(false)} disabled={toggleKill.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              <Play className="h-4 w-4 mr-2" /> Resume Autopilot
            </Button>
          ) : confirmingPause ? (
            <>
              <span className="text-sm text-amber-700 font-medium">Pause all autonomous actions?</span>
              <Button variant="ghost" onClick={() => setConfirmingPause(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => toggleKill.mutate(true)} disabled={toggleKill.isPending}>Confirm pause</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmingPause(true)}>
              <Pause className="h-4 w-4 mr-2" /> Pause Autopilot
            </Button>
          )}
        </div>
      </div>

      {isPaused && (
        <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Autopilot is paused</p>
            <p className="text-sm text-red-700">All autonomous actions are suspended. AI will record decisions but not execute them. {killSwitch?.reason && <em>Reason: {killSwitch.reason}</em>}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Workflows on Auto" value={stats?.workflowsAuto ?? 0} accent="bg-emerald-500" />
        <StatCard icon={Sparkles} label="Workflows on Suggest" value={stats?.workflowsSuggest ?? 0} accent="bg-blue-500" />
        <StatCard icon={Activity} label="Actions (24h)" value={stats?.actions24h ?? 0} accent="bg-indigo-500" />
        <StatCard icon={Clock} label="Pending approval" value={stats?.actionsPending ?? 0} accent="bg-amber-500" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Workflow policies</CardTitle>
              <CardDescription>Set the autonomy level for each HR workflow. Locked workflows require human sign-off by law.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedWorkflows).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{category}</h3>
                  <div className="space-y-2">
                    {items.map((w) => {
                      const policy = policyByKey.get(w.key);
                      const mode: Mode = (policy?.mode as Mode) || "manual";
                      return (
                        <div key={w.key} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{w.label}</p>
                              <ModePill mode={mode} autoAllowed={w.autoAllowed} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{w.description}</p>
                            {!w.autoAllowed && <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1"><Shield className="h-3 w-3" /> {w.autoRestrictedReason}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {(["manual", "suggest", "auto"] as Mode[]).map((m) => {
                              const disabled = m === "auto" && !w.autoAllowed;
                              const active = mode === m;
                              return (
                                <button
                                  key={m}
                                  disabled={disabled || updatePolicy.isPending}
                                  onClick={() => updatePolicy.mutate({ workflowKey: w.key, mode: m })}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                                    active ? "bg-slate-900 text-white" : disabled ? "opacity-40 cursor-not-allowed text-muted-foreground" : "bg-muted text-muted-foreground hover:bg-slate-200"
                                  }`}
                                  data-testid={`policy-${w.key}-${m}`}
                                >
                                  {m[0].toUpperCase() + m.slice(1)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Live action feed</CardTitle>
              <CardDescription>Every autonomous decision the AI makes — approve or reject pending suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
              {actionsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : actions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No autopilot actions yet. Once a workflow is set to Suggest or Auto, AI decisions will appear here in real time.</div>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {actions.map((a) => {
                    const wf = workflows.find((w) => w.key === a.workflowKey);
                    return (
                      <div key={a.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{wf?.label || a.workflowKey} · {new Date(a.createdAt).toLocaleString()}</p>
                          </div>
                          <StatusBadge status={a.status} />
                        </div>
                        {a.summary && <p className="text-xs text-muted-foreground mt-2">{a.summary}</p>}
                        {a.errorMessage && <p className="text-xs text-red-600 mt-1">{a.errorMessage}</p>}
                        {a.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="h-7 text-xs" onClick={() => approveAction.mutate(a.id)} disabled={approveAction.isPending}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectAction.mutate(a.id)} disabled={rejectAction.isPending}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4 text-xs text-amber-900 space-y-2">
              <p className="font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Why some workflows are locked</p>
              <p>Hiring decisions, terminations, compensation, and payroll release require human sign-off under EEOC, EU AI Act, GDPR Art. 22, and most banking regulations. Autopilot can draft, recommend, and prepare every step — a human approves the final action.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
