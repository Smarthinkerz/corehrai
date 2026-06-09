import React, { createContext, useContext, useState, useEffect } from 'react';

type UserContextType = {
  name: string;
  email: string;
  title: string;
  bio: string;
  avatar: string | null;
  updateProfile: (profile: Partial<UserProfileData>) => void;
};

type UserProfileData = {
  name: string;
  email: string;
  title: string;
  bio: string;
  avatar: string | null;
};

const defaultUserData: UserProfileData = {
  name: "John Doe",
  email: "john.doe@example.com",
  title: "HR Manager",
  bio: "Experienced Human Resources professional with a focus on employee development and organizational culture.",
  avatar: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Try to load profile from localStorage first
  const [userData, setUserData] = useState<UserProfileData>(() => {
    const savedUserData = localStorage.getItem('userData');
    return savedUserData ? JSON.parse(savedUserData) : defaultUserData;
  });

  // Save to localStorage whenever userData changes
  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);

  const updateProfile = (profile: Partial<UserProfileData>) => {
    setUserData(prev => ({ ...prev, ...profile }));
  };

  return (
    <UserContext.Provider
      value={{
        ...userData,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}