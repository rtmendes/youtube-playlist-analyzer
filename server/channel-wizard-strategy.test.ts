import { describe, it, expect, vi } from "vitest";
import { parseYouTubeInput, isValidChannelId, formatCount, formatDuration } from "./youtube";

// Test YouTube channel search and resolve utilities
describe("YouTube Channel Linking Wizard", () => {
  describe("Channel URL parsing", () => {
    it("should parse standard channel URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxxx");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBeTruthy();
    });

    it("should parse channel handle URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/@testchannel");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("testchannel");
    });

    it("should parse /c/ format URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/c/testchannel");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("testchannel");
    });

    it("should parse raw channel IDs", () => {
      const result = parseYouTubeInput("UCddiUEpeqJcYeBxX1IVBKvQ");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCddiUEpeqJcYeBxX1IVBKvQ");
    });

    it("should return unknown for invalid input", () => {
      const result = parseYouTubeInput("not-a-youtube-url");
      expect(result.type).toBe("unknown");
    });
  });

  describe("Channel validation", () => {
    it("should validate correct channel IDs", () => {
      // UC/SC prefix + exactly 22 alphanumeric chars
      expect(isValidChannelId("UCddiUEpeqJcYeBxX1IVBKvQ")).toBe(true);
      expect(isValidChannelId("SC1234567890abcdefghijkl")).toBe(true);
    });

    it("should reject invalid channel IDs", () => {
      expect(isValidChannelId("not-a-channel-id")).toBe(false);
      expect(isValidChannelId("")).toBe(false);
      expect(isValidChannelId("UC")).toBe(false);
      expect(isValidChannelId("UCtooshort")).toBe(false);
    });
  });

  describe("Format utilities", () => {
    it("should format large numbers correctly", () => {
      expect(formatCount(1500000)).toBe("1.5M");
      expect(formatCount(2500)).toBe("2.5K");
      expect(formatCount(500)).toBe("500");
      expect(formatCount(null)).toBe("0");
      expect(formatCount(undefined)).toBe("0");
    });

    it("should format duration correctly", () => {
      expect(formatDuration("PT1H30M45S")).toBe("1:30:45");
      expect(formatDuration("PT5M30S")).toBe("5:30");
      expect(formatDuration("PT45S")).toBe("0:45");
      expect(formatDuration("")).toBe("0:00");
    });
  });
});

describe("Content Strategy Integration", () => {
  describe("Gap Analysis URL parameter handling", () => {
    it("should construct correct URL with topic parameter", () => {
      const topic = "podcast content";
      const competitors = ["Competitor A", "Competitor B"];
      const url = `/content-generator?topic=${encodeURIComponent(topic)}&source=gap-analysis&competitors=${encodeURIComponent(competitors.join(","))}`;
      
      expect(url).toContain("topic=podcast%20content");
      expect(url).toContain("source=gap-analysis");
      expect(url).toContain("competitors=Competitor%20A%2CCompetitor%20B");
    });

    it("should construct correct URL with priority parameter", () => {
      const topic = "Low Competition Days";
      const priority = "high";
      const type = "timing";
      const url = `/content-generator?topic=${encodeURIComponent(topic)}&source=gap-analysis&priority=${priority}&type=${type}`;
      
      expect(url).toContain("topic=Low%20Competition%20Days");
      expect(url).toContain("priority=high");
      expect(url).toContain("type=timing");
    });

    it("should handle special characters in topic names", () => {
      const topic = "Q&A sessions & live streams";
      const encoded = encodeURIComponent(topic);
      const decoded = decodeURIComponent(encoded);
      
      expect(decoded).toBe(topic);
      expect(encoded).not.toContain("&");
    });

    it("should handle empty competitors list", () => {
      const topic = "webinar";
      const competitors: string[] = [];
      const url = `/content-generator?topic=${encodeURIComponent(topic)}&source=gap-analysis&competitors=${encodeURIComponent(competitors.join(","))}`;
      
      expect(url).toContain("topic=webinar");
      expect(url).toContain("competitors=");
    });
  });

  describe("Content gap identification", () => {
    it("should identify topics covered by multiple competitors", () => {
      const topicCountMap: Record<string, string[]> = {
        "tutorials": ["Competitor A", "Competitor B", "Competitor C"],
        "reviews": ["Competitor A"],
        "vlogs": ["Competitor B", "Competitor C"],
      };

      const contentGaps = Object.entries(topicCountMap)
        .filter(([_, names]) => names.length >= 2)
        .map(([topic, names]) => ({
          topic,
          coveredBy: names,
          opportunity: `${names.length} competitors cover this topic`,
        }));

      expect(contentGaps).toHaveLength(2);
      expect(contentGaps[0].topic).toBe("tutorials");
      expect(contentGaps[0].coveredBy).toHaveLength(3);
      expect(contentGaps[1].topic).toBe("vlogs");
    });

    it("should prioritize opportunities correctly", () => {
      const opportunities = [
        { title: "Podcast Gap", priority: "medium" as const, type: "content_type" },
        { title: "Low Competition Days", priority: "high" as const, type: "timing" },
        { title: "Webinar Opportunity", priority: "medium" as const, type: "content_type" },
      ];

      const highPriority = opportunities.filter(o => o.priority === "high");
      const mediumPriority = opportunities.filter(o => o.priority === "medium");

      expect(highPriority).toHaveLength(1);
      expect(mediumPriority).toHaveLength(2);
      expect(highPriority[0].title).toBe("Low Competition Days");
    });
  });

  describe("Engagement benchmark calculations", () => {
    it("should calculate average engagement metrics", () => {
      const data = { views: 10000, likes: 500, comments: 50, count: 10 };
      
      const avgViews = data.count > 0 ? Math.round(data.views / data.count) : 0;
      const avgLikes = data.count > 0 ? Math.round(data.likes / data.count) : 0;
      const avgComments = data.count > 0 ? Math.round(data.comments / data.count) : 0;
      const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;

      expect(avgViews).toBe(1000);
      expect(avgLikes).toBe(50);
      expect(avgComments).toBe(5);
      expect(engagementRate).toBe(5.5);
    });

    it("should handle zero count gracefully", () => {
      const data = { views: 0, likes: 0, comments: 0, count: 0 };
      
      const avgViews = data.count > 0 ? Math.round(data.views / data.count) : 0;
      const engagementRate = avgViews > 0 ? ((0 + 0) / avgViews) * 100 : 0;

      expect(avgViews).toBe(0);
      expect(engagementRate).toBe(0);
    });
  });
});

describe("Channel Search Results Processing", () => {
  it("should filter out results without channelId", () => {
    const mockResults = [
      { id: { kind: "youtube#channel", channelId: "UC123" }, snippet: { title: "Channel 1", description: "Desc 1", thumbnails: {} } },
      { id: { kind: "youtube#channel" }, snippet: { title: "Channel 2", description: "Desc 2", thumbnails: {} } },
      { id: { kind: "youtube#channel", channelId: "UC456" }, snippet: { title: "Channel 3", description: "Desc 3", thumbnails: {} } },
    ];

    const channels = mockResults
      .filter(item => item.id.channelId)
      .map(item => ({
        channelId: item.id.channelId!,
        channelName: item.snippet.title,
        description: item.snippet.description,
      }));

    expect(channels).toHaveLength(2);
    expect(channels[0].channelId).toBe("UC123");
    expect(channels[1].channelId).toBe("UC456");
  });

  it("should handle empty search results", () => {
    const mockResults: any[] = [];
    
    const channels = mockResults
      .filter(item => item.id?.channelId)
      .map(item => ({
        channelId: item.id.channelId,
        channelName: item.snippet.title,
      }));

    expect(channels).toHaveLength(0);
  });
});
