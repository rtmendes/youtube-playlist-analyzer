import { useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Search,
  Filter,
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Star,
  Tag,
  Trash2,
  Download,
} from "lucide-react";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import {
  DataTable,
  Column,
  ViewToggle,
  ThumbnailCell,
  NumberCell,
  DateCell,
  LinkCell,
} from "@/components/DataTable";
import { PageHeader } from "@/components/Breadcrumb";

interface VideoItem {
  id: number;
  videoId: string;
  title: string;
  channelId?: string;
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
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("publishedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "grid">("list");

  // Fetch videos from analysis sessions
  const { data: analysisData } = trpc.analysis.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch user tags
  const { data: tagsData } = trpc.tags.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Extract all videos from analysis sessions
  const allVideos = useMemo(() => {
    if (!analysisData) return [];

    const videos: VideoItem[] = [];
    analysisData.forEach((session: any, sessionIndex: number) => {
      if (session.videosData) {
        try {
          const videosData =
            typeof session.videosData === "string"
              ? JSON.parse(session.videosData)
              : session.videosData;

          videosData.forEach((video: any, videoIndex: number) => {
            videos.push({
              id: sessionIndex * 10000 + videoIndex,
              videoId: video.id || video.videoId,
              title: video.title || "Untitled",
              channelId: video.channelId,
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

    return result;
  }, [allVideos, searchQuery, selectedTags]);

  // Multi-select hook
  const getVideoId = useCallback((video: VideoItem) => String(video.id), []);
  const {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    deselectAll,
    selectedCount,
    handleClick,
  } = useMultiSelect({
    items: filteredVideos,
    getItemId: getVideoId,
  });

  const formatDuration = (duration: string | null): string => {
    if (!duration) return "-";
    // Parse ISO 8601 duration (PT1H2M3S)
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

  // Table columns definition
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
      minWidth: 250,
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <LinkCell
            href={`https://youtube.com/watch?v=${row.videoId}`}
            external
          >
            <span className="font-medium line-clamp-1">{value}</span>
          </LinkCell>
          <span className="text-xs text-muted-foreground">{row.videoId}</span>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Channel",
      accessor: "channelTitle",
      sortable: true,
      minWidth: 150,
      render: (value, row) => (
        <Link
          href={`/channel/${row.channelId || row.channelTitle}`}
          className="text-primary hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </Link>
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
    {
      id: "actions",
      header: "",
      accessor: "id",
      width: 50,
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  `https://youtube.com/watch?v=${row.videoId}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open on YouTube
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocation(`/channel/${row.channelId || row.channelTitle}`)}
            >
              <Video className="h-4 w-4 mr-2" />
              View Channel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              Add to Favorites
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Tag className="h-4 w-4 mr-2" />
              Add Tags
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = [
      "Video ID",
      "Title",
      "Channel",
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
      `"${v.channelTitle.replace(/"/g, '""')}"`,
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
    a.download = `videos-export-${new Date().toISOString().split("T")[0]}.csv`;
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

  return (
    <div className="h-full flex flex-col p-6">
      {/* Page Header with Breadcrumb */}
      <PageHeader
        title="All Videos"
        description={user ? `${filteredVideos.length} videos from your analyses` : "Run a bulk analysis from Home to pull in videos. Sign in to save and see them here."}
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle view={view} onViewChange={setView} />
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Selection Toolbar */}
      {selectedCount > 0 && (
        <SelectionToolbar
          selectedCount={selectedCount}
          onClearSelection={deselectAll}
          onTag={() => toast.info("Tag functionality coming soon")}
          onFavorite={() => toast.info("Favorites functionality coming soon")}
          onDelete={() => toast.info("Delete functionality coming soon")}
          onExport={handleExportCSV}
        />
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4 my-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos by title or channel..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tagsData.map((tag: any) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag.name]);
                          } else {
                            setSelectedTags(
                              selectedTags.filter((t) => t !== tag.name)
                            );
                          }
                        }}
                        className="rounded"
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
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Data Table (List View) */}
      {view === "list" ? (
        <div className="flex-1 overflow-hidden">
          <DataTable
            data={filteredVideos}
            columns={columns}
            keyField="id"
            selectable
            selectedIds={selectedIds}
            onSelectionChange={(ids) => {
              deselectAll();
              ids.forEach((id) => {
                toggle(String(id));
              });
            }}
            onRowClick={(row) =>
              window.open(`https://youtube.com/watch?v=${row.videoId}`, "_blank")
            }
            emptyMessage="No videos found. Run an analysis to see videos here."
            compact
            storageKey="videos-list"
          />
        </div>
      ) : (
        /* Grid View */
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className={`group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                  isSelected(getVideoId(video)) ? "ring-2 ring-primary" : ""
                }`}
                onClick={(e) => handleClick(getVideoId(video), e)}
              >
                {/* Thumbnail */}
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

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-medium line-clamp-2 text-sm mb-1">
                    {video.title}
                  </h3>
                  <Link
                    href={`/channel/${video.channelId || video.channelTitle}`}
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {video.channelTitle}
                  </Link>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                      }).format(video.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                      }).format(video.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                      }).format(video.commentCount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
