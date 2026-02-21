import { useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLastRun } from "@/lib/lastRunStorage";
import { DynamicLayout } from "@/components/DynamicLayout";
import {
  FileText,
  Brain,
  Video,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Home,
  List,
  TrendingUp,
  ThumbsUp,
} from "lucide-react";

interface VideoLike {
  id: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export default function AnalysisDashboard() {
  const lastRun = getLastRun();
  const videos = (lastRun?.videosData ?? []) as VideoLike[];
  const comments = (lastRun?.commentsData ?? []) as unknown[];

  const reportMarkdown = useMemo(() => {
    if (videos.length === 0 && comments.length === 0) return "";
    const totalViews = videos.reduce((s, v) => s + (v.viewCount ?? 0), 0);
    const totalLikes = videos.reduce((s, v) => s + (v.likeCount ?? 0), 0);
    const topVideos = [...videos]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 15);
    let md = `## Analysis summary\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| **Videos** | ${videos.length} |\n`;
    md += `| **Comments fetched** | ${comments.length} |\n`;
    md += `| **Total views** | ${totalViews.toLocaleString()} |\n`;
    md += `| **Total likes** | ${totalLikes.toLocaleString()} |\n\n`;
    md += `### Top videos by views\n\n`;
    md += `| # | Title | Channel | Views | Likes | Comments |\n`;
    md += `|---|-------|---------|-------|-------|----------|\n`;
    topVideos.forEach((v, i) => {
      const title = (v.title ?? "").replace(/\|/g, " ").slice(0, 50);
      md += `| ${i + 1} | ${title}${title.length >= 50 ? "…" : ""} | ${v.channelTitle ?? ""} | ${(v.viewCount ?? 0).toLocaleString()} | ${(v.likeCount ?? 0).toLocaleString()} | ${(v.commentCount ?? 0).toLocaleString()} |\n`;
    });
    md += `\n### Next steps\n\n`;
    md += `For **sentiment analysis**, **product ideas**, and **copywriting insights** from comments, open [Comment Intelligence](/intelligence?source=local). For raw data and exports, use [Saved run (list view)](/history/local).\n`;
    return md;
  }, [videos, comments]);

  const hasData = lastRun && (videos.length > 0 || comments.length > 0);

  if (!lastRun || !hasData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analysis & Report
            </CardTitle>
            <CardDescription>
              This dashboard shows a combined report from your latest bulk run: summary, top videos, and a link to Comment Intelligence. Run a bulk analysis from Home first — your last run will load here automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Run bulk analysis from Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/history">Go to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedAt = lastRun.completedAt
    ? new Date(lastRun.completedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analysis & Report
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {lastRun.name} · {completedAt}
                <span className="ml-2 text-muted-foreground/80">(this device)</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/history/local">
                  <List className="h-4 w-4 mr-1" />
                  List view
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/intelligence?source=local">
                  <Brain className="h-4 w-4 mr-1" />
                  Comment Intelligence
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lastRun.videosFetched}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lastRun.commentsFetched}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lastRun.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ThumbsUp className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lastRun.totalLikes.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report (markdown summary + top videos) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report summary
            </CardTitle>
            <CardDescription>
              Metrics and top videos from your last run. All data is sourced from this device’s last bulk analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicLayout content={reportMarkdown} />
          </CardContent>
        </Card>

        {/* Comment Intelligence card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Comment Intelligence
            </CardTitle>
            <CardDescription>
              Sentiment, categories (stories, pain points, product ideas), and copywriting insights from the same run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="gap-2">
              <Link href="/intelligence?source=local">
                Open Comment Intelligence
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* List view / raw data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-muted-foreground" />
              Raw data & export
            </CardTitle>
            <CardDescription>
              View the full list of videos and comments, export CSV, or open the run in bulk view.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/history/local">Saved run (list view)</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Run a new analysis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
