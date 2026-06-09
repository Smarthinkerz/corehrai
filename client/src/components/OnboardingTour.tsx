import { useState, useEffect } from "react";
import * as JoyrideModule from "react-joyride";
import type { Step } from "react-joyride";
type CallBackProps = { status: string; [key: string]: any };

const Joyride = (JoyrideModule as any).Joyride || (JoyrideModule as any).default || JoyrideModule;
const STATUS = (JoyrideModule as any).STATUS || { FINISHED: "finished", SKIPPED: "skipped" };

const steps: Step[] = [
  {
    target: '[data-tour="sidebar"]',
    content: "Welcome to AI CoreHR AI! This is your navigation sidebar. It's organized into groups like People, Recruitment, Performance, and more.",
    title: "Navigation",
    placement: "right",
    ...({ disableBeacon: true } as any),
  },
  {
    target: '[data-tour="dashboard"]',
    content: "Your dashboard gives you a real-time overview of your organization — employee counts, open tasks, upcoming interviews, and key metrics.",
    title: "Dashboard Overview",
    placement: "bottom",
  },
  {
    target: '[data-tour="search"]',
    content: "Press Ctrl+K (or Cmd+K on Mac) anytime to open the command palette. Search for any page, feature, or action instantly.",
    title: "Quick Search",
    placement: "bottom",
  },
  {
    target: '[data-tour="ai-assistant"]',
    content: "Your AI assistant is always available to help with HR questions, generate reports, draft policies, and more.",
    title: "AI Assistant",
    placement: "left",
  },
  {
    target: '[data-tour="notifications"]',
    content: "Stay updated with notifications about tasks, approvals, and important HR events.",
    title: "Notifications",
    placement: "bottom",
  },
  {
    target: '[data-tour="settings"]',
    content: "Configure your profile, security settings (including 2FA), appearance, and organization preferences.",
    title: "Settings",
    placement: "left",
  },
];

const TOUR_COMPLETED_KEY = "aihr_onboarding_completed";

export default function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!completed) {
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 10000,
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        buttonNext: {
          borderRadius: 6,
          padding: "8px 16px",
        },
        buttonBack: {
          borderRadius: 6,
          padding: "8px 16px",
        },
        buttonSkip: {
          borderRadius: 6,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Get Started",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
