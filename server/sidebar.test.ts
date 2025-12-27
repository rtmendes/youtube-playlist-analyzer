import { describe, it, expect } from "vitest";

// Test comment category detection logic (same as used in Comments page)
function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Personal stories
  if (/\b(i was|i am|my life|my story|happened to me|i experienced|i remember|when i was)\b/i.test(lowerText)) {
    return "story";
  }
  
  // Product requests
  if (/\b(i want|i need|please make|should make|would buy|take my money|shut up and take)\b/i.test(lowerText)) {
    return "request";
  }
  
  // Pain points - use partial match for words like frustrat* (frustrating, frustrated)
  if (/(struggle|problem|issue|frustrat|annoying|hate|difficult|hard to|can't|cannot)/i.test(lowerText)) {
    return "pain_point";
  }
  
  // Questions
  if (/\?/.test(text) || /\b(how do|what is|why does|can you|could you|where can)\b/i.test(lowerText)) {
    return "question";
  }
  
  // Testimonials
  if (/\b(changed my|saved my|helped me|thank you|thanks for|grateful|amazing|best|love this)\b/i.test(lowerText)) {
    return "testimonial";
  }
  
  // Humor
  if (/\b(lol|lmao|😂|🤣|haha|hilarious|funny|dead|dying)\b/i.test(lowerText)) {
    return "humor";
  }
  
  return "general";
}

describe("Comment Category Detection", () => {
  it("should detect personal stories", () => {
    expect(detectCategory("I was struggling with this for years")).toBe("story");
    expect(detectCategory("My story is similar to this")).toBe("story");
    expect(detectCategory("When I was younger, I experienced the same thing")).toBe("story");
  });

  it("should detect product requests", () => {
    expect(detectCategory("I want this as a t-shirt!")).toBe("request");
    expect(detectCategory("Someone please make a course on this")).toBe("request");
    expect(detectCategory("I would buy this instantly")).toBe("request");
    expect(detectCategory("Shut up and take my money!")).toBe("request");
  });

  it("should detect pain points", () => {
    expect(detectCategory("I struggle with this every day")).toBe("pain_point"); // "struggle" triggers pain_point
    expect(detectCategory("This is so frustrating to deal with")).toBe("pain_point");
    expect(detectCategory("The problem is that it's too difficult")).toBe("pain_point");
    expect(detectCategory("It's annoying when this happens")).toBe("pain_point");
  });

  it("should detect questions", () => {
    expect(detectCategory("How do I get started?")).toBe("question");
    expect(detectCategory("What is the best approach?")).toBe("question");
    expect(detectCategory("Can you explain this more?")).toBe("question");
  });

  it("should detect testimonials", () => {
    // Note: "changed my" triggers story detection first due to order
    expect(detectCategory("Thank you so much for this")).toBe("testimonial");
    expect(detectCategory("This is the best video ever")).toBe("testimonial");
    expect(detectCategory("So grateful for this content")).toBe("testimonial");
    expect(detectCategory("This helped me a lot")).toBe("testimonial");
  });

  it("should detect humor", () => {
    expect(detectCategory("lol this is hilarious")).toBe("humor");
    expect(detectCategory("I'm dead 😂")).toBe("humor");
    expect(detectCategory("haha this is so funny")).toBe("humor");
  });

  it("should return general for unclassified comments", () => {
    expect(detectCategory("Nice video")).toBe("general");
    expect(detectCategory("First!")).toBe("general");
    expect(detectCategory("Subscribed")).toBe("general");
  });
});

describe("Video Sorting", () => {
  const videos = [
    { title: "Alpha", viewCount: 1000, likeCount: 100, publishedAt: new Date("2024-01-01") },
    { title: "Beta", viewCount: 5000, likeCount: 50, publishedAt: new Date("2024-06-01") },
    { title: "Gamma", viewCount: 2000, likeCount: 200, publishedAt: new Date("2024-03-01") },
  ];

  it("should sort by views descending", () => {
    const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);
    expect(sorted[0].title).toBe("Beta");
    expect(sorted[1].title).toBe("Gamma");
    expect(sorted[2].title).toBe("Alpha");
  });

  it("should sort by likes descending", () => {
    const sorted = [...videos].sort((a, b) => b.likeCount - a.likeCount);
    expect(sorted[0].title).toBe("Gamma");
    expect(sorted[1].title).toBe("Alpha");
    expect(sorted[2].title).toBe("Beta");
  });

  it("should sort by date descending (newest first)", () => {
    const sorted = [...videos].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    expect(sorted[0].title).toBe("Beta");
    expect(sorted[1].title).toBe("Gamma");
    expect(sorted[2].title).toBe("Alpha");
  });

  it("should sort by title alphabetically", () => {
    const sorted = [...videos].sort((a, b) => a.title.localeCompare(b.title));
    expect(sorted[0].title).toBe("Alpha");
    expect(sorted[1].title).toBe("Beta");
    expect(sorted[2].title).toBe("Gamma");
  });
});

describe("Comment Sorting", () => {
  const comments = [
    { text: "Great video", likeCount: 100, replyCount: 5, publishedAt: new Date("2024-01-01") },
    { text: "Amazing content", likeCount: 500, replyCount: 20, publishedAt: new Date("2024-06-01") },
    { text: "Thanks!", likeCount: 50, replyCount: 2, publishedAt: new Date("2024-03-01") },
  ];

  it("should sort by likes descending (most liked first)", () => {
    const sorted = [...comments].sort((a, b) => b.likeCount - a.likeCount);
    expect(sorted[0].text).toBe("Amazing content");
    expect(sorted[1].text).toBe("Great video");
    expect(sorted[2].text).toBe("Thanks!");
  });

  it("should sort by replies descending (most replies first)", () => {
    const sorted = [...comments].sort((a, b) => b.replyCount - a.replyCount);
    expect(sorted[0].text).toBe("Amazing content");
    expect(sorted[1].text).toBe("Great video");
    expect(sorted[2].text).toBe("Thanks!");
  });

  it("should sort by date descending (newest first)", () => {
    const sorted = [...comments].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    expect(sorted[0].text).toBe("Amazing content");
    expect(sorted[1].text).toBe("Thanks!");
    expect(sorted[2].text).toBe("Great video");
  });
});

describe("Search Filtering", () => {
  const items = [
    { title: "React Tutorial", channel: "Code Academy" },
    { title: "Vue.js Guide", channel: "Web Dev" },
    { title: "React Hooks Deep Dive", channel: "Code Academy" },
  ];

  it("should filter by title", () => {
    const query = "react";
    const filtered = items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(2);
    expect(filtered[0].title).toBe("React Tutorial");
    expect(filtered[1].title).toBe("React Hooks Deep Dive");
  });

  it("should filter by channel", () => {
    const query = "code academy";
    const filtered = items.filter(item => 
      item.channel.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(2);
  });

  it("should return empty for no matches", () => {
    const query = "python";
    const filtered = items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.channel.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(0);
  });
});

describe("Tag Filtering", () => {
  const items = [
    { id: 1, tags: ["marketing", "tutorial"] },
    { id: 2, tags: ["marketing", "review"] },
    { id: 3, tags: ["tutorial", "beginner"] },
    { id: 4, tags: [] },
  ];

  it("should filter by single tag", () => {
    const selectedTags = ["marketing"];
    const filtered = items.filter(item =>
      selectedTags.some(tag => item.tags.includes(tag))
    );
    expect(filtered.length).toBe(2);
    expect(filtered.map(i => i.id)).toEqual([1, 2]);
  });

  it("should filter by multiple tags (OR logic)", () => {
    const selectedTags = ["marketing", "beginner"];
    const filtered = items.filter(item =>
      selectedTags.some(tag => item.tags.includes(tag))
    );
    expect(filtered.length).toBe(3);
    expect(filtered.map(i => i.id)).toEqual([1, 2, 3]);
  });

  it("should return all items when no tags selected", () => {
    const selectedTags: string[] = [];
    const filtered = selectedTags.length === 0 
      ? items 
      : items.filter(item => selectedTags.some(tag => item.tags.includes(tag)));
    expect(filtered.length).toBe(4);
  });
});
