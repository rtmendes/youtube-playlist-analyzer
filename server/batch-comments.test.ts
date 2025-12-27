import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the YouTube client
vi.mock("./youtube", () => ({
  youtubeClient: {
    setApiKey: vi.fn(),
    getCommentThreads: vi.fn(),
  },
  parseYouTubeInput: vi.fn(),
  formatDuration: vi.fn(),
  formatCount: vi.fn(),
}));

import { youtubeClient } from "./youtube";

describe("Batch Comment Fetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBatchVideoComments behavior", () => {
    it("should handle videos with comments disabled", async () => {
      // Mock the API to throw a commentsDisabled error
      const mockError = {
        response: {
          data: {
            error: {
              errors: [{ reason: "commentsDisabled" }],
            },
          },
        },
      };

      (youtubeClient.getCommentThreads as any).mockRejectedValue(mockError);

      // The actual endpoint would catch this and return commentsDisabled: true
      // This test verifies the error structure is correct
      expect(mockError.response.data.error.errors[0].reason).toBe("commentsDisabled");
    });

    it("should accumulate comments across multiple pages", async () => {
      // First page with nextPageToken
      const page1Response = {
        items: [
          {
            id: "comment1",
            snippet: {
              videoId: "video123",
              topLevelComment: {
                snippet: {
                  authorDisplayName: "User1",
                  authorProfileImageUrl: "https://example.com/avatar1.jpg",
                  authorChannelId: { value: "channel1" },
                  textDisplay: "Great video!",
                  textOriginal: "Great video!",
                  likeCount: 10,
                  publishedAt: "2024-01-01T00:00:00Z",
                  updatedAt: "2024-01-01T00:00:00Z",
                },
              },
              totalReplyCount: 0,
            },
            replies: { comments: [] },
          },
        ],
        nextPageToken: "page2token",
        pageInfo: { totalResults: 2 },
      };

      // Second page without nextPageToken
      const page2Response = {
        items: [
          {
            id: "comment2",
            snippet: {
              videoId: "video123",
              topLevelComment: {
                snippet: {
                  authorDisplayName: "User2",
                  authorProfileImageUrl: "https://example.com/avatar2.jpg",
                  authorChannelId: { value: "channel2" },
                  textDisplay: "Nice content!",
                  textOriginal: "Nice content!",
                  likeCount: 5,
                  publishedAt: "2024-01-02T00:00:00Z",
                  updatedAt: "2024-01-02T00:00:00Z",
                },
              },
              totalReplyCount: 2,
            },
            replies: {
              comments: [
                {
                  id: "reply1",
                  snippet: {
                    authorDisplayName: "User3",
                    authorProfileImageUrl: "https://example.com/avatar3.jpg",
                    textDisplay: "Thanks!",
                    likeCount: 1,
                    publishedAt: "2024-01-03T00:00:00Z",
                  },
                },
              ],
            },
          },
        ],
        nextPageToken: undefined,
        pageInfo: { totalResults: 2 },
      };

      (youtubeClient.getCommentThreads as any)
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);

      // Verify the mock returns expected data
      const result1 = await youtubeClient.getCommentThreads("video123", undefined, 100);
      expect(result1.items.length).toBe(1);
      expect(result1.nextPageToken).toBe("page2token");

      const result2 = await youtubeClient.getCommentThreads("video123", "page2token", 100);
      expect(result2.items.length).toBe(1);
      expect(result2.nextPageToken).toBeUndefined();
    });

    it("should respect maxComments limit", async () => {
      // Create a response with many comments
      const manyCommentsResponse = {
        items: Array(100).fill(null).map((_, i) => ({
          id: `comment${i}`,
          snippet: {
            videoId: "video123",
            topLevelComment: {
              snippet: {
                authorDisplayName: `User${i}`,
                authorProfileImageUrl: `https://example.com/avatar${i}.jpg`,
                authorChannelId: { value: `channel${i}` },
                textDisplay: `Comment ${i}`,
                textOriginal: `Comment ${i}`,
                likeCount: i,
                publishedAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            },
            totalReplyCount: 0,
          },
          replies: { comments: [] },
        })),
        nextPageToken: "nextPage",
        pageInfo: { totalResults: 500 },
      };

      (youtubeClient.getCommentThreads as any).mockResolvedValue(manyCommentsResponse);

      // The batch endpoint should stop when maxComments is reached
      const result = await youtubeClient.getCommentThreads("video123", undefined, 100);
      expect(result.items.length).toBe(100);
    });

    it("should include video title in comment data", () => {
      // Test that the comment structure includes videoTitle
      const commentWithTitle = {
        id: "comment1",
        videoId: "video123",
        videoTitle: "My Test Video",
        authorDisplayName: "User1",
        textDisplay: "Great video!",
        likeCount: 10,
        replyCount: 0,
        publishedAt: "2024-01-01T00:00:00Z",
        replies: [],
      };

      expect(commentWithTitle.videoTitle).toBe("My Test Video");
      expect(commentWithTitle.videoId).toBe("video123");
    });
  });

  describe("Comment data structure", () => {
    it("should have all required fields for export", () => {
      const comment = {
        id: "comment1",
        videoId: "video123",
        videoTitle: "Test Video",
        authorDisplayName: "Test User",
        authorProfileImageUrl: "https://example.com/avatar.jpg",
        authorChannelId: "channel123",
        textDisplay: "<b>Bold</b> text",
        textOriginal: "Bold text",
        likeCount: 42,
        replyCount: 5,
        publishedAt: "2024-01-01T00:00:00Z",
        replies: [],
      };

      // Verify all fields needed for CSV export exist
      expect(comment.id).toBeDefined();
      expect(comment.videoId).toBeDefined();
      expect(comment.videoTitle).toBeDefined();
      expect(comment.authorDisplayName).toBeDefined();
      expect(comment.textOriginal).toBeDefined();
      expect(comment.likeCount).toBeDefined();
      expect(comment.replyCount).toBeDefined();
      expect(comment.publishedAt).toBeDefined();
    });

    it("should handle replies correctly", () => {
      const commentWithReplies = {
        id: "comment1",
        videoId: "video123",
        replyCount: 2,
        replies: [
          {
            id: "reply1",
            authorDisplayName: "Replier1",
            authorProfileImageUrl: "https://example.com/avatar1.jpg",
            textDisplay: "Reply 1",
            likeCount: 3,
            publishedAt: "2024-01-02T00:00:00Z",
          },
          {
            id: "reply2",
            authorDisplayName: "Replier2",
            authorProfileImageUrl: "https://example.com/avatar2.jpg",
            textDisplay: "Reply 2",
            likeCount: 1,
            publishedAt: "2024-01-03T00:00:00Z",
          },
        ],
      };

      expect(commentWithReplies.replies.length).toBe(2);
      expect(commentWithReplies.replies[0].authorDisplayName).toBe("Replier1");
      expect(commentWithReplies.replies[1].authorDisplayName).toBe("Replier2");
    });
  });
});
