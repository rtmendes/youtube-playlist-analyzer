import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Video,
  MessageSquare,
  Eye,
  ThumbsUp,
  Clock,
  Calendar,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  History,
  BarChart3,
  TrendingUp,
  Users,
  Settings,
  Bell,
  CalendarClock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function SavedPlaylist() {
  const params = useParams<{ id: string }>();
  const playlistId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [refreshSchedule, setRefreshSchedule] = useState<"none" | "daily" | "weekly">("none");
  const [refreshHour, setRefreshHour] = useState(9);
  const [refreshDayOfWeek, setRefreshDayOfWeek] = useState(1);

  // Fetch saved playlist
  const { data: playlist, isLoading, refetch } = trpc.savedPlaylists.getById.useQuery(
    { id: playlistId },
    { enabled: playlistId > 0 && isAuthenticated }
  );

  // Fetch playlist videos
  const { data: videos } = trpc.playlistVideos.listByPlaylist.useQuery(
    { savedPlaylistId: playlistId },
    { enabled: playlistId > 0 && isAuthenticated }
  );

  // Fetch run history
  const { data: runs } = trpc.playlistRuns.listByPlaylist.useQuery(
    { savedPlaylistId: playlistId },
    { enabled: playlistId > 0 && isAuthenticated }
  );

  // Delete mutation
  const deleteMutation = trpc.savedPlaylists.delete.useMutation();

  // Schedule mutation
  const updateScheduleMutation = trpc.savedPlaylists.updateSchedule.useMutation();

  // Load current schedule settings when playlist loads
  useEffect(() => {
    if (playlist) {
      setRefreshSchedule((playlist.refreshSchedule as "none" | "daily" | "weekly") || "none");
      setRefreshHour(playlist.refreshHour ?? 9);
      setRefreshDayOfWeek(playlist.refreshDayOfWeek ?? 1);
    }
  }, [playlist]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!videos) return { totalViews: 0, totalLikes: 0, totalComments: 0, avgViews: 0 };
    
    const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.commentCount || 0), 0);
    const avgViews = videos.length ? Math.round(totalViews / videos.length) : 0;
    
    return { totalViews, totalLikes, totalComments, avgViews };
  }, [videos]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (date: Date | string | null) => {
    if (!date) return "Never";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(date);
  };

  const { data: apiKeyStatus } = trpc.system.getApiKeyStatus.useQuery();
  const handleRefresh = () => {
    if (!playlist) return;
    const key = apiKeyStatus?.youtube ? "" : (localStorage.getItem("youtube_api_key") ?? "");
    if (!key && !apiKeyStatus?.youtube) {
      toast.error("Set YOUTUBE_API_KEY in .env or enter your API key on the Home page.");
      return;
    }
    setLocation(`/analyze?playlist=${playlist.youtubePlaylistId}&key=${encodeURIComponent(key)}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: playlistId });
      toast.success("Playlist removed from library");
      setLocation("/");
    } catch (error) {
      toast.error("Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const result = await updateScheduleMutation.mutateAsync({
        id: playlistId,
        refreshSchedule,
        refreshHour,
        refreshDayOfWeek,
      });
      await refetch();
      setScheduleOpen(false);
      if (refreshSchedule === "none") {
        toast.success("Scheduled refresh disabled");
      } else {
        const nextRun = result.nextRefreshAt ? new Date(result.nextRefreshAt).toLocaleString() : "soon";
        toast.success(`Scheduled ${refreshSchedule} refresh. Next run: ${nextRun}`);
      }
    } catch (error) {
      toast.error("Failed to update schedule");
    }
  };

  const getDayName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  const getScheduleDescription = () => {
    if (!playlist || playlist.refreshSchedule === "none") return null;
    const hour = playlist.refreshHour ?? 9;
    const hourStr = hour === 0 ? "12:00 AM" : hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`;
    if (playlist.refreshSchedule === "daily") {
      return `Daily at ${hourStr}`;
    }
    return `Every ${getDayName(playlist.refreshDayOfWeek ?? 1)} at ${hourStr}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Playlist Not Found</CardTitle>
            <CardDescription>
              This playlist doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go Home</Link>
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
            <div className="flex items-center gap-4">
              {playlist.thumbnailUrl && (
                <img
                  src={playlist.thumbnailUrl}
                  alt={playlist.title || "Playlist"}
                  className="w-16 h-12 object-cover rounded"
                />
              )}
              <div>
                <h1 className="text-xl font-bold">{playlist.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {playlist.channelTitle} • {playlist.videoCount} videos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <div className="text-xs text-muted-foreground">Last analyzed</div>
              <div className="text-sm font-medium" title={formatDate(playlist.lastRunAt)}>
                {getRelativeTime(playlist.lastRunAt)}
              </div>
              {getScheduleDescription() && (
                <div className="text-xs text-primary flex items-center gap-1 mt-0.5">
                  <CalendarClock className="h-3 w-3" />
                  {getScheduleDescription()}
                </div>
              )}
              {playlist.nextRefreshAt && playlist.refreshSchedule !== "none" && (
                <div className="text-xs text-muted-foreground">
                  Next: {getRelativeTime(playlist.nextRefreshAt)}
                </div>
              )}
            </div>
            <AlertDialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" title="Schedule automatic refresh">
                  <CalendarClock className={`h-4 w-4 ${playlist.refreshSchedule !== "none" ? "text-primary" : ""}`} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Schedule Automatic Refresh</AlertDialogTitle>
                  <AlertDialogDescription>
                    Set up automatic re-analysis of this playlist to track new comments and videos over time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Refresh Frequency</Label>
                    <Select value={refreshSchedule} onValueChange={(v) => setRefreshSchedule(v as "none" | "daily" | "weekly")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No automatic refresh</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {refreshSchedule !== "none" && (
                    <>
                      <div className="space-y-2">
                        <Label>Time of Day</Label>
                        <Select value={refreshHour.toString()} onValueChange={(v) => setRefreshHour(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {refreshSchedule === "weekly" && (
                        <div className="space-y-2">
                          <Label>Day of Week</Label>
                          <Select value={refreshDayOfWeek.toString()} onValueChange={(v) => setRefreshDayOfWeek(parseInt(v))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Sunday</SelectItem>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSaveSchedule}>
                    {updateScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Schedule"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Now
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the playlist from your library. The analysis data will be preserved, but you'll need to save it again to track future updates.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Video className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{videos?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Eye className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <ThumbsUp className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</div>
                  <div className="text-sm text-muted-foreground">Total Likes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalComments)}</div>
                  <div className="text-sm text-muted-foreground">Total Comments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Videos ({videos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Run History ({runs?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Playlist Videos</CardTitle>
                <CardDescription>
                  All videos from this playlist with their latest stats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {videos && videos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[400px]">Video</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                        <TableHead className="text-right">Comments</TableHead>
                        <TableHead className="text-right">First Seen</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((video) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {video.thumbnailUrl && (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.videoTitle || "Video"}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-[280px]">
                                  {video.videoTitle || "Untitled"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(video.viewCount || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(video.likeCount || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(video.commentCount || 0)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatDate(video.firstSeenAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`https://youtube.com/watch?v=${video.videoYoutubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No videos saved yet</p>
                    <p className="text-sm">Run an analysis to save video data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Analysis History</CardTitle>
                <CardDescription>
                  History of all analysis runs for this playlist
                </CardDescription>
              </CardHeader>
              <CardContent>
                {runs && runs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run Date</TableHead>
                        <TableHead className="text-right">Videos Analyzed</TableHead>
                        <TableHead className="text-right">Comments Collected</TableHead>
                        <TableHead className="text-right">New Videos</TableHead>
                        <TableHead className="text-right">New Comments</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatDate(run.startedAt)}</div>
                              {run.completedAt && (
                                <div className="text-xs text-muted-foreground">
                                  Duration: {Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{run.videosAnalyzed}</TableCell>
                          <TableCell className="text-right">{run.commentsCollected}</TableCell>
                          <TableCell className="text-right">
                            {(run.newVideos ?? 0) > 0 ? (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                +{run.newVideos}
                              </Badge>
                            ) : (
                              "0"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {(run.newComments ?? 0) > 0 ? (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                                +{run.newComments}
                              </Badge>
                            ) : (
                              "0"
                            )}
                          </TableCell>
                          <TableCell>
                            {run.status === "completed" ? (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : run.status === "running" ? (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Running
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No analysis runs yet</p>
                    <p className="text-sm">Click "Refresh Analysis" to run your first analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
