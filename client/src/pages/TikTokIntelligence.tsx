import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { 
  Search, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Music,
  Hash,
  User,
  Clock,
  TrendingUp,
  Eye,
  Copy,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface TikTokVideo {
  videoId: string;
  description: string;
  coverUrl: string;
  duration: number;
  playCount: number;
  diggCount: number;
  shareCount: number;
  commentCount: number;
  collectCount: number;
  createTime: Date | string;
  musicId?: string;
  musicTitle?: string;
  musicAuthor?: string;
  hashtags: string[];
  creator: TikTokCreator;
}

interface TikTokCreator {
  uniqueId: string;
  nickname: string;
  avatarUrl: string;
  signature: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
}

interface TikTokComment {
  commentId: string;
  videoId: string;
  authorUniqueId: string;
  authorNickname: string;
  authorAvatarUrl: string;
  text: string;
  diggCount: number;
  replyCount: number;
  createTime: Date | string;
  sentiment?: string;
  sentimentScore?: number;
}

interface CommentStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

export default function TikTokIntelligence() {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [video, setVideo] = useState<TikTokVideo | null>(null);
  const [comments, setComments] = useState<TikTokComment[]>([]);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getVideoMutation = trpc.tiktok.getVideo.useMutation();
  const getCommentsMutation = trpc.tiktok.getComments.useMutation();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnalyze = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a TikTok video URL or video ID");
      return;
    }

    setIsLoading(true);
    try {
      // Parse URL to get video ID
      const batchInput = encodeURIComponent(JSON.stringify({ "0": { json: { url: urlInput } } }));
      const response = await fetch(`/api/trpc/tiktok.parseUrl?batch=1&input=${batchInput}`);
      const data = await response.json();
      
      const result = Array.isArray(data) ? data[0]?.result?.data?.json : data.result?.data;
      
      if (!result?.id || result.type !== 'video') {
        toast.error("Could not extract video ID. Please enter a valid TikTok video URL.");
        setIsLoading(false);
        return;
      }

      const videoId = result.id;

      // Fetch video details
      const videoResult = await getVideoMutation.mutateAsync({ videoId });
      setVideo(videoResult as TikTokVideo);

      // Fetch comments
      const commentsResult = await getCommentsMutation.mutateAsync({ videoId, count: 30 });
      setComments(commentsResult.comments as TikTokComment[]);
      setStats(commentsResult.stats as CommentStats);

      toast.success("Video analysis complete!");
      setActiveTab("comments");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze video");
    } finally {
      setIsLoading(false);
    }
  };

  const copyComment = async (comment: TikTokComment) => {
    try {
      await navigator.clipboard.writeText(comment.text);
      setCopiedId(comment.commentId);
      toast.success("Comment copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy comment");
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'negative': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'mixed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container py-6 max-w-6xl">
        <Breadcrumb
          items={[
            { label: "Tools", href: "/" },
            { label: "TikTok Intelligence" },
          ]}
        />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">TikTok Intelligence</h1>
            <p className="text-muted-foreground">Analyze TikTok videos to extract insights on what works</p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Video Search
            </CardTitle>
            <CardDescription>
              Enter a TikTok video URL to analyze engagement and comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="https://www.tiktok.com/@username/video/1234567890 or video ID"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1"
              />
              <Button onClick={handleAnalyze} disabled={isLoading} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Analyze
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: This uses sample data for demonstration. In production, integrate with TikTok API or a third-party service.
            </p>
          </CardContent>
        </Card>

        {/* Results Section */}
        {video ? (
          <div className="space-y-6">
            {/* Video Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-6">
                  {/* Video Thumbnail */}
                  <div className="relative w-48 h-80 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-600/20">
                      <Play className="h-12 w-12 text-white/80" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg leading-relaxed">{video.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {video.hashtags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-pink-500/10 text-pink-400">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://www.tiktok.com/@${video.creator.uniqueId}/video/${video.videoId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on TikTok
                        </a>
                      </Button>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">@{video.creator.uniqueId}</span>
                          {video.creator.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-400 fill-blue-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{video.creator.nickname}</p>
                      </div>
                      <div className="ml-auto flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{formatNumber(video.creator.followerCount)}</p>
                          <p className="text-muted-foreground">Followers</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{formatNumber(video.creator.heartCount)}</p>
                          <p className="text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    </div>

                    {/* Music Info */}
                    {video.musicTitle && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Music className="h-4 w-4" />
                        <span>{video.musicTitle}</span>
                        <span>•</span>
                        <span>{video.musicAuthor}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <Eye className="h-4 w-4 mr-2" />
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Play className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatNumber(video.playCount)}</p>
                          <p className="text-sm text-muted-foreground">Views</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <Heart className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatNumber(video.diggCount)}</p>
                          <p className="text-sm text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <MessageCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatNumber(video.commentCount)}</p>
                          <p className="text-sm text-muted-foreground">Comments</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Share2 className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatNumber(video.shareCount)}</p>
                          <p className="text-sm text-muted-foreground">Shares</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <Bookmark className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatNumber(video.collectCount)}</p>
                          <p className="text-sm text-muted-foreground">Saves</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Engagement Rates */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Like Rate</p>
                        <p className="text-xl font-bold text-red-400">
                          {((video.diggCount / video.playCount) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Comment Rate</p>
                        <p className="text-xl font-bold text-green-400">
                          {((video.commentCount / video.playCount) * 100).toFixed(3)}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Share Rate</p>
                        <p className="text-xl font-bold text-purple-400">
                          {((video.shareCount / video.playCount) * 100).toFixed(3)}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Save Rate</p>
                        <p className="text-xl font-bold text-yellow-400">
                          {((video.collectCount / video.playCount) * 100).toFixed(3)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                {/* Sentiment Summary */}
                {stats && (
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-green-400">Positive</p>
                        <p className="text-2xl font-bold text-green-400">{stats.positive}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-red-400">Negative</p>
                        <p className="text-2xl font-bold text-red-400">{stats.negative}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-gray-400">Neutral</p>
                        <p className="text-2xl font-bold text-gray-400">{stats.neutral}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Comments List */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {comments.map((comment) => (
                        <div
                          key={comment.commentId}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/50 to-purple-600/50 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-white/80" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">@{comment.authorUniqueId}</span>
                              <Badge variant="outline" className={`text-xs ${getSentimentColor(comment.sentiment)}`}>
                                {comment.sentiment || 'neutral'}
                              </Badge>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {formatNumber(comment.diggCount)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {comment.replyCount} replies
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(comment.createTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyComment(comment)}
                          >
                            {copiedId === comment.commentId ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                        What's Working
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="font-medium text-green-400">High Engagement Hook</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          The video's opening captures attention within the first 3 seconds
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="font-medium text-green-400">Trending Sound</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Using popular audio increases discoverability on FYP
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="font-medium text-green-400">Optimal Hashtags</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Mix of trending (#fyp) and niche hashtags for broader reach
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-400" />
                        Content Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="font-medium text-blue-400">Follow-up Content</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stats && stats.neutral > stats.positive ? 
                            "Many neutral comments suggest viewers want more information" :
                            "Positive reception indicates audience wants similar content"
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="font-medium text-blue-400">Engagement Boosters</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add a call-to-action in comments to increase reply rate
                        </p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="font-medium text-blue-400">Cross-Platform Potential</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This content style could perform well on YouTube Shorts and Instagram Reels
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4">
                  <Play className="h-8 w-8 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Video Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Enter a TikTok video URL above to start analyzing
                </p>
                <div className="text-left max-w-md mx-auto space-y-2">
                  <p className="text-sm font-medium">What you can discover:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Video engagement metrics and rates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Comment sentiment analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Trending hashtags and sounds
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Content improvement opportunities
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
