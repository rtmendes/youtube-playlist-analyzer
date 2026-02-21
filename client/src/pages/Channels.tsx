import { useState, useMemo } from "react";
import { Link } from "wouter";
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
  Tag,
  Trash2,
  MoreHorizontal,
  Users,
  Video,
  Eye,
  ExternalLink,
  Star,
  FolderPlus,
} from "lucide-react";

type SortField = "name" | "subscribers" | "videos" | "views";
type SortOrder = "asc" | "desc";

interface ChannelItem {
  id: string;
  name: string;
  customUrl: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  tags?: string[];
  isFavorite?: boolean;
}

export default function Channels() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("subscribers");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());

  // Fetch videos from analysis sessions to extract unique channels
  const { data: analysisData } = trpc.analysis.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Extract unique channels from analysis sessions
  const allChannels = useMemo(() => {
    if (!analysisData) return [];
    
    const channelMap = new Map<string, ChannelItem>();
    
    analysisData.forEach((session: any) => {
      if (session.videosData) {
        try {
          const videosData = typeof session.videosData === "string" 
            ? JSON.parse(session.videosData) 
            : session.videosData;
          
          videosData.forEach((video: any) => {
            const channelId = video.channelId;
            if (channelId && !channelMap.has(channelId)) {
              channelMap.set(channelId, {
                id: channelId,
                name: video.channelTitle || "Unknown Channel",
                customUrl: null,
                thumbnailUrl: null,
                subscriberCount: 0,
                videoCount: 1,
                viewCount: video.viewCount || video.views || 0,
                tags: [],
                isFavorite: false,
              });
            } else if (channelId) {
              const existing = channelMap.get(channelId)!;
              existing.videoCount += 1;
              existing.viewCount += video.viewCount || video.views || 0;
            }
          });
        } catch (e) {
          console.error("Error parsing videos data:", e);
        }
      }
    });
    
    return Array.from(channelMap.values());
  }, [analysisData]);

  // Filter and sort channels
  const filteredChannels = useMemo(() => {
    let result = [...allChannels];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((channel) =>
        channel.name.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "subscribers":
          comparison = a.subscriberCount - b.subscriberCount;
          break;
        case "videos":
          comparison = a.videoCount - b.videoCount;
          break;
        case "views":
          comparison = a.viewCount - b.viewCount;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allChannels, searchQuery, sortField, sortOrder]);

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const selectAllChannels = () => {
    if (selectedChannels.size === filteredChannels.length) {
      setSelectedChannels(new Set());
    } else {
      setSelectedChannels(new Set(filteredChannels.map((c) => c.id)));
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

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
            <h1 className="text-2xl font-bold">All Channels</h1>
            <p className="text-muted-foreground">
              {user ? `${filteredChannels.length} channels from your analyses` : "Run a bulk analysis from Home to pull in channels. Sign in to save and see them here."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedChannels.size > 0 && (
              <>
                <Badge variant="secondary">{selectedChannels.size} selected</Badge>
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
              placeholder="Search channels..."
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
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="subscribers">Subscribers</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="views">Total Views</SelectItem>
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
        </div>
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No channels found</h3>
              <p className="text-muted-foreground max-w-md">
                {allChannels.length === 0
                  ? "Run an analysis to start collecting channels."
                  : "Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-2 px-2 py-1">
                <Checkbox
                  checked={
                    selectedChannels.size === filteredChannels.length &&
                    filteredChannels.length > 0
                  }
                  onCheckedChange={selectAllChannels}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>

              {/* Channel Items */}
              {filteredChannels.map((channel) => (
                <Card
                  key={channel.id}
                  className={`transition-colors ${
                    selectedChannels.has(channel.id) ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedChannels.has(channel.id)}
                        onCheckedChange={() => toggleChannelSelection(channel.id)}
                      />
                      
                      {/* Channel Avatar */}
                      <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                        {channel.thumbnailUrl ? (
                          <img
                            src={channel.thumbnailUrl}
                            alt={channel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <span className="text-lg font-bold text-primary">
                              {channel.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/channel/${channel.id}`}>
                          <h3 className="font-medium hover:text-primary hover:underline cursor-pointer">{channel.name}</h3>
                        </Link>
                        {channel.customUrl && (
                          <p className="text-sm text-muted-foreground">
                            @{channel.customUrl}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {formatNumber(channel.subscriberCount)} subscribers
                          </span>
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            {channel.videoCount} videos analyzed
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(channel.viewCount)} total views
                          </span>
                        </div>
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
                              channel.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
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
                            href={`https://youtube.com/channel/${channel.id}`}
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
                            <DropdownMenuItem onClick={() => window.location.href = `/channel/${channel.id}`}>
                              <Video className="h-4 w-4 mr-2" />
                              View Videos
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
