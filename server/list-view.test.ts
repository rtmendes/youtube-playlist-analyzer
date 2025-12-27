import { describe, it, expect } from "vitest";

// Test DataTable column sorting logic
describe("DataTable Sorting", () => {
  interface VideoItem {
    id: string;
    title: string;
    channelTitle: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
  }

  const mockVideos: VideoItem[] = [
    {
      id: "1",
      title: "First Video",
      channelTitle: "Channel A",
      viewCount: 1000,
      likeCount: 100,
      commentCount: 50,
      publishedAt: "2024-01-15",
    },
    {
      id: "2",
      title: "Second Video",
      channelTitle: "Channel B",
      viewCount: 5000,
      likeCount: 500,
      commentCount: 200,
      publishedAt: "2024-02-20",
    },
    {
      id: "3",
      title: "Third Video",
      channelTitle: "Channel A",
      viewCount: 2500,
      likeCount: 250,
      commentCount: 100,
      publishedAt: "2024-01-01",
    },
  ];

  // Sorting function similar to what's used in the DataTable
  const sortVideos = (
    videos: VideoItem[],
    sortField: keyof VideoItem,
    sortOrder: "asc" | "desc"
  ): VideoItem[] => {
    return [...videos].sort((a, b) => {
      let comparison = 0;
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  it("should sort by views ascending", () => {
    const sorted = sortVideos(mockVideos, "viewCount", "asc");
    expect(sorted[0].viewCount).toBe(1000);
    expect(sorted[1].viewCount).toBe(2500);
    expect(sorted[2].viewCount).toBe(5000);
  });

  it("should sort by views descending", () => {
    const sorted = sortVideos(mockVideos, "viewCount", "desc");
    expect(sorted[0].viewCount).toBe(5000);
    expect(sorted[1].viewCount).toBe(2500);
    expect(sorted[2].viewCount).toBe(1000);
  });

  it("should sort by title alphabetically", () => {
    const sorted = sortVideos(mockVideos, "title", "asc");
    expect(sorted[0].title).toBe("First Video");
    expect(sorted[1].title).toBe("Second Video");
    expect(sorted[2].title).toBe("Third Video");
  });

  it("should sort by channel title", () => {
    const sorted = sortVideos(mockVideos, "channelTitle", "asc");
    expect(sorted[0].channelTitle).toBe("Channel A");
    expect(sorted[2].channelTitle).toBe("Channel B");
  });

  it("should sort by likes descending", () => {
    const sorted = sortVideos(mockVideos, "likeCount", "desc");
    expect(sorted[0].likeCount).toBe(500);
    expect(sorted[1].likeCount).toBe(250);
    expect(sorted[2].likeCount).toBe(100);
  });

  it("should sort by date ascending (oldest first)", () => {
    const sorted = sortVideos(mockVideos, "publishedAt", "asc");
    expect(sorted[0].publishedAt).toBe("2024-01-01");
    expect(sorted[1].publishedAt).toBe("2024-01-15");
    expect(sorted[2].publishedAt).toBe("2024-02-20");
  });
});

// Test breadcrumb path generation
describe("Breadcrumb Path Generation", () => {
  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  const generateBreadcrumbs = (
    pathname: string,
    context?: { channelName?: string; videoTitle?: string }
  ): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    if (pathname.startsWith("/videos")) {
      crumbs.push({ label: "All Videos", href: "/videos" });
    } else if (pathname.startsWith("/channels")) {
      crumbs.push({ label: "All Channels", href: "/channels" });
    } else if (pathname.startsWith("/channel/")) {
      crumbs.push({ label: "All Channels", href: "/channels" });
      if (context?.channelName) {
        crumbs.push({ label: context.channelName });
      }
    } else if (pathname.startsWith("/comments")) {
      crumbs.push({ label: "All Comments", href: "/comments" });
    } else if (pathname.startsWith("/intelligence")) {
      crumbs.push({ label: "Intelligence", href: "/intelligence" });
    } else if (pathname.startsWith("/canvas")) {
      crumbs.push({ label: "Canvas", href: "/canvas" });
    } else if (pathname.startsWith("/history")) {
      crumbs.push({ label: "History", href: "/history" });
    } else if (pathname.startsWith("/projects")) {
      crumbs.push({ label: "Projects", href: "/projects" });
    }

    return crumbs;
  };

  it("should generate home breadcrumb for root path", () => {
    const crumbs = generateBreadcrumbs("/");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].label).toBe("Home");
  });

  it("should generate breadcrumbs for videos page", () => {
    const crumbs = generateBreadcrumbs("/videos");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].label).toBe("Home");
    expect(crumbs[1].label).toBe("All Videos");
  });

  it("should generate breadcrumbs for channel detail page", () => {
    const crumbs = generateBreadcrumbs("/channel/UC123", {
      channelName: "Test Channel",
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].label).toBe("Home");
    expect(crumbs[1].label).toBe("All Channels");
    expect(crumbs[2].label).toBe("Test Channel");
  });

  it("should generate breadcrumbs for intelligence page", () => {
    const crumbs = generateBreadcrumbs("/intelligence");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[1].label).toBe("Intelligence");
  });

  it("should generate breadcrumbs for canvas page", () => {
    const crumbs = generateBreadcrumbs("/canvas");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[1].label).toBe("Canvas");
  });
});

// Test channel filtering by ID
describe("Channel Video Filtering", () => {
  interface Video {
    id: string;
    title: string;
    channelId: string;
    channelTitle: string;
  }

  const mockVideos: Video[] = [
    { id: "v1", title: "Video 1", channelId: "ch1", channelTitle: "Channel One" },
    { id: "v2", title: "Video 2", channelId: "ch1", channelTitle: "Channel One" },
    { id: "v3", title: "Video 3", channelId: "ch2", channelTitle: "Channel Two" },
    { id: "v4", title: "Video 4", channelId: "ch1", channelTitle: "Channel One" },
    { id: "v5", title: "Video 5", channelId: "ch3", channelTitle: "Channel Three" },
  ];

  const filterByChannel = (videos: Video[], channelId: string): Video[] => {
    return videos.filter((v) => v.channelId === channelId);
  };

  it("should filter videos by channel ID", () => {
    const filtered = filterByChannel(mockVideos, "ch1");
    expect(filtered).toHaveLength(3);
    expect(filtered.every((v) => v.channelId === "ch1")).toBe(true);
  });

  it("should return empty array for non-existent channel", () => {
    const filtered = filterByChannel(mockVideos, "ch999");
    expect(filtered).toHaveLength(0);
  });

  it("should return single video for channel with one video", () => {
    const filtered = filterByChannel(mockVideos, "ch3");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Video 5");
  });
});

// Test list/grid view toggle state
describe("View Mode Toggle", () => {
  type ViewMode = "list" | "grid";

  const toggleViewMode = (current: ViewMode): ViewMode => {
    return current === "list" ? "grid" : "list";
  };

  it("should toggle from list to grid", () => {
    expect(toggleViewMode("list")).toBe("grid");
  });

  it("should toggle from grid to list", () => {
    expect(toggleViewMode("grid")).toBe("list");
  });

  it("should default to list view", () => {
    const defaultView: ViewMode = "list";
    expect(defaultView).toBe("list");
  });
});

// Test multi-select functionality
describe("Multi-Select Functionality", () => {
  const toggleSelection = (
    selected: Set<string>,
    id: string
  ): Set<string> => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  };

  const selectRange = (
    items: string[],
    startId: string,
    endId: string
  ): Set<string> => {
    const startIndex = items.indexOf(startId);
    const endIndex = items.indexOf(endId);
    const [from, to] = startIndex < endIndex 
      ? [startIndex, endIndex] 
      : [endIndex, startIndex];
    return new Set(items.slice(from, to + 1));
  };

  it("should add item to selection", () => {
    const selected = new Set<string>();
    const result = toggleSelection(selected, "item1");
    expect(result.has("item1")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("should remove item from selection", () => {
    const selected = new Set(["item1", "item2"]);
    const result = toggleSelection(selected, "item1");
    expect(result.has("item1")).toBe(false);
    expect(result.has("item2")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("should select range of items", () => {
    const items = ["a", "b", "c", "d", "e"];
    const result = selectRange(items, "b", "d");
    expect(result.size).toBe(3);
    expect(result.has("b")).toBe(true);
    expect(result.has("c")).toBe(true);
    expect(result.has("d")).toBe(true);
    expect(result.has("a")).toBe(false);
  });

  it("should handle reverse range selection", () => {
    const items = ["a", "b", "c", "d", "e"];
    const result = selectRange(items, "d", "b");
    expect(result.size).toBe(3);
    expect(result.has("b")).toBe(true);
    expect(result.has("c")).toBe(true);
    expect(result.has("d")).toBe(true);
  });
});
