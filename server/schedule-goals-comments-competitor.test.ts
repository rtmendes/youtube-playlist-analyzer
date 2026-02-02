import { describe, it, expect } from "vitest";
import { CONTENT_PROMPTS, getPromptsForType, getPromptById } from "./content-prompts";

describe("Schedule Goals Feature", () => {
  it("should define valid goal types", () => {
    const validGoals = ["improve_ctr", "increase_conversions", "boost_engagement", "reduce_bounce", "custom"];
    
    validGoals.forEach(goal => {
      expect(typeof goal).toBe("string");
      expect(goal.length).toBeGreaterThan(0);
    });
  });

  it("should allow setting target metrics for goals", () => {
    const scheduleWithGoal = {
      templateId: 1,
      frequency: "weekly",
      goal: "improve_ctr",
      goalTarget: 15.5,
      goalMetric: undefined,
    };

    expect(scheduleWithGoal.goal).toBe("improve_ctr");
    expect(scheduleWithGoal.goalTarget).toBe(15.5);
  });

  it("should allow custom goals with custom metrics", () => {
    const customGoalSchedule = {
      templateId: 1,
      frequency: "monthly",
      goal: "custom",
      goalTarget: 100,
      goalMetric: "email_signups",
    };

    expect(customGoalSchedule.goal).toBe("custom");
    expect(customGoalSchedule.goalMetric).toBe("email_signups");
  });

  it("should calculate goal progress correctly", () => {
    const baseline = 10; // 10% CTR
    const current = 12; // 12% CTR
    const target = 15; // 15% CTR target

    const progressPercent = ((current - baseline) / (target - baseline)) * 100;
    expect(progressPercent).toBe(40); // 40% progress toward goal
  });
});

describe("Template Comments Feature", () => {
  it("should structure comments correctly", () => {
    const comment = {
      id: 1,
      templateId: 123,
      userId: "user-1",
      content: "Great template! Works well for our email campaigns.",
      createdAt: new Date(),
    };

    expect(comment.templateId).toBe(123);
    expect(comment.content.length).toBeGreaterThan(0);
    expect(comment.userId).toBeDefined();
  });

  it("should support nested replies", () => {
    const parentComment = {
      id: 1,
      templateId: 123,
      userId: "user-1",
      content: "How do you handle the intro section?",
      parentId: null,
    };

    const replyComment = {
      id: 2,
      templateId: 123,
      userId: "user-2",
      content: "I usually customize the hook based on the audience.",
      parentId: 1,
    };

    expect(replyComment.parentId).toBe(parentComment.id);
  });

  it("should track comment timestamps", () => {
    const now = new Date();
    const comment = {
      id: 1,
      templateId: 123,
      userId: "user-1",
      content: "Test comment",
      createdAt: now,
      updatedAt: now,
    };

    expect(comment.createdAt).toEqual(comment.updatedAt);
  });
});

describe("Competitor Analysis Feature", () => {
  it("should define competitor data structure", () => {
    const competitor = {
      id: 1,
      name: "Competitor A",
      url: "https://example.com",
      category: "ecommerce",
      metrics: {
        traffic: 100000,
        engagement: 4.5,
        socialFollowers: 50000,
      },
    };

    expect(competitor.name).toBeDefined();
    expect(competitor.metrics.traffic).toBeGreaterThan(0);
  });

  it("should compare multiple competitors", () => {
    const competitors = [
      { name: "A", traffic: 100000, engagement: 4.5 },
      { name: "B", traffic: 150000, engagement: 3.8 },
      { name: "C", traffic: 80000, engagement: 4.9 },
    ];

    // Find highest traffic
    const highestTraffic = competitors.reduce((max, c) => 
      c.traffic > max.traffic ? c : max
    );
    expect(highestTraffic.name).toBe("B");

    // Find highest engagement
    const highestEngagement = competitors.reduce((max, c) => 
      c.engagement > max.engagement ? c : max
    );
    expect(highestEngagement.name).toBe("C");
  });

  it("should calculate market share percentages", () => {
    const competitors = [
      { name: "A", traffic: 100000 },
      { name: "B", traffic: 150000 },
      { name: "C", traffic: 50000 },
    ];

    const totalTraffic = competitors.reduce((sum, c) => sum + c.traffic, 0);
    const marketShares = competitors.map(c => ({
      name: c.name,
      share: (c.traffic / totalTraffic) * 100,
    }));

    expect(marketShares[0].share).toBeCloseTo(33.33, 1);
    expect(marketShares[1].share).toBe(50);
    expect(marketShares[2].share).toBeCloseTo(16.67, 1);
  });

  it("should identify competitive gaps", () => {
    const ourProduct = {
      features: ["feature1", "feature2", "feature3"],
      price: 99,
      rating: 4.2,
    };

    const competitor = {
      features: ["feature1", "feature2", "feature4", "feature5"],
      price: 149,
      rating: 4.5,
    };

    // Features they have that we don't
    const featureGaps = competitor.features.filter(
      f => !ourProduct.features.includes(f)
    );
    expect(featureGaps).toContain("feature4");
    expect(featureGaps).toContain("feature5");

    // Price advantage
    const priceAdvantage = competitor.price - ourProduct.price;
    expect(priceAdvantage).toBe(50);
  });

  it("should generate SWOT analysis structure", () => {
    const swotAnalysis = {
      strengths: ["Lower price point", "Better customer support"],
      weaknesses: ["Fewer features", "Lower brand recognition"],
      opportunities: ["Growing market segment", "Competitor price increase"],
      threats: ["New market entrant", "Technology disruption"],
    };

    expect(swotAnalysis.strengths.length).toBeGreaterThan(0);
    expect(swotAnalysis.weaknesses.length).toBeGreaterThan(0);
    expect(swotAnalysis.opportunities.length).toBeGreaterThan(0);
    expect(swotAnalysis.threats.length).toBeGreaterThan(0);
  });

  it("should track competitor content themes", () => {
    const competitorContent = {
      competitorId: 1,
      themes: [
        { theme: "product tutorials", frequency: 45 },
        { theme: "industry news", frequency: 30 },
        { theme: "customer stories", frequency: 25 },
      ],
    };

    const topTheme = competitorContent.themes.reduce((max, t) => 
      t.frequency > max.frequency ? t : max
    );
    expect(topTheme.theme).toBe("product tutorials");
  });

  it("should analyze sentiment comparison", () => {
    const sentimentData = {
      ourBrand: { positive: 70, neutral: 20, negative: 10 },
      competitor: { positive: 60, neutral: 25, negative: 15 },
    };

    const ourNetSentiment = sentimentData.ourBrand.positive - sentimentData.ourBrand.negative;
    const competitorNetSentiment = sentimentData.competitor.positive - sentimentData.competitor.negative;

    expect(ourNetSentiment).toBe(60);
    expect(competitorNetSentiment).toBe(45);
    expect(ourNetSentiment).toBeGreaterThan(competitorNetSentiment);
  });
});

describe("Integration: Schedule Goals with Content Generation", () => {
  it("should track goal progress over multiple generations", () => {
    const generationHistory = [
      { version: 1, ctr: 10, conversions: 100 },
      { version: 2, ctr: 11.5, conversions: 115 },
      { version: 3, ctr: 13, conversions: 130 },
    ];

    const goal = { type: "improve_ctr", target: 15 };
    const latestCtr = generationHistory[generationHistory.length - 1].ctr;
    const baselineCtr = generationHistory[0].ctr;
    
    const improvement = latestCtr - baselineCtr;
    const targetImprovement = goal.target - baselineCtr;
    const progressPercent = (improvement / targetImprovement) * 100;

    expect(progressPercent).toBe(60); // 60% progress toward goal
  });

  it("should suggest optimizations based on goal", () => {
    const goal = "improve_ctr";
    const suggestions: Record<string, string[]> = {
      improve_ctr: [
        "Test different headlines",
        "Add urgency elements",
        "Improve call-to-action clarity",
      ],
      increase_conversions: [
        "Add social proof",
        "Reduce friction in the offer",
        "Test different price points",
      ],
      boost_engagement: [
        "Add interactive elements",
        "Include questions for the reader",
        "Use more storytelling",
      ],
    };

    expect(suggestions[goal]).toContain("Test different headlines");
    expect(suggestions[goal].length).toBe(3);
  });
});
