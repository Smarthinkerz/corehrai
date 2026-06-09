import React from 'react';

// Context for engagement tab state management
export interface EngagementContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Create the context with a default undefined value
export const EngagementContext = React.createContext<EngagementContextType | undefined>(undefined);

// Hook to use the engagement context
export const useEngagementContext = () => {
  const context = React.useContext(EngagementContext);
  if (context === undefined) {
    throw new Error('useEngagementContext must be used within an EngagementProvider');
  }
  return context;
};