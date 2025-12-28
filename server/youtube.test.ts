import { describe, it, expect } from "vitest";
import { parseYouTubeInput, formatDuration, formatCount, isValidVideoId, isValidChannelId } from "./youtube";

describe("YouTube URL Parser", () => {
  describe("parseYouTubeInput", () => {
    it("should parse standard playlist URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
    });

    it("should parse video ID from watch URL with list parameter (video takes priority)", () => {
      const result = parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
      // Video ID takes priority in watch URLs since the user is watching a specific video
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse raw playlist IDs", () => {
      const result = parseYouTubeInput("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
    });

    it("should parse playlist URLs with /?list= format", () => {
      const result = parseYouTubeInput("https://www.youtube.com/?list=PLHXW2PL9wgyd8CFzjh3CadBA6rIzK9eNN");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLHXW2PL9wgyd8CFzjh3CadBA6rIzK9eNN");
    });

    it("should parse playlist URLs with ?list= format (no slash)", () => {
      const result = parseYouTubeInput("https://www.youtube.com?list=PLHXW2PL9wgyd8CFzjh3CadBA6rIzK9eNN");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLHXW2PL9wgyd8CFzjh3CadBA6rIzK9eNN");
    });

    it("should parse playlist URLs from YouTube homepage with list param", () => {
      const result = parseYouTubeInput("https://youtube.com/?list=PLtest123");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLtest123");
    });

    it("should parse standard video URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse short video URLs (youtu.be)", () => {
      const result = parseYouTubeInput("https://youtu.be/dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse embed video URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse shorts URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/shorts/dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse raw video IDs", () => {
      const result = parseYouTubeInput("dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse channel URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCuAXFkgsw1L7xaCfnd5JJOw");
    });

    it("should parse raw channel IDs", () => {
      const result = parseYouTubeInput("UCuAXFkgsw1L7xaCfnd5JJOw");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCuAXFkgsw1L7xaCfnd5JJOw");
    });

    it("should parse channel handle URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/@MrBeast");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("MrBeast");
    });

    // Additional comprehensive URL format tests
    it("should parse mobile YouTube URLs (m.youtube.com)", () => {
      const result = parseYouTubeInput("https://m.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse YouTube Music video URLs", () => {
      const result = parseYouTubeInput("https://music.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse YouTube Music playlist URLs", () => {
      const result = parseYouTubeInput("https://music.youtube.com/playlist?list=OLAK5uy_test123");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("OLAK5uy_test123");
    });

    it("should parse youtube-nocookie.com embed URLs", () => {
      const result = parseYouTubeInput("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse live stream URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/live/dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse old-style /v/ URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/v/dQw4w9WgXcQ");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse URLs with additional query parameters", () => {
      const result = parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&feature=share");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse youtu.be URLs with query params", () => {
      const result = parseYouTubeInput("https://youtu.be/dQw4w9WgXcQ?t=30");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should parse mobile playlist URLs", () => {
      const result = parseYouTubeInput("https://m.youtube.com/playlist?list=PLtest123");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLtest123");
    });

    it("should parse legacy /user/ channel URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/user/PewDiePie");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("PewDiePie");
    });

    it("should parse /c/ custom channel URLs", () => {
      const result = parseYouTubeInput("https://www.youtube.com/c/MrBeast");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("MrBeast");
    });

    it("should parse Radio/Mix playlist IDs (RD prefix)", () => {
      const result = parseYouTubeInput("RDdQw4w9WgXcQ");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("RDdQw4w9WgXcQ");
    });

    it("should parse RDMM playlist IDs (My Mix)", () => {
      const result = parseYouTubeInput("RDMMdQw4w9WgXcQ");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("RDMMdQw4w9WgXcQ");
    });

    it("should return unknown for invalid URLs", () => {
      const result = parseYouTubeInput("https://example.com/not-youtube");
      expect(result.type).toBe("unknown");
    });

    it("should return unknown for empty strings", () => {
      const result = parseYouTubeInput("");
      expect(result.type).toBe("unknown");
    });
  });

  describe("formatDuration", () => {
    it("should format hours, minutes, and seconds", () => {
      expect(formatDuration("PT1H30M45S")).toBe("1:30:45");
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration("PT5M30S")).toBe("5:30");
    });

    it("should format seconds only", () => {
      expect(formatDuration("PT45S")).toBe("0:45");
    });

    it("should format minutes only", () => {
      expect(formatDuration("PT10M")).toBe("10:00");
    });

    it("should handle empty string", () => {
      expect(formatDuration("")).toBe("0:00");
    });

    it("should pad minutes and seconds with zeros", () => {
      expect(formatDuration("PT2H5M3S")).toBe("2:05:03");
    });
  });

  describe("formatCount", () => {
    it("should format billions", () => {
      expect(formatCount(1500000000)).toBe("1.5B");
    });

    it("should format millions", () => {
      expect(formatCount(2500000)).toBe("2.5M");
    });

    it("should format thousands", () => {
      expect(formatCount(15000)).toBe("15.0K");
    });

    it("should not format small numbers", () => {
      expect(formatCount(500)).toBe("500");
    });

    it("should handle zero", () => {
      expect(formatCount(0)).toBe("0");
    });

    it("should handle null", () => {
      expect(formatCount(null)).toBe("0");
    });

    it("should handle undefined", () => {
      expect(formatCount(undefined)).toBe("0");
    });
  });

  describe("isValidVideoId", () => {
    it("should return true for valid 11-character video IDs", () => {
      expect(isValidVideoId("dQw4w9WgXcQ")).toBe(true);
    });

    it("should return true for video IDs with underscores and hyphens", () => {
      expect(isValidVideoId("abc_def-123")).toBe(true);
    });

    it("should return false for IDs that are too short", () => {
      expect(isValidVideoId("abc")).toBe(false);
    });

    it("should return false for IDs that are too long", () => {
      expect(isValidVideoId("dQw4w9WgXcQextra")).toBe(false);
    });

    it("should return false for IDs with invalid characters", () => {
      expect(isValidVideoId("dQw4w9WgXc!")).toBe(false);
    });
  });

  describe("isValidChannelId", () => {
    it("should return true for valid UC channel IDs", () => {
      expect(isValidChannelId("UCuAXFkgsw1L7xaCfnd5JJOw")).toBe(true);
    });

    it("should return true for valid SC channel IDs", () => {
      expect(isValidChannelId("SCuAXFkgsw1L7xaCfnd5JJOw")).toBe(true);
    });

    it("should return false for IDs without UC/SC prefix", () => {
      expect(isValidChannelId("ABuAXFkgsw1L7xaCfnd5JJOw")).toBe(false);
    });

    it("should return false for IDs that are too short", () => {
      expect(isValidChannelId("UCabc")).toBe(false);
    });
  });
});
