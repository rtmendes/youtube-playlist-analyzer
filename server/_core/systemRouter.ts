import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { ENV } from "./env";

export const systemRouter = router({
  /** Which API keys are set in server .env (so client can avoid storing keys in browser). */
  getApiKeyStatus: publicProcedure.query(() => ({
    youtube: !!ENV.youtubeApiKey,
    reddit: !!(ENV.redditClientId && ENV.redditClientSecret),
    amazon: !!ENV.amazonApiKey,
    gemini: !!ENV.geminiApiKey,
    scrapeCreators: !!ENV.scrapeCreatorsApiKey,
    composio: !!ENV.composioApiKey,
  })),

  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
