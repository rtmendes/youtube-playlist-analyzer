import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  ListMusic,
  Folder,
  Loader2,
  Calendar,
  Video,
  MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/Breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Trash() {
  const { isAuthenticated } = useAuth();
  const [deletePlaylistId, setDeletePlaylistId] = useState<number | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);

  const { data: archived, isLoading, refetch } = trpc.dashboard.getArchived.useQuery(undefined, {
    enabled: !!isAuthenticated,
  });

  const updatePlaylistStatus = trpc.savedPlaylists.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Playlist restored");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePlaylist = trpc.savedPlaylists.delete.useMutation({
    onSuccess: () => {
      toast.success("Playlist permanently deleted");
      setDeletePlaylistId(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project restored");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project permanently deleted");
      setDeleteProjectId(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const playlists = archived?.playlists ?? [];
  const projects = archived?.projects ?? [];
  const isEmpty = playlists.length === 0 && projects.length === 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <PageHeader title="Trash" />
          <Card className="border border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Sign in to view archived items.</p>
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
          title="Trash"
          description="Archived playlists and projects. Restore or permanently delete them."
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <Card className="border border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
              <p className="text-muted-foreground max-w-sm">
                Archived playlists and projects will appear here. You can restore or permanently delete them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {playlists.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ListMusic className="h-5 w-5" />
                  Archived Playlists
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {playlists.map((p) => (
                    <Card key={p.id} className="border border-border/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm font-medium truncate">
                              {p.title || "Untitled playlist"}
                            </CardTitle>
                            {p.channelTitle && (
                              <CardDescription className="text-xs truncate">
                                {p.channelTitle}
                              </CardDescription>
                            )}
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs">Archived</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Video className="h-3.5 w-3.5" />
                            {p.lastVideoCount ?? p.videoCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {p.lastCommentCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(p.lastRunAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => updatePlaylistStatus.mutate({ id: p.id, status: "active" })}
                            disabled={updatePlaylistStatus.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletePlaylistId(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {projects.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Archived Projects
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((proj) => (
                    <Card key={proj.id} className="border border-border/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium truncate">
                            {proj.name}
                          </CardTitle>
                          <Badge variant="secondary" className="shrink-0 text-xs">Archived</Badge>
                        </div>
                        {proj.description && (
                          <CardDescription className="text-xs line-clamp-2">
                            {proj.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Updated {formatDate(proj.updatedAt)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => updateProject.mutate({ id: proj.id, status: "active" })}
                            disabled={updateProject.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteProjectId(proj.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deletePlaylistId !== null} onOpenChange={(open) => !open && setDeletePlaylistId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the playlist and its run history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePlaylistId !== null && deletePlaylist.mutate({ id: deletePlaylistId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectId !== null} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the project and its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteProjectId !== null && deleteProject.mutate({ id: deleteProjectId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
