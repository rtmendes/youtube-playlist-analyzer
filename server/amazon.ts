/**
 * Amazon Product Research Service
 * 
 * Note: Amazon doesn't provide a public API for product data.
 * This service provides a structure for manual product entry and
 * simulated data for demonstration purposes.
 * 
 * In production, you would integrate with:
 * - Amazon Product Advertising API (requires affiliate account)
 * - Third-party services like Rainforest API, Keepa, etc.
 * - Web scraping solutions (with proper compliance)
 */

export interface AmazonProduct {
  asin: string;
  title: string;
  description?: string;
  brand?: string;
  price?: string;
  rating?: string;
  reviewCount?: number;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
  features?: string[];
}

export interface AmazonReview {
  reviewId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  helpfulVotes: number;
  verified: boolean;
  reviewDate: Date;
}

export interface AmazonSearchResult {
  products: AmazonProduct[];
  totalResults: number;
}

/**
 * Parse Amazon URL to extract ASIN
 */
export function parseAmazonUrl(url: string): { asin: string | null; error?: string } {
  try {
    // Handle various Amazon URL formats
    // https://www.amazon.com/dp/B08N5WRWNW
    // https://www.amazon.com/gp/product/B08N5WRWNW
    // https://www.amazon.com/Product-Name/dp/B08N5WRWNW/ref=...
    // https://amzn.to/shortlink (would need redirect following)
    
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /asin=([A-Z0-9]{10})/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { asin: match[1].toUpperCase() };
      }
    }

    // Check if input is just an ASIN
    if (/^[A-Z0-9]{10}$/i.test(url.trim())) {
      return { asin: url.trim().toUpperCase() };
    }

    return { asin: null, error: "Could not extract ASIN from URL" };
  } catch (error) {
    return { asin: null, error: "Invalid URL format" };
  }
}

/**
 * Generate Amazon product URL from ASIN
 */
export function getAmazonProductUrl(asin: string, marketplace: string = "com"): string {
  return `https://www.amazon.${marketplace}/dp/${asin}`;
}

/**
 * Analyze review sentiment and extract themes
 */
export function analyzeReviewSentiment(review: AmazonReview): {
  sentiment: "positive" | "neutral" | "negative";
  themes: string[];
  painPoints: string[];
  praises: string[];
} {
  const text = `${review.title} ${review.body}`.toLowerCase();
  
  // Simple sentiment based on rating
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  if (review.rating >= 4) sentiment = "positive";
  else if (review.rating <= 2) sentiment = "negative";

  // Extract common themes (simplified - would use NLP in production)
  const themes: string[] = [];
  const painPoints: string[] = [];
  const praises: string[] = [];

  // Common positive indicators
  const positivePatterns = [
    { pattern: /great quality/i, theme: "Quality", praise: "Great quality" },
    { pattern: /easy to use/i, theme: "Usability", praise: "Easy to use" },
    { pattern: /fast shipping/i, theme: "Shipping", praise: "Fast shipping" },
    { pattern: /worth the money|good value|great price/i, theme: "Value", praise: "Good value" },
    { pattern: /highly recommend/i, theme: "Recommendation", praise: "Highly recommended" },
    { pattern: /exceeded expectations/i, theme: "Expectations", praise: "Exceeded expectations" },
    { pattern: /perfect|exactly what i needed/i, theme: "Satisfaction", praise: "Perfect fit" },
    { pattern: /durable|sturdy|well.?made/i, theme: "Durability", praise: "Well made" },
  ];

  // Common negative indicators
  const negativePatterns = [
    { pattern: /broke|broken|defective/i, theme: "Quality", painPoint: "Product broke/defective" },
    { pattern: /doesn't work|didn't work|not working/i, theme: "Functionality", painPoint: "Doesn't work as expected" },
    { pattern: /waste of money|overpriced/i, theme: "Value", painPoint: "Poor value" },
    { pattern: /poor quality|cheap|flimsy/i, theme: "Quality", painPoint: "Poor quality" },
    { pattern: /difficult to|hard to|confusing/i, theme: "Usability", painPoint: "Difficult to use" },
    { pattern: /late|delayed|slow shipping/i, theme: "Shipping", painPoint: "Shipping issues" },
    { pattern: /return|refund/i, theme: "Returns", painPoint: "Had to return" },
    { pattern: /misleading|false advertising|not as described/i, theme: "Accuracy", painPoint: "Not as described" },
  ];

  positivePatterns.forEach(({ pattern, theme, praise }) => {
    if (pattern.test(text)) {
      if (!themes.includes(theme)) themes.push(theme);
      if (sentiment === "positive" && !praises.includes(praise)) praises.push(praise);
    }
  });

  negativePatterns.forEach(({ pattern, theme, painPoint }) => {
    if (pattern.test(text)) {
      if (!themes.includes(theme)) themes.push(theme);
      if (sentiment === "negative" && !painPoints.includes(painPoint)) painPoints.push(painPoint);
    }
  });

  return { sentiment, themes, painPoints, praises };
}

/**
 * Calculate review statistics
 */
export function calculateReviewStats(reviews: AmazonReview[]): {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  verifiedPercentage: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topThemes: string[];
  topPainPoints: string[];
  topPraises: string[];
} {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPercentage: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      topThemes: [],
      topPainPoints: [],
      topPraises: [],
    };
  }

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let verifiedCount = 0;
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  const themeCounts: Record<string, number> = {};
  const painPointCounts: Record<string, number> = {};
  const praiseCounts: Record<string, number> = {};

  reviews.forEach(review => {
    totalRating += review.rating;
    ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    if (review.verified) verifiedCount++;

    const analysis = analyzeReviewSentiment(review);
    sentimentBreakdown[analysis.sentiment]++;
    
    analysis.themes.forEach(theme => {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });
    analysis.painPoints.forEach(pp => {
      painPointCounts[pp] = (painPointCounts[pp] || 0) + 1;
    });
    analysis.praises.forEach(praise => {
      praiseCounts[praise] = (praiseCounts[praise] || 0) + 1;
    });
  });

  const sortByCount = (obj: Record<string, number>) => 
    Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([key]) => key);

  return {
    averageRating: totalRating / reviews.length,
    totalReviews: reviews.length,
    ratingDistribution,
    verifiedPercentage: (verifiedCount / reviews.length) * 100,
    sentimentBreakdown,
    topThemes: sortByCount(themeCounts).slice(0, 5),
    topPainPoints: sortByCount(painPointCounts).slice(0, 5),
    topPraises: sortByCount(praiseCounts).slice(0, 5),
  };
}

/**
 * Generate sample reviews for demonstration
 * In production, this would fetch from Amazon API or scraping service
 */
export function generateSampleReviews(asin: string, count: number = 20): AmazonReview[] {
  const sampleReviews: Partial<AmazonReview>[] = [
    { rating: 5, title: "Exceeded my expectations!", body: "This product is exactly what I needed. Great quality and fast shipping. Highly recommend to anyone looking for a reliable solution.", helpfulVotes: 45, verified: true },
    { rating: 5, title: "Perfect for my needs", body: "Easy to use and well made. Worth every penny. The durability is impressive.", helpfulVotes: 32, verified: true },
    { rating: 4, title: "Good product, minor issues", body: "Overall satisfied with the purchase. Quality is good but the instructions could be clearer.", helpfulVotes: 18, verified: true },
    { rating: 4, title: "Solid choice", body: "Does what it's supposed to do. Good value for the price. Would buy again.", helpfulVotes: 12, verified: false },
    { rating: 3, title: "It's okay", body: "Average product. Nothing special but gets the job done. Expected a bit more for the price.", helpfulVotes: 8, verified: true },
    { rating: 3, title: "Mixed feelings", body: "Some features work great, others not so much. Difficult to set up initially.", helpfulVotes: 15, verified: true },
    { rating: 2, title: "Disappointed", body: "Poor quality compared to what was advertised. Had issues from day one. Considering a return.", helpfulVotes: 28, verified: true },
    { rating: 2, title: "Not as described", body: "The product doesn't match the description. Misleading photos. Waste of money.", helpfulVotes: 42, verified: false },
    { rating: 1, title: "Complete waste", body: "Broke after one week. Cheap materials, flimsy construction. Don't buy this.", helpfulVotes: 67, verified: true },
    { rating: 1, title: "Terrible experience", body: "Product arrived damaged and customer service was unhelpful. Had to request a refund.", helpfulVotes: 53, verified: true },
    { rating: 5, title: "Best purchase ever!", body: "I've tried many similar products and this is by far the best. Sturdy, reliable, and great price.", helpfulVotes: 89, verified: true },
    { rating: 4, title: "Pleasantly surprised", body: "Wasn't expecting much but this exceeded expectations. Fast shipping too!", helpfulVotes: 24, verified: true },
    { rating: 5, title: "Game changer", body: "This has made my life so much easier. Easy to use and durable. Highly recommend!", helpfulVotes: 56, verified: true },
    { rating: 3, title: "Does the job", body: "It works but nothing extraordinary. Average quality for average price.", helpfulVotes: 11, verified: false },
    { rating: 4, title: "Good value", body: "For the price, this is a great deal. Some minor quality issues but overall satisfied.", helpfulVotes: 19, verified: true },
  ];

  const reviews: AmazonReview[] = [];
  const authors = ["John D.", "Sarah M.", "Mike R.", "Emily K.", "David L.", "Jennifer P.", "Chris W.", "Amanda S.", "Robert T.", "Lisa H."];
  
  for (let i = 0; i < Math.min(count, sampleReviews.length); i++) {
    const sample = sampleReviews[i];
    reviews.push({
      reviewId: `${asin}-review-${i + 1}`,
      author: authors[i % authors.length],
      rating: sample.rating!,
      title: sample.title!,
      body: sample.body!,
      helpfulVotes: sample.helpfulVotes!,
      verified: sample.verified!,
      reviewDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
    });
  }

  return reviews;
}

/**
 * Generate sample product for demonstration
 */
export function generateSampleProduct(asin: string): AmazonProduct {
  return {
    asin,
    title: `Sample Product ${asin}`,
    description: "This is a sample product for demonstration purposes. In production, this data would be fetched from Amazon's API or a third-party service.",
    brand: "Sample Brand",
    price: "$29.99",
    rating: "4.2",
    reviewCount: 1247,
    imageUrl: `https://via.placeholder.com/300x300?text=${asin}`,
    productUrl: getAmazonProductUrl(asin),
    category: "Electronics",
    features: [
      "High quality materials",
      "Easy to use design",
      "Durable construction",
      "Great value for money",
    ],
  };
}
