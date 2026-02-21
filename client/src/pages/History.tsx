import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { getLastRun } from "@/lib/lastRunStorage";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Calendar, 
  Play, 
  MessageSquare, 
  Eye, 
  ThumbsUp,
  FileSpreadsheet,
  Loader2,
  History as HistoryIcon,
  AlertCircle,
  Brain
} from "lucide-react";
import { motion } from "framer-motion";
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

interface Video {
  id: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationFormatted: string;
  publishedAt: string;
  playlistTitle?: string;
}

interface Comment {
  id: string;
  videoId: string;
  videoTitle?: string;
  authorDisplayName: string;
  textOriginal: string;
  likeCount: number;
  replyCount: number;
  publishedAt: string;
}

export default function History() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const analysisListQuery = trpc.analysis.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const getAnalysisQuery = trpc.analysis.getById.useQuery(
    { id: downloadingId || 0 },
    { enabled: downloadingId !== null }
  );

  const deleteMutation = trpc.analysis.delete.useMutation({
    onSuccess: () => {
      toast.success("Analysis deleted successfully");
      analysisListQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadVideosCSV = (videos: Video[], name: string) => {
    const headers = ["Video ID", "Title", "Channel", "Views", "Likes", "Comments", "Duration", "Published", "Playlist"];
    const rows = videos.map(v => [
      v.id,
      `"${v.title.replace(/"/g, '""')}"`,
      `"${v.channelTitle.replace(/"/g, '""')}"`,
      v.viewCount,
      v.likeCount,
      v.commentCount,
      v.durationFormatted,
      new Date(v.publishedAt).toISOString().split("T")[0],
      v.playlistTitle ? `"${v.playlistTitle.replace(/"/g, '""')}"` : "",
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, "_")}_videos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCommentsCSV = (comments: Comment[], name: string) => {
    const headers = ["Comment ID", "Video ID", "Video Title", "Author", "Comment", "Likes", "Replies", "Published"];
    const rows = comments.map(c => [
      c.id,
      c.videoId,
      `"${(c.videoTitle || "").replace(/"/g, '""')}"`,
      `"${c.authorDisplayName.replace(/"/g, '""')}"`,
      `"${c.textOriginal.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.likeCount,
      c.replyCount,
      new Date(c.publishedAt).toISOString().split("T")[0],
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, "_")}_comments.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (id: number, type: "videos" | "comments") => {
    setDownloadingId(id);
    
    // Wait for query to complete
    const checkData = () => {
      if (getAnalysisQuery.data) {
        const analysis = getAnalysisQuery.data;
        const name = analysis.name || `analysis_${id}`;
        
        if (type === "videos" && analysis.videosData) {
          downloadVideosCSV(analysis.videosData as Video[], name);
        } else if (type === "comments" && analysis.commentsData) {
          downloadCommentsCSV(analysis.commentsData as Comment[], name);
        }
        
        setDownloadingId(null);
        toast.success(`${type === "videos" ? "Videos" : "Comments"} CSV downloaded`);
      }
    };
    
    // Check immediately if data is already available
    setTimeout(checkData, 500);
  };

  const lastRun = getLastRun();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b-2 border-foreground">
          <div className="container py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-bold text-xl tracking-tight">Playlist Analyzer</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 container py-8">
          <div className="flex items-center gap-3 mb-6">
            <HistoryIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Saved & Recent</h1>
              <p className="text-muted-foreground">Your last run is saved on this device. Sign in to save to the cloud and see runs on any device.</p>
            </div>
          </div>

          {lastRun ? (
            <Card className="border-2 border-foreground max-w-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{lastRun.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(lastRun.completedAt).toLocaleDateString("en-US", { dateStyle: "medium" })} · {lastRun.videosFetched} videos · {lastRun.commentsFetched} comments
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href="/history/local">View</Link>
                    </Button>
                    <Button variant="default" asChild className="gap-2">
                      <Link href="/intelligence?source=local">
                        <Brain className="h-4 w-4" />
                        Comment Intelligence
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const v = lastRun.videosData as Video[];
                      const headers = ["Video ID", "Title", "Channel", "Views", "Likes", "Comments", "Duration", "Published", "Playlist"];
                      const rows = v.map((vid: Video) => [
                        vid.id,
                        `"${(vid.title || "").replace(/"/g, '""')}"`,
                        `"${(vid.channelTitle || "").replace(/"/g, '""')}"`,
                        vid.viewCount,
                        vid.likeCount,
                        vid.commentCount,
                        vid.durationFormatted || "",
                        vid.publishedAt ? new Date(vid.publishedAt).toISOString().split("T")[0] : "",
                        vid.playlistTitle ? `"${(vid.playlistTitle || "").replace(/"/g, '""')}"` : "",
                      ]);
                      const csv = [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `videos_${lastRun.name.replace(/[^a-z0-9]/gi, "_")}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Videos CSV downloaded");
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Videos CSV
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={getLoginUrl()}>Sign in to save to cloud</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md border-2 border-dashed">
              <CardHeader className="text-center">
                <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle>No saved run yet</CardTitle>
                <CardDescription>
                  Run a bulk analysis from Home. Your last run will appear here (on this device). Sign in to save to the cloud.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 items-center">
                <Button asChild>
                  <Link href="/">Start analysis</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/images/logo-placeholder.png" 
                alt="YouTube Playlist Analyzer" 
                className="h-10 w-10"
              />
              <span className="font-bold text-xl tracking-tight">Playlist Analyzer</span>
            </Link>
          </div>
          <span className="text-sm text-muted-foreground">
            Welcome, {user?.name || "User"}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <HistoryIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Analysis History</h1>
              <p className="text-muted-foreground">View and download your past analyses</p>
            </div>
          </div>

          {analysisListQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analysisListQuery.data?.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-12 text-center">
                <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any analyses yet. Complete an analysis and save it to see it here.
                </p>
                <Button asChild>
                  <Link href="/">Start New Analysis</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysisListQuery.data?.map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-2 border-foreground hover:bg-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg truncate">
                              {analysis.name || `Analysis #${analysis.id}`}
                            </h3>
                            <Badge variant={analysis.status === "completed" ? "default" : "secondary"}>
                              {analysis.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(analysis.startedAt)}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                <span className="font-medium">{analysis.videosFetched}</span> videos
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                <span className="font-medium">{formatNumber(analysis.commentsFetched || 0)}</span> comments
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                <span className="font-medium">{formatNumber(analysis.totalViews || 0)}</span> views
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                <span className="font-medium">{formatNumber(analysis.totalLikes || 0)}</span> likes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="gap-2"
                          >
                            <Link href={`/history/${analysis.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(analysis.id, "videos")}
                            disabled={downloadingId === analysis.id}
                            className="gap-2"
                          >
                            {downloadingId === analysis.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4" />
                            )}
                            Videos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(analysis.id, "comments")}
                            disabled={downloadingId === analysis.id}
                            className="gap-2"
                          >
                            {downloadingId === analysis.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Comments
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="gap-2"
                          >
                            <Link href={`/intelligence?analysisId=${analysis.id}`}>
                              <Brain className="h-4 w-4" />
                              Analyze
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this analysis? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ id: analysis.id })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>YouTube Playlist Analyzer — Built with React & YouTube Data API v3</p>
        </div>
      </footer>
    </div>
  );
}
