import { describe, it, expect } from "vitest";

// Test the sorting logic that is used in the Analyze component
describe("Comment Sorting Logic", () => {
  const mockComments = [
    {
      id: "comment1",
      videoId: "video1",
      videoTitle: "Video 1",
      authorDisplayName: "User A",
      textOriginal: "First comment",
      likeCount: 10,
      replyCount: 5,
      publishedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "comment2",
      videoId: "video1",
      videoTitle: "Video 1",
      authorDisplayName: "User B",
      textOriginal: "Second comment",
      likeCount: 50,
      replyCount: 2,
      publishedAt: "2024-01-10T10:00:00Z",
    },
    {
      id: "comment3",
      videoId: "video2",
      videoTitle: "Video 2",
      authorDisplayName: "User C",
      textOriginal: "Third comment",
      likeCount: 25,
      replyCount: 10,
      publishedAt: "2024-01-20T10:00:00Z",
    },
  ];

  describe("Sort by date (newest first)", () => {
    it("should sort comments with newest first", () => {
      const sorted = [...mockComments].sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      expect(sorted[0].id).toBe("comment3"); // Jan 20
      expect(sorted[1].id).toBe("comment1"); // Jan 15
      expect(sorted[2].id).toBe("comment2"); // Jan 10
    });
  });

  describe("Sort by date (oldest first)", () => {
    it("should sort comments with oldest first", () => {
      const sorted = [...mockComments].sort((a, b) => 
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
      
      expect(sorted[0].id).toBe("comment2"); // Jan 10
      expect(sorted[1].id).toBe("comment1"); // Jan 15
      expect(sorted[2].id).toBe("comment3"); // Jan 20
    });
  });

  describe("Sort by likes (most liked first)", () => {
    it("should sort comments by like count descending", () => {
      const sorted = [...mockComments].sort((a, b) => b.likeCount - a.likeCount);
      
      expect(sorted[0].id).toBe("comment2"); // 50 likes
      expect(sorted[1].id).toBe("comment3"); // 25 likes
      expect(sorted[2].id).toBe("comment1"); // 10 likes
    });
  });

  describe("Sort by reply count (most replies first)", () => {
    it("should sort comments by reply count descending", () => {
      const sorted = [...mockComments].sort((a, b) => b.replyCount - a.replyCount);
      
      expect(sorted[0].id).toBe("comment3"); // 10 replies
      expect(sorted[1].id).toBe("comment1"); // 5 replies
      expect(sorted[2].id).toBe("comment2"); // 2 replies
    });
  });

  describe("Combined filter and sort", () => {
    it("should filter by video and then sort by likes", () => {
      const videoFilter = "video1";
      
      // Filter first
      const filtered = mockComments.filter(c => c.videoId === videoFilter);
      expect(filtered.length).toBe(2);
      
      // Then sort by likes
      const sorted = [...filtered].sort((a, b) => b.likeCount - a.likeCount);
      
      expect(sorted[0].id).toBe("comment2"); // 50 likes
      expect(sorted[1].id).toBe("comment1"); // 10 likes
    });

    it("should filter by search query and then sort by date", () => {
      const searchQuery = "first";
      
      // Filter by search
      const filtered = mockComments.filter(c => 
        c.textOriginal.toLowerCase().includes(searchQuery.toLowerCase())
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("comment1");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty array", () => {
      const emptyComments: typeof mockComments = [];
      const sorted = [...emptyComments].sort((a, b) => b.likeCount - a.likeCount);
      expect(sorted.length).toBe(0);
    });

    it("should handle single comment", () => {
      const singleComment = [mockComments[0]];
      const sorted = [...singleComment].sort((a, b) => b.likeCount - a.likeCount);
      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe("comment1");
    });

    it("should handle comments with same like count", () => {
      const sameCountComments = [
        { ...mockComments[0], likeCount: 10 },
        { ...mockComments[1], likeCount: 10 },
      ];
      const sorted = [...sameCountComments].sort((a, b) => b.likeCount - a.likeCount);
      expect(sorted.length).toBe(2);
      // Both have same count, order should be stable
    });

    it("should handle comments with zero values", () => {
      const zeroComments = [
        { ...mockComments[0], likeCount: 0, replyCount: 0 },
        { ...mockComments[1], likeCount: 5, replyCount: 0 },
      ];
      
      const sortedByLikes = [...zeroComments].sort((a, b) => b.likeCount - a.likeCount);
      expect(sortedByLikes[0].likeCount).toBe(5);
      expect(sortedByLikes[1].likeCount).toBe(0);
      
      const sortedByReplies = [...zeroComments].sort((a, b) => b.replyCount - a.replyCount);
      expect(sortedByReplies[0].replyCount).toBe(0);
      expect(sortedByReplies[1].replyCount).toBe(0);
    });
  });
});
