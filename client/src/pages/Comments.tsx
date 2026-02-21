import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  MessageSquare,
  ThumbsUp,
  Reply,
  Calendar,
  ExternalLink,
  Plus,
  X,
  Star,
  User,
  Video,
} from "lucide-react";

type SortField = "likes" | "replies" | "publishedAt" | "text";
type SortOrder = "asc" | "desc";

interface CommentItem {
  id: string;
  videoId: string;
  videoTitle: string;
  authorName: string;
  authorProfileUrl: string | null;
  text: string;
  likeCount: number;
  replyCount: number;
  publishedAt: Date | null;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export default function Comments() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("likes");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  // Fetch comments from analysis sessions
  const { data: analysisData } = trpc.analysis.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch user tags
  const { data: tagsData } = trpc.tags.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Extract all comments from analysis sessions
  const allComments = useMemo(() => {
    if (!analysisData) return [];
    
    const comments: CommentItem[] = [];
    analysisData.forEach((session: any) => {
      if (session.commentsData) {
        try {
          const commentsData = typeof session.commentsData === "string" 
            ? JSON.parse(session.commentsData) 
            : session.commentsData;
          
          commentsData.forEach((comment: any) => {
            comments.push({
              id: comment.id || `${comment.videoId}-${comments.length}`,
              videoId: comment.videoId || "",
              videoTitle: comment.videoTitle || "Unknown Video",
              authorName: comment.authorDisplayName || comment.author || "Anonymous",
              authorProfileUrl: comment.authorProfileImageUrl || null,
              text: comment.textDisplay || comment.text || "",
              likeCount: comment.likeCount || 0,
              replyCount: comment.totalReplyCount || comment.replyCount || 0,
              publishedAt: comment.publishedAt ? new Date(comment.publishedAt) : null,
              category: detectCategory(comment.textDisplay || comment.text || ""),
              tags: [],
              isFavorite: false,
            });
          });
        } catch (e) {
          console.error("Error parsing comments data:", e);
        }
      }
    });
    return comments;
  }, [analysisData]);

  // Detect comment category based on content
  function detectCategory(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Personal stories
    if (/\b(i was|i am|my life|my story|happened to me|i experienced|i remember|when i was)\b/i.test(lowerText)) {
      return "story";
    }
    
    // Product requests
    if (/\b(i want|i need|please make|should make|would buy|take my money|shut up and take)\b/i.test(lowerText)) {
      return "request";
    }
    
    // Pain points
    if (/\b(struggle|problem|issue|frustrat|annoying|hate|difficult|hard to|can't|cannot)\b/i.test(lowerText)) {
      return "pain_point";
    }
    
    // Questions
    if (/\?/.test(text) || /\b(how do|what is|why does|can you|could you|where can)\b/i.test(lowerText)) {
      return "question";
    }
    
    // Testimonials
    if (/\b(changed my|saved my|helped me|thank you|thanks for|grateful|amazing|best|love this)\b/i.test(lowerText)) {
      return "testimonial";
    }
    
    // Humor
    if (/\b(lol|lmao|😂|🤣|haha|hilarious|funny|dead|dying)\b/i.test(lowerText)) {
      return "humor";
    }
    
    return "general";
  }

  const categoryLabels: Record<string, string> = {
    all: "All Comments",
    story: "Personal Stories",
    request: "Product Requests",
    pain_point: "Pain Points",
    question: "Questions",
    testimonial: "Testimonials",
    humor: "Humor",
    general: "General",
  };

  const categoryColors: Record<string, string> = {
    story: "bg-blue-500",
    request: "bg-green-500",
    pain_point: "bg-red-500",
    question: "bg-yellow-500",
    testimonial: "bg-purple-500",
    humor: "bg-pink-500",
    general: "bg-gray-500",
  };

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let result = [...allComments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (comment) =>
          comment.text.toLowerCase().includes(query) ||
          comment.authorName.toLowerCase().includes(query) ||
          comment.videoTitle.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((comment) => comment.category === selectedCategory);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((comment) =>
        selectedTags.some((tag) => comment.tags?.includes(tag))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "text":
          comparison = a.text.localeCompare(b.text);
          break;
        case "likes":
          comparison = a.likeCount - b.likeCount;
          break;
        case "replies":
          comparison = a.replyCount - b.replyCount;
          break;
        case "publishedAt":
          comparison =
            (a.publishedAt?.getTime() || 0) - (b.publishedAt?.getTime() || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allComments, searchQuery, selectedCategory, selectedTags, sortField, sortOrder]);

  const toggleCommentSelection = (commentId: string) => {
    setSelectedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const selectAllComments = () => {
    if (selectedComments.size === filteredComments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(filteredComments.map((c) => c.id)));
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

  // Count comments by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allComments.length };
    allComments.forEach((comment) => {
      const cat = comment.category || "general";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allComments]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">All Comments</h1>
            <p className="text-muted-foreground">
              {user ? `${filteredComments.length} comments from your analyses` : "Run a bulk analysis from Home to pull in comments. Sign in to save and see them here."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedComments.size > 0 && (
              <>
                <Badge variant="secondary">{selectedComments.size} selected</Badge>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="gap-1"
            >
              {label}
              {categoryCounts[key] !== undefined && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {categoryCounts[key]}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
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
              <SelectItem value="likes">Most Liked</SelectItem>
              <SelectItem value="replies">Most Replies</SelectItem>
              <SelectItem value="publishedAt">Date</SelectItem>
              <SelectItem value="text">Text</SelectItem>
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
              {selectedTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedTags([])}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Comment List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No comments found</h3>
              <p className="text-muted-foreground max-w-md">
                {allComments.length === 0
                  ? "Run an analysis to start collecting comments."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-2 px-2 py-1">
                <Checkbox
                  checked={
                    selectedComments.size === filteredComments.length &&
                    filteredComments.length > 0
                  }
                  onCheckedChange={selectAllComments}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>

              {/* Comment Items */}
              {filteredComments.map((comment) => (
                <Card
                  key={comment.id}
                  className={`transition-colors ${
                    selectedComments.has(comment.id) ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedComments.has(comment.id)}
                        onCheckedChange={() => toggleCommentSelection(comment.id)}
                      />
                      
                      {/* Author Avatar */}
                      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                        {comment.authorProfileUrl ? (
                          <img
                            src={comment.authorProfileUrl}
                            alt={comment.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.publishedAt)}
                          </span>
                          {comment.category && comment.category !== "general" && (
                            <Badge
                              variant="secondary"
                              className={`text-xs text-white ${categoryColors[comment.category]}`}
                            >
                              {categoryLabels[comment.category]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap line-clamp-3">
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {formatNumber(comment.likeCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Reply className="h-3 w-3" />
                            {comment.replyCount} replies
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <Video className="h-3 w-3" />
                            {comment.videoTitle.length > 30
                              ? comment.videoTitle.substring(0, 30) + "..."
                              : comment.videoTitle}
                          </span>
                        </div>
                        {comment.tags && comment.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {comment.tags.map((tag) => (
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
                              comment.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
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
                            href={`https://youtube.com/watch?v=${comment.videoId}`}
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
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(comment.text);
                                toast.success("Comment copied to clipboard");
                              }}
                            >
                              Copy Text
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
    </div>
  );
}
