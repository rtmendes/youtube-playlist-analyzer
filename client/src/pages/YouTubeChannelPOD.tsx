import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Users, ListMusic, MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function YouTubeChannelPOD() {
  const stats = trpc.dashboard.getStats.useQuery();
  const playlists = trpc.savedPlaylists.list.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">YouTube Channel</h1>
        <p className="text-muted-foreground">
          Channel library for POD research (API-key mode — OAuth subscriptions deferred)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-red-100 dark:bg-red-900/30 text-red-600">
              <Youtube className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Channels tracked</p>
              <p className="text-lg font-semibold">
                {stats.isLoading ? "…" : stats.data?.channelsTracked ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-muted">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subscriptions</p>
              <p className="text-lg font-semibold text-muted-foreground">OAuth deferred</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-muted">
              <ListMusic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saved playlists</p>
              <p className="text-lg font-semibold">
                {playlists.isLoading ? "…" : playlists.data?.length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-muted">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comments synced</p>
              <p className="text-lg font-semibold">
                {stats.isLoading ? "…" : stats.data?.commentsCollected ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Paste playlist URLs to analyze channels without OAuth</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/channels">
            <Button variant="outline">Browse channels</Button>
          </Link>
          <Link href="/playlists">
            <Button variant="outline">Saved playlists</Button>
          </Link>
          <Link href="/bulk-analyze">
            <Button>Bulk analyze</Button>
          </Link>
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => {
              stats.refetch();
              playlists.refetch();
            }}
            disabled={stats.isFetching || playlists.isFetching}
          >
            {(stats.isFetching || playlists.isFetching) && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
