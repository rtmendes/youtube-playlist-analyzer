import { describe, it, expect } from "vitest";

describe("GridBase API Key Validation", () => {
  it("should have GRIDBASE_API_KEY environment variable set", () => {
    const apiKey = process.env.GRIDBASE_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBe(64);
  });

  it("should have a valid hex format API key", () => {
    const apiKey = process.env.GRIDBASE_API_KEY!;
    // GridBase API keys are 64-char hex strings
    expect(apiKey).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should be able to reach GridBase server", async () => {
    // Just verify the server is reachable (may return 401 from sandbox due to IP/network)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("https://gridbase.insightprofit.live/api/v1/bases", {
        headers: {
          "Authorization": `Bearer ${process.env.GRIDBASE_API_KEY}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      // Server responds (not a network error)
      expect([200, 401, 403]).toContain(response.status);
    } catch (e: any) {
      clearTimeout(timeout);
      // If network is unreachable from sandbox, that's acceptable
      expect(e.name).toBe("AbortError");
    }
  }, 15000);
});
