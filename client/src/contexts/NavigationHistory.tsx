import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface NavigationEntry {
  path: string;
  label: string;
  timestamp: number;
  scrollPosition?: number;
  searchParams?: string;
}

interface NavigationHistoryContextType {
  history: NavigationEntry[];
  currentIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  push: (path: string, label: string) => void;
  getCurrentEntry: () => NavigationEntry | null;
  getBackLabel: () => string | null;
  getForwardLabel: () => string | null;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | null>(null);

export function NavigationHistoryProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [history, setHistory] = useState<NavigationEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  // Initialize with current location
  useEffect(() => {
    if (history.length === 0) {
      const initialEntry: NavigationEntry = {
        path: location,
        label: getPageLabel(location),
        timestamp: Date.now(),
      };
      setHistory([initialEntry]);
      setCurrentIndex(0);
    }
  }, []);

  // Track location changes (but not when navigating via back/forward)
  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
      return;
    }

    // Don't add duplicate entries
    if (history[currentIndex]?.path === location) {
      return;
    }

    // Only add if we're not at the end of history (user navigated after going back)
    const newEntry: NavigationEntry = {
      path: location,
      label: getPageLabel(location),
      timestamp: Date.now(),
      searchParams: window.location.search,
    };

    setHistory(prev => {
      // Remove any forward history when navigating to a new page
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, newEntry];
    });
    setCurrentIndex(prev => prev + 1);
  }, [location]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    
    // Save current scroll position
    setHistory(prev => {
      const updated = [...prev];
      if (updated[currentIndex]) {
        updated[currentIndex] = {
          ...updated[currentIndex],
          scrollPosition: window.scrollY,
        };
      }
      return updated;
    });

    const newIndex = currentIndex - 1;
    const entry = history[newIndex];
    
    if (entry) {
      setIsNavigating(true);
      setCurrentIndex(newIndex);
      setLocation(entry.path + (entry.searchParams || ""));
      
      // Restore scroll position after navigation
      setTimeout(() => {
        if (entry.scrollPosition !== undefined) {
          window.scrollTo(0, entry.scrollPosition);
        }
      }, 100);
    }
  }, [canGoBack, currentIndex, history, setLocation]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    
    // Save current scroll position
    setHistory(prev => {
      const updated = [...prev];
      if (updated[currentIndex]) {
        updated[currentIndex] = {
          ...updated[currentIndex],
          scrollPosition: window.scrollY,
        };
      }
      return updated;
    });

    const newIndex = currentIndex + 1;
    const entry = history[newIndex];
    
    if (entry) {
      setIsNavigating(true);
      setCurrentIndex(newIndex);
      setLocation(entry.path + (entry.searchParams || ""));
      
      // Restore scroll position after navigation
      setTimeout(() => {
        if (entry.scrollPosition !== undefined) {
          window.scrollTo(0, entry.scrollPosition);
        }
      }, 100);
    }
  }, [canGoForward, currentIndex, history, setLocation]);

  const push = useCallback((path: string, label: string) => {
    const newEntry: NavigationEntry = {
      path,
      label,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, newEntry];
    });
    setCurrentIndex(prev => prev + 1);
    setLocation(path);
  }, [currentIndex, setLocation]);

  const getCurrentEntry = useCallback(() => {
    return history[currentIndex] || null;
  }, [history, currentIndex]);

  const getBackLabel = useCallback(() => {
    if (!canGoBack) return null;
    return history[currentIndex - 1]?.label || null;
  }, [canGoBack, history, currentIndex]);

  const getForwardLabel = useCallback(() => {
    if (!canGoForward) return null;
    return history[currentIndex + 1]?.label || null;
  }, [canGoForward, history, currentIndex]);

  return (
    <NavigationHistoryContext.Provider
      value={{
        history,
        currentIndex,
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        push,
        getCurrentEntry,
        getBackLabel,
        getForwardLabel,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory must be used within a NavigationHistoryProvider");
  }
  return context;
}

// Helper function to get human-readable page labels
function getPageLabel(path: string): string {
  const pathMap: Record<string, string> = {
    "/": "Home",
    "/videos": "All Videos",
    "/channels": "All Channels",
    "/comments": "All Comments",
    "/intelligence": "Intelligence",
    "/canvas": "Canvas",
    "/history": "History",
    "/projects": "Projects",
    "/help": "Help",
    "/trash": "Trash",
  };

  // Check for exact match
  if (pathMap[path]) {
    return pathMap[path];
  }

  // Check for dynamic routes
  if (path.startsWith("/channel/")) {
    return "Channel Details";
  }
  if (path.startsWith("/video/")) {
    return "Video Details";
  }
  if (path.startsWith("/bulk-analyze")) {
    return "Bulk Analysis";
  }
  if (path.startsWith("/analyze")) {
    return "Analysis";
  }
  if (path.startsWith("/help/")) {
    const section = path.split("/help/")[1];
    const sectionMap: Record<string, string> = {
      "getting-started": "Getting Started",
      "playlists": "Playlists",
      "comments": "Comments",
      "intelligence": "Intelligence",
      "canvas": "Canvas",
      "projects": "Projects",
      "export": "Export",
    };
    return sectionMap[section] || "Help";
  }

  return "Page";
}
