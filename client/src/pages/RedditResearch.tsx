import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Users,
  Clock,
  ExternalLink,
  Loader2,
  TrendingUp,
  Filter,
  Plus,
  Sparkles,
  BarChart3,
  HelpCircle,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Hash,
  Globe,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sentiment colors
const SENTIMENT_COLORS = {
  positive: "bg-green-500",
  neutral: "bg-gray-500",
  negative: "bg-red-500",
};

interface RedditPost {
  postId: string;
  subreddit: string;
  title: string;
  body?: string;
  author: string;
  score: number;
  upvoteRatio: number;
  commentCount: number;
  postUrl: string;
  isNsfw: boolean;
  flair?: string;
  postedAt: Date;
}

interface RedditComment {
  commentId: string;
  postId: string;
  author: string;
  body: string;
  score: number;
  isOp: boolean;
  depth: number;
  postedAt: Date;
  sentiment?: "positive" | "neutral" | "negative";
  themes?: string[];
}

interface RedditStats {
  totalPosts: number;
  totalComments: number;
  avgPostScore: number;
  avgCommentScore: number;
  topSubreddits: { name: string; count: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topThemes: string[];
  questionCount: number;
  recommendationCount: number;
  painPointCount: number;
}

interface PopularSubreddit {
  name: string;
  description: string;
  category: string;
}

export default function RedditResearch() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // State
  const [searchInput, setSearchInput] = useState("");
  const [subredditInput, setSubredditInput] = useState("");
  const [searchType, setSearchType] = useState<"subreddit" | "search">("subreddit");
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [stats, setStats] = useState<RedditStats | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("hot");
  const [timeframe, setTimeframe] = useState<string>("week");
  const [activeTab, setActiveTab] = useState("posts");
  const [popularSubreddits, setPopularSubreddits] = useState<PopularSubreddit[]>([]);

  // TRPC mutations
  const getSubredditPostsMutation = trpc.reddit.getSubredditPosts.useMutation();
  const searchPostsMutation = trpc.reddit.searchPosts.useMutation();
  const getPostCommentsMutation = trpc.reddit.getPostComments.useMutation();
  const getPopularSubredditsQuery = trpc.reddit.getPopularSubreddits.useQuery();

  // Load popular subreddits
  useEffect(() => {
    if (getPopularSubredditsQuery.data) {
      setPopularSubreddits(getPopularSubredditsQuery.data);
    }
  }, [getPopularSubredditsQuery.data]);

  // Handle subreddit search
  const handleSubredditSearch = async () => {
    if (!subredditInput.trim()) {
      toast.error("Please enter a subreddit name");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getSubredditPostsMutation.mutateAsync({
        subreddit: subredditInput.replace(/^r\//, ""),
        sort: sortBy as "hot" | "new" | "top" | "rising",
        limit: 25,
        timeframe: timeframe as "hour" | "day" | "week" | "month" | "year" | "all",
      });

      setPosts(result.posts as RedditPost[]);
      setSelectedPost(null);
      setComments([]);
      toast.success(`Found ${result.posts.length} posts from r/${subredditInput}`);
      setActiveTab("posts");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch subreddit posts");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyword search
  const handleKeywordSearch = async () => {
    if (!searchInput.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchPostsMutation.mutateAsync({
        query: searchInput,
        subreddit: subredditInput ? subredditInput.replace(/^r\//, "") : undefined,
        sort: sortBy as "relevance" | "hot" | "top" | "new" | "comments",
        limit: 25,
        timeframe: timeframe as "hour" | "day" | "week" | "month" | "year" | "all",
      });

      setPosts(result.posts as RedditPost[]);
      setSelectedPost(null);
      setComments([]);
      toast.success(`Found ${result.posts.length} posts matching "${searchInput}"`);
      setActiveTab("posts");
    } catch (error: any) {
      toast.error(error.message || "Failed to search Reddit");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle post click to load comments
  const handlePostClick = async (post: RedditPost) => {
    setSelectedPost(post);
    setIsLoading(true);
    
    try {
      const result = await getPostCommentsMutation.mutateAsync({
        subreddit: post.subreddit,
        postId: post.postId,
        sort: "best",
        limit: 100,
      });

      setComments(result.comments as RedditComment[]);
      setStats(result.stats as RedditStats);
      setActiveTab("comments");
    } catch (error: any) {
      toast.error(error.message || "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle item selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  // Format score
  const formatScore = (score: number) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
  };

  // Group subreddits by category
  const groupedSubreddits = popularSubreddits.reduce((acc, sub) => {
    if (!acc[sub.category]) acc[sub.category] = [];
    acc[sub.category].push(sub);
    return acc;
  }, {} as Record<string, PopularSubreddit[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-orange-500" />
                  Reddit Research
                </h1>
                <p className="text-sm text-muted-foreground">
                  Discover insights from Reddit discussions
                </p>
              </div>
            </div>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedItems.size} selected</Badge>
                <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Clear
                </Button>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Canvas
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Reddit
            </CardTitle>
            <CardDescription>
              Browse subreddits or search for specific topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "subreddit" | "search")}>
              <TabsList className="mb-4">
                <TabsTrigger value="subreddit">Browse Subreddit</TabsTrigger>
                <TabsTrigger value="search">Search Keywords</TabsTrigger>
              </TabsList>

              <TabsContent value="subreddit">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter subreddit name (e.g., entrepreneur, BuyItForLife)"
                      value={subredditInput}
                      onChange={(e) => setSubredditInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubredditSearch()}
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="rising">Rising</SelectItem>
                    </SelectContent>
                  </Select>
                  {sortBy === "top" && (
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">Past Hour</SelectItem>
                        <SelectItem value="day">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button onClick={handleSubredditSearch} disabled={isLoading} className="gap-2">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Browse
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="search">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search keywords (e.g., best headphones, product recommendations)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleKeywordSearch()}
                    />
                  </div>
                  <Input
                    placeholder="Limit to subreddit (optional)"
                    value={subredditInput}
                    onChange={(e) => setSubredditInput(e.target.value)}
                    className="w-48"
                  />
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="year">Past Year</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="day">Past Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleKeywordSearch} disabled={isLoading} className="gap-2">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Content */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="posts" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Posts ({posts.length})
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="gap-2" disabled={!selectedPost}>
                    <MessageSquare className="h-4 w-4" />
                    Comments ({comments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts">
                  <ScrollArea className="h-[700px]">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {posts.map((post, index) => (
                          <motion.div
                            key={post.postId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Card 
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedPost?.postId === post.postId ? "ring-2 ring-primary" : ""
                              } ${selectedItems.has(post.postId) ? "bg-primary/5" : ""}`}
                              onClick={() => handlePostClick(post)}
                            >
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  {/* Vote Score */}
                                  <div className="flex flex-col items-center text-muted-foreground">
                                    <ArrowUp className="h-4 w-4" />
                                    <span className="text-sm font-medium">{formatScore(post.score)}</span>
                                    <ArrowDown className="h-4 w-4" />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        r/{post.subreddit}
                                      </Badge>
                                      {post.flair && (
                                        <Badge variant="secondary" className="text-xs">
                                          {post.flair}
                                        </Badge>
                                      )}
                                      {post.isNsfw && (
                                        <Badge variant="destructive" className="text-xs">
                                          NSFW
                                        </Badge>
                                      )}
                                    </div>
                                    <h3 className="font-medium line-clamp-2 mb-2">{post.title}</h3>
                                    {post.body && (
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {post.body}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        u/{post.author}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {post.commentCount} comments
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeTime(post.postedAt)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Selection */}
                                  <div className="flex flex-col items-center gap-2">
                                    <Checkbox
                                      checked={selectedItems.has(post.postId)}
                                      onCheckedChange={() => toggleSelection(post.postId)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(post.postUrl, "_blank");
                                      }}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="comments">
                  {selectedPost && (
                    <>
                      {/* Selected Post Header */}
                      <Card className="mb-4">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center text-muted-foreground">
                              <ArrowUp className="h-4 w-4" />
                              <span className="text-sm font-medium">{formatScore(selectedPost.score)}</span>
                            </div>
                            <div className="flex-1">
                              <Badge variant="outline" className="text-xs mb-2">
                                r/{selectedPost.subreddit}
                              </Badge>
                              <h3 className="font-semibold mb-2">{selectedPost.title}</h3>
                              {selectedPost.body && (
                                <p className="text-sm text-muted-foreground">{selectedPost.body}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Comments List */}
                      <ScrollArea className="h-[550px]">
                        <div className="space-y-2">
                          {comments.map((comment, index) => (
                            <motion.div
                              key={comment.commentId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              style={{ marginLeft: `${comment.depth * 16}px` }}
                            >
                              <Card className={`${selectedItems.has(comment.commentId) ? "ring-2 ring-primary" : ""}`}>
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={selectedItems.has(comment.commentId)}
                                      onCheckedChange={() => toggleSelection(comment.commentId)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                          u/{comment.author}
                                          {comment.isOp && (
                                            <Badge variant="secondary" className="ml-2 text-xs">OP</Badge>
                                          )}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <ArrowUp className="h-3 w-3" />
                                          {comment.score}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatRelativeTime(comment.postedAt)}
                                        </span>
                                        {comment.sentiment && (
                                          <Badge className={`${SENTIMENT_COLORS[comment.sentiment]} text-white text-xs`}>
                                            {comment.sentiment}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                                      {comment.themes && comment.themes.length > 0 && (
                                        <div className="flex gap-1 mt-2">
                                          {comment.themes.map(theme => (
                                            <Badge key={theme} variant="outline" className="text-xs">
                                              {theme}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-4">
              {stats && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Discussion Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{stats.totalComments}</p>
                            <p className="text-xs text-muted-foreground">Comments</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{stats.avgCommentScore.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Avg Score</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Sentiment</h4>
                          <div className="flex gap-2">
                            <Badge className="bg-green-500 text-white">
                              {stats.sentimentBreakdown.positive} positive
                            </Badge>
                            <Badge className="bg-gray-500 text-white">
                              {stats.sentimentBreakdown.neutral} neutral
                            </Badge>
                            <Badge className="bg-red-500 text-white">
                              {stats.sentimentBreakdown.negative} negative
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <span className="text-sm flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-blue-500" />
                            Questions
                          </span>
                          <Badge variant="secondary">{stats.questionCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="text-sm flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                            Recommendations
                          </span>
                          <Badge variant="secondary">{stats.recommendationCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <span className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Pain Points
                          </span>
                          <Badge variant="secondary">{stats.painPointCount}</Badge>
                        </div>

                        {stats.topThemes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Top Themes</h4>
                            <div className="flex flex-wrap gap-1">
                              {stats.topThemes.map(theme => (
                                <Badge key={theme} variant="outline" className="text-xs">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Quick Access Subreddits */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Popular Subreddits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {Object.entries(groupedSubreddits).map(([category, subs]) => (
                        <div key={category}>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            {category}
                          </h4>
                          <div className="space-y-1">
                            {subs.map(sub => (
                              <Button
                                key={sub.name}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm h-auto py-1"
                                onClick={() => {
                                  setSubredditInput(sub.name);
                                  setSearchType("subreddit");
                                }}
                              >
                                r/{sub.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Empty State */
          <Card className="p-12">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start Your Research</h3>
              <p className="text-muted-foreground mb-6">
                Browse subreddits or search for topics to discover insights
              </p>
              
              <div className="max-w-2xl mx-auto">
                <h4 className="font-medium mb-4">Popular Research Subreddits</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {popularSubreddits.slice(0, 9).map(sub => (
                    <Button
                      key={sub.name}
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setSubredditInput(sub.name);
                        handleSubredditSearch();
                      }}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      r/{sub.name}
                    </Button>
                  ))}
                </div>

                <div className="mt-8 text-left">
                  <h4 className="font-medium mb-2">What you can discover:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Product recommendations and comparisons
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Common pain points and complaints
                    </li>
                    <li className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                      Questions people are asking
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Trending topics and discussions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
