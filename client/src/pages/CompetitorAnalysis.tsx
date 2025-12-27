import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  const [youtubeChannels, setYoutubeChannels] = useState<string[]>([""]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [apiProvider, setApiProvider] = useState<"sample" | "rainforest" | "scraperapi">("sample");
  const [apiKey, setApiKey] = useState("");

  // Load saved API key
  useEffect(() => {
    const savedKey = localStorage.getItem("amazon_api_key");
    const savedProvider = localStorage.getItem("amazon_api_provider");
    if (savedKey) setApiKey(savedKey);
    if (savedProvider) setApiProvider(savedProvider as any);
  }, []);

  // Amazon comparison mutation
  const compareAmazonMutation = trpc.amazon.compareProducts.useMutation({
    onSuccess: (data) => {
      setComparisonResult(data);
      toast.success("Comparison complete!");
    },
    onError: (error) => {
      toast.error(`Comparison failed: ${error.message}`);
    },
  });

  // Add ASIN input
  const addAsinInput = () => {
    if (amazonAsins.length < 5) {
      setAmazonAsins([...amazonAsins, ""]);
    }
  };

  // Remove ASIN input
  const removeAsinInput = (index: number) => {
    if (amazonAsins.length > 1) {
      setAmazonAsins(amazonAsins.filter((_, i) => i !== index));
    }
  };

  // Update ASIN
  const updateAsin = (index: number, value: string) => {
    const newAsins = [...amazonAsins];
    newAsins[index] = value;
    setAmazonAsins(newAsins);
  };

  // Run Amazon comparison
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

  // Get sentiment color
  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
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
          </TabsList>

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
                              localStorage.setItem("amazon_api_provider", apiProvider);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={runAmazonComparison}
                      disabled={isComparing || amazonAsins.filter(a => a.trim()).length < 2}
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
                  </CardContent>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2 space-y-6">
                {comparisonResult ? (
                  <>
                    {/* Comparison Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          Product Comparison
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-2 font-medium">Product</th>
                                <th className="text-center py-3 px-2 font-medium">Rating</th>
                                <th className="text-center py-3 px-2 font-medium">Reviews</th>
                                <th className="text-center py-3 px-2 font-medium">Price</th>
                                <th className="text-center py-3 px-2 font-medium">Sentiment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comparisonResult.comparison.map((product, index) => (
                                <tr key={product.asin} className="border-b last:border-0">
                                  <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="shrink-0">
                                        #{index + 1}
                                      </Badge>
                                      <span className="text-sm line-clamp-2">{product.title}</span>
                                    </div>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <div className={`flex items-center justify-center gap-1 ${getRatingColor(product.rating)}`}>
                                      <Star className="h-4 w-4 fill-current" />
                                      <span className="font-medium">{product.rating.toFixed(1)}</span>
                                    </div>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <span className="text-sm">{product.reviewCount.toLocaleString()}</span>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <span className="font-medium">{product.price}</span>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <div className={`flex items-center justify-center gap-1 ${getSentimentColor(product.sentimentScore)}`}>
                                      {product.sentimentScore >= 70 ? (
                                        <ThumbsUp className="h-4 w-4" />
                                      ) : product.sentimentScore >= 40 ? (
                                        <Minus className="h-4 w-4" />
                                      ) : (
                                        <ThumbsDown className="h-4 w-4" />
                                      )}
                                      <span className="font-medium">{product.sentimentScore.toFixed(0)}%</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Strengths & Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {comparisonResult.comparison.map((product) => (
                        <Card key={product.asin}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm line-clamp-1">{product.title}</CardTitle>
                            <CardDescription>ASIN: {product.asin}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {product.strengths.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Strengths
                                </div>
                                <ul className="space-y-1">
                                  {product.strengths.map((strength, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {product.weaknesses.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-red-600 mb-2">
                                  <XCircle className="h-4 w-4" />
                                  Weaknesses
                                </div>
                                <ul className="space-y-1">
                                  {product.weaknesses.map((weakness, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-red-500 mt-1">•</span>
                                      {weakness}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
                          <CardDescription>
                            AI-generated insights from the competitive analysis
                          </CardDescription>
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

          <TabsContent value="youtube">
            <Card>
              <CardContent className="py-12 text-center">
                <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">YouTube Channel Comparison</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Compare engagement, sentiment, and content themes across YouTube channels
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
