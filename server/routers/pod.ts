import { z } from "zod";
import { desc, eq, gte, inArray, or } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { commentInsights, projects } from "../../drizzle/schema";
import { getPromptById } from "../content-prompts";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import {
  exportRowToGridbase,
  isPodOpportunityCategory,
  mapInsightToOpportunity,
  parseDesignBrief,
  toGridbaseRow,
} from "../pod-helpers";

const productTypeSchema = z.enum(["t-shirt", "hoodie", "mug", "poster", "sticker"]);
const aiModelSchema = z.enum(["ideogram", "midjourney", "dalle"]);

function buildDesignPrompt(input: {
  signal: string;
  niche?: string;
  audience?: string;
  productType: z.infer<typeof productTypeSchema>;
  style?: string;
  aiModel: z.infer<typeof aiModelSchema>;
}): string {
  const prompt = getPromptById("pod-design-brief");
  if (!prompt) throw new Error("POD design prompt not found");

  const vars: Record<string, string> = {
    signal: input.signal,
    niche: input.niche ?? "general",
    audience: input.audience ?? "general",
    product_type: input.productType,
    style: input.style ?? "modern",
    ai_model: input.aiModel,
  };

  let finalPrompt = prompt.promptTemplate;
  for (const [key, value] of Object.entries(vars)) {
    finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return finalPrompt;
}

function extractMessageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text: string }).text);
        }
        return "";
      })
      .join("\n");
  }
  return "";
}

export const podRouter = router({
  generateDesignPrompt: publicProcedure
    .input(
      z.object({
        signal: z.string().min(1),
        niche: z.string().optional(),
        audience: z.string().optional(),
        productType: productTypeSchema.default("t-shirt"),
        style: z.string().optional(),
        aiModel: aiModelSchema.default("ideogram"),
      })
    )
    .mutation(async ({ input }) => {
      const finalPrompt = buildDesignPrompt(input);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a POD design director. Respond with valid JSON only — no markdown fences.",
          },
          { role: "user", content: finalPrompt },
        ],
        responseFormat: { type: "json_object" },
      });

      const raw = extractMessageContent(response.choices[0]?.message?.content);
      const brief = parseDesignBrief(raw);
      const { url } = await generateImage({ prompt: brief.image_prompt });

      return { brief, imageUrl: url ?? null };
    }),

  listOpportunities: publicProcedure
    .input(
      z
        .object({
          minIntentScore: z.number().min(0).max(100).default(50),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const minScore = input?.minIntentScore ?? 50;
      const limit = input?.limit ?? 50;

      const rows = await db
        .select({
          id: commentInsights.id,
          commentText: commentInsights.commentText,
          videoTitle: commentInsights.videoTitle,
          authorName: commentInsights.authorName,
          videoId: commentInsights.videoId,
          category: commentInsights.category,
          marketingPotential: commentInsights.marketingPotential,
          isSelected: commentInsights.isSelected,
          createdAt: commentInsights.createdAt,
          projectName: projects.name,
        })
        .from(commentInsights)
        .leftJoin(projects, eq(commentInsights.projectId, projects.id))
        .where(
          or(
            gte(commentInsights.marketingPotential, minScore),
            inArray(commentInsights.category, [
              "product_request",
              "humor",
              "testimonial",
              "personal_story",
            ])
          )
        )
        .orderBy(desc(commentInsights.marketingPotential))
        .limit(limit);

      return rows
        .filter(r => isPodOpportunityCategory(r.category) || (r.marketingPotential ?? 0) >= minScore)
        .map(mapInsightToOpportunity);
    }),

  exportToGridbase: publicProcedure
    .input(
      z.object({
        signal: z.string(),
        niche: z.string().optional(),
        audience: z.string().optional(),
        productType: z.string().optional(),
        designPrompt: z.string().optional(),
        styleTags: z.array(z.string()).optional(),
        trademarkFlag: z.boolean().optional(),
        sourceUrl: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const row = toGridbaseRow(input);
      const result = await exportRowToGridbase(row);
      return { success: true, recordId: result.recordId };
    }),
});
