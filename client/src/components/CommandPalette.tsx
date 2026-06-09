import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, Briefcase, UserPlus, Award, Heart,
  Shield, BarChart3, Calendar, Building2, FileText, Bell,
  Settings, CreditCard, BookOpen, Brain, Target, MessageSquare,
  ClipboardList, Clock, Zap, GraduationCap, Handshake, TrendingUp,
  Eye, Mic, Search, HelpCircle
} from "lucide-react";

const pages = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, group: "Overview" },
  { name: "Analytics", path: "/analytics", icon: BarChart3, group: "Overview" },
  { name: "Calendar", path: "/calendar", icon: Calendar, group: "Overview" },
  { name: "Org Chart", path: "/org-chart", icon: Building2, group: "Overview" },
  { name: "Employees", path: "/management", icon: Users, group: "People" },
  { name: "Departments", path: "/management", icon: Building2, group: "People" },
  { name: "Self Service", path: "/self-service", icon: UserPlus, group: "People" },
  { name: "Recruitment", path: "/recruitment", icon: Briefcase, group: "Recruitment" },
  { name: "Offer Letters", path: "/offer-letters", icon: FileText, group: "Recruitment" },
  { name: "Interview Coach", path: "/interview-coach", icon: Mic, group: "Recruitment" },
  { name: "Onboarding Workflows", path: "/onboarding-workflows", icon: ClipboardList, group: "Onboarding" },
  { name: "Onboarding Buddies", path: "/onboarding-buddies", icon: Handshake, group: "Onboarding" },
  { name: "Performance Reviews", path: "/performance-reviews", icon: Target, group: "Performance" },
  { name: "Career Paths", path: "/career-paths", icon: TrendingUp, group: "Performance" },
  { name: "Learning & Dev", path: "/learning-dev", icon: GraduationCap, group: "Learning" },
  { name: "VR Training", path: "/vr-training", icon: Eye, group: "Learning" },
  { name: "Knowledge Base", path: "/knowledge-base", icon: BookOpen, group: "Learning" },
  { name: "Engagement", path: "/engagement", icon: Heart, group: "Engagement" },
  { name: "Recognition", path: "/recognition", icon: Award, group: "Engagement" },
  { name: "Peer Recognition", path: "/peer-recognition", icon: Handshake, group: "Engagement" },
  { name: "Anonymous Feedback", path: "/anonymous-feedback", icon: MessageSquare, group: "Engagement" },
  { name: "Wellness", path: "/wellness", icon: Heart, group: "Engagement" },
  { name: "Attendance", path: "/attendance", icon: Clock, group: "Operations" },
  { name: "Payroll", path: "/payroll", icon: CreditCard, group: "Operations" },
  { name: "Shift Management", path: "/shift-management", icon: Clock, group: "Operations" },
  { name: "Compliance", path: "/compliance", icon: Shield, group: "Operations" },
  { name: "Policy Compliance", path: "/policy-compliance", icon: Shield, group: "Operations" },
  { name: "Documents", path: "/management", icon: FileText, group: "Operations" },
  { name: "AI Assistant", path: "/hr-chatbot", icon: Brain, group: "AI" },
  { name: "Emotion AI", path: "/emotion-ai", icon: Brain, group: "AI" },
  { name: "Digital Twins", path: "/digital-twins", icon: Zap, group: "AI" },
  { name: "Sentiment Dashboard", path: "/sentiment-dashboard", icon: BarChart3, group: "AI" },
  { name: "Resignation Risk", path: "/resignation-risk", icon: TrendingUp, group: "AI" },
  { name: "Workforce Planning", path: "/workforce-planning", icon: Users, group: "AI" },
  { name: "AI Learning", path: "/ai-learning", icon: Brain, group: "AI" },
  { name: "Communications", path: "/communications", icon: MessageSquare, group: "System" },
  { name: "Notifications", path: "/communications", icon: Bell, group: "System" },
  { name: "Meeting Tracker", path: "/meeting-tracker", icon: Calendar, group: "System" },
  { name: "Report Builder", path: "/reports", icon: BarChart3, group: "System" },
  { name: "Audit Log", path: "/audit-log", icon: Search, group: "System" },
  { name: "Settings", path: "/settings", icon: Settings, group: "System" },
  { name: "Billing", path: "/billing", icon: CreditCard, group: "System" },
  { name: "Data Privacy", path: "/data-privacy", icon: Shield, group: "System" },
  { name: "Legal", path: "/legal", icon: FileText, group: "System" },
  { name: "Help", path: "/#help", icon: HelpCircle, group: "System" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const groups = Array.from(new Set(pages.map(p => p.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, features, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, idx) => (
          <div key={group}>
            <CommandGroup heading={group}>
              {pages.filter(p => p.group === group).map((page) => (
                <CommandItem
                  key={page.path + page.name}
                  onSelect={() => {
                    navigate(page.path);
                    setOpen(false);
                  }}
                >
                  <page.icon className="mr-2 h-4 w-4" />
                  <span>{page.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {idx < groups.length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
