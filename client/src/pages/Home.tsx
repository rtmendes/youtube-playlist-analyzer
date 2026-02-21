import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { getStoredYouTubeApiKey } from "@/lib/apiKeys";
import { 
  ArrowRight, Play, MessageSquare, BarChart3, Download, Search, Loader2, 
  List, FileText, History, Folder, Video, Users, Brain, Palette, 
  TrendingUp, Clock, Star, Zap, Database, FileSpreadsheet, Target,
  Lightbulb, BookOpen, Sparkles
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Home() {
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("bulk");
  const [videoLimit, setVideoLimit] = useState<string>("all");
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: apiKeyStatus } = trpc.system.getApiKeyStatus.useQuery();
  const serverHasYouTubeKey = !!apiKeyStatus?.youtube;
  const storedKey = getStoredYouTubeApiKey().trim();

  // Check for URL parameter from YouTube browser
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      setInputMode("single");
      setUrl(urlParam);
      window.history.replaceState({}, "", location.split("?")[0]);
    }
  }, [location]);

  const parseUrl = trpc.youtube.parseUrl.useQuery(
    { url },
    { enabled: url.length > 5 && inputMode === "single" }
  );

  const { data: dashboardStats } = trpc.dashboard.getStats.useQuery(undefined, {
    enabled: !!isAuthenticated,
  });

  // Parse bulk URLs to count valid entries
  const parseBulkUrls = () => {
    const lines = bulkUrls.split("\n").filter(line => line.trim().length > 0);
    return lines;
  };

  const bulkUrlCount = parseBulkUrls().length;

  const handleAnalyze = () => {
    if (!serverHasYouTubeKey && !storedKey) {
      alert("YouTube API key required. Add it in Settings, or set YOUTUBE_API_KEY in the server .env file.");
      return;
    }
    const keyToPass = serverHasYouTubeKey ? "" : storedKey;

    if (inputMode === "bulk") {
      const urls = parseBulkUrls();
      if (urls.length === 0) {
        alert("Please enter at least one URL");
        return;
      }
      const encodedUrls = encodeURIComponent(urls.join("\n"));
      const limitParam = videoLimit !== "all" ? `&limit=${videoLimit}` : "";
      setLocation(`/bulk-analyze?urls=${encodedUrls}&key=${encodeURIComponent(keyToPass)}${limitParam}`);
    } else {
      if (parseUrl.data?.type === "playlist_id") {
        setLocation(`/analyze?playlist=${parseUrl.data.value}&key=${encodeURIComponent(keyToPass)}`);
      } else if (parseUrl.data?.type === "video_id") {
        setLocation(`/video?id=${parseUrl.data.value}&key=${encodeURIComponent(keyToPass)}`);
      } else if (parseUrl.data?.type === "channel_id" || parseUrl.data?.type === "channel_handle") {
        setLocation(`/channel?id=${parseUrl.data.value}&key=${encodeURIComponent(keyToPass)}`);
      }
    }
  };

  // Feature cards that link to app sections
  const featureCards = [
    {
      icon: Video,
      title: "Video Library",
      description: "Browse all collected videos with metadata, views, likes, and engagement metrics.",
      href: "/videos",
      color: "bg-red-500/10 text-red-600",
      iconBg: "bg-red-500",
    },
    {
      icon: MessageSquare,
      title: "Comment Analysis",
      description: "Search, filter, and analyze comments. Find stories, testimonials, and product ideas.",
      href: "/comments",
      color: "bg-blue-500/10 text-blue-600",
      iconBg: "bg-blue-500",
    },
    {
      icon: Users,
      title: "Channel Tracking",
      description: "Monitor YouTube channels and automatically fetch new videos and comments.",
      href: "/channels",
      color: "bg-green-500/10 text-green-600",
      iconBg: "bg-green-500",
    },
    {
      icon: Brain,
      title: "Intelligence",
      description: "AI-powered comment categorization: stories, pain points, product requests, humor.",
      href: "/intelligence",
      color: "bg-purple-500/10 text-purple-600",
      iconBg: "bg-purple-500",
    },
    {
      icon: Palette,
      title: "Marketing Canvas",
      description: "Generate advertorials, VSL scripts, UGC scenarios, and sales copy from insights.",
      href: "/canvas",
      color: "bg-orange-500/10 text-orange-600",
      iconBg: "bg-orange-500",
    },
    {
      icon: Folder,
      title: "Projects",
      description: "Organize your work with folders, tags, and save marketing assets for later.",
      href: "/projects",
      color: "bg-cyan-500/10 text-cyan-600",
      iconBg: "bg-cyan-500",
    },
  ];

  // Quick stats from dashboard API (real data when authenticated)
  const videosCount = dashboardStats?.videosAnalyzed ?? 0;
  const commentsCount = dashboardStats?.commentsCollected ?? 0;
  const channelsCount = dashboardStats?.channelsTracked ?? 0;
  const projectsCount = dashboardStats?.projectsSaved ?? 0;
  const quickStats = [
    { label: "Videos Analyzed", value: String(videosCount), icon: Video, trend: "" },
    { label: "Comments Collected", value: String(commentsCount), icon: MessageSquare, trend: "" },
    { label: "Channels Tracked", value: String(channelsCount), icon: Users, trend: "" },
    { label: "Projects Saved", value: String(projectsCount), icon: Folder, trend: "" },
  ];

  // Workflow steps
  const workflowSteps = [
    {
      step: 1,
      title: "Enter URLs",
      description: "Paste YouTube playlist, video, or channel URLs",
      icon: Search,
    },
    {
      step: 2,
      title: "Fetch Data",
      description: "Automatically gather video metadata and top 100 comments",
      icon: Database,
    },
    {
      step: 3,
      title: "Analyze",
      description: "Use AI to categorize comments and find insights",
      icon: Brain,
    },
    {
      step: 4,
      title: "Create",
      description: "Generate marketing assets from audience language",
      icon: Sparkles,
    },
    {
      step: 5,
      title: "Export",
      description: "Download CSV or export to Google Sheets",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Input Form */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Welcome & Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  YouTube
                  <br />
                  <span className="text-primary">Comment</span>
                  <br />
                  Intelligence
                </h1>
                <div className="w-16 h-1 bg-primary mt-4 mb-4" />
                <p className="text-lg text-muted-foreground max-w-md">
                  Transform YouTube comments into marketing gold. Extract stories, pain points, and product ideas from your audience's own words.
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    <Card className="border border-border/50 bg-card/50 hover:bg-card transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <stat.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Workflow Steps */}
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {workflowSteps.map((step, index) => (
                      <div key={step.step} className="flex items-center">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                            <step.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground max-w-[60px]">
                            {step.title}
                          </span>
                        </div>
                        {index < workflowSteps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground/50 mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-2 border-foreground shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Start Analysis
                  </CardTitle>
                  <CardDescription>
                    Enter YouTube URLs to analyze videos and gather comments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "single" | "bulk")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="bulk" className="gap-2">
                        <List className="h-4 w-4" />
                        Bulk URLs
                      </TabsTrigger>
                      <TabsTrigger value="single" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Single URL
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bulk" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">YouTube URLs (one per line)</label>
                        <Textarea
                          placeholder={`https://youtube.com/playlist?list=PLxxxxx
https://youtube.com/watch?v=xxxxx
https://youtube.com/@channelname
https://youtube.com/channel/UCxxxxx`}
                          value={bulkUrls}
                          onChange={(e) => setBulkUrls(e.target.value)}
                          className="min-h-[120px] border-2 border-foreground font-mono text-sm"
                        />
                        {bulkUrlCount > 0 && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{bulkUrlCount}</span> URL{bulkUrlCount !== 1 ? "s" : ""} entered
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="single" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">YouTube URL</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://youtube.com/playlist?list=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="pl-10 h-12 border-2 border-foreground"
                          />
                        </div>
                        {parseUrl.data && url.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            Detected: <span className="font-medium text-foreground">{parseUrl.data.type.replace("_", " ")}</span>
                            {parseUrl.data.type !== "unknown" && (
                              <span className="ml-2 text-primary">{parseUrl.data.value}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Video Limit for Channels */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video Limit (for channels)</label>
                    <Select value={videoLimit} onValueChange={setVideoLimit}>
                      <SelectTrigger className="border-2 border-foreground">
                        <SelectValue placeholder="Select limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 videos</SelectItem>
                        <SelectItem value="25">25 videos</SelectItem>
                        <SelectItem value="50">50 videos</SelectItem>
                        <SelectItem value="100">100 videos</SelectItem>
                        <SelectItem value="200">200 videos</SelectItem>
                        <SelectItem value="all">All videos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Limit how many recent videos to fetch from channels (playlists fetch all videos)
                    </p>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    className="w-full h-12 text-lg font-bold"
                    disabled={inputMode === "bulk" ? bulkUrlCount === 0 : !parseUrl.data || parseUrl.data.type === "unknown"}
                  >
                    {inputMode === "bulk" ? (
                      <>Analyze {bulkUrlCount} URL{bulkUrlCount !== 1 ? "s" : ""}</>
                    ) : (
                      <>Analyze</>
                    )}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-8 border-t border-border/50">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Platform Features</h2>
              <p className="text-muted-foreground">Click any card to explore that feature</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * index }}
              >
                <Link href={feature.href}>
                  <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${feature.iconBg} text-white shrink-0 group-hover:scale-110 transition-transform`}>
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Explore</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-8 border-t border-border/50 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                What You Can Create
              </h2>
              <p className="text-muted-foreground">Turn comment insights into marketing assets with AI-powered tools</p>
            </div>
            <Link href="/content-generator">
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Open Content Generator
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { id: "advertorial", title: "Advertorials", desc: "Story-driven native ads that convert", icon: FileText, color: "bg-blue-500/10 text-blue-600" },
              { id: "vsl_script", title: "VSL Scripts", desc: "Video sales letters using audience language", icon: Play, color: "bg-purple-500/10 text-purple-600" },
              { id: "ugc_scenario", title: "UGC Scenarios", desc: "Authentic user-generated content scripts", icon: Video, color: "bg-pink-500/10 text-pink-600" },
              { id: "course_outline", title: "Course Outlines", desc: "Educational content from questions asked", icon: BookOpen, color: "bg-green-500/10 text-green-600" },
              { id: "ad_copy", title: "Ad Copy", desc: "Headlines and hooks from viral comments", icon: Sparkles, color: "bg-orange-500/10 text-orange-600" },
              { id: "sales_page", title: "Sales Pages", desc: "Conversion copy with real testimonials", icon: TrendingUp, color: "bg-red-500/10 text-red-600" },
              { id: "email_sequence", title: "Email Sequences", desc: "Nurture campaigns from pain points", icon: MessageSquare, color: "bg-cyan-500/10 text-cyan-600" },
              { id: "product_idea", title: "Product Ideas", desc: "New offerings from 'I wish' comments", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-600" },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.03 * index }}
              >
                <Link href={`/content-generator?type=${item.id}`}>
                  <Card className="border-0 bg-background hover:shadow-md transition-all cursor-pointer group hover:border-primary/20 hover:bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
