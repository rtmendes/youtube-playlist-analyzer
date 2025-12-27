import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
  MessageSquare,
  Heart,
  Lightbulb,
  ShoppingBag,
  Smile,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle2,
  Plus,
  FolderPlus,
  Tag,
  Save,
  Download,
  Wand2,
  Brain,
  Target,
  Users,
  TrendingUp,
  Loader2,
  ChevronRight,
  X,
  Star,
  Copy,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Comment category definitions with icons and colors
const CATEGORIES = {
  personal_story: { label: "Personal Story", icon: Heart, color: "bg-pink-500", description: "Personal experiences and narratives" },
  testimonial: { label: "Testimonial", icon: Star, color: "bg-yellow-500", description: "Positive endorsements and reviews" },
  product_request: { label: "Product Request", icon: ShoppingBag, color: "bg-green-500", description: "Requests for products or features" },
  pain_point: { label: "Pain Point", icon: AlertCircle, color: "bg-red-500", description: "Problems and frustrations" },
  humor: { label: "Humor", icon: Smile, color: "bg-purple-500", description: "Funny comments with viral potential" },
  question: { label: "Question", icon: HelpCircle, color: "bg-blue-500", description: "Questions seeking answers" },
  praise: { label: "Praise", icon: ThumbsUp, color: "bg-emerald-500", description: "Positive feedback and appreciation" },
  criticism: { label: "Criticism", icon: ThumbsDown, color: "bg-orange-500", description: "Negative feedback and complaints" },
  suggestion: { label: "Suggestion", icon: Lightbulb, color: "bg-cyan-500", description: "Ideas and recommendations" },
  other: { label: "Other", icon: MessageSquare, color: "bg-gray-500", description: "Uncategorized comments" },
};

// Pattern detection keywords
const PATTERNS = {
  personal_story: ["my story", "i remember", "when i was", "happened to me", "my experience", "i went through", "i struggled", "i overcame", "changed my life", "i learned"],
  testimonial: ["this helped me", "thanks to", "recommend", "best thing", "life changing", "game changer", "must watch", "amazing", "incredible", "saved my"],
  product_request: ["i want", "need this", "make a", "should sell", "where can i buy", "take my money", "shut up and take", "needs to be a", "would buy", "merch"],
  pain_point: ["i hate", "frustrated", "annoying", "problem is", "struggle with", "can't figure out", "doesn't work", "wish it", "if only", "tired of"],
  humor: ["lol", "lmao", "😂", "dead", "i'm crying", "hilarious", "comedy gold", "underrated comment", "this killed me", "💀"],
  question: ["how do", "what is", "why does", "can someone", "does anyone know", "help me", "?", "wondering", "curious about", "explain"],
};

interface Comment {
  id: string;
  videoId: string;
  videoTitle?: string;
  authorDisplayName: string;
  textOriginal: string;
  likeCount: number;
  replyCount: number;
  publishedAt: string;
}

interface AnalyzedComment extends Comment {
  category: keyof typeof CATEGORIES;
  sentimentScore: number;
  marketingPotential: number;
  matchedPatterns: string[];
  isSelected: boolean;
}

export default function Intelligence() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const analysisId = params.get("analysisId");
  
  const { isAuthenticated } = useAuth();
  
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [analyzedComments, setAnalyzedComments] = useState<AnalyzedComment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("marketing");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  
  // Load analysis data
  const analysisQuery = trpc.analysis.getById.useQuery(
    { id: parseInt(analysisId || "0") },
    { enabled: !!analysisId && isAuthenticated }
  );
  
  // Create project mutation
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created!");
      setLocation(`/canvas?projectId=${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  // Load comments from analysis
  useEffect(() => {
    if (analysisQuery.data?.commentsData) {
      const commentsData = analysisQuery.data.commentsData as Comment[];
      setComments(commentsData);
      analyzeComments(commentsData);
    }
  }, [analysisQuery.data]);

  // Analyze comments with pattern detection
  const analyzeComments = (commentsToAnalyze: Comment[]) => {
    setIsAnalyzing(true);
    
    const analyzed: AnalyzedComment[] = commentsToAnalyze.map(comment => {
      const text = comment.textOriginal.toLowerCase();
      let category: keyof typeof CATEGORIES = "other";
      let matchedPatterns: string[] = [];
      let maxMatches = 0;
      
      // Pattern matching for category detection
      for (const [cat, patterns] of Object.entries(PATTERNS)) {
        const matches = patterns.filter(p => text.includes(p.toLowerCase()));
        if (matches.length > maxMatches) {
          maxMatches = matches.length;
          category = cat as keyof typeof CATEGORIES;
          matchedPatterns = matches;
        }
      }
      
      // Simple sentiment analysis
      const positiveWords = ["love", "great", "amazing", "awesome", "best", "thank", "helpful", "incredible", "fantastic", "excellent"];
      const negativeWords = ["hate", "bad", "worst", "terrible", "awful", "disappointed", "annoying", "frustrating", "useless", "waste"];
      
      const positiveCount = positiveWords.filter(w => text.includes(w)).length;
      const negativeCount = negativeWords.filter(w => text.includes(w)).length;
      const sentimentScore = Math.max(-100, Math.min(100, (positiveCount - negativeCount) * 25));
      
      // Marketing potential score
      let marketingPotential = 0;
      
      // High engagement = higher potential
      marketingPotential += Math.min(30, comment.likeCount / 10);
      marketingPotential += Math.min(20, comment.replyCount * 5);
      
      // Certain categories have higher marketing potential
      if (category === "personal_story") marketingPotential += 25;
      if (category === "testimonial") marketingPotential += 30;
      if (category === "product_request") marketingPotential += 25;
      if (category === "pain_point") marketingPotential += 20;
      if (category === "humor") marketingPotential += 15;
      
      // Longer comments often have more substance
      if (comment.textOriginal.length > 200) marketingPotential += 10;
      if (comment.textOriginal.length > 500) marketingPotential += 10;
      
      marketingPotential = Math.min(100, Math.round(marketingPotential));
      
      return {
        ...comment,
        category,
        sentimentScore,
        marketingPotential,
        matchedPatterns,
        isSelected: false,
      };
    });
    
    setAnalyzedComments(analyzed);
    setIsAnalyzing(false);
  };

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let filtered = [...analyzedComments];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.textOriginal.toLowerCase().includes(query) ||
        c.authorDisplayName.toLowerCase().includes(query) ||
        c.videoTitle?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
    // Sort
    switch (sortBy) {
      case "marketing":
        filtered.sort((a, b) => b.marketingPotential - a.marketingPotential);
        break;
      case "likes":
        filtered.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "sentiment":
        filtered.sort((a, b) => b.sentimentScore - a.sentimentScore);
        break;
      case "replies":
        filtered.sort((a, b) => b.replyCount - a.replyCount);
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
    }
    
    return filtered;
  }, [analyzedComments, searchQuery, categoryFilter, sortBy]);

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const cat of Object.keys(CATEGORIES)) {
      stats[cat] = analyzedComments.filter(c => c.category === cat).length;
    }
    return stats;
  }, [analyzedComments]);

  // Toggle comment selection
  const toggleSelection = (commentId: string) => {
    setAnalyzedComments(prev => {
      const updated = prev.map(c => 
        c.id === commentId ? { ...c, isSelected: !c.isSelected } : c
      );
      setSelectedCount(updated.filter(c => c.isSelected).length);
      return updated;
    });
  };

  // Select all visible
  const selectAllVisible = () => {
    const visibleIds = new Set(filteredComments.map(c => c.id));
    setAnalyzedComments(prev => {
      const updated = prev.map(c => 
        visibleIds.has(c.id) ? { ...c, isSelected: true } : c
      );
      setSelectedCount(updated.filter(c => c.isSelected).length);
      return updated;
    });
  };

  // Clear selection
  const clearSelection = () => {
    setAnalyzedComments(prev => prev.map(c => ({ ...c, isSelected: false })));
    setSelectedCount(0);
  };

  // Create project with selected comments
  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    
    createProjectMutation.mutate({
      name: projectName,
      analysisSessionId: analysisId ? parseInt(analysisId) : undefined,
    });
  };

  // Export selected comments
  const exportSelected = () => {
    const selected = analyzedComments.filter(c => c.isSelected);
    if (selected.length === 0) {
      toast.error("No comments selected");
      return;
    }
    
    const headers = ["Category", "Marketing Potential", "Sentiment", "Author", "Comment", "Likes", "Replies", "Video"];
    const rows = selected.map(c => [
      CATEGORIES[c.category].label,
      c.marketingPotential,
      c.sentimentScore,
      `"${c.authorDisplayName.replace(/"/g, '""')}"`,
      `"${c.textOriginal.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.likeCount,
      c.replyCount,
      `"${(c.videoTitle || "").replace(/"/g, '""')}"`,
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-comments.csv";
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selected.length} comments`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access Comment Intelligence</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Analysis Selected</CardTitle>
            <CardDescription>Please select an analysis from your history to analyze comments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/history">Go to History</Link>
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
            <Link href="/history">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Comment Intelligence
              </h1>
              <p className="text-sm text-muted-foreground">
                {analysisQuery.data?.name || "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <>
                <Badge variant="secondary" className="gap-1">
                  {selectedCount} selected
                </Badge>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={exportSelected}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </>
            )}
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={selectedCount === 0}>
                  <Wand2 className="h-4 w-4" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Marketing Project</DialogTitle>
                  <DialogDescription>
                    Create a new project with {selectedCount} selected comments to generate marketing assets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., Q1 Ad Campaign Research"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Category Stats */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    categoryFilter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span className="text-sm font-medium">All Comments</span>
                  <Badge variant="secondary">{analyzedComments.length}</Badge>
                </button>
                {Object.entries(CATEGORIES).map(([key, { label, icon: Icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      categoryFilter === key ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-sm">{label}</span>
                    </div>
                    <Badge variant="secondary">{categoryStats[key] || 0}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Comments</span>
                  <span className="font-medium">{analyzedComments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">High Potential</span>
                  <span className="font-medium text-green-600">
                    {analyzedComments.filter(c => c.marketingPotential >= 70).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stories</span>
                  <span className="font-medium text-pink-600">{categoryStats.personal_story || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Product Requests</span>
                  <span className="font-medium text-green-600">{categoryStats.product_request || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search comments, authors, videos..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing Potential</SelectItem>
                      <SelectItem value="likes">Most Likes</SelectItem>
                      <SelectItem value="sentiment">Sentiment</SelectItem>
                      <SelectItem value="replies">Most Replies</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={selectAllVisible}>
                    Select All Visible
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            {isAnalyzing ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Analyzing comments...</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredComments.map((comment, index) => {
                      const CategoryIcon = CATEGORIES[comment.category].icon;
                      const categoryColor = CATEGORIES[comment.category].color;
                      
                      return (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <Card className={`transition-all ${comment.isSelected ? "ring-2 ring-primary" : ""}`}>
                            <CardContent className="pt-4">
                              <div className="flex gap-4">
                                {/* Selection Checkbox */}
                                <div className="pt-1">
                                  <Checkbox
                                    checked={comment.isSelected}
                                    onCheckedChange={() => toggleSelection(comment.id)}
                                  />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className={`${categoryColor} text-white gap-1`}>
                                        <CategoryIcon className="h-3 w-3" />
                                        {CATEGORIES[comment.category].label}
                                      </Badge>
                                      <span className="text-sm font-medium">{comment.authorDisplayName}</span>
                                      {comment.videoTitle && (
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                          • {comment.videoTitle}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Marketing</div>
                                        <div className={`text-sm font-bold ${
                                          comment.marketingPotential >= 70 ? "text-green-600" :
                                          comment.marketingPotential >= 40 ? "text-yellow-600" : "text-gray-500"
                                        }`}>
                                          {comment.marketingPotential}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Comment Text */}
                                  <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                                    {comment.textOriginal}
                                  </p>
                                  
                                  {/* Footer */}
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                      <span className="flex items-center gap-1">
                                        <ThumbsUp className="h-3 w-3" />
                                        {comment.likeCount}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {comment.replyCount} replies
                                      </span>
                                      <span className={`flex items-center gap-1 ${
                                        comment.sentimentScore > 0 ? "text-green-600" :
                                        comment.sentimentScore < 0 ? "text-red-600" : ""
                                      }`}>
                                        Sentiment: {comment.sentimentScore > 0 ? "+" : ""}{comment.sentimentScore}
                                      </span>
                                    </div>
                                    {comment.matchedPatterns.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-primary" />
                                        <span className="text-primary">
                                          Matched: {comment.matchedPatterns.slice(0, 2).join(", ")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {filteredComments.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No comments match your filters</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
