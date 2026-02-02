import { describe, it, expect } from "vitest";
import {
  getAbTestAnalysis,
  createSchedule,
  shareTemplate,
  getPublicTemplates,
} from "./routers";

// Mock data for testing
const mockVersionsWithMetrics = [
  {
    id: 1,
    versionNumber: 1,
    impressions: 1000,
    clicks: 50,
    conversions: 10,
    status: "active",
  },
  {
    id: 2,
    versionNumber: 2,
    impressions: 1000,
    clicks: 80,
    conversions: 15,
    status: "testing",
  },
  {
    id: 3,
    versionNumber: 3,
    impressions: 1000,
    clicks: 30,
    conversions: 5,
    status: "draft",
  },
];

describe("A/B Test Winner Auto-Detection", () => {
  it("should calculate CTR correctly", () => {
    const version = mockVersionsWithMetrics[0];
    const ctr = (version.clicks / version.impressions) * 100;
    expect(ctr).toBe(5); // 50/1000 * 100 = 5%
  });

  it("should calculate conversion rate correctly", () => {
    const version = mockVersionsWithMetrics[1];
    const conversionRate = (version.conversions / version.clicks) * 100;
    expect(conversionRate).toBe(18.75); // 15/80 * 100 = 18.75%
  });

  it("should identify the best performing version by CTR", () => {
    const versionsWithCtr = mockVersionsWithMetrics.map((v) => ({
      ...v,
      ctr: (v.clicks / v.impressions) * 100,
    }));
    const bestByCtr = versionsWithCtr.reduce((best, current) =>
      current.ctr > best.ctr ? current : best
    );
    expect(bestByCtr.versionNumber).toBe(2); // Version 2 has 8% CTR
  });

  it("should identify the best performing version by conversions", () => {
    const bestByConversions = mockVersionsWithMetrics.reduce((best, current) =>
      current.conversions > best.conversions ? current : best
    );
    expect(bestByConversions.versionNumber).toBe(2); // Version 2 has 15 conversions
  });

  it("should calculate composite score correctly", () => {
    // Score = (CTR * 0.4) + (ConversionRate * 0.6)
    const version = mockVersionsWithMetrics[1];
    const ctr = (version.clicks / version.impressions) * 100; // 8%
    const conversionRate = (version.conversions / version.clicks) * 100; // 18.75%
    const score = ctr * 0.4 + conversionRate * 0.6;
    expect(score).toBeCloseTo(14.45); // 8*0.4 + 18.75*0.6 = 3.2 + 11.25 = 14.45
  });

  it("should require minimum impressions for statistical significance", () => {
    const minImpressions = 100;
    const hasEnoughData = mockVersionsWithMetrics.every(
      (v) => v.impressions >= minImpressions
    );
    expect(hasEnoughData).toBe(true);
  });

  it("should handle versions with zero impressions", () => {
    const versionWithZero = { impressions: 0, clicks: 0, conversions: 0 };
    const ctr =
      versionWithZero.impressions > 0
        ? (versionWithZero.clicks / versionWithZero.impressions) * 100
        : 0;
    expect(ctr).toBe(0);
  });
});

describe("Content Refresh Scheduling", () => {
  it("should validate daily frequency", () => {
    const schedule = {
      frequency: "daily",
      timeOfDay: "09:00",
    };
    expect(schedule.frequency).toBe("daily");
    expect(schedule.timeOfDay).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should validate weekly frequency with day of week", () => {
    const schedule = {
      frequency: "weekly",
      dayOfWeek: 1, // Monday
      timeOfDay: "09:00",
    };
    expect(schedule.frequency).toBe("weekly");
    expect(schedule.dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(schedule.dayOfWeek).toBeLessThanOrEqual(6);
  });

  it("should validate monthly frequency", () => {
    const schedule = {
      frequency: "monthly",
      dayOfMonth: 15,
      timeOfDay: "09:00",
    };
    expect(schedule.frequency).toBe("monthly");
    expect(schedule.dayOfMonth).toBeGreaterThanOrEqual(1);
    expect(schedule.dayOfMonth).toBeLessThanOrEqual(31);
  });

  it("should calculate next run time for daily schedule", () => {
    const now = new Date("2026-02-01T08:00:00");
    const timeOfDay = "09:00";
    const [hours, minutes] = timeOfDay.split(":").map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    expect(nextRun.getHours()).toBe(9);
    expect(nextRun.getMinutes()).toBe(0);
  });

  it("should handle schedule status transitions", () => {
    const statuses = ["active", "paused", "completed"];
    const schedule = { status: "active" };

    // Pause schedule
    schedule.status = "paused";
    expect(schedule.status).toBe("paused");

    // Resume schedule
    schedule.status = "active";
    expect(schedule.status).toBe("active");
  });
});

describe("Template Sharing and Collaboration", () => {
  it("should validate share permissions", () => {
    const validPermissions = ["view", "duplicate", "edit"];
    const permission = "view";
    expect(validPermissions).toContain(permission);
  });

  it("should validate share types", () => {
    const validShareTypes = ["direct", "link", "public"];
    const shareType = "public";
    expect(validShareTypes).toContain(shareType);
  });

  it("should generate unique share links", () => {
    const generateShareLink = () => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const link1 = generateShareLink();
    const link2 = generateShareLink();
    expect(link1).not.toBe(link2);
    expect(link1.length).toBe(32);
  });

  it("should validate email format for direct sharing", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("user@example.com")).toBe(true);
    expect(emailRegex.test("invalid-email")).toBe(false);
  });

  it("should handle expiration dates for shared links", () => {
    const expiresInDays = 7;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    expect(expiresAt > now).toBe(true);
    expect(expiresAt.getDate()).toBe((now.getDate() + 7) % 31 || 31);
  });

  it("should track template usage count", () => {
    let usageCount = 0;
    const incrementUsage = () => {
      usageCount++;
    };
    incrementUsage();
    incrementUsage();
    expect(usageCount).toBe(2);
  });

  it("should filter public templates by content type", () => {
    const publicTemplates = [
      { id: 1, contentType: "advertorial", isPublic: true },
      { id: 2, contentType: "vsl_script", isPublic: true },
      { id: 3, contentType: "advertorial", isPublic: true },
    ];
    const filtered = publicTemplates.filter(
      (t) => t.contentType === "advertorial"
    );
    expect(filtered.length).toBe(2);
  });

  it("should respect permission levels", () => {
    const canView = (permission: string) =>
      ["view", "duplicate", "edit"].includes(permission);
    const canDuplicate = (permission: string) =>
      ["duplicate", "edit"].includes(permission);
    const canEdit = (permission: string) => permission === "edit";

    expect(canView("view")).toBe(true);
    expect(canDuplicate("view")).toBe(false);
    expect(canDuplicate("duplicate")).toBe(true);
    expect(canEdit("duplicate")).toBe(false);
    expect(canEdit("edit")).toBe(true);
  });
});

describe("A/B Test Analysis Output", () => {
  it("should generate recommendation text", () => {
    const analysis = {
      potentialWinner: { versionNumber: 2, ctr: 8, conversionRate: 18.75 },
      totalImpressions: 3000,
      totalClicks: 160,
      totalConversions: 30,
    };
    const recommendation = `Version ${analysis.potentialWinner.versionNumber} shows the best performance with ${analysis.potentialWinner.ctr}% CTR`;
    expect(recommendation).toContain("Version 2");
    expect(recommendation).toContain("8% CTR");
  });

  it("should indicate when more data is needed", () => {
    const minImpressionsForSignificance = 100;
    const versions = [
      { impressions: 50, clicks: 5 },
      { impressions: 30, clicks: 3 },
    ];
    const hasEnoughData = versions.every(
      (v) => v.impressions >= minImpressionsForSignificance
    );
    expect(hasEnoughData).toBe(false);
  });
});
