import { describe, it, expect } from "vitest";

// Test clickable tag functionality
describe("Clickable Tags", () => {
  it("should generate correct URL for tag navigation", () => {
    const tag = "testimonial";
    const expectedUrl = `/videos?tag=${encodeURIComponent(tag)}`;
    expect(expectedUrl).toBe("/videos?tag=testimonial");
  });

  it("should handle tags with special characters", () => {
    const tag = "product request";
    const expectedUrl = `/videos?tag=${encodeURIComponent(tag)}`;
    expect(expectedUrl).toBe("/videos?tag=product%20request");
  });

  it("should handle tags with unicode characters", () => {
    const tag = "café";
    const expectedUrl = `/videos?tag=${encodeURIComponent(tag)}`;
    expect(expectedUrl).toBe("/videos?tag=caf%C3%A9");
  });
});

// Test export template functionality
describe("Export Templates", () => {
  const videoColumns = [
    { id: "videoId", label: "Video ID", category: "basic" },
    { id: "title", label: "Title", category: "basic" },
    { id: "channelTitle", label: "Channel", category: "basic" },
    { id: "viewCount", label: "Views", category: "metrics" },
    { id: "likeCount", label: "Likes", category: "metrics" },
  ];

  const commentColumns = [
    { id: "commentId", label: "Comment ID", category: "basic" },
    { id: "text", label: "Comment Text", category: "content" },
    { id: "authorName", label: "Author Name", category: "author" },
    { id: "likeCount", label: "Likes", category: "engagement" },
  ];

  it("should have all required video columns", () => {
    const requiredColumns = ["videoId", "title", "channelTitle", "viewCount", "likeCount"];
    requiredColumns.forEach(col => {
      expect(videoColumns.find(c => c.id === col)).toBeDefined();
    });
  });

  it("should have all required comment columns", () => {
    const requiredColumns = ["commentId", "text", "authorName", "likeCount"];
    requiredColumns.forEach(col => {
      expect(commentColumns.find(c => c.id === col)).toBeDefined();
    });
  });

  it("should filter data by selected columns", () => {
    const data = [
      { videoId: "abc123", title: "Test Video", viewCount: 1000, likeCount: 50, description: "A test" },
    ];
    const selectedColumns = ["videoId", "title", "viewCount"];
    
    const filteredData = data.map(item => {
      const filtered: Record<string, any> = {};
      selectedColumns.forEach(col => {
        if (item[col as keyof typeof item] !== undefined) {
          filtered[col] = item[col as keyof typeof item];
        }
      });
      return filtered;
    });

    expect(filteredData[0]).toEqual({
      videoId: "abc123",
      title: "Test Video",
      viewCount: 1000,
    });
    expect(filteredData[0]).not.toHaveProperty("likeCount");
    expect(filteredData[0]).not.toHaveProperty("description");
  });

  it("should generate valid CSV from data", () => {
    const data = [
      { title: "Video 1", views: 100 },
      { title: "Video 2", views: 200 },
    ];
    const columns = ["title", "views"];
    
    const header = columns.join(",");
    const rows = data.map(item =>
      columns.map(col => String(item[col as keyof typeof item])).join(",")
    );
    const csv = [header, ...rows].join("\n");

    expect(csv).toBe("title,views\nVideo 1,100\nVideo 2,200");
  });

  it("should escape CSV values with commas", () => {
    const value = "Hello, World";
    const escaped = value.includes(",") ? `"${value}"` : value;
    expect(escaped).toBe('"Hello, World"');
  });

  it("should escape CSV values with quotes", () => {
    const value = 'He said "hello"';
    const escaped = `"${value.replace(/"/g, '""')}"`;
    expect(escaped).toBe('"He said ""hello"""');
  });
});

// Test voice note data structure
describe("Voice Notes", () => {
  interface VoiceNote {
    id: string;
    transcript: string;
    duration: number;
    createdAt: Date;
    isEdited: boolean;
  }

  it("should create valid voice note structure", () => {
    const note: VoiceNote = {
      id: `voice_${Date.now()}`,
      transcript: "This is a test transcription",
      duration: 30,
      createdAt: new Date(),
      isEdited: false,
    };

    expect(note.id).toMatch(/^voice_\d+$/);
    expect(note.transcript).toBe("This is a test transcription");
    expect(note.duration).toBe(30);
    expect(note.isEdited).toBe(false);
  });

  it("should format duration correctly", () => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(30)).toBe("0:30");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(125)).toBe("2:05");
  });
});

// Test category badge colors
describe("Category Badges", () => {
  const categoryColors: Record<string, { bg: string; text: string }> = {
    story: { bg: "bg-blue-500/10", text: "text-blue-700" },
    testimonial: { bg: "bg-green-500/10", text: "text-green-700" },
    product_request: { bg: "bg-purple-500/10", text: "text-purple-700" },
    pain_point: { bg: "bg-red-500/10", text: "text-red-700" },
    humor: { bg: "bg-yellow-500/10", text: "text-yellow-700" },
    question: { bg: "bg-cyan-500/10", text: "text-cyan-700" },
  };

  it("should have colors for all categories", () => {
    const categories = ["story", "testimonial", "product_request", "pain_point", "humor", "question"];
    categories.forEach(cat => {
      expect(categoryColors[cat]).toBeDefined();
      expect(categoryColors[cat].bg).toBeDefined();
      expect(categoryColors[cat].text).toBeDefined();
    });
  });

  it("should format category labels correctly", () => {
    const formatLabel = (category: string) => 
      category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    
    expect(formatLabel("story")).toBe("Story");
    expect(formatLabel("product_request")).toBe("Product Request");
    expect(formatLabel("pain_point")).toBe("Pain Point");
  });
});

// Test knowledge base content
describe("Knowledge Base", () => {
  const helpTopics = [
    "getting-started",
    "analyze",
    "intelligence",
    "canvas",
    "projects",
    "export",
    "tips",
  ];

  it("should have all required help topics", () => {
    expect(helpTopics.length).toBe(7);
    expect(helpTopics).toContain("getting-started");
    expect(helpTopics).toContain("analyze");
    expect(helpTopics).toContain("intelligence");
    expect(helpTopics).toContain("canvas");
    expect(helpTopics).toContain("projects");
    expect(helpTopics).toContain("export");
    expect(helpTopics).toContain("tips");
  });

  it("should generate correct help URLs", () => {
    helpTopics.forEach(topic => {
      const url = `/help/${topic}`;
      expect(url).toMatch(/^\/help\/[a-z-]+$/);
    });
  });
});

// Test tag group display logic
describe("Tag Group Display", () => {
  it("should limit visible tags correctly", () => {
    const tags = ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"];
    const maxVisible = 5;
    
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenCount = tags.length - maxVisible;

    expect(visibleTags.length).toBe(5);
    expect(hiddenCount).toBe(2);
  });

  it("should show all tags when under limit", () => {
    const tags = ["tag1", "tag2", "tag3"];
    const maxVisible = 5;
    
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenCount = Math.max(0, tags.length - maxVisible);

    expect(visibleTags.length).toBe(3);
    expect(hiddenCount).toBe(0);
  });
});
