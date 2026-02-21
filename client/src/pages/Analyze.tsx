import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Play, 
  MessageSquare, 
  Eye, 
  ThumbsUp, 
  Clock, 
  Download, 
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquareDashed,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookmarkPlus,
  BookmarkCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SplitPaneComments } from "@/components/SplitPaneComments";
import { LayoutGrid, Square, BarChart2 } from "lucide-react";
import { getCommentCategories, getCategoryLabel, filterByCategory } from "@/lib/commentTags";

interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  durationFormatted: string;
  viewCount: number;
  viewCountFormatted: string;
  likeCount: number;
  likeCountFormatted: string;
  commentCount: number;
  commentCountFormatted: string;
  publishedAt: string;
  tags: string[];
}

interface Comment {
  id: string;
  videoId: string;
  videoTitle?: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelId?: string;
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  replyCount: number;
  publishedAt: string;
  updatedAt?: string;
  replies: Array<{
    id: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    textDisplay: string;
    likeCount: number;
    publishedAt: string;
  }>;
}

interface BatchProgress {
  currentVideo: number;
  totalVideos: number;
  currentVideoTitle: string;
  commentsFetched: number;
  videosWithComments: number;
  videosWithDisabledComments: number;
  errors: number;
}

export default function Analyze() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const playlistId = params.get("playlist") || "";
  const apiKey = params.get("key") || "";
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentSearchQuery, setCommentSearchQuery] = useState("");
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingBatchComments, setLoadingBatchComments] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("videos");
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [videoFilter, setVideoFilter] = useState<string>("all");
  const [commentSort, setCommentSort] = useState<string>("newest");
  const [allCommentSort, setAllCommentSort] = useState<string>("newest");
  const [reportCategory, setReportCategory] = useState<string>("all");
  const [reportSort, setReportSort] = useState<string>("most-liked");
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    // Check localStorage for auto-save preference
    const saved = localStorage.getItem("youtube_auto_save_playlists");
    return saved === "true";
  });
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const fetchCommentsAbortRef = useRef(false);

  // Fetch playlist info
  const playlistMutation = trpc.youtube.getPlaylist.useMutation();
  const videosMutation = trpc.youtube.getPlaylistVideos.useMutation();
  const commentsMutation = trpc.youtube.getVideoComments.useMutation();
  const batchCommentsMutation = trpc.youtube.getBatchVideoComments.useMutation();
  
  // Saved playlist mutations
  const savePlaylistMutation = trpc.savedPlaylists.save.useMutation();
  const savedPlaylistQuery = trpc.savedPlaylists.getByYoutubeId.useQuery(
    { youtubePlaylistId: playlistId },
    { enabled: !!playlistId && isAuthenticated }
  );
  const updateLastRunMutation = trpc.savedPlaylists.updateLastRun.useMutation();
  const saveVideosMutation = trpc.playlistVideos.saveMany.useMutation();

  // Check if playlist is already saved
  useEffect(() => {
    if (savedPlaylistQuery.data) {
      setIsSaved(true);
    }
  }, [savedPlaylistQuery.data]);

  // Auto-save playlist after videos are loaded
  useEffect(() => {
    const performAutoSave = async () => {
      // Only auto-save if:
      // 1. Auto-save is enabled
      // 2. User is authenticated
      // 3. Videos have been loaded
      // 4. Playlist data is available
      // 5. Not already saved
      // 6. Haven't already auto-saved this session
      if (
        autoSaveEnabled &&
        isAuthenticated &&
        videos.length > 0 &&
        playlistMutation.data &&
        !isSaved &&
        !hasAutoSaved &&
        !loadingVideos
      ) {
        setHasAutoSaved(true);
        try {
          const result = await savePlaylistMutation.mutateAsync({
            youtubePlaylistId: playlistId,
            title: playlistMutation.data.title || "Untitled Playlist",
            description: playlistMutation.data.description || "",
            channelTitle: playlistMutation.data.channelTitle || "",
            thumbnailUrl: playlistMutation.data.thumbnailUrl || "",
            videoCount: videos.length,
          });

          // Save videos to the playlist
          if (videos.length > 0) {
            await saveVideosMutation.mutateAsync({
              savedPlaylistId: result.id,
              videos: videos.map(v => ({
                videoYoutubeId: v.id,
                videoTitle: v.title,
                thumbnailUrl: v.thumbnailUrl,
                viewCount: v.viewCount,
                likeCount: v.likeCount,
                commentCount: v.commentCount,
                publishedAt: new Date(v.publishedAt),
              })),
            });
          }

          setIsSaved(true);
          toast.success("Playlist auto-saved to library!", {
            description: "You can disable auto-save in the header.",
            duration: 4000,
          });
          savedPlaylistQuery.refetch();
        } catch (error) {
          console.error("Auto-save failed:", error);
          // Don't show error toast for auto-save to avoid confusion
        }
      }
    };

    performAutoSave();
  }, [videos.length, playlistMutation.data, autoSaveEnabled, isAuthenticated, isSaved, hasAutoSaved, loadingVideos]);

  // Load playlist on mount
  useEffect(() => {
    if (playlistId && apiKey) {
      loadPlaylist();
    }
  }, [playlistId, apiKey]);

  // Save playlist to library
  const handleSavePlaylist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save playlists");
      return;
    }
    if (!playlistMutation.data) {
      toast.error("Playlist data not loaded yet");
      return;
    }

    setIsSaving(true);
    try {
      const result = await savePlaylistMutation.mutateAsync({
        youtubePlaylistId: playlistId,
        title: playlistMutation.data.title || "Untitled Playlist",
        description: playlistMutation.data.description || "",
        channelTitle: playlistMutation.data.channelTitle || "",
        thumbnailUrl: playlistMutation.data.thumbnailUrl || "",
        videoCount: videos.length,
      });

      // Save videos to the playlist
      if (videos.length > 0) {
        await saveVideosMutation.mutateAsync({
          savedPlaylistId: result.id,
          videos: videos.map(v => ({
            videoYoutubeId: v.id,
            videoTitle: v.title,
            thumbnailUrl: v.thumbnailUrl,
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            publishedAt: new Date(v.publishedAt),
          })),
        });
      }

      // Update last run stats
      await updateLastRunMutation.mutateAsync({
        id: result.id,
        videoCount: videos.length,
        commentCount: allComments.length,
      });

      setIsSaved(true);
      toast.success(result.isNew ? "Playlist saved to library!" : "Playlist updated!");
      savedPlaylistQuery.refetch();
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toast.error("Failed to save playlist");
    } finally {
      setIsSaving(false);
    }
  };

  const loadPlaylist = async () => {
    try {
      await playlistMutation.mutateAsync({ playlistId, apiKey });
      await loadAllVideos();
    } catch (error) {
      console.error("Failed to load playlist:", error);
    }
  };

  const loadAllVideos = async () => {
    setLoadingVideos(true);
    setProgress(0);
    const allVideos: Video[] = [];
    let pageToken: string | undefined;
    let page = 0;

    try {
      do {
        const result = await videosMutation.mutateAsync({
          playlistId,
          apiKey,
          pageToken,
        });
        allVideos.push(...result.videos);
        pageToken = result.nextPageToken;
        page++;
        setProgress(Math.min((page * 50 / (playlistMutation.data?.videoCount || 100)) * 100, 95));
        setVideos([...allVideos]);
      } while (pageToken);

      setProgress(100);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadVideoComments = async (video: Video) => {
    setSelectedVideo(video);
    setLoadingComments(true);
    setComments([]);

    try {
      const result = await commentsMutation.mutateAsync({
        videoId: video.id,
        apiKey,
        maxResults: 100,
      });
      setComments(result.comments);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Batch fetch all comments from all videos (can be stopped to save API cost)
  const fetchAllComments = useCallback(async () => {
    if (videos.length === 0) return;

    fetchCommentsAbortRef.current = false;
    setLoadingBatchComments(true);
    setAllComments([]);
    setActiveTab("all-comments");
    
    const progress: BatchProgress = {
      currentVideo: 0,
      totalVideos: videos.length,
      currentVideoTitle: "",
      commentsFetched: 0,
      videosWithComments: 0,
      videosWithDisabledComments: 0,
      errors: 0,
    };
    setBatchProgress(progress);

    const fetchedComments: Comment[] = [];

    for (let i = 0; i < videos.length; i++) {
      if (fetchCommentsAbortRef.current) {
        toast.info("Comment fetch stopped. You can export what was collected so far.");
        break;
      }

      const video = videos[i];
      progress.currentVideo = i + 1;
      progress.currentVideoTitle = video.title;
      setBatchProgress({ ...progress });

      try {
        const result = await batchCommentsMutation.mutateAsync({
          videoId: video.id,
          videoTitle: video.title,
          apiKey,
          maxComments: 200,
        });

        if (result.commentsDisabled) {
          progress.videosWithDisabledComments++;
        } else if (result.comments.length > 0) {
          progress.videosWithComments++;
          progress.commentsFetched += result.comments.length;
          fetchedComments.push(...result.comments);
          setAllComments([...fetchedComments]);
        }
      } catch (error) {
        console.error(`Failed to fetch comments for video ${video.id}:`, error);
        progress.errors++;
      }

      setBatchProgress({ ...progress });
    }

    setLoadingBatchComments(false);
  }, [videos, apiKey, batchCommentsMutation]);

  const stopFetchComments = useCallback(() => {
    fetchCommentsAbortRef.current = true;
  }, []);

  // Filter videos by search
  const filteredVideos = useMemo(() => {
    let filtered = videos;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.channelTitle.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [videos, searchQuery]);

  // Filter and sort comments by search
  const filteredComments = useMemo(() => {
    let filtered = comments;
    
    if (commentSearchQuery) {
      const query = commentSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.textOriginal.toLowerCase().includes(query) ||
          c.authorDisplayName.toLowerCase().includes(query)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (commentSort) {
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case "most-liked":
          return b.likeCount - a.likeCount;
        case "most-replies":
          return b.replyCount - a.replyCount;
        case "most-engagement":
          return b.likeCount + b.replyCount - (a.likeCount + a.replyCount);
        default:
          return 0;
      }
    });
    return sorted;
  }, [comments, commentSearchQuery, commentSort]);

  // Filter, sort all comments by search and video
  const filteredAllComments = useMemo(() => {
    let filtered = allComments;
    
    if (commentSearchQuery) {
      const query = commentSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.textOriginal.toLowerCase().includes(query) ||
          c.authorDisplayName.toLowerCase().includes(query) ||
          (c.videoTitle && c.videoTitle.toLowerCase().includes(query))
      );
    }
    
    if (videoFilter !== "all") {
      filtered = filtered.filter((c) => c.videoId === videoFilter);
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (allCommentSort) {
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case "most-liked":
          return b.likeCount - a.likeCount;
        case "most-replies":
          return b.replyCount - a.replyCount;
        case "most-engagement":
          return b.likeCount + b.replyCount - (a.likeCount + a.replyCount);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [allComments, commentSearchQuery, videoFilter, allCommentSort]);

  // Report view: category filter + sort (for analyst / media buyer / eCommerce)
  const reportComments = useMemo(() => {
    let list = filterByCategory(allComments, reportCategory, 5);
    if (commentSearchQuery) {
      const query = commentSearchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.textOriginal.toLowerCase().includes(query) ||
          c.authorDisplayName.toLowerCase().includes(query) ||
          (c.videoTitle && c.videoTitle.toLowerCase().includes(query))
      );
    }
    if (videoFilter !== "all") list = list.filter((c) => c.videoId === videoFilter);
    return [...list].sort((a, b) => {
      switch (reportSort) {
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case "most-liked":
          return b.likeCount - a.likeCount;
        case "most-replies":
          return b.replyCount - a.replyCount;
        case "most-engagement":
          return b.likeCount + b.replyCount - (a.likeCount + a.replyCount);
        default:
          return 0;
      }
    });
  }, [allComments, reportCategory, reportSort, commentSearchQuery, videoFilter]);

  // Calculate stats (for analyst / media buyer)
  const stats = useMemo(() => {
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.commentCount, 0);
    const avgViews = videos.length ? Math.round(totalViews / videos.length) : 0;
    const publishedDates = videos.map((v) => new Date(v.publishedAt).getTime()).filter(Boolean);
    const oldestPublished = publishedDates.length ? new Date(Math.min(...publishedDates)).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
    const newestPublished = publishedDates.length ? new Date(Math.max(...publishedDates)).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
    return { totalViews, totalLikes, totalComments, avgViews, oldestPublished, newestPublished };
  }, [videos]);

  // Export functions
  const exportJSON = () => {
    const data = {
      playlist: playlistMutation.data,
      videos,
      comments: allComments.length > 0 ? allComments : comments,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playlist-${playlistId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["Video ID", "Title", "Channel", "Views", "Likes", "Comments", "Duration", "Published"];
    const rows = videos.map((v) => [
      v.id,
      `"${v.title.replace(/"/g, '""')}"`,
      `"${v.channelTitle.replace(/"/g, '""')}"`,
      v.viewCount,
      v.likeCount,
      v.commentCount,
      v.durationFormatted,
      v.publishedAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playlist-${playlistId}-videos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCommentsCSV = (selectedOnly: boolean = false) => {
    const list = selectedOnly && selectedCommentIds.size > 0
      ? (allComments.length > 0 ? allComments : comments).filter((c) => selectedCommentIds.has(c.id))
      : allComments.length > 0 ? allComments : comments;
    const headers = ["Comment ID", "Video ID", "Video Title", "Author", "Text", "Likes", "Replies", "Published", "Tags"];
    const rows = list.map((c) => {
      const tags = getCommentCategories(c.textOriginal).map(getCategoryLabel).join("; ");
      return [
        c.id,
        c.videoId,
        `"${(c.videoTitle || "").replace(/"/g, '""')}"`,
        `"${c.authorDisplayName.replace(/"/g, '""')}"`,
        `"${c.textOriginal.replace(/"/g, '""').replace(/\n/g, " ")}"`,
        c.likeCount,
        c.replyCount,
        c.publishedAt,
        `"${tags.replace(/"/g, '""')}"`,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playlist-${playlistId}-comments${selectedOnly && selectedCommentIds.size > 0 ? "-selected" : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (list.length > 0) {
      toast.success(
        selectedOnly && selectedCommentIds.size > 0
          ? `Exported ${list.length} selected comments. Import in Google Sheets: File → Import → Upload.`
          : `Exported ${list.length} comments. To use in Google Sheets: File → Import → Upload the CSV.`
      );
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  if (!playlistId || !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Missing Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please provide a playlist ID and API key to analyze.
            </p>
            <Button asChild>
              <Link href="/">Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground sticky top-0 bg-background z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {playlistMutation.data?.title || "Loading..."}
              </h1>
              <p className="text-sm text-muted-foreground">
                {playlistMutation.data?.channelTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-Save Toggle */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-md bg-muted/50">
                <label className="text-xs text-muted-foreground cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => {
                      setAutoSaveEnabled(e.target.checked);
                      localStorage.setItem("youtube_auto_save_playlists", e.target.checked.toString());
                      toast.success(e.target.checked ? "Auto-save enabled" : "Auto-save disabled");
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Auto-save</span>
                </label>
              </div>
            )}
            {/* Save to Library Button */}
            <Button 
              variant={isSaved ? "outline" : "default"}
              onClick={handleSavePlaylist}
              disabled={isSaving || !playlistMutation.data}
              className={isSaved ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4 mr-2" />
              ) : (
                <BookmarkPlus className="h-4 w-4 mr-2" />
              )}
              {isSaved ? "Saved" : "Save to Library"}
            </Button>
            {isSaved && savedPlaylistQuery.data?.lastRunAt && (
              <span className="text-xs text-muted-foreground">
                Last run: {new Date(savedPlaylistQuery.data.lastRunAt).toLocaleDateString()}
              </span>
            )}
            <Button variant="outline" onClick={exportCSV} disabled={videos.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Videos CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportCommentsCSV(false)} 
              disabled={allComments.length === 0 && comments.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Comments CSV
            </Button>
            <Button variant="outline" onClick={exportJSON} disabled={videos.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar for Videos */}
      {loadingVideos && (
        <div className="border-b border-border">
          <div className="container py-2">
            <div className="flex items-center gap-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {videos.length} / {playlistMutation.data?.videoCount || "?"} videos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar for Batch Comments */}
      {loadingBatchComments && batchProgress && (
        <div className="border-b border-border bg-primary/5">
          <div className="container py-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Fetching comments from all videos...</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Video {batchProgress.currentVideo} of {batchProgress.totalVideos}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopFetchComments}
                    className="gap-1"
                  >
                    <Square className="h-3 w-3" />
                    Stop (save API cost)
                  </Button>
                </div>
              </div>
              <Progress 
                value={(batchProgress.currentVideo / batchProgress.totalVideos) * 100} 
                className="h-2"
              />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="truncate max-w-md">
                  Current: {batchProgress.currentVideoTitle}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {batchProgress.videosWithComments} with comments
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-yellow-500" />
                  {batchProgress.videosWithDisabledComments} disabled
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {batchProgress.commentsFetched} total comments
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">{videos.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Comments</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalComments)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fetched Comments</p>
              <p className="text-2xl font-bold">{formatNumber(allComments.length)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
              <p className="text-2xl font-bold">
                {stats.totalViews > 0
                  ? `${((stats.totalLikes + stats.totalComments) / stats.totalViews * 100).toFixed(2)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published range</p>
              <p className="text-lg font-bold">
                {stats.oldestPublished} – {stats.newestPublished}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="videos" className="gap-2">
                <Play className="h-4 w-4" />
                Videos ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Video Comments {selectedVideo && `(${comments.length})`}
              </TabsTrigger>
              <TabsTrigger value="all-comments" className="gap-2">
                <MessageSquareDashed className="h-4 w-4" />
                All Comments ({allComments.length})
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-2">
                <BarChart2 className="h-4 w-4" />
                Report ({reportComments.length})
              </TabsTrigger>
              <TabsTrigger value="split-view" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Split View
              </TabsTrigger>
            </TabsList>

            {/* Fetch All Comments Button */}
            <Button
              onClick={fetchAllComments}
              disabled={loadingBatchComments || videos.length === 0 || loadingVideos}
              className="gap-2"
            >
              {loadingBatchComments ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {loadingBatchComments ? "Fetching..." : "Fetch All Comments"}
            </Button>
          </div>

          <TabsContent value="videos" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Video List */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  >
                    <Card 
                      className="border-2 border-border hover:border-foreground transition-colors cursor-pointer"
                      onClick={() => {
                        loadVideoComments(video);
                        setActiveTab("comments");
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-40 h-24 object-cover rounded"
                            />
                            <Badge className="absolute bottom-1 right-1 bg-black/80">
                              {video.durationFormatted}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-2 mb-1">
                              {video.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {video.channelTitle}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {video.viewCountFormatted}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {video.likeCountFormatted}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {video.commentCountFormatted}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(video.publishedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {selectedVideo ? (
              <>
                {/* Selected Video Info */}
                <Card className="border-2 border-primary">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={selectedVideo.thumbnailUrl}
                        alt={selectedVideo.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-semibold">{selectedVideo.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedVideo.channelTitle}
                        </p>
                        <a
                          href={`https://youtube.com/watch?v=${selectedVideo.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-1 mt-1"
                        >
                          Watch on YouTube
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comment Search and Sort */}
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search comments..."
                      value={commentSearchQuery}
                      onChange={(e) => setCommentSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={commentSort} onValueChange={setCommentSort}>
                    <SelectTrigger className="w-[180px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">
                        <span className="flex items-center gap-2">
                          <ArrowDown className="h-3 w-3" /> Newest First
                        </span>
                      </SelectItem>
                      <SelectItem value="oldest">
                        <span className="flex items-center gap-2">
                          <ArrowUp className="h-3 w-3" /> Oldest First
                        </span>
                      </SelectItem>
                      <SelectItem value="most-liked">
                        <span className="flex items-center gap-2">
                          <ThumbsUp className="h-3 w-3" /> Most Liked
                        </span>
                      </SelectItem>
                      <SelectItem value="most-replies">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" /> Most Replies
                        </span>
                      </SelectItem>
                      <SelectItem value="most-engagement">
                        <span className="flex items-center gap-2">
                          <ThumbsUp className="h-3 w-3" /> Most Engagement
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Comments List */}
                {loadingComments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComments.map((comment) => (
                      <Card key={comment.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <img
                              src={comment.authorProfileImageUrl}
                              alt={comment.authorDisplayName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {comment.authorDisplayName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.publishedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p 
                                className="text-sm whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: comment.textDisplay }}
                              />
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  {comment.likeCount}
                                </span>
                                {comment.replyCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    {comment.replyCount} replies
                                  </span>
                                )}
                              </div>

                              {/* Replies */}
                              {comment.replies.length > 0 && (
                                <div className="mt-4 pl-4 border-l-2 border-border space-y-3">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex gap-2">
                                      <img
                                        src={reply.authorProfileImageUrl}
                                        alt={reply.authorDisplayName}
                                        className="w-6 h-6 rounded-full"
                                      />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {reply.authorDisplayName}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(reply.publishedAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p 
                                          className="text-sm"
                                          dangerouslySetInnerHTML={{ __html: reply.textDisplay }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {comments.length === 0 && !loadingComments && (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No comments found or comments are disabled for this video.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a video from the Videos tab to view its comments.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all-comments" className="space-y-4">
            {allComments.length > 0 ? (
              <>
                {/* Filters and Sort */}
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search all comments..."
                      value={commentSearchQuery}
                      onChange={(e) => setCommentSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={videoFilter} onValueChange={setVideoFilter}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by video" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Videos</SelectItem>
                      {videos.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title.substring(0, 35)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={allCommentSort} onValueChange={setAllCommentSort}>
                    <SelectTrigger className="w-[180px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">
                        <span className="flex items-center gap-2">
                          <ArrowDown className="h-3 w-3" /> Newest First
                        </span>
                      </SelectItem>
                      <SelectItem value="oldest">
                        <span className="flex items-center gap-2">
                          <ArrowUp className="h-3 w-3" /> Oldest First
                        </span>
                      </SelectItem>
                      <SelectItem value="most-liked">
                        <span className="flex items-center gap-2">
                          <ThumbsUp className="h-3 w-3" /> Most Liked
                        </span>
                      </SelectItem>
                      <SelectItem value="most-replies">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" /> Most Replies
                        </span>
                      </SelectItem>
                      <SelectItem value="most-engagement">
                        <span className="flex items-center gap-2">
                          <ThumbsUp className="h-3 w-3" /> Most Engagement (likes + replies)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Showing {filteredAllComments.length} of {allComments.length} comments</span>
                </div>

                {/* All Comments List */}
                <div className="space-y-4">
                  {filteredAllComments.slice(0, 100).map((comment) => (
                    <Card key={comment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <img
                            src={comment.authorProfileImageUrl}
                            alt={comment.authorDisplayName}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">
                                {comment.authorDisplayName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.publishedAt).toLocaleDateString()}
                              </span>
                              {comment.videoTitle && (
                                <Badge variant="secondary" className="text-xs">
                                  {comment.videoTitle.substring(0, 30)}...
                                </Badge>
                              )}
                            </div>
                            <p 
                              className="text-sm whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: comment.textDisplay }}
                            />
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {comment.likeCount}
                              </span>
                              {comment.replyCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  {comment.replyCount} replies
                                </span>
                              )}
                              <a
                                href={`https://youtube.com/watch?v=${comment.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary flex items-center gap-1"
                              >
                                View Video
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredAllComments.length > 100 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Showing first 100 comments. Use search or export to access all {filteredAllComments.length} comments.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquareDashed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No comments fetched yet.</p>
                <Button
                  onClick={fetchAllComments}
                  disabled={loadingBatchComments || videos.length === 0 || loadingVideos}
                  className="gap-2"
                >
                  {loadingBatchComments ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Fetch All Comments
                </Button>
                <p className="text-sm mt-4">
                  This will fetch comments from all {videos.length} videos in the playlist.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            {allComments.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Analyst report: filter by intent (POD, course, merch, product) or engagement. Select rows and export to CSV for Google Sheets (File → Import → Upload).
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search comments..."
                      value={commentSearchQuery}
                      onChange={(e) => setCommentSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={reportCategory} onValueChange={setReportCategory}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All comments</SelectItem>
                      <SelectItem value="pod">POD / Intent</SelectItem>
                      <SelectItem value="course">Course / Training</SelectItem>
                      <SelectItem value="merch">Merch / T-shirt</SelectItem>
                      <SelectItem value="product">Product / Buy</SelectItem>
                      <SelectItem value="high_engagement">High engagement (5+ likes+replies)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={videoFilter} onValueChange={setVideoFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Video" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Videos</SelectItem>
                      {videos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.title.substring(0, 35)}...</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={reportSort} onValueChange={setReportSort}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="most-liked">Most liked</SelectItem>
                      <SelectItem value="most-replies">Most replies</SelectItem>
                      <SelectItem value="most-engagement">Most engagement</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => {
                    const ids = new Set(reportComments.slice(0, 500).map((c) => c.id));
                    setSelectedCommentIds(ids);
                    toast.info(`Selected ${ids.size} comments (max 500 in view)`);
                  }}>
                    Select all in view
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCommentIds(new Set())}>
                    Clear selection
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportCommentsCSV(true)} disabled={selectedCommentIds.size === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export selected ({selectedCommentIds.size}) CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportCommentsCSV(false)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export all CSV
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {reportComments.length} comments · {selectedCommentIds.size} selected
                  </span>
                </div>
                <ScrollArea className="h-[60vh] rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 w-10">
                          <Checkbox
                            checked={reportComments.length > 0 && reportComments.slice(0, 100).every((c) => selectedCommentIds.has(c.id))}
                            onCheckedChange={(checked) => {
                              const slice = reportComments.slice(0, 100);
                              if (checked) {
                                setSelectedCommentIds((prev) => { const s = new Set(prev); slice.forEach((c) => s.add(c.id)); return s; });
                              } else {
                                setSelectedCommentIds((prev) => { const s = new Set(prev); slice.forEach((c) => s.delete(c.id)); return s; });
                              }
                            }}
                          />
                        </th>
                        <th className="text-left p-2">Video</th>
                        <th className="text-left p-2">Author</th>
                        <th className="text-left p-2 min-w-[200px]">Text</th>
                        <th className="text-right p-2">Likes</th>
                        <th className="text-right p-2">Replies</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportComments.slice(0, 500).map((c) => {
                        const tags = getCommentCategories(c.textOriginal).map(getCategoryLabel);
                        return (
                          <tr key={c.id} className="border-b hover:bg-muted/30">
                            <td className="p-2">
                              <Checkbox
                                checked={selectedCommentIds.has(c.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedCommentIds((prev) => {
                                    const s = new Set(prev);
                                    if (checked) s.add(c.id); else s.delete(c.id);
                                    return s;
                                  });
                                }}
                              />
                            </td>
                            <td className="p-2 max-w-[120px] truncate" title={c.videoTitle}>{c.videoTitle?.substring(0, 25)}...</td>
                            <td className="p-2">{c.authorDisplayName}</td>
                            <td className="p-2 max-w-[280px] line-clamp-2" title={c.textOriginal}>{c.textOriginal.replace(/\n/g, " ").substring(0, 150)}</td>
                            <td className="p-2 text-right">{c.likeCount}</td>
                            <td className="p-2 text-right">{c.replyCount}</td>
                            <td className="p-2 text-muted-foreground">{new Date(c.publishedAt).toLocaleDateString()}</td>
                            <td className="p-2">
                              {tags.length > 0 ? tags.map((t) => <Badge key={t} variant="secondary" className="mr-1 text-xs">{t}</Badge>) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>
                {reportComments.length > 500 && (
                  <p className="text-sm text-muted-foreground">Showing first 500. Use filters or export all to get full data.</p>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fetch comments first to see the Report view.</p>
                <Button onClick={fetchAllComments} disabled={loadingBatchComments || videos.length === 0} className="mt-4 gap-2">
                  {loadingBatchComments ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  Fetch All Comments
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="split-view" className="space-y-4">
            {allComments.length > 0 ? (
              <SplitPaneComments
                videos={videos}
                comments={allComments}
                selectedVideo={selectedVideo}
                onVideoSelect={(video) => {
                  setSelectedVideo(video);
                  loadVideoComments(video);
                }}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Fetch all comments first to use the split view.</p>
                <Button
                  onClick={fetchAllComments}
                  disabled={loadingBatchComments || videos.length === 0 || loadingVideos}
                  className="gap-2"
                >
                  {loadingBatchComments ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Fetch All Comments
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
