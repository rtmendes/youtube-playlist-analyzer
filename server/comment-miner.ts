/**
 * Comment Miner (Audience Intelligence) bridge.
 *
 * Comment Miner mines comments from saved social posts and scores them for
 * buying signals. This module lets the analyzer's monetization features attach
 * *proof of audience demand* to product recommendations by querying its
 * evidence API.
 *
 * Configure via environment variable:
 * - COMMENT_MINER_URL: base URL of the Comment Miner deployment
 *   (default: the production instance)
 *
 * All calls fail soft (return null) so recommendation flows never break when
 * the sibling app is unreachable.
 */

const BASE = (process.env.COMMENT_MINER_URL || "https://scraping-apis-for-devs.vercel.app").replace(/\/$/, "");

export interface CMDemandSignal {
  phrase: string;
  kind: "purchase-intent" | "feature-request" | "variant-demand";
  count: number;
  weight: number;
}

export interface CMGoldCoin {
  text: string;
  author: string;
  platform: string;
  url: string | null;
  likes: number;
  replies: number;
  goldScore: number;
  sentiment: string | null;
  matchedTerms: number;
}

export interface CMLlmDemand {
  product: string;
  intent: string;
  strength?: number;
  evidence?: string;
}

export interface CMDemandEvidence {
  query: string;
  matched: number;
  summary: {
    purchaseIntentMentions: number;
    variantDemandMentions: number;
    featureRequestMentions: number;
    positiveShare: number;
    topSignalWeight: number;
  } | null;
  signals: CMDemandSignal[];
  goldCoins: CMGoldCoin[];
  llmDemands: CMLlmDemand[];
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Audience-demand evidence for a product / niche keyword query. */
export function fetchDemandEvidence(query: string, limit = 8): Promise<CMDemandEvidence | null> {
  return get<CMDemandEvidence>(`/api/demand-evidence?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/** Global (or per-folder) mined-audience insights. */
export function fetchDemandOverview(folderId?: string): Promise<Record<string, unknown> | null> {
  return get(`/api/insights${folderId ? `?folderId=${encodeURIComponent(folderId)}` : ""}`);
}

/** Health of the Comment Miner deployment (for status displays). */
export function fetchCommentMinerHealth(): Promise<Record<string, unknown> | null> {
  return get(`/api/health`);
}
