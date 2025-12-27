import { useState, useEffect, useCallback, useMemo } from "react";
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
  ArrowDown,
  ArrowUp,
  FileSpreadsheet,
  Table,
  Save,
  History,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | undefined;
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
  playlistId?: string;
  playlistTitle?: string;
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

interface ProcessingStatus {
  url: string;
  type: "playlist" | "video" | "channel" | "unknown";
  status: "pending" | "processing" | "completed" | "error";
  playlistTitle?: string;
  channelTitle?: string;
  videoCount?: number;
  videosProcessed?: number;
  commentsCount?: number;
  error?: string;
}

export default function BulkAnalyze() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const urlsParam = params.get("urls") || "";
  const apiKey = params.get("key") || "";
  const videoLimitParam = params.get("limit");
  const videoLimit = videoLimitParam ? parseInt(videoLimitParam) : null;
  const [, setLocation] = useLocation();

  // Parse URLs from query param
  const urls = useMemo(() => {
    return decodeURIComponent(urlsParam).split("\n").filter(u => u.trim().length > 0);
  }, [urlsParam]);

  const [videos, setVideos] = useState<Video[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentSearchQuery, setCommentSearchQuery] = useState("");
  const [commentSort, setCommentSort] = useState<string>("newest");
  const [videoFilter, setVideoFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("progress");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const { isAuthenticated } = useAuth();

  // Mutations
  const saveAnalysisMutation = trpc.analysis.save.useMutation({
    onSuccess: () => {
      toast.success("Analysis saved to history!");
      setHasSaved(true);
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
      setIsSaving(false);
    },
  });
  // Use the parseYouTubeInput function directly on the client side
  // since it doesn't require any API call - it's just URL parsing
  const parseUrl = (url: string) => {
    const decoded = decodeURIComponent(url.trim());
    const patterns = {
      video_id: [
        /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/watch\?v=([\w_-]+)(?:[\/&].*)?/i,
        /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/(?:v|embed|shorts|video|watch|live)\/([\w_-]+)(?:[\/&].*)?/i,
        /(?:http[s]?:\/\/)?youtu\.be\/([\w_-]+)(?:\?.*)?/i,
        /^([\w-]{11})$/i,
      ],
      playlist_id: [
        /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/playlist\?list=([\w_-]+)(?:&.*)?/i,
        /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/watch\?.*list=([\w_-]+)(?:&.*)?/i,
        /^((UU|UUSH|PL|FL|SP|OLAK)[A-Za-z0-9_-]+)$/i,
      ],
      channel_id: [
        /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/channel\/([\w_-]+)(?:\?.*)?/i,
        /^((UC|SC)[\w-]{22})$/i,
      ],
      channel_handle: [
        /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/@([^\/?]+)(?:\?.*)?/i,
      ],
    };

    for (const [type, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const result = regex.exec(decoded);
        if (result) {
          return { type, value: result[1], original: decoded };
        }
      }
    }
    return { type: "unknown", value: "", original: decoded };
  };
  const playlistMutation = trpc.youtube.getPlaylist.useMutation();
  const videosMutation = trpc.youtube.getPlaylistVideos.useMutation();
  const videoDetailsMutation = trpc.youtube.getVideoDetails.useMutation();
  const batchCommentsMutation = trpc.youtube.getBatchVideoComments.useMutation();
  const channelByIdMutation = trpc.youtube.getChannelById.useMutation();
  const channelByHandleMutation = trpc.youtube.getChannelByHandle.useMutation();

  // Initialize processing statuses
  useEffect(() => {
    if (urls.length > 0 && processingStatuses.length === 0) {
      setProcessingStatuses(urls.map(url => ({
        url,
        type: "unknown",
        status: "pending",
      })));
    }
  }, [urls]);

  // Start processing when component mounts
  useEffect(() => {
    if (urls.length > 0 && !isProcessing && processingStatuses.length > 0 && processingStatuses.every(s => s.status === "pending")) {
      startProcessing();
    }
  }, [processingStatuses]);

  const startProcessing = async () => {
    setIsProcessing(true);
    const allFetchedVideos: Video[] = [];
    const allFetchedComments: Comment[] = [];

    for (let i = 0; i < urls.length; i++) {
      setCurrentUrlIndex(i);
      const url = urls[i];

      // Update status to processing
      setProcessingStatuses(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: "processing" } : s
      ));

      try {
        // Parse the URL (client-side, no API call needed)
        const parsed = parseUrl(url);
        
        if (parsed.type === "unknown") {
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: "error", error: "Invalid URL format" } : s
          ));
          continue;
        }

        if (parsed.type === "playlist_id") {
          // Process playlist
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, type: "playlist" } : s
          ));

          // Get playlist info
          const playlistInfo = await playlistMutation.mutateAsync({ playlistId: parsed.value, apiKey });
          
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, playlistTitle: playlistInfo.title, videoCount: playlistInfo.videoCount } : s
          ));

          // Get all videos from playlist
          let pageToken: string | undefined;
          const playlistVideos: Video[] = [];
          
          do {
            const result = await videosMutation.mutateAsync({
              playlistId: parsed.value,
              apiKey,
              pageToken,
            });
            
            const videosWithPlaylist = result.videos.map(v => ({
              ...v,
              playlistId: parsed.value,
              playlistTitle: playlistInfo.title,
            }));
            
            playlistVideos.push(...videosWithPlaylist);
            pageToken = result.nextPageToken;
            
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, videosProcessed: playlistVideos.length } : s
            ));
          } while (pageToken);

          allFetchedVideos.push(...playlistVideos);
          setVideos([...allFetchedVideos]);

          // Fetch top 100 comments for each video
          let totalComments = 0;
          for (const video of playlistVideos) {
            try {
              const commentsResult = await batchCommentsMutation.mutateAsync({
                videoId: video.id,
                videoTitle: video.title,
                apiKey,
                maxComments: 100,
              });
              
              if (!commentsResult.commentsDisabled && commentsResult.comments.length > 0) {
                allFetchedComments.push(...commentsResult.comments);
                totalComments += commentsResult.comments.length;
                setAllComments([...allFetchedComments]);
              }
            } catch (err) {
              // Continue with other videos if one fails
              console.error(`Failed to fetch comments for video ${video.id}:`, err);
            }
            
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, commentsCount: totalComments } : s
            ));
          }

          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: "completed" } : s
          ));

        } else if (parsed.type === "video_id") {
          // Process single video
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, type: "video" } : s
          ));

          // Get video details
          const videoDetails = await videoDetailsMutation.mutateAsync({
            videoId: parsed.value,
            apiKey,
          });

          allFetchedVideos.push(videoDetails);
          setVideos([...allFetchedVideos]);
          
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, playlistTitle: videoDetails.title, videoCount: 1, videosProcessed: 1 } : s
          ));

          // Fetch top 100 comments
          try {
            const commentsResult = await batchCommentsMutation.mutateAsync({
              videoId: parsed.value,
              videoTitle: videoDetails.title,
              apiKey,
              maxComments: 100,
            });
            
            if (!commentsResult.commentsDisabled && commentsResult.comments.length > 0) {
              allFetchedComments.push(...commentsResult.comments);
              setAllComments([...allFetchedComments]);
              
              setProcessingStatuses(prev => prev.map((s, idx) => 
                idx === i ? { ...s, commentsCount: commentsResult.comments.length } : s
              ));
            }
          } catch (err) {
            console.error(`Failed to fetch comments for video ${parsed.value}:`, err);
          }

          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: "completed" } : s
          ));

        } else if (parsed.type === "channel_id" || parsed.type === "channel_handle") {
          // Process channel
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, type: "channel" } : s
          ));

          // Get channel info based on type
          let channelInfo;
          if (parsed.type === "channel_id") {
            channelInfo = await channelByIdMutation.mutateAsync({
              channelId: parsed.value,
              apiKey,
            });
          } else {
            channelInfo = await channelByHandleMutation.mutateAsync({
              handle: parsed.value,
              apiKey,
            });
          }

          if (!channelInfo.uploadsPlaylistId) {
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, status: "error", error: "Could not find channel uploads playlist" } : s
            ));
            continue;
          }

          // Determine effective video count based on limit
          const effectiveVideoCount = videoLimit ? Math.min(videoLimit, channelInfo.videoCount) : channelInfo.videoCount;
          
          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { 
              ...s, 
              channelTitle: channelInfo.title, 
              playlistTitle: `${channelInfo.title} (Uploads)${videoLimit ? ` - Limited to ${videoLimit}` : ""}`, 
              videoCount: effectiveVideoCount 
            } : s
          ));

          // Get videos from channel's uploads playlist (with limit)
          let pageToken: string | undefined;
          const channelVideos: Video[] = [];
          
          do {
            const result = await videosMutation.mutateAsync({
              playlistId: channelInfo.uploadsPlaylistId,
              apiKey,
              pageToken,
            });
            
            const videosWithChannel = result.videos.map(v => ({
              ...v,
              playlistId: channelInfo.uploadsPlaylistId,
              playlistTitle: `${channelInfo.title} (Uploads)`,
            }));
            
            channelVideos.push(...videosWithChannel);
            pageToken = result.nextPageToken;
            
            // Check if we've reached the video limit
            if (videoLimit && channelVideos.length >= videoLimit) {
              // Trim to exact limit
              channelVideos.splice(videoLimit);
              pageToken = undefined; // Stop fetching more
            }
            
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, videosProcessed: channelVideos.length } : s
            ));
          } while (pageToken);

          allFetchedVideos.push(...channelVideos);
          setVideos([...allFetchedVideos]);

          // Fetch top 100 comments for each video
          let totalComments = 0;
          for (const video of channelVideos) {
            try {
              const commentsResult = await batchCommentsMutation.mutateAsync({
                videoId: video.id,
                videoTitle: video.title,
                apiKey,
                maxComments: 100,
              });
              
              if (!commentsResult.commentsDisabled && commentsResult.comments.length > 0) {
                allFetchedComments.push(...commentsResult.comments);
                totalComments += commentsResult.comments.length;
                setAllComments([...allFetchedComments]);
              }
            } catch (err) {
              // Continue with other videos if one fails
              console.error(`Failed to fetch comments for video ${video.id}:`, err);
            }
            
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, commentsCount: totalComments } : s
            ));
          }

          setProcessingStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: "completed" } : s
          ));
        }

      } catch (error: any) {
        setProcessingStatuses(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: "error", error: error.message || "Failed to process" } : s
        ));
      }
    }

    setIsProcessing(false);
    setActiveTab("videos");
  };

  // Filter and sort comments
  const filteredComments = useMemo(() => {
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
    
    // Sort comments
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
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [allComments, commentSearchQuery, videoFilter, commentSort]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    if (!searchQuery) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        v.channelTitle.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  // Export functions
  const exportVideosCSV = () => {
    const headers = ["Video ID", "Title", "Channel", "Views", "Likes", "Comments", "Duration", "Published Date", "Playlist"];
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
    downloadFile(csv, "videos.csv", "text/csv");
  };

  const exportCommentsCSV = () => {
    const headers = ["Comment ID", "Video ID", "Video Title", "Author", "Comment Text", "Likes", "Replies", "Published Date"];
    const rows = allComments.map(c => [
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
    downloadFile(csv, "comments.csv", "text/csv");
  };

  const exportAllCSV = () => {
    // Combined export with video metadata and comments
    const headers = [
      "Video ID", "Video Title", "Channel", "Views", "Likes", "Video Comments Count", "Duration", "Video Published",
      "Comment ID", "Comment Author", "Comment Text", "Comment Likes", "Comment Replies", "Comment Date"
    ];
    
    const rows: string[][] = [];
    
    videos.forEach(video => {
      const videoComments = allComments.filter(c => c.videoId === video.id);
      
      if (videoComments.length === 0) {
        // Add video row without comments
        rows.push([
          video.id,
          `"${video.title.replace(/"/g, '""')}"`,
          `"${video.channelTitle.replace(/"/g, '""')}"`,
          String(video.viewCount),
          String(video.likeCount),
          String(video.commentCount),
          video.durationFormatted,
          new Date(video.publishedAt).toISOString().split("T")[0],
          "", "", "", "", "", ""
        ]);
      } else {
        // Add a row for each comment with video metadata
        videoComments.forEach(comment => {
          rows.push([
            video.id,
            `"${video.title.replace(/"/g, '""')}"`,
            `"${video.channelTitle.replace(/"/g, '""')}"`,
            String(video.viewCount),
            String(video.likeCount),
            String(video.commentCount),
            video.durationFormatted,
            new Date(video.publishedAt).toISOString().split("T")[0],
            comment.id,
            `"${comment.authorDisplayName.replace(/"/g, '""')}"`,
            `"${comment.textOriginal.replace(/"/g, '""').replace(/\n/g, " ")}"`,
            String(comment.likeCount),
            String(comment.replyCount),
            new Date(comment.publishedAt).toISOString().split("T")[0],
          ]);
        });
      }
    });
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadFile(csv, "youtube-analysis.csv", "text/csv");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to Google Sheets (opens in new tab with pre-filled data)
  const exportToGoogleSheets = () => {
    // Create a TSV (tab-separated) format that Google Sheets can import
    const headers = [
      "Video ID", "Video Title", "Channel", "Views", "Likes", "Video Comments Count", "Duration", "Video Published",
      "Comment ID", "Comment Author", "Comment Text", "Comment Likes", "Comment Replies", "Comment Date"
    ];
    
    const rows: string[][] = [];
    
    videos.forEach(video => {
      const videoComments = allComments.filter(c => c.videoId === video.id);
      
      if (videoComments.length === 0) {
        rows.push([
          video.id,
          video.title.replace(/\t/g, " "),
          video.channelTitle.replace(/\t/g, " "),
          String(video.viewCount),
          String(video.likeCount),
          String(video.commentCount),
          video.durationFormatted,
          new Date(video.publishedAt).toISOString().split("T")[0],
          "", "", "", "", "", ""
        ]);
      } else {
        videoComments.forEach(comment => {
          rows.push([
            video.id,
            video.title.replace(/\t/g, " "),
            video.channelTitle.replace(/\t/g, " "),
            String(video.viewCount),
            String(video.likeCount),
            String(video.commentCount),
            video.durationFormatted,
            new Date(video.publishedAt).toISOString().split("T")[0],
            comment.id,
            comment.authorDisplayName.replace(/\t/g, " "),
            comment.textOriginal.replace(/\t/g, " ").replace(/\n/g, " ").substring(0, 500),
            String(comment.likeCount),
            String(comment.replyCount),
            new Date(comment.publishedAt).toISOString().split("T")[0],
          ]);
        });
      }
    });
    
    // Create CSV content
    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    // Download as CSV first (Google Sheets can import CSV)
    downloadFile(csvContent, "youtube-analysis-for-sheets.csv", "text/csv");
    
    // Open Google Sheets import page
    window.open("https://sheets.google.com/create", "_blank");
  };

  const saveAnalysis = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save your analysis");
      return;
    }
    
    if (videos.length === 0) {
      toast.error("No data to save");
      return;
    }
    
    setIsSaving(true);
    
    // Generate a name based on the first playlist/channel or video
    const firstStatus = processingStatuses.find(s => s.playlistTitle || s.channelTitle);
    const name = firstStatus?.playlistTitle || firstStatus?.channelTitle || 
      `Analysis of ${videos.length} videos`;
    
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
    
    saveAnalysisMutation.mutate({
      name,
      inputUrls: urls.join("\n"),
      videosFetched: videos.length,
      commentsFetched: allComments.length,
      totalViews,
      totalLikes,
      videosData: videos,
      commentsData: allComments,
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
    const totalVideoComments = videos.reduce((sum, v) => sum + v.commentCount, 0);
    
    return { totalViews, totalLikes, totalVideoComments };
  }, [videos]);

  const completedCount = processingStatuses.filter(s => s.status === "completed").length;
  const errorCount = processingStatuses.filter(s => s.status === "error").length;
  const overallProgress = urls.length > 0 ? (completedCount + errorCount) / urls.length * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground sticky top-0 bg-background z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Bulk Analysis</h1>
              <p className="text-sm text-muted-foreground">
                Processing {urls.length} URL{urls.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={exportVideosCSV}
              disabled={videos.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Videos CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={exportCommentsCSV}
              disabled={allComments.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Comments CSV
            </Button>
            <Button 
              variant="outline"
              onClick={exportAllCSV}
              disabled={videos.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button 
              onClick={exportToGoogleSheets}
              disabled={videos.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Google Sheets
            </Button>
            {isAuthenticated && (
              <>
                <Button 
                  variant="outline"
                  onClick={saveAnalysis}
                  disabled={videos.length === 0 || isSaving || hasSaved}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : hasSaved ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {hasSaved ? "Saved" : "Save"}
                </Button>
                <Link href="/history">
                  <Button variant="ghost" size="icon">
                    <History className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Overall Progress */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {urls.length} completed
              {errorCount > 0 && <span className="text-destructive ml-2">({errorCount} errors)</span>}
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <p className="text-sm text-muted-foreground">Video Comments</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalVideoComments)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fetched Comments</p>
              <p className="text-2xl font-bold">{formatNumber(allComments.length)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="progress" className="gap-2">
                <Loader2 className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
                Progress
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Play className="h-4 w-4" />
                Videos ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({allComments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4" forceMount>
            <div className="space-y-3">
              {processingStatuses.length === 0 ? (
                <Card className="border">
                  <CardContent className="p-4 text-center text-muted-foreground">
                    No URLs being processed
                  </CardContent>
                </Card>
              ) : processingStatuses.map((status, index) => (
                <Card key={index} className={`border ${status.status === "processing" ? "border-primary" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {status.status === "pending" && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        {status.status === "processing" && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          </div>
                        )}
                        {status.status === "completed" && (
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                        {status.status === "error" && (
                          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{status.url}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {status.type !== "unknown" && (
                            <Badge variant="secondary">{status.type}</Badge>
                          )}
                          {status.channelTitle && (
                            <span className="truncate font-medium">{status.channelTitle}</span>
                          )}
                          {status.playlistTitle && !status.channelTitle && (
                            <span className="truncate">{status.playlistTitle}</span>
                          )}
                          {status.videosProcessed !== undefined && status.videoCount !== undefined && (
                            <span>{status.videosProcessed}/{status.videoCount} videos</span>
                          )}
                          {status.commentsCount !== undefined && (
                            <span>{status.commentsCount} comments</span>
                          )}
                          {status.error && (
                            <div className="flex flex-col gap-1">
                              <span className="text-destructive font-medium">Error:</span>
                              <span className="text-destructive text-xs break-all">{status.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="border hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold line-clamp-2 mb-1">
                              {video.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {video.channelTitle}
                            </p>
                          </div>
                          <a
                            href={`https://youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
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
                            <Clock className="h-3.5 w-3.5" />
                            {video.durationFormatted}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {video.playlistTitle && (
                          <Badge variant="outline" className="mt-2">
                            {video.playlistTitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
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
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              Showing {filteredComments.length} of {allComments.length} comments
            </p>

            <div className="space-y-3">
              {filteredComments.slice(0, 200).map((comment) => (
                <Card key={comment.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={comment.authorProfileImageUrl}
                        alt={comment.authorDisplayName}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium">{comment.authorDisplayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {comment.videoTitle && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {comment.videoTitle.substring(0, 40)}...
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {comment.textOriginal}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {comment.replyCount} replies
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredComments.length > 200 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Showing first 200 comments. Export to CSV to see all {filteredComments.length} comments.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
