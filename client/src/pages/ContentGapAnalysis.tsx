import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  Video,
  FileText,
  Mic,
  MessageSquare,
  Clock,
  Eye,
  Heart,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Download,
  Filter,
  Zap,
  PieChart,
  Activity,
} from "lucide-react";

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  blog_post: FileText,
  podcast: Mic,
  social_post: MessageSquare,
  other: FileText,
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ContentGapAnalysis() {
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>("90");
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const competitorsQuery = trpc.competitorAnalysis.getCompetitors.useQuery();
  const calendarEntriesQuery = trpc.competitorAnalysis.getCalendarEntries.useQuery({});

  // Analyze content gap mutation
  const analyzeGapMutation = trpc.competitorAnalysis.analyzeContentGap.useMutation({
    onSuccess: (data) => {
      toast.success("Content gap analysis complete!");
    },
    onError: (error) => {
      toast.error(error.message || "Analysis failed");
    },
  });

  // Process data for analysis
  const analysisData = useMemo(() => {
    const entries = calendarEntriesQuery.data || [];
    const competitors = competitorsQuery.data || [];
    
    if (entries.length === 0) {
      return {
        contentTypeDistribution: {},
        topicCoverage: {},
        postingFrequency: {},
        engagementBenchmarks: {},
        contentGaps: [],
        opportunities: [],
        bestPostingTimes: [],
        competitorStrengths: {},
      };
    }

    // Filter by time range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.publishedAt);
      const inTimeRange = entryDate >= cutoffDate;
      const matchesCompetitor = selectedCompetitors.length === 0 || 
        selectedCompetitors.includes(entry.competitorId.toString());
      return inTimeRange && matchesCompetitor;
    });

    // Content type distribution by competitor
    const contentTypeDistribution: Record<string, Record<string, number>> = {};
    const topicCoverage: Record<string, Set<string>> = {};
    const postingByDay: Record<string, Record<number, number>> = {};
    const postingByHour: Record<string, Record<number, number>> = {};
    const engagementByCompetitor: Record<string, { views: number; likes: number; comments: number; count: number }> = {};

    filteredEntries.forEach(entry => {
      const competitorId = entry.competitorId.toString();
      const competitor = competitors.find(c => c.id === entry.competitorId);
      const competitorName = competitor?.name || `Competitor ${competitorId}`;

      // Content type distribution
      if (!contentTypeDistribution[competitorName]) {
        contentTypeDistribution[competitorName] = {};
      }
      contentTypeDistribution[competitorName][entry.contentType] = 
        (contentTypeDistribution[competitorName][entry.contentType] || 0) + 1;

      // Topic coverage
      if (!topicCoverage[competitorName]) {
        topicCoverage[competitorName] = new Set();
      }
      const topics = entry.topics as string[] | null;
      if (topics && Array.isArray(topics)) {
        topics.forEach(topic => topicCoverage[competitorName].add(topic.toLowerCase()));
      }

      // Posting patterns
      if (!postingByDay[competitorName]) {
        postingByDay[competitorName] = {};
      }
      if (!postingByHour[competitorName]) {
        postingByHour[competitorName] = {};
      }
      if (entry.dayOfWeek !== null) {
        postingByDay[competitorName][entry.dayOfWeek] = 
          (postingByDay[competitorName][entry.dayOfWeek] || 0) + 1;
      }
      if (entry.hourOfDay !== null) {
        postingByHour[competitorName][entry.hourOfDay] = 
          (postingByHour[competitorName][entry.hourOfDay] || 0) + 1;
      }

      // Engagement metrics
      if (!engagementByCompetitor[competitorName]) {
        engagementByCompetitor[competitorName] = { views: 0, likes: 0, comments: 0, count: 0 };
      }
      engagementByCompetitor[competitorName].views += entry.views || 0;
      engagementByCompetitor[competitorName].likes += entry.likes || 0;
      engagementByCompetitor[competitorName].comments += entry.comments || 0;
      engagementByCompetitor[competitorName].count += 1;
    });

    // Calculate engagement benchmarks
    const engagementBenchmarks: Record<string, { avgViews: number; avgLikes: number; avgComments: number; engagementRate: number }> = {};
    Object.entries(engagementByCompetitor).forEach(([name, data]) => {
      const avgViews = data.count > 0 ? Math.round(data.views / data.count) : 0;
      const avgLikes = data.count > 0 ? Math.round(data.likes / data.count) : 0;
      const avgComments = data.count > 0 ? Math.round(data.comments / data.count) : 0;
      const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
      engagementBenchmarks[name] = { avgViews, avgLikes, avgComments, engagementRate };
    });

    // Find content gaps (topics covered by competitors but not by you)
    const allTopics = new Set<string>();
    Object.values(topicCoverage).forEach(topics => {
      topics.forEach(topic => allTopics.add(topic));
    });

    // Find best posting times across all competitors
    const aggregatedByDay: Record<number, { count: number; engagement: number }> = {};
    const aggregatedByHour: Record<number, { count: number; engagement: number }> = {};
    
    filteredEntries.forEach(entry => {
      if (entry.dayOfWeek !== null) {
        if (!aggregatedByDay[entry.dayOfWeek]) {
          aggregatedByDay[entry.dayOfWeek] = { count: 0, engagement: 0 };
        }
        aggregatedByDay[entry.dayOfWeek].count += 1;
        aggregatedByDay[entry.dayOfWeek].engagement += (entry.views || 0) + (entry.likes || 0) * 10;
      }
      if (entry.hourOfDay !== null) {
        if (!aggregatedByHour[entry.hourOfDay]) {
          aggregatedByHour[entry.hourOfDay] = { count: 0, engagement: 0 };
        }
        aggregatedByHour[entry.hourOfDay].count += 1;
        aggregatedByHour[entry.hourOfDay].engagement += (entry.views || 0) + (entry.likes || 0) * 10;
      }
    });

    const bestPostingTimes = Object.entries(aggregatedByDay)
      .map(([day, data]) => ({
        day: parseInt(day),
        dayName: DAYS[parseInt(day)],
        count: data.count,
        avgEngagement: data.count > 0 ? Math.round(data.engagement / data.count) : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Calculate competitor strengths
    const competitorStrengths: Record<string, string[]> = {};
    Object.entries(contentTypeDistribution).forEach(([name, types]) => {
      const strengths: string[] = [];
      const totalContent = Object.values(types).reduce((a, b) => a + b, 0);
      
      Object.entries(types).forEach(([type, count]) => {
        const percentage = (count / totalContent) * 100;
        if (percentage > 30) {
          strengths.push(`Strong in ${type.replace(/_/g, " ")}`);
        }
      });
      
      const benchmark = engagementBenchmarks[name];
      if (benchmark && benchmark.engagementRate > 5) {
        strengths.push("High engagement rate");
      }
      
      competitorStrengths[name] = strengths;
    });

    // Generate content gap opportunities
    const contentGaps: { topic: string; coveredBy: string[]; opportunity: string }[] = [];
    const topicCountMap: Record<string, string[]> = {};
    
    Object.entries(topicCoverage).forEach(([name, topics]) => {
      topics.forEach(topic => {
        if (!topicCountMap[topic]) {
          topicCountMap[topic] = [];
        }
        topicCountMap[topic].push(name);
      });
    });

    // Topics covered by multiple competitors are opportunities
    Object.entries(topicCountMap)
      .filter(([_, names]) => names.length >= 2)
      .slice(0, 10)
      .forEach(([topic, names]) => {
        contentGaps.push({
          topic,
          coveredBy: names,
          opportunity: `${names.length} competitors cover this topic`,
        });
      });

    // Generate strategic opportunities
    const opportunities: { title: string; description: string; priority: "high" | "medium" | "low"; type: string }[] = [];
    
    // Check for underserved content types
    const allContentTypes = new Set<string>();
    Object.values(contentTypeDistribution).forEach(types => {
      Object.keys(types).forEach(type => allContentTypes.add(type));
    });
    
    if (!allContentTypes.has("podcast")) {
      opportunities.push({
        title: "Podcast Content Gap",
        description: "No competitors are creating podcast content - this could be a differentiation opportunity",
        priority: "medium",
        type: "content_type",
      });
    }
    
    if (!allContentTypes.has("webinar")) {
      opportunities.push({
        title: "Webinar Opportunity",
        description: "Webinars are underutilized in your competitive landscape",
        priority: "medium",
        type: "content_type",
      });
    }

    // Check for posting time gaps
    const lowActivityDays = Object.entries(aggregatedByDay)
      .filter(([_, data]) => data.count < 3)
      .map(([day]) => DAYS[parseInt(day)]);
    
    if (lowActivityDays.length > 0) {
      opportunities.push({
        title: "Low Competition Days",
        description: `${lowActivityDays.join(", ")} have less competitor activity - consider posting then`,
        priority: "high",
        type: "timing",
      });
    }

    return {
      contentTypeDistribution,
      topicCoverage: Object.fromEntries(
        Object.entries(topicCoverage).map(([k, v]) => [k, Array.from(v)])
      ),
      postingFrequency: postingByDay,
      engagementBenchmarks,
      contentGaps,
      opportunities,
      bestPostingTimes,
      competitorStrengths,
      totalEntries: filteredEntries.length,
    };
  }, [calendarEntriesQuery.data, competitorsQuery.data, selectedCompetitors, timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMaxEngagement = () => {
    const benchmarks = Object.values(analysisData.engagementBenchmarks);
    if (benchmarks.length === 0) return 1;
    return Math.max(...benchmarks.map(b => b.avgViews)) || 1;
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Content Gap Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Identify opportunities and gaps in your competitive content landscape
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              calendarEntriesQuery.refetch();
              competitorsQuery.refetch();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Analyzed</p>
                <p className="text-2xl font-bold">{analysisData.totalEntries || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Competitors Tracked</p>
                <p className="text-2xl font-bold">{Object.keys(analysisData.contentTypeDistribution).length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Gaps Found</p>
                <p className="text-2xl font-bold">{analysisData.contentGaps.length}</p>
              </div>
              <Target className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold">{analysisData.opportunities.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <PieChart className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content-types">
            <BarChart3 className="w-4 h-4 mr-2" />
            Content Types
          </TabsTrigger>
          <TabsTrigger value="timing">
            <Clock className="w-4 h-4 mr-2" />
            Posting Times
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Activity className="w-4 h-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="opportunities">
            <Sparkles className="w-4 h-4 mr-2" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Content Gaps
                </CardTitle>
                <CardDescription>
                  Topics covered by multiple competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisData.contentGaps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No content gaps identified yet.</p>
                    <p className="text-sm mt-2">Add more competitor content to the calendar to see gaps.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {analysisData.contentGaps.map((gap, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-orange-500">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">{gap.topic}</p>
                            <p className="text-sm text-muted-foreground">{gap.opportunity}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {gap.coveredBy.map((name, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Strategic Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Strategic Opportunities
                </CardTitle>
                <CardDescription>
                  Actionable insights from competitor analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisData.opportunities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No opportunities identified yet.</p>
                    <p className="text-sm mt-2">Add more competitor content to discover opportunities.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {analysisData.opportunities.map((opp, index) => (
                        <div key={index} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {opp.priority === "high" ? (
                                <Zap className="w-4 h-4 text-red-500" />
                              ) : opp.priority === "medium" ? (
                                <TrendingUp className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <ArrowRight className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="font-medium">{opp.title}</span>
                            </div>
                            <Badge variant={
                              opp.priority === "high" ? "destructive" : 
                              opp.priority === "medium" ? "default" : "secondary"
                            }>
                              {opp.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{opp.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Competitor Strengths */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Competitor Strengths
                </CardTitle>
                <CardDescription>
                  Key strengths identified for each competitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(analysisData.competitorStrengths).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No competitor data available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysisData.competitorStrengths).map(([name, strengths]) => (
                      <div key={name} className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold mb-2">{name}</h4>
                        {strengths.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No specific strengths identified</p>
                        ) : (
                          <div className="space-y-1">
                            {strengths.map((strength, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{strength}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Types Tab */}
        <TabsContent value="content-types">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(analysisData.contentTypeDistribution).map(([competitor, types]) => (
              <Card key={competitor}>
                <CardHeader>
                  <CardTitle>{competitor}</CardTitle>
                  <CardDescription>Content type breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(types)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const total = Object.values(types).reduce((a, b) => a + b, 0);
                        const percentage = Math.round((count / total) * 100);
                        const Icon = CONTENT_TYPE_ICONS[type] || FileText;
                        
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="capitalize">{type.replace(/_/g, " ")}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
            {Object.keys(analysisData.contentTypeDistribution).length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No content type data available.</p>
                    <p className="text-sm mt-2">Import competitor content to see distribution.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Posting Times Tab */}
        <TabsContent value="timing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Best Days to Post
                </CardTitle>
                <CardDescription>
                  Days with highest competitor engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisData.bestPostingTimes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posting time data available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisData.bestPostingTimes.map((day, index) => {
                      const maxEngagement = analysisData.bestPostingTimes[0]?.avgEngagement || 1;
                      const percentage = Math.round((day.avgEngagement / maxEngagement) * 100);
                      
                      return (
                        <div key={day.day} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Badge variant="default" className="text-xs">Best</Badge>}
                              <span className="font-medium">{day.dayName}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {day.count} posts · {formatNumber(day.avgEngagement)} avg engagement
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Timing Recommendations
                </CardTitle>
                <CardDescription>
                  Strategic posting time suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.bestPostingTimes.length > 0 && (
                    <>
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-700 dark:text-green-400">
                            High Engagement Days
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {analysisData.bestPostingTimes.slice(0, 3).map(d => d.dayName).join(", ")} show 
                          the highest engagement. Consider posting your best content on these days.
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">
                            Low Competition Days
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {analysisData.bestPostingTimes.slice(-2).map(d => d.dayName).join(" and ")} have 
                          less competitor activity. You could stand out more on these days.
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700 dark:text-blue-400">
                        General Tip
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Consistency matters more than timing. Pick a schedule you can maintain 
                      and stick to it for best results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Engagement Benchmarks
              </CardTitle>
              <CardDescription>
                Compare engagement metrics across competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(analysisData.engagementBenchmarks).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No engagement data available.</p>
                  <p className="text-sm mt-2">Import competitor content with engagement metrics to see benchmarks.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(analysisData.engagementBenchmarks)
                    .sort((a, b) => b[1].avgViews - a[1].avgViews)
                    .map(([name, metrics]) => {
                      const maxViews = getMaxEngagement();
                      const viewsPercentage = Math.round((metrics.avgViews / maxViews) * 100);
                      
                      return (
                        <div key={name} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{name}</span>
                            <Badge variant={metrics.engagementRate > 5 ? "default" : "secondary"}>
                              {metrics.engagementRate.toFixed(2)}% engagement
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <Eye className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                              <p className="text-lg font-bold">{formatNumber(metrics.avgViews)}</p>
                              <p className="text-xs text-muted-foreground">Avg Views</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                              <p className="text-lg font-bold">{formatNumber(metrics.avgLikes)}</p>
                              <p className="text-xs text-muted-foreground">Avg Likes</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-green-500" />
                              <p className="text-lg font-bold">{formatNumber(metrics.avgComments)}</p>
                              <p className="text-xs text-muted-foreground">Avg Comments</p>
                            </div>
                          </div>
                          <Progress value={viewsPercentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  All Opportunities
                </CardTitle>
                <CardDescription>
                  Prioritized list of content opportunities based on competitor analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisData.opportunities.length === 0 && analysisData.contentGaps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No opportunities identified yet.</p>
                    <p className="text-sm mt-2">
                      Add more competitor content to the calendar to discover opportunities.
                    </p>
                    <Button className="mt-4" variant="outline" asChild>
                      <a href="/competitor-calendar">Go to Content Calendar</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* High Priority */}
                    {analysisData.opportunities.filter(o => o.priority === "high").length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-red-500" />
                          High Priority
                        </h4>
                        <div className="space-y-3">
                          {analysisData.opportunities
                            .filter(o => o.priority === "high")
                            .map((opp, i) => (
                              <div key={i} className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-medium">{opp.title}</h5>
                                    <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                                  </div>
                                  <Badge variant="destructive">High</Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Content Gaps as Opportunities */}
                    {analysisData.contentGaps.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          Topic Opportunities
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysisData.contentGaps.map((gap, i) => (
                            <div key={i} className="p-4 rounded-lg border bg-orange-500/5">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium capitalize">{gap.topic}</h5>
                                <Badge variant="outline">{gap.coveredBy.length} competitors</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{gap.opportunity}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medium Priority */}
                    {analysisData.opportunities.filter(o => o.priority === "medium").length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-yellow-500" />
                          Medium Priority
                        </h4>
                        <div className="space-y-3">
                          {analysisData.opportunities
                            .filter(o => o.priority === "medium")
                            .map((opp, i) => (
                              <div key={i} className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-medium">{opp.title}</h5>
                                    <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                                  </div>
                                  <Badge>Medium</Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
