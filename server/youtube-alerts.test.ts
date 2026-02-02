import { describe, it, expect } from "vitest";

describe("YouTube Channel Comparison Feature", () => {
  describe("Channel Data Structure", () => {
    it("should define valid channel metrics", () => {
      const channelMetrics = {
        channelId: "UCxxxxxxxx",
        channelName: "Test Channel",
        subscriberCount: 100000,
        videoCount: 500,
        viewCount: 10000000,
        avgViews: 20000,
        engagementRate: 2.5,
        postingFrequency: "1-3 per week",
      };

      expect(channelMetrics.channelId).toBeDefined();
      expect(channelMetrics.subscriberCount).toBeGreaterThan(0);
      expect(channelMetrics.engagementRate).toBeGreaterThan(0);
    });

    it("should calculate engagement rate correctly", () => {
      const subscriberCount = 100000;
      const avgViews = 5000;
      const engagementRate = (avgViews / subscriberCount) * 100;
      
      expect(engagementRate).toBe(5);
    });

    it("should determine posting frequency based on videos per year", () => {
      const getPostingFrequency = (videosPerYear: number) => {
        if (videosPerYear > 365) return "Daily+";
        if (videosPerYear > 156) return "3-4 per week";
        if (videosPerYear > 52) return "1-3 per week";
        if (videosPerYear > 12) return "1-4 per month";
        return "Less than monthly";
      };

      expect(getPostingFrequency(400)).toBe("Daily+");
      expect(getPostingFrequency(200)).toBe("3-4 per week");
      expect(getPostingFrequency(100)).toBe("1-3 per week");
      expect(getPostingFrequency(24)).toBe("1-4 per month");
      expect(getPostingFrequency(6)).toBe("Less than monthly");
    });
  });

  describe("Channel Comparison Logic", () => {
    it("should compare multiple channels and determine winner", () => {
      const channels = [
        { id: 1, name: "Channel A", subscribers: 100000, engagement: 3.5 },
        { id: 2, name: "Channel B", subscribers: 200000, engagement: 2.0 },
        { id: 3, name: "Channel C", subscribers: 50000, engagement: 5.0 },
      ];

      // Winner by subscribers
      const winnerBySubscribers = channels.reduce((prev, curr) => 
        curr.subscribers > prev.subscribers ? curr : prev
      );
      expect(winnerBySubscribers.name).toBe("Channel B");

      // Winner by engagement
      const winnerByEngagement = channels.reduce((prev, curr) => 
        curr.engagement > prev.engagement ? curr : prev
      );
      expect(winnerByEngagement.name).toBe("Channel C");
    });

    it("should identify opportunities and threats", () => {
      const analyzeCompetition = (channels: any[]) => {
        const opportunities: string[] = [];
        const threats: string[] = [];

        const avgEngagement = channels.reduce((sum, c) => sum + c.engagement, 0) / channels.length;
        const avgSubscribers = channels.reduce((sum, c) => sum + c.subscribers, 0) / channels.length;

        channels.forEach(channel => {
          if (channel.engagement < avgEngagement) {
            opportunities.push(`${channel.name} has below-average engagement - opportunity to capture their audience`);
          }
          if (channel.subscribers > avgSubscribers * 2) {
            threats.push(`${channel.name} has dominant market share`);
          }
        });

        return { opportunities, threats };
      };

      const channels = [
        { name: "Channel A", subscribers: 500000, engagement: 1.5 },
        { name: "Channel B", subscribers: 100000, engagement: 4.0 },
        { name: "Channel C", subscribers: 100000, engagement: 3.0 },
      ];

      const analysis = analyzeCompetition(channels);
      expect(analysis.opportunities.length).toBeGreaterThan(0);
      expect(analysis.threats.length).toBeGreaterThan(0);
    });
  });
});

describe("Competitor Alerts Feature", () => {
  describe("Alert Types", () => {
    it("should define valid alert types", () => {
      const validAlertTypes = [
        "new_content",
        "review_change",
        "rating_change",
        "price_change",
        "subscriber_milestone",
        "engagement_spike",
        "sentiment_shift",
        "keyword_mention",
        "custom",
      ];

      expect(validAlertTypes).toContain("new_content");
      expect(validAlertTypes).toContain("subscriber_milestone");
      expect(validAlertTypes).toContain("keyword_mention");
    });

    it("should validate alert configuration", () => {
      const alertConfig = {
        name: "New Video Alert",
        alertType: "new_content",
        competitorId: 1,
        frequency: "daily",
        isEnabled: true,
      };

      expect(alertConfig.name).toBeDefined();
      expect(alertConfig.alertType).toBe("new_content");
      expect(alertConfig.frequency).toBe("daily");
    });
  });

  describe("Alert Threshold Logic", () => {
    it("should check percentage threshold correctly", () => {
      const checkPercentageThreshold = (
        oldValue: number,
        newValue: number,
        threshold: number
      ) => {
        const percentChange = ((newValue - oldValue) / oldValue) * 100;
        return Math.abs(percentChange) >= threshold;
      };

      // 10% increase
      expect(checkPercentageThreshold(100, 110, 10)).toBe(true);
      expect(checkPercentageThreshold(100, 105, 10)).toBe(false);
      
      // 20% decrease
      expect(checkPercentageThreshold(100, 80, 20)).toBe(true);
      expect(checkPercentageThreshold(100, 85, 20)).toBe(false);
    });

    it("should check absolute threshold correctly", () => {
      const checkAbsoluteThreshold = (
        oldValue: number,
        newValue: number,
        threshold: number
      ) => {
        return Math.abs(newValue - oldValue) >= threshold;
      };

      expect(checkAbsoluteThreshold(100, 150, 50)).toBe(true);
      expect(checkAbsoluteThreshold(100, 130, 50)).toBe(false);
    });
  });

  describe("Keyword Mention Detection", () => {
    it("should detect keyword mentions in content", () => {
      const detectKeywords = (content: string, keywords: string[]) => {
        const lowerContent = content.toLowerCase();
        return keywords.filter(keyword => 
          lowerContent.includes(keyword.toLowerCase())
        );
      };

      const content = "Check out our new product launch with amazing features and discount pricing!";
      const keywords = ["product launch", "discount", "sale", "new feature"];

      const matches = detectKeywords(content, keywords);
      expect(matches).toContain("product launch");
      expect(matches).toContain("discount");
      expect(matches).not.toContain("sale");
    });
  });

  describe("Alert History", () => {
    it("should create alert history entry", () => {
      const createAlertHistory = (alert: any, message: string) => {
        return {
          alertId: alert.id,
          alertType: alert.alertType,
          title: `Alert: ${alert.name}`,
          message,
          triggeredAt: new Date(),
          isRead: false,
        };
      };

      const alert = {
        id: 1,
        name: "New Video Alert",
        alertType: "new_content",
      };

      const history = createAlertHistory(alert, "Competitor published a new video");
      expect(history.alertId).toBe(1);
      expect(history.isRead).toBe(false);
      expect(history.triggeredAt).toBeDefined();
    });
  });

  describe("Alert Frequency", () => {
    it("should validate alert frequencies", () => {
      const validFrequencies = ["realtime", "daily", "weekly"];
      
      expect(validFrequencies).toContain("realtime");
      expect(validFrequencies).toContain("daily");
      expect(validFrequencies).toContain("weekly");
    });

    it("should determine if alert should run based on frequency", () => {
      const shouldRunAlert = (
        frequency: string,
        lastCheckedAt: Date | null,
        now: Date
      ) => {
        if (!lastCheckedAt) return true;
        
        const hoursSinceLastCheck = (now.getTime() - lastCheckedAt.getTime()) / (1000 * 60 * 60);
        
        switch (frequency) {
          case "realtime":
            return hoursSinceLastCheck >= 1;
          case "daily":
            return hoursSinceLastCheck >= 24;
          case "weekly":
            return hoursSinceLastCheck >= 168;
          default:
            return false;
        }
      };

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      expect(shouldRunAlert("realtime", twoHoursAgo, now)).toBe(true);
      expect(shouldRunAlert("daily", twoHoursAgo, now)).toBe(false);
      expect(shouldRunAlert("daily", twoDaysAgo, now)).toBe(true);
      expect(shouldRunAlert("weekly", twoDaysAgo, now)).toBe(false);
    });
  });
});

describe("Format Helpers", () => {
  it("should format large numbers correctly", () => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    expect(formatNumber(1500000)).toBe("1.5M");
    expect(formatNumber(250000)).toBe("250.0K");
    expect(formatNumber(500)).toBe("500");
  });

  it("should get alert type labels", () => {
    const getAlertTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        new_content: "New Content",
        review_change: "Review Changes",
        rating_change: "Rating Changes",
        price_change: "Price Changes",
        subscriber_milestone: "Subscriber Milestone",
        engagement_spike: "Engagement Spike",
        sentiment_shift: "Sentiment Shift",
        keyword_mention: "Keyword Mention",
        custom: "Custom",
      };
      return labels[type] || type;
    };

    expect(getAlertTypeLabel("new_content")).toBe("New Content");
    expect(getAlertTypeLabel("subscriber_milestone")).toBe("Subscriber Milestone");
    expect(getAlertTypeLabel("unknown")).toBe("unknown");
  });
});
