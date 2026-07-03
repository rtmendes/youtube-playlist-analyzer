import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Users, MessageSquare, BarChart3, ListMusic, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function YouTubeDataPOD() {
  const stats = trpc.dashboard.getStats.useQuery();
  const playlists = trpc.savedPlaylists.list.useQuery();
  const opportunities = trpc.pod.listOpportunities.useQuery({ limit: 3 });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">YouTube Data</h1>
        <p className="text-muted-foreground">
          {stats.data?.videosAnalyzed ?? 0} videos · {stats.data?.commentsCollected ?? 0} comments ·{" "}
          {opportunities.data?.length ?? 0} POD signals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos
            </CardTitle>
            <CardDescription>{stats.data?.videosAnalyzed ?? 0} analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/videos">
              <Button variant="outline">View all videos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Channels
            </CardTitle>
            <CardDescription>{stats.data?.channelsTracked ?? 0} tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/channels">
              <Button variant="outline">View all channels</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </CardTitle>
            <CardDescription>Comment intelligence and saved comments</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/comments">
              <Button variant="outline">View comments</Button>
            </Link>
            <Link href="/saved-comments">
              <Button variant="outline">Saved</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              Playlists
            </CardTitle>
            <CardDescription>
              {playlists.isLoading ? "Loading…" : `${playlists.data?.length ?? 0} saved`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/playlists">
              <Button variant="outline">View playlists</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Intelligence & POD
          </CardTitle>
          <CardDescription>AI comment analysis and buyer-intent opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link href="/intelligence">
              <Button variant="outline">Open Intelligence</Button>
            </Link>
            <Link href="/pod-opportunities">
              <Button variant="outline">POD Opportunities</Button>
            </Link>
            <Link href="/mockup-generator">
              <Button>Mockup Generator</Button>
            </Link>
          </div>
          {opportunities.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <ul className="text-sm text-muted-foreground space-y-1">
              {(opportunities.data ?? []).map(o => (
                <li key={o.id}>
                  {o.title} — {o.intentScore}% intent
                </li>
              ))}
              {(opportunities.data ?? []).length === 0 && (
                <li>No high-intent comments yet. Run analysis from Intelligence.</li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
