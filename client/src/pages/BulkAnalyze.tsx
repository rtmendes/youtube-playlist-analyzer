import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Square,
  FileText,
  Brain,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getStoredYouTubeApiKey } from "@/lib/apiKeys";
import { setLastRun } from "@/lib/lastRunStorage";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DataTable } from "@/components/DataTable";
import { DynamicLayout } from "@/components/DynamicLayout";

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
  status: "pending" | "processing" | "completed" | "stopped" | "error";
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
  const apiKeyFromUrl = params.get("key") || "";
  const apiKey = apiKeyFromUrl || getStoredYouTubeApiKey();
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
  const abortRequestedRef = useRef(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentSearchQuery, setCommentSearchQuery] = useState("");
  const [commentSort, setCommentSort] = useState<string>("newest");
  const [videoFilter, setVideoFilter] = useState<string>("all");
  const [videoSort, setVideoSort] = useState<string>("comments-desc");
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("progress");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const { isAuthenticated } = useAuth();

  // Mutations
  const saveAnalysisMutation = trpc.analysis.save.useMutation({
    onSuccess: () => {
      setHasSaved(true);
      setIsSaving(false);
      toast.success("Saved to History. View, export, or delete anytime from History.");
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(`Could not save to cloud: ${error.message}. Your run is still saved on this device — see Saved & Recent.`);
    },
  });
  // Use the parseYouTubeInput function directly on the client side
  // since it doesn't require any API call - it's just URL parsing
  const parseUrl = (url: string) => {
    const decoded = decodeURIComponent(url.trim());
    const patterns = {
      video_id: [
        /(?:http[s]?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*&)?v=([\w_-]{11})(?:[&\/].*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w_-]{11})(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([\w_-]{11})(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/live\/([\w_-]{11})(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.)?youtube\.com\/v\/([\w_-]{11})(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?youtu\.be\/([\w_-]{11})(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?music\.youtube\.com\/watch\?(?:.*&)?v=([\w_-]{11})(?:[&\/].*)?/i,
        /^([\w-]{11})$/i,
      ],
      playlist_id: [
        /(?:http[s]?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/playlist\?(?:.*&)?list=([\w_-]+)(?:&.*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*&)?list=([\w_-]+)(?:&.*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/\?list=([\w_-]+)(?:&.*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\?list=([\w_-]+)(?:&.*)?/i,
        /(?:http[s]?:\/\/)?music\.youtube\.com\/playlist\?(?:.*&)?list=([\w_-]+)(?:&.*)?/i,
        /^((UU|UUSH|PL|FL|SP|OLAK|RD|RDMM|RDCLAK|RDGMEM)[A-Za-z0-9_-]+)$/i,
      ],
      channel_id: [
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/channel\/([\w_-]+)(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/user\/([\w_-]+)(?:[\/?].*)?/i,
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/c\/([\w_-]+)(?:[\/?].*)?/i,
        /^((UC|SC)[\w-]{22})$/i,
      ],
      channel_handle: [
        /(?:http[s]?:\/\/)?(?:www\.|m\.)?youtube\.com\/@([^\/?]+)(?:[\/?].*)?/i,
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

  const stopRun = useCallback(() => {
    abortRequestedRef.current = true;
    toast.info("Stopping and saving progress…");
  }, []);

  const startProcessing = async () => {
    setIsProcessing(true);
    abortRequestedRef.current = false;
    const allFetchedVideos: Video[] = [];
    const allFetchedComments: Comment[] = [];

    for (let i = 0; i < urls.length; i++) {
      if (abortRequestedRef.current) {
        setProcessingStatuses(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: "stopped" } : s
        ));
        break;
      }
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
            if (abortRequestedRef.current) break;
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

          if (abortRequestedRef.current) {
            // Show partial results: push whatever videos we gathered before stopping
            if (playlistVideos.length > 0) {
              allFetchedVideos.push(...playlistVideos);
              setVideos([...allFetchedVideos]);
            }
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, status: "stopped" } : s
            ));
            break;
          }
          allFetchedVideos.push(...playlistVideos);
          setVideos([...allFetchedVideos]);

          // Fetch top 100 comments for each video (stop when user requests abort)
          let totalComments = 0;
          for (const video of playlistVideos) {
            if (abortRequestedRef.current) break;
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
              console.error(`Failed to fetch comments for video ${video.id}:`, err);
            }
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, commentsCount: totalComments } : s
            ));
          }

          if (abortRequestedRef.current) {
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, status: "stopped" } : s
            ));
            break;
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
            if (abortRequestedRef.current) break;
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

          // Fetch top 100 comments for each video (stop when user requests abort)
          let totalComments = 0;
          for (const video of channelVideos) {
            if (abortRequestedRef.current) break;
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
              console.error(`Failed to fetch comments for video ${video.id}:`, err);
            }
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, commentsCount: totalComments } : s
            ));
          }

          if (abortRequestedRef.current) {
            setProcessingStatuses(prev => prev.map((s, idx) => 
              idx === i ? { ...s, status: "stopped" } : s
            ));
            break;
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

    const wasStopped = abortRequestedRef.current;
    setIsProcessing(false);
    setActiveTab("videos");
    if (wasStopped) toast.success("Stopped. Data gathered so far is shown below — use Videos, Spreadsheet, or Report tabs.");

    // Always save to localStorage so Saved/Recent show this run (even without sign-in)
    if (allFetchedVideos.length > 0) {
      const firstVideo = allFetchedVideos[0];
      const name = firstVideo?.playlistTitle || firstVideo?.channelTitle || `Analysis of ${allFetchedVideos.length} videos`;
      const totalViews = allFetchedVideos.reduce((sum, v) => sum + v.viewCount, 0);
      const totalLikes = allFetchedVideos.reduce((sum, v) => sum + v.likeCount, 0);
      setLastRun({
        name,
        completedAt: new Date().toISOString(),
        videosFetched: allFetchedVideos.length,
        commentsFetched: allFetchedComments.length,
        totalViews,
        totalLikes,
        videosData: allFetchedVideos,
        commentsData: allFetchedComments,
        inputUrls: urls.join("\n"),
      });
    }

    // Also save to server when signed in
    if (isAuthenticated && allFetchedVideos.length > 0) {
      const firstVideo = allFetchedVideos[0];
      const name = firstVideo?.playlistTitle || firstVideo?.channelTitle || `Analysis of ${allFetchedVideos.length} videos`;
      const totalViews = allFetchedVideos.reduce((sum, v) => sum + v.viewCount, 0);
      const totalLikes = allFetchedVideos.reduce((sum, v) => sum + v.likeCount, 0);
      saveAnalysisMutation.mutate({
        name,
        inputUrls: urls.join("\n"),
        videosFetched: allFetchedVideos.length,
        commentsFetched: allFetchedComments.length,
        totalViews,
        totalLikes,
        videosData: allFetchedVideos,
        commentsData: allFetchedComments,
      });
    }
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

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let list = videos;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.channelTitle.toLowerCase().includes(query)
      );
    }
    const sorted = [...list].sort((a, b) => {
      switch (videoSort) {
        case "views-desc": return b.viewCount - a.viewCount;
        case "views-asc": return a.viewCount - b.viewCount;
        case "likes-desc": return b.likeCount - a.likeCount;
        case "likes-asc": return a.likeCount - b.likeCount;
        case "comments-desc": return b.commentCount - a.commentCount;
        case "comments-asc": return a.commentCount - b.commentCount;
        case "newest": return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "oldest": return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        default: return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });
    return sorted;
  }, [videos, searchQuery, videoSort]);

  const toggleVideoSelection = (id: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllVideos = () => setSelectedVideoIds(new Set(filteredVideos.map((v) => v.id)));
  const deselectAllVideos = () => setSelectedVideoIds(new Set());
  const selectedVideos = useMemo(() => videos.filter((v) => selectedVideoIds.has(v.id)), [videos, selectedVideoIds]);

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
    
    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadFile(csvContent, "youtube-analysis-for-sheets.csv", "text/csv");
    toast.success("CSV downloaded. To view in Google Sheets: open sheets.google.com → File → Import → Upload the CSV file.");
  };

  const saveAnalysis = () => {
    if (!isAuthenticated) {
      toast.info("This run is saved on this device. Sign in to save to the cloud and see it in History.");
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

  // Report markdown for analysis presentation (tables, summary, link to Comment Intelligence)
  const reportMarkdown = useMemo(() => {
    if (videos.length === 0 && allComments.length === 0) return "";
    const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
    const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
    const topVideos = [...videos]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 15);
    let md = `## Analysis summary\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| **Videos** | ${videos.length} |\n`;
    md += `| **Comments fetched** | ${allComments.length} |\n`;
    md += `| **Total views** | ${totalViews.toLocaleString()} |\n`;
    md += `| **Total likes** | ${totalLikes.toLocaleString()} |\n\n`;
    md += `### Top videos by views\n\n`;
    md += `| # | Title | Channel | Views | Likes | Comments |\n`;
    md += `|---|-------|---------|-------|-------|----------|\n`;
    topVideos.forEach((v, i) => {
      const title = v.title.replace(/\|/g, " ").slice(0, 50);
      md += `| ${i + 1} | ${title}${title.length >= 50 ? "…" : ""} | ${v.channelTitle} | ${v.viewCount.toLocaleString()} | ${v.likeCount.toLocaleString()} | ${v.commentCount.toLocaleString()} |\n`;
    });
    md += `\n### Sentiment & product ideas\n\n`;
    md += `For **sentiment analysis**, **product ideas**, and **copywriting insights** from comments, open [Comment Intelligence](/intelligence?source=local) (or save this run and open it from **Saved & list**).\n`;
    return md;
  }, [videos, allComments]);

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
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {urls.length} completed
              {errorCount > 0 && <span className="text-destructive ml-2">({errorCount} errors)</span>}
            </span>
            {isProcessing && (
              <Button variant="destructive" size="sm" onClick={stopRun} className="gap-2 shrink-0">
                <Square className="h-4 w-4" />
                Stop run
              </Button>
            )}
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

      {/* Link results to Analysis & Report and Comment Intelligence */}
      {videos.length > 0 && (
        <div className="border-b border-border bg-primary/5">
          <div className="container py-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Use this run in:</span>
            <Link href="/analysis">
              <Button variant="secondary" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Analysis & Report
              </Button>
            </Link>
            <Link href="/intelligence?source=local">
              <Button variant="secondary" size="sm" className="gap-2">
                <Brain className="h-4 w-4" />
                Comment Intelligence
              </Button>
            </Link>
            <Link href="/history/local">
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                List view / Export
              </Button>
            </Link>
          </div>
        </div>
      )}

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
              <TabsTrigger value="spreadsheet" className="gap-2">
                <Table className="h-4 w-4" />
                Spreadsheet
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-2">
                <FileText className="h-4 w-4" />
                Report
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
                        {status.status === "stopped" && (
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center" title="Stopped — partial results saved">
                            <Square className="h-4 w-4 text-amber-600 fill-amber-600" />
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
                          {status.status === "stopped" && (
                            <span className="text-amber-600 text-sm font-medium">
                              {status.videosProcessed === 0
                                ? "Stopped before data loaded — run again and stop after some data appears to see partial results"
                                : "Stopped — partial results below"}
                            </span>
                          )}
                          {status.status === "error" && status.error && (
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
          <TabsContent value="videos" className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={videoSort} onValueChange={setVideoSort}>
                <SelectTrigger className="w-[200px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comments-desc">Most comments</SelectItem>
                  <SelectItem value="likes-desc">Most likes</SelectItem>
                  <SelectItem value="views-desc">Most views</SelectItem>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="views-asc">Fewest views</SelectItem>
                  <SelectItem value="likes-asc">Fewest likes</SelectItem>
                  <SelectItem value="comments-asc">Fewest comments</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllVideos}>
                  Select all
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllVideos}>
                  Deselect all
                </Button>
                {selectedVideoIds.size > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const headers = ["Video ID", "Title", "Channel", "Views", "Likes", "Comments", "Duration", "Published", "Playlist"];
                      const rows = selectedVideos.map((v) => [
                        v.id,
                        `"${v.title.replace(/"/g, '""')}"`,
                        `"${v.channelTitle.replace(/"/g, '""')}"`,
                        v.viewCount,
                        v.likeCount,
                        v.commentCount,
                        v.durationFormatted,
                        new Date(v.publishedAt).toISOString().split("T")[0],
                        v.playlistTitle ? `"${(v.playlistTitle || "").replace(/"/g, '""')}"` : "",
                      ]);
                      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                      downloadFile(csv, "selected-videos.csv", "text/csv");
                      toast.success(`Exported ${selectedVideoIds.size} videos`);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export selected ({selectedVideoIds.size})
                  </Button>
                )}
              </div>
            </div>

            <div className="max-w-4xl space-y-2">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="border hover:border-primary/50 transition-colors">
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex gap-3">
                      <label className="flex items-center shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVideoIds.has(video.id)}
                          onChange={() => toggleVideoSelection(video.id)}
                          className="rounded border-input h-4 w-4"
                        />
                      </label>
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-2 mb-0.5">
                              {video.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {video.channelTitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Link href={`/video?id=${video.id}`}>
                              <Button variant="default" size="sm" className="h-8">
                                View in app
                              </Button>
                            </Link>
                            <a
                              href={`https://youtube.com/watch?v=${video.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{video.viewCountFormatted}</span>
                          <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{video.likeCountFormatted}</span>
                          <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{video.commentCountFormatted}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{video.durationFormatted}</span>
                          <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{new Date(video.publishedAt).toLocaleDateString()}</span>
                        </div>
                        {video.playlistTitle && (
                          <Badge variant="outline" className="mt-1.5 text-xs">
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
              Showing {filteredComments.length} of {allComments.length} comments. For sentiment & copywriting insights, open <Link href="/intelligence?source=local" className="text-primary underline">Comment Intelligence</Link> (uses this run automatically).
            </p>

            <div className="max-w-4xl space-y-2">
              {filteredComments.slice(0, 200).map((comment) => (
                <Card key={comment.id} className="border">
                  <CardContent className="p-2 sm:p-3">
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

          {/* Spreadsheet Tab: table view for easy copy */}
          <TabsContent value="spreadsheet" className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Column view — use &quot;Copy table&quot; to paste into Excel or Sheets.
            </p>
            <Tabs defaultValue="videos-table">
              <TabsList>
                <TabsTrigger value="videos-table">Videos ({filteredVideos.length})</TabsTrigger>
                <TabsTrigger value="comments-table">Comments ({filteredComments.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="videos-table" className="mt-4">
                <DataTable<Video>
                  keyField="id"
                  data={filteredVideos}
                  copyable
                  columns={[
                    { key: "id", header: "Video ID", width: "120px" },
                    { key: "title", header: "Title", copyValue: (r) => r.title },
                    { key: "channelTitle", header: "Channel" },
                    { key: "viewCount", header: "Views", render: (r) => r.viewCount.toLocaleString() },
                    { key: "likeCount", header: "Likes", render: (r) => r.likeCount.toLocaleString() },
                    { key: "commentCount", header: "Comments", render: (r) => r.commentCount.toLocaleString() },
                    { key: "durationFormatted", header: "Duration", width: "80px" },
                    { key: "publishedAt", header: "Published", render: (r) => new Date(r.publishedAt).toLocaleDateString(), width: "100px" },
                    { key: "playlistTitle", header: "Playlist", render: (r) => r.playlistTitle ?? "" },
                  ]}
                />
              </TabsContent>
              <TabsContent value="comments-table" className="mt-4">
                <DataTable<Comment>
                  keyField="id"
                  data={filteredComments}
                  copyable
                  columns={[
                    { key: "id", header: "Comment ID", width: "100px" },
                    { key: "videoId", header: "Video ID", width: "120px" },
                    { key: "videoTitle", header: "Video Title", render: (r) => r.videoTitle ?? "", copyValue: (r) => r.videoTitle ?? "" },
                    { key: "authorDisplayName", header: "Author" },
                    { key: "textOriginal", header: "Comment", copyValue: (r) => r.textOriginal },
                    { key: "likeCount", header: "Likes", render: (r) => r.likeCount.toLocaleString(), width: "70px" },
                    { key: "replyCount", header: "Replies", render: (r) => r.replyCount.toLocaleString(), width: "70px" },
                    { key: "publishedAt", header: "Date", render: (r) => new Date(r.publishedAt).toLocaleDateString(), width: "100px" },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Report Tab: markdown summary for analysis presentation */}
          <TabsContent value="report" className="space-y-4">
            {reportMarkdown ? (
              <DynamicLayout content={reportMarkdown} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No data yet. Run an analysis to see the report.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
