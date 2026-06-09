import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Recruitment from "@/pages/Recruitment";
import Onboarding from "@/pages/Onboarding";
import Engagement from "@/pages/Engagement";
import Management from "@/pages/Management";
import Compliance from "@/pages/Compliance";
import Wellness from "@/pages/Wellness";
import Settings from "@/pages/Settings";
import Integrations from "@/pages/Integrations";
import Test from "@/pages/Test";
import Communications from "@/pages/Communications";
import AuditLog from "@/pages/AuditLog";
import SelfService from "@/pages/SelfService";
import Analytics from "@/pages/Analytics";
import Calendar from "@/pages/Calendar";
import OrgChart from "@/pages/OrgChart";
import OnboardingWorkflows from "@/pages/OnboardingWorkflows";
import PerformanceReviews from "@/pages/PerformanceReviews";
import Payroll from "@/pages/Payroll";
import ReportBuilder from "@/pages/ReportBuilder";
import Recognition from "@/pages/Recognition";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Attendance from "@/pages/Attendance";
import VRTraining from "@/pages/VRTraining";
import DigitalTwins from "@/pages/DigitalTwins";
import EmotionAI from "@/pages/EmotionAI";
import TalentMarketplace from "@/pages/TalentMarketplace";
import ResignationRisk from "@/pages/ResignationRisk";
import PolicyCompliance from "@/pages/PolicyCompliance";
import CareerPaths from "@/pages/CareerPaths";
import OnboardingBuddies from "@/pages/OnboardingBuddies";
import AILearning from "@/pages/AILearning";
import InterviewCoach from "@/pages/InterviewCoach";
import WorkforcePlanning from "@/pages/WorkforcePlanning";
import SentimentDashboard from "@/pages/SentimentDashboard";
import HRChatbot from "@/pages/HRChatbot";
import PeerRecognition from "@/pages/PeerRecognition";
import LearningDev from "@/pages/LearningDev";
import OfferLetters from "@/pages/OfferLetters";
import ComplianceReports from "@/pages/ComplianceReports";
import ShiftManagement from "@/pages/ShiftManagement";
import AnonymousFeedback from "@/pages/AnonymousFeedback";
import MeetingTracker from "@/pages/MeetingTracker";
import Legal from "@/pages/Legal";
import Billing from "@/pages/Billing";
import DataPrivacy from "@/pages/DataPrivacy";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/Landing";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import Autopilot from "@/pages/Autopilot";
import CommandCenter from "@/pages/CommandCenter";
import Copilots from "@/pages/Copilots";
import VirtualOffice from "@/pages/VirtualOffice";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <AppLayout><ErrorBoundary>{children}</ErrorBoundary></AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/cookies" component={CookiePolicy} />

      <Route path="/dashboard">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/app">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/recruitment">
        <ProtectedLayout><Recruitment /></ProtectedLayout>
      </Route>
      <Route path="/onboarding">
        <ProtectedLayout><Onboarding /></ProtectedLayout>
      </Route>
      <Route path="/engagement">
        <ProtectedLayout><Engagement /></ProtectedLayout>
      </Route>
      <Route path="/management">
        <ProtectedLayout><Management /></ProtectedLayout>
      </Route>
      <Route path="/compliance">
        <ProtectedLayout><Compliance /></ProtectedLayout>
      </Route>
      <Route path="/wellness">
        <ProtectedLayout><Wellness /></ProtectedLayout>
      </Route>
      <Route path="/settings">
        <ProtectedLayout><Settings /></ProtectedLayout>
      </Route>
      <Route path="/integrations">
        <ProtectedLayout><Integrations /></ProtectedLayout>
      </Route>
      <Route path="/communications">
        <ProtectedLayout><Communications /></ProtectedLayout>
      </Route>
      <Route path="/audit-log">
        <ProtectedLayout><AuditLog /></ProtectedLayout>
      </Route>
      <Route path="/self-service">
        <ProtectedLayout><SelfService /></ProtectedLayout>
      </Route>
      <Route path="/analytics">
        <ProtectedLayout><Analytics /></ProtectedLayout>
      </Route>
      <Route path="/calendar">
        <ProtectedLayout><Calendar /></ProtectedLayout>
      </Route>
      <Route path="/org-chart">
        <ProtectedLayout><OrgChart /></ProtectedLayout>
      </Route>
      <Route path="/onboarding-workflows">
        <ProtectedLayout><OnboardingWorkflows /></ProtectedLayout>
      </Route>
      <Route path="/performance-reviews">
        <ProtectedLayout><PerformanceReviews /></ProtectedLayout>
      </Route>
      <Route path="/payroll">
        <ProtectedLayout><Payroll /></ProtectedLayout>
      </Route>
      <Route path="/reports">
        <ProtectedLayout><ReportBuilder /></ProtectedLayout>
      </Route>
      <Route path="/recognition">
        <ProtectedLayout><Recognition /></ProtectedLayout>
      </Route>
      <Route path="/knowledge-base">
        <ProtectedLayout><KnowledgeBase /></ProtectedLayout>
      </Route>
      <Route path="/attendance">
        <ProtectedLayout><Attendance /></ProtectedLayout>
      </Route>
      <Route path="/vr-training">
        <ProtectedLayout><VRTraining /></ProtectedLayout>
      </Route>
      <Route path="/digital-twins">
        <ProtectedLayout><DigitalTwins /></ProtectedLayout>
      </Route>
      <Route path="/emotion-ai">
        <ProtectedLayout><EmotionAI /></ProtectedLayout>
      </Route>
      <Route path="/talent-marketplace">
        <ProtectedLayout><TalentMarketplace /></ProtectedLayout>
      </Route>
      <Route path="/resignation-risk">
        <ProtectedLayout><ResignationRisk /></ProtectedLayout>
      </Route>
      <Route path="/policy-compliance">
        <ProtectedLayout><PolicyCompliance /></ProtectedLayout>
      </Route>
      <Route path="/career-paths">
        <ProtectedLayout><CareerPaths /></ProtectedLayout>
      </Route>
      <Route path="/onboarding-buddies">
        <ProtectedLayout><OnboardingBuddies /></ProtectedLayout>
      </Route>
      <Route path="/ai-learning">
        <ProtectedLayout><AILearning /></ProtectedLayout>
      </Route>
      <Route path="/interview-coach">
        <ProtectedLayout><InterviewCoach /></ProtectedLayout>
      </Route>
      <Route path="/workforce-planning">
        <ProtectedLayout><WorkforcePlanning /></ProtectedLayout>
      </Route>
      <Route path="/sentiment-dashboard">
        <ProtectedLayout><SentimentDashboard /></ProtectedLayout>
      </Route>
      <Route path="/hr-chatbot">
        <ProtectedLayout><HRChatbot /></ProtectedLayout>
      </Route>
      <Route path="/peer-recognition">
        <ProtectedLayout><PeerRecognition /></ProtectedLayout>
      </Route>
      <Route path="/learning-dev">
        <ProtectedLayout><LearningDev /></ProtectedLayout>
      </Route>
      <Route path="/offer-letters">
        <ProtectedLayout><OfferLetters /></ProtectedLayout>
      </Route>
      <Route path="/compliance-reports">
        <ProtectedLayout><ComplianceReports /></ProtectedLayout>
      </Route>
      <Route path="/shift-management">
        <ProtectedLayout><ShiftManagement /></ProtectedLayout>
      </Route>
      <Route path="/anonymous-feedback">
        <ProtectedLayout><AnonymousFeedback /></ProtectedLayout>
      </Route>
      <Route path="/meeting-tracker">
        <ProtectedLayout><MeetingTracker /></ProtectedLayout>
      </Route>
      <Route path="/billing">
        <ProtectedLayout><Billing /></ProtectedLayout>
      </Route>
      <Route path="/data-privacy">
        <ProtectedLayout><DataPrivacy /></ProtectedLayout>
      </Route>
      <Route path="/legal/:tab?">
        <ProtectedLayout><Legal /></ProtectedLayout>
      </Route>
      <Route path="/test">
        <ProtectedLayout><Test /></ProtectedLayout>
      </Route>
      <Route path="/autopilot">
        <ProtectedLayout><Autopilot /></ProtectedLayout>
      </Route>
      <Route path="/command-center">
        <ProtectedLayout><CommandCenter /></ProtectedLayout>
      </Route>
      <Route path="/copilots">
        <ProtectedLayout><Copilots /></ProtectedLayout>
      </Route>
      <Route path="/virtual-office">
        <ProtectedLayout><VirtualOffice /></ProtectedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <Router />
            <Toaster />
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
