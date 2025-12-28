/**
 * TikTok API Service
 * Provides functions for parsing TikTok URLs and fetching video/creator data
 * Uses sample data by default since TikTok API requires authentication
 */

export interface TikTokVideoInfo {
  videoId: string;
  description: string;
  coverUrl: string;
  duration: number;
  playCount: number;
  diggCount: number;
  shareCount: number;
  commentCount: number;
  collectCount: number;
  createTime: Date;
  musicId?: string;
  musicTitle?: string;
  musicAuthor?: string;
  hashtags: string[];
  creator: TikTokCreatorInfo;
}

export interface TikTokCreatorInfo {
  uniqueId: string;
  nickname: string;
  avatarUrl: string;
  signature: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
}

export interface TikTokCommentInfo {
  commentId: string;
  videoId: string;
  authorUniqueId: string;
  authorNickname: string;
  authorAvatarUrl: string;
  text: string;
  diggCount: number;
  replyCount: number;
  createTime: Date;
}

/**
 * Parse TikTok URL to extract video ID or username
 */
export function parseTikTokUrl(url: string): { type: 'video' | 'user' | null; id: string | null } {
  const trimmed = url.trim();
  
  // Direct video ID (numeric)
  if (/^\d{15,25}$/.test(trimmed)) {
    return { type: 'video', id: trimmed };
  }
  
  // Username without @
  if (/^[a-zA-Z0-9_.]{2,24}$/.test(trimmed) && !trimmed.includes('/')) {
    return { type: 'user', id: trimmed };
  }
  
  // Username with @
  if (/^@[a-zA-Z0-9_.]{2,24}$/.test(trimmed)) {
    return { type: 'user', id: trimmed.substring(1) };
  }
  
  try {
    const urlObj = new URL(trimmed);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a TikTok domain
    if (!hostname.includes('tiktok.com') && !hostname.includes('vm.tiktok.com')) {
      return { type: null, id: null };
    }
    
    const pathname = urlObj.pathname;
    
    // Video URL patterns:
    // https://www.tiktok.com/@username/video/1234567890123456789
    // https://vm.tiktok.com/ZMxxxxxx/
    // https://www.tiktok.com/t/ZTxxxxxx/
    
    const videoMatch = pathname.match(/\/video\/(\d+)/);
    if (videoMatch) {
      return { type: 'video', id: videoMatch[1] };
    }
    
    // Short URL (vm.tiktok.com or /t/)
    if (hostname.includes('vm.tiktok.com') || pathname.startsWith('/t/')) {
      // For short URLs, we'd need to follow the redirect
      // For now, extract the short code
      const shortMatch = pathname.match(/\/([A-Za-z0-9]+)\/?$/);
      if (shortMatch) {
        return { type: 'video', id: `short_${shortMatch[1]}` };
      }
    }
    
    // User profile URL: https://www.tiktok.com/@username
    const userMatch = pathname.match(/^\/@([a-zA-Z0-9_.]+)/);
    if (userMatch) {
      return { type: 'user', id: userMatch[1] };
    }
    
    return { type: null, id: null };
  } catch {
    return { type: null, id: null };
  }
}

/**
 * Generate sample TikTok creator data
 */
export function generateSampleCreator(uniqueId: string): TikTokCreatorInfo {
  const creators: Record<string, Partial<TikTokCreatorInfo>> = {
    'techreviewer': {
      nickname: 'Tech Reviewer Pro',
      signature: '📱 Daily tech reviews & unboxings | 🎬 New videos every day',
      verified: true,
      followerCount: 2500000,
      followingCount: 150,
      heartCount: 45000000,
      videoCount: 850,
    },
    'productguru': {
      nickname: 'Product Guru',
      signature: '🛍️ Finding the best products so you don\'t have to | Amazon finds',
      verified: false,
      followerCount: 850000,
      followingCount: 320,
      heartCount: 12000000,
      videoCount: 420,
    },
    'lifehacker': {
      nickname: 'Life Hacks Daily',
      signature: '💡 Simple hacks for everyday life | DM for collabs',
      verified: true,
      followerCount: 5200000,
      followingCount: 89,
      heartCount: 98000000,
      videoCount: 1200,
    },
  };
  
  const preset = creators[uniqueId.toLowerCase()] || {};
  
  return {
    uniqueId,
    nickname: preset.nickname || `@${uniqueId}`,
    avatarUrl: `https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/${uniqueId}_avatar.jpeg`,
    signature: preset.signature || 'TikTok Creator',
    verified: preset.verified ?? Math.random() > 0.7,
    followerCount: preset.followerCount ?? Math.floor(Math.random() * 1000000) + 10000,
    followingCount: preset.followingCount ?? Math.floor(Math.random() * 500) + 50,
    heartCount: preset.heartCount ?? Math.floor(Math.random() * 10000000) + 100000,
    videoCount: preset.videoCount ?? Math.floor(Math.random() * 500) + 20,
  };
}

/**
 * Generate sample TikTok video data
 */
export function generateSampleVideo(videoId: string, creatorId?: string): TikTokVideoInfo {
  const hashtags = [
    ['fyp', 'viral', 'trending', 'foryou'],
    ['tech', 'review', 'unboxing', 'gadgets'],
    ['lifehack', 'tips', 'diy', 'howto'],
    ['amazon', 'finds', 'musthave', 'shopping'],
    ['product', 'recommendation', 'honest', 'review'],
  ];
  
  const descriptions = [
    'This product changed my life! 🔥 #fyp #viral',
    'Wait for it... the results are INSANE 😱 #trending',
    'POV: You finally found the perfect gadget #tech #review',
    'I can\'t believe this actually works! 💯 #lifehack',
    'Amazon find of the day - link in bio! #amazonfinds',
    'Honest review: Is it worth the hype? #honest #review',
    'Game changer alert! 🚨 You NEED this #musthave',
    'Testing viral products so you don\'t have to #viral',
  ];
  
  const music = [
    { id: 'sound1', title: 'original sound', author: creatorId || 'creator' },
    { id: 'sound2', title: 'Monkeys Spinning Monkeys', author: 'Kevin MacLeod' },
    { id: 'sound3', title: 'Oh No', author: 'Kreepa' },
    { id: 'sound4', title: 'Aesthetic', author: 'Tollan Kim' },
    { id: 'sound5', title: 'Sunny Day', author: 'Ted Fresco' },
  ];
  
  const selectedMusic = music[Math.floor(Math.random() * music.length)];
  const selectedHashtags = hashtags[Math.floor(Math.random() * hashtags.length)];
  const selectedDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  const creator = generateSampleCreator(creatorId || 'samplecreator');
  
  return {
    videoId,
    description: selectedDescription,
    coverUrl: `https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/${videoId}_cover.jpeg`,
    duration: Math.floor(Math.random() * 60) + 10, // 10-70 seconds
    playCount: Math.floor(Math.random() * 5000000) + 10000,
    diggCount: Math.floor(Math.random() * 500000) + 1000,
    shareCount: Math.floor(Math.random() * 50000) + 100,
    commentCount: Math.floor(Math.random() * 10000) + 50,
    collectCount: Math.floor(Math.random() * 100000) + 500,
    createTime: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Last 30 days
    musicId: selectedMusic.id,
    musicTitle: selectedMusic.title,
    musicAuthor: selectedMusic.author,
    hashtags: selectedHashtags,
    creator,
  };
}

/**
 * Generate sample TikTok comments
 */
export function generateSampleComments(videoId: string, count: number = 20): TikTokCommentInfo[] {
  const commentTemplates = [
    { text: 'OMG I need this! Where can I get it? 😍', sentiment: 'positive' },
    { text: 'This is amazing! Just ordered one 🛒', sentiment: 'positive' },
    { text: 'Been using this for a month, totally worth it! ✨', sentiment: 'positive' },
    { text: 'Finally someone honest about this product 👏', sentiment: 'positive' },
    { text: 'Link please!! 🙏', sentiment: 'neutral' },
    { text: 'Does this actually work or is it just hype?', sentiment: 'neutral' },
    { text: 'How much is it?', sentiment: 'neutral' },
    { text: 'Is this available in other colors?', sentiment: 'neutral' },
    { text: 'Mine broke after 2 weeks 😢', sentiment: 'negative' },
    { text: 'Not worth the money tbh', sentiment: 'negative' },
    { text: 'The quality is not as shown in the video', sentiment: 'negative' },
    { text: 'Shipping took forever 😤', sentiment: 'negative' },
    { text: 'Game changer! 🔥🔥🔥', sentiment: 'positive' },
    { text: 'Adding to cart right now!', sentiment: 'positive' },
    { text: 'Best purchase I\'ve made this year', sentiment: 'positive' },
    { text: 'Can you do a follow up video?', sentiment: 'neutral' },
    { text: 'Part 2 please! 🙌', sentiment: 'neutral' },
    { text: 'This showed up on my FYP at the perfect time', sentiment: 'positive' },
    { text: 'I\'ve been looking for something like this!', sentiment: 'positive' },
    { text: 'Saving this for later 📌', sentiment: 'neutral' },
  ];
  
  const usernames = [
    'user123', 'shopaholic_jane', 'tech_lover', 'review_queen', 'honest_buyer',
    'gadget_guy', 'smart_shopper', 'deal_finder', 'product_tester', 'curious_cat',
    'happy_customer', 'skeptical_sam', 'impulse_buyer', 'research_pro', 'trend_follower',
  ];
  
  const comments: TikTokCommentInfo[] = [];
  
  for (let i = 0; i < count; i++) {
    const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
    const username = usernames[Math.floor(Math.random() * usernames.length)] + Math.floor(Math.random() * 1000);
    
    comments.push({
      commentId: `comment_${videoId}_${i}_${Date.now()}`,
      videoId,
      authorUniqueId: username,
      authorNickname: username.replace('_', ' ').replace(/\d+$/, ''),
      authorAvatarUrl: `https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/${username}_avatar.jpeg`,
      text: template.text,
      diggCount: Math.floor(Math.random() * 5000),
      replyCount: Math.floor(Math.random() * 50),
      createTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Last 7 days
    });
  }
  
  // Sort by likes (most popular first)
  return comments.sort((a, b) => b.diggCount - a.diggCount);
}

/**
 * Analyze sentiment of TikTok comments
 */
export function analyzeTikTokSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'; score: number } {
  const positiveWords = ['love', 'amazing', 'best', 'great', 'perfect', 'awesome', 'need', 'want', 'ordered', 'worth', 'game changer', '🔥', '😍', '✨', '👏', '💯', '🙌'];
  const negativeWords = ['broke', 'bad', 'worst', 'terrible', 'waste', 'scam', 'fake', 'disappointed', 'not worth', '😢', '😤', '👎'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  
  if (total === 0) {
    return { sentiment: 'neutral', score: 0.5 };
  }
  
  const score = positiveCount / total;
  
  if (positiveCount > 0 && negativeCount > 0) {
    return { sentiment: 'mixed', score };
  } else if (positiveCount > negativeCount) {
    return { sentiment: 'positive', score };
  } else if (negativeCount > positiveCount) {
    return { sentiment: 'negative', score: 1 - score };
  }
  
  return { sentiment: 'neutral', score: 0.5 };
}

/**
 * Get trending hashtags from videos
 */
export function extractTrendingHashtags(videos: TikTokVideoInfo[]): { hashtag: string; count: number; totalViews: number }[] {
  const hashtagStats: Record<string, { count: number; totalViews: number }> = {};
  
  videos.forEach(video => {
    video.hashtags.forEach(tag => {
      if (!hashtagStats[tag]) {
        hashtagStats[tag] = { count: 0, totalViews: 0 };
      }
      hashtagStats[tag].count++;
      hashtagStats[tag].totalViews += video.playCount;
    });
  });
  
  return Object.entries(hashtagStats)
    .map(([hashtag, stats]) => ({ hashtag, ...stats }))
    .sort((a, b) => b.totalViews - a.totalViews);
}
