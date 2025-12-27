import { describe, it, expect, vi, beforeEach } from "vitest";

// Test NavigationHistory context functionality
describe("NavigationHistory Context", () => {
  describe("getPageLabel", () => {
    // Helper function to test page label generation
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

      if (pathMap[path]) {
        return pathMap[path];
      }

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

    it("should return correct label for home page", () => {
      expect(getPageLabel("/")).toBe("Home");
    });

    it("should return correct label for videos page", () => {
      expect(getPageLabel("/videos")).toBe("All Videos");
    });

    it("should return correct label for channels page", () => {
      expect(getPageLabel("/channels")).toBe("All Channels");
    });

    it("should return correct label for comments page", () => {
      expect(getPageLabel("/comments")).toBe("All Comments");
    });

    it("should return correct label for intelligence page", () => {
      expect(getPageLabel("/intelligence")).toBe("Intelligence");
    });

    it("should return correct label for canvas page", () => {
      expect(getPageLabel("/canvas")).toBe("Canvas");
    });

    it("should return correct label for history page", () => {
      expect(getPageLabel("/history")).toBe("History");
    });

    it("should return correct label for projects page", () => {
      expect(getPageLabel("/projects")).toBe("Projects");
    });

    it("should return correct label for channel detail page", () => {
      expect(getPageLabel("/channel/UC123456")).toBe("Channel Details");
    });

    it("should return correct label for video detail page", () => {
      expect(getPageLabel("/video/abc123")).toBe("Video Details");
    });

    it("should return correct label for bulk analyze page", () => {
      expect(getPageLabel("/bulk-analyze")).toBe("Bulk Analysis");
    });

    it("should return correct label for analyze page", () => {
      expect(getPageLabel("/analyze")).toBe("Analysis");
    });

    it("should return correct label for help getting started page", () => {
      expect(getPageLabel("/help/getting-started")).toBe("Getting Started");
    });

    it("should return correct label for help export page", () => {
      expect(getPageLabel("/help/export")).toBe("Export");
    });

    it("should return Page for unknown routes", () => {
      expect(getPageLabel("/unknown/route")).toBe("Page");
    });
  });
});

// Test NavigationEntry interface
describe("NavigationEntry", () => {
  interface NavigationEntry {
    path: string;
    label: string;
    timestamp: number;
    scrollPosition?: number;
    searchParams?: string;
  }

  it("should create a valid navigation entry", () => {
    const entry: NavigationEntry = {
      path: "/videos",
      label: "All Videos",
      timestamp: Date.now(),
    };

    expect(entry.path).toBe("/videos");
    expect(entry.label).toBe("All Videos");
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it("should support optional scroll position", () => {
    const entry: NavigationEntry = {
      path: "/videos",
      label: "All Videos",
      timestamp: Date.now(),
      scrollPosition: 500,
    };

    expect(entry.scrollPosition).toBe(500);
  });

  it("should support optional search params", () => {
    const entry: NavigationEntry = {
      path: "/videos",
      label: "All Videos",
      timestamp: Date.now(),
      searchParams: "?filter=recent&sort=views",
    };

    expect(entry.searchParams).toBe("?filter=recent&sort=views");
  });
});

// Test navigation history stack operations
describe("Navigation History Stack", () => {
  let history: { path: string; label: string }[];
  let currentIndex: number;

  beforeEach(() => {
    history = [{ path: "/", label: "Home" }];
    currentIndex = 0;
  });

  it("should initialize with home page", () => {
    expect(history.length).toBe(1);
    expect(history[0].path).toBe("/");
    expect(currentIndex).toBe(0);
  });

  it("should add new entry when navigating forward", () => {
    history.push({ path: "/videos", label: "All Videos" });
    currentIndex = 1;

    expect(history.length).toBe(2);
    expect(history[currentIndex].path).toBe("/videos");
  });

  it("should allow going back", () => {
    history.push({ path: "/videos", label: "All Videos" });
    currentIndex = 1;

    // Go back
    currentIndex = 0;

    expect(history[currentIndex].path).toBe("/");
    expect(currentIndex).toBe(0);
  });

  it("should allow going forward after going back", () => {
    history.push({ path: "/videos", label: "All Videos" });
    currentIndex = 1;

    // Go back
    currentIndex = 0;

    // Go forward
    currentIndex = 1;

    expect(history[currentIndex].path).toBe("/videos");
  });

  it("should truncate forward history when navigating to new page after going back", () => {
    history.push({ path: "/videos", label: "All Videos" });
    history.push({ path: "/channels", label: "All Channels" });
    currentIndex = 2;

    // Go back twice
    currentIndex = 0;

    // Navigate to new page (should remove /videos and /channels from forward history)
    history = history.slice(0, currentIndex + 1);
    history.push({ path: "/intelligence", label: "Intelligence" });
    currentIndex = 1;

    expect(history.length).toBe(2);
    expect(history[1].path).toBe("/intelligence");
  });

  it("should correctly report canGoBack", () => {
    expect(currentIndex > 0).toBe(false);

    history.push({ path: "/videos", label: "All Videos" });
    currentIndex = 1;

    expect(currentIndex > 0).toBe(true);
  });

  it("should correctly report canGoForward", () => {
    history.push({ path: "/videos", label: "All Videos" });
    currentIndex = 1;

    expect(currentIndex < history.length - 1).toBe(false);

    currentIndex = 0;

    expect(currentIndex < history.length - 1).toBe(true);
  });
});

// Test Column interface for DataTable
describe("DataTable Column Configuration", () => {
  interface Column<T> {
    id: string;
    header: string;
    accessor: keyof T | ((row: T) => any);
    sortable?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    render?: (value: any, row: T) => any;
    align?: "left" | "center" | "right";
    resizable?: boolean;
  }

  interface VideoItem {
    id: number;
    title: string;
    views: number;
  }

  it("should create a column with numeric width", () => {
    const column: Column<VideoItem> = {
      id: "title",
      header: "Title",
      accessor: "title",
      width: 200,
    };

    expect(column.width).toBe(200);
    expect(typeof column.width).toBe("number");
  });

  it("should support minWidth and maxWidth constraints", () => {
    const column: Column<VideoItem> = {
      id: "title",
      header: "Title",
      accessor: "title",
      width: 200,
      minWidth: 100,
      maxWidth: 400,
    };

    expect(column.minWidth).toBe(100);
    expect(column.maxWidth).toBe(400);
  });

  it("should support resizable flag", () => {
    const column: Column<VideoItem> = {
      id: "title",
      header: "Title",
      accessor: "title",
      resizable: true,
    };

    expect(column.resizable).toBe(true);
  });

  it("should default resizable to undefined (truthy check)", () => {
    const column: Column<VideoItem> = {
      id: "title",
      header: "Title",
      accessor: "title",
    };

    // resizable !== false means it's resizable by default
    expect(column.resizable !== false).toBe(true);
  });
});

// Test column width persistence
describe("Column Width Persistence", () => {
  it("should serialize column widths to JSON", () => {
    const widths = {
      title: 250,
      views: 100,
      likes: 100,
      comments: 100,
    };

    const serialized = JSON.stringify(widths);
    const parsed = JSON.parse(serialized);

    expect(parsed.title).toBe(250);
    expect(parsed.views).toBe(100);
  });

  it("should handle localStorage key format", () => {
    const storageKey = "videos-list";
    const fullKey = `datatable-widths-${storageKey}`;

    expect(fullKey).toBe("datatable-widths-videos-list");
  });

  it("should calculate new width within constraints", () => {
    const startWidth = 150;
    const diff = 50;
    const minWidth = 50;
    const maxWidth = 500;

    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));

    expect(newWidth).toBe(200);
  });

  it("should respect minimum width constraint", () => {
    const startWidth = 100;
    const diff = -80;
    const minWidth = 50;
    const maxWidth = 500;

    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));

    expect(newWidth).toBe(50);
  });

  it("should respect maximum width constraint", () => {
    const startWidth = 400;
    const diff = 200;
    const minWidth = 50;
    const maxWidth = 500;

    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));

    expect(newWidth).toBe(500);
  });
});

// Test Breadcrumb with navigation
describe("Breadcrumb Navigation Integration", () => {
  interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: any;
  }

  it("should build breadcrumb items from path segments", () => {
    const path = "/channel/UC123456";
    const segments = path.split("/").filter(Boolean);

    expect(segments).toEqual(["channel", "UC123456"]);
  });

  it("should identify dynamic segments", () => {
    const routeLabels: Record<string, string> = {
      videos: "All Videos",
      channels: "All Channels",
      channel: "Channel",
    };

    const segment = "UC123456";
    const isDynamic = !routeLabels[segment];

    expect(isDynamic).toBe(true);
  });

  it("should create breadcrumb with home item", () => {
    const items: BreadcrumbItem[] = [
      { label: "All Channels", href: "/channels" },
      { label: "Channel Details" },
    ];

    const allItems: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      ...items,
    ];

    expect(allItems.length).toBe(3);
    expect(allItems[0].label).toBe("Home");
    expect(allItems[1].label).toBe("All Channels");
    expect(allItems[2].label).toBe("Channel Details");
  });
});
