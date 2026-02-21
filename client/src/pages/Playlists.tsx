import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ListMusic,
  Play,
  Video,
  MessageSquare,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/Breadcrumb";

function formatRelativeTime(date: Date | string | null) {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function Playlists() {
  const { user, isAuthenticated } = useAuth();
  const { data: playlists, isLoading } = trpc.savedPlaylists.list.useQuery(undefined, {
    enabled: !!isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <PageHeader title="Saved Playlists" />
          <Card className="border border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Sign in to view your saved playlists.</p>
              <Button asChild>
                <a href={getLoginUrl()}>Sign in</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 px-4 sm:px-6">
        <PageHeader
          title="Saved Playlists"
          description="Playlists you've saved from analysis. Open any to see runs and re-run analysis."
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !playlists?.length ? (
          <Card className="border border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved playlists yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Run an analysis from Home and use &quot;Save to Library&quot; to add playlists here.
              </p>
              <Button asChild>
                <Link href="/">Go to Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((p) => (
              <Link key={p.id} href={`/playlist/${p.id}`}>
                <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt=""
                          className="w-20 h-11 object-cover rounded shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-11 rounded bg-muted flex items-center justify-center shrink-0">
                          <Play className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                          {p.title || "Untitled playlist"}
                        </CardTitle>
                        {p.channelTitle && (
                          <CardDescription className="text-xs truncate mt-0.5">
                            {p.channelTitle}
                          </CardDescription>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Video className="h-3.5 w-3.5" />
                        {p.lastVideoCount ?? p.videoCount ?? 0} videos
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {p.lastCommentCount ?? 0} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatRelativeTime(p.lastRunAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
