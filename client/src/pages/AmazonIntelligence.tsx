import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Package,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Filter,
  Download,
  Plus,
  Sparkles,
  BarChart3,
  PieChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sentiment colors
const SENTIMENT_COLORS = {
  positive: "bg-green-500",
  neutral: "bg-gray-500",
  negative: "bg-red-500",
};

interface AmazonProduct {
  asin: string;
  title: string;
  description?: string;
  brand?: string;
  price?: string;
  rating?: string;
  reviewCount?: number;
  imageUrl?: string;
  productUrl?: string;
  category?: string;
  features?: string[];
}

interface AmazonReview {
  reviewId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  helpfulVotes: number;
  verified: boolean;
  reviewDate: Date;
  sentiment?: "positive" | "neutral" | "negative";
  themes?: string[];
  painPoints?: string[];
  praises?: string[];
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  verifiedPercentage: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topThemes: string[];
  topPainPoints: string[];
  topPraises: string[];
}

export default function AmazonIntelligence() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // State
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<AmazonProduct | null>(null);
  const [reviews, setReviews] = useState<AmazonReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // TRPC mutations
  const parseUrlMutation = trpc.amazon.parseUrl.useQuery(
    { url: urlInput },
    { enabled: false }
  );
  const getProductMutation = trpc.amazon.getProduct.useMutation();
  const getReviewsMutation = trpc.amazon.getReviews.useMutation();

  // Handle URL submission
  const handleAnalyze = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter an Amazon product URL or ASIN");
      return;
    }

    setIsLoading(true);
    try {
      // Parse URL to get ASIN
      const response = await fetch(`/api/trpc/amazon.parseUrl?input=${encodeURIComponent(JSON.stringify({ url: urlInput }))}`);
      const data = await response.json();
      
      if (!data.result?.data?.asin) {
        toast.error("Could not extract ASIN from URL. Please enter a valid Amazon product URL or ASIN.");
        setIsLoading(false);
        return;
      }

      const asin = data.result.data.asin;

      // Fetch product details
      const productResult = await getProductMutation.mutateAsync({ asin });
      setProduct(productResult as AmazonProduct);

      // Fetch reviews
      const reviewsResult = await getReviewsMutation.mutateAsync({ asin, count: 20 });
      setReviews(reviewsResult.reviews as AmazonReview[]);
      setStats(reviewsResult.stats as ReviewStats);

      toast.success("Product analysis complete!");
      setActiveTab("reviews");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze product");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (filterRating !== "all" && review.rating !== parseInt(filterRating)) return false;
    if (filterSentiment !== "all" && review.sentiment !== filterSentiment) return false;
    if (filterVerified === "verified" && !review.verified) return false;
    if (filterVerified === "unverified" && review.verified) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        review.title.toLowerCase().includes(query) ||
        review.body.toLowerCase().includes(query) ||
        review.author.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Toggle review selection
  const toggleReviewSelection = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  // Select all filtered reviews
  const selectAllFiltered = () => {
    const newSelected = new Set(selectedReviews);
    filteredReviews.forEach(review => newSelected.add(review.reviewId));
    setSelectedReviews(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedReviews(new Set());
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-orange-500" />
                  Amazon Intelligence
                </h1>
                <p className="text-sm text-muted-foreground">
                  Analyze Amazon product reviews to extract insights
                </p>
              </div>
            </div>
            {selectedReviews.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedReviews.size} selected</Badge>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Canvas
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Search
            </CardTitle>
            <CardDescription>
              Enter an Amazon product URL or ASIN to analyze reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="https://www.amazon.com/dp/B08N5WRWNW or B08N5WRWNW"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1"
              />
              <Button onClick={handleAnalyze} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Analyze
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: This uses sample data for demonstration. In production, integrate with Amazon Product Advertising API or a third-party service.
            </p>
          </CardContent>
        </Card>

        {/* Product Info */}
        {product && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
                    <div className="flex items-center gap-4 mb-3">
                      {product.brand && (
                        <Badge variant="outline">{product.brand}</Badge>
                      )}
                      {product.price && (
                        <span className="font-bold text-lg">{product.price}</span>
                      )}
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          {renderStars(parseFloat(product.rating))}
                          <span className="text-sm text-muted-foreground">
                            ({product.reviewCount?.toLocaleString()} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {product.productUrl && (
                      <Button variant="link" className="p-0 h-auto mt-2" asChild>
                        <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                          View on Amazon <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        {stats && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Reviews ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Average Rating */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Rating</p>
                        <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                    {renderStars(Math.round(stats.averageRating))}
                  </CardContent>
                </Card>

                {/* Total Reviews */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Reviews</p>
                        <p className="text-3xl font-bold">{stats.totalReviews}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {stats.verifiedPercentage.toFixed(0)}% verified purchases
                    </p>
                  </CardContent>
                </Card>

                {/* Positive Sentiment */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Positive</p>
                        <p className="text-3xl font-bold text-green-500">
                          {stats.sentimentBreakdown.positive}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <ThumbsUp className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <Progress 
                      value={(stats.sentimentBreakdown.positive / stats.totalReviews) * 100} 
                      className="mt-2 h-2"
                    />
                  </CardContent>
                </Card>

                {/* Negative Sentiment */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Negative</p>
                        <p className="text-3xl font-bold text-red-500">
                          {stats.sentimentBreakdown.negative}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ThumbsDown className="h-6 w-6 text-red-500" />
                      </div>
                    </div>
                    <Progress 
                      value={(stats.sentimentBreakdown.negative / stats.totalReviews) * 100} 
                      className="mt-2 h-2"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Rating Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rating Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = stats.ratingDistribution[rating] || 0;
                        const percentage = stats.totalReviews > 0 
                          ? (count / stats.totalReviews) * 100 
                          : 0;
                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-20">
                              <span className="text-sm font-medium">{rating}</span>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <Progress value={percentage} className="h-3" />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Themes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stats.topThemes.map(theme => (
                        <Badge key={theme} variant="secondary" className="text-sm">
                          {theme}
                        </Badge>
                      ))}
                      {stats.topThemes.length === 0 && (
                        <p className="text-sm text-muted-foreground">No themes detected yet</p>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Top Praises
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {stats.topPraises.map(praise => (
                          <Badge key={praise} variant="outline" className="text-sm border-green-500 text-green-600">
                            {praise}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Top Pain Points
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {stats.topPainPoints.map(painPoint => (
                          <Badge key={painPoint} variant="outline" className="text-sm border-red-500 text-red-600">
                            {painPoint}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              {/* Filters */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    
                    <Select value={filterRating} onValueChange={setFilterRating}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Sentiment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sentiment</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterVerified} onValueChange={setFilterVerified}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reviews</SelectItem>
                        <SelectItem value="verified">Verified Only</SelectItem>
                        <SelectItem value="unverified">Unverified Only</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex-1">
                      <Input
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>

                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                      Select All ({filteredReviews.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredReviews.map((review, index) => (
                      <motion.div
                        key={review.reviewId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`transition-all ${selectedReviews.has(review.reviewId) ? "ring-2 ring-primary" : ""}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Checkbox
                                checked={selectedReviews.has(review.reviewId)}
                                onCheckedChange={() => toggleReviewSelection(review.reviewId)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    {renderStars(review.rating)}
                                    <span className="font-medium">{review.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {review.verified && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verified
                                      </Badge>
                                    )}
                                    {review.sentiment && (
                                      <Badge className={`${SENTIMENT_COLORS[review.sentiment]} text-white text-xs`}>
                                        {review.sentiment}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  By {review.author} • {new Date(review.reviewDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm">{review.body}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {review.helpfulVotes} found helpful
                                  </span>
                                  {review.themes && review.themes.length > 0 && (
                                    <div className="flex gap-1">
                                      {review.themes.slice(0, 3).map(theme => (
                                        <Badge key={theme} variant="secondary" className="text-xs">
                                          {theme}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Marketing Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
                          Testimonial Goldmine
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {stats.sentimentBreakdown.positive} positive reviews contain potential testimonials 
                          for ads, landing pages, and social proof.
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                          Product Improvement Ideas
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {stats.topPainPoints.length} common pain points identified that could inform 
                          product development or competitor positioning.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2">
                          Content Themes
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Top themes like {stats.topThemes.slice(0, 2).join(", ")} can guide 
                          content marketing and SEO strategy.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Competitive Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Customer Expectations</h4>
                        <p className="text-sm text-muted-foreground">
                          Based on review analysis, customers expect:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                          {stats.topPraises.slice(0, 3).map(praise => (
                            <li key={praise}>{praise}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Market Gaps</h4>
                        <p className="text-sm text-muted-foreground">
                          Common complaints suggest opportunities:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                          {stats.topPainPoints.slice(0, 3).map(painPoint => (
                            <li key={painPoint}>{painPoint}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Export Selected Reviews</CardTitle>
                  <CardDescription>
                    Select reviews from the Reviews tab and export them for use in marketing materials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedReviews.size} reviews selected
                    </p>
                    <Button variant="outline" disabled={selectedReviews.size === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as CSV
                    </Button>
                    <Button disabled={selectedReviews.size === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Canvas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!product && !isLoading && (
          <Card className="p-12">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Product Selected</h3>
              <p className="text-muted-foreground mb-6">
                Enter an Amazon product URL or ASIN above to start analyzing reviews
              </p>
              <div className="max-w-md mx-auto text-left">
                <h4 className="font-medium mb-2">What you can discover:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Customer sentiment and satisfaction levels
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Common pain points and complaints
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Testimonials for marketing materials
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Product improvement opportunities
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
