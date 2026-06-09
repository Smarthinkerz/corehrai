import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AIAssistant from "../ai/AIAssistant";
import HelpDocumentation from "../help/HelpDocumentation";
import CommandPalette from "../CommandPalette";
import OnboardingTour from "../OnboardingTour";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden font-inter text-neutral-800 bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/40">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Decorative ambient color blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-300/20 blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-purple-300/25 to-pink-300/15 blur-3xl" />
          <div className="absolute -bottom-40 right-1/4 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-emerald-200/20 to-teal-300/15 blur-3xl" />
        </div>

        <Header toggleSidebar={toggleSidebar} />

        <main id="main-content" className="relative flex-1 overflow-y-auto p-4 sm:p-6" role="main" aria-label="Page content">
          <div data-tour="dashboard">
            {children}
          </div>
        </main>

        <Footer />
      </div>

      <AIAssistant />
      <HelpDocumentation />
      <CommandPalette />
      <OnboardingTour />
    </div>
  );
};

export default AppLayout;
