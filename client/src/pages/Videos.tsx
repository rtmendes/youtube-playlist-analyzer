import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Tag,
  Trash2,
  MoreHorizontal,
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Calendar,
  ExternalLink,
  Plus,
  X,
  Star,
  FolderPlus,
} from "lucide-react";

type SortField = "title" | "views" | "likes" | "comments" | "duration" | "publishedAt";
type SortOrder = "asc" | "desc";

interface VideoItem {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string | null;
  publishedAt: Date | null;
  tags?: string[];
  isFavorite?: boolean;
}

export default function Videos() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Fetch videos from analysis sessions
  const { data: analysisData } = trpc.analysis.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch user tags
  const { data: tagsData, refetch: refetchTags } = trpc.tags.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Create tag mutation
  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      refetchTags();
      setNewTagName("");
      setShowTagDialog(false);
      toast.success("Tag created");
    },
    onError: (error) => toast.error(error.message),
  });

  // Extract all videos from analysis sessions
  const allVideos = useMemo(() => {
    if (!analysisData) return [];
    
    const videos: VideoItem[] = [];
    analysisData.forEach((session: any, sessionIndex: number) => {
      if (session.videosData) {
        try {
          const videosData = typeof session.videosData === "string" 
            ? JSON.parse(session.videosData) 
            : session.videosData;
          
          videosData.forEach((video: any, videoIndex: number) => {
            videos.push({
              id: sessionIndex * 10000 + videoIndex,
              videoId: video.id || video.videoId,
              title: video.title || "Untitled",
              channelTitle: video.channelTitle || "Unknown Channel",
              thumbnailUrl: video.thumbnailUrl || null,
              viewCount: video.viewCount || video.views || 0,
              likeCount: video.likeCount || video.likes || 0,
              commentCount: video.commentCount || video.comments || 0,
              duration: video.duration || null,
              publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
              tags: [],
              isFavorite: false,
            });
          });
        } catch (e) {
          console.error("Error parsing videos data:", e);
        }
      }
    });
    return videos;
  }, [analysisData]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...allVideos];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (video) =>
          video.title.toLowerCase().includes(query) ||
          video.channelTitle.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((video) =>
        selectedTags.some((tag) => video.tags?.includes(tag))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "views":
          comparison = a.viewCount - b.viewCount;
          break;
        case "likes":
          comparison = a.likeCount - b.likeCount;
          break;
        case "comments":
          comparison = a.commentCount - b.commentCount;
          break;
        case "duration":
          comparison = (a.duration || "").localeCompare(b.duration || "");
          break;
        case "publishedAt":
          comparison =
            (a.publishedAt?.getTime() || 0) - (b.publishedAt?.getTime() || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allVideos, searchQuery, selectedTags, sortField, sortOrder]);

  const toggleVideoSelection = (videoId: number) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  const selectAllVideos = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map((v) => v.id)));
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Unknown";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Video className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Sign in to view your videos</h2>
        <p className="text-muted-foreground">
          Your analyzed videos will appear here after you sign in.
        </p>
        <Button onClick={() => (window.location.href = getLoginUrl())}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">All Videos</h1>
            <p className="text-muted-foreground">
              {filteredVideos.length} videos from your analyses
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedVideos.size > 0 && (
              <>
                <Badge variant="secondary">{selectedVideos.size} selected</Badge>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Move to Folder
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="views">Views</SelectItem>
              <SelectItem value="likes">Likes</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Filter by Tags</div>
                {tagsData && tagsData.length > 0 ? (
                  <div className="space-y-1">
                    {tagsData.map((tag: any) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedTags.includes(tag.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTags((prev) => [...prev, tag.name]);
                            } else {
                              setSelectedTags((prev) =>
                                prev.filter((t) => t !== tag.name)
                              );
                            }
                          }}
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color || "#888" }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags yet</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTagDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Tag
              </DropdownMenuItem>
              {selectedTags.length > 0 && (
                <DropdownMenuItem onClick={() => setSelectedTags([])}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters */}
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() =>
                    setSelectedTags((prev) => prev.filter((t) => t !== tag))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Video List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Video className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No videos found</h3>
              <p className="text-muted-foreground max-w-md">
                {allVideos.length === 0
                  ? "Run an analysis to start collecting videos."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-2 px-2 py-1">
                <Checkbox
                  checked={
                    selectedVideos.size === filteredVideos.length &&
                    filteredVideos.length > 0
                  }
                  onCheckedChange={selectAllVideos}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>

              {/* Video Items */}
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className={`transition-colors ${
                    selectedVideos.has(video.id) ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedVideos.has(video.id)}
                        onCheckedChange={() => toggleVideoSelection(video.id)}
                      />
                      
                      {/* Thumbnail */}
                      <div className="relative w-32 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {video.channelTitle}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(video.viewCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {formatNumber(video.likeCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {formatNumber(video.commentCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(video.publishedAt)}
                          </span>
                        </div>
                        {video.tags && video.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {video.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            // Toggle favorite
                          }}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              video.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={`https://youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Tag className="h-4 w-4 mr-2" />
                              Add Tags
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FolderPlus className="h-4 w-4 mr-2" />
                              Move to Folder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Comments
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Tags help you organize and filter your videos.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTagName.trim()) {
                createTagMutation.mutate({ name: newTagName.trim() });
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newTagName.trim()) {
                  createTagMutation.mutate({ name: newTagName.trim() });
                }
              }}
              disabled={!newTagName.trim()}
            >
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
