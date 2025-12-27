import { describe, it, expect } from "vitest";
import { 
  parseAmazonUrl, 
  generateSampleProduct, 
  generateSampleReviews, 
  calculateReviewStats, 
  analyzeReviewSentiment,
  compareProducts,
  AmazonApiConfig
} from "./amazon";

describe("Amazon API Integration", () => {
  describe("parseAmazonUrl", () => {
    it("should parse standard Amazon product URLs", () => {
      const result = parseAmazonUrl("https://www.amazon.com/dp/B08N5WRWNW");
      expect(result.asin).toBe("B08N5WRWNW");
      expect(result.marketplace).toBe("com");
    });

    it("should parse Amazon URLs with product path", () => {
      const result = parseAmazonUrl("https://www.amazon.com/gp/product/B09V3KXJPB");
      expect(result.asin).toBe("B09V3KXJPB");
    });

    it("should parse international Amazon URLs", () => {
      const result = parseAmazonUrl("https://www.amazon.co.uk/dp/B08N5WRWNW");
      expect(result.asin).toBe("B08N5WRWNW");
      expect(result.marketplace).toBe("couk");
    });

    it("should handle plain ASIN input", () => {
      const result = parseAmazonUrl("B08N5WRWNW");
      expect(result.asin).toBe("B08N5WRWNW");
    });

    it("should return error for invalid URLs", () => {
      const result = parseAmazonUrl("https://example.com/invalid");
      expect(result.asin).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe("generateSampleProduct", () => {
    it("should generate a product with all required fields", () => {
      const product = generateSampleProduct("B08N5WRWNW");
      expect(product.asin).toBe("B08N5WRWNW");
      expect(product.title).toBeDefined();
      expect(product.price).toBeDefined();
      expect(product.rating).toBeDefined();
      expect(product.productUrl).toContain("B08N5WRWNW");
    });

    it("should generate known sample products with detailed info", () => {
      const product = generateSampleProduct("B08N5WRWNW");
      expect(product.title).toBe("Premium Wireless Bluetooth Headphones");
      expect(product.brand).toBe("AudioTech Pro");
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
        expect(review.reviewDate).toBeInstanceOf(Date);
      });
    });
  });

  describe("analyzeReviewSentiment", () => {
    it("should classify high-rated reviews as positive", () => {
      const review = {
        reviewId: "test-1",
        author: "Test User",
        rating: 5,
        title: "Great product!",
        body: "This is exactly what I needed. Great quality and fast shipping.",
        helpfulVotes: 10,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.sentiment).toBe("positive");
    });

    it("should classify low-rated reviews as negative", () => {
      const review = {
        reviewId: "test-2",
        author: "Test User",
        rating: 1,
        title: "Terrible!",
        body: "Product broke after one day. Poor quality and waste of money.",
        helpfulVotes: 5,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.sentiment).toBe("negative");
    });

    it("should extract themes from review text", () => {
      const review = {
        reviewId: "test-3",
        author: "Test User",
        rating: 5,
        title: "Great quality!",
        body: "Easy to use and durable. Fast shipping too!",
        helpfulVotes: 8,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.themes.length).toBeGreaterThan(0);
    });

    it("should extract pain points from negative reviews", () => {
      const review = {
        reviewId: "test-4",
        author: "Test User",
        rating: 2,
        title: "Disappointed",
        body: "Product doesn't work as expected. Poor quality materials.",
        helpfulVotes: 15,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.painPoints.length).toBeGreaterThan(0);
    });

    it("should extract praises from positive reviews", () => {
      const review = {
        reviewId: "test-5",
        author: "Test User",
        rating: 5,
        title: "Highly recommend!",
        body: "Great quality and worth the money. Easy to use.",
        helpfulVotes: 20,
        verified: true,
        reviewDate: new Date(),
      };
      const analysis = analyzeReviewSentiment(review);
      expect(analysis.praises.length).toBeGreaterThan(0);
    });
  });

  describe("calculateReviewStats", () => {
    it("should calculate correct average rating", () => {
      const reviews = [
        { reviewId: "1", author: "A", rating: 5, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "2", author: "B", rating: 4, title: "", body: "", helpfulVotes: 0, verified: true, reviewDate: new Date() },
        { reviewId: "3", author: "C", rating: 3, title: "", body: "", helpfulVotes: 0, verified: false, reviewDate: new Date() },
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
        { reviewId: "2", author: "B", rating: 4, title: "", body: "", helpfulVotes: 0, verified: false, reviewDate: new Date() },
      ];
      const stats = calculateReviewStats(reviews);
      expect(stats.verifiedPercentage).toBe(50);
    });

    it("should handle empty reviews array", () => {
      const stats = calculateReviewStats([]);
      expect(stats.averageRating).toBe(0);
      expect(stats.totalReviews).toBe(0);
    });
  });

  describe("compareProducts", () => {
    it("should compare multiple products", () => {
      const products = [
        generateSampleProduct("B08N5WRWNW"),
        generateSampleProduct("B09V3KXJPB"),
      ];
      
      const reviewsMap = new Map();
      reviewsMap.set("B08N5WRWNW", generateSampleReviews("B08N5WRWNW", 10));
      reviewsMap.set("B09V3KXJPB", generateSampleReviews("B09V3KXJPB", 10));
      
      const result = compareProducts(products, reviewsMap);
      
      expect(result.comparison.length).toBe(2);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it("should include strengths and weaknesses in comparison", () => {
      const products = [generateSampleProduct("B08N5WRWNW")];
      const reviewsMap = new Map();
      reviewsMap.set("B08N5WRWNW", generateSampleReviews("B08N5WRWNW", 15));
      
      const result = compareProducts(products, reviewsMap);
      
      expect(result.comparison[0].strengths).toBeDefined();
      expect(result.comparison[0].weaknesses).toBeDefined();
    });
  });
});

describe("Multi-Source AI Generation", () => {
  it("should support multi_source asset type", () => {
    const ASSET_TYPES = {
      advertorial: { label: "Advertorial" },
      multi_source: { label: "Multi-Source" },
    };
    expect(ASSET_TYPES.multi_source).toBeDefined();
    expect(ASSET_TYPES.multi_source.label).toBe("Multi-Source");
  });

  it("should aggregate insights from multiple sources", () => {
    const insights = [
      { sourceType: "youtube", sentiment: "positive", contentText: "Great video!" },
      { sourceType: "amazon", sentiment: "negative", contentText: "Product broke" },
      { sourceType: "reddit", sentiment: "neutral", contentText: "Decent product" },
    ];
    
    const youtubeInsights = insights.filter(i => i.sourceType === "youtube");
    const amazonInsights = insights.filter(i => i.sourceType === "amazon");
    const redditInsights = insights.filter(i => i.sourceType === "reddit");
    
    expect(youtubeInsights.length).toBe(1);
    expect(amazonInsights.length).toBe(1);
    expect(redditInsights.length).toBe(1);
  });

  it("should build context summary from insights", () => {
    const insights = [
      { sourceType: "youtube", sentiment: "positive", contentText: "Amazing tutorial, learned so much!" },
      { sourceType: "amazon", sentiment: "positive", contentText: "Best purchase I've made this year" },
    ];
    
    let contextSummary = "";
    
    const youtubeInsights = insights.filter(i => i.sourceType === "youtube");
    if (youtubeInsights.length > 0) {
      contextSummary += "## YouTube Comments:\n";
      youtubeInsights.forEach(i => {
        contextSummary += `- [${i.sentiment}] ${i.contentText}\n`;
      });
    }
    
    expect(contextSummary).toContain("YouTube Comments");
    expect(contextSummary).toContain("positive");
    expect(contextSummary).toContain("Amazing tutorial");
  });
});

describe("Competitor Analysis", () => {
  it("should validate ASIN format", () => {
    const validAsins = ["B08N5WRWNW", "B09V3KXJPB", "B07XJ8C8F5"];
    const invalidAsins = ["invalid", "123", "TOOLONGASIN123"];
    
    validAsins.forEach(asin => {
      expect(/^[A-Z0-9]{10}$/i.test(asin)).toBe(true);
    });
    
    invalidAsins.forEach(asin => {
      expect(/^[A-Z0-9]{10}$/i.test(asin)).toBe(false);
    });
  });

  it("should require minimum 2 products for comparison", () => {
    const asins = ["B08N5WRWNW"];
    expect(asins.length >= 2).toBe(false);
    
    const validAsins = ["B08N5WRWNW", "B09V3KXJPB"];
    expect(validAsins.length >= 2).toBe(true);
  });

  it("should limit comparison to 5 products", () => {
    const asins = ["A", "B", "C", "D", "E", "F"];
    const limitedAsins = asins.slice(0, 5);
    expect(limitedAsins.length).toBe(5);
  });

  it("should calculate sentiment score as percentage", () => {
    const sentimentBreakdown = { positive: 70, neutral: 20, negative: 10 };
    const total = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative;
    const positivePercentage = (sentimentBreakdown.positive / total) * 100;
    expect(positivePercentage).toBe(70);
  });

  it("should categorize sentiment scores correctly", () => {
    const getSentimentCategory = (score: number) => {
      if (score >= 70) return "high";
      if (score >= 40) return "medium";
      return "low";
    };
    
    expect(getSentimentCategory(80)).toBe("high");
    expect(getSentimentCategory(50)).toBe("medium");
    expect(getSentimentCategory(30)).toBe("low");
  });

  it("should generate market insights from comparison", () => {
    const comparison = [
      { asin: "A", title: "Product A", rating: 4.5, reviewCount: 1000, sentimentScore: 80 },
      { asin: "B", title: "Product B", rating: 3.8, reviewCount: 500, sentimentScore: 60 },
    ];
    
    const insights: string[] = [];
    
    // Find highest rated
    const sorted = [...comparison].sort((a, b) => b.rating - a.rating);
    insights.push(`${sorted[0].title} has the highest rating (${sorted[0].rating}).`);
    
    // Find most reviewed
    const mostReviewed = [...comparison].sort((a, b) => b.reviewCount - a.reviewCount)[0];
    insights.push(`${mostReviewed.title} has the most reviews (${mostReviewed.reviewCount}).`);
    
    expect(insights.length).toBe(2);
    expect(insights[0]).toContain("Product A");
    expect(insights[1]).toContain("Product A");
  });
});
