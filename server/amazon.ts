/**
 * Amazon Product Research Service
 * 
 * Supports multiple data sources:
 * 1. Rainforest API - Professional Amazon data API
 * 2. ScraperAPI - Amazon scraping with structured data
 * 3. Sample data - For demonstration without API keys
 * 
 * Configure via environment variables:
 * - RAINFOREST_API_KEY: For Rainforest API
 * - SCRAPER_API_KEY: For ScraperAPI
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
  marketplace?: string;
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
  images?: string[];
}

export interface AmazonSearchResult {
  products: AmazonProduct[];
  totalResults: number;
}

export interface AmazonApiConfig {
  provider: "rainforest" | "scraperapi" | "sample";
  apiKey?: string;
}

// Cache for API responses to reduce calls
const productCache = new Map<string, { data: AmazonProduct; timestamp: number }>();
const reviewCache = new Map<string, { data: AmazonReview[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Parse Amazon URL to extract ASIN
 */
export function parseAmazonUrl(url: string): { asin: string | null; marketplace?: string; error?: string } {
  try {
    // Handle various Amazon URL formats
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /asin=([A-Z0-9]{10})/i,
    ];

    // Extract marketplace from URL
    const marketplaceMatch = url.match(/amazon\.([a-z.]+)\//i);
    const marketplace = marketplaceMatch ? marketplaceMatch[1].replace(/\./g, '') : 'com';

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { asin: match[1].toUpperCase(), marketplace };
      }
    }

    // Check if input is just an ASIN
    if (/^[A-Z0-9]{10}$/i.test(url.trim())) {
      return { asin: url.trim().toUpperCase(), marketplace: 'com' };
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
 * Fetch product data using Rainforest API
 */
async function fetchProductFromRainforest(asin: string, apiKey: string, marketplace: string = "com"): Promise<AmazonProduct | null> {
  try {
    const amazonDomain = marketplace === 'com' ? 'amazon.com' : `amazon.${marketplace}`;
    const url = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=product&amazon_domain=${amazonDomain}&asin=${asin}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Rainforest API] Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.product) {
      return null;
    }
    
    const product = data.product;
    return {
      asin: product.asin,
      title: product.title,
      description: product.description,
      brand: product.brand,
      price: product.buybox_winner?.price?.raw || product.price?.raw,
      rating: product.rating?.toString(),
      reviewCount: product.ratings_total,
      imageUrl: product.main_image?.link,
      productUrl: product.link,
      category: product.categories?.[0]?.name,
      features: product.feature_bullets || [],
      marketplace,
    };
  } catch (error: any) {
    console.error("[Rainforest API] Error fetching product:", error.message);
    return null;
  }
}

/**
 * Fetch reviews using Rainforest API
 */
async function fetchReviewsFromRainforest(
  asin: string, 
  apiKey: string, 
  marketplace: string = "com",
  page: number = 1
): Promise<AmazonReview[]> {
  try {
    const amazonDomain = marketplace === 'com' ? 'amazon.com' : `amazon.${marketplace}`;
    const url = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=reviews&amazon_domain=${amazonDomain}&asin=${asin}&page=${page}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Rainforest API] Error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.reviews) {
      return [];
    }
    
    return data.reviews.map((review: any) => ({
      reviewId: review.id,
      author: review.profile?.name || "Anonymous",
      rating: review.rating,
      title: review.title,
      body: review.body,
      helpfulVotes: review.helpful_votes || 0,
      verified: review.verified_purchase || false,
      reviewDate: new Date(review.date?.utc || Date.now()),
      images: review.images?.map((img: any) => img.link) || [],
    }));
  } catch (error: any) {
    console.error("[Rainforest API] Error fetching reviews:", error.message);
    return [];
  }
}

/**
 * Fetch product data using ScraperAPI
 */
async function fetchProductFromScraperAPI(asin: string, apiKey: string, marketplace: string = "com"): Promise<AmazonProduct | null> {
  try {
    const amazonUrl = encodeURIComponent(`https://www.amazon.${marketplace}/dp/${asin}`);
    const url = `https://api.scraperapi.com/structured/amazon/product?api_key=${apiKey}&asin=${asin}&country=${marketplace === 'com' ? 'us' : marketplace}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[ScraperAPI] Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      asin: data.asin || asin,
      title: data.name,
      description: data.product_information?.description,
      brand: data.brand,
      price: data.pricing,
      rating: data.rating?.toString(),
      reviewCount: data.reviews_count,
      imageUrl: data.images?.[0],
      productUrl: `https://www.amazon.${marketplace}/dp/${asin}`,
      category: data.category,
      features: data.feature_bullets || [],
      marketplace,
    };
  } catch (error: any) {
    console.error("[ScraperAPI] Error fetching product:", error.message);
    return null;
  }
}

/**
 * Fetch reviews using ScraperAPI
 */
async function fetchReviewsFromScraperAPI(
  asin: string, 
  apiKey: string, 
  marketplace: string = "com",
  page: number = 1
): Promise<AmazonReview[]> {
  try {
    const url = `https://api.scraperapi.com/structured/amazon/review?api_key=${apiKey}&asin=${asin}&country=${marketplace === 'com' ? 'us' : marketplace}&page=${page}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[ScraperAPI] Error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.reviews) {
      return [];
    }
    
    return data.reviews.map((review: any, index: number) => ({
      reviewId: review.id || `${asin}-review-${page}-${index}`,
      author: review.author || "Anonymous",
      rating: parseFloat(review.rating) || 3,
      title: review.title || "",
      body: review.body || review.text || "",
      helpfulVotes: review.helpful_count || 0,
      verified: review.verified || false,
      reviewDate: new Date(review.date || Date.now()),
      images: review.images || [],
    }));
  } catch (error: any) {
    console.error("[ScraperAPI] Error fetching reviews:", error.message);
    return [];
  }
}

/**
 * Main function to fetch product data
 */
export async function fetchAmazonProduct(
  asin: string,
  config: AmazonApiConfig,
  marketplace: string = "com"
): Promise<AmazonProduct | null> {
  // Check cache first
  const cacheKey = `${asin}-${marketplace}`;
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let product: AmazonProduct | null = null;

  switch (config.provider) {
    case "rainforest":
      if (config.apiKey) {
        product = await fetchProductFromRainforest(asin, config.apiKey, marketplace);
      }
      break;
    case "scraperapi":
      if (config.apiKey) {
        product = await fetchProductFromScraperAPI(asin, config.apiKey, marketplace);
      }
      break;
    case "sample":
    default:
      product = generateSampleProduct(asin);
  }

  // Cache the result
  if (product) {
    productCache.set(cacheKey, { data: product, timestamp: Date.now() });
  }

  return product;
}

/**
 * Main function to fetch reviews
 */
export async function fetchAmazonReviews(
  asin: string,
  config: AmazonApiConfig,
  marketplace: string = "com",
  pages: number = 1
): Promise<AmazonReview[]> {
  // Check cache first
  const cacheKey = `${asin}-${marketplace}-reviews`;
  const cached = reviewCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let reviews: AmazonReview[] = [];

  switch (config.provider) {
    case "rainforest":
      if (config.apiKey) {
        for (let page = 1; page <= pages; page++) {
          const pageReviews = await fetchReviewsFromRainforest(asin, config.apiKey, marketplace, page);
          reviews = [...reviews, ...pageReviews];
          if (pageReviews.length < 10) break; // No more pages
        }
      }
      break;
    case "scraperapi":
      if (config.apiKey) {
        for (let page = 1; page <= pages; page++) {
          const pageReviews = await fetchReviewsFromScraperAPI(asin, config.apiKey, marketplace, page);
          reviews = [...reviews, ...pageReviews];
          if (pageReviews.length < 10) break;
        }
      }
      break;
    case "sample":
    default:
      reviews = generateSampleReviews(asin, 20);
  }

  // Cache the result
  if (reviews.length > 0) {
    reviewCache.set(cacheKey, { data: reviews, timestamp: Date.now() });
  }

  return reviews;
}

/**
 * Search for products (requires API)
 */
export async function searchAmazonProducts(
  query: string,
  config: AmazonApiConfig,
  marketplace: string = "com"
): Promise<AmazonSearchResult> {
  if (config.provider === "rainforest" && config.apiKey) {
    try {
      const amazonDomain = marketplace === 'com' ? 'amazon.com' : `amazon.${marketplace}`;
      const url = `https://api.rainforestapi.com/request?api_key=${config.apiKey}&type=search&amazon_domain=${amazonDomain}&search_term=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const products: AmazonProduct[] = (data.search_results || []).map((result: any) => ({
        asin: result.asin,
        title: result.title,
        brand: result.brand,
        price: result.price?.raw,
        rating: result.rating?.toString(),
        reviewCount: result.ratings_total,
        imageUrl: result.image,
        productUrl: result.link,
        category: result.categories?.[0]?.name,
        marketplace,
      }));
      
      return {
        products,
        totalResults: data.pagination?.total_results || products.length,
      };
    } catch (error: any) {
      console.error("[Rainforest API] Search error:", error.message);
    }
  }

  // Return sample results for demo
  return {
    products: [generateSampleProduct("B08N5WRWNW"), generateSampleProduct("B09V3KXJPB")],
    totalResults: 2,
  };
}

/**
 * Analyze review sentiment and extract themes
 */
export function analyzeReviewSentiment(review: AmazonReview): {
  sentiment: "positive" | "neutral" | "negative";
  themes: string[];
  painPoints: string[];
  praises: string[];
  keywords: string[];
} {
  const text = `${review.title} ${review.body}`.toLowerCase();
  
  // Sentiment based on rating
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  if (review.rating >= 4) sentiment = "positive";
  else if (review.rating <= 2) sentiment = "negative";

  const themes: string[] = [];
  const painPoints: string[] = [];
  const praises: string[] = [];
  const keywords: string[] = [];

  // Positive indicators
  const positivePatterns = [
    { pattern: /great quality|high quality|excellent quality/i, theme: "Quality", praise: "Great quality" },
    { pattern: /easy to use|user.?friendly|intuitive/i, theme: "Usability", praise: "Easy to use" },
    { pattern: /fast shipping|quick delivery|arrived early/i, theme: "Shipping", praise: "Fast shipping" },
    { pattern: /worth the money|good value|great price|affordable/i, theme: "Value", praise: "Good value" },
    { pattern: /highly recommend|would recommend|must buy/i, theme: "Recommendation", praise: "Highly recommended" },
    { pattern: /exceeded expectations|better than expected/i, theme: "Expectations", praise: "Exceeded expectations" },
    { pattern: /perfect|exactly what i needed|just right/i, theme: "Satisfaction", praise: "Perfect fit" },
    { pattern: /durable|sturdy|well.?made|solid/i, theme: "Durability", praise: "Well made" },
    { pattern: /beautiful|gorgeous|looks great|stylish/i, theme: "Design", praise: "Great design" },
    { pattern: /works perfectly|functions great|performs well/i, theme: "Performance", praise: "Works perfectly" },
  ];

  // Negative indicators
  const negativePatterns = [
    { pattern: /broke|broken|defective|damaged/i, theme: "Quality", painPoint: "Product broke/defective" },
    { pattern: /doesn't work|didn't work|not working|stopped working/i, theme: "Functionality", painPoint: "Doesn't work" },
    { pattern: /waste of money|overpriced|too expensive/i, theme: "Value", painPoint: "Poor value" },
    { pattern: /poor quality|cheap|flimsy|thin/i, theme: "Quality", painPoint: "Poor quality" },
    { pattern: /difficult to|hard to|confusing|complicated/i, theme: "Usability", painPoint: "Difficult to use" },
    { pattern: /late|delayed|slow shipping|never arrived/i, theme: "Shipping", painPoint: "Shipping issues" },
    { pattern: /return|refund|sent back/i, theme: "Returns", painPoint: "Had to return" },
    { pattern: /misleading|false advertising|not as described|different from/i, theme: "Accuracy", painPoint: "Not as described" },
    { pattern: /customer service|support|no response/i, theme: "Support", painPoint: "Poor customer service" },
    { pattern: /smell|odor|stinks/i, theme: "Quality", painPoint: "Bad smell/odor" },
  ];

  // Extract keywords (simple approach)
  const keywordPatterns = [
    /battery life/i, /build quality/i, /customer service/i, /price point/i,
    /easy setup/i, /fast charging/i, /good fit/i, /heavy duty/i,
    /lightweight/i, /long lasting/i, /noise level/i, /power consumption/i,
    /screen quality/i, /sound quality/i, /water resistant/i, /wireless/i,
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

  keywordPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && !keywords.includes(match[0].toLowerCase())) {
      keywords.push(match[0].toLowerCase());
    }
  });

  return { sentiment, themes, painPoints, praises, keywords };
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
  topKeywords: string[];
  recentTrend: "improving" | "stable" | "declining";
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
      topKeywords: [],
      recentTrend: "stable",
    };
  }

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let verifiedCount = 0;
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  const themeCounts: Record<string, number> = {};
  const painPointCounts: Record<string, number> = {};
  const praiseCounts: Record<string, number> = {};
  const keywordCounts: Record<string, number> = {};

  // Sort reviews by date for trend analysis
  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
  );

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
    analysis.keywords.forEach(kw => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
  });

  // Calculate trend (compare recent vs older reviews)
  let recentTrend: "improving" | "stable" | "declining" = "stable";
  if (sortedReviews.length >= 10) {
    const recentAvg = sortedReviews.slice(0, 5).reduce((sum, r) => sum + r.rating, 0) / 5;
    const olderAvg = sortedReviews.slice(-5).reduce((sum, r) => sum + r.rating, 0) / 5;
    if (recentAvg - olderAvg > 0.3) recentTrend = "improving";
    else if (olderAvg - recentAvg > 0.3) recentTrend = "declining";
  }

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
    topKeywords: sortByCount(keywordCounts).slice(0, 10),
    recentTrend,
  };
}

/**
 * Generate sample reviews for demonstration
 */
export function generateSampleReviews(asin: string, count: number = 20): AmazonReview[] {
  const sampleReviews: Partial<AmazonReview>[] = [
    { rating: 5, title: "Exceeded my expectations!", body: "This product is exactly what I needed. Great quality and fast shipping. Highly recommend to anyone looking for a reliable solution. The build quality is excellent and it works perfectly.", helpfulVotes: 45, verified: true },
    { rating: 5, title: "Perfect for my needs", body: "Easy to use and well made. Worth every penny. The durability is impressive and the design is beautiful. Customer service was also very helpful.", helpfulVotes: 32, verified: true },
    { rating: 4, title: "Good product, minor issues", body: "Overall satisfied with the purchase. Quality is good but the instructions could be clearer. Easy setup once you figure it out. Good value for the price.", helpfulVotes: 18, verified: true },
    { rating: 4, title: "Solid choice", body: "Does what it's supposed to do. Good value for the price. Would buy again. Battery life is decent and it's lightweight.", helpfulVotes: 12, verified: false },
    { rating: 3, title: "It's okay", body: "Average product. Nothing special but gets the job done. Expected a bit more for the price. Sound quality could be better.", helpfulVotes: 8, verified: true },
    { rating: 3, title: "Mixed feelings", body: "Some features work great, others not so much. Difficult to set up initially but customer service helped. Screen quality is good.", helpfulVotes: 15, verified: true },
    { rating: 2, title: "Disappointed", body: "Poor quality compared to what was advertised. Had issues from day one. Considering a return. Not as described in the listing.", helpfulVotes: 28, verified: true },
    { rating: 2, title: "Not as described", body: "The product doesn't match the description. Misleading photos. Waste of money. Had to request a refund.", helpfulVotes: 42, verified: false },
    { rating: 1, title: "Complete waste", body: "Broke after one week. Cheap materials, flimsy construction. Don't buy this. Customer service was unhelpful.", helpfulVotes: 67, verified: true },
    { rating: 1, title: "Terrible experience", body: "Product arrived damaged and customer service was unhelpful. Had to request a refund. Slow shipping too.", helpfulVotes: 53, verified: true },
    { rating: 5, title: "Best purchase ever!", body: "I've tried many similar products and this is by far the best. Sturdy, reliable, and great price. Fast shipping and excellent build quality.", helpfulVotes: 89, verified: true },
    { rating: 4, title: "Pleasantly surprised", body: "Wasn't expecting much but this exceeded expectations. Fast shipping too! Easy to use and looks great.", helpfulVotes: 24, verified: true },
    { rating: 5, title: "Game changer", body: "This has made my life so much easier. Easy to use and durable. Highly recommend! Works perfectly every time.", helpfulVotes: 56, verified: true },
    { rating: 3, title: "Does the job", body: "It works but nothing extraordinary. Average quality for average price. Battery life could be better.", helpfulVotes: 11, verified: false },
    { rating: 4, title: "Good value", body: "For the price, this is a great deal. Some minor quality issues but overall satisfied. Would recommend.", helpfulVotes: 19, verified: true },
    { rating: 5, title: "Love it!", body: "Exactly what I was looking for. Great quality, fast charging, and beautiful design. Highly recommend to everyone!", helpfulVotes: 34, verified: true },
    { rating: 2, title: "Could be better", body: "The noise level is too high and it's not very water resistant as claimed. Disappointed with the purchase.", helpfulVotes: 21, verified: true },
    { rating: 4, title: "Reliable product", body: "Using this for 3 months now. Long lasting battery and good performance. Minor issues with the app but overall good.", helpfulVotes: 16, verified: true },
    { rating: 5, title: "Excellent!", body: "Perfect fit for my needs. Lightweight, portable, and works great. Fast shipping and well packaged.", helpfulVotes: 27, verified: true },
    { rating: 3, title: "Decent", body: "Gets the job done but nothing special. The price point is fair for what you get. Power consumption is a bit high.", helpfulVotes: 9, verified: false },
  ];

  const reviews: AmazonReview[] = [];
  const authors = ["John D.", "Sarah M.", "Mike R.", "Emily K.", "David L.", "Jennifer P.", "Chris W.", "Amanda S.", "Robert T.", "Lisa H.", "James B.", "Maria G.", "Kevin C.", "Rachel N.", "Steven F."];
  
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
      reviewDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    });
  }

  return reviews;
}

/**
 * Generate sample product for demonstration
 */
export function generateSampleProduct(asin: string): AmazonProduct {
  const products: Record<string, Partial<AmazonProduct>> = {
    "B08N5WRWNW": {
      title: "Premium Wireless Bluetooth Headphones",
      description: "High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality.",
      brand: "AudioTech Pro",
      price: "$79.99",
      rating: "4.3",
      reviewCount: 2847,
      category: "Electronics > Headphones",
      features: ["Active Noise Cancellation", "30-hour battery life", "Bluetooth 5.0", "Foldable design", "Built-in microphone"],
    },
    "B09V3KXJPB": {
      title: "Smart Fitness Tracker Watch",
      description: "Advanced fitness tracker with heart rate monitoring, sleep tracking, and 7-day battery life.",
      brand: "FitLife",
      price: "$49.99",
      rating: "4.1",
      reviewCount: 5632,
      category: "Sports & Outdoors > Fitness",
      features: ["Heart rate monitoring", "Sleep tracking", "Water resistant", "GPS tracking", "7-day battery"],
    },
  };

  const defaultProduct = products[asin] || {};
  
  return {
    asin,
    title: defaultProduct.title || `Sample Product ${asin}`,
    description: defaultProduct.description || "This is a sample product for demonstration purposes.",
    brand: defaultProduct.brand || "Sample Brand",
    price: defaultProduct.price || "$29.99",
    rating: defaultProduct.rating || "4.2",
    reviewCount: defaultProduct.reviewCount || 1247,
    imageUrl: `https://via.placeholder.com/300x300?text=${asin}`,
    productUrl: getAmazonProductUrl(asin),
    category: defaultProduct.category || "General",
    features: defaultProduct.features || ["High quality materials", "Easy to use design", "Durable construction"],
    marketplace: "com",
  };
}

/**
 * Compare multiple products for competitive analysis
 */
export function compareProducts(products: AmazonProduct[], reviewsMap: Map<string, AmazonReview[]>): {
  comparison: {
    asin: string;
    title: string;
    rating: number;
    reviewCount: number;
    price: string;
    sentimentScore: number;
    strengths: string[];
    weaknesses: string[];
  }[];
  insights: string[];
} {
  const comparison = products.map(product => {
    const reviews = reviewsMap.get(product.asin) || [];
    const stats = calculateReviewStats(reviews);
    
    return {
      asin: product.asin,
      title: product.title,
      rating: parseFloat(product.rating || "0"),
      reviewCount: product.reviewCount || 0,
      price: product.price || "N/A",
      sentimentScore: (stats.sentimentBreakdown.positive / Math.max(stats.totalReviews, 1)) * 100,
      strengths: stats.topPraises,
      weaknesses: stats.topPainPoints,
    };
  });

  // Generate insights
  const insights: string[] = [];
  
  if (comparison.length >= 2) {
    const sorted = [...comparison].sort((a, b) => b.rating - a.rating);
    insights.push(`${sorted[0].title} has the highest rating (${sorted[0].rating.toFixed(1)}) among compared products.`);
    
    const mostReviewed = [...comparison].sort((a, b) => b.reviewCount - a.reviewCount)[0];
    insights.push(`${mostReviewed.title} has the most reviews (${mostReviewed.reviewCount}), indicating higher market presence.`);
    
    const bestSentiment = [...comparison].sort((a, b) => b.sentimentScore - a.sentimentScore)[0];
    insights.push(`${bestSentiment.title} has the highest positive sentiment (${bestSentiment.sentimentScore.toFixed(0)}%).`);
  }

  return { comparison, insights };
}

/**
 * Clear cache (useful for testing or forcing refresh)
 */
export function clearCache(): void {
  productCache.clear();
  reviewCache.clear();
}
