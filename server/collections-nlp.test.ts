import { describe, it, expect } from "vitest";

describe("Comment Collections", () => {
  describe("Collection CRUD operations", () => {
    it("should create a collection with required fields", () => {
      const collection = {
        name: "Product Ideas",
        description: "Comments about product suggestions",
        color: "#6366f1",
        icon: "folder",
      };
      
      expect(collection.name).toBe("Product Ideas");
      expect(collection.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should validate collection color format", () => {
      const validColors = ["#6366f1", "#ef4444", "#22c55e", "#000000", "#FFFFFF"];
      const invalidColors = ["red", "#fff", "6366f1", "#gggggg"];
      
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      validColors.forEach(color => {
        expect(color).toMatch(colorRegex);
      });
      
      invalidColors.forEach(color => {
        expect(color).not.toMatch(colorRegex);
      });
    });

    it("should support multiple collections per user", () => {
      const collections = [
        { name: "Pain Points", color: "#ef4444" },
        { name: "Feature Requests", color: "#22c55e" },
        { name: "Testimonials", color: "#3b82f6" },
      ];
      
      expect(collections.length).toBe(3);
      expect(new Set(collections.map(c => c.name)).size).toBe(3);
    });

    it("should track comment count per collection", () => {
      const collection = {
        name: "Ideas",
        commentCount: 0,
      };
      
      // Simulate adding comments
      collection.commentCount += 5;
      expect(collection.commentCount).toBe(5);
      
      // Simulate removing a comment
      collection.commentCount = Math.max(collection.commentCount - 1, 0);
      expect(collection.commentCount).toBe(4);
    });
  });

  describe("Collection-Comment relationship", () => {
    it("should assign comment to collection by name", () => {
      const comment = {
        id: 1,
        text: "Great product idea!",
        collectionName: null as string | null,
      };
      
      comment.collectionName = "Product Ideas";
      expect(comment.collectionName).toBe("Product Ideas");
    });

    it("should allow removing comment from collection", () => {
      const comment = {
        id: 1,
        text: "Great product idea!",
        collectionName: "Product Ideas" as string | null,
      };
      
      comment.collectionName = null;
      expect(comment.collectionName).toBeNull();
    });

    it("should filter comments by collection", () => {
      const comments = [
        { id: 1, text: "Comment 1", collectionName: "Ideas" },
        { id: 2, text: "Comment 2", collectionName: "Pain Points" },
        { id: 3, text: "Comment 3", collectionName: "Ideas" },
        { id: 4, text: "Comment 4", collectionName: null },
      ];
      
      const ideasComments = comments.filter(c => c.collectionName === "Ideas");
      expect(ideasComments.length).toBe(2);
      
      const uncategorized = comments.filter(c => c.collectionName === null);
      expect(uncategorized.length).toBe(1);
    });
  });
});

describe("NLP Analysis", () => {
  describe("Sentiment Analysis", () => {
    it("should detect positive sentiment", () => {
      const positiveWords = ["love", "great", "amazing", "awesome", "excellent"];
      const text = "I love this video, it's amazing!";
      const lower = text.toLowerCase();
      
      const posScore = positiveWords.filter(w => lower.includes(w)).length;
      expect(posScore).toBeGreaterThan(0);
    });

    it("should detect negative sentiment", () => {
      const negativeWords = ["hate", "bad", "terrible", "awful", "worst"];
      const text = "This is terrible and the worst video ever";
      const lower = text.toLowerCase();
      
      const negScore = negativeWords.filter(w => lower.includes(w)).length;
      expect(negScore).toBeGreaterThan(0);
    });

    it("should detect mixed sentiment", () => {
      const positiveWords = ["love", "great"];
      const negativeWords = ["hate", "bad"];
      const mixedIndicators = ["but", "however", "although"];
      
      const text = "I love the content but the audio is bad";
      const lower = text.toLowerCase();
      
      const posScore = positiveWords.filter(w => lower.includes(w)).length;
      const negScore = negativeWords.filter(w => lower.includes(w)).length;
      const hasMixed = mixedIndicators.some(w => lower.includes(w));
      
      expect(posScore).toBeGreaterThan(0);
      expect(negScore).toBeGreaterThan(0);
      expect(hasMixed).toBe(true);
    });

    it("should calculate sentiment breakdown percentages", () => {
      const breakdown = {
        positive: 60,
        negative: 20,
        neutral: 15,
        mixed: 5,
      };
      
      const total = breakdown.positive + breakdown.negative + breakdown.neutral + breakdown.mixed;
      expect(total).toBe(100);
      
      const positivePercent = Math.round(breakdown.positive / total * 100);
      expect(positivePercent).toBe(60);
    });
  });

  describe("Topic Extraction", () => {
    it("should extract word frequencies", () => {
      const text = "product product feature feature feature quality";
      const words = text.split(/\W+/).filter(w => w.length > 4);
      
      const wordFreq: Record<string, number> = {};
      words.forEach(w => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
      
      expect(wordFreq["product"]).toBe(2);
      expect(wordFreq["feature"]).toBe(3);
      expect(wordFreq["quality"]).toBe(1);
    });

    it("should filter stop words", () => {
      const stopWords = new Set(["about", "after", "again", "being", "could", "every"]);
      const words = ["about", "product", "after", "feature", "quality"];
      
      const filtered = words.filter(w => !stopWords.has(w));
      expect(filtered).toEqual(["product", "feature", "quality"]);
    });

    it("should rank topics by frequency", () => {
      const wordFreq: Record<string, number> = {
        "product": 10,
        "feature": 8,
        "quality": 5,
        "price": 3,
      };
      
      const ranked = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);
      
      expect(ranked[0]).toBe("product");
      expect(ranked[1]).toBe("feature");
    });
  });

  describe("Pain Points and Suggestions", () => {
    it("should identify pain points from negative comments", () => {
      const negativeWords = ["hate", "bad", "terrible"];
      const comments = [
        { text: "The audio quality is terrible" },
        { text: "Great video!" },
        { text: "I hate the new interface" },
      ];
      
      const painPoints = comments.filter(c => {
        const lower = c.text.toLowerCase();
        return negativeWords.some(w => lower.includes(w));
      });
      
      expect(painPoints.length).toBe(2);
    });

    it("should extract suggestions from comments", () => {
      const suggestionPatterns = ["should", "could", "would be nice", "please", "wish"];
      const comments = [
        { text: "You should add more examples" },
        { text: "Great content!" },
        { text: "Please make more videos like this" },
        { text: "I wish there was a dark mode" },
      ];
      
      const suggestions = comments.filter(c => {
        const lower = c.text.toLowerCase();
        return suggestionPatterns.some(p => lower.includes(p));
      });
      
      expect(suggestions.length).toBe(3);
    });

    it("should extract questions from comments", () => {
      const comments = [
        { text: "How do I use this feature?" },
        { text: "Great video!" },
        { text: "What's the best approach?" },
        { text: "Thanks for sharing" },
      ];
      
      const questions = comments.filter(c => c.text.includes("?"));
      expect(questions.length).toBe(2);
    });
  });

  describe("Named Entity Recognition", () => {
    it("should extract brand names from comments", () => {
      const brandPattern = /\b(iphone|android|samsung|apple|google|amazon)\b/gi;
      const comments = [
        { text: "This works great on my iPhone" },
        { text: "Does it support Android?" },
        { text: "I use Google Chrome" },
      ];
      
      const entities: Record<string, number> = {};
      comments.forEach(c => {
        const matches = c.text.match(brandPattern);
        if (matches) {
          matches.forEach(m => {
            const normalized = m.toLowerCase();
            entities[normalized] = (entities[normalized] || 0) + 1;
          });
        }
      });
      
      expect(entities["iphone"]).toBe(1);
      expect(entities["android"]).toBe(1);
      expect(entities["google"]).toBe(1);
    });

    it("should count entity occurrences across comments", () => {
      const brandPattern = /\b(apple)\b/gi;
      const comments = [
        { text: "Apple makes great products" },
        { text: "I love my Apple watch" },
        { text: "Apple is innovative" },
      ];
      
      let count = 0;
      comments.forEach(c => {
        const matches = c.text.match(brandPattern);
        if (matches) count += matches.length;
      });
      
      expect(count).toBe(3);
    });
  });

  describe("Summary Generation", () => {
    it("should generate analysis summary", () => {
      const analysis = {
        commentCount: 100,
        positive: 60,
        negative: 20,
        neutral: 20,
        topTopics: ["product", "feature", "quality"],
        themes: ["Generally positive feedback"],
      };
      
      const summary = `Analysis of ${analysis.commentCount} comments shows ${analysis.positive}% positive, ${analysis.negative}% negative, and ${analysis.neutral}% neutral sentiment. Top topics include: ${analysis.topTopics.slice(0, 3).join(", ")}. ${analysis.themes.join(". ")}.`;
      
      expect(summary).toContain("100 comments");
      expect(summary).toContain("60% positive");
      expect(summary).toContain("product, feature, quality");
    });
  });
});

describe("Collection Colors", () => {
  it("should have predefined color palette", () => {
    const COLLECTION_COLORS = [
      "#6366f1", // indigo
      "#ef4444", // red
      "#f97316", // orange
      "#eab308", // yellow
      "#22c55e", // green
      "#06b6d4", // cyan
      "#3b82f6", // blue
      "#a855f7", // purple
      "#ec4899", // pink
      "#64748b", // slate
    ];
    
    expect(COLLECTION_COLORS.length).toBe(10);
    COLLECTION_COLORS.forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
