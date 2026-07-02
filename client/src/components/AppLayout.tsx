import { useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { GlobalSearch, useGlobalSearch } from "./GlobalSearch";
import { YouTubeBrowser } from "./YouTubeBrowser";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { API_KEY_STORAGE } from "@/lib/apiKeys";

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

const SYNCED_SETTING_KEYS = [
  API_KEY_STORAGE.YOUTUBE_API_KEY,
  API_KEY_STORAGE.AMAZON_API_KEY,
  API_KEY_STORAGE.AMAZON_API_PROVIDER,
  API_KEY_STORAGE.GEMINI_API_KEY,
  API_KEY_STORAGE.REDDIT_CLIENT_ID,
  API_KEY_STORAGE.REDDIT_CLIENT_SECRET,
  API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN,
  API_KEY_STORAGE.COMPOSIO_API_KEY,
  API_KEY_STORAGE.SCRAPECREATORS_API_KEY,
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [youtubeBrowserOpen, setYoutubeBrowserOpen] = useState(false);
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: settingsData } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // Restore API keys from server when signed in (e.g. new browser)
  useEffect(() => {
    if (!isAuthenticated || !settingsData?.settings) return;
    const s = settingsData.settings as Record<string, unknown>;
    SYNCED_SETTING_KEYS.forEach((key) => {
      const v = s[key];
      if (typeof v === "string" && v && typeof window !== "undefined") {
        if (!localStorage.getItem(key)) localStorage.setItem(key, v);
      }
    });
  }, [isAuthenticated, settingsData]);

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
        <main className="flex-1 overflow-auto min-h-0 flex flex-col">
          <div className="flex-1 page-content">
            {children}
          </div>
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
