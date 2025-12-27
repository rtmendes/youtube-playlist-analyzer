import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
