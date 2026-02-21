/**
 * Client-side keyword tagging for comment intelligence (POD, product intent, etc.)
 * Used for filtering and report views without requiring NLP API.
 */

export type CommentCategory =
  | "pod"       // print on demand / "I want this", "need this"
  | "course"    // course / training / tutorial intent
  | "merch"     // t-shirt, merch, product
  | "product"   // generic product / buy / link
  | "high_engagement"; // used for filter: likes + replies above threshold

const PATTERNS: { category: CommentCategory; keywords: RegExp[] }[] = [
  {
    category: "pod",
    keywords: [
      /\b(print on demand|pod|p\.o\.d\.)\b/i,
      /\b(i want this|i need this|where can i get|how do i get)\b/i,
      /\b(custom(?:ize|e)?|personalize|my (?:own|name))\b/i,
      /\b(design(?:ed)? (?:my|this)|make (?:me|one))\b/i,
    ],
  },
  {
    category: "course",
    keywords: [
      /\b(course|training|tutorial|lesson|class|teach me|learn (?:how|this))\b/i,
      /\b(certification|certificate|bootcamp|masterclass)\b/i,
      /\b(step by step|walkthrough|guide)\b/i,
    ],
  },
  {
    category: "merch",
    keywords: [
      /\b(t-?shirt|tee|hoodie|sweatshirt|merch|merchandise)\b/i,
      /\b(mug|poster|sticker|print|canvas)\b/i,
      /\b(where(?:'s| is) the (?:link|store)|link to (?:buy|shop))\b/i,
    ],
  },
  {
    category: "product",
    keywords: [
      /\b(buy|purchase|order|checkout|add to cart)\b/i,
      /\b(link (?:in bio|please)|dm (?:me )?the link)\b/i,
      /\b(affiliate|discount code|promo)\b/i,
      /\b(price|how much|cost)\b/i,
    ],
  },
];

export function getCommentCategories(text: string): CommentCategory[] {
  const categories: CommentCategory[] = [];
  const lower = text || "";
  for (const { category, keywords } of PATTERNS) {
    if (keywords.some((re) => re.test(lower))) {
      categories.push(category);
    }
  }
  return categories;
}

export function getCategoryLabel(cat: CommentCategory): string {
  const labels: Record<CommentCategory, string> = {
    pod: "POD / Intent",
    course: "Course / Training",
    merch: "Merch / T-shirt",
    product: "Product / Buy",
    high_engagement: "High engagement",
  };
  return labels[cat];
}

/** Filter comments that have at least one of the given categories (or high_engagement by likes+replies). */
export function filterByCategory<T extends { textOriginal: string; likeCount?: number; replyCount?: number }>(
  comments: T[],
  category: string,
  engagementThreshold: number = 5
): T[] {
  if (!category || category === "all") return comments;
  if (category === "high_engagement") {
    return comments.filter(
      (c) => (c.likeCount ?? 0) + (c.replyCount ?? 0) >= engagementThreshold
    );
  }
  const cat = category as CommentCategory;
  return comments.filter((c) => getCommentCategories(c.textOriginal).includes(cat));
}
