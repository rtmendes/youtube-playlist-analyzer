import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Copy,
  CheckCircle,
  Bookmark,
  BookmarkCheck,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Eye,
  User,
  Play,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
} from "lucide-react";

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
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  replyCount: number;
  publishedAt: string;
}

interface SplitPaneCommentsProps {
  videos: Video[];
  comments: Comment[];
  selectedVideo: Video | null;
  onVideoSelect: (video: Video) => void;
}

export function SplitPaneComments({ videos, comments, selectedVideo, onVideoSelect }: SplitPaneCommentsProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-liked" | "most-replies">("newest");
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [highlightedComments, setHighlightedComments] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 50;

  const saveCommentMutation = trpc.savedComments.save.useMutation();

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let filtered = comments;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.textOriginal.toLowerCase().includes(query) ||
          c.authorDisplayName.toLowerCase().includes(query)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
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
  }, [comments, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);
  const paginatedComments = filteredComments.slice(
    (currentPage - 1) * commentsPerPage,
    currentPage * commentsPerPage
  );

  // Copy single comment
  const copyComment = useCallback(async (comment: Comment) => {
    try {
      await navigator.clipboard.writeText(comment.textOriginal);
      setCopiedId(comment.id);
      toast.success("Comment copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  // Copy selected comments
  const copySelectedComments = useCallback(async () => {
    const selectedTexts = filteredComments
      .filter((c) => selectedComments.has(c.id))
      .map((c) => `${c.authorDisplayName}: ${c.textOriginal}`)
      .join("\n\n");
    
    try {
      await navigator.clipboard.writeText(selectedTexts);
      toast.success(`${selectedComments.size} comments copied!`);
    } catch {
      toast.error("Failed to copy");
    }
  }, [filteredComments, selectedComments]);

  // Toggle comment selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle highlight
  const toggleHighlight = useCallback((id: string) => {
    setHighlightedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Save comment to collection
  const saveComment = useCallback(async (comment: Comment) => {
    if (!user) {
      toast.error("Please sign in to save comments");
      return;
    }

    try {
      await saveCommentMutation.mutateAsync({
        sourceType: "youtube",
        sourceId: comment.videoId,
        commentId: comment.id,
        authorName: comment.authorDisplayName,
        text: comment.textOriginal,
        highlighted: highlightedComments.has(comment.id),
      });
      toast.success("Comment saved to collection!");
    } catch {
      toast.error("Failed to save comment");
    }
  }, [user, saveCommentMutation, highlightedComments]);

  // Select all on current page
  const selectAll = useCallback(() => {
    const pageIds = paginatedComments.map((c) => c.id);
    setSelectedComments((prev) => {
      const next = new Set(prev);
      const allSelected = pageIds.every((id) => next.has(id));
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedComments]);

  // Export to CSV
  const exportCSV = useCallback(() => {
    const headers = ["Author", "Comment", "Likes", "Replies", "Date", "Video Title"];
    const rows = (selectedComments.size > 0 
      ? filteredComments.filter((c) => selectedComments.has(c.id))
      : filteredComments
    ).map((c) => [
      c.authorDisplayName,
      `"${c.textOriginal.replace(/"/g, '""')}"`,
      c.likeCount,
      c.replyCount,
      new Date(c.publishedAt).toLocaleDateString(),
      c.videoTitle || "",
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comments-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Comments exported to CSV!");
  }, [filteredComments, selectedComments]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Pane - Video Metadata */}
      <div className="w-80 flex-shrink-0 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">Video Details</h3>
        </div>
        
        {selectedVideo ? (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={selectedVideo.thumbnailUrl}
                  alt={selectedVideo.title}
                  className="w-full rounded-lg"
                />
                <Badge className="absolute bottom-2 right-2 bg-black/80">
                  {selectedVideo.durationFormatted}
                </Badge>
              </div>

              {/* Title */}
              <div>
                <h4 className="font-semibold text-sm line-clamp-2">{selectedVideo.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{selectedVideo.channelTitle}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Eye className="h-3 w-3" />
                    Views
                  </div>
                  <p className="font-semibold">{selectedVideo.viewCountFormatted}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    Likes
                  </div>
                  <p className="font-semibold">{selectedVideo.likeCountFormatted}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <MessageSquare className="h-3 w-3" />
                    Comments
                  </div>
                  <p className="font-semibold">{selectedVideo.commentCountFormatted}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Published
                  </div>
                  <p className="font-semibold">{new Date(selectedVideo.publishedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVideo.tags.slice(0, 10).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {selectedVideo.tags.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedVideo.tags.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`https://youtube.com/watch?v=${selectedVideo.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    YouTube
                  </a>
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-muted-foreground">
            <div>
              <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a video to view details</p>
            </div>
          </div>
        )}

        {/* Video List */}
        <div className="border-t">
          <div className="p-2 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">All Videos ({videos.length})</p>
          </div>
          <ScrollArea className="h-48">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`p-2 flex gap-2 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                  selectedVideo?.id === video.id ? "bg-muted" : ""
                }`}
                onClick={() => onVideoSelect(video)}
              >
                <img src={video.thumbnailUrl} alt="" className="w-16 h-10 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.commentCountFormatted} comments</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      {/* Right Pane - Comments CSV View */}
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-3 border-b bg-muted/50 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-liked">Most Liked</SelectItem>
              <SelectItem value="most-replies">Most Replies</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-auto">
            {selectedComments.size > 0 && (
              <>
                <Badge variant="secondary" className="text-xs">
                  {selectedComments.size} selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={copySelectedComments}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedComments(new Set())}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_80px_80px_100px_40px] gap-2 px-3 py-2 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
          <div className="flex items-center">
            <Checkbox
              checked={paginatedComments.length > 0 && paginatedComments.every((c) => selectedComments.has(c.id))}
              onCheckedChange={selectAll}
            />
          </div>
          <div>Comment</div>
          <div className="text-center">Likes</div>
          <div className="text-center">Replies</div>
          <div>Date</div>
          <div></div>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1">
          {paginatedComments.map((comment) => (
            <div
              key={comment.id}
              className={`grid grid-cols-[40px_1fr_80px_80px_100px_40px] gap-2 px-3 py-2 border-b hover:bg-muted/30 transition-colors items-start text-sm ${
                highlightedComments.has(comment.id) ? "bg-yellow-500/10" : ""
              } ${selectedComments.has(comment.id) ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center pt-1">
                <Checkbox
                  checked={selectedComments.has(comment.id)}
                  onCheckedChange={() => toggleSelect(comment.id)}
                />
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs truncate">{comment.authorDisplayName}</span>
                  {comment.videoTitle && (
                    <Badge variant="outline" className="text-xs truncate max-w-[200px]">
                      {comment.videoTitle}
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">
                  {comment.textOriginal}
                </p>
              </div>
              
              <div className="text-center">
                <span className="flex items-center justify-center gap-1 text-muted-foreground">
                  <ThumbsUp className="h-3 w-3" />
                  {formatNumber(comment.likeCount)}
                </span>
              </div>
              
              <div className="text-center">
                <span className="flex items-center justify-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {comment.replyCount}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {new Date(comment.publishedAt).toLocaleDateString()}
              </div>
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyComment(comment)}
                    >
                      {copiedId === comment.id ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy comment</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleHighlight(comment.id)}
                    >
                      {highlightedComments.has(comment.id) ? (
                        <BookmarkCheck className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <Bookmark className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Highlight</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </ScrollArea>

        {/* Pagination */}
        <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Showing {(currentPage - 1) * commentsPerPage + 1}-{Math.min(currentPage * commentsPerPage, filteredComments.length)} of {filteredComments.length}
          </span>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
