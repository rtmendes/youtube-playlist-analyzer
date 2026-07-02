import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getLastRun, clearLastRun } from "@/lib/lastRunStorage";
import { analyzeComments, CATEGORY_LABELS } from "@/lib/commentAnalysis";
import { getStarredCommentIds, toggleStarredCommentId } from "@/lib/starredComments";
import { ArrowLeft, Download, Trash2, Calendar, Play, MessageSquare, Eye, ThumbsUp, Search, FileSpreadsheet, Star, Copy } from "lucide-react";
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
  const [videoSort, setVideoSort] = useState("comments-desc");
  const [commentSort, setCommentSort] = useState("most-liked");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(new Set());
  const [starredCommentIds, setStarredCommentIdsState] = useState<Set<string>>(new Set());
  const [removedCommentIds, setRemovedCommentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setStarredCommentIdsState(getStarredCommentIds());
  }, []);

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
        case "views-desc": return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        case "views-asc": return (a.viewCount ?? 0) - (b.viewCount ?? 0);
        case "likes-desc": return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case "likes-asc": return (a.likeCount ?? 0) - (b.likeCount ?? 0);
        case "comments-desc": return (b.commentCount ?? 0) - (a.commentCount ?? 0);
        case "comments-asc": return (a.commentCount ?? 0) - (b.commentCount ?? 0);
        case "newest": return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        case "oldest": return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
        case "views": return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        case "likes": return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case "comments": return (b.commentCount ?? 0) - (a.commentCount ?? 0);
        default: return (b.commentCount ?? 0) - (a.commentCount ?? 0);
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

  const visibleComments = useMemo(
    () => filteredComments.filter((c) => !removedCommentIds.has(c.id)),
    [filteredComments, removedCommentIds]
  );

  const analyzedComments = useMemo(
    () => analyzeComments(visibleComments.map((c) => ({ ...c, textOriginal: c.textOriginal ?? "" }))),
    [visibleComments]
  );

  const toggleSelectComment = (id: string) => {
    setSelectedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllComments = () => setSelectedCommentIds(new Set(analyzedComments.map((c) => c.id)));
  const clearCommentSelection = () => setSelectedCommentIds(new Set());
  const selectedComments = useMemo(
    () => analyzedComments.filter((c) => selectedCommentIds.has(c.id)),
    [analyzedComments, selectedCommentIds]
  );

  const copySelectedToClipboard = () => {
    if (selectedComments.length === 0) {
      toast.error("Select at least one comment to copy");
      return;
    }
    const text = selectedComments
      .map((c) => `${c.authorDisplayName || "Anonymous"}: "${(c.textOriginal || "").replace(/"/g, '""')}"`)
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => toast.success(`Copied ${selectedComments.length} quote(s) to clipboard`));
  };

  const toggleStar = (id: string) => {
    toggleStarredCommentId(id);
    const next = getStarredCommentIds();
    setStarredCommentIdsState(next);
    toast.success(next.has(id) ? "Starred for later" : "Removed from starred");
  };
  const starSelected = () => {
    selectedComments.forEach((c) => toggleStarredCommentId(c.id));
    setStarredCommentIdsState(getStarredCommentIds());
    toast.success(`Starred ${selectedComments.length} comment(s)`);
  };
  const unstarSelected = () => {
    selectedComments.forEach((c) => toggleStarredCommentId(c.id));
    setStarredCommentIdsState(getStarredCommentIds());
    toast.success(`Unstarred ${selectedComments.length} comment(s)`);
  };

  const removeSelectedFromList = () => {
    setRemovedCommentIds((prev) => {
      const next = new Set(prev);
      selectedComments.forEach((c) => next.add(c.id));
      return next;
    });
    setSelectedCommentIds(new Set());
    toast.success(`Removed ${selectedComments.length} comment(s) from list`);
  };

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
    const toExport = selectedCommentIds.size > 0 ? selectedComments : analyzedComments;
    if (toExport.length === 0) {
      toast.error("No comments to export");
      return;
    }
    const headers = ["Comment ID", "Video ID", "Video Title", "Author", "Text", "Likes", "Replies", "Published", "Category", "Sentiment", "Marketing"];
    const rows = toExport.map((c) => [
      c.id,
      c.videoId ?? "",
      `"${(c.videoTitle || "").replace(/"/g, '""')}"`,
      `"${(c.authorDisplayName || "").replace(/"/g, '""')}"`,
      `"${(c.textOriginal || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.likeCount ?? 0,
      c.replyCount ?? 0,
      c.publishedAt ?? "",
      (c as { category?: string }).category ?? "",
      (c as { sentimentScore?: number }).sentimentScore ?? "",
      (c as { marketingPotential?: number }).marketingPotential ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = selectedCommentIds.size > 0 ? "selected-comments.csv" : "last-run-comments.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(selectedCommentIds.size > 0 ? `Exported ${selectedComments.length} selected comments` : "Comments CSV downloaded");
  };

  const exportToGoogleSheets = () => {
    const headers = [
      "Video ID", "Video Title", "Channel", "Views", "Likes", "Video Comments Count", "Duration", "Video Published",
      "Comment ID", "Comment Author", "Comment Text", "Comment Likes", "Comment Replies", "Comment Date", "Category", "Sentiment", "Marketing"
    ];
    const rows: string[][] = [];
    const commentsToExport = selectedCommentIds.size > 0 ? selectedComments : analyzedComments;
    if (selectedCommentIds.size > 0) {
      commentsToExport.forEach((comment) => {
        const video = filteredVideos.find((v) => v.id === comment.videoId);
        const ac = comment as typeof comment & { category?: string; sentimentScore?: number; marketingPotential?: number };
        rows.push([
          video?.id ?? "",
          `"${(video?.title || "").replace(/"/g, '""')}"`,
          `"${(video?.channelTitle || "").replace(/"/g, '""')}"`,
          String(video?.viewCount ?? 0),
          String(video?.likeCount ?? 0),
          String(video?.commentCount ?? 0),
          video?.durationFormatted ?? "",
          video?.publishedAt ?? "",
          comment.id ?? "",
          `"${(comment.authorDisplayName || "").replace(/"/g, '""')}"`,
          `"${(comment.textOriginal || "").replace(/"/g, '""').replace(/\n/g, " ").substring(0, 500)}"`,
          String(comment.likeCount ?? 0),
          String(comment.replyCount ?? 0),
          comment.publishedAt ?? "",
          ac.category ?? "",
          String(ac.sentimentScore ?? ""),
          String(ac.marketingPotential ?? ""),
        ]);
      });
    } else {
      filteredVideos.forEach((video) => {
        const videoComments = commentsToExport.filter((c) => c.videoId === video.id);
        if (videoComments.length === 0) {
          rows.push([
            video.id,
            `"${(video.title || "").replace(/"/g, '""')}"`,
            `"${(video.channelTitle || "").replace(/"/g, '""')}"`,
            String(video.viewCount ?? 0),
            String(video.likeCount ?? 0),
            String(video.commentCount ?? 0),
            video.durationFormatted ?? "",
            video.publishedAt ?? "",
            "", "", "", "", "", "", "", "", ""
          ]);
        } else {
          videoComments.forEach((comment) => {
            const ac = comment as typeof comment & { category?: string; sentimentScore?: number; marketingPotential?: number };
            rows.push([
              video.id,
              `"${(video.title || "").replace(/"/g, '""')}"`,
              `"${(video.channelTitle || "").replace(/"/g, '""')}"`,
              String(video.viewCount ?? 0),
              String(video.likeCount ?? 0),
              String(video.commentCount ?? 0),
              video.durationFormatted ?? "",
              video.publishedAt ?? "",
              comment.id ?? "",
              `"${(comment.authorDisplayName || "").replace(/"/g, '""')}"`,
              `"${(comment.textOriginal || "").replace(/"/g, '""').replace(/\n/g, " ").substring(0, 500)}"`,
              String(comment.likeCount ?? 0),
              String(comment.replyCount ?? 0),
              comment.publishedAt ?? "",
              ac.category ?? "",
              String(ac.sentimentScore ?? ""),
              String(ac.marketingPotential ?? ""),
            ]);
          });
        }
      });
    }
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
    a.download = "youtube-analysis-for-sheets.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(selectedCommentIds.size > 0
      ? `Exported ${selectedComments.length} selected to CSV. Import in Google Sheets: File → Import → Upload.`
      : "CSV downloaded. To view in Google Sheets: open sheets.google.com → File → Import → Upload the CSV file.");
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
                {new Date(lastRun.completedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
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
            <Button variant="secondary" size="sm" onClick={exportToGoogleSheets} disabled={videos.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Google Sheets
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
            <TabsTrigger value="comments" className="gap-2"><MessageSquare className="h-4 w-4" /> Comments ({analyzedComments.length})</TabsTrigger>
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
                  <SelectItem value="comments-desc">Most comments</SelectItem>
                  <SelectItem value="likes-desc">Most likes</SelectItem>
                  <SelectItem value="views-desc">Most views</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="views-asc">Fewest views</SelectItem>
                  <SelectItem value="likes-asc">Fewest likes</SelectItem>
                  <SelectItem value="comments-asc">Fewest comments</SelectItem>
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
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedCommentIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/50 border">
                <span className="text-sm font-medium">{selectedCommentIds.size} selected</span>
                <Button variant="outline" size="sm" onClick={selectAllComments}>Select all</Button>
                <Button variant="outline" size="sm" onClick={clearCommentSelection}>Clear</Button>
                <Button variant="outline" size="sm" onClick={copySelectedToClipboard} className="gap-1"><Copy className="h-3 w-3" /> Copy</Button>
                <Button variant="outline" size="sm" onClick={starSelected} className="gap-1"><Star className="h-3 w-3" /> Star</Button>
                <Button variant="outline" size="sm" onClick={unstarSelected} className="gap-1">Unstar</Button>
                <Button variant="outline" size="sm" onClick={removeSelectedFromList} className="gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Remove from list</Button>
                <Button variant="secondary" size="sm" onClick={exportCommentsCSV}>Export selected CSV</Button>
                <Button variant="secondary" size="sm" onClick={exportToGoogleSheets}>Export selected to Sheets</Button>
              </div>
            )}
            {selectedCommentIds.size === 0 && (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllComments}>Select all</Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Analysis (POD, sentiment, category) runs automatically. Star comments for later; export selection to CSV or Google Sheets.</p>
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {analyzedComments.slice(0, 300).map((c) => {
                const isStarred = starredCommentIds.has(c.id);
                const isSelected = selectedCommentIds.has(c.id);
                const ac = c as typeof c & { category?: string; label?: string; sentimentScore?: number; marketingPotential?: number };
                return (
                  <Card key={c.id} className={`p-3 ${isSelected ? "ring-2 ring-primary" : ""}`}>
                    <div className="flex gap-2 items-start">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectComment(c.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{c.authorDisplayName}</span>
                          {ac.category && ac.category !== "other" && (
                            <Badge variant="secondary" className="text-xs">{ac.label ?? ac.category}</Badge>
                          )}
                          {ac.sentimentScore != null && (
                            <span className="text-xs text-muted-foreground">Sentiment {ac.sentimentScore > 0 ? "+" : ""}{ac.sentimentScore}</span>
                          )}
                          {ac.marketingPotential != null && (
                            <span className="text-xs text-muted-foreground">Potential {ac.marketingPotential}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground break-words">{c.textOriginal}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><ThumbsUp className="h-3 w-3" /> {c.likeCount ?? 0}</span>
                          <span className="text-xs text-muted-foreground">{c.replyCount ?? 0} replies</span>
                          <span className="text-xs text-muted-foreground">{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : ""}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStar(c.id)} title={isStarred ? "Unstar" : "Star for later"}>
                            <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-500 text-amber-500" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCommentIds((p) => new Set(p).add(c.id)); navigator.clipboard.writeText(`"${(c.textOriginal || "").replace(/"/g, '""')}"`); toast.success("Copied to clipboard"); }} title="Copy quote">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setRemovedCommentIds((p) => new Set(p).add(c.id)); toast.success("Removed from list"); }} title="Remove from list">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {analyzedComments.length > 300 && <p className="text-sm text-muted-foreground">Showing first 300. Export CSV for all.</p>}
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
