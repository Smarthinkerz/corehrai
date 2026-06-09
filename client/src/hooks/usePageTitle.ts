import { useEffect } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/recruitment": "Recruitment",
  "/onboarding": "Onboarding",
  "/engagement": "Engagement Surveys",
  "/management": "Workforce Management",
  "/compliance": "Compliance & Security",
  "/wellness": "Wellness Programs",
  "/communications": "Communications",
  "/audit-log": "Audit Log",
  "/self-service": "Self-Service Portal",
  "/analytics": "Analytics",
  "/calendar": "Calendar",
  "/org-chart": "Org Chart",
  "/org-chart-visualizer": "Org Chart Visualizer",
  "/onboarding-workflows": "Onboarding Workflows",
  "/performance-reviews": "Performance Reviews",
  "/payroll": "Payroll",
  "/reports": "Report Builder",
  "/recognition": "Recognition",
  "/knowledge-base": "Knowledge Base",
  "/attendance": "Attendance",
  "/vr-training": "VR Training",
  "/virtual-office": "Virtual Office",
  "/digital-twins": "Digital Twins",
  "/emotion-ai": "Emotion AI",
  "/talent-marketplace": "Talent Marketplace",
  "/resignation-risk": "Resignation Risk",
  "/policy-compliance": "Policy Compliance",
  "/career-paths": "Career Paths",
  "/onboarding-buddies": "Onboarding Buddies",
  "/ai-learning": "AI Learning",
  "/interview-coach": "Interview Coach",
  "/workforce-planning": "Workforce Planning",
  "/sentiment-dashboard": "Sentiment Dashboard",
  "/hr-chatbot": "HR Chatbot",
  "/peer-recognition": "Peer Recognition",
  "/learning-dev": "Learning & Development",
  "/offer-letters": "Offer Letters",
  "/compliance-reports": "Compliance Reports",
  "/shift-management": "Shift Management",
  "/anonymous-feedback": "Anonymous Feedback",
  "/meeting-tracker": "Meeting Tracker",
  "/settings": "Settings",
  "/integrations": "Integrations",
  "/billing": "Billing & Subscription",
  "/legal": "Legal",
  "/data-privacy": "Data Privacy & GDPR",
  "/auth": "Sign In",
  "/autopilot": "AI Autopilot",
  "/command-center": "Intelligence Command Center",
  "/copilots": "AI Copilots",
};

/**
 * Sets document.title using either a known route key OR an explicit literal title.
 * - If passed a path starting with "/", looks up in PAGE_TITLES.
 * - If passed a non-slash string, uses it as the literal title.
 * - If omitted, falls back to current pathname.
 */
export default function usePageTitle(pathOrTitle?: string) {
  useEffect(() => {
    let title = "CoreHR AI";
    if (pathOrTitle) {
      if (pathOrTitle.startsWith("/")) {
        title = PAGE_TITLES[pathOrTitle] || "CoreHR AI";
      } else {
        title = pathOrTitle;
      }
    } else {
      title = PAGE_TITLES[window.location.pathname] || "CoreHR AI";
    }
    document.title = `${title} | CoreHR AI`;
  }, [pathOrTitle]);
}
