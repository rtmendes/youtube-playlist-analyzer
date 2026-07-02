/**
 * Shared comment analysis: POD, sentiment, product ideas, categories.
 * Used by Comment Intelligence, HistoryLocal, and Bulk Analyze so analysis is automatic everywhere.
 */

export const CATEGORY_LABELS: Record<string, { label: string; short: string }> = {
  personal_story: { label: "Personal Story", short: "Story" },
  testimonial: { label: "Testimonial", short: "Testimonial" },
  product_request: { label: "Product Request", short: "Product" },
  pain_point: { label: "Pain Point", short: "Pain" },
  humor: { label: "Humor", short: "Humor" },
  question: { label: "Question", short: "Question" },
  praise: { label: "Praise", short: "Praise" },
  criticism: { label: "Criticism", short: "Criticism" },
  suggestion: { label: "Suggestion", short: "Suggestion" },
  other: { label: "Other", short: "Other" },
};

const PATTERNS: Record<string, string[]> = {
  personal_story: ["my story", "i remember", "when i was", "happened to me", "my experience", "i went through", "i struggled", "i overcame", "changed my life", "i learned"],
  testimonial: ["this helped me", "thanks to", "recommend", "best thing", "life changing", "game changer", "must watch", "amazing", "incredible", "saved my"],
  product_request: ["i want", "need this", "make a", "should sell", "where can i buy", "take my money", "shut up and take", "needs to be a", "would buy", "merch"],
  pain_point: ["i hate", "frustrated", "annoying", "problem is", "struggle with", "can't figure out", "doesn't work", "wish it", "if only", "tired of"],
  humor: ["lol", "lmao", "😂", "dead", "i'm crying", "hilarious", "comedy gold", "underrated comment", "this killed me", "💀"],
  question: ["how do", "what is", "why does", "can someone", "does anyone know", "help me", "?", "wondering", "curious about", "explain"],
};

const POSITIVE_WORDS = ["love", "great", "amazing", "awesome", "best", "thank", "helpful", "incredible", "fantastic", "excellent"];
const NEGATIVE_WORDS = ["hate", "bad", "worst", "terrible", "awful", "disappointed", "annoying", "frustrating", "useless", "waste"];

export interface CommentForAnalysis {
  id: string;
  textOriginal: string;
  likeCount?: number;
  replyCount?: number;
  videoId?: string;
  videoTitle?: string;
  authorDisplayName?: string;
  publishedAt?: string;
  [key: string]: unknown;
}

export interface AnalyzedCommentResult {
  category: string;
  sentimentScore: number;
  marketingPotential: number;
  matchedPatterns: string[];
  label: string;
}

export function analyzeOneComment(comment: CommentForAnalysis): AnalyzedCommentResult {
  const text = (comment.textOriginal || "").toLowerCase();
  let category: string = "other";
  let matchedPatterns: string[] = [];
  let maxMatches = 0;

  for (const [cat, patterns] of Object.entries(PATTERNS)) {
    const matches = patterns.filter((p) => text.includes(p.toLowerCase()));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      category = cat;
      matchedPatterns = matches;
    }
  }

  const positiveCount = POSITIVE_WORDS.filter((w) => text.includes(w)).length;
  const negativeCount = NEGATIVE_WORDS.filter((w) => text.includes(w)).length;
  const sentimentScore = Math.max(-100, Math.min(100, (positiveCount - negativeCount) * 25));

  let marketingPotential = 0;
  marketingPotential += Math.min(30, (comment.likeCount ?? 0) / 10);
  marketingPotential += Math.min(20, (comment.replyCount ?? 0) * 5);
  if (category === "personal_story") marketingPotential += 25;
  if (category === "testimonial") marketingPotential += 30;
  if (category === "product_request") marketingPotential += 25;
  if (category === "pain_point") marketingPotential += 20;
  if (category === "humor") marketingPotential += 15;
  if (text.length > 200) marketingPotential += 10;
  if (text.length > 500) marketingPotential += 10;
  marketingPotential = Math.min(100, Math.round(marketingPotential));

  return {
    category,
    sentimentScore,
    marketingPotential,
    matchedPatterns,
    label: CATEGORY_LABELS[category]?.short ?? category,
  };
}

export function analyzeComments<T extends CommentForAnalysis>(comments: T[]): (T & AnalyzedCommentResult)[] {
  return comments.map((c) => ({ ...c, ...analyzeOneComment(c) }));
}
