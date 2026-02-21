import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLastRun, clearLastRun } from "@/lib/lastRunStorage";
import { ArrowLeft, Download, Trash2, Calendar, Play, MessageSquare, Eye, ThumbsUp, Search } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function HistoryLocal() {
  const [, setLocation] = useLocation();
  const [videoSearch, setVideoSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [videoSort, setVideoSort] = useState("views");
  const [commentSort, setCommentSort] = useState("most-liked");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const lastRun = getLastRun();
  const videos = (lastRun?.videosData ?? []) as Array<{
    id: string;
    title?: string;
    channelTitle?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    durationFormatted?: string;
    publishedAt?: string;
    playlistTitle?: string;
  }>;
  const comments = (lastRun?.commentsData ?? []) as Array<{
    id: string;
    videoId?: string;
    videoTitle?: string;
    authorDisplayName?: string;
    textOriginal?: string;
    likeCount?: number;
    replyCount?: number;
    publishedAt?: string;
  }>;

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (videoSearch.trim()) {
      const q = videoSearch.toLowerCase();
      list = list.filter(
        (v) =>
          (v.title || "").toLowerCase().includes(q) ||
          (v.channelTitle || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      switch (videoSort) {
        case "views": return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        case "likes": return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case "comments": return (b.commentCount ?? 0) - (a.commentCount ?? 0);
        case "newest": return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        default: return 0;
      }
    });
  }, [videos, videoSearch, videoSort]);

  const filteredComments = useMemo(() => {
    let list = comments;
    if (commentSearch.trim()) {
      const q = commentSearch.toLowerCase();
      list = list.filter(
        (c) =>
          (c.textOriginal || "").toLowerCase().includes(q) ||
          (c.authorDisplayName || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      switch (commentSort) {
        case "most-liked": return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case "most-replies": return (b.replyCount ?? 0) - (a.replyCount ?? 0);
        case "newest": return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        default: return 0;
      }
    });
  }, [comments, commentSearch, commentSort]);

  const formatNumber = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : String(n));

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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `last-run-videos.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Videos CSV downloaded");
  };

  const exportCommentsCSV = () => {
    const headers = ["Comment ID", "Video ID", "Video Title", "Author", "Text", "Likes", "Replies", "Published"];
    const rows = filteredComments.map((c) => [
      c.id,
      c.videoId ?? "",
      `"${(c.videoTitle || "").replace(/"/g, '""')}"`,
      `"${(c.authorDisplayName || "").replace(/"/g, '""')}"`,
      `"${(c.textOriginal || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.likeCount ?? 0,
      c.replyCount ?? 0,
      c.publishedAt ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `last-run-comments.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Comments CSV downloaded");
  };

  const handleClear = () => {
    clearLastRun();
    setShowDeleteConfirm(false);
    toast.success("Last run cleared");
    setLocation("/history");
  };

  if (!lastRun) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No saved run on this device. Run a bulk analysis from Home first.</p>
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
              <Link href="/history"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold truncate max-w-md">{lastRun.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {new Date(lastRun.completedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                <span className="text-muted-foreground/80">· This device only</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportVideosCSV} disabled={videos.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Videos CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportCommentsCSV} disabled={comments.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Comments CSV
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Play className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{lastRun.videosFetched}</p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{lastRun.commentsFetched}</p>
                <p className="text-sm text-muted-foreground">Comments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="videos">
          <TabsList className="mb-4">
            <TabsTrigger value="videos" className="gap-2"><Play className="h-4 w-4" /> Videos ({filteredVideos.length})</TabsTrigger>
            <TabsTrigger value="comments" className="gap-2"><MessageSquare className="h-4 w-4" /> Comments ({filteredComments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="videos" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search videos..." value={videoSearch} onChange={(e) => setVideoSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={videoSort} onValueChange={setVideoSort}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Most views</SelectItem>
                  <SelectItem value="likes">Most likes</SelectItem>
                  <SelectItem value="comments">Most comments</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Title</th>
                    <th className="text-left p-2 font-medium">Channel</th>
                    <th className="text-right p-2 font-medium">Views</th>
                    <th className="text-right p-2 font-medium">Likes</th>
                    <th className="text-right p-2 font-medium">Comments</th>
                    <th className="text-left p-2 font-medium">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="p-2 max-w-[200px] truncate" title={v.title}>{v.title}</td>
                      <td className="p-2 text-muted-foreground max-w-[120px] truncate">{v.channelTitle}</td>
                      <td className="p-2 text-right">{formatNumber(v.viewCount ?? 0)}</td>
                      <td className="p-2 text-right">{formatNumber(v.likeCount ?? 0)}</td>
                      <td className="p-2 text-right">{formatNumber(v.commentCount ?? 0)}</td>
                      <td className="p-2 text-muted-foreground">{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="comments" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search comments..." value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={commentSort} onValueChange={setCommentSort}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-liked">Most liked</SelectItem>
                  <SelectItem value="most-replies">Most replies</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {filteredComments.slice(0, 300).map((c) => (
                <Card key={c.id} className="p-3">
                  <p className="text-sm font-medium">{c.authorDisplayName}</p>
                  <p className="text-sm text-muted-foreground break-words">{c.textOriginal}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {c.likeCount ?? 0}</span>
                    <span>{c.replyCount ?? 0} replies</span>
                    <span>{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : ""}</span>
                  </div>
                </Card>
              ))}
            </div>
            {filteredComments.length > 300 && <p className="text-sm text-muted-foreground">Showing first 300. Export CSV for all.</p>}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear last run?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the saved run from this device. You can run a new analysis anytime from Home.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground">Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
