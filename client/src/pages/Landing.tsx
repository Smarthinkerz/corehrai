import usePageTitle from "@/hooks/usePageTitle";
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Brain, Users, Briefcase, Rocket, Sparkles, Bot, Activity, AlertTriangle,
  GitBranch, TrendingUp, LayoutDashboard, Network, GraduationCap, Wallet,
  Award, MessageSquare, BookOpen, ShieldCheck, Lock, KeyRound, Plug,
  CheckCircle2, ArrowRight, Star, Zap, Globe2, BarChart3,
} from "lucide-react";
import {
  SiSlack, SiZoom, SiGoogle, SiOpenai,
} from "react-icons/si";
import logoUrl from "@assets/image_1778530056449.png";
import heroVideoUrl from "@assets/2-backend_video__1778530204455.mp4";
import workforceChartGif from "@assets/-_growth_chart__1778623562562.gif";

function useLatoFont() {
  useEffect(() => {
    const id = "lato-google-font";
    if (document.getElementById(id)) return;
    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "";
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap";
    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(link);
  }, []);
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  usePageTitle("Welcome");
  return (
    <section id={id} className={`relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold tracking-wide mb-4">
      <Sparkles className="h-3 w-3" /> {children}
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all hover:-translate-y-1 ${className}`}>
      {children}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, body, accent = "blue" }: { icon: any; title: string; body: string; accent?: "blue" | "indigo" | "slate" | "sky" }) {
  const tones: Record<string, string> = {
    blue:   "from-blue-100 to-blue-50 text-blue-600",
    indigo: "from-indigo-100 to-indigo-50 text-indigo-600",
    slate:  "from-slate-100 to-slate-50 text-slate-600",
    sky:    "from-sky-100 to-sky-50 text-sky-600",
  };
  return (
    <GlassCard>
      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${tones[accent] ?? tones.blue} mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
    </GlassCard>
  );
}

function PricingCard({
  name, price, tagline, audience, features, cta, highlighted = false, accent,
}: {
  name: string; price: string; tagline: string; audience: string;
  features: string[]; cta: string; highlighted?: boolean; accent: string;
}) {
  return (
    <div className={`relative rounded-2xl border ${highlighted ? "border-blue-400 bg-gradient-to-b from-blue-50 to-white scale-105 shadow-2xl shadow-blue-200" : "border-slate-200 bg-white shadow-sm"} backdrop-blur-xl p-8 flex flex-col`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-xs font-black text-white tracking-wider">
          MOST POPULAR
        </div>
      )}
      <div className={`text-xs font-black uppercase tracking-wider mb-2 ${accent}`}>{tagline}</div>
      <h3 className="text-2xl font-black text-slate-900 mb-1">{name}</h3>
      <p className="text-sm text-slate-500 mb-4">{audience}</p>
      <div className="mb-6">
        <span className="text-4xl font-black text-slate-900">{price}</span>
        {price.startsWith("$") && price !== "$0" && <span className="text-slate-500 ml-1 font-normal">/user/mo</span>}
      </div>
      <ul className="space-y-2 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/auth">
        <Button className={`w-full font-bold ${highlighted ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
          {cta}
        </Button>
      </Link>
    </div>
  );
}

export default function Landing() {
  useLatoFont();
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 overflow-hidden relative"
      style={{ fontFamily: '"Lato", system-ui, -apple-system, sans-serif' }}
    >
      {/* Ambient soft glow — single blue tone */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-100/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-50 border-b border-slate-200/70 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="CoreHR AI" className="h-10 w-10 rounded-xl object-cover shadow-md" />
            <span className="text-lg font-black tracking-tight text-slate-900">CoreHR AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#ai" className="hover:text-slate-900">AI</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#integrations" className="hover:text-slate-900">Integrations</a>
            <a href="/api/docs" className="hover:text-slate-900">API Docs</a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.smarthinkerz.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-smarthinkerz-hub-landing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-md transition-all"
              aria-label="Back to SmarThinkerz Hub"
            >
              <span aria-hidden="true">←</span>
              <span>Back to SmarThinkerz Hub</span>
            </a>
            <Link href="/auth"><Button variant="ghost" className="text-slate-700 hover:text-slate-900 font-bold">Sign in</Button></Link>
            <Link href="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative isolate overflow-hidden pt-16 md:pt-24 pb-20 md:pb-28 px-4 sm:px-6 lg:px-8 bg-slate-950">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: "brightness(1.09)" }}
          aria-hidden="true"
        >
          <source src={heroVideoUrl} type="video/mp4" />
        </video>
        {/* Dark gradient overlay for legibility */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/75 via-slate-900/65 to-slate-950/85" />

        <div className="relative z-20 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur text-white text-xs font-bold tracking-wide mb-4">
              <Sparkles className="h-3 w-3" /> AI-powered workforce operating system
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-8 text-white drop-shadow-2xl">
              Your Entire HR Department.{" "}
              <span className="bg-gradient-to-r from-blue-300 to-sky-200 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 h-12 font-bold shadow-xl">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 backdrop-blur hover:bg-white/20 text-white hover:text-white text-base px-8 h-12 font-bold">
                Book Demo
              </Button>
            </div>
            <p className="text-xl md:text-2xl text-slate-100 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg">
              From hiring to payroll, performance to predictive insights — manage, automate,
              and scale your workforce with one intelligent platform.
            </p>
          </div>
        </div>
      </section>

      <Section className="pt-0 -mt-12">
        <div className="hidden">{/* spacer */}</div>

        {/* Hero Visual */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-slate-200/30 blur-3xl -z-10" />
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-2xl p-6 md:p-10 shadow-2xl shadow-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard>
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Workforce</span>
                </div>
                <div className="text-3xl font-black mb-1 text-slate-900">2,847</div>
                <div className="text-xs text-emerald-600 font-bold">+12.4% this quarter</div>
                <div className="mt-4 h-20 rounded-md overflow-hidden bg-slate-50 border border-slate-100">
                  <img
                    src={workforceChartGif}
                    alt="Workforce growth chart animation"
                    className="w-full h-full object-cover"
                  />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-3 mb-3">
                  <Network className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Org Chart</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center"><div className="px-3 py-1.5 rounded-lg bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700">CEO</div></div>
                  <div className="flex justify-center gap-2">
                    <div className="px-2 py-1 rounded-md bg-blue-100 border border-blue-200 text-[10px] font-bold text-blue-700">CTO</div>
                    <div className="px-2 py-1 rounded-md bg-blue-100 border border-blue-200 text-[10px] font-bold text-blue-700">CHRO</div>
                    <div className="px-2 py-1 rounded-md bg-blue-100 border border-blue-200 text-[10px] font-bold text-blue-700">CFO</div>
                  </div>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border border-white shadow-sm" />
                    ))}
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-3 mb-3">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">AI Copilot</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">How many engineers are on PTO next week?</div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-slate-700">
                    <span className="text-blue-500">●</span> 4 engineers (Sarah, Mike, Aisha, Ravi). Coverage looks healthy.
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </Section>

      {/* SOCIAL PROOF */}
      <Section className="py-12">
        <p className="text-center text-sm text-slate-500 mb-8 font-bold tracking-wide uppercase">Trusted by modern teams building the future of work</p>
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <div className="text-3xl md:text-4xl font-black text-blue-600 tabular-nums">10,000+</div>
            <div className="text-xs text-slate-500 mt-1 font-bold">Employees Managed</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-blue-700 tabular-nums">95%</div>
            <div className="text-xs text-slate-500 mt-1 font-bold">HR Tasks Automated</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-slate-800 tabular-nums">3×</div>
            <div className="text-xs text-slate-500 mt-1 font-bold">Faster Hiring</div>
          </div>
        </div>
      </Section>

      {/* CORE VALUE */}
      <Section id="features">
        <div className="text-center mb-14">
          <Eyebrow>Core platform</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Everything HR Needs.{" "}
            <span className="text-blue-600">One Intelligent Platform.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard icon={Users} title="Core HR Operations" body="Manage employees, departments, org charts and self-service — all in one place." accent="blue" />
          <FeatureCard icon={Briefcase} title="Recruitment & Hiring" body="Track candidates, automate interviews, and hire smarter with AI scoring." accent="indigo" />
          <FeatureCard icon={Rocket} title="Onboarding" body="Deliver seamless onboarding experiences with automated workflows and buddy systems." accent="sky" />
          <FeatureCard icon={Brain} title="AI Intelligence Layer" body="Predict attrition, analyze sentiment, and deploy AI copilots across HR." accent="slate" />
        </div>
      </Section>

      {/* AI SUPERPOWERS */}
      <Section id="ai">
        <div className="text-center mb-14">
          <Eyebrow>AI superpowers</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Not Just HR Software —{" "}
            <span className="text-blue-600">An AI Decision Engine</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <FeatureCard icon={Bot} title="HR Chatbot" body="Instant answers for employees 24/7." accent="blue" />
          <FeatureCard icon={Activity} title="Sentiment & Emotion AI" body="Understand how your workforce truly feels." accent="indigo" />
          <FeatureCard icon={AlertTriangle} title="Resignation Risk" body="Identify at-risk employees before they leave." accent="slate" />
          <FeatureCard icon={GitBranch} title="Digital Twins" body="Simulate employee behavior and skill growth." accent="sky" />
          <FeatureCard icon={TrendingUp} title="Workforce Planning" body="Forecast hiring needs and optimize costs." accent="blue" />
        </div>
      </Section>

      {/* PLATFORM SHOWCASE */}
      <Section>
        <div className="text-center mb-14">
          <Eyebrow>The platform</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">See the Platform in Action</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard icon={LayoutDashboard} title="Dashboard" body="Real-time KPIs, activity feeds, and insights." accent="blue" />
          <FeatureCard icon={Network} title="Org Chart" body="Interactive reporting hierarchy." accent="indigo" />
          <FeatureCard icon={GraduationCap} title="Learning + VR Training" body="Immersive workforce development." accent="sky" />
          <FeatureCard icon={Wallet} title="Payroll & Attendance" body="Automated payroll, shifts, and tracking." accent="slate" />
        </div>
      </Section>

      {/* PERFORMANCE */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow>Performance & growth</Eyebrow>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">Build High-Performing Teams</h2>
            <ul className="space-y-3 text-slate-700">
              {["360° performance reviews", "Career pathing", "Internal talent marketplace", "Learning & development"].map((s) => (
                <li key={s} className="flex items-center gap-3 font-bold"><Star className="h-4 w-4 text-yellow-500" />{s}</li>
              ))}
            </ul>
          </div>
          <GlassCard className="p-8">
            <div className="text-xs text-slate-500 mb-4 font-bold tracking-wider">CAREER PROGRESSION</div>
            {["Junior", "Mid-level", "Senior", "Lead", "Principal"].map((level, i) => (
              <div key={level} className="flex items-center gap-3 mb-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${i <= 2 ? "bg-blue-600 text-white" : "bg-slate-100 border border-slate-200 text-slate-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div style={{ width: i <= 2 ? "100%" : i === 3 ? "60%" : "0%" }} className="h-full bg-blue-600" />
                </div>
                <span className="text-sm w-20 font-bold text-slate-700">{level}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </Section>

      {/* ENGAGEMENT */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <GlassCard className="p-8 order-2 lg:order-1">
            <div className="text-xs text-slate-500 mb-4 font-bold tracking-wider">RECOGNITION FEED</div>
            {[
              { from: "Sarah", to: "Mike", msg: "Amazing job on the launch! 🚀" },
              { from: "Priya", to: "Alex", msg: "Thanks for the mentorship this week." },
              { from: "Tom", to: "Lin", msg: "Killed it in the client demo." },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3 mb-4 last:mb-0 p-3 rounded-lg bg-slate-50">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-sm text-slate-700"><span className="font-black">{r.from}</span> recognized <span className="font-black">{r.to}</span></div>
                  <div className="text-xs text-slate-500 mt-1">{r.msg}</div>
                </div>
              </div>
            ))}
          </GlassCard>
          <div className="order-1 lg:order-2">
            <Eyebrow>Engagement & culture</Eyebrow>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">Create a Workplace People Love</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-center gap-3 font-bold"><Award className="h-4 w-4 text-blue-500" />Surveys & eNPS</li>
              <li className="flex items-center gap-3 font-bold"><Star className="h-4 w-4 text-yellow-500" />Recognition systems</li>
              <li className="flex items-center gap-3 font-bold"><MessageSquare className="h-4 w-4 text-slate-500" />Internal communications</li>
              <li className="flex items-center gap-3 font-bold"><BookOpen className="h-4 w-4 text-blue-500" />Knowledge base</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* SECURITY */}
      <Section>
        <div className="text-center mb-14">
          <Eyebrow>Enterprise-grade</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Security & Compliance Built In</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard icon={ShieldCheck} title="GDPR & SOX" body="Audit logs, data portability, and full compliance reporting." accent="blue" />
          <FeatureCard icon={Lock} title="Role-Based Access" body="Granular permissions across every module and entity." accent="indigo" />
          <FeatureCard icon={KeyRound} title="2FA Authentication" body="TOTP-based two-factor authentication for all admin accounts." accent="sky" />
          <FeatureCard icon={Globe2} title="Secure Infrastructure" body="Encrypted at rest and in transit. CSP, CSRF, and rate limiting." accent="slate" />
        </div>
      </Section>

      {/* INTEGRATIONS */}
      <Section id="integrations">
        <div className="text-center mb-14">
          <Eyebrow>Integrations</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Connect Your Entire Stack</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          {[
            { Icon: SiSlack, name: "Slack" },
            { Icon: SiZoom, name: "Zoom" },
            { Icon: SiGoogle, name: "Google" },
            { Icon: SiOpenai, name: "OpenAI" },
            { Icon: Plug, name: "Tap Payments" },
          ].map(({ Icon, name }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-blue-300 hover:shadow-md transition-all">
                <Icon className="h-7 w-7 text-slate-700" />
              </div>
              <span className="text-xs text-slate-500 font-bold">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* PRICING */}
      <Section id="pricing">
        <div className="text-center mb-14">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Simple, Scalable Pricing</h2>
          <p className="text-slate-600 mt-3 font-light">Start free. Upgrade as you grow.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PricingCard
            name="Starter"
            tagline="Free"
            audience="Small teams getting started"
            price="$0"
            cta="Start Free"
            accent="text-emerald-600"
            features={["Employee directory (limited)", "Basic dashboard", "Self-service portal", "Attendance tracking", "1 admin · up to 10 employees"]}
          />
          <PricingCard
            name="Growth"
            tagline="Pro"
            audience="Growing companies"
            price="$12"
            cta="Start Pro"
            accent="text-blue-600"
            features={["Everything in Starter", "Recruitment & ATS", "Onboarding workflows", "Payroll & shift management", "Performance reviews", "Engagement tools", "Basic AI chatbot"]}
          />
          <PricingCard
            name="AI Intelligence"
            tagline="Enterprise"
            audience="AI-driven organizations"
            price="$29"
            cta="Go Enterprise"
            highlighted
            accent="text-blue-700"
            features={["Everything in Pro", "Sentiment & Emotion AI", "Resignation risk prediction", "Workforce planning", "Digital twins", "AI learning recommendations", "API access", "Priority support"]}
          />
          <PricingCard
            name="Future of Work"
            tagline="Elite"
            audience="Large enterprises & governments"
            price="Custom"
            cta="Contact Sales"
            accent="text-slate-600"
            features={["Everything in Enterprise", "VR training modules", "Custom AI models", "Dedicated infrastructure", "Advanced compliance (GDPR, SOX)", "White-label branding", "Dedicated account manager"]}
          />
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section>
        <div className="relative rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-blue-100/60 to-slate-100 p-12 md:p-20 text-center overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent)]" />
          <div className="relative">
            <Eyebrow>Get started today</Eyebrow>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-slate-900">
              Transform Your Workforce with{" "}
              <span className="text-blue-600">AI</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto font-light">
              Join the next generation of intelligent organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 text-base px-8 h-12 font-bold shadow-lg">
                  Get Started <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-base px-8 h-12 font-bold">
                Book Demo
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-10 px-6 text-center text-sm text-slate-500 bg-white/60">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-bold">
              <Brain className="h-4 w-4 text-blue-500" />
              <span>CoreHR AI · The AI workforce operating system</span>
            </div>
            <div className="flex items-center gap-5">
              <a href="/api/docs" className="hover:text-slate-900 font-bold">API</a>
              <Link href="/privacy"><span className="hover:text-slate-900 cursor-pointer">Privacy</span></Link>
              <Link href="/terms"><span className="hover:text-slate-900 cursor-pointer">Terms</span></Link>
              <Link href="/cookies"><span className="hover:text-slate-900 cursor-pointer">Cookies</span></Link>
              <Link href="/auth"><span className="hover:text-slate-900 cursor-pointer font-bold">Sign in</span></Link>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200/60 text-xs text-slate-500">
            Part of the{" "}
            <a
              href="https://www.smarthinkerz.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-smarthinkerz-hub-footer"
              className="font-bold text-blue-600 hover:underline"
            >
              SmarThinkerz Unified Intelligence Hub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
