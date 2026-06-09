import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import logoUrl from "@assets/image_1778530056449.png";
import { ChevronDown, ChevronRight, LayoutDashboard, Users, UserPlus, ClipboardList, Heart, BarChart3, Shield, Zap, MessageSquare, FileText, UserCheck, CalendarDays, Building2, Workflow, Star, DollarSign, BookOpen, Clock, Monitor, Lightbulb, Smile, Briefcase, AlertTriangle, CheckSquare, TrendingUp, Award, Mic, LineChart, Bot, GraduationCap, FileEdit, ShieldCheck, CalendarClock, MessageCircle, GitBranch, Settings, Plug, CreditCard, Scale, HelpCircle, Lock, Sparkles, ArrowLeft, Radar, Boxes } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = typeof window !== 'undefined' ? window.location.pathname : "/";
  const isActive = (path: string) => location === path;

  const navGroups: NavGroup[] = [
    {
      label: "Overview",
      defaultOpen: true,
      items: [
        { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { path: "/command-center", label: "Command Center", icon: <Radar className="h-4 w-4" /> },
        { path: "/autopilot", label: "AI Autopilot", icon: <Sparkles className="h-4 w-4" /> },
        { path: "/copilots", label: "AI Copilots", icon: <Bot className="h-4 w-4" /> },
        { path: "/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
        { path: "/calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" /> },
      ],
    },
    {
      label: "People",
      defaultOpen: true,
      items: [
        { path: "/management", label: "Employees", icon: <Users className="h-4 w-4" /> },
        { path: "/org-chart", label: "Org Chart", icon: <GitBranch className="h-4 w-4" /> },
        { path: "/self-service", label: "Self-Service", icon: <UserCheck className="h-4 w-4" /> },
        { path: "/attendance", label: "Attendance", icon: <Clock className="h-4 w-4" /> },
        { path: "/shift-management", label: "Shift Management", icon: <CalendarClock className="h-4 w-4" /> },
      ],
    },
    {
      label: "Recruitment",
      items: [
        { path: "/recruitment", label: "Candidates", icon: <UserPlus className="h-4 w-4" /> },
        { path: "/interview-coach", label: "Interview Coach", icon: <Mic className="h-4 w-4" /> },
        { path: "/offer-letters", label: "Offer Letters", icon: <FileEdit className="h-4 w-4" /> },
      ],
    },
    {
      label: "Onboarding",
      items: [
        { path: "/onboarding", label: "Tasks", icon: <ClipboardList className="h-4 w-4" /> },
        { path: "/onboarding-workflows", label: "Workflows", icon: <Workflow className="h-4 w-4" /> },
        { path: "/onboarding-buddies", label: "Buddies", icon: <Users className="h-4 w-4" /> },
      ],
    },
    {
      label: "Performance",
      items: [
        { path: "/performance-reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
        { path: "/recognition", label: "Recognition", icon: <Award className="h-4 w-4" /> },
        { path: "/peer-recognition", label: "Peer Recognition", icon: <Heart className="h-4 w-4" /> },
        { path: "/career-paths", label: "Career Paths", icon: <TrendingUp className="h-4 w-4" /> },
      ],
    },
    {
      label: "Learning & Growth",
      items: [
        { path: "/learning-dev", label: "Learning & Dev", icon: <GraduationCap className="h-4 w-4" /> },
        { path: "/knowledge-base", label: "Knowledge Base", icon: <BookOpen className="h-4 w-4" /> },
        { path: "/vr-training", label: "VR Training", icon: <Monitor className="h-4 w-4" /> },
        { path: "/virtual-office", label: "Virtual Office", icon: <Boxes className="h-4 w-4" /> },
        { path: "/talent-marketplace", label: "Talent Marketplace", icon: <Briefcase className="h-4 w-4" /> },
      ],
    },
    {
      label: "Engagement",
      items: [
        { path: "/engagement", label: "Surveys", icon: <Heart className="h-4 w-4" /> },
        { path: "/sentiment-dashboard", label: "Sentiment", icon: <Smile className="h-4 w-4" /> },
        { path: "/wellness", label: "Wellness", icon: <Zap className="h-4 w-4" /> },
        { path: "/anonymous-feedback", label: "Anonymous Feedback", icon: <MessageCircle className="h-4 w-4" /> },
        { path: "/meeting-tracker", label: "1:1 Meetings", icon: <CalendarClock className="h-4 w-4" /> },
      ],
    },
    {
      label: "Operations",
      items: [
        { path: "/payroll", label: "Payroll", icon: <DollarSign className="h-4 w-4" /> },
        { path: "/compliance", label: "Compliance", icon: <Shield className="h-4 w-4" /> },
        { path: "/compliance-reports", label: "Compliance Reports", icon: <ShieldCheck className="h-4 w-4" /> },
        { path: "/policy-compliance", label: "Policy Checks", icon: <CheckSquare className="h-4 w-4" /> },
        { path: "/reports", label: "Report Builder", icon: <FileText className="h-4 w-4" /> },
      ],
    },
    {
      label: "AI & Intelligence",
      items: [
        { path: "/hr-chatbot", label: "HR Chatbot", icon: <Bot className="h-4 w-4" /> },
        { path: "/workforce-planning", label: "Workforce Planning", icon: <LineChart className="h-4 w-4" /> },
        { path: "/resignation-risk", label: "Resignation Risk", icon: <AlertTriangle className="h-4 w-4" /> },
        { path: "/emotion-ai", label: "Emotion AI", icon: <Smile className="h-4 w-4" /> },
        { path: "/digital-twins", label: "Digital Twins", icon: <Lightbulb className="h-4 w-4" /> },
        { path: "/ai-learning", label: "AI Learning", icon: <Lightbulb className="h-4 w-4" /> },
      ],
    },
    {
      label: "Communications",
      items: [
        { path: "/communications", label: "Announcements", icon: <MessageSquare className="h-4 w-4" /> },
        { path: "/audit-log", label: "Audit Log", icon: <FileText className="h-4 w-4" /> },
      ],
    },
  ];

  const settingsItems: NavItem[] = [
    { path: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { path: "/integrations", label: "Integrations", icon: <Plug className="h-4 w-4" /> },
    { path: "/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
    { path: "/legal", label: "Legal", icon: <Scale className="h-4 w-4" /> },
    { path: "/data-privacy", label: "Data Privacy", icon: <Lock className="h-4 w-4" /> },
  ];

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    navGroups.forEach(g => {
      if (g.defaultOpen) initial.add(g.label);
      if (g.items.some(item => isActive(item.path))) initial.add(g.label);
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 lg:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={logoUrl} alt="CoreHR AI" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">CoreHR AI</span>
        </Link>
      </div>

      <div className="px-3 pt-3 shrink-0">
        <a
          href="https://www.smarthinkerz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
          aria-label="Back to SmarThinkerz Hub"
          data-testid="link-smarthinkerz-hub"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="truncate">Back to SmarThinkerz Hub</span>
        </a>
        <a
          href="https://smarthinkerz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block text-center text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          data-testid="link-smarthinkerz-domain"
        >
          smarthinkerz.com
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin" aria-label="Sidebar navigation">
        {navGroups.map((group) => {
          const groupOpen = openGroups.has(group.label);
          const hasActive = group.items.some(item => isActive(item.path));

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  hasActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                )}
                aria-expanded={groupOpen}
                aria-controls={`nav-group-${group.label}`}
              >
                <span>{group.label}</span>
                {groupOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>

              {groupOpen && (
                <div id={`nav-group-${group.label}`} className="space-y-0.5 px-2" role="group" aria-label={group.label}>
                  {group.items.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all",
                          isActive(item.path)
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold border-l-[3px] border-blue-600 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                        )}
                        role="link"
                        aria-current={isActive(item.path) ? "page" : undefined}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            System
          </div>
          <div className="space-y-0.5 px-2">
            {settingsItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all",
                    isActive(item.path)
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  role="link"
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <button
          onClick={() => window.open("https://docs.hragent.com", "_blank")}
          className="flex items-center gap-2 px-3 py-2 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Help and documentation"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help & Docs</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
