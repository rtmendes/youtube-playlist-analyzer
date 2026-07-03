import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, Bookmark, Lightbulb, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CommentAnalysisPOD() {
  const opportunities = trpc.pod.listOpportunities.useQuery({ limit: 10 });
  const stats = trpc.dashboard.getStats.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comment Analysis</h1>
        <p className="text-muted-foreground">
          {stats.data?.commentsCollected ?? 0} comments collected · {opportunities.data?.length ?? 0} POD signals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              All Comments
            </CardTitle>
            <CardDescription>Browse and filter comments from analyzed videos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/comments">
              <Button variant="outline" className="w-full">Open Comments</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              YouTube Intelligence
            </CardTitle>
            <CardDescription>AI categorization and buyer intent detection</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/intelligence">
              <Button variant="outline" className="w-full">Open Intelligence</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Comments
            </CardTitle>
            <CardDescription>Comments you saved for POD ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/saved-comments">
              <Button variant="outline" className="w-full">Open Saved Comments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Top POD signals
          </CardTitle>
          <CardDescription>From commentInsights — high marketing potential</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {opportunities.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (opportunities.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No opportunities yet. Save comments to a project via Intelligence, then return here.
            </p>
          ) : (
            (opportunities.data ?? []).map(o => (
              <div key={o.id} className="flex justify-between items-start gap-4 border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium text-sm">{o.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.source} · {o.intentScore}% intent · {o.status}
                  </p>
                </div>
                <Link href={`/mockup-generator?signal=${encodeURIComponent(o.rawComment)}`}>
                  <Button size="sm" variant="secondary">
                    Design
                  </Button>
                </Link>
              </div>
            ))
          )}
          <Link href="/pod-opportunities">
            <Button variant="link" className="px-0">View all opportunities →</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
