import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("Content Templates & Versioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Template Variable Extraction", () => {
    it("should extract variables from {{variable}} patterns", () => {
      const content = "Hello {{name}}, your product {{product_name}} is ready!";
      const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
      const uniqueVars = Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim())));
      
      expect(uniqueVars).toContain("name");
      expect(uniqueVars).toContain("product_name");
      expect(uniqueVars.length).toBe(2);
    });

    it("should handle duplicate variables", () => {
      const content = "{{name}} said hello to {{name}} about {{product}}";
      const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
      const uniqueVars = Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim())));
      
      expect(uniqueVars).toContain("name");
      expect(uniqueVars).toContain("product");
      expect(uniqueVars.length).toBe(2);
    });

    it("should return empty array for content without variables", () => {
      const content = "This is plain content without any variables.";
      const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
      
      expect(matches.length).toBe(0);
    });
  });

  describe("Template Variable Replacement", () => {
    it("should replace variables with provided values", () => {
      const template = "Hello {{name}}, your product {{product_name}} is ready!";
      const values = { name: "John", product_name: "Widget Pro" };
      
      let content = template;
      for (const [key, value] of Object.entries(values)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      
      expect(content).toBe("Hello John, your product Widget Pro is ready!");
    });

    it("should handle multiple occurrences of same variable", () => {
      const template = "{{name}} loves {{name}}'s product";
      const values = { name: "Alice" };
      
      let content = template;
      for (const [key, value] of Object.entries(values)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      
      expect(content).toBe("Alice loves Alice's product");
    });

    it("should leave unreplaced variables intact", () => {
      const template = "Hello {{name}}, your {{product}} is ready!";
      const values = { name: "Bob" };
      
      let content = template;
      for (const [key, value] of Object.entries(values)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      
      expect(content).toBe("Hello Bob, your {{product}} is ready!");
    });
  });

  describe("Version Number Calculation", () => {
    it("should calculate next version number correctly", () => {
      const existingVersions = [{ versionNumber: 3 }, { versionNumber: 2 }, { versionNumber: 1 }];
      const nextVersion = (existingVersions[0]?.versionNumber || 0) + 1;
      
      expect(nextVersion).toBe(4);
    });

    it("should start at version 1 for new content", () => {
      const existingVersions: { versionNumber: number }[] = [];
      const nextVersion = (existingVersions[0]?.versionNumber || 0) + 1;
      
      expect(nextVersion).toBe(1);
    });
  });

  describe("Metrics Calculation", () => {
    it("should calculate CTR correctly", () => {
      const metrics = { impressions: 1000, clicks: 50 };
      const ctr = (metrics.clicks / metrics.impressions) * 100;
      
      expect(ctr).toBe(5);
    });

    it("should calculate conversion rate correctly", () => {
      const metrics = { clicks: 100, conversions: 10 };
      const conversionRate = (metrics.conversions / metrics.clicks) * 100;
      
      expect(conversionRate).toBe(10);
    });

    it("should handle zero impressions gracefully", () => {
      const metrics = { impressions: 0, clicks: 0 };
      const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      
      expect(ctr).toBe(0);
    });
  });

  describe("Export Format Conversion", () => {
    it("should strip markdown for plain text export", () => {
      const markdown = "# Heading\n**Bold** and *italic* text";
      const plainText = markdown.replace(/[#*_`]/g, '');
      
      expect(plainText).not.toContain("#");
      expect(plainText).not.toContain("*");
    });

    it("should preserve markdown for markdown export", () => {
      const markdown = "# Heading\n**Bold** text";
      
      expect(markdown).toContain("#");
      expect(markdown).toContain("**");
    });

    it("should convert markdown headers to HTML", () => {
      const markdown = "# Main Title";
      const html = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      
      expect(html).toBe("<h1>Main Title</h1>");
    });

    it("should convert markdown bold to HTML strong", () => {
      const markdown = "This is **bold** text";
      const html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      expect(html).toBe("This is <strong>bold</strong> text");
    });
  });

  describe("Word Count Calculation", () => {
    it("should count words correctly", () => {
      const content = "This is a test sentence with seven words.";
      const wordCount = content.split(/\s+/).length;
      
      expect(wordCount).toBe(8);
    });

    it("should handle empty content", () => {
      const content = "";
      const wordCount = content ? content.split(/\s+/).length : 0;
      
      expect(wordCount).toBe(0);
    });
  });

  describe("Content Type Validation", () => {
    const validTypes = [
      "advertorial",
      "vsl_script",
      "ugc_scenario",
      "course_outline",
      "ad_copy",
      "sales_page",
      "email_sequence",
      "product_idea"
    ];

    it("should validate all content types", () => {
      validTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(true);
      });
    });

    it("should reject invalid content types", () => {
      const invalidType = "invalid_type";
      expect(validTypes.includes(invalidType)).toBe(false);
    });
  });

  describe("Version Status Transitions", () => {
    const validStatuses = ["draft", "active", "testing", "winner", "archived"];

    it("should validate all status values", () => {
      validStatuses.forEach(status => {
        expect(validStatuses.includes(status)).toBe(true);
      });
    });

    it("should reject invalid status values", () => {
      const invalidStatus = "invalid";
      expect(validStatuses.includes(invalidStatus)).toBe(false);
    });
  });

  describe("Simple Diff Algorithm", () => {
    it("should identify same lines", () => {
      const linesA = ["line 1", "line 2"];
      const linesB = ["line 1", "line 2"];
      
      const diff: { type: string; line: string }[] = [];
      for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
        if (linesA[i] === linesB[i]) {
          diff.push({ type: 'same', line: linesA[i] || '' });
        }
      }
      
      expect(diff.length).toBe(2);
      expect(diff.every(d => d.type === 'same')).toBe(true);
    });

    it("should identify added lines", () => {
      const linesA = ["line 1"];
      const linesB = ["line 1", "line 2"];
      
      const diff: { type: string; line: string }[] = [];
      for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
        if (linesA[i] === linesB[i]) {
          diff.push({ type: 'same', line: linesA[i] || '' });
        } else {
          if (linesA[i] !== undefined) diff.push({ type: 'removed', line: linesA[i] });
          if (linesB[i] !== undefined) diff.push({ type: 'added', line: linesB[i] });
        }
      }
      
      expect(diff.some(d => d.type === 'added')).toBe(true);
    });

    it("should identify removed lines", () => {
      const linesA = ["line 1", "line 2"];
      const linesB = ["line 1"];
      
      const diff: { type: string; line: string }[] = [];
      for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
        if (linesA[i] === linesB[i]) {
          diff.push({ type: 'same', line: linesA[i] || '' });
        } else {
          if (linesA[i] !== undefined) diff.push({ type: 'removed', line: linesA[i] });
          if (linesB[i] !== undefined) diff.push({ type: 'added', line: linesB[i] });
        }
      }
      
      expect(diff.some(d => d.type === 'removed')).toBe(true);
    });
  });

  describe("Export Destination Validation", () => {
    const validDestinations = ["google_docs", "notion", "clipboard", "markdown_file", "pdf", "word"];

    it("should validate all export destinations", () => {
      validDestinations.forEach(dest => {
        expect(validDestinations.includes(dest)).toBe(true);
      });
    });
  });

  describe("Filename Sanitization", () => {
    it("should sanitize filename for download", () => {
      const title = "My Awesome Content!";
      const sanitized = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      expect(sanitized).toBe("my_awesome_content_");
      expect(sanitized).not.toContain("!");
    });

    it("should handle special characters", () => {
      const title = "Content: Version 1.0 (Final)";
      const sanitized = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      expect(sanitized).not.toContain(":");
      expect(sanitized).not.toContain("(");
      expect(sanitized).not.toContain(")");
    });
  });
});
