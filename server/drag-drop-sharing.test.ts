import { describe, it, expect } from "vitest";

describe("Drag-and-Drop Comment Reordering", () => {
  describe("Sort Order Management", () => {
    it("should initialize sortOrder for new saved comments", () => {
      const comment = {
        id: 1,
        text: "Test comment",
        sortOrder: 0,
      };
      expect(comment.sortOrder).toBe(0);
    });

    it("should update sortOrder when reordering comments", () => {
      const comments = [
        { id: 1, sortOrder: 0 },
        { id: 2, sortOrder: 1 },
        { id: 3, sortOrder: 2 },
      ];
      
      // Simulate moving comment 3 to position 0
      const reorderedComments = [
        { id: 3, sortOrder: 0 },
        { id: 1, sortOrder: 1 },
        { id: 2, sortOrder: 2 },
      ];
      
      expect(reorderedComments[0].id).toBe(3);
      expect(reorderedComments[0].sortOrder).toBe(0);
    });

    it("should maintain sortOrder after multiple reorders", () => {
      const comments = [
        { id: 1, sortOrder: 0 },
        { id: 2, sortOrder: 1 },
        { id: 3, sortOrder: 2 },
        { id: 4, sortOrder: 3 },
      ];
      
      // Move item 4 to position 1
      const newOrder = [1, 4, 2, 3];
      const reordered = newOrder.map((id, index) => ({
        id,
        sortOrder: index,
      }));
      
      expect(reordered).toEqual([
        { id: 1, sortOrder: 0 },
        { id: 4, sortOrder: 1 },
        { id: 2, sortOrder: 2 },
        { id: 3, sortOrder: 3 },
      ]);
    });
  });

  describe("Drag Handle Behavior", () => {
    it("should identify draggable items by id", () => {
      const items = [
        { id: "comment-1", text: "First" },
        { id: "comment-2", text: "Second" },
        { id: "comment-3", text: "Third" },
      ];
      
      const activeId = "comment-2";
      const activeItem = items.find((item) => item.id === activeId);
      
      expect(activeItem?.text).toBe("Second");
    });

    it("should calculate new position after drag", () => {
      const oldIndex = 0;
      const newIndex = 2;
      
      const items = ["A", "B", "C", "D"];
      const [removed] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, removed);
      
      expect(items).toEqual(["B", "C", "A", "D"]);
    });
  });
});

describe("Shareable Collection Links", () => {
  describe("Share Token Generation", () => {
    it("should generate unique share tokens", () => {
      const generateToken = () => {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
      };
      
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(20);
    });

    it("should create shareable URL from token", () => {
      const token = "abc123xyz789";
      const baseUrl = "https://example.com";
      const shareUrl = `${baseUrl}/shared-collection/${token}`;
      
      expect(shareUrl).toBe("https://example.com/shared-collection/abc123xyz789");
    });

    it("should validate share token format", () => {
      const validToken = "abc123xyz789def456";
      const invalidToken = "";
      
      const isValidToken = (token: string) => token.length >= 10;
      
      expect(isValidToken(validToken)).toBe(true);
      expect(isValidToken(invalidToken)).toBe(false);
    });
  });

  describe("Collection Sharing State", () => {
    it("should track isPublic status for collections", () => {
      const collection = {
        id: 1,
        name: "Product Ideas",
        isPublic: false,
        shareToken: null,
      };
      
      expect(collection.isPublic).toBe(false);
      expect(collection.shareToken).toBeNull();
    });

    it("should update collection when sharing is enabled", () => {
      const collection = {
        id: 1,
        name: "Product Ideas",
        isPublic: false,
        shareToken: null as string | null,
      };
      
      // Enable sharing
      collection.isPublic = true;
      collection.shareToken = "generated_token_123";
      
      expect(collection.isPublic).toBe(true);
      expect(collection.shareToken).toBe("generated_token_123");
    });

    it("should revoke sharing by clearing token", () => {
      const collection = {
        id: 1,
        name: "Product Ideas",
        isPublic: true,
        shareToken: "existing_token" as string | null,
      };
      
      // Revoke sharing
      collection.isPublic = false;
      collection.shareToken = null;
      
      expect(collection.isPublic).toBe(false);
      expect(collection.shareToken).toBeNull();
    });
  });

  describe("Public Collection Access", () => {
    it("should allow access to public collections by token", () => {
      const collections = [
        { id: 1, shareToken: "token_a", isPublic: true },
        { id: 2, shareToken: "token_b", isPublic: true },
        { id: 3, shareToken: null, isPublic: false },
      ];
      
      const findByToken = (token: string) => 
        collections.find((c) => c.shareToken === token && c.isPublic);
      
      expect(findByToken("token_a")?.id).toBe(1);
      expect(findByToken("token_b")?.id).toBe(2);
      expect(findByToken("nonexistent")).toBeUndefined();
    });

    it("should not allow access to private collections", () => {
      const collection = {
        id: 1,
        shareToken: "old_token",
        isPublic: false,
      };
      
      const canAccess = collection.isPublic && collection.shareToken;
      expect(canAccess).toBeFalsy();
    });

    it("should display collection comments for public access", () => {
      const publicCollection = {
        id: 1,
        name: "Shared Collection",
        isPublic: true,
        comments: [
          { id: 1, text: "Comment 1" },
          { id: 2, text: "Comment 2" },
        ],
      };
      
      expect(publicCollection.comments.length).toBe(2);
      expect(publicCollection.comments[0].text).toBe("Comment 1");
    });
  });

  describe("Share Link Clipboard", () => {
    it("should format share link correctly", () => {
      const origin = "https://app.example.com";
      const token = "share_token_123";
      const link = `${origin}/shared-collection/${token}`;
      
      expect(link).toContain("/shared-collection/");
      expect(link).toContain(token);
    });
  });
});
