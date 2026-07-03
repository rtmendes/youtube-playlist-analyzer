import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/Breadcrumb";
import { DataTable, Column, NumberCell, DateCell, ThumbnailCell } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Database,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Video,
  MessageSquare,
  ShoppingCart,
  Globe,
  Sparkles,
  FileText,
  ChevronRight,
  ChevronDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

type DataTab = "videos" | "comments" | "generated" | "amazon" | "reddit" | "insights";

export default function DataManager() {
  const [activeTab, setActiveTab] = useState<DataTab>("videos");
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<any>(null);
  const [detailType, setDetailType] = useState<DataTab>("videos");

  // Queries for each data type
  const videosQuery = trpc.analysis.list.useQuery(undefined, { enabled: activeTab === "videos" });
  const commentsQuery = trpc.savedComments.getAll.useQuery(undefined, { enabled: activeTab === "comments" });
  const generatedQuery = trpc.contentGenerator.getAllGeneratedContent.useQuery({}, { enabled: activeTab === "generated" });
  const amazonQuery = trpc.amazon.listProducts.useQuery(undefined, { enabled: activeTab === "amazon" });
  const redditQuery = trpc.reddit.listPosts.useQuery(undefined, { enabled: activeTab === "reddit" });
  const insightsQuery = trpc.insights.getByProject.useQuery({ projectId: 0 }, { enabled: activeTab === "insights" });

  // Bulk delete mutations
  const bulkDeleteComments = trpc.savedComments.bulkDelete.useMutation({
    onSuccess: () => {
      toast.success("Comments deleted");
      commentsQuery.refetch();
      setSelectedIds(new Set());
    },
  });

  // Filter data by global search
  const filterData = <T extends Record<string, any>>(data: T[] | undefined): T[] => {
    if (!data) return [];
    if (!globalSearch.trim()) return data;
    const search = globalSearch.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some(
        (val) => val && String(val).toLowerCase().includes(search)
      )
    );
  };

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} rows to CSV`);
  };

  // Export to JSON
  const exportToJSON = (data: any[], filename: string) => {
    if (!data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} rows to JSON`);
  };

  // Tab counts
  const tabCounts = useMemo(() => ({
    videos: videosQuery.data?.length ?? 0,
    comments: commentsQuery.data?.length ?? 0,
    generated: generatedQuery.data?.length ?? 0,
    amazon: amazonQuery.data?.length ?? 0,
    reddit: redditQuery.data?.length ?? 0,
    insights: insightsQuery.data?.length ?? 0,
  }), [videosQuery.data, commentsQuery.data, generatedQuery.data, amazonQuery.data, redditQuery.data, insightsQuery.data]);

  // Column definitions for each tab
  const videoColumns: Column<any>[] = [
    {
      id: "thumbnail",
      header: "",
      accessor: "thumbnailUrl",
      width: 80,
      render: (row: any) => row.thumbnailUrl ? <ThumbnailCell src={row.thumbnailUrl} alt={row.title || ""} /> : null,
    },
    { id: "title", header: "Title", accessor: "title", sortable: true, width: 300 },
    { id: "channelTitle", header: "Channel", accessor: "channelTitle", sortable: true, width: 150 },
    {
      id: "viewCount",
      header: "Views",
      accessor: "viewCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (row: any) => <NumberCell value={row.viewCount || 0} />,
    },
    {
      id: "likeCount",
      header: "Likes",
      accessor: "likeCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (row: any) => <NumberCell value={row.likeCount || 0} />,
    },
    {
      id: "commentCount",
      header: "Comments",
      accessor: "commentCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (row: any) => <NumberCell value={row.commentCount || 0} />,
    },
    {
      id: "publishedAt",
      header: "Published",
      accessor: "publishedAt",
      sortable: true,
      width: 130,
      render: (row: any) => row.publishedAt ? <DateCell value={row.publishedAt} format="relative" /> : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "duration",
      header: "Duration",
      accessor: "duration",
      width: 90,
    },
  ];

  const commentColumns: Column<any>[] = [
    {
      id: "source",
      header: "Source",
      accessor: "source",
      width: 90,
      render: (row: any) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.source || "youtube"}
        </Badge>
      ),
    },
    { id: "authorName", header: "Author", accessor: "authorName", sortable: true, width: 140 },
    {
      id: "text",
      header: "Comment",
      accessor: "text",
      sortable: true,
      width: 400,
      render: (row: any) => (
        <span className="line-clamp-2 text-sm">{row.text}</span>
      ),
    },
    {
      id: "likeCount",
      header: "Likes",
      accessor: "likeCount",
      sortable: true,
      width: 80,
      align: "right",
      render: (row: any) => <NumberCell value={row.likeCount || 0} />,
    },
    {
      id: "replyCount",
      header: "Replies",
      accessor: "replyCount",
      sortable: true,
      width: 80,
      align: "right",
      render: (row: any) => <NumberCell value={row.replyCount || 0} />,
    },
    {
      id: "sentiment",
      header: "Sentiment",
      accessor: "sentiment",
      width: 100,
      render: (row: any) => {
        const colors: Record<string, string> = {
          positive: "bg-green-100 text-green-800",
          neutral: "bg-gray-100 text-gray-800",
          negative: "bg-red-100 text-red-800",
        };
        return row.sentiment ? (
          <Badge className={`text-xs ${colors[row.sentiment] || colors.neutral}`}>
            {row.sentiment}
          </Badge>
        ) : null;
      },
    },
    {
      id: "videoTitle",
      header: "Video",
      accessor: "videoTitle",
      sortable: true,
      width: 200,
      render: (row: any) => <span className="line-clamp-1 text-sm text-muted-foreground">{row.videoTitle}</span>,
    },
    {
      id: "savedAt",
      header: "Saved",
      accessor: "savedAt",
      sortable: true,
      width: 120,
      render: (row: any) => row.savedAt ? <DateCell value={row.savedAt} format="relative" /> : <span>—</span>,
    },
  ];

  const generatedColumns: Column<any>[] = [
    {
      id: "type",
      header: "Type",
      accessor: "type",
      sortable: true,
      width: 140,
      render: (row: any) => (
        <Badge variant="secondary" className="text-xs capitalize">
          {row.type?.replace(/_/g, " ") || "custom"}
        </Badge>
      ),
    },
    { id: "title", header: "Title", accessor: "title", sortable: true, width: 280 },
    {
      id: "content",
      header: "Preview",
      accessor: "content",
      width: 350,
      render: (row: any) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {row.content?.substring(0, 150)}...
        </span>
      ),
    },
    {
      id: "templateName",
      header: "Template",
      accessor: "templateName",
      sortable: true,
      width: 150,
    },
    {
      id: "createdAt",
      header: "Created",
      accessor: "createdAt",
      sortable: true,
      width: 130,
      render: (row: any) => row.createdAt ? <DateCell value={row.createdAt} format="relative" /> : <span>—</span>,
    },
  ];

  const amazonColumns: Column<any>[] = [
    {
      id: "imageUrl",
      header: "",
      accessor: "imageUrl",
      width: 60,
      render: (row: any) => row.imageUrl ? (
        <img src={row.imageUrl} alt={row.title || ""} className="w-10 h-10 rounded object-cover" />
      ) : null,
    },
    { id: "title", header: "Product", accessor: "title", sortable: true, width: 300 },
    { id: "brand", header: "Brand", accessor: "brand", sortable: true, width: 120 },
    { id: "price", header: "Price", accessor: "price", sortable: true, width: 90 },
    { id: "rating", header: "Rating", accessor: "rating", sortable: true, width: 80 },
    {
      id: "reviewCount",
      header: "Reviews",
      accessor: "reviewCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (val: number) => <NumberCell value={val || 0} />,
    },
    { id: "asin", header: "ASIN", accessor: "asin", width: 120 },
    {
      id: "createdAt",
      header: "Added",
      accessor: "createdAt",
      sortable: true,
      width: 130,
      render: (val: string) => val ? <DateCell value={val} format="relative" /> : <span>—</span>,
    },
  ];

  const redditColumns: Column<any>[] = [
    { id: "subreddit", header: "Subreddit", accessor: "subreddit", sortable: true, width: 130 },
    { id: "title", header: "Title", accessor: "title", sortable: true, width: 350 },
    { id: "author", header: "Author", accessor: "author", sortable: true, width: 120 },
    {
      id: "score",
      header: "Score",
      accessor: "score",
      sortable: true,
      width: 80,
      align: "right",
      render: (val: number) => <NumberCell value={val || 0} />,
    },
    {
      id: "commentCount",
      header: "Comments",
      accessor: "commentCount",
      sortable: true,
      width: 100,
      align: "right",
      render: (val: number) => <NumberCell value={val || 0} />,
    },
    {
      id: "flair",
      header: "Flair",
      accessor: "flair",
      width: 120,
      render: (val: string) => val ? <Badge variant="outline" className="text-xs">{val}</Badge> : null,
    },
    {
      id: "postedAt",
      header: "Posted",
      accessor: "postedAt",
      sortable: true,
      width: 130,
      render: (val: string) => val ? <DateCell value={val} format="relative" /> : <span>—</span>,
    },
  ];

  const insightColumns: Column<any>[] = [
    {
      id: "category",
      header: "Category",
      accessor: "category",
      sortable: true,
      width: 140,
      render: (val: string) => (
        <Badge variant="secondary" className="text-xs capitalize">
          {val?.replace(/_/g, " ") || "other"}
        </Badge>
      ),
    },
    { id: "commentText", header: "Comment", accessor: "commentText", sortable: true, width: 350,
      render: (val: string) => <span className="line-clamp-2 text-sm">{val}</span>,
    },
    { id: "authorName", header: "Author", accessor: "authorName", sortable: true, width: 130 },
    { id: "videoTitle", header: "Video", accessor: "videoTitle", sortable: true, width: 200,
      render: (val: string) => <span className="line-clamp-1 text-sm text-muted-foreground">{val}</span>,
    },
    {
      id: "sentimentScore",
      header: "Sentiment",
      accessor: "sentimentScore",
      sortable: true,
      width: 100,
      align: "center",
      render: (val: number) => {
        const color = val > 0 ? "text-green-600" : val < 0 ? "text-red-600" : "text-gray-500";
        return <span className={`font-mono text-sm ${color}`}>{val > 0 ? "+" : ""}{val}</span>;
      },
    },
    {
      id: "marketingPotential",
      header: "Mkt Potential",
      accessor: "marketingPotential",
      sortable: true,
      width: 120,
      align: "center",
      render: (val: number) => {
        const color = val >= 70 ? "bg-green-100 text-green-800" : val >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800";
        return <Badge className={`text-xs ${color}`}>{val}/100</Badge>;
      },
    },
    {
      id: "likeCount",
      header: "Likes",
      accessor: "likeCount",
      sortable: true,
      width: 80,
      align: "right",
      render: (val: number) => <NumberCell value={val || 0} />,
    },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case "videos": return filterData(videosQuery.data);
      case "comments": return filterData(commentsQuery.data);
      case "generated": return filterData(generatedQuery.data);
      case "amazon": return filterData(amazonQuery.data);
      case "reddit": return filterData(redditQuery.data);
      case "insights": return filterData(insightsQuery.data);
      default: return [];
    }
  };

  const getActiveColumns = (): Column<any>[] => {
    switch (activeTab) {
      case "videos": return videoColumns;
      case "comments": return commentColumns;
      case "generated": return generatedColumns;
      case "amazon": return amazonColumns;
      case "reddit": return redditColumns;
      case "insights": return insightColumns;
      default: return [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "videos": return videosQuery.isLoading;
      case "comments": return commentsQuery.isLoading;
      case "generated": return generatedQuery.isLoading;
      case "amazon": return amazonQuery.isLoading;
      case "reddit": return redditQuery.isLoading;
      case "insights": return insightsQuery.isLoading;
      default: return false;
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (activeTab === "comments") {
      bulkDeleteComments.mutate({ ids: Array.from(selectedIds).map(Number) });
    } else {
      toast.info("Bulk delete is available for saved comments");
    }
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case "videos": videosQuery.refetch(); break;
      case "comments": commentsQuery.refetch(); break;
      case "generated": generatedQuery.refetch(); break;
      case "amazon": amazonQuery.refetch(); break;
      case "reddit": redditQuery.refetch(); break;
      case "insights": insightsQuery.refetch(); break;
    }
    toast.success("Data refreshed");
  };

  const handleRowClick = (row: any) => {
    setDetailItem(row);
    setDetailType(activeTab);
  };

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      <PageHeader
        title="Data Manager"
        description="Browse, filter, and manage all collected data in one place"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Select
              value="csv"
              onValueChange={(val) => {
                const data = getActiveData();
                if (val === "csv") exportToCSV(data, activeTab);
                else exportToJSON(data, activeTab);
              }}
            >
              <SelectTrigger className="w-[130px] h-8">
                <Download className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export CSV</SelectItem>
                <SelectItem value="json">Export JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("videos")}>
          <CardContent className="p-3 flex items-center gap-3">
            <Video className={`h-5 w-5 ${activeTab === "videos" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{tabCounts.videos}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("comments")}>
          <CardContent className="p-3 flex items-center gap-3">
            <MessageSquare className={`h-5 w-5 ${activeTab === "comments" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{tabCounts.comments}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("generated")}>
          <CardContent className="p-3 flex items-center gap-3">
            <Sparkles className={`h-5 w-5 ${activeTab === "generated" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{tabCounts.generated}</p>
              <p className="text-xs text-muted-foreground">Generated</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("amazon")}>
          <CardContent className="p-3 flex items-center gap-3">
            <ShoppingCart className={`h-5 w-5 ${activeTab === "amazon" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{tabCounts.amazon}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("reddit")}>
          <CardContent className="p-3 flex items-center gap-3">
            <Globe className={`h-5 w-5 ${activeTab === "reddit" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{tabCounts.reddit}</p>
              <p className="text-xs text-muted-foreground">Reddit</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("insights")}>
          <CardContent className="p-3 flex items-center gap-3">
            <Sparkles className={`h-5 w-5 ${activeTab === "insights" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{tabCounts.insights}</p>
              <p className="text-xs text-muted-foreground">AI Insights</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all fields..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedIds.size} selected</Badge>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {getActiveData().length} rows
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as DataTab); setSelectedIds(new Set()); }}>
        <TabsList className="grid grid-cols-6 w-full max-w-2xl">
          <TabsTrigger value="videos" className="text-xs">
            <Video className="h-3 w-3 mr-1" /> Videos
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" /> Comments
          </TabsTrigger>
          <TabsTrigger value="generated" className="text-xs">
            <FileText className="h-3 w-3 mr-1" /> Generated
          </TabsTrigger>
          <TabsTrigger value="amazon" className="text-xs">
            <ShoppingCart className="h-3 w-3 mr-1" /> Amazon
          </TabsTrigger>
          <TabsTrigger value="reddit" className="text-xs">
            <Globe className="h-3 w-3 mr-1" /> Reddit
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> Insights
          </TabsTrigger>
        </TabsList>

        {/* All tabs render the same DataTable with different columns/data */}
        <div className="mt-4">
          {isLoading() ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading data...</span>
            </div>
          ) : getActiveData().length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg">No data yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {globalSearch
                    ? `No results matching "${globalSearch}"`
                    : `Start by analyzing content from the respective source page`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={getActiveData()}
              columns={getActiveColumns()}
              keyField="id"
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={handleRowClick}
              compact
              storageKey={`data-manager-${activeTab}`}
              emptyMessage="No data found"
            />
          )}
        </div>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {detailType === "videos" && "Video Details"}
              {detailType === "comments" && "Comment Details"}
              {detailType === "generated" && "Generated Content"}
              {detailType === "amazon" && "Product Details"}
              {detailType === "reddit" && "Reddit Post"}
              {detailType === "insights" && "AI Insight"}
            </DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              {/* Video Detail */}
              {detailType === "videos" && (
                <div className="space-y-3">
                  {detailItem.thumbnailUrl && (
                    <img src={detailItem.thumbnailUrl} alt={detailItem.title} className="w-full rounded-lg" />
                  )}
                  <h3 className="font-semibold text-lg">{detailItem.title}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Channel:</span> {detailItem.channelTitle}</div>
                    <div><span className="text-muted-foreground">Views:</span> {(detailItem.viewCount || 0).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Likes:</span> {(detailItem.likeCount || 0).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Comments:</span> {(detailItem.commentCount || 0).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Duration:</span> {detailItem.duration}</div>
                    <div><span className="text-muted-foreground">Published:</span> {detailItem.publishedAt ? new Date(detailItem.publishedAt).toLocaleDateString() : "—"}</div>
                  </div>
                  {detailItem.description && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-10">{detailItem.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Comment Detail */}
              {detailType === "comments" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{detailItem.source || "youtube"}</Badge>
                    {detailItem.sentiment && (
                      <Badge className={`text-xs ${detailItem.sentiment === "positive" ? "bg-green-100 text-green-800" : detailItem.sentiment === "negative" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                        {detailItem.sentiment}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{detailItem.authorName}</p>
                    <p className="text-sm text-muted-foreground">{detailItem.videoTitle}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{detailItem.text}</p>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{detailItem.likeCount || 0} likes</span>
                    <span>{detailItem.replyCount || 0} replies</span>
                  </div>
                  {/* Nested replies */}
                  {detailItem.replies && detailItem.replies.length > 0 && (
                    <div className="ml-4 border-l-2 border-muted pl-4 space-y-3">
                      <h4 className="font-medium text-sm">Replies ({detailItem.replies.length})</h4>
                      {detailItem.replies.map((reply: any, i: number) => (
                        <div key={i} className="bg-muted/30 p-3 rounded">
                          <p className="font-medium text-xs">{reply.authorName}</p>
                          <p className="text-sm mt-1">{reply.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{reply.likeCount || 0} likes</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Generated Content Detail */}
              {detailType === "generated" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{detailItem.type?.replace(/_/g, " ")}</Badge>
                    {detailItem.templateName && <Badge variant="outline">{detailItem.templateName}</Badge>}
                  </div>
                  <h3 className="font-semibold">{detailItem.title}</h3>
                  <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{detailItem.content}</pre>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {detailItem.createdAt ? new Date(detailItem.createdAt).toLocaleString() : "—"}
                  </div>
                </div>
              )}

              {/* Amazon Detail */}
              {detailType === "amazon" && (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {detailItem.imageUrl && (
                      <img src={detailItem.imageUrl} alt={detailItem.title} className="w-24 h-24 rounded object-cover" />
                    )}
                    <div>
                      <h3 className="font-semibold">{detailItem.title}</h3>
                      <p className="text-sm text-muted-foreground">{detailItem.brand}</p>
                      <div className="flex gap-3 mt-2 text-sm">
                        <span>{detailItem.price}</span>
                        <span>Rating: {detailItem.rating}</span>
                        <span>{detailItem.reviewCount} reviews</span>
                      </div>
                    </div>
                  </div>
                  {detailItem.description && (
                    <p className="text-sm text-muted-foreground">{detailItem.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">ASIN: {detailItem.asin}</p>
                </div>
              )}

              {/* Reddit Detail */}
              {detailType === "reddit" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">r/{detailItem.subreddit}</Badge>
                    {detailItem.flair && <Badge variant="secondary">{detailItem.flair}</Badge>}
                  </div>
                  <h3 className="font-semibold">{detailItem.title}</h3>
                  <p className="text-sm text-muted-foreground">by u/{detailItem.author}</p>
                  {detailItem.body && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{detailItem.body}</p>
                    </div>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{detailItem.score} points</span>
                    <span>{detailItem.commentCount} comments</span>
                  </div>
                </div>
              )}

              {/* Insight Detail */}
              {detailType === "insights" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{detailItem.category?.replace(/_/g, " ")}</Badge>
                    <Badge className={`text-xs ${detailItem.sentimentScore > 0 ? "bg-green-100 text-green-800" : detailItem.sentimentScore < 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                      Sentiment: {detailItem.sentimentScore > 0 ? "+" : ""}{detailItem.sentimentScore}
                    </Badge>
                    <Badge variant="outline">Mkt Potential: {detailItem.marketingPotential}/100</Badge>
                  </div>
                  <div>
                    <p className="font-medium">{detailItem.authorName}</p>
                    <p className="text-sm text-muted-foreground">{detailItem.videoTitle}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{detailItem.commentText}</p>
                  </div>
                  {detailItem.extractedInsights && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Extracted Insights</h4>
                      <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto">
                        {JSON.stringify(detailItem.extractedInsights, null, 2)}
                      </pre>
                    </div>
                  )}
                  {detailItem.suggestedUses && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Suggested Uses</h4>
                      <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto">
                        {JSON.stringify(detailItem.suggestedUses, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
