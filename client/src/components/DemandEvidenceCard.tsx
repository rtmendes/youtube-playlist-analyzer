/**
 * DemandEvidenceCard — audience-demand proof from Comment Miner.
 *
 * Given a product / niche query (e.g. an Amazon product title), shows what the
 * mined social-comment corpus says about it: purchase-intent and variant-demand
 * counts, the strongest demand phrases, and the highest-converting matching
 * comments ("gold coins") to reuse as ad hooks. Renders nothing heavy when the
 * sibling app has no matching data — instead it nudges toward mining.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radar, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

const COMMENT_MINER_URL = "https://scraping-apis-for-devs.vercel.app";

const KIND_STYLE: Record<string, string> = {
  "purchase-intent": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "variant-demand": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "feature-request": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export function DemandEvidenceCard({ query, limit = 6 }: { query: string; limit?: number }) {
  const enabled = (query ?? "").trim().length >= 2;
  const { data, isLoading } = trpc.commentMiner.evidence.useQuery(
    { query, limit },
    { enabled, staleTime: 60_000, retry: 1 },
  );

  if (!enabled) return null;

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary" />
          Audience demand evidence
          <span className="text-xs font-normal text-muted-foreground">via Comment Miner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">
            Comment Miner is unreachable right now — recommendations continue without demand evidence.
          </p>
        ) : data.matched === 0 && data.llmDemands.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No mined audience signals match “{data.query}” yet.{" "}
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href={COMMENT_MINER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mine related posts in Comment Miner
            </a>{" "}
            to validate demand before committing to this product.
          </p>
        ) : (
          <>
            {data.summary && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{data.matched} matching comments</Badge>
                <Badge className={KIND_STYLE["purchase-intent"]}>
                  🛒 {data.summary.purchaseIntentMentions} purchase-intent
                </Badge>
                <Badge className={KIND_STYLE["variant-demand"]}>
                  🎨 {data.summary.variantDemandMentions} variant-demand
                </Badge>
                <Badge className={KIND_STYLE["feature-request"]}>
                  💡 {data.summary.featureRequestMentions} feature-request
                </Badge>
                <Badge variant="outline">{Math.round(data.summary.positiveShare * 100)}% positive</Badge>
              </div>
            )}

            {data.signals.length > 0 && (
              <div className="space-y-1">
                {data.signals.slice(0, 4).map((s) => (
                  <div key={`${s.kind}:${s.phrase}`} className="flex items-center gap-2 text-sm">
                    <Badge className={`${KIND_STYLE[s.kind] ?? ""} shrink-0`}>{s.kind}</Badge>
                    <span className="truncate">“{s.phrase}”</span>
                    <span className="ml-auto shrink-0 tabular-nums text-xs text-muted-foreground">
                      w{s.weight}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {data.goldCoins.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Audience language (reuse as ad hooks)
                </p>
                {data.goldCoins.slice(0, 3).map((c, i) => (
                  <blockquote key={i} className="border-l-2 pl-3 text-sm text-muted-foreground">
                    “{c.text}”
                    <span className="ml-2 text-xs">
                      — @{c.author} · ♥{c.likes.toLocaleString()} · ⭐{c.goldScore}
                    </span>
                  </blockquote>
                ))}
              </div>
            )}

            {data.llmDemands.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.llmDemands.slice(0, 4).map((d, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    ✦ {d.product} ({d.intent}
                    {d.strength ? ` ${"★".repeat(d.strength)}` : ""})
                  </Badge>
                ))}
              </div>
            )}

            <a
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              href={COMMENT_MINER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Comment Miner <ExternalLink className="h-3 w-3" />
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
