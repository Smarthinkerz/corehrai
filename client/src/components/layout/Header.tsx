import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Moon, Sun, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useThemeContext } from "@/contexts/ThemeContext";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const { theme, updateTheme } = useThemeContext();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search",
        description: `Searching for: ${searchQuery}`,
      });
    }
  };

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleDark = () => {
    updateTheme(isDark ? "light" : "dark");
  };

  const displayName = user?.fullName || "User";
  const initials = displayName.split(' ').map(n => n[0]).join('');

  return (
    <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm z-10 border-b border-slate-200/60 dark:border-gray-800/60 before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-gradient-to-r before:from-blue-500 before:via-blue-400 before:to-blue-600 before:opacity-60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <button
          type="button"
          onClick={toggleSidebar}
          className="md:hidden text-neutral-600 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden md:block flex-1 max-w-lg mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-50 dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              placeholder="Search employees, tasks, or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-neutral-400">
              <span className="hidden md:inline">&#8984;K</span>
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <NotificationCenter />

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 transition-colors"
            style={{ transition: `background-color var(--dur-fast) var(--ease-entrance)` }}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md shadow-blue-500/20 transition-colors"
            id="open-assistant"
          >
            <Zap className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">AI Assistant</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={`${displayName}'s avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{initials}</span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium dark:text-gray-200">{displayName.split(' ')[0]}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span>{displayName}</span>
                    <Badge variant="outline" className="text-xs capitalize">{user?.role || 'user'}</Badge>
                  </div>
                  <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/self-service" className="w-full cursor-pointer">
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="w-full cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logoutMutation.mutate()}
                className="text-red-500 focus:text-red-500 cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
