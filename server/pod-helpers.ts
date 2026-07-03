import { ENV } from "./_core/env";

export type PodOpportunity = {
  id: string;
  insightId: number;
  title: string;
  source: string;
  sourceType: string;
  intentScore: number;
  status: string;
  potentialRevenue: string;
  productTypes: string[];
  createdAt: string;
  priority: string;
  rawComment: string;
  niche: string;
  videoId: string | null;
};

const HIGH_INTENT_CATEGORIES = new Set([
  "product_request",
  "testimonial",
  "humor",
  "personal_story",
  "pain_point",
]);

export function isPodOpportunityCategory(category: string | null | undefined): boolean {
  return category != null && HIGH_INTENT_CATEGORIES.has(category);
}

export function mapInsightToOpportunity(row: {
  id: number;
  commentText: string | null;
  videoTitle: string | null;
  authorName: string | null;
  videoId: string | null;
  category: string | null;
  marketingPotential: number | null;
  isSelected: number | null;
  createdAt: Date;
  projectName?: string | null;
}): PodOpportunity {
  const intentScore = row.marketingPotential ?? 0;
  const comment = row.commentText?.trim() ?? "";
  const title =
    comment.length > 60 ? `${comment.slice(0, 57)}…` : comment || row.videoTitle || "Untitled opportunity";
  const source = row.videoTitle || row.authorName || row.projectName || "YouTube";
  const productTypes = productTypesForCategory(row.category);
  const priority = intentScore >= 85 ? "High" : intentScore >= 65 ? "Medium" : "Low";
  const status = row.isSelected ? "Validated" : statusForCategory(row.category);
  const revenue = Math.round(intentScore * 12);

  return {
    id: `OP-${row.id}`,
    insightId: row.id,
    title,
    source,
    sourceType: "comment",
    intentScore,
    status,
    potentialRevenue: `$${revenue.toLocaleString()}`,
    productTypes,
    createdAt: row.createdAt.toISOString(),
    priority,
    rawComment: comment,
    niche: row.projectName ?? "General",
    videoId: row.videoId,
  };
}

function productTypesForCategory(category: string | null | undefined): string[] {
  switch (category) {
    case "humor":
      return ["T-Shirt", "Mug", "Sticker"];
    case "product_request":
      return ["T-Shirt", "Hoodie", "Mug"];
    case "testimonial":
      return ["T-Shirt", "Poster"];
    case "pain_point":
      return ["T-Shirt", "Mug"];
    default:
      return ["T-Shirt"];
  }
}

function statusForCategory(category: string | null | undefined): string {
  switch (category) {
    case "product_request":
      return "Validated";
    case "humor":
    case "testimonial":
      return "Identified";
    default:
      return "Identified";
  }
}

export type PodDesignBrief = {
  concept: string;
  text_on_product: string;
  product_type: string;
  visual_style: string;
  composition: string;
  color_palette: string[];
  image_prompt: string;
  params: string;
  negative_prompt: string;
  trademark_flag: boolean;
};

export function parseDesignBrief(raw: string): PodDesignBrief {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<PodDesignBrief>;
  if (!parsed.image_prompt || !parsed.concept) {
    throw new Error("Design brief missing required fields (concept, image_prompt)");
  }
  return {
    concept: parsed.concept,
    text_on_product: parsed.text_on_product ?? "",
    product_type: parsed.product_type ?? "t-shirt",
    visual_style: parsed.visual_style ?? "modern",
    composition: parsed.composition ?? "centered",
    color_palette: Array.isArray(parsed.color_palette) ? parsed.color_palette : [],
    image_prompt: parsed.image_prompt,
    params: parsed.params ?? "--ar 4:5 --style raw",
    negative_prompt: parsed.negative_prompt ?? "blurry text, watermark, logo",
    trademark_flag: Boolean(parsed.trademark_flag),
  };
}

export type GridbasePodRow = {
  source_platform: string;
  source_url: string;
  signal_type: string;
  raw_comment: string;
  extracted_phrase: string;
  niche: string;
  audience: string;
  product_type: string;
  design_prompt: string;
  style_tags: string;
  trademark_flag: boolean;
  status: string;
  created_at: string;
};

export function toGridbaseRow(input: {
  sourceUrl?: string;
  signal?: string;
  niche?: string;
  audience?: string;
  productType?: string;
  designPrompt?: string;
  styleTags?: string[];
  trademarkFlag?: boolean;
  status?: string;
}): GridbasePodRow {
  const now = new Date().toISOString();
  return {
    source_platform: "youtube",
    source_url: input.sourceUrl ?? "",
    signal_type: "comment_intent",
    raw_comment: input.signal ?? "",
    extracted_phrase: input.signal?.slice(0, 120) ?? "",
    niche: input.niche ?? "",
    audience: input.audience ?? "",
    product_type: input.productType ?? "t-shirt",
    design_prompt: input.designPrompt ?? "",
    style_tags: (input.styleTags ?? []).join(", "),
    trademark_flag: input.trademarkFlag ?? false,
    status: input.status ?? "draft",
    created_at: now,
  };
}

export async function exportRowToGridbase(row: GridbasePodRow): Promise<{ recordId?: string }> {
  const baseUrl = ENV.gridbaseBaseUrl.replace(/\/+$/, "");
  const tableId = ENV.gridbaseTableId;
  const apiKey = ENV.gridbaseApiKey;

  if (!apiKey) {
    throw new Error("GRIDBASE_API_KEY is not configured");
  }
  if (!tableId) {
    throw new Error("GRIDBASE_TABLE_ID is not configured");
  }

  const response = await fetch(`${baseUrl}/api/v1/tables/${tableId}/records`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ fields: row }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gridbase export failed (${response.status}): ${detail}`);
  }

  const result = (await response.json()) as { record_ids?: string[] };
  return { recordId: result.record_ids?.[0] };
}
