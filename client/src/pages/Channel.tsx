import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search,
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Users,
  Calendar,
  ExternalLink,
  Download,
  Play,
  BarChart3,
} from "lucide-react";
import {
  DataTable,
  Column,
  ViewToggle,
  ThumbnailCell,
  NumberCell,
  DateCell,
  LinkCell,
} from "@/components/DataTable";
import { PageHeader, BreadcrumbItem } from "@/components/Breadcrumb";

interface VideoItem {
  id: number;
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string | null;
  publishedAt: Date | null;
}

export default function Channel() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [activeTab, setActiveTab] = useState("videos");

  // Fetch videos from analysis sessions
  const { data: analysisData } = trpc.analysis.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Extract channel info and videos from analysis sessions
  const { channelInfo, channelVideos } = useMemo(() => {
    if (!analysisData || !channelId) {
      return { channelInfo: null, channelVideos: [] };
    }

    let foundChannel: any = null;
    const videos: VideoItem[] = [];
    let videoIndex = 0;

    analysisData.forEach((session: any) => {
      if (session.videosData) {
        try {
          const videosData =
            typeof session.videosData === "string"
              ? JSON.parse(session.videosData)
              : session.videosData;

          videosData.forEach((video: any) => {
            const videoChannelId = video.channelId || video.channelTitle;
            if (
              videoChannelId === channelId ||
              video.channelTitle === channelId
            ) {
              if (!foundChannel) {
                foundChannel = {
                  id: video.channelId || channelId,
                  title: video.channelTitle || channelId,
                  thumbnailUrl: video.channelThumbnail || null,
                  subscriberCount: video.channelSubscribers || 0,
                  videoCount: 0,
                  viewCount: 0,
                };
              }

              videos.push({
                id: videoIndex++,
                videoId: video.id || video.videoId,
                title: video.title || "Untitled",
                thumbnailUrl: video.thumbnailUrl || null,
                viewCount: video.viewCount || video.views || 0,
                likeCount: video.likeCount || video.likes || 0,
                commentCount: video.commentCount || video.comments || 0,
                duration: video.duration || null,
                publishedAt: video.publishedAt
                  ? new Date(video.publishedAt)
                  : null,
              });
            }
          });
        } catch (e) {
          console.error("Error parsing videos data:", e);
        }
      }
    });

    // Update channel stats
    if (foundChannel) {
      foundChannel.videoCount = videos.length;
      foundChannel.viewCount = videos.reduce((sum, v) => sum + v.viewCount, 0);
    }

    return { channelInfo: foundChannel, channelVideos: videos };
  }, [analysisData, channelId]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    if (!searchQuery) return channelVideos;
    const query = searchQuery.toLowerCase();
    return channelVideos.filter((video) =>
      video.title.toLowerCase().includes(query)
    );
  }, [channelVideos, searchQuery]);

  // Calculate channel stats
  const stats = useMemo(() => {
    const totalViews = channelVideos.reduce((sum, v) => sum + v.viewCount, 0);
    const totalLikes = channelVideos.reduce((sum, v) => sum + v.likeCount, 0);
    const totalComments = channelVideos.reduce(
      (sum, v) => sum + v.commentCount,
      0
    );
    const avgViews =
      channelVideos.length > 0
        ? Math.round(totalViews / channelVideos.length)
        : 0;
    const avgLikes =
      channelVideos.length > 0
        ? Math.round(totalLikes / channelVideos.length)
        : 0;

    return { totalViews, totalLikes, totalComments, avgViews, avgLikes };
  }, [channelVideos]);

  const formatDuration = (duration: string | null): string => {
    if (!duration) return "-";
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(num);
  };

  // Table columns
  const columns: Column<VideoItem>[] = [
    {
      id: "thumbnail",
      header: "",
      accessor: "thumbnailUrl",
      width: 80,
      render: (value, row) =>
        value ? (
          <ThumbnailCell src={value} alt={row.title} size="sm" />
        ) : (
          <div className="w-16 h-9 bg-muted rounded flex items-center justify-center">
            <Video className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      id: "title",
      header: "Title",
      accessor: "title",
      sortable: true,
      minWidth: 300,
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <LinkCell
            href={`https://youtube.com/watch?v=${row.videoId}`}
            external
          >
            <span className="font-medium line-clamp-2">{value}</span>
          </LinkCell>
        </div>
      ),
    },
    {
      id: "views",
      header: "Views",
      accessor: "viewCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (value) => <NumberCell value={value} />,
    },
    {
      id: "likes",
      header: "Likes",
      accessor: "likeCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (value) => <NumberCell value={value} />,
    },
    {
      id: "comments",
      header: "Comments",
      accessor: "commentCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (value) => <NumberCell value={value} />,
    },
    {
      id: "duration",
      header: "Duration",
      accessor: "duration",
      sortable: true,
      width: 90,
      align: "center",
      render: (value) => (
        <span className="font-mono text-sm">{formatDuration(value)}</span>
      ),
    },
    {
      id: "publishedAt",
      header: "Published",
      accessor: "publishedAt",
      sortable: true,
      width: 120,
      render: (value) =>
        value ? <DateCell value={value} format="relative" /> : <span>-</span>,
    },
  ];

  // Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "All Channels", href: "/channels" },
    { label: channelInfo?.title || channelId || "Channel" },
  ];

  const handleExportCSV = () => {
    const headers = [
      "Video ID",
      "Title",
      "Views",
      "Likes",
      "Comments",
      "Duration",
      "Published",
      "URL",
    ];
    const rows = filteredVideos.map((v) => [
      v.videoId,
      `"${v.title.replace(/"/g, '""')}"`,
      v.viewCount,
      v.likeCount,
      v.commentCount,
      formatDuration(v.duration),
      v.publishedAt?.toISOString() || "",
      `https://youtube.com/watch?v=${v.videoId}`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${channelInfo?.title || "channel"}-videos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Videos exported to CSV");
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
        <h2 className="text-2xl font-bold">Sign in to view channel details</h2>
        <p className="text-muted-foreground">
          Channel data will appear here after you sign in.
        </p>
        <Button onClick={() => (window.location.href = getLoginUrl())}>
          Sign In
        </Button>
      </div>
    );
  }

  if (!channelInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Video className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Channel not found</h2>
        <p className="text-muted-foreground">
          This channel hasn't been analyzed yet.
        </p>
        <Link href="/channels">
          <Button variant="outline">View All Channels</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Page Header with Breadcrumb */}
      <PageHeader
        title=""
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://youtube.com/channel/${channelInfo.id}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open on YouTube
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Channel Header */}
      <div className="flex items-start gap-6 mt-4 mb-6">
        {/* Channel Avatar */}
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {channelInfo.thumbnailUrl ? (
            <img
              src={channelInfo.thumbnailUrl}
              alt={channelInfo.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {/* Channel Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{channelInfo.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            {channelInfo.subscriberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {formatNumber(channelInfo.subscriberCount)} subscribers
              </span>
            )}
            <span className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              {channelVideos.length} videos analyzed
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {formatNumber(stats.totalViews)} total views
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{channelVideos.length}</p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalViews)}
                </p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ThumbsUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalLikes)}
                </p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalComments)}
                </p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.avgViews)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        <TabsContent value="videos" className="flex-1 mt-0">
          {view === "list" ? (
            <DataTable
              data={filteredVideos}
              columns={columns}
              keyField="id"
              onRowClick={(row) =>
                window.open(
                  `https://youtube.com/watch?v=${row.videoId}`,
                  "_blank"
                )
              }
              emptyMessage="No videos found for this channel."
              compact
              storageKey="channel-videos"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    window.open(
                      `https://youtube.com/watch?v=${video.videoId}`,
                      "_blank"
                    )
                  }
                >
                  <div className="relative aspect-video bg-muted">
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
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium line-clamp-2 text-sm mb-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...channelVideos]
                    .sort((a, b) => b.viewCount - a.viewCount)
                    .slice(0, 5)
                    .map((video, index) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() =>
                          window.open(
                            `https://youtube.com/watch?v=${video.videoId}`,
                            "_blank"
                          )
                        }
                      >
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-16 h-9 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {video.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(video.viewCount)} views
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Engaging Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...channelVideos]
                    .sort((a, b) => b.commentCount - a.commentCount)
                    .slice(0, 5)
                    .map((video, index) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() =>
                          window.open(
                            `https://youtube.com/watch?v=${video.videoId}`,
                            "_blank"
                          )
                        }
                      >
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-16 h-9 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {video.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(video.commentCount)} comments
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
