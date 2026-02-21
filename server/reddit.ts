/**
 * Reddit Research Service
 * 
 * Uses Reddit's public JSON API endpoints which don't require authentication
 * for read-only access to public subreddits and posts.
 * 
 * Note: For production use with higher rate limits, consider using
 * Reddit's official API with OAuth authentication.
 */

export interface RedditPost {
  postId: string;
  subreddit: string;
  title: string;
  body?: string;
  author: string;
  score: number;
  upvoteRatio: number;
  commentCount: number;
  postUrl: string;
  isNsfw: boolean;
  flair?: string;
  mediaUrl?: string;
  postedAt: Date;
  permalink: string;
}

export interface RedditComment {
  commentId: string;
  postId: string;
  parentCommentId?: string;
  author: string;
  body: string;
  score: number;
  isOp: boolean;
  depth: number;
  postedAt: Date;
  commentUrl?: string;
  replies?: RedditComment[];
}

export interface RedditSearchResult {
  posts: RedditPost[];
  after?: string;
  hasMore: boolean;
}

/**
 * Parse Reddit URL to extract subreddit, post ID, etc.
 */
export function parseRedditUrl(url: string): {
  type: "subreddit" | "post" | "search" | "user" | null;
  subreddit?: string;
  postId?: string;
  username?: string;
  searchQuery?: string;
  error?: string;
} {
  try {
    // Handle various Reddit URL formats
    const patterns = {
      // https://www.reddit.com/r/subreddit/comments/postid/title/
      post: /reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)/i,
      // https://www.reddit.com/r/subreddit/
      subreddit: /reddit\.com\/r\/([^\/]+)\/?$/i,
      // https://www.reddit.com/user/username/
      user: /reddit\.com\/u(?:ser)?\/([^\/]+)/i,
      // https://www.reddit.com/search?q=query
      search: /reddit\.com\/search\?q=([^&]+)/i,
      // Short link: https://redd.it/postid
      shortPost: /redd\.it\/([a-z0-9]+)/i,
    };

    // Check for post URL
    let match = url.match(patterns.post);
    if (match) {
      return { type: "post", subreddit: match[1], postId: match[2] };
    }

    // Check for short post URL
    match = url.match(patterns.shortPost);
    if (match) {
      return { type: "post", postId: match[1] };
    }

    // Check for subreddit URL
    match = url.match(patterns.subreddit);
    if (match) {
      return { type: "subreddit", subreddit: match[1] };
    }

    // Check for user URL
    match = url.match(patterns.user);
    if (match) {
      return { type: "user", username: match[1] };
    }

    // Check for search URL
    match = url.match(patterns.search);
    if (match) {
      return { type: "search", searchQuery: decodeURIComponent(match[1]) };
    }

    // Check if input is just a subreddit name (r/subreddit or just subreddit)
    const subredditMatch = url.match(/^r?\/?([\w]+)$/i);
    if (subredditMatch) {
      return { type: "subreddit", subreddit: subredditMatch[1] };
    }

    return { type: null, error: "Could not parse Reddit URL" };
  } catch (error) {
    return { type: null, error: "Invalid URL format" };
  }
}

/**
 * Fetch posts from a subreddit using Reddit's JSON API
 */
export async function fetchSubredditPosts(
  subreddit: string,
  sort: "hot" | "new" | "top" | "rising" = "hot",
  limit: number = 25,
  after?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "week"
): Promise<RedditSearchResult> {
  try {
    let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
    if (after) url += `&after=${after}`;
    if (sort === "top") url += `&t=${timeframe}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "YT-Analyzer-Research/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Subreddit r/${subreddit} not found`);
      }
      if (response.status === 403) {
        throw new Error(`Subreddit r/${subreddit} is private or quarantined`);
      }
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    
    const posts: RedditPost[] = data.data.children
      .filter((child: any) => child.kind === "t3")
      .map((child: any) => {
        const post = child.data;
        return {
          postId: post.id,
          subreddit: post.subreddit,
          title: post.title,
          body: post.selftext || undefined,
          author: post.author,
          score: post.score,
          upvoteRatio: post.upvote_ratio,
          commentCount: post.num_comments,
          postUrl: `https://reddit.com${post.permalink}`,
          isNsfw: post.over_18,
          flair: post.link_flair_text || undefined,
          mediaUrl: post.url_overridden_by_dest || post.url || undefined,
          postedAt: new Date(post.created_utc * 1000),
          permalink: post.permalink,
        };
      });

    return {
      posts,
      after: data.data.after || undefined,
      hasMore: !!data.data.after,
    };
  } catch (error: any) {
    console.error("[Reddit API] Error fetching subreddit:", error.message);
    throw error;
  }
}

/**
 * Search Reddit for posts matching a query
 */
export async function searchReddit(
  query: string,
  subreddit?: string,
  sort: "relevance" | "hot" | "top" | "new" | "comments" = "relevance",
  limit: number = 25,
  after?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "all"
): Promise<RedditSearchResult> {
  try {
    let url = subreddit
      ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on`
      : `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}`;
    
    url += `&sort=${sort}&limit=${limit}&t=${timeframe}`;
    if (after) url += `&after=${after}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "YT-Analyzer-Research/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit search error: ${response.status}`);
    }

    const data = await response.json();
    
    const posts: RedditPost[] = data.data.children
      .filter((child: any) => child.kind === "t3")
      .map((child: any) => {
        const post = child.data;
        return {
          postId: post.id,
          subreddit: post.subreddit,
          title: post.title,
          body: post.selftext || undefined,
          author: post.author,
          score: post.score,
          upvoteRatio: post.upvote_ratio,
          commentCount: post.num_comments,
          postUrl: `https://reddit.com${post.permalink}`,
          isNsfw: post.over_18,
          flair: post.link_flair_text || undefined,
          mediaUrl: post.url_overridden_by_dest || post.url || undefined,
          postedAt: new Date(post.created_utc * 1000),
          permalink: post.permalink,
        };
      });

    return {
      posts,
      after: data.data.after || undefined,
      hasMore: !!data.data.after,
    };
  } catch (error: any) {
    console.error("[Reddit API] Error searching:", error.message);
    throw error;
  }
}

/**
 * Fetch posts by author (user)
 * Mimics "Discover posts by author" – post id, URL, user, title, description, num comments, date, community name.
 */
export async function fetchUserPosts(
  username: string,
  sort: "hot" | "new" | "top" | "rising" = "hot",
  limit: number = 25,
  after?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "week"
): Promise<RedditSearchResult> {
  try {
    let url = `https://www.reddit.com/user/${username}/submitted.json?sort=${sort}&limit=${limit}`;
    if (after) url += `&after=${after}`;
    if (sort === "top") url += `&t=${timeframe}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "YT-Analyzer-Research/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User u/${username} not found`);
      }
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();

    const posts: RedditPost[] = (data.data?.children || [])
      .filter((child: any) => child.kind === "t3")
      .map((child: any) => {
        const post = child.data;
        return {
          postId: post.id,
          subreddit: post.subreddit,
          title: post.title,
          body: post.selftext || undefined,
          author: post.author,
          score: post.score,
          upvoteRatio: post.upvote_ratio,
          commentCount: post.num_comments,
          postUrl: `https://reddit.com${post.permalink}`,
          isNsfw: post.over_18,
          flair: post.link_flair_text || undefined,
          mediaUrl: post.url_overridden_by_dest || post.url || undefined,
          postedAt: new Date(post.created_utc * 1000),
          permalink: post.permalink,
        };
      });

    return {
      posts,
      after: data.data?.after || undefined,
      hasMore: !!data.data?.after,
    };
  } catch (error: any) {
    console.error("[Reddit API] Error fetching user posts:", error.message);
    throw error;
  }
}

/**
 * Fetch comments for a specific post
 */
export async function fetchPostComments(
  subreddit: string,
  postId: string,
  sort: "best" | "top" | "new" | "controversial" | "old" | "qa" = "best",
  limit: number = 100
): Promise<{ post: RedditPost; comments: RedditComment[] }> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=${sort}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "YT-Analyzer-Research/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // First element is the post, second is comments
    const postData = data[0].data.children[0].data;
    const post: RedditPost = {
      postId: postData.id,
      subreddit: postData.subreddit,
      title: postData.title,
      body: postData.selftext || undefined,
      author: postData.author,
      score: postData.score,
      upvoteRatio: postData.upvote_ratio,
      commentCount: postData.num_comments,
      postUrl: `https://reddit.com${postData.permalink}`,
      isNsfw: postData.over_18,
      flair: postData.link_flair_text || undefined,
      mediaUrl: postData.url_overridden_by_dest || postData.url || undefined,
      postedAt: new Date(postData.created_utc * 1000),
      permalink: postData.permalink,
    };

    const baseUrl = `https://reddit.com${postData.permalink}`;
    const comments = parseCommentTree(data[1].data.children, postData.author, postId, undefined, 0, baseUrl);

    return { post, comments };
  } catch (error: any) {
    console.error("[Reddit API] Error fetching comments:", error.message);
    throw error;
  }
}

/**
 * Parse Reddit's nested comment structure into flat array with depth
 */
function parseCommentTree(
  children: any[],
  opAuthor: string,
  postId: string,
  parentId?: string,
  depth: number = 0,
  postPermalinkBase?: string
): RedditComment[] {
  const comments: RedditComment[] = [];

  for (const child of children) {
    if (child.kind !== "t1") continue; // Skip non-comment items (like "more" links)

    const comment = child.data;
    const parsedComment: RedditComment = {
      commentId: comment.id,
      postId,
      parentCommentId: parentId,
      author: comment.author,
      body: comment.body,
      score: comment.score,
      isOp: comment.author === opAuthor,
      depth,
      postedAt: new Date(comment.created_utc * 1000),
      commentUrl: postPermalinkBase ? `${postPermalinkBase.replace(/\/?$/, "")}/${comment.id}` : undefined,
    };

    comments.push(parsedComment);

    // Parse nested replies
    if (comment.replies && comment.replies.data?.children) {
      const nestedComments = parseCommentTree(
        comment.replies.data.children,
        opAuthor,
        postId,
        comment.id,
        depth + 1,
        postPermalinkBase
      );
      comments.push(...nestedComments);
    }
  }

  return comments;
}

/**
 * Analyze comment sentiment and extract themes
 */
export function analyzeRedditComment(comment: RedditComment): {
  sentiment: "positive" | "neutral" | "negative";
  themes: string[];
  isQuestion: boolean;
  isRecommendation: boolean;
  isPainPoint: boolean;
} {
  const text = comment.body.toLowerCase();
  
  // Sentiment based on score and content
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  
  const positiveWords = ["love", "great", "amazing", "awesome", "excellent", "best", "recommend", "helpful", "thanks", "perfect"];
  const negativeWords = ["hate", "terrible", "awful", "worst", "bad", "horrible", "disappointing", "avoid", "waste", "scam"];
  
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;
  
  if (positiveCount > negativeCount && comment.score > 0) sentiment = "positive";
  else if (negativeCount > positiveCount || comment.score < -5) sentiment = "negative";

  // Extract themes
  const themes: string[] = [];
  const themePatterns: Record<string, RegExp> = {
    "Price/Value": /price|cost|expensive|cheap|worth|value|money|afford/i,
    "Quality": /quality|durable|sturdy|flimsy|well.?made|poorly.?made/i,
    "Comparison": /better than|worse than|compared to|vs\.|versus|alternative/i,
    "Experience": /experience|tried|used|bought|purchased|owned/i,
    "Support": /customer service|support|warranty|return|refund/i,
    "Features": /feature|function|capability|option|setting/i,
    "Problem": /problem|issue|bug|error|broken|doesn't work|won't work/i,
    "Solution": /solution|fix|solved|resolved|workaround/i,
  };

  Object.entries(themePatterns).forEach(([theme, pattern]) => {
    if (pattern.test(text)) themes.push(theme);
  });

  // Detect question
  const isQuestion = /\?|^(what|how|why|when|where|who|which|can|does|is|are|should|would|could)\b/i.test(text);

  // Detect recommendation
  const isRecommendation = /recommend|suggest|try|check out|go with|get the/i.test(text);

  // Detect pain point
  const isPainPoint = /problem|issue|frustrat|annoy|disappoint|wish|hate|struggle/i.test(text);

  return { sentiment, themes, isQuestion, isRecommendation, isPainPoint };
}

/**
 * Calculate statistics for a set of Reddit posts/comments
 */
export function calculateRedditStats(posts: RedditPost[], comments: RedditComment[]): {
  totalPosts: number;
  totalComments: number;
  avgPostScore: number;
  avgCommentScore: number;
  topSubreddits: { name: string; count: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topThemes: string[];
  questionCount: number;
  recommendationCount: number;
  painPointCount: number;
} {
  const subredditCounts: Record<string, number> = {};
  let totalPostScore = 0;
  let totalCommentScore = 0;
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  const themeCounts: Record<string, number> = {};
  let questionCount = 0;
  let recommendationCount = 0;
  let painPointCount = 0;

  posts.forEach(post => {
    totalPostScore += post.score;
    subredditCounts[post.subreddit] = (subredditCounts[post.subreddit] || 0) + 1;
  });

  comments.forEach(comment => {
    totalCommentScore += comment.score;
    const analysis = analyzeRedditComment(comment);
    sentimentBreakdown[analysis.sentiment]++;
    analysis.themes.forEach(theme => {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });
    if (analysis.isQuestion) questionCount++;
    if (analysis.isRecommendation) recommendationCount++;
    if (analysis.isPainPoint) painPointCount++;
  });

  const topSubreddits = Object.entries(subredditCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  return {
    totalPosts: posts.length,
    totalComments: comments.length,
    avgPostScore: posts.length > 0 ? totalPostScore / posts.length : 0,
    avgCommentScore: comments.length > 0 ? totalCommentScore / comments.length : 0,
    topSubreddits,
    sentimentBreakdown,
    topThemes,
    questionCount,
    recommendationCount,
    painPointCount,
  };
}

/**
 * Get popular subreddits for product research
 */
export function getPopularResearchSubreddits(): { name: string; description: string; category: string }[] {
  return [
    { name: "BuyItForLife", description: "Products that last", category: "Product Quality" },
    { name: "Frugal", description: "Budget-conscious shopping", category: "Value" },
    { name: "gadgets", description: "Tech and electronics", category: "Technology" },
    { name: "technology", description: "Tech news and discussion", category: "Technology" },
    { name: "AskReddit", description: "General questions", category: "General" },
    { name: "IAmA", description: "Expert AMAs", category: "Expert Insights" },
    { name: "Entrepreneur", description: "Business and startups", category: "Business" },
    { name: "smallbusiness", description: "Small business owners", category: "Business" },
    { name: "SideProject", description: "Side projects and MVPs", category: "Business" },
    { name: "startups", description: "Startup ecosystem", category: "Business" },
    { name: "marketing", description: "Marketing strategies", category: "Marketing" },
    { name: "digital_marketing", description: "Digital marketing", category: "Marketing" },
    { name: "SEO", description: "Search optimization", category: "Marketing" },
    { name: "ecommerce", description: "Online selling", category: "E-commerce" },
    { name: "dropship", description: "Dropshipping", category: "E-commerce" },
    { name: "FulfillmentByAmazon", description: "Amazon FBA", category: "E-commerce" },
    { name: "ProductTesting", description: "Product reviews", category: "Reviews" },
    { name: "reviews", description: "General reviews", category: "Reviews" },
  ];
}

/**
 * Generate sample Reddit posts for demonstration
 */
export function generateSamplePosts(query: string, count: number = 10): RedditPost[] {
  const samplePosts: Partial<RedditPost>[] = [
    {
      title: `What's your experience with ${query}?`,
      body: `I'm looking to buy ${query} and wanted to hear from people who have actually used it. What are the pros and cons? Is it worth the price?`,
      subreddit: "BuyItForLife",
      author: "ProductResearcher",
      score: 245,
      upvoteRatio: 0.94,
      commentCount: 87,
    },
    {
      title: `${query} - honest review after 6 months`,
      body: `I've been using ${query} for about 6 months now and wanted to share my thoughts. Overall, I'm pretty satisfied but there are some things I wish I knew before buying...`,
      subreddit: "reviews",
      author: "HonestReviewer",
      score: 189,
      upvoteRatio: 0.91,
      commentCount: 52,
    },
    {
      title: `Is ${query} worth it in 2024?`,
      body: `Considering getting ${query} but not sure if it's still relevant. Has anyone compared it to newer alternatives?`,
      subreddit: "gadgets",
      author: "TechEnthusiast",
      score: 156,
      upvoteRatio: 0.88,
      commentCount: 73,
    },
    {
      title: `Best budget alternative to ${query}?`,
      body: `I love the features of ${query} but the price is a bit steep for me. Are there any good budget alternatives that offer similar functionality?`,
      subreddit: "Frugal",
      author: "BudgetShopper",
      score: 312,
      upvoteRatio: 0.96,
      commentCount: 124,
    },
    {
      title: `${query} problems - anyone else experiencing this?`,
      body: `I bought ${query} last month and I'm having some issues. The quality doesn't seem as good as advertised. Is this a common problem or did I get a bad unit?`,
      subreddit: "ProductTesting",
      author: "ConcernedBuyer",
      score: 78,
      upvoteRatio: 0.82,
      commentCount: 45,
    },
    {
      title: `Why I switched from ${query} to something else`,
      body: `After using ${query} for 2 years, I finally made the switch. Here's why and what I'm using now...`,
      subreddit: "technology",
      author: "TechSwitcher",
      score: 423,
      upvoteRatio: 0.89,
      commentCount: 156,
    },
    {
      title: `${query} vs competitors - detailed comparison`,
      body: `I've tested ${query} against its main competitors. Here's a breakdown of features, quality, and value for money...`,
      subreddit: "reviews",
      author: "ComparisonKing",
      score: 567,
      upvoteRatio: 0.95,
      commentCount: 203,
    },
    {
      title: `How ${query} changed my workflow`,
      body: `I was skeptical at first, but ${query} has genuinely improved my productivity. Here's how I use it daily...`,
      subreddit: "Entrepreneur",
      author: "ProductivityGuru",
      score: 234,
      upvoteRatio: 0.92,
      commentCount: 67,
    },
    {
      title: `Customer service nightmare with ${query}`,
      body: `Warning to potential buyers: my experience with ${query}'s customer service has been terrible. Here's what happened...`,
      subreddit: "smallbusiness",
      author: "FrustratedCustomer",
      score: 145,
      upvoteRatio: 0.78,
      commentCount: 89,
    },
    {
      title: `${query} tips and tricks you might not know`,
      body: `After using ${query} extensively, I've discovered some hidden features and optimizations. Sharing them here for the community...`,
      subreddit: "gadgets",
      author: "PowerUser",
      score: 678,
      upvoteRatio: 0.97,
      commentCount: 234,
    },
  ];

  return samplePosts.slice(0, count).map((post, index) => ({
    postId: `sample_${index}_${Date.now()}`,
    subreddit: post.subreddit || "technology",
    title: post.title || `Discussion about ${query}`,
    body: post.body,
    author: post.author || "SampleUser",
    score: post.score || Math.floor(Math.random() * 500),
    upvoteRatio: post.upvoteRatio || 0.85,
    commentCount: post.commentCount || Math.floor(Math.random() * 100),
    postUrl: `https://reddit.com/r/${post.subreddit}/comments/sample${index}`,
    isNsfw: false,
    flair: undefined,
    mediaUrl: undefined,
    postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    permalink: `/r/${post.subreddit}/comments/sample${index}`,
  }));
}

/**
 * Generate sample Reddit comments for demonstration
 */
export function generateSampleComments(postId: string, count: number = 15): RedditComment[] {
  const sampleComments: Partial<RedditComment>[] = [
    { body: "I've been using this for about a year now and it's been great. Highly recommend!", score: 145, isOp: false },
    { body: "The quality is decent but I've had some issues with customer support. Just something to keep in mind.", score: 89, isOp: false },
    { body: "Worth every penny. I compared it to several alternatives and this one came out on top.", score: 234, isOp: false },
    { body: "I had the same question! Following this thread for answers.", score: 12, isOp: false },
    { body: "Pro tip: make sure you buy from an authorized seller. I got a fake one from a third party and it was terrible.", score: 167, isOp: false },
    { body: "The build quality could be better for the price point, but overall functionality is solid.", score: 78, isOp: false },
    { body: "I returned mine after a week. Just didn't work for my use case. YMMV.", score: 45, isOp: false },
    { body: "Best purchase I've made this year. The features are exactly what I needed.", score: 312, isOp: false },
    { body: "Has anyone tried the newer version? Wondering if it's worth the upgrade.", score: 56, isOp: false },
    { body: "The learning curve is steep but once you get the hang of it, it's amazing.", score: 123, isOp: false },
    { body: "I've recommended this to all my friends. No complaints so far from anyone.", score: 89, isOp: false },
    { body: "The price has dropped significantly. Now might be a good time to buy.", score: 67, isOp: false },
    { body: "Make sure to check the warranty terms. Mine broke after 13 months and I was out of luck.", score: 234, isOp: false },
    { body: "Compared to the competition, this offers the best value for money in my opinion.", score: 156, isOp: false },
    { body: "I wish they would improve the documentation. Took me forever to figure out some features.", score: 45, isOp: false },
  ];

  return sampleComments.slice(0, count).map((comment, index) => ({
    commentId: `sample_comment_${index}_${Date.now()}`,
    postId,
    parentCommentId: index > 5 && Math.random() > 0.5 ? `sample_comment_${Math.floor(index / 2)}_${Date.now()}` : undefined,
    author: `User${Math.floor(Math.random() * 10000)}`,
    body: comment.body || "This is a sample comment.",
    score: comment.score || Math.floor(Math.random() * 200),
    isOp: comment.isOp || false,
    depth: index > 5 && Math.random() > 0.5 ? 1 : 0,
    postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));
}

/**
 * Fetch subreddit posts with fallback to sample data
 */
export async function fetchSubredditPostsWithFallback(
  subreddit: string,
  sort: "hot" | "new" | "top" | "rising" = "hot",
  limit: number = 25,
  after?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "week"
): Promise<RedditSearchResult> {
  try {
    return await fetchSubredditPosts(subreddit, sort, limit, after, timeframe);
  } catch (error: any) {
    console.error(`[Reddit] Falling back to sample data due to error: ${error.message}`);
    return {
      posts: generateSamplePosts(subreddit, limit),
      after: undefined,
      hasMore: false,
    };
  }
}

/**
 * Search Reddit with fallback to sample data
 */
export async function searchRedditWithFallback(
  query: string,
  subreddit?: string,
  sort: "relevance" | "hot" | "top" | "new" | "comments" = "relevance",
  limit: number = 25,
  after?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "all"
): Promise<RedditSearchResult> {
  try {
    return await searchReddit(query, subreddit, sort, limit, after, timeframe);
  } catch (error: any) {
    console.error(`[Reddit] Falling back to sample data due to error: ${error.message}`);
    return {
      posts: generateSamplePosts(query, limit),
      after: undefined,
      hasMore: false,
    };
  }
}

/**
 * Fetch user posts with fallback to sample data
 */
export async function fetchUserPostsWithFallback(
  username: string,
  sort: "hot" | "new" | "top" | "rising" = "hot",
  limit: number = 25,
  after?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "week"
): Promise<RedditSearchResult> {
  try {
    return await fetchUserPosts(username, sort, limit, after, timeframe);
  } catch (error: any) {
    console.error(`[Reddit] Falling back to sample data for user ${username}:`, error.message);
    const sample = generateSamplePosts(username, limit);
    return {
      posts: sample.map((p) => ({ ...p, author: username })),
      after: undefined,
      hasMore: false,
    };
  }
}

/**
 * Fetch post comments with fallback to sample data
 */
export async function fetchPostCommentsWithFallback(
  subreddit: string,
  postId: string,
  sort: "best" | "top" | "new" | "controversial" | "old" | "qa" = "best",
  limit: number = 100
): Promise<{ post: RedditPost; comments: RedditComment[] }> {
  try {
    return await fetchPostComments(subreddit, postId, sort, limit);
  } catch (error: any) {
    console.error(`[Reddit] Falling back to sample data due to error: ${error.message}`);
    const samplePost = generateSamplePosts(subreddit, 1)[0];
    samplePost.postId = postId;
    return {
      post: samplePost,
      comments: generateSampleComments(postId, limit),
    };
  }
}
