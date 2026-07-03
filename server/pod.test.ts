import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isPodOpportunityCategory,
  mapInsightToOpportunity,
  parseDesignBrief,
  toGridbaseRow,
} from "./pod-helpers";
import { getPromptById } from "./content-prompts";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn(),
}));

describe("podDesignPrompts", () => {
  it("registers design_prompt in content prompts", () => {
    const prompt = getPromptById("pod-design-brief");
    expect(prompt).toBeDefined();
    expect(prompt?.contentType).toBe("design_prompt");
    expect(prompt?.variables.map(v => v.name)).toContain("signal");
  });
});

describe("mapInsightToOpportunity", () => {
  it("maps comment insight rows to opportunity shape", () => {
    const opp = mapInsightToOpportunity({
      id: 42,
      commentText: "Shut up and take my money — need this on a shirt!",
      videoTitle: "Funny Gaming Moments",
      authorName: "viewer1",
      videoId: "abc123",
      category: "product_request",
      marketingPotential: 88,
      isSelected: 0,
      createdAt: new Date("2026-01-15T12:00:00Z"),
      projectName: "Gaming",
    });

    expect(opp.id).toBe("OP-42");
    expect(opp.intentScore).toBe(88);
    expect(opp.priority).toBe("High");
    expect(opp.productTypes).toContain("T-Shirt");
    expect(opp.rawComment).toContain("take my money");
  });
});

describe("isPodOpportunityCategory", () => {
  it("accepts high-intent categories", () => {
    expect(isPodOpportunityCategory("product_request")).toBe(true);
    expect(isPodOpportunityCategory("humor")).toBe(true);
    expect(isPodOpportunityCategory("other")).toBe(false);
  });
});

describe("parseDesignBrief", () => {
  it("parses JSON design brief from LLM output", () => {
    const brief = parseDesignBrief(
      JSON.stringify({
        concept: "Retro gaming quote tee",
        text_on_product: "GG EZ",
        product_type: "t-shirt",
        visual_style: "vintage",
        composition: "centered chest print",
        color_palette: ["#111111", "#ffcc00"],
        image_prompt: "Bold retro gaming typography GG EZ on black tee",
        params: "--ar 4:5",
        negative_prompt: "blurry",
        trademark_flag: false,
      })
    );

    expect(brief.image_prompt).toContain("GG EZ");
    expect(brief.color_palette).toHaveLength(2);
  });

  it("strips markdown fences", () => {
    const brief = parseDesignBrief(
      '```json\n{"concept":"x","text_on_product":"","product_type":"mug","visual_style":"modern","composition":"wrap","color_palette":[],"image_prompt":"coffee mug bold text","params":"","negative_prompt":"","trademark_flag":false}\n```'
    );
    expect(brief.concept).toBe("x");
  });
});

describe("toGridbaseRow", () => {
  it("builds gridbase export row with expected columns", () => {
    const row = toGridbaseRow({
      signal: "Need this on a hoodie",
      niche: "fitness",
      productType: "hoodie",
      designPrompt: "bold gym quote",
      styleTags: ["minimalist"],
    });

    expect(row.source_platform).toBe("youtube");
    expect(row.product_type).toBe("hoodie");
    expect(row.design_prompt).toBe("bold gym quote");
    expect(row.style_tags).toBe("minimalist");
  });
});

describe("pod router integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports pod router with expected procedures", async () => {
    const { podRouter } = await import("./routers/pod");
    expect(podRouter).toBeDefined();
    expect(podRouter._def.procedures.generateDesignPrompt).toBeDefined();
    expect(podRouter._def.procedures.listOpportunities).toBeDefined();
    expect(podRouter._def.procedures.exportToGridbase).toBeDefined();
  });
});
