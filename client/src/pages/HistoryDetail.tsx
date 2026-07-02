import { useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  Play,
  MessageSquare,
  Eye,
  ThumbsUp,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCommentCategories, getCategoryLabel } from "@/lib/commentTags";

interface VideoRow {
  id: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationFormatted?: string;
  publishedAt: string;
  playlistTitle?: string;
}

interface CommentRow {
  id: string;
  videoId: string;
  videoTitle?: string;
  authorDisplayName: string;
  textOriginal: string;
  likeCount: number;
  replyCount: number;
  publishedAt: string;
}

export default function HistoryDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [videoSearch, setVideoSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [videoSort, setVideoSort] = useState("views");
  const [commentSort, setCommentSort] = useState("most-liked");

  const { data: analysis, isLoading, error } = trpc.analysis.getById.useQuery(
    { id },
    { enabled: isAuthenticated && id > 0 }
  );

  const deleteMutation = trpc.analysis.delete.useMutation({
    onSuccess: () => {
      toast.success("Analysis deleted");
      setLocation("/history");
    },
    onError: (e) => toast.error(e.message),
  });

  const videos = (analysis?.videosData as VideoRow[] | undefined) ?? [];
  const comments = (analysis?.commentsData as CommentRow[] | undefined) ?? [];

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (videoSearch.trim()) {
      const q = videoSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.channelTitle?.toLowerCase().includes(q) ||
          (v.playlistTitle && v.playlistTitle.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      switch (videoSort) {
        case "views":
          return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        case "likes":
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case "comments":
          return (b.commentCount ?? 0) - (a.commentCount ?? 0);
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        default:
          return 0;
      }
    });
  }, [videos, videoSearch, videoSort]);

  const filteredComments = useMemo(() => {
    let list = comments;
    if (commentSearch.trim()) {
      const q = commentSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.textOriginal?.toLowerCase().includes(q) ||
          c.authorDisplayName?.toLowerCase().includes(q) ||
          (c.videoTitle && c.videoTitle.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      switch (commentSort) {
        case "most-liked":
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case "most-replies":
          return (b.replyCount ?? 0) - (a.replyCount ?? 0);
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        default:
          return 0;
      }
    });
  }, [comments, commentSearch, commentSort]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return String(num);
  };

  const exportVideosCSV = () => {
    const headers = ["Video ID", "Title", "Channel", "Views", "Likes", "Comments", "Duration", "Published", "Playlist"];
    const rows = filteredVideos.map((v) => [
      v.id,
      `"${(v.title || "").replace(/"/g, '""')}"`,
      `"${(v.channelTitle || "").replace(/"/g, '""')}"`,
      v.viewCount ?? 0,
      v.likeCount ?? 0,
      v.commentCount ?? 0,
      v.durationFormatted ?? "",
      v.publishedAt ?? "",
      v.playlistTitle ? `"${(v.playlistTitle || "").replace(/"/g, '""')}"` : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `history-${id}-videos.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Videos CSV downloaded");
  };

  const exportCommentsCSV = () => {
    const headers = ["Comment ID", "Video ID", "Video Title", "Author", "Text", "Likes", "Replies", "Published", "Tags"];
    const rows = filteredComments.map((c) => {
      const tags = getCommentCategories(c.textOriginal).map(getCategoryLabel).join("; ");
      return [
        c.id,
        c.videoId,
        `"${(c.videoTitle || "").replace(/"/g, '""')}"`,
        `"${(c.authorDisplayName || "").replace(/"/g, '""')}"`,
        `"${(c.textOriginal || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        c.likeCount ?? 0,
        c.replyCount ?? 0,
        c.publishedAt ?? "",
        `"${tags.replace(/"/g, '""')}"`,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `history-${id}-comments.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Comments CSV downloaded");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="mb-4">Sign in to view saved analysis.</p>
            <Button asChild>
              <Link href="/history">Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-destructive mb-4">{error.message}</p>
            <Button asChild>
              <Link href="/history">Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground sticky top-0 bg-background z-50">
        <div className="container py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/history">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold truncate max-w-md">{analysis.name || `Analysis #${id}`}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {analysis.completedAt
                  ? new Date(analysis.completedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportVideosCSV} disabled={videos.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Videos CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportCommentsCSV} disabled={comments.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Comments CSV
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href={`/intelligence?analysisId=${id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Analyze
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this run and all saved videos and comments. You cannot undo this.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate({ id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-secondary/30">
        <div className="container py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">{analysis.videosFetched ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comments</p>
              <p className="text-2xl font-bold">{formatNumber(analysis.commentsFetched ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{formatNumber(analysis.totalViews ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <p className="text-2xl font-bold">{formatNumber(analysis.totalLikes ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs defaultValue="videos">
          <TabsList>
            <TabsTrigger value="videos">
              <Play className="h-4 w-4 mr-2" />
              Videos ({filteredVideos.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({filteredComments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={videoSort} onValueChange={setVideoSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Most views</SelectItem>
                  <SelectItem value="likes">Most likes</SelectItem>
                  <SelectItem value="comments">Most comments</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[50vh] rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Channel</th>
                    <th className="text-right p-2">Views</th>
                    <th className="text-right p-2">Likes</th>
                    <th className="text-right p-2">Comments</th>
                    <th className="text-left p-2">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 max-w-[200px] truncate" title={v.title}>{v.title}</td>
                      <td className="p-2">{v.channelTitle}</td>
                      <td className="p-2 text-right">{formatNumber(v.viewCount ?? 0)}</td>
                      <td className="p-2 text-right">{formatNumber(v.likeCount ?? 0)}</td>
                      <td className="p-2 text-right">{formatNumber(v.commentCount ?? 0)}</td>
                      <td className="p-2 text-muted-foreground">{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={commentSort} onValueChange={setCommentSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-liked">Most liked</SelectItem>
                  <SelectItem value="most-replies">Most replies</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[50vh] rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">Author</th>
                    <th className="text-left p-2 min-w-[200px]">Text</th>
                    <th className="text-right p-2">Likes</th>
                    <th className="text-right p-2">Replies</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.map((c) => {
                    const tags = getCommentCategories(c.textOriginal).map(getCategoryLabel);
                    return (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">{c.authorDisplayName}</td>
                        <td className="p-2 max-w-[280px] line-clamp-2" title={c.textOriginal}>{c.textOriginal.replace(/\n/g, " ").substring(0, 120)}</td>
                        <td className="p-2 text-right">{c.likeCount ?? 0}</td>
                        <td className="p-2 text-right">{c.replyCount ?? 0}</td>
                        <td className="p-2 text-muted-foreground">{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : "—"}</td>
                        <td className="p-2">{tags.length > 0 ? tags.map((t) => <Badge key={t} variant="secondary" className="mr-1 text-xs">{t}</Badge>) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
