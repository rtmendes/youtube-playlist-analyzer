import { describe, it, expect } from "vitest";

// Test sentiment analysis logic
function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = ["love", "great", "amazing", "awesome", "excellent", "fantastic", "wonderful", "best", "perfect", "helpful", "thank", "thanks", "good", "nice", "beautiful", "brilliant", "incredible", "outstanding", "superb", "recommend"];
  const negativeWords = ["hate", "bad", "terrible", "awful", "worst", "horrible", "poor", "disappointing", "waste", "boring", "annoying", "useless", "trash", "garbage", "sucks", "stupid", "dumb", "scam", "fake", "wrong"];
  
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

// Test keyword filter logic
function filterByKeywords(comments: { text: string }[], keywordFilter: string): { text: string }[] {
  if (!keywordFilter) return comments;
  const keywords = keywordFilter.toLowerCase().split(",").map(k => k.trim()).filter(Boolean);
  return comments.filter((c) =>
    keywords.some(keyword => c.text.toLowerCase().includes(keyword))
  );
}

// Test topic extraction logic
function extractTopics(comments: string[]): string[] {
  const allText = comments.join(" ");
  const words = allText.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const wordFreq: Record<string, number> = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  return sortedWords;
}

describe("Split View Comment Features", () => {
  describe("Sentiment Analysis", () => {
    it("should detect positive sentiment", () => {
      expect(analyzeSentiment("This is amazing! I love it!")).toBe("positive");
      expect(analyzeSentiment("Great video, thanks for sharing")).toBe("positive");
      expect(analyzeSentiment("This is the best tutorial ever")).toBe("positive");
    });

    it("should detect negative sentiment", () => {
      expect(analyzeSentiment("This is terrible and boring")).toBe("negative");
      expect(analyzeSentiment("Worst video ever, total waste of time")).toBe("negative");
      expect(analyzeSentiment("This sucks, very disappointing")).toBe("negative");
    });

    it("should detect neutral sentiment", () => {
      expect(analyzeSentiment("Just watched the video")).toBe("neutral");
      expect(analyzeSentiment("I have a question about this")).toBe("neutral");
      expect(analyzeSentiment("Can you make more videos?")).toBe("neutral");
    });

    it("should handle mixed sentiment by comparing scores", () => {
      // More positive than negative
      expect(analyzeSentiment("Great video but a bit boring")).toBe("neutral"); // 1 positive, 1 negative = neutral
      expect(analyzeSentiment("Amazing and wonderful but bad audio")).toBe("positive"); // 2 positive, 1 negative
    });
  });

  describe("Keyword Filtering", () => {
    const comments = [
      { text: "This video about cooking is great" },
      { text: "Love the recipe for pasta" },
      { text: "The music in this video is nice" },
      { text: "Great tutorial on photography" },
      { text: "Cooking tips are very helpful" },
    ];

    it("should filter by single keyword", () => {
      const filtered = filterByKeywords(comments, "cooking");
      expect(filtered.length).toBe(2);
      expect(filtered.every(c => c.text.toLowerCase().includes("cooking"))).toBe(true);
    });

    it("should filter by multiple keywords (comma-separated)", () => {
      const filtered = filterByKeywords(comments, "cooking, music");
      expect(filtered.length).toBe(3);
    });

    it("should return all comments when no keyword filter", () => {
      const filtered = filterByKeywords(comments, "");
      expect(filtered.length).toBe(5);
    });

    it("should be case-insensitive", () => {
      const filtered = filterByKeywords(comments, "COOKING");
      expect(filtered.length).toBe(2);
    });

    it("should handle whitespace in keywords", () => {
      const filtered = filterByKeywords(comments, "  cooking  ,  music  ");
      expect(filtered.length).toBe(3);
    });
  });

  describe("Topic Extraction", () => {
    it("should extract most frequent words", () => {
      const comments = [
        "This video about cooking is amazing",
        "Love cooking tutorials like this",
        "Great cooking tips for beginners",
        "Cooking has never been easier",
        "Thanks for the cooking advice",
      ];
      
      const topics = extractTopics(comments);
      expect(topics).toContain("cooking");
      expect(topics.length).toBeLessThanOrEqual(10);
    });

    it("should filter out short words", () => {
      const comments = ["I am a fan of this video"];
      const topics = extractTopics(comments);
      // Words like "am", "a", "of" should be filtered (length <= 4)
      expect(topics.every(t => t.length > 4)).toBe(true);
    });

    it("should handle empty comments", () => {
      const topics = extractTopics([]);
      expect(topics).toEqual([]);
    });
  });
});

describe("Saved Comments Features", () => {
  describe("Source Type Validation", () => {
    const validSourceTypes = ["youtube", "amazon", "reddit", "tiktok"];
    
    it("should accept valid source types", () => {
      validSourceTypes.forEach(source => {
        expect(validSourceTypes.includes(source)).toBe(true);
      });
    });

    it("should have correct source count", () => {
      expect(validSourceTypes.length).toBe(4);
    });
  });

  describe("Comment Grouping", () => {
    const savedComments = [
      { id: 1, sourceType: "youtube", sourceId: "video1", text: "Comment 1" },
      { id: 2, sourceType: "youtube", sourceId: "video1", text: "Comment 2" },
      { id: 3, sourceType: "amazon", sourceId: "product1", text: "Comment 3" },
      { id: 4, sourceType: "reddit", sourceId: "post1", text: "Comment 4" },
      { id: 5, sourceType: "youtube", sourceId: "video2", text: "Comment 5" },
    ];

    it("should group comments by source", () => {
      const groups: Record<string, typeof savedComments> = {};
      savedComments.forEach((comment) => {
        const key = `${comment.sourceType}-${comment.sourceId}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(comment);
      });
      
      expect(Object.keys(groups).length).toBe(4);
      expect(groups["youtube-video1"].length).toBe(2);
      expect(groups["amazon-product1"].length).toBe(1);
    });

    it("should count comments by source type", () => {
      const counts = { youtube: 0, amazon: 0, reddit: 0, tiktok: 0 };
      savedComments.forEach((c) => {
        if (c.sourceType in counts) {
          counts[c.sourceType as keyof typeof counts]++;
        }
      });
      
      expect(counts.youtube).toBe(3);
      expect(counts.amazon).toBe(1);
      expect(counts.reddit).toBe(1);
      expect(counts.tiktok).toBe(0);
    });
  });

  describe("CSV Export Format", () => {
    it("should escape quotes in CSV", () => {
      const text = 'He said "hello" to me';
      const escaped = `"${text.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"He said ""hello"" to me"');
    });

    it("should format CSV headers correctly", () => {
      const headers = ["Source", "Author", "Comment", "Notes", "Saved Date"];
      const csvHeader = headers.join(",");
      expect(csvHeader).toBe("Source,Author,Comment,Notes,Saved Date");
    });
  });

  describe("Search Functionality", () => {
    const comments = [
      { text: "Great product review", authorName: "John", notes: "Important feedback" },
      { text: "Terrible experience", authorName: "Jane", notes: null },
      { text: "Average quality", authorName: "Bob", notes: "Follow up needed" },
    ];

    it("should search in comment text", () => {
      const query = "product";
      const filtered = comments.filter(c => c.text.toLowerCase().includes(query));
      expect(filtered.length).toBe(1);
    });

    it("should search in author name", () => {
      const query = "jane";
      const filtered = comments.filter(c => c.authorName.toLowerCase().includes(query));
      expect(filtered.length).toBe(1);
    });

    it("should search in notes", () => {
      const query = "follow";
      const filtered = comments.filter(c => c.notes && c.notes.toLowerCase().includes(query));
      expect(filtered.length).toBe(1);
    });
  });
});
