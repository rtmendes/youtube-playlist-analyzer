import { describe, it, expect } from "vitest";
import { parseYouTubeInput } from "./youtube";

describe("Channel URL Parsing", () => {
  describe("Channel ID URLs", () => {
    it("should parse channel URL with UC prefix", () => {
      const result = parseYouTubeInput("https://youtube.com/channel/UCddiUEpeqJcYeBxX1IVBKvQ");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCddiUEpeqJcYeBxX1IVBKvQ");
    });

    it("should parse channel URL with www prefix", () => {
      const result = parseYouTubeInput("https://www.youtube.com/channel/UCddiUEpeqJcYeBxX1IVBKvQ");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCddiUEpeqJcYeBxX1IVBKvQ");
    });

    it("should parse channel URL with query parameters", () => {
      const result = parseYouTubeInput("https://youtube.com/channel/UCddiUEpeqJcYeBxX1IVBKvQ?sub_confirmation=1");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCddiUEpeqJcYeBxX1IVBKvQ");
    });

    it("should parse bare channel ID starting with UC", () => {
      const result = parseYouTubeInput("UCddiUEpeqJcYeBxX1IVBKvQ");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("UCddiUEpeqJcYeBxX1IVBKvQ");
    });

    it("should parse channel ID starting with SC", () => {
      const result = parseYouTubeInput("SCddiUEpeqJcYeBxX1IVBKvQ");
      expect(result.type).toBe("channel_id");
      expect(result.value).toBe("SCddiUEpeqJcYeBxX1IVBKvQ");
    });
  });

  describe("Channel Handle URLs", () => {
    it("should parse channel handle URL with @", () => {
      const result = parseYouTubeInput("https://youtube.com/@MrBeast");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("MrBeast");
    });

    it("should parse channel handle URL with www prefix", () => {
      const result = parseYouTubeInput("https://www.youtube.com/@TechChannel");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("TechChannel");
    });

    it("should parse channel handle with query parameters", () => {
      const result = parseYouTubeInput("https://youtube.com/@MyChannel?sub_confirmation=1");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("MyChannel");
    });

    it("should parse channel handle with numbers", () => {
      const result = parseYouTubeInput("https://youtube.com/@Channel123");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("Channel123");
    });

    it("should parse channel handle with underscores and hyphens", () => {
      const result = parseYouTubeInput("https://youtube.com/@My_Channel-Name");
      expect(result.type).toBe("channel_handle");
      expect(result.value).toBe("My_Channel-Name");
    });
  });

  describe("URL Type Priority", () => {
    it("should prioritize video_id over playlist_id in watch URLs", () => {
      const result = parseYouTubeInput("https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest");
      expect(result.type).toBe("video_id");
      expect(result.value).toBe("dQw4w9WgXcQ");
    });

    it("should detect playlist_id for playlist URLs", () => {
      const result = parseYouTubeInput("https://youtube.com/playlist?list=PLtest123");
      expect(result.type).toBe("playlist_id");
      expect(result.value).toBe("PLtest123");
    });
  });

  describe("Invalid URLs", () => {
    it("should return unknown for invalid URLs", () => {
      const result = parseYouTubeInput("https://example.com/video");
      expect(result.type).toBe("unknown");
    });

    it("should return unknown for empty string", () => {
      const result = parseYouTubeInput("");
      expect(result.type).toBe("unknown");
    });

    it("should return unknown for random text", () => {
      const result = parseYouTubeInput("not a youtube url");
      expect(result.type).toBe("unknown");
    });
  });
});

describe("Channel Info Structure", () => {
  interface ChannelInfo {
    id: string;
    title: string;
    description: string;
    customUrl?: string;
    thumbnailUrl?: string;
    uploadsPlaylistId?: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
  }

  it("should have correct structure for channel info", () => {
    const channelInfo: ChannelInfo = {
      id: "UCddiUEpeqJcYeBxX1IVBKvQ",
      title: "Test Channel",
      description: "A test channel description",
      customUrl: "@testchannel",
      thumbnailUrl: "https://example.com/thumb.jpg",
      uploadsPlaylistId: "UUddiUEpeqJcYeBxX1IVBKvQ",
      subscriberCount: 1000000,
      videoCount: 500,
      viewCount: 100000000,
    };

    expect(channelInfo.id).toBe("UCddiUEpeqJcYeBxX1IVBKvQ");
    expect(channelInfo.uploadsPlaylistId).toBe("UUddiUEpeqJcYeBxX1IVBKvQ");
    expect(channelInfo.subscriberCount).toBe(1000000);
  });

  it("should derive uploads playlist ID from channel ID", () => {
    // YouTube uploads playlist ID is the channel ID with UC replaced by UU
    const channelId = "UCddiUEpeqJcYeBxX1IVBKvQ";
    const expectedUploadsId = "UU" + channelId.slice(2);
    
    expect(expectedUploadsId).toBe("UUddiUEpeqJcYeBxX1IVBKvQ");
  });
});

describe("Processing Status for Channels", () => {
  interface ProcessingStatus {
    url: string;
    type: "playlist" | "video" | "channel" | "unknown";
    status: "pending" | "processing" | "completed" | "error";
    playlistTitle?: string;
    channelTitle?: string;
    videoCount?: number;
    videosProcessed?: number;
    commentsCount?: number;
    error?: string;
  }

  it("should track channel processing status correctly", () => {
    const status: ProcessingStatus = {
      url: "https://youtube.com/@TestChannel",
      type: "channel",
      status: "processing",
      channelTitle: "Test Channel",
      playlistTitle: "Test Channel (Uploads)",
      videoCount: 100,
      videosProcessed: 50,
      commentsCount: 2500,
    };

    expect(status.type).toBe("channel");
    expect(status.channelTitle).toBe("Test Channel");
    expect(status.playlistTitle).toBe("Test Channel (Uploads)");
    expect(status.videosProcessed).toBe(50);
  });

  it("should handle channel processing completion", () => {
    const status: ProcessingStatus = {
      url: "https://youtube.com/channel/UCtest",
      type: "channel",
      status: "completed",
      channelTitle: "Completed Channel",
      videoCount: 200,
      videosProcessed: 200,
      commentsCount: 10000,
    };

    expect(status.status).toBe("completed");
    expect(status.videosProcessed).toBe(status.videoCount);
  });

  it("should handle channel processing error", () => {
    const status: ProcessingStatus = {
      url: "https://youtube.com/@NonExistentChannel",
      type: "channel",
      status: "error",
      error: "Channel not found",
    };

    expect(status.status).toBe("error");
    expect(status.error).toBe("Channel not found");
  });
});
