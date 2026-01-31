import { useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { GlobalSearch, useGlobalSearch } from "./GlobalSearch";
import { YouTubeBrowser } from "./YouTubeBrowser";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Context for YouTube browser state
interface YouTubeBrowserContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  analyzeUrl: (url: string) => void;
}

const YouTubeBrowserContext = createContext<YouTubeBrowserContextType>({
  isOpen: false,
  setIsOpen: () => {},
  analyzeUrl: () => {},
});

export function useYouTubeBrowser() {
  return useContext(YouTubeBrowserContext);
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [youtubeBrowserOpen, setYoutubeBrowserOpen] = useState(false);
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();
  const [, setLocation] = useLocation();

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  // Load YouTube browser state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("youtube-browser-open");
    if (saved !== null) {
      setYoutubeBrowserOpen(saved === "true");
    }
  }, []);

  // Save sidebar state to localStorage
  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebar-collapsed", String(newValue));
      return newValue;
    });
  };

  // Save YouTube browser state to localStorage
  const handleToggleYouTubeBrowser = (open: boolean) => {
    setYoutubeBrowserOpen(open);
    localStorage.setItem("youtube-browser-open", String(open));
  };

  // Handle analyze URL from YouTube browser
  const handleAnalyzeUrl = (url: string) => {
    // Navigate to home page with the URL pre-filled
    const encodedUrl = encodeURIComponent(url);
    setLocation(`/?url=${encodedUrl}`);
  };

  return (
    <YouTubeBrowserContext.Provider
      value={{
        isOpen: youtubeBrowserOpen,
        setIsOpen: handleToggleYouTubeBrowser,
        analyzeUrl: handleAnalyzeUrl,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={handleToggleSidebar}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleYouTube={() => handleToggleYouTubeBrowser(!youtubeBrowserOpen)}
          isYouTubeOpen={youtubeBrowserOpen}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <YouTubeBrowser
          isOpen={youtubeBrowserOpen}
          onClose={() => handleToggleYouTubeBrowser(false)}
          onAnalyzeUrl={handleAnalyzeUrl}
        />
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </YouTubeBrowserContext.Provider>
  );
}

export default AppLayout;
