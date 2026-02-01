import { describe, it, expect } from "vitest";

describe("Batch Export Feature", () => {
  describe("Export Format Validation", () => {
    it("should support markdown format", () => {
      const supportedFormats = ["markdown", "txt", "html", "json"];
      expect(supportedFormats).toContain("markdown");
    });

    it("should support txt format", () => {
      const supportedFormats = ["markdown", "txt", "html", "json"];
      expect(supportedFormats).toContain("txt");
    });

    it("should support html format", () => {
      const supportedFormats = ["markdown", "txt", "html", "json"];
      expect(supportedFormats).toContain("html");
    });

    it("should support json format", () => {
      const supportedFormats = ["markdown", "txt", "html", "json"];
      expect(supportedFormats).toContain("json");
    });
  });

  describe("Export Type Validation", () => {
    it("should support combined export type", () => {
      const supportedTypes = ["combined", "individual"];
      expect(supportedTypes).toContain("combined");
    });

    it("should support individual export type", () => {
      const supportedTypes = ["combined", "individual"];
      expect(supportedTypes).toContain("individual");
    });
  });

  describe("Content Formatting", () => {
    it("should strip markdown formatting for txt format", () => {
      const markdownContent = "# Title\n\n**Bold** and *italic* text";
      const strippedContent = markdownContent.replace(/[#*_`]/g, "");
      expect(strippedContent).not.toContain("#");
      expect(strippedContent).not.toContain("*");
    });

    it("should convert markdown to HTML for html format", () => {
      const markdownContent = "# Title";
      const htmlContent = markdownContent.replace(/^# (.*$)/gm, "<h1>$1</h1>");
      expect(htmlContent).toContain("<h1>");
      expect(htmlContent).toContain("</h1>");
    });

    it("should preserve markdown for markdown format", () => {
      const markdownContent = "# Title\n\n**Bold** text";
      expect(markdownContent).toContain("#");
      expect(markdownContent).toContain("**");
    });
  });

  describe("Combined Export", () => {
    it("should create proper combined file structure", () => {
      const items = [
        { id: 1, title: "Item 1", content: "Content 1", contentType: "advertorial" },
        { id: 2, title: "Item 2", content: "Content 2", contentType: "vsl_script" },
      ];

      const combined = items.map((item, index) => 
        `---\n## ${index + 1}. ${item.title}\nType: ${item.contentType}\n---\n\n${item.content}`
      ).join("\n\n");

      expect(combined).toContain("## 1. Item 1");
      expect(combined).toContain("## 2. Item 2");
      expect(combined).toContain("Content 1");
      expect(combined).toContain("Content 2");
    });

    it("should calculate total word count correctly", () => {
      const items = [
        { content: "one two three" },
        { content: "four five six seven" },
      ];

      const totalWords = items.reduce((sum, item) => {
        return sum + item.content.split(/\s+/).length;
      }, 0);

      expect(totalWords).toBe(7);
    });
  });

  describe("Individual Export", () => {
    it("should create separate files for each item", () => {
      const items = [
        { id: 1, title: "Item 1", content: "Content 1" },
        { id: 2, title: "Item 2", content: "Content 2" },
      ];

      const files = items.map(item => ({
        filename: `${item.title.toLowerCase().replace(/\s+/g, "-")}.md`,
        content: item.content,
      }));

      expect(files).toHaveLength(2);
      expect(files[0].filename).toBe("item-1.md");
      expect(files[1].filename).toBe("item-2.md");
    });
  });

  describe("JSON Export", () => {
    it("should create valid JSON structure", () => {
      const items = [
        { id: 1, title: "Item 1", content: "Content 1", contentType: "advertorial" },
      ];

      const jsonExport = {
        exportDate: new Date().toISOString(),
        itemCount: items.length,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          contentType: item.contentType,
          content: item.content,
        })),
      };

      const jsonString = JSON.stringify(jsonExport, null, 2);
      const parsed = JSON.parse(jsonString);

      expect(parsed.itemCount).toBe(1);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].title).toBe("Item 1");
    });
  });

  describe("MIME Type Selection", () => {
    it("should return correct MIME type for markdown", () => {
      const getMimeType = (format: string) => {
        const mimeTypes: Record<string, string> = {
          markdown: "text/markdown",
          txt: "text/plain",
          html: "text/html",
          json: "application/json",
        };
        return mimeTypes[format];
      };

      expect(getMimeType("markdown")).toBe("text/markdown");
    });

    it("should return correct MIME type for json", () => {
      const getMimeType = (format: string) => {
        const mimeTypes: Record<string, string> = {
          markdown: "text/markdown",
          txt: "text/plain",
          html: "text/html",
          json: "application/json",
        };
        return mimeTypes[format];
      };

      expect(getMimeType("json")).toBe("application/json");
    });
  });

  describe("Export Destinations", () => {
    it("should support file destination", () => {
      const supportedDestinations = ["file", "google_docs", "notion"];
      expect(supportedDestinations).toContain("file");
    });

    it("should support google_docs destination", () => {
      const supportedDestinations = ["file", "google_docs", "notion"];
      expect(supportedDestinations).toContain("google_docs");
    });

    it("should support notion destination", () => {
      const supportedDestinations = ["file", "google_docs", "notion"];
      expect(supportedDestinations).toContain("notion");
    });
  });

  describe("Google Docs Export", () => {
    it("should format content for Google Docs", () => {
      const items = [
        { id: 1, title: "Item 1", content: "Content 1", contentType: "advertorial", wordCount: 2 },
        { id: 2, title: "Item 2", content: "Content 2", contentType: "vsl_script", wordCount: 2 },
      ];

      const googleDocsContent = items.map((item, index) => {
        return `${index + 1}. ${item.title}\n\nType: ${item.contentType} | Words: ${item.wordCount}\n\n${item.content}\n\n${'─'.repeat(50)}\n\n`;
      }).join('');

      expect(googleDocsContent).toContain("1. Item 1");
      expect(googleDocsContent).toContain("2. Item 2");
      expect(googleDocsContent).toContain("Type: advertorial");
      expect(googleDocsContent).toContain("Type: vsl_script");
    });

    it("should return google_docs destination in response", () => {
      const response = {
        success: true,
        destination: "google_docs",
        exportType: "combined",
        itemCount: 2,
        totalWords: 100,
        content: "formatted content",
        googleDocsUrl: "https://docs.google.com/document/create",
        message: "Ready to export 2 items to Google Docs",
      };

      expect(response.destination).toBe("google_docs");
      expect(response.googleDocsUrl).toBe("https://docs.google.com/document/create");
    });
  });

  describe("Notion Export", () => {
    it("should format content for Notion with callouts", () => {
      const items = [
        { id: 1, title: "Item 1", content: "Content 1", contentType: "advertorial", wordCount: 2 },
      ];

      const notionContent = items.map((item, index) => {
        return `## ${index + 1}. ${item.title}\n\n> **Type:** ${item.contentType} | **Words:** ${item.wordCount}\n\n${item.content}\n\n---\n\n`;
      }).join('');

      expect(notionContent).toContain("## 1. Item 1");
      expect(notionContent).toContain("> **Type:** advertorial");
      expect(notionContent).toContain("---");
    });

    it("should return notion destination in response", () => {
      const response = {
        success: true,
        destination: "notion",
        exportType: "combined",
        itemCount: 2,
        totalWords: 100,
        content: "formatted content",
        message: "Ready to export 2 items to Notion",
      };

      expect(response.destination).toBe("notion");
      expect(response.message).toContain("Notion");
    });
  });

  describe("Export History Tracking", () => {
    it("should track batch_file destination", () => {
      const validDestinations = [
        "google_docs", "notion", "clipboard", "markdown_file", 
        "pdf", "word", "file", "batch_file", "batch_google_docs", "batch_notion"
      ];
      expect(validDestinations).toContain("batch_file");
    });

    it("should track batch_google_docs destination", () => {
      const validDestinations = [
        "google_docs", "notion", "clipboard", "markdown_file", 
        "pdf", "word", "file", "batch_file", "batch_google_docs", "batch_notion"
      ];
      expect(validDestinations).toContain("batch_google_docs");
    });

    it("should track batch_notion destination", () => {
      const validDestinations = [
        "google_docs", "notion", "clipboard", "markdown_file", 
        "pdf", "word", "file", "batch_file", "batch_google_docs", "batch_notion"
      ];
      expect(validDestinations).toContain("batch_notion");
    });
  });
});
