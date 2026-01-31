import { describe, it, expect, vi } from "vitest";
import { allPrompts, getPromptsForType, getPromptById, copywritingFrameworks, croBestPractices } from "./content-prompts";

describe("Content Generator - Prompts Knowledge Base", () => {
  describe("allPrompts", () => {
    it("should have prompts for all content types", () => {
      const expectedTypes = [
        "advertorial",
        "vsl_script",
        "ugc_scenario",
        "course_outline",
        "ad_copy",
        "sales_page",
        "email_sequence",
        "product_idea"
      ];
      
      expectedTypes.forEach(type => {
        expect(allPrompts[type as keyof typeof allPrompts]).toBeDefined();
        expect(Array.isArray(allPrompts[type as keyof typeof allPrompts])).toBe(true);
        expect(allPrompts[type as keyof typeof allPrompts].length).toBeGreaterThan(0);
      });
    });

    it("should have valid prompt structure for each prompt", () => {
      Object.values(allPrompts).flat().forEach(prompt => {
        expect(prompt.id).toBeDefined();
        expect(prompt.contentType).toBeDefined();
        expect(prompt.name).toBeDefined();
        expect(prompt.description).toBeDefined();
        expect(prompt.promptTemplate).toBeDefined();
        expect(Array.isArray(prompt.variables)).toBe(true);
        expect(Array.isArray(prompt.bestPractices)).toBe(true);
      });
    });

    it("should have unique IDs across all prompts", () => {
      const allIds = Object.values(allPrompts).flat().map(p => p.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe("getPromptsForType", () => {
    it("should return prompts for valid content type", () => {
      const advertorialPrompts = getPromptsForType("advertorial");
      expect(Array.isArray(advertorialPrompts)).toBe(true);
      expect(advertorialPrompts.length).toBeGreaterThan(0);
      advertorialPrompts.forEach(p => {
        expect(p.contentType).toBe("advertorial");
      });
    });

    it("should return empty array for invalid content type", () => {
      const invalidPrompts = getPromptsForType("invalid_type");
      expect(Array.isArray(invalidPrompts)).toBe(true);
      expect(invalidPrompts.length).toBe(0);
    });

    it("should return prompts for all valid content types", () => {
      const types = ["advertorial", "vsl_script", "ugc_scenario", "course_outline", "ad_copy", "sales_page", "email_sequence", "product_idea"];
      types.forEach(type => {
        const prompts = getPromptsForType(type);
        expect(prompts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getPromptById", () => {
    it("should return prompt for valid ID", () => {
      const prompt = getPromptById("adv-story-driven");
      expect(prompt).toBeDefined();
      expect(prompt?.id).toBe("adv-story-driven");
      expect(prompt?.contentType).toBe("advertorial");
    });

    it("should return undefined for invalid ID", () => {
      const prompt = getPromptById("invalid-id");
      expect(prompt).toBeUndefined();
    });

    it("should find prompts from different content types", () => {
      // Test a few prompts from different categories
      const advPrompt = getPromptById("adv-story-driven");
      expect(advPrompt?.contentType).toBe("advertorial");

      const vslPrompt = getPromptById("vsl-full-script");
      expect(vslPrompt?.contentType).toBe("vsl_script");
    });
  });

  describe("copywritingFrameworks", () => {
    it("should have multiple frameworks defined", () => {
      expect(Array.isArray(copywritingFrameworks)).toBe(true);
      expect(copywritingFrameworks.length).toBeGreaterThan(0);
    });

    it("should have valid framework structure", () => {
      copywritingFrameworks.forEach(framework => {
        expect(framework.acronym).toBeDefined();
        expect(framework.name).toBeDefined();
        expect(framework.description).toBeDefined();
        expect(Array.isArray(framework.steps)).toBe(true);
        expect(framework.steps.length).toBeGreaterThan(0);
        expect(Array.isArray(framework.bestFor)).toBe(true);
      });
    });

    it("should include common frameworks like AIDA and PAS", () => {
      const acronyms = copywritingFrameworks.map(f => f.acronym);
      expect(acronyms).toContain("AIDA");
      expect(acronyms).toContain("PAS");
    });

    it("should have steps with letter, name, and description", () => {
      copywritingFrameworks.forEach(framework => {
        framework.steps.forEach(step => {
          expect(step.letter).toBeDefined();
          expect(step.name).toBeDefined();
          expect(step.description).toBeDefined();
        });
      });
    });
  });

  describe("croBestPractices", () => {
    it("should have multiple best practices defined", () => {
      expect(Array.isArray(croBestPractices)).toBe(true);
      expect(croBestPractices.length).toBeGreaterThan(0);
    });

    it("should have valid practice structure", () => {
      croBestPractices.forEach(practice => {
        expect(practice.title).toBeDefined();
        expect(practice.description).toBeDefined();
        expect(practice.contentType).toBeDefined();
        expect(practice.priority).toBeDefined();
        expect(["critical", "high", "medium", "low"]).toContain(practice.priority);
        expect(Array.isArray(practice.doList)).toBe(true);
        expect(Array.isArray(practice.dontList)).toBe(true);
      });
    });

    it("should have practices for different content types", () => {
      const contentTypes = new Set(croBestPractices.map(p => p.contentType));
      expect(contentTypes.size).toBeGreaterThan(1);
    });
  });
});

describe("Content Generator - Prompt Variables", () => {
  it("should have required variables marked correctly", () => {
    Object.values(allPrompts).flat().forEach(prompt => {
      prompt.variables.forEach(variable => {
        expect(typeof variable.required).toBe("boolean");
        expect(variable.name).toBeDefined();
        expect(variable.description).toBeDefined();
      });
    });
  });

  it("should have variables that match placeholders in template", () => {
    Object.values(allPrompts).flat().forEach(prompt => {
      const requiredVars = prompt.variables.filter(v => v.required);
      requiredVars.forEach(variable => {
        const placeholder = `{{${variable.name}}}`;
        expect(prompt.promptTemplate).toContain(placeholder);
      });
    });
  });
});

describe("Content Generator - Best Practices", () => {
  it("should have at least 3 best practices per prompt", () => {
    Object.values(allPrompts).flat().forEach(prompt => {
      expect(prompt.bestPractices.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("should have non-empty best practice strings", () => {
    Object.values(allPrompts).flat().forEach(prompt => {
      prompt.bestPractices.forEach(practice => {
        expect(practice.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe("Content Generator - Content Types", () => {
  const contentTypes = [
    { id: "advertorial", name: "Advertorial" },
    { id: "vsl_script", name: "VSL Script" },
    { id: "ugc_scenario", name: "UGC Scenario" },
    { id: "course_outline", name: "Course Outline" },
    { id: "ad_copy", name: "Ad Copy" },
    { id: "sales_page", name: "Sales Page" },
    { id: "email_sequence", name: "Email Sequence" },
    { id: "product_idea", name: "Product Ideas" },
  ];

  contentTypes.forEach(({ id, name }) => {
    it(`should have prompts for ${name}`, () => {
      const prompts = getPromptsForType(id);
      expect(prompts.length).toBeGreaterThan(0);
    });
  });
});
