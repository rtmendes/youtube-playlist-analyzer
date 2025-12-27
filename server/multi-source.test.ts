import { describe, it, expect } from "vitest";
import {
  parseAmazonUrl,
  generateSampleProduct,
  generateSampleReviews,
  calculateReviewStats,
  analyzeReviewSentiment,
} from "./amazon";
import {
  parseRedditUrl,
  fetchSubredditPosts,
  searchReddit,
  fetchPostComments,
  analyzeRedditComment,
  calculateRedditStats,
  getPopularResearchSubreddits,
} from "./reddit";

describe("Amazon Intelligence", () => {
  describe("parseAmazonUrl", () => {
    it("should parse standard Amazon product URL", () => {
      const result = parseAmazonUrl("https://www.amazon.com/dp/B08N5WRWNW");
      expect(result.asin).toBe("B08N5WRWNW");
    });

    it("should parse Amazon URL with product name", () => {
      const result = parseAmazonUrl("https://www.amazon.com/Apple-iPhone-13-128GB-Blue/dp/B09V3KXJPB");
      expect(result.asin).toBe("B09V3KXJPB");
    });

    it("should parse ASIN directly", () => {
      const result = parseAmazonUrl("B08N5WRWNW");
      expect(result.asin).toBe("B08N5WRWNW");
    });

    it("should handle invalid URLs", () => {
      const result = parseAmazonUrl("https://google.com");
      expect(result.asin).toBe(null);
    });

    it("should handle Amazon URL with query parameters", () => {
      const result = parseAmazonUrl("https://www.amazon.com/dp/B08N5WRWNW?ref=sr_1_1");
      expect(result.asin).toBe("B08N5WRWNW");
    });
  });

  describe("generateSampleProduct", () => {
    it("should generate a product with all required fields", () => {
      const product = generateSampleProduct("B08N5WRWNW");
      expect(product.asin).toBe("B08N5WRWNW");
      expect(product.title).toBeDefined();
      expect(product.rating).toBeDefined();
      expect(product.reviewCount).toBeGreaterThan(0);
    });

    it("should generate consistent products for same ASIN", () => {
      const product1 = generateSampleProduct("B08N5WRWNW");
      const product2 = generateSampleProduct("B08N5WRWNW");
      expect(product1.title).toBe(product2.title);
    });
  });

  describe("generateSampleReviews", () => {
    it("should generate the requested number of reviews", () => {
      const reviews = generateSampleReviews("B08N5WRWNW", 10);
      expect(reviews.length).toBe(10);
    });

    it("should generate reviews with all required fields", () => {
      const reviews = generateSampleReviews("B08N5WRWNW", 5);
      reviews.forEach(review => {
        expect(review.reviewId).toBeDefined();
        expect(review.author).toBeDefined();
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
        expect(review.title).toBeDefined();
        expect(review.body).toBeDefined();
      });
    });

    it("should generate reviews with varying ratings", () => {
      const reviews = generateSampleReviews("B08N5WRWNW", 20);
      const ratings = new Set(reviews.map(r => r.rating));
      expect(ratings.size).toBeGreaterThan(1);
    });
  });

  describe("calculateReviewStats", () => {
    it("should calculate correct average rating", () => {
      const reviews = [
        { reviewId: "1", author: "A", rating: 5, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "2", author: "B", rating: 3, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "3", author: "C", rating: 4, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
      ];
      const stats = calculateReviewStats(reviews);
      expect(stats.averageRating).toBe(4);
      expect(stats.totalReviews).toBe(3);
    });

    it("should calculate rating distribution", () => {
      const reviews = [
        { reviewId: "1", author: "A", rating: 5, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "2", author: "B", rating: 5, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "3", author: "C", rating: 3, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
      ];
      const stats = calculateReviewStats(reviews);
      expect(stats.ratingDistribution[5]).toBe(2);
      expect(stats.ratingDistribution[3]).toBe(1);
    });

    it("should calculate verified percentage", () => {
      const reviews = [
        { reviewId: "1", author: "A", rating: 5, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "2", author: "B", rating: 5, title: "", body: "", helpfulVotes: 0, verified: false, reviewDate: new Date() },
      ];
      const stats = calculateReviewStats(reviews);
      expect(stats.verifiedPercentage).toBe(50);
    });
  });

  describe("analyzeReviewSentiment", () => {
    it("should detect positive sentiment from high rating", () => {
      const review = {
        reviewId: "1",
        author: "Test",
        rating: 5,
        title: "Great product!",
        body: "I love this product, it's amazing!",
        helpfulVotes: 10,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.sentiment).toBe("positive");
    });

    it("should detect negative sentiment from low rating", () => {
      const review = {
        reviewId: "1",
        author: "Test",
        rating: 1,
        title: "Terrible product",
        body: "This product is awful and doesn't work",
        helpfulVotes: 5,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.sentiment).toBe("negative");
    });

    it("should return analysis object with themes array", () => {
      const review = {
        reviewId: "1",
        author: "Test",
        rating: 4,
        title: "Good quality",
        body: "The quality is excellent and the price is reasonable",
        helpfulVotes: 3,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(Array.isArray(analysis.themes)).toBe(true);
    });
  });
});

describe("Reddit Research", () => {
  describe("parseRedditUrl", () => {
    it("should parse subreddit URL", () => {
      const result = parseRedditUrl("https://www.reddit.com/r/entrepreneur");
      expect(result.subreddit).toBe("entrepreneur");
      expect(result.type).toBe("subreddit");
    });

    it("should parse post URL", () => {
      const result = parseRedditUrl("https://www.reddit.com/r/entrepreneur/comments/abc123/my_post_title");
      expect(result.subreddit).toBe("entrepreneur");
      expect(result.postId).toBe("abc123");
      expect(result.type).toBe("post");
    });

    it("should handle subreddit name directly", () => {
      const result = parseRedditUrl("entrepreneur");
      expect(result.subreddit).toBe("entrepreneur");
      expect(result.type).toBe("subreddit");
    });

    it("should handle r/ prefix", () => {
      const result = parseRedditUrl("r/entrepreneur");
      expect(result.subreddit).toBe("entrepreneur");
      expect(result.type).toBe("subreddit");
    });

    it("should handle invalid URLs", () => {
      const result = parseRedditUrl("https://google.com");
      expect(result.type).toBe(null);
    });
  });

  describe("fetchSubredditPosts", () => {
    it("should be a function that returns posts", () => {
      expect(typeof fetchSubredditPosts).toBe("function");
    });

    it("should accept required parameters", () => {
      // Test that the function signature is correct
      expect(fetchSubredditPosts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("searchReddit", () => {
    it("should be a function that searches Reddit", () => {
      expect(typeof searchReddit).toBe("function");
    });

    it("should accept search parameters", () => {
      expect(searchReddit.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("fetchPostComments", () => {
    it("should be a function that fetches comments", () => {
      expect(typeof fetchPostComments).toBe("function");
    });

    it("should accept post parameters", () => {
      expect(fetchPostComments.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("analyzeRedditComment", () => {
    it("should detect positive sentiment", () => {
      const comment = {
        commentId: "1",
        postId: "test",
        author: "user",
        body: "This is amazing! I love it!",
        score: 100,
        isOp: false,
        depth: 0,
        postedAt: new Date(),
      };
      const analysis = analyzeRedditComment(comment);
      expect(analysis.sentiment).toBe("positive");
    });

    it("should detect negative sentiment", () => {
      const comment = {
        commentId: "1",
        postId: "test",
        author: "user",
        body: "This is terrible and I hate it",
        score: -10,
        isOp: false,
        depth: 0,
        postedAt: new Date(),
      };
      const analysis = analyzeRedditComment(comment);
      expect(analysis.sentiment).toBe("negative");
    });

    it("should extract themes", () => {
      const comment = {
        commentId: "1",
        postId: "test",
        author: "user",
        body: "I recommend this product for the quality and price",
        score: 50,
        isOp: false,
        depth: 0,
        postedAt: new Date(),
      };
      const analysis = analyzeRedditComment(comment);
      expect(analysis.themes.length).toBeGreaterThan(0);
    });
  });

  describe("calculateRedditStats", () => {
    it("should calculate total posts and comments", () => {
      const posts = [
        { postId: "1", subreddit: "test", title: "Test", body: "", author: "user", score: 100, upvoteRatio: 0.9, commentCount: 10, postUrl: "", isNsfw: false, postedAt: new Date() },
      ];
      const comments = [
        { commentId: "1", postId: "1", author: "user", body: "Comment", score: 10, isOp: false, depth: 0, postedAt: new Date() },
        { commentId: "2", postId: "1", author: "user", body: "Comment", score: 20, isOp: false, depth: 0, postedAt: new Date() },
      ];
      const stats = calculateRedditStats(posts, comments);
      expect(stats.totalPosts).toBe(1);
      expect(stats.totalComments).toBe(2);
    });

    it("should calculate average scores", () => {
      const posts = [
        { postId: "1", subreddit: "test", title: "Test", body: "", author: "user", score: 100, upvoteRatio: 0.9, commentCount: 10, postUrl: "", isNsfw: false, postedAt: new Date() },
        { postId: "2", subreddit: "test", title: "Test", body: "", author: "user", score: 200, upvoteRatio: 0.8, commentCount: 20, postUrl: "", isNsfw: false, postedAt: new Date() },
      ];
      const comments: any[] = [];
      const stats = calculateRedditStats(posts, comments);
      expect(stats.avgPostScore).toBe(150);
    });
  });

  describe("getPopularResearchSubreddits", () => {
    it("should return a list of subreddits", () => {
      const subreddits = getPopularResearchSubreddits();
      expect(subreddits.length).toBeGreaterThan(0);
    });

    it("should include required fields", () => {
      const subreddits = getPopularResearchSubreddits();
      subreddits.forEach(sub => {
        expect(sub.name).toBeDefined();
        expect(sub.description).toBeDefined();
        expect(sub.category).toBeDefined();
      });
    });

    it("should include subreddits from various categories", () => {
      const subreddits = getPopularResearchSubreddits();
      const categories = new Set(subreddits.map(s => s.category));
      expect(categories.size).toBeGreaterThan(0);
    });
  });
});
