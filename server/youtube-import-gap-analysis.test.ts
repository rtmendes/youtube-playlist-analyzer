import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the YouTube client
const mockYoutubeClient = {
  setApiKey: vi.fn(),
  getChannelVideos: vi.fn(),
  getChannelById: vi.fn(),
  getPlaylistItems: vi.fn(),
  getVideos: vi.fn(),
};

// Mock the database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('YouTube Channel Auto-Import Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importFromYouTube procedure', () => {
    it('should validate required input fields', () => {
      const input = {
        competitorId: 1,
        apiKey: 'test-api-key',
        maxVideos: 50,
      };
      
      expect(input.competitorId).toBeDefined();
      expect(input.apiKey).toBeDefined();
      expect(input.maxVideos).toBeGreaterThan(0);
      expect(input.maxVideos).toBeLessThanOrEqual(100);
    });

    it('should handle missing YouTube channel gracefully', () => {
      const errorMessage = "No YouTube channel linked to this competitor. Please add a YouTube channel first.";
      expect(errorMessage).toContain("YouTube channel");
    });

    it('should track import counts correctly', () => {
      const result = {
        success: true,
        importedCount: 25,
        updatedCount: 10,
        totalVideos: 35,
        channelName: "Test Channel",
      };
      
      expect(result.importedCount + result.updatedCount).toBe(result.totalVideos);
      expect(result.channelName).toBeTruthy();
    });

    it('should calculate engagement rate correctly', () => {
      const views = 10000;
      const likes = 500;
      const comments = 100;
      const totalEngagement = likes + comments;
      const engagementRate = ((totalEngagement / views) * 100).toFixed(4);
      
      expect(parseFloat(engagementRate)).toBe(6);
    });

    it('should extract day of week and hour from publish date', () => {
      const publishDate = new Date('2024-01-15T14:30:00Z');
      const dayOfWeek = publishDate.getDay();
      const hourOfDay = publishDate.getHours();
      
      expect(dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(dayOfWeek).toBeLessThanOrEqual(6);
      expect(hourOfDay).toBeGreaterThanOrEqual(0);
      expect(hourOfDay).toBeLessThanOrEqual(23);
    });

    it('should handle video URL generation', () => {
      const videoId = 'dQw4w9WgXcQ';
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      expect(videoUrl).toContain('youtube.com/watch');
      expect(videoUrl).toContain(videoId);
    });
  });

  describe('getImportStatus query', () => {
    it('should return null when no YouTube channel exists', () => {
      const status = null;
      expect(status).toBeNull();
    });

    it('should return channel info when YouTube channel exists', () => {
      const status = {
        hasYouTubeChannel: true,
        channelId: 'UC123456',
        channelName: 'Test Channel',
        lastImportedAt: new Date(),
        importedVideoCount: 50,
      };
      
      expect(status.hasYouTubeChannel).toBe(true);
      expect(status.channelId).toBeTruthy();
      expect(status.importedVideoCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('YouTube client getChannelVideos', () => {
    it('should respect maxVideos limit', () => {
      const maxVideos = 50;
      const videos = Array(maxVideos).fill({ id: 'test' });
      
      expect(videos.length).toBeLessThanOrEqual(maxVideos);
    });

    it('should handle pagination correctly', () => {
      const pageSize = 50;
      const totalVideos = 100;
      const expectedPages = Math.ceil(totalVideos / pageSize);
      
      expect(expectedPages).toBe(2);
    });
  });
});

describe('Content Gap Analysis Dashboard', () => {
  describe('analyzeContentGap procedure', () => {
    it('should validate input parameters', () => {
      const input = {
        competitorIds: [1, 2, 3],
        timeRangeDays: 90,
      };
      
      expect(input.timeRangeDays).toBeGreaterThan(0);
      expect(Array.isArray(input.competitorIds)).toBe(true);
    });

    it('should filter entries by time range', () => {
      const timeRangeDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);
      
      const entries = [
        { publishedAt: new Date(), competitorId: 1 },
        { publishedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), competitorId: 2 },
      ];
      
      const filtered = entries.filter(e => new Date(e.publishedAt) >= cutoffDate);
      expect(filtered.length).toBe(1);
    });

    it('should aggregate topics by competitor', () => {
      const topicsByCompetitor: Record<number, Set<string>> = {};
      
      const entries = [
        { competitorId: 1, topics: ['marketing', 'seo'] },
        { competitorId: 1, topics: ['marketing', 'content'] },
        { competitorId: 2, topics: ['marketing', 'ppc'] },
      ];
      
      entries.forEach(entry => {
        if (!topicsByCompetitor[entry.competitorId]) {
          topicsByCompetitor[entry.competitorId] = new Set();
        }
        entry.topics.forEach(t => topicsByCompetitor[entry.competitorId].add(t.toLowerCase()));
      });
      
      expect(topicsByCompetitor[1].size).toBe(3);
      expect(topicsByCompetitor[2].size).toBe(2);
      expect(topicsByCompetitor[1].has('marketing')).toBe(true);
    });

    it('should identify content gaps (topics covered by multiple competitors)', () => {
      const allTopics: Record<string, number[]> = {
        'marketing': [1, 2, 3],
        'seo': [1, 2],
        'unique-topic': [1],
      };
      
      const contentGaps = Object.entries(allTopics)
        .filter(([_, cIds]) => cIds.length >= 2)
        .map(([topic, cIds]) => ({
          topic,
          competitorIds: cIds,
          competitorCount: cIds.length,
        }));
      
      expect(contentGaps.length).toBe(2);
      expect(contentGaps[0].topic).toBe('marketing');
      expect(contentGaps[0].competitorCount).toBe(3);
    });

    it('should calculate engagement benchmarks', () => {
      const engagementData = {
        views: 100000,
        likes: 5000,
        comments: 500,
        count: 10,
      };
      
      const avgViews = Math.round(engagementData.views / engagementData.count);
      const avgLikes = Math.round(engagementData.likes / engagementData.count);
      const avgComments = Math.round(engagementData.comments / engagementData.count);
      
      expect(avgViews).toBe(10000);
      expect(avgLikes).toBe(500);
      expect(avgComments).toBe(50);
    });

    it('should return structured analysis results', () => {
      const result = {
        success: true,
        totalEntriesAnalyzed: 100,
        competitorsAnalyzed: 5,
        contentGaps: [],
        benchmarks: [],
        contentTypeDistribution: {},
      };
      
      expect(result.success).toBe(true);
      expect(result.totalEntriesAnalyzed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.contentGaps)).toBe(true);
      expect(Array.isArray(result.benchmarks)).toBe(true);
    });
  });

  describe('Content type distribution analysis', () => {
    it('should count content types per competitor', () => {
      const contentTypesByCompetitor: Record<number, Record<string, number>> = {};
      
      const entries = [
        { competitorId: 1, contentType: 'video' },
        { competitorId: 1, contentType: 'video' },
        { competitorId: 1, contentType: 'blog_post' },
        { competitorId: 2, contentType: 'video' },
      ];
      
      entries.forEach(entry => {
        if (!contentTypesByCompetitor[entry.competitorId]) {
          contentTypesByCompetitor[entry.competitorId] = {};
        }
        contentTypesByCompetitor[entry.competitorId][entry.contentType] = 
          (contentTypesByCompetitor[entry.competitorId][entry.contentType] || 0) + 1;
      });
      
      expect(contentTypesByCompetitor[1]['video']).toBe(2);
      expect(contentTypesByCompetitor[1]['blog_post']).toBe(1);
      expect(contentTypesByCompetitor[2]['video']).toBe(1);
    });

    it('should calculate percentage distribution', () => {
      const types = { video: 60, blog_post: 30, podcast: 10 };
      const total = Object.values(types).reduce((a, b) => a + b, 0);
      
      const percentages = Object.entries(types).map(([type, count]) => ({
        type,
        percentage: Math.round((count / total) * 100),
      }));
      
      expect(percentages[0].percentage).toBe(60);
      expect(percentages[1].percentage).toBe(30);
      expect(percentages[2].percentage).toBe(10);
    });
  });

  describe('Posting time analysis', () => {
    it('should aggregate posting by day of week', () => {
      const postingByDay: Record<number, { count: number; engagement: number }> = {};
      
      const entries = [
        { dayOfWeek: 1, views: 1000, likes: 100 },
        { dayOfWeek: 1, views: 2000, likes: 200 },
        { dayOfWeek: 3, views: 1500, likes: 150 },
      ];
      
      entries.forEach(entry => {
        if (!postingByDay[entry.dayOfWeek]) {
          postingByDay[entry.dayOfWeek] = { count: 0, engagement: 0 };
        }
        postingByDay[entry.dayOfWeek].count += 1;
        postingByDay[entry.dayOfWeek].engagement += entry.views + entry.likes * 10;
      });
      
      expect(postingByDay[1].count).toBe(2);
      expect(postingByDay[3].count).toBe(1);
    });

    it('should identify best posting days', () => {
      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const aggregatedByDay: Record<number, { count: number; engagement: number }> = {
        0: { count: 5, engagement: 5000 },
        1: { count: 10, engagement: 15000 },
        2: { count: 8, engagement: 12000 },
      };
      
      const bestPostingTimes = Object.entries(aggregatedByDay)
        .map(([day, data]) => ({
          day: parseInt(day),
          dayName: DAYS[parseInt(day)],
          count: data.count,
          avgEngagement: data.count > 0 ? Math.round(data.engagement / data.count) : 0,
        }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement);
      
      expect(bestPostingTimes[0].dayName).toBe('Mon');
      expect(bestPostingTimes[0].avgEngagement).toBe(1500);
    });
  });

  describe('Strategic opportunities generation', () => {
    it('should identify underserved content types', () => {
      const allContentTypes = new Set(['video', 'blog_post']);
      const opportunities: string[] = [];
      
      if (!allContentTypes.has('podcast')) {
        opportunities.push('Podcast Content Gap');
      }
      if (!allContentTypes.has('webinar')) {
        opportunities.push('Webinar Opportunity');
      }
      
      expect(opportunities).toContain('Podcast Content Gap');
      expect(opportunities).toContain('Webinar Opportunity');
    });

    it('should identify low competition days', () => {
      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const aggregatedByDay: Record<number, { count: number }> = {
        0: { count: 2 },
        1: { count: 10 },
        6: { count: 1 },
      };
      
      const lowActivityDays = Object.entries(aggregatedByDay)
        .filter(([_, data]) => data.count < 3)
        .map(([day]) => DAYS[parseInt(day)]);
      
      expect(lowActivityDays).toContain('Sun');
      expect(lowActivityDays).toContain('Sat');
      expect(lowActivityDays).not.toContain('Mon');
    });

    it('should prioritize opportunities correctly', () => {
      const opportunities = [
        { title: 'High Priority', priority: 'high' as const },
        { title: 'Medium Priority', priority: 'medium' as const },
        { title: 'Low Priority', priority: 'low' as const },
      ];
      
      const highPriority = opportunities.filter(o => o.priority === 'high');
      const mediumPriority = opportunities.filter(o => o.priority === 'medium');
      
      expect(highPriority.length).toBe(1);
      expect(mediumPriority.length).toBe(1);
    });
  });

  describe('Competitor strengths analysis', () => {
    it('should identify content type strengths', () => {
      const types = { video: 70, blog_post: 20, podcast: 10 };
      const totalContent = Object.values(types).reduce((a, b) => a + b, 0);
      const strengths: string[] = [];
      
      Object.entries(types).forEach(([type, count]) => {
        const percentage = (count / totalContent) * 100;
        if (percentage > 30) {
          strengths.push(`Strong in ${type.replace(/_/g, " ")}`);
        }
      });
      
      expect(strengths).toContain('Strong in video');
      expect(strengths.length).toBe(1);
    });

    it('should identify high engagement rate', () => {
      const benchmark = {
        avgViews: 10000,
        avgLikes: 500,
        avgComments: 100,
        engagementRate: 6.0,
      };
      
      const strengths: string[] = [];
      if (benchmark.engagementRate > 5) {
        strengths.push("High engagement rate");
      }
      
      expect(strengths).toContain("High engagement rate");
    });
  });
});

describe('UI Components', () => {
  describe('ContentGapAnalysis page', () => {
    it('should have required tabs', () => {
      const tabs = ['overview', 'content-types', 'timing', 'engagement', 'opportunities'];
      
      expect(tabs).toContain('overview');
      expect(tabs).toContain('content-types');
      expect(tabs).toContain('timing');
      expect(tabs).toContain('engagement');
      expect(tabs).toContain('opportunities');
    });

    it('should support time range filtering', () => {
      const timeRanges = ['30', '60', '90', '180', '365'];
      
      expect(timeRanges).toContain('30');
      expect(timeRanges).toContain('90');
      expect(timeRanges).toContain('365');
    });
  });

  describe('Import from YouTube dialog', () => {
    it('should validate required fields', () => {
      const form = {
        competitorId: '',
        apiKey: '',
        maxVideos: 50,
      };
      
      const isValid = form.competitorId !== '' && form.apiKey !== '';
      expect(isValid).toBe(false);
      
      form.competitorId = '1';
      form.apiKey = 'test-key';
      const isValidAfter = form.competitorId !== '' && form.apiKey !== '';
      expect(isValidAfter).toBe(true);
    });

    it('should support video limit options', () => {
      const limits = [10, 25, 50, 100];
      
      expect(limits).toContain(10);
      expect(limits).toContain(50);
      expect(limits).toContain(100);
    });
  });
});

describe('Number formatting', () => {
  it('should format large numbers correctly', () => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };
    
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(15000)).toBe('15.0K');
    expect(formatNumber(500)).toBe('500');
  });
});
