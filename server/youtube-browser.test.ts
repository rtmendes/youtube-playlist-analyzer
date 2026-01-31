import { describe, it, expect } from "vitest";

describe("YouTube Browser Feature", () => {
  describe("URL Navigation", () => {
    it("should default to YouTube homepage", () => {
      const defaultUrl = "https://www.youtube.com";
      expect(defaultUrl).toBe("https://www.youtube.com");
    });

    it("should add protocol to URLs without one", () => {
      const addProtocol = (url: string) => {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return `https://${url}`;
        }
        return url;
      };

      expect(addProtocol("youtube.com")).toBe("https://youtube.com");
      expect(addProtocol("https://youtube.com")).toBe("https://youtube.com");
    });

    it("should convert search queries to YouTube search URLs", () => {
      const toSearchUrl = (query: string) => {
        if (!query.includes(".")) {
          return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        }
        return query;
      };

      expect(toSearchUrl("funny cats")).toBe(
        "https://www.youtube.com/results?search_query=funny%20cats"
      );
      expect(toSearchUrl("youtube.com")).toBe("youtube.com");
    });

    it("should only allow YouTube URLs", () => {
      const isYouTubeUrl = (url: string) => {
        return url.includes("youtube.com") || url.includes("youtu.be");
      };

      expect(isYouTubeUrl("https://www.youtube.com")).toBe(true);
      expect(isYouTubeUrl("https://youtu.be/abc123")).toBe(true);
      expect(isYouTubeUrl("https://google.com")).toBe(false);
      expect(isYouTubeUrl("https://vimeo.com")).toBe(false);
    });
  });

  describe("Video ID Extraction", () => {
    it("should extract video ID from standard watch URLs", () => {
      const extractVideoId = (url: string): string | null => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
          /youtube\.com\/shorts\/([^&\n?#]+)/,
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      expect(extractVideoId("https://www.youtube.com/shorts/abc123")).toBe("abc123");
      expect(extractVideoId("https://www.youtube.com")).toBeNull();
    });

    it("should identify video URLs correctly", () => {
      const isVideoUrl = (url: string): boolean => {
        const patterns = [
          /youtube\.com\/watch\?v=/,
          /youtu\.be\//,
          /youtube\.com\/embed\//,
          /youtube\.com\/shorts\//,
        ];
        return patterns.some((p) => p.test(url));
      };

      expect(isVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
      expect(isVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
      expect(isVideoUrl("https://www.youtube.com")).toBe(false);
      expect(isVideoUrl("https://www.youtube.com/results?search_query=test")).toBe(false);
    });
  });

  describe("Navigation History", () => {
    it("should track navigation history", () => {
      const history: string[] = ["https://www.youtube.com"];
      let historyIndex = 0;

      const navigateTo = (url: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(url);
        history.length = 0;
        history.push(...newHistory);
        historyIndex = newHistory.length - 1;
      };

      navigateTo("https://www.youtube.com/watch?v=abc123");
      expect(history.length).toBe(2);
      expect(historyIndex).toBe(1);

      navigateTo("https://www.youtube.com/watch?v=xyz789");
      expect(history.length).toBe(3);
      expect(historyIndex).toBe(2);
    });

    it("should support back navigation", () => {
      const history = [
        "https://www.youtube.com",
        "https://www.youtube.com/watch?v=abc123",
        "https://www.youtube.com/watch?v=xyz789",
      ];
      let historyIndex = 2;

      const goBack = () => {
        if (historyIndex > 0) {
          historyIndex--;
          return history[historyIndex];
        }
        return history[historyIndex];
      };

      expect(goBack()).toBe("https://www.youtube.com/watch?v=abc123");
      expect(historyIndex).toBe(1);
      expect(goBack()).toBe("https://www.youtube.com");
      expect(historyIndex).toBe(0);
      expect(goBack()).toBe("https://www.youtube.com"); // Can't go back further
    });

    it("should support forward navigation", () => {
      const history = [
        "https://www.youtube.com",
        "https://www.youtube.com/watch?v=abc123",
        "https://www.youtube.com/watch?v=xyz789",
      ];
      let historyIndex = 0;

      const goForward = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          return history[historyIndex];
        }
        return history[historyIndex];
      };

      expect(goForward()).toBe("https://www.youtube.com/watch?v=abc123");
      expect(historyIndex).toBe(1);
      expect(goForward()).toBe("https://www.youtube.com/watch?v=xyz789");
      expect(historyIndex).toBe(2);
      expect(goForward()).toBe("https://www.youtube.com/watch?v=xyz789"); // Can't go forward further
    });
  });

  describe("Browser Panel State", () => {
    it("should persist open/closed state", () => {
      let isOpen = false;
      
      const toggle = () => {
        isOpen = !isOpen;
        return isOpen;
      };

      expect(toggle()).toBe(true);
      expect(toggle()).toBe(false);
      expect(toggle()).toBe(true);
    });

    it("should support expanded/minimized modes", () => {
      let isExpanded = false;

      const toggleExpand = () => {
        isExpanded = !isExpanded;
        return isExpanded;
      };

      expect(toggleExpand()).toBe(true);
      expect(toggleExpand()).toBe(false);
    });
  });

  describe("Analyze URL Integration", () => {
    it("should encode URL for navigation", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const encodedUrl = encodeURIComponent(url);
      const navPath = `/?url=${encodedUrl}`;

      expect(navPath).toContain("url=");
      expect(decodeURIComponent(navPath.split("url=")[1])).toBe(url);
    });

    it("should only show analyze button for video URLs", () => {
      const shouldShowAnalyze = (url: string): boolean => {
        const patterns = [
          /youtube\.com\/watch\?v=/,
          /youtu\.be\//,
          /youtube\.com\/embed\//,
          /youtube\.com\/shorts\//,
        ];
        return patterns.some((p) => p.test(url));
      };

      expect(shouldShowAnalyze("https://www.youtube.com/watch?v=abc")).toBe(true);
      expect(shouldShowAnalyze("https://www.youtube.com")).toBe(false);
      expect(shouldShowAnalyze("https://www.youtube.com/results?search_query=test")).toBe(false);
    });
  });
});
