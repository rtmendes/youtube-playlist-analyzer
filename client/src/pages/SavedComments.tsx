import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Bookmark,
  Search,
  Trash2,
  Download,
  Copy,
  CheckCircle,
  ExternalLink,
  Edit,
  Youtube,
  ShoppingCart,
  MessageCircle,
  Music,
  Filter,
  X,
  Calendar,
  ThumbsUp,
  Loader2,
  FolderPlus,
  Folder,
  FolderOpen,
  Palette,
  MoreVertical,
  Plus,
  ChevronRight,
  Brain,
  Sparkles,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SourceType = "all" | "youtube" | "amazon" | "reddit" | "tiktok";

interface SavedComment {
  id: number;
  userId: string;
  sourceType: string;
  sourceId: string;
  commentId: string;
  authorName: string;
  text: string;
  notes: string | null;
  highlighted: boolean;
  savedAt: string;
  collectionName?: string | null;
}

interface Collection {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  commentCount: number;
  createdAt: string;
}

const COLLECTION_COLORS = [
  "#6366f1", // indigo
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

const SOURCE_ICONS = {
  youtube: Youtube,
  amazon: ShoppingCart,
  reddit: MessageCircle,
  tiktok: Music,
};

const SOURCE_COLORS = {
  youtube: "text-red-500",
  amazon: "text-orange-500",
  reddit: "text-orange-600",
  tiktok: "text-pink-500",
};

export default function SavedComments() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceType>("all");
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: number; notes: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  // Collections state
  const [activeTab, setActiveTab] = useState<"all" | "collections" | "analysis">("all");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState(COLLECTION_COLORS[0]);
  const [nlpAnalysisOpen, setNlpAnalysisOpen] = useState(false);
  const [nlpResult, setNlpResult] = useState<{
    topics: { topic: string; score: number }[];
    sentimentBreakdown: { positive: number; negative: number; neutral: number; mixed: number };
    keyThemes: string[];
    painPoints: { text: string }[];
    suggestions: { text: string }[];
    questions: string[];
    summary: string;
  } | null>(null);

  const { data: savedComments, isLoading, refetch } = trpc.savedComments.getAll.useQuery(
    undefined,
    { enabled: !!user }
  ) as { data: SavedComment[] | undefined; isLoading: boolean; refetch: () => void };

  const updateNotesMutation = trpc.savedComments.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes updated!");
      refetch();
      setEditingComment(null);
    },
    onError: () => toast.error("Failed to update notes"),
  });

  const deleteMutation = trpc.savedComments.delete.useMutation({
    onSuccess: () => {
      toast.success("Comment removed from saved!");
      refetch();
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  const bulkDeleteMutation = trpc.savedComments.bulkDelete.useMutation({
    onSuccess: () => {
      toast.success(`${selectedComments.size} comments removed!`);
      refetch();
      setSelectedComments(new Set());
    },
    onError: () => toast.error("Failed to delete comments"),
  });

  // Collections queries and mutations
  const { data: collections, refetch: refetchCollections } = trpc.collections.getAll.useQuery(
    undefined,
    { enabled: !!user }
  ) as { data: Collection[] | undefined; refetch: () => void };

  const createCollectionMutation = trpc.collections.create.useMutation({
    onSuccess: () => {
      toast.success("Collection created!");
      refetchCollections();
      setCreateCollectionOpen(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
      setNewCollectionColor(COLLECTION_COLORS[0]);
    },
    onError: () => toast.error("Failed to create collection"),
  });

  const updateCollectionMutation = trpc.collections.update.useMutation({
    onSuccess: () => {
      toast.success("Collection updated!");
      refetchCollections();
      setEditCollectionOpen(null);
    },
    onError: () => toast.error("Failed to update collection"),
  });

  const deleteCollectionMutation = trpc.collections.delete.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted!");
      refetchCollections();
      refetch();
      setSelectedCollection(null);
    },
    onError: () => toast.error("Failed to delete collection"),
  });

  const addToCollectionMutation = trpc.collections.addComment.useMutation({
    onSuccess: () => {
      toast.success("Added to collection!");
      refetch();
      refetchCollections();
    },
    onError: () => toast.error("Failed to add to collection"),
  });

  const removeFromCollectionMutation = trpc.collections.removeComment.useMutation({
    onSuccess: () => {
      toast.success("Removed from collection!");
      refetch();
      refetchCollections();
    },
    onError: () => toast.error("Failed to remove from collection"),
  });

  const nlpAnalysisMutation = trpc.nlpAnalysis.analyzeComments.useMutation({
    onSuccess: (data) => {
      setNlpResult(data);
      setNlpAnalysisOpen(true);
      toast.success("Analysis complete!");
    },
    onError: () => toast.error("Failed to analyze comments"),
  });

  // Filter comments
  const filteredComments = useMemo(() => {
    if (!savedComments) return [];
    
    let filtered = savedComments;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.text.toLowerCase().includes(query) ||
          c.authorName.toLowerCase().includes(query) ||
          (c.notes && c.notes.toLowerCase().includes(query))
      );
    }
    
    if (sourceFilter !== "all") {
      filtered = filtered.filter((c) => c.sourceType === sourceFilter);
    }

    // Collection filter
    if (selectedCollection) {
      filtered = filtered.filter((c) => c.collectionName === selectedCollection);
    }
    
    return filtered;
  }, [savedComments, searchQuery, sourceFilter, selectedCollection]);

  // Group by collection
  const commentsByCollection = useMemo(() => {
    if (!savedComments) return {};
    const groups: Record<string, SavedComment[]> = { uncategorized: [] };
    savedComments.forEach((comment) => {
      const key = comment.collectionName || "uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(comment);
    });
    return groups;
  }, [savedComments]);

  // Run NLP analysis
  const runNlpAnalysis = useCallback(() => {
    const commentsToAnalyze = selectedComments.size > 0
      ? filteredComments.filter((c) => selectedComments.has(c.id))
      : filteredComments;
    
    if (commentsToAnalyze.length === 0) {
      toast.error("No comments to analyze");
      return;
    }

    nlpAnalysisMutation.mutate({
      comments: commentsToAnalyze.map((c) => ({
        id: String(c.id),
        text: c.text,
        authorName: c.authorName || undefined,
      })),
      sourceType: sourceFilter === "all" ? "mixed" : sourceFilter,
    });
  }, [filteredComments, selectedComments, sourceFilter, nlpAnalysisMutation]);

  // Group by source
  const groupedComments = useMemo(() => {
    const groups: Record<string, typeof filteredComments> = {};
    filteredComments.forEach((comment) => {
      const key = `${comment.sourceType}-${comment.sourceId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(comment);
    });
    return groups;
  }, [filteredComments]);

  // Source counts
  const sourceCounts = useMemo(() => {
    if (!savedComments) return { youtube: 0, amazon: 0, reddit: 0, tiktok: 0 };
    const counts = { youtube: 0, amazon: 0, reddit: 0, tiktok: 0 };
    savedComments.forEach((c) => {
      if (c.sourceType in counts) {
        counts[c.sourceType as keyof typeof counts]++;
      }
    });
    return counts;
  }, [savedComments]);

  // Copy comment
  const copyComment = useCallback(async (comment: { id: number; text: string }) => {
    try {
      await navigator.clipboard.writeText(comment.text);
      setCopiedId(comment.id);
      toast.success("Comment copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  // Export to CSV
  const exportCSV = useCallback(() => {
    const comments = selectedComments.size > 0
      ? filteredComments.filter((c) => selectedComments.has(c.id))
      : filteredComments;
    
    const headers = ["Source", "Author", "Comment", "Notes", "Saved Date"];
    const rows = comments.map((c: SavedComment) => [
      c.sourceType,
      c.authorName,
      `"${c.text.replace(/"/g, '""')}"`,
      c.notes ? `"${c.notes.replace(/"/g, '""')}"` : "",
      new Date(c.savedAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saved-comments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Comments exported to CSV!");
  }, [filteredComments, selectedComments]);

  // Toggle selection
  const toggleSelect = useCallback((id: number) => {
    setSelectedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    if (selectedComments.size === filteredComments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(filteredComments.map((c: SavedComment) => c.id)));
    }
  }, [filteredComments, selectedComments]);

  if (!user) {
    return (
      <div className="p-6">
        <Breadcrumb items={[{ label: "Saved Comments" }]} />
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view saved comments</h2>
            <p className="text-muted-foreground">
              Save comments from YouTube, Amazon, Reddit, and TikTok for future reference.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: "Saved Comments" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="h-6 w-6" />
            Saved Comments
          </h1>
          <p className="text-muted-foreground mt-1">
            {savedComments?.length || 0} comments saved across all sources
          </p>
        </div>
      </div>

      {/* Source Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(["youtube", "amazon", "reddit", "tiktok"] as const).map((source) => {
          const Icon = SOURCE_ICONS[source];
          return (
            <Card
              key={source}
              className={`cursor-pointer transition-all ${
                sourceFilter === source ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSourceFilter(sourceFilter === source ? "all" : source)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${SOURCE_COLORS[source]}`} />
                <div>
                  <p className="text-2xl font-bold">{sourceCounts[source]}</p>
                  <p className="text-xs text-muted-foreground capitalize">{source}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saved comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sourceFilter} onValueChange={(v: SourceType) => setSourceFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>

            {/* Collection filter */}
            {collections && collections.length > 0 && (
              <Select 
                value={selectedCollection || "all"} 
                onValueChange={(v) => setSelectedCollection(v === "all" ? null : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <Folder className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.name}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                        {col.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {selectedComments.size > 0 && (
                <>
                  <Badge variant="secondary">{selectedComments.size} selected</Badge>
                  
                  {/* Add to collection dropdown */}
                  {collections && collections.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FolderPlus className="h-4 w-4 mr-1" />
                          Add to Collection
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {collections.map((col) => (
                          <DropdownMenuItem
                            key={col.id}
                            onClick={() => {
                              selectedComments.forEach((commentId) => {
                                addToCollectionMutation.mutate({ collectionId: col.id, commentId });
                              });
                            }}
                          >
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: col.color }} />
                            {col.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => bulkDeleteMutation.mutate({ ids: Array.from(selectedComments) })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedComments(new Set())}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* NLP Analysis button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runNlpAnalysis}
                disabled={nlpAnalysisMutation.isPending}
              >
                {nlpAnalysisMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-1" />
                )}
                Analyze
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setCreateCollectionOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Collection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections Grid */}
      {collections && collections.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {collections.map((col) => (
            <Card
              key={col.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCollection === col.name ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedCollection(selectedCollection === col.name ? null : col.name)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: col.color }} />
                    <span className="font-medium text-sm truncate">{col.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditCollectionOpen(col); }}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteCollectionMutation.mutate({ id: col.id }); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {commentsByCollection[col.name]?.length || 0} comments
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading saved comments...</p>
          </CardContent>
        </Card>
      ) : filteredComments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved comments</h3>
            <p className="text-muted-foreground">
              {searchQuery || sourceFilter !== "all"
                ? "No comments match your filters."
                : "Start saving comments from your analysis to see them here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-2 px-2">
            <Checkbox
              checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({filteredComments.length})
            </span>
          </div>

          {/* Grouped Comments */}
          {Object.entries(groupedComments).map(([key, comments]) => {
            const [sourceType] = key.split("-");
            const Icon = SOURCE_ICONS[sourceType as keyof typeof SOURCE_ICONS] || MessageCircle;
            
            return (
              <Card key={key}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${SOURCE_COLORS[sourceType as keyof typeof SOURCE_COLORS] || ""}`} />
                    <CardTitle className="text-sm font-medium capitalize">
                      {sourceType} • {comments.length} comment{comments.length !== 1 ? "s" : ""}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[400px]">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 border-t flex gap-3 hover:bg-muted/30 transition-colors ${
                          selectedComments.has(comment.id) ? "bg-primary/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selectedComments.has(comment.id)}
                          onCheckedChange={() => toggleSelect(comment.id)}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(comment.savedAt).toLocaleDateString()}
                            </span>
                            {comment.highlighted && (
                              <Badge variant="secondary" className="text-xs">Highlighted</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {comment.text}
                          </p>
                          
                          {comment.notes && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                              <strong>Notes:</strong> {comment.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-start gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyComment(comment)}
                              >
                                {copiedId === comment.id ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingComment({ id: comment.id, notes: comment.notes || "" })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit notes</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteConfirm(comment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Notes Dialog */}
      <Dialog open={!!editingComment} onOpenChange={() => setEditingComment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about this comment..."
            value={editingComment?.notes || ""}
            onChange={(e) => setEditingComment((prev) => prev ? { ...prev, notes: e.target.value } : null)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingComment(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingComment) {
                  updateNotesMutation.mutate({ id: editingComment.id, notes: editingComment.notes });
                }
              }}
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to remove this comment from your saved collection?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm) {
                  deleteMutation.mutate({ id: deleteConfirm });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog */}
      <Dialog open={createCollectionOpen} onOpenChange={setCreateCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., Product Ideas, Pain Points..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="What is this collection for?"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newCollectionColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCollectionColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCollectionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createCollectionMutation.mutate({
                name: newCollectionName,
                description: newCollectionDesc || undefined,
                color: newCollectionColor,
              })}
              disabled={!newCollectionName || createCollectionMutation.isPending}
            >
              {createCollectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={!!editCollectionOpen} onOpenChange={() => setEditCollectionOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          {editCollectionOpen && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editCollectionOpen.name}
                  onChange={(e) => setEditCollectionOpen({ ...editCollectionOpen, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editCollectionOpen.description || ""}
                  onChange={(e) => setEditCollectionOpen({ ...editCollectionOpen, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 mt-2">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-all ${
                        editCollectionOpen.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditCollectionOpen({ ...editCollectionOpen, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCollectionOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editCollectionOpen) {
                  updateCollectionMutation.mutate({
                    id: editCollectionOpen.id,
                    name: editCollectionOpen.name,
                    description: editCollectionOpen.description || undefined,
                    color: editCollectionOpen.color,
                  });
                }
              }}
              disabled={updateCollectionMutation.isPending}
            >
              {updateCollectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NLP Analysis Results Dialog */}
      <Dialog open={nlpAnalysisOpen} onOpenChange={setNlpAnalysisOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Comment Analysis Results
            </DialogTitle>
          </DialogHeader>
          {nlpResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{nlpResult.summary}</p>
              </div>

              {/* Sentiment Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Sentiment Breakdown</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{nlpResult.sentimentBreakdown.positive}</p>
                    <p className="text-xs text-green-600">Positive</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{nlpResult.sentimentBreakdown.negative}</p>
                    <p className="text-xs text-red-600">Negative</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-600">{nlpResult.sentimentBreakdown.neutral}</p>
                    <p className="text-xs text-gray-600">Neutral</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{nlpResult.sentimentBreakdown.mixed}</p>
                    <p className="text-xs text-yellow-600">Mixed</p>
                  </div>
                </div>
              </div>

              {/* Top Topics */}
              <div>
                <h4 className="font-semibold mb-3">Top Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {nlpResult.topics.slice(0, 10).map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {topic.topic}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({Math.round(topic.score * 100)}%)
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Key Themes */}
              {nlpResult.keyThemes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Key Themes</h4>
                  <ul className="space-y-1">
                    {nlpResult.keyThemes.map((theme, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary" />
                        {theme}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pain Points */}
              {nlpResult.painPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">Pain Points</h4>
                  <div className="space-y-2">
                    {nlpResult.painPoints.slice(0, 5).map((point, i) => (
                      <div key={i} className="p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                        {point.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {nlpResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-blue-600">Suggestions from Audience</h4>
                  <div className="space-y-2">
                    {nlpResult.suggestions.slice(0, 5).map((suggestion, i) => (
                      <div key={i} className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                        {suggestion.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {nlpResult.questions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-purple-600">Common Questions</h4>
                  <div className="space-y-2">
                    {nlpResult.questions.slice(0, 5).map((question, i) => (
                      <div key={i} className="p-2 bg-purple-50 dark:bg-purple-950 rounded text-sm">
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNlpAnalysisOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
