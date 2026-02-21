import { useState, useEffect, useMemo } from "react";
import { useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  MessageSquare, 
  Eye, 
  ThumbsUp, 
  Clock, 
  Download, 
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { getStoredYouTubeApiKey } from "@/lib/apiKeys";

interface Comment {
  id: string;
  videoId: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelId?: string;
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  replyCount: number;
  publishedAt: string;
  updatedAt: string;
  replies: Array<{
    id: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    textDisplay: string;
    likeCount: number;
    publishedAt: string;
  }>;
}

export default function Video() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const videoId = params.get("id") || "";
  const apiKey = params.get("key") || getStoredYouTubeApiKey();

  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  const commentsMutation = trpc.youtube.getVideoComments.useMutation();

  useEffect(() => {
    if (videoId && apiKey) {
      loadComments();
    }
  }, [videoId, apiKey]);

  const loadComments = async (pageToken?: string) => {
    setLoadingComments(true);
    try {
      const result = await commentsMutation.mutateAsync({
        videoId,
        apiKey,
        pageToken,
        maxResults: 100,
      });
      
      if (pageToken) {
        setComments((prev) => [...prev, ...result.comments]);
      } else {
        setComments(result.comments);
      }
      setHasMore(result.hasMore);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const filteredComments = useMemo(() => {
    if (!searchQuery) return comments;
    const query = searchQuery.toLowerCase();
    return comments.filter(
      (c) =>
        c.textOriginal.toLowerCase().includes(query) ||
        c.authorDisplayName.toLowerCase().includes(query)
    );
  }, [comments, searchQuery]);

  const exportJSON = () => {
    const data = {
      videoId,
      comments,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${videoId}-comments.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["Comment ID", "Author", "Text", "Likes", "Replies", "Published"];
    const rows = comments.map((c) => [
      c.id,
      `"${c.authorDisplayName.replace(/"/g, '""')}"`,
      `"${c.textOriginal.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.likeCount,
      c.replyCount,
      c.publishedAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${videoId}-comments.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!videoId || !apiKey) {
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
              Please provide a video ID and API key to analyze.
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
              <h1 className="text-xl font-bold">Video Comments</h1>
              <a
                href={`https://youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1"
              >
                {videoId}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={comments.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportJSON} disabled={comments.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Comments Loaded</p>
              <p className="text-2xl font-bold">{comments.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <p className="text-2xl font-bold">
                {comments.reduce((sum, c) => sum + c.likeCount, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Replies</p>
              <p className="text-2xl font-bold">
                {comments.reduce((sum, c) => sum + c.replyCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Comments List */}
        {loadingComments && comments.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
              >
                <Card className="border">
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
              </motion.div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={() => loadComments(nextPageToken)}
                  disabled={loadingComments}
                >
                  {loadingComments ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load More Comments
                </Button>
              </div>
            )}

            {comments.length === 0 && !loadingComments && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No comments found or comments are disabled for this video.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
