import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Target,
  Lightbulb,
  ShoppingCart,
  Youtube,
  Users,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Play,
  Sparkles,
  Crown,
  ExternalLink,
  Clock,
  Settings,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CompetitorProduct {
  asin: string;
  title: string;
  rating: number;
  reviewCount: number;
  price: string;
  sentimentScore: number;
  strengths: string[];
  weaknesses: string[];
}

interface ComparisonResult {
  comparison: CompetitorProduct[];
  insights: string[];
}

export default function CompetitorAnalysis() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState("amazon");
  const [amazonAsins, setAmazonAsins] = useState<string[]>([""]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [apiProvider, setApiProvider] = useState<"sample" | "rainforest" | "scraperapi">("sample");
  const [apiKey, setApiKey] = useState("");
  const [youtubeApiKey, setYoutubeApiKey] = useState("");

  // YouTube state
  const [showAddChannelDialog, setShowAddChannelDialog] = useState(false);
  const [newChannelId, setNewChannelId] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<number | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [comparisonName, setComparisonName] = useState("");

  // Alerts state
  const [showCreateAlertDialog, setShowCreateAlertDialog] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [alertType, setAlertType] = useState<string>("new_content");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertThresholdType, setAlertThresholdType] = useState<"absolute" | "percentage">("percentage");
  const [alertKeywords, setAlertKeywords] = useState("");
  const [alertFrequency, setAlertFrequency] = useState<"realtime" | "daily" | "weekly">("daily");
  const [alertCompetitorId, setAlertCompetitorId] = useState<number | null>(null);

  // Load saved API keys
  useEffect(() => {
    const savedKey = localStorage.getItem("amazon_api_key");
    const savedProvider = localStorage.getItem("amazon_api_provider");
    const savedYoutubeKey = localStorage.getItem("youtube_api_key");
    if (savedKey) setApiKey(savedKey);
    if (savedProvider) setApiProvider(savedProvider as any);
    if (savedYoutubeKey) setYoutubeApiKey(savedYoutubeKey);
  }, []);

  // Queries
  const competitorsQuery = trpc.competitorAnalysis.getCompetitors.useQuery();
  const youtubeChannelsQuery = trpc.competitorAnalysis.getYouTubeChannels.useQuery({});
  const youtubeComparisonsQuery = trpc.competitorAnalysis.getYouTubeComparisons.useQuery();
  const alertsQuery = trpc.competitorAnalysis.getAlerts.useQuery({});
  const alertHistoryQuery = trpc.competitorAnalysis.getAlertHistory.useQuery({ limit: 50 });
  const unreadAlertCountQuery = trpc.competitorAnalysis.getUnreadAlertCount.useQuery();

  // Mutations
  const compareAmazonMutation = trpc.amazon.compareProducts.useMutation({
    onSuccess: (data) => {
      setComparisonResult(data);
      toast.success("Comparison complete!");
    },
    onError: (error) => {
      toast.error(`Comparison failed: ${error.message}`);
    },
  });

  const addYouTubeChannelMutation = trpc.competitorAnalysis.addYouTubeChannel.useMutation({
    onSuccess: () => {
      toast.success("YouTube channel added!");
      setShowAddChannelDialog(false);
      setNewChannelId("");
      setNewChannelName("");
      youtubeChannelsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add channel: ${error.message}`);
    },
  });

  const analyzeChannelMutation = trpc.competitorAnalysis.analyzeYouTubeChannel.useMutation({
    onSuccess: (data) => {
      toast.success(`Channel analyzed: ${data.channelName}`);
      youtubeChannelsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const compareChannelsMutation = trpc.competitorAnalysis.compareYouTubeChannels.useMutation({
    onSuccess: (data) => {
      toast.success("Channel comparison complete!");
      setShowCompareDialog(false);
      setSelectedChannels([]);
      setComparisonName("");
      youtubeComparisonsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Comparison failed: ${error.message}`);
    },
  });

  const generateInsightsMutation = trpc.competitorAnalysis.generateYouTubeInsights.useMutation({
    onSuccess: () => {
      toast.success("AI insights generated!");
      youtubeComparisonsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to generate insights: ${error.message}`);
    },
  });

  const deleteChannelMutation = trpc.competitorAnalysis.deleteYouTubeChannel.useMutation({
    onSuccess: () => {
      toast.success("Channel deleted");
      youtubeChannelsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const createAlertMutation = trpc.competitorAnalysis.createAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert created!");
      setShowCreateAlertDialog(false);
      resetAlertForm();
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create alert: ${error.message}`);
    },
  });

  const toggleAlertMutation = trpc.competitorAnalysis.toggleAlert.useMutation({
    onSuccess: () => {
      alertsQuery.refetch();
    },
  });

  const deleteAlertMutation = trpc.competitorAnalysis.deleteAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert deleted");
      alertsQuery.refetch();
    },
  });

  const markAlertReadMutation = trpc.competitorAnalysis.markAlertRead.useMutation({
    onSuccess: () => {
      alertHistoryQuery.refetch();
      unreadAlertCountQuery.refetch();
    },
  });

  const markAllReadMutation = trpc.competitorAnalysis.markAllAlertsRead.useMutation({
    onSuccess: () => {
      toast.success("All alerts marked as read");
      alertHistoryQuery.refetch();
      unreadAlertCountQuery.refetch();
    },
  });

  const checkAlertsMutation = trpc.competitorAnalysis.checkAlerts.useMutation({
    onSuccess: (data) => {
      toast.success(`Checked ${data.alertsChecked} alerts, ${data.alertsTriggered} triggered`);
      alertHistoryQuery.refetch();
      unreadAlertCountQuery.refetch();
    },
  });

  const triggerTestAlertMutation = trpc.competitorAnalysis.triggerTestAlert.useMutation({
    onSuccess: () => {
      toast.success("Test alert triggered!");
      alertHistoryQuery.refetch();
      unreadAlertCountQuery.refetch();
    },
  });

  // Helper functions
  const resetAlertForm = () => {
    setAlertName("");
    setAlertType("new_content");
    setAlertThreshold("");
    setAlertThresholdType("percentage");
    setAlertKeywords("");
    setAlertFrequency("daily");
    setAlertCompetitorId(null);
  };

  const addAsinInput = () => {
    if (amazonAsins.length < 5) {
      setAmazonAsins([...amazonAsins, ""]);
    }
  };

  const removeAsinInput = (index: number) => {
    if (amazonAsins.length > 1) {
      setAmazonAsins(amazonAsins.filter((_, i) => i !== index));
    }
  };

  const updateAsin = (index: number, value: string) => {
    const newAsins = [...amazonAsins];
    newAsins[index] = value;
    setAmazonAsins(newAsins);
  };

  const runAmazonComparison = async () => {
    const validAsins = amazonAsins.filter(asin => asin.trim().length > 0);
    
    if (validAsins.length < 2) {
      toast.error("Please enter at least 2 product ASINs to compare");
      return;
    }

    setIsComparing(true);
    
    try {
      await compareAmazonMutation.mutateAsync({
        asins: validAsins,
        apiKey: apiKey || undefined,
        apiProvider,
      });
    } finally {
      setIsComparing(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      new_content: "New Content",
      review_change: "Review Changes",
      rating_change: "Rating Changes",
      price_change: "Price Changes",
      subscriber_milestone: "Subscriber Milestone",
      engagement_spike: "Engagement Spike",
      sentiment_shift: "Sentiment Shift",
      keyword_mention: "Keyword Mention",
      custom: "Custom",
    };
    return labels[type] || type;
  };

  const toggleChannelSelection = (channelId: number) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access Competitor Analysis</CardDescription>
          </CardHeader>
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
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Competitor Analysis
              </h1>
              <p className="text-sm text-muted-foreground">
                Compare products and channels to find market opportunities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(unreadAlertCountQuery.data || 0) > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Bell className="h-3 w-3" />
                {unreadAlertCountQuery.data} new
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="amazon" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Amazon Products
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4" />
              YouTube Channels
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
              {(unreadAlertCountQuery.data || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadAlertCountQuery.data}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Amazon Tab */}
          <TabsContent value="amazon">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Input Panel */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Products to Compare</CardTitle>
                    <CardDescription>Enter 2-5 Amazon product ASINs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {amazonAsins.map((asin, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Product ${index + 1} ASIN (e.g., B08N5WRWNW)`}
                          value={asin}
                          onChange={(e) => updateAsin(index, e.target.value)}
                        />
                        {amazonAsins.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAsinInput(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {amazonAsins.length < 5 && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={addAsinInput}
                      >
                        <Plus className="h-4 w-4" />
                        Add Product
                      </Button>
                    )}

                    <div className="pt-4 border-t space-y-3">
                      <div className="space-y-2">
                        <Label>Data Source</Label>
                        <Select value={apiProvider} onValueChange={(v: any) => setApiProvider(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sample">Sample Data (Demo)</SelectItem>
                            <SelectItem value="rainforest">Rainforest API</SelectItem>
                            <SelectItem value="scraperapi">ScraperAPI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {apiProvider !== "sample" && (
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={(e) => {
                              setApiKey(e.target.value);
                              localStorage.setItem("amazon_api_key", e.target.value);
                            }}
                          />
                        </div>
                      )}

                      <Button
                        className="w-full gap-2"
                        onClick={runAmazonComparison}
                        disabled={isComparing}
                      >
                        {isComparing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Comparing...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4" />
                            Compare Products
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2 space-y-6">
                {comparisonResult ? (
                  <>
                    {/* Product Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {comparisonResult.comparison.map((product, index) => (
                        <Card key={product.asin}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <Badge variant="secondary">{product.asin}</Badge>
                            </div>
                            <CardTitle className="text-sm line-clamp-2">{product.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Rating</p>
                                <p className={`text-lg font-bold ${getRatingColor(product.rating)}`}>
                                  {product.rating.toFixed(1)} <Star className="h-4 w-4 inline" />
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Reviews</p>
                                <p className="text-lg font-bold">{formatNumber(product.reviewCount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Price</p>
                                <p className="text-lg font-bold">{product.price}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Sentiment</p>
                                <p className={`text-lg font-bold ${getSentimentColor(product.sentimentScore)}`}>
                                  {product.sentimentScore}%
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> Strengths
                              </p>
                              <ul className="text-xs space-y-1">
                                {product.strengths.slice(0, 3).map((s, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3" /> Weaknesses
                              </p>
                              <ul className="text-xs space-y-1">
                                {product.weaknesses.slice(0, 3).map((w, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* AI Insights */}
                    {comparisonResult.insights.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            Market Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {comparisonResult.insights.map((insight, index) => (
                              <li key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                                <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No comparison results yet</p>
                      <p className="text-sm text-muted-foreground">
                        Enter product ASINs and click Compare to see results
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* YouTube Tab */}
          <TabsContent value="youtube">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Channel List */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">YouTube Channels</CardTitle>
                      <Button size="sm" onClick={() => setShowAddChannelDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <CardDescription>Track competitor YouTube channels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <Label>YouTube API Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter your YouTube API key"
                          value={youtubeApiKey}
                          onChange={(e) => {
                            setYoutubeApiKey(e.target.value);
                            localStorage.setItem("youtube_api_key", e.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {youtubeChannelsQuery.data?.map((channel) => (
                      <Card key={channel.id} className={`cursor-pointer transition-colors ${selectedChannels.includes(channel.id) ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedChannels.includes(channel.id)}
                              onCheckedChange={() => toggleChannelSelection(channel.id)}
                            />
                            {channel.thumbnailUrl && (
                              <img 
                                src={channel.thumbnailUrl} 
                                alt={channel.channelName}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{channel.channelName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatNumber(channel.subscriberCount)} subscribers
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {formatNumber(channel.videoCount)} videos
                                </Badge>
                                {channel.engagementRate && (
                                  <Badge variant="secondary" className="text-xs">
                                    {Number(channel.engagementRate).toFixed(2)}% eng
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!youtubeApiKey) {
                                    toast.error("Please enter your YouTube API key first");
                                    return;
                                  }
                                  analyzeChannelMutation.mutate({
                                    channelDbId: channel.id,
                                    apiKey: youtubeApiKey,
                                  });
                                }}
                                disabled={analyzeChannelMutation.isPending}
                              >
                                <RefreshCw className={`h-4 w-4 ${analyzeChannelMutation.isPending ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChannelMutation.mutate({ channelDbId: channel.id });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {(!youtubeChannelsQuery.data || youtubeChannelsQuery.data.length === 0) && (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <Youtube className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No channels added yet</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>

                {selectedChannels.length >= 2 && (
                  <Button 
                    className="w-full gap-2"
                    onClick={() => setShowCompareDialog(true)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Compare {selectedChannels.length} Channels
                  </Button>
                )}
              </div>

              {/* Comparisons */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Channel Comparisons</h3>
                </div>

                {youtubeComparisonsQuery.data?.map((comparison) => (
                  <Card key={comparison.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{comparison.name}</CardTitle>
                        <Badge variant="outline">
                          {(comparison.channelIds as number[])?.length || 0} channels
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Metrics Comparison */}
                      {comparison.metricsComparison && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2">Channel</th>
                                <th className="text-right py-2 px-2">Subscribers</th>
                                <th className="text-right py-2 px-2">Videos</th>
                                <th className="text-right py-2 px-2">Avg Views</th>
                                <th className="text-right py-2 px-2">Engagement</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(comparison.metricsComparison as any[])?.map((m: any, i: number) => (
                                <tr key={i} className={`border-b ${comparison.winner === m.channelId ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                                  <td className="py-2 px-2 flex items-center gap-2">
                                    {comparison.winner === m.channelId && (
                                      <Crown className="h-4 w-4 text-yellow-500" />
                                    )}
                                    {m.channelName}
                                  </td>
                                  <td className="text-right py-2 px-2">{formatNumber(m.subscribers)}</td>
                                  <td className="text-right py-2 px-2">{formatNumber(m.videos)}</td>
                                  <td className="text-right py-2 px-2">{formatNumber(m.avgViews)}</td>
                                  <td className="text-right py-2 px-2">{m.engagementRate?.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Winner */}
                      {comparison.winnerReason && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            Winner: {comparison.winnerReason}
                          </p>
                        </div>
                      )}

                      {/* Opportunities & Threats */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {(comparison.opportunities as string[])?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Opportunities
                            </p>
                            <ul className="text-xs space-y-1">
                              {(comparison.opportunities as string[]).map((o, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                  {o}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(comparison.threats as string[])?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Threats
                            </p>
                            <ul className="text-xs space-y-1">
                              {(comparison.threats as string[]).map((t, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* AI Insights */}
                      {comparison.aiInsights ? (
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs font-medium flex items-center gap-1 mb-2">
                            <Sparkles className="h-3 w-3 text-primary" /> AI Insights
                          </p>
                          <p className="text-xs whitespace-pre-wrap">{comparison.aiInsights}</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => generateInsightsMutation.mutate({ comparisonId: comparison.id })}
                          disabled={generateInsightsMutation.isPending}
                        >
                          {generateInsightsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Generate AI Insights
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {(!youtubeComparisonsQuery.data || youtubeComparisonsQuery.data.length === 0) && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No comparisons yet</p>
                      <p className="text-sm text-muted-foreground">
                        Select 2+ channels and click Compare to analyze
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Alert Configuration */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Alert Rules</CardTitle>
                      <Button size="sm" onClick={() => setShowCreateAlertDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create
                      </Button>
                    </div>
                    <CardDescription>Get notified when competitors make changes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => checkAlertsMutation.mutate()}
                      disabled={checkAlertsMutation.isPending}
                    >
                      {checkAlertsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Check All Alerts Now
                    </Button>
                  </CardContent>
                </Card>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {alertsQuery.data?.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{alert.name}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {getAlertTypeLabel(alert.alertType)}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {alert.frequency} • {alert.isEnabled ? 'Active' : 'Paused'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={alert.isEnabled || false}
                                onCheckedChange={(checked) => 
                                  toggleAlertMutation.mutate({ alertId: alert.id, isEnabled: checked })
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => triggerTestAlertMutation.mutate({ alertId: alert.id })}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteAlertMutation.mutate({ alertId: alert.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {(!alertsQuery.data || alertsQuery.data.length === 0) && (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No alerts configured</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Alert History */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Alert History</h3>
                  {(unreadAlertCountQuery.data || 0) > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => markAllReadMutation.mutate()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark All Read
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {alertHistoryQuery.data?.map((item) => (
                      <Card 
                        key={item.id} 
                        className={`${!item.isRead ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {!item.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                                <p className="font-medium text-sm">{item.title}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {getAlertTypeLabel(item.alertType)}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.triggeredAt ? new Date(item.triggeredAt).toLocaleString() : 'Unknown'}
                                </span>
                              </div>
                            </div>
                            {!item.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAlertReadMutation.mutate({ alertHistoryId: item.id })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {(!alertHistoryQuery.data || alertHistoryQuery.data.length === 0) && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No alerts triggered yet</p>
                          <p className="text-sm text-muted-foreground">
                            Create alert rules to start monitoring competitors
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add YouTube Channel Dialog */}
      <Dialog open={showAddChannelDialog} onOpenChange={setShowAddChannelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Channel</DialogTitle>
            <DialogDescription>
              Add a competitor's YouTube channel to track and compare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel ID</Label>
              <Input
                placeholder="UCxxxxxxxxxxxxxxxx"
                value={newChannelId}
                onChange={(e) => setNewChannelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find this in the channel URL: youtube.com/channel/UCxxxxxxx
              </p>
            </div>
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Link to Competitor (Optional)</Label>
              <Select 
                value={selectedCompetitorId?.toString() || ""} 
                onValueChange={(v) => setSelectedCompetitorId(v ? parseInt(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a competitor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {competitorsQuery.data?.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddChannelDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newChannelId || !newChannelName) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                addYouTubeChannelMutation.mutate({
                  competitorId: selectedCompetitorId || 0,
                  channelId: newChannelId,
                  channelName: newChannelName,
                });
              }}
              disabled={addYouTubeChannelMutation.isPending}
            >
              {addYouTubeChannelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Channels Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare YouTube Channels</DialogTitle>
            <DialogDescription>
              Create a comparison of {selectedChannels.length} selected channels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Comparison Name</Label>
              <Input
                placeholder="e.g., Top Tech Reviewers Comparison"
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
              />
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Channels:</p>
              <div className="flex flex-wrap gap-2">
                {selectedChannels.map((id) => {
                  const channel = youtubeChannelsQuery.data?.find(c => c.id === id);
                  return channel ? (
                    <Badge key={id} variant="outline">
                      {channel.channelName}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                compareChannelsMutation.mutate({
                  channelDbIds: selectedChannels,
                  name: comparisonName || undefined,
                });
              }}
              disabled={compareChannelsMutation.isPending}
            >
              {compareChannelsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Compare Channels
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Alert Dialog */}
      <Dialog open={showCreateAlertDialog} onOpenChange={setShowCreateAlertDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Alert</DialogTitle>
            <DialogDescription>
              Get notified when competitors make changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alert Name</Label>
              <Input
                placeholder="e.g., New video from competitor"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Competitor</Label>
              <Select 
                value={alertCompetitorId?.toString() || ""} 
                onValueChange={(v) => setAlertCompetitorId(v ? parseInt(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a competitor" />
                </SelectTrigger>
                <SelectContent>
                  {competitorsQuery.data?.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alert Type</Label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_content">New Content Published</SelectItem>
                  <SelectItem value="review_change">Review Changes</SelectItem>
                  <SelectItem value="rating_change">Rating Changes</SelectItem>
                  <SelectItem value="price_change">Price Changes</SelectItem>
                  <SelectItem value="subscriber_milestone">Subscriber Milestone</SelectItem>
                  <SelectItem value="engagement_spike">Engagement Spike</SelectItem>
                  <SelectItem value="sentiment_shift">Sentiment Shift</SelectItem>
                  <SelectItem value="keyword_mention">Keyword Mention</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(alertType === "subscriber_milestone" || alertType === "engagement_spike" || alertType === "rating_change") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={alertThresholdType} onValueChange={(v: any) => setAlertThresholdType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="absolute">Absolute Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {alertType === "keyword_mention" && (
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Textarea
                  placeholder="e.g., product launch, new feature, discount"
                  value={alertKeywords}
                  onChange={(e) => setAlertKeywords(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Check Frequency</Label>
              <Select value={alertFrequency} onValueChange={(v: any) => setAlertFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateAlertDialog(false);
              resetAlertForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!alertName || !alertCompetitorId) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                createAlertMutation.mutate({
                  competitorId: alertCompetitorId,
                  name: alertName,
                  alertType: alertType as any,
                  threshold: alertThreshold ? parseInt(alertThreshold) : undefined,
                  thresholdType: alertThresholdType,
                  keywords: alertKeywords ? alertKeywords.split(",").map(k => k.trim()) : undefined,
                  frequency: alertFrequency,
                });
              }}
              disabled={createAlertMutation.isPending}
            >
              {createAlertMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
