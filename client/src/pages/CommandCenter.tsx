import usePageTitle from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, Brain, Building2, ChevronRight,
  Flame, Gauge, HeartPulse, Loader2, Radar, Rocket, Shield, Sparkles, TrendingUp,
  Users, Zap,
} from "lucide-react";
import { Link } from "wouter";

interface Overview {
  orgHealthScore: number;
  healthBand: "excellent" | "healthy" | "watch" | "critical";
  kpis: {
    totalEmployees: number;
    openRoles: number;
    activeCandidates: number;
    hiringVelocity: number;
    activeSurveys: number;
    orgHealthScore: number;
    retentionScore: number;
    sentimentScore: number;
    productivityScore: number;
    engagementScore: number;
    criticalAlerts: number;
    autopilotActionsToday: number;
  };
  alerts: Array<{ id: string; severity: "critical" | "high" | "medium"; title: string; detail: string; category: string }>;
  departmentHeatmap: Array<{ department: string; headcount: number; sentiment: number | null; mood: string; riskScore: number; health: number }>;
  recentAIActions: Array<{ id: number; title: string; summary: string; workflowKey: string; status: string; createdAt: string }>;
  activitySparkline: Array<{ date: string; count: number }>;
  generatedAt: string;
}

const healthBandColor: Record<string, string> = {
  excellent: "from-emerald-500 to-teal-500",
  healthy: "from-blue-500 to-cyan-500",
  watch: "from-amber-500 to-orange-500",
  critical: "from-rose-500 to-red-600",
};

const healthBandLabel: Record<string, string> = {
  excellent: "Excellent",
  healthy: "Healthy",
  watch: "Watch",
  critical: "Critical",
};

const severityColor = {
  critical: "bg-rose-500/15 text-rose-700 border-rose-300",
  high: "bg-orange-500/15 text-orange-700 border-orange-300",
  medium: "bg-amber-500/15 text-amber-700 border-amber-300",
} as const;

function HealthGauge({ score, band }: { score: number; band: string }) {
  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const gradId = `gauge-${band}`;
  const stops: Record<string, [string, string]> = {
    excellent: ["#10b981", "#14b8a6"],
    healthy: ["#3b82f6", "#06b6d4"],
    watch: ["#f59e0b", "#f97316"],
    critical: ["#f43f5e", "#dc2626"],
  };
  const [from, to] = stops[band] || stops.healthy;
  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px]">
      <svg width="200" height="200" className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={radius} stroke="rgba(148,163,184,0.18)" strokeWidth="14" fill="none" />
        <circle
          cx="100" cy="100" r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth="14" fill="none" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent" data-testid="text-org-health-score">{score}</span>
        <span className="text-xs uppercase tracking-widest font-bold text-slate-500">Org Health</span>
        <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${healthBandColor[band] || healthBandColor.healthy}`}>
          {healthBandLabel[band] || "Healthy"}
        </span>
      </div>
    </div>
  );
}

function MiniBar({ value, max = 100, gradient = "from-blue-500 to-purple-500" }: { value: number; max?: number; gradient?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Sparkline({ data }: { data: Array<{ date: string; count: number }> }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 280, h = 50;
  const step = w / (data.length - 1 || 1);
  const points = data.map((d, i) => `${i * step},${h - (d.count / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#spark-grad)" />
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CommandCenter() {
  usePageTitle("/command-center");
  const { data, isLoading } = useQuery<Overview>({
    queryKey: ["/api/command-center/overview"],
    refetchInterval: 30000,
  });
  const { data: summary, isLoading: summaryLoading } = useQuery<{ summary: string; healthScore: number; generatedAt: string }>({
    queryKey: ["/api/command-center/exec-summary"],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { kpis, alerts, departmentHeatmap, recentAIActions, activitySparkline, healthBand, orgHealthScore } = data;

  const scoreCards = [
    { label: "Retention", value: kpis.retentionScore, icon: Shield, gradient: "from-emerald-500 to-teal-500", link: "/resignation-risk" },
    { label: "Sentiment", value: kpis.sentimentScore, icon: HeartPulse, gradient: "from-pink-500 to-rose-500", link: "/sentiment-dashboard" },
    { label: "Productivity", value: kpis.productivityScore, icon: Zap, gradient: "from-amber-500 to-orange-500", link: "/analytics" },
    { label: "Engagement", value: kpis.engagementScore, icon: Sparkles, gradient: "from-violet-500 to-purple-500", link: "/engagement" },
  ];

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-pink-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-200/60 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Live Mission Control</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            Intelligence Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workforce intelligence · last sync {new Date(data.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/autopilot">
            <Button variant="outline" className="gap-2" data-testid="link-autopilot">
              <Bot className="h-4 w-4" /> AI Autopilot
            </Button>
          </Link>
          <Link href="/analytics">
            <Button className="gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25" data-testid="link-deep-dive">
              <Brain className="h-4 w-4" /> Deep Dive
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero: Org Health + Exec Summary */}
      <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-xl shadow-purple-500/5 ring-1 ring-slate-200/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <CardContent className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 items-center">
          <HealthGauge score={orgHealthScore} band={healthBand} />
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/30">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest font-bold text-slate-500">CHRO Briefing</div>
                <div className="text-sm font-semibold text-slate-700">Generated by GPT-5 · refreshed every 5 min</div>
              </div>
            </div>
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing executive briefing…
              </div>
            ) : (
              <p className="text-base md:text-lg leading-relaxed text-slate-800 font-medium" data-testid="text-exec-summary">
                {summary?.summary || "No summary available."}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="bg-white/60">
                <Users className="h-3 w-3 mr-1.5" /> {kpis.totalEmployees} employees
              </Badge>
              <Badge variant="outline" className="bg-white/60">
                <Rocket className="h-3 w-3 mr-1.5" /> {kpis.openRoles} open roles
              </Badge>
              <Badge variant="outline" className="bg-white/60">
                <Bot className="h-3 w-3 mr-1.5" /> {kpis.autopilotActionsToday} AI actions today
              </Badge>
              {kpis.criticalAlerts > 0 && (
                <Badge className="bg-rose-500 hover:bg-rose-600">
                  <AlertTriangle className="h-3 w-3 mr-1.5" /> {kpis.criticalAlerts} critical
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {scoreCards.map((s) => (
          <Link key={s.label} href={s.link}>
            <Card className="group cursor-pointer relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all ring-1 ring-slate-200/60" data-testid={`card-score-${s.label.toLowerCase()}`}>
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${s.gradient} opacity-80`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-3xl font-black text-slate-900">{s.value}</div>
                <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">{s.label}</div>
                <MiniBar value={s.value} gradient={s.gradient} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Predictive Alerts */}
        <Card className="lg:col-span-2 relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-md ring-1 ring-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">Predictive Alerts</h2>
                {alerts.length > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">{alerts.length}</Badge>
                )}
              </div>
              <Link href="/resignation-risk">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {alerts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex h-12 w-12 rounded-full bg-emerald-100 items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700">All clear.</p>
                <p className="text-xs text-slate-500 mt-1">No predictive alerts in the last 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((a) => (
                  <div key={a.id} className={`p-3 rounded-lg border ${severityColor[a.severity]} flex items-start gap-3`} data-testid={`alert-${a.id}`}>
                    <div className="mt-0.5">
                      {a.severity === "critical" ? <Flame className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-sm">{a.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{a.category}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Pulse */}
        <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-md ring-1 ring-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Activity Pulse</h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">Last 14 days</p>
            <Sparkline data={activitySparkline} />
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
              <div>
                <div className="text-2xl font-black text-slate-900">{activitySparkline.reduce((s, d) => s + d.count, 0)}</div>
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total events</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{kpis.activeCandidates}</div>
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Active candidates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department Heatmap */}
        <Card className="lg:col-span-2 relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-md ring-1 ring-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Department Health Heatmap</h2>
              </div>
              <Link href="/sentiment-dashboard">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Sentiment <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {departmentHeatmap.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No departments configured.</p>
            ) : (
              <div className="space-y-2">
                {departmentHeatmap.map((d) => {
                  const healthHue = d.health >= 75 ? "from-emerald-500 to-teal-500"
                    : d.health >= 60 ? "from-blue-500 to-cyan-500"
                    : d.health >= 45 ? "from-amber-500 to-orange-500"
                    : "from-rose-500 to-red-500";
                  return (
                    <div key={d.department} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors" data-testid={`heatmap-${d.department}`}>
                      <div className="w-32 truncate text-sm font-semibold text-slate-800">{d.department}</div>
                      <div className="flex-1 min-w-0">
                        <MiniBar value={d.health} gradient={healthHue} />
                      </div>
                      <div className="w-12 text-right text-sm font-bold text-slate-700">{d.health}</div>
                      <Badge variant="outline" className="w-16 justify-center text-[10px] font-bold uppercase">{d.headcount} ppl</Badge>
                      <Badge
                        variant="outline"
                        className={`w-20 justify-center text-[10px] font-bold uppercase ${
                          d.mood === "positive" ? "border-emerald-300 text-emerald-700 bg-emerald-50/50" :
                          d.mood === "negative" ? "border-rose-300 text-rose-700 bg-rose-50/50" :
                          d.mood === "mixed" ? "border-amber-300 text-amber-700 bg-amber-50/50" :
                          "border-slate-300 text-slate-700 bg-slate-50/50"
                        }`}
                      >
                        {d.mood}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent AI Actions */}
        <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-md ring-1 ring-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">AI Actions</h2>
              </div>
              <Link href="/autopilot">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  All <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {recentAIActions.length === 0 ? (
              <div className="py-8 text-center">
                <Gauge className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No recent AI actions.</p>
                <Link href="/autopilot">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">Activate Autopilot</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                {recentAIActions.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg border border-slate-200/60 hover:bg-slate-50/80 transition-colors" data-testid={`ai-action-${a.id}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{a.title}</span>
                      <Badge variant="outline" className="text-[9px] uppercase shrink-0">{a.status}</Badge>
                    </div>
                    {a.summary && <p className="text-xs text-slate-600 line-clamp-2">{a.summary}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <TrendingUp className="h-3 w-3" />
                      {a.workflowKey}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
