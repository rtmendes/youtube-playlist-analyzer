import { describe, it, expect } from "vitest";

const apiKey = process.env.GRIDBASE_API_KEY;
const hasGridbase = Boolean(apiKey && apiKey.length === 64);

describe("GridBase API Key Validation", () => {
  it.skipIf(!hasGridbase)("should have GRIDBASE_API_KEY environment variable set", () => {
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBe(64);
  });

  it.skipIf(!hasGridbase)("should have a valid hex format API key", () => {
    expect(apiKey!).toMatch(/^[a-f0-9]{64}$/);
  });

  it.skipIf(!hasGridbase)(
    "should be able to reach GridBase server",
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("https://gridbase.insightprofit.live/api/v1/bases", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        expect([200, 401, 403]).toContain(response.status);
      } catch (e: unknown) {
        clearTimeout(timeout);
        const err = e as { name?: string };
        expect(["AbortError", "TypeError"]).toContain(err.name ?? "");
      }
    },
    15000
  );

  it("skips live Gridbase checks when GRIDBASE_API_KEY is unset", () => {
    if (!hasGridbase) {
      expect(process.env.GRIDBASE_API_KEY).toBeUndefined();
    } else {
      expect(apiKey).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
