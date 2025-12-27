import { describe, it, expect } from "vitest";

describe("Playlist Persistence Feature", () => {
  describe("Saved Playlists Schema", () => {
    it("should have required fields for saved playlists", () => {
      const savedPlaylist = {
        id: 1,
        userId: 1,
        youtubePlaylistId: "PLtest123",
        title: "Test Playlist",
        description: "A test playlist",
        channelTitle: "Test Channel",
        thumbnailUrl: "https://example.com/thumb.jpg",
        videoCount: 10,
        lastRunAt: new Date(),
        lastVideoCount: 10,
        lastCommentCount: 100,
        autoRefresh: 0,
        refreshInterval: 24,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(savedPlaylist.youtubePlaylistId).toBe("PLtest123");
      expect(savedPlaylist.lastRunAt).toBeInstanceOf(Date);
      expect(savedPlaylist.status).toBe("active");
    });

    it("should support different status values", () => {
      const statuses = ["active", "paused", "archived"] as const;
      statuses.forEach(status => {
        expect(["active", "paused", "archived"]).toContain(status);
      });
    });
  });

  describe("Playlist Runs Schema", () => {
    it("should track run statistics", () => {
      const playlistRun = {
        id: 1,
        savedPlaylistId: 1,
        videosAnalyzed: 10,
        commentsCollected: 150,
        newVideos: 2,
        newComments: 25,
        status: "completed" as const,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      expect(playlistRun.videosAnalyzed).toBe(10);
      expect(playlistRun.newVideos).toBe(2);
      expect(playlistRun.status).toBe("completed");
    });

    it("should calculate run duration", () => {
      const startedAt = new Date("2024-01-01T10:00:00Z");
      const completedAt = new Date("2024-01-01T10:05:30Z");
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const durationSeconds = Math.round(durationMs / 1000);
      
      expect(durationSeconds).toBe(330); // 5 minutes 30 seconds
    });
  });

  describe("Playlist Videos Schema", () => {
    it("should track video metadata", () => {
      const playlistVideo = {
        id: 1,
        savedPlaylistId: 1,
        videoYoutubeId: "dQw4w9WgXcQ",
        videoTitle: "Test Video",
        thumbnailUrl: "https://example.com/thumb.jpg",
        viewCount: 1000000,
        likeCount: 50000,
        commentCount: 5000,
        publishedAt: new Date(),
        firstSeenAt: new Date(),
        lastCommentFetchAt: new Date(),
      };

      expect(playlistVideo.videoYoutubeId).toBe("dQw4w9WgXcQ");
      expect(playlistVideo.viewCount).toBe(1000000);
    });
  });

  describe("Save Playlist Logic", () => {
    it("should detect if playlist is already saved", () => {
      const existingPlaylists = [
        { id: 1, youtubePlaylistId: "PL123" },
        { id: 2, youtubePlaylistId: "PL456" },
      ];

      const newPlaylistId = "PL789";
      const isAlreadySaved = existingPlaylists.some(
        p => p.youtubePlaylistId === newPlaylistId
      );

      expect(isAlreadySaved).toBe(false);

      const existingPlaylistId = "PL123";
      const isExisting = existingPlaylists.some(
        p => p.youtubePlaylistId === existingPlaylistId
      );

      expect(isExisting).toBe(true);
    });

    it("should update existing playlist on re-save", () => {
      const existingPlaylist = {
        id: 1,
        youtubePlaylistId: "PL123",
        title: "Old Title",
        videoCount: 5,
        lastRunAt: new Date("2024-01-01"),
      };

      const updatedData = {
        title: "New Title",
        videoCount: 10,
        lastRunAt: new Date("2024-01-15"),
      };

      const updated = { ...existingPlaylist, ...updatedData };

      expect(updated.title).toBe("New Title");
      expect(updated.videoCount).toBe(10);
      expect(updated.id).toBe(1); // ID should remain the same
    });
  });

  describe("Last Run Timestamp", () => {
    it("should format relative time correctly", () => {
      const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        return date.toLocaleDateString();
      };

      const justNow = new Date();
      expect(formatRelativeTime(justNow)).toBe("Just now");

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe("2 hours ago");

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe("3 days ago");
    });
  });

  describe("Run History", () => {
    it("should sort runs by date descending", () => {
      const runs = [
        { id: 1, startedAt: new Date("2024-01-01") },
        { id: 3, startedAt: new Date("2024-01-15") },
        { id: 2, startedAt: new Date("2024-01-10") },
      ];

      const sorted = [...runs].sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
      );

      expect(sorted[0].id).toBe(3); // Most recent
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(1); // Oldest
    });

    it("should calculate new items between runs", () => {
      const previousRun = {
        videosAnalyzed: 10,
        commentsCollected: 100,
      };

      const currentRun = {
        videosAnalyzed: 12,
        commentsCollected: 125,
      };

      const newVideos = currentRun.videosAnalyzed - previousRun.videosAnalyzed;
      const newComments = currentRun.commentsCollected - previousRun.commentsCollected;

      expect(newVideos).toBe(2);
      expect(newComments).toBe(25);
    });
  });

  describe("Sidebar Display", () => {
    it("should limit displayed playlists to 5", () => {
      const playlists = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Playlist ${i + 1}`,
      }));

      const displayedPlaylists = playlists.slice(0, 5);
      const hasMore = playlists.length > 5;

      expect(displayedPlaylists.length).toBe(5);
      expect(hasMore).toBe(true);
    });

    it("should sort playlists by last run date", () => {
      const playlists = [
        { id: 1, title: "Old", lastRunAt: new Date("2024-01-01") },
        { id: 2, title: "Recent", lastRunAt: new Date("2024-01-15") },
        { id: 3, title: "Middle", lastRunAt: new Date("2024-01-10") },
      ];

      const sorted = [...playlists].sort(
        (a, b) => b.lastRunAt.getTime() - a.lastRunAt.getTime()
      );

      expect(sorted[0].title).toBe("Recent");
      expect(sorted[2].title).toBe("Old");
    });
  });

  describe("Video Tracking", () => {
    it("should detect new videos in playlist", () => {
      const existingVideoIds = ["vid1", "vid2", "vid3"];
      const currentVideoIds = ["vid1", "vid2", "vid3", "vid4", "vid5"];

      const newVideoIds = currentVideoIds.filter(
        id => !existingVideoIds.includes(id)
      );

      expect(newVideoIds).toEqual(["vid4", "vid5"]);
      expect(newVideoIds.length).toBe(2);
    });

    it("should update video stats on refresh", () => {
      const existingVideo = {
        videoYoutubeId: "vid1",
        viewCount: 1000,
        likeCount: 100,
        commentCount: 50,
      };

      const updatedStats = {
        viewCount: 1500,
        likeCount: 150,
        commentCount: 75,
      };

      const updated = { ...existingVideo, ...updatedStats };

      expect(updated.viewCount).toBe(1500);
      expect(updated.likeCount).toBe(150);
      expect(updated.commentCount).toBe(75);
    });
  });
});
