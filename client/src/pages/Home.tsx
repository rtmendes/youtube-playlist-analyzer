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
import { ArrowRight, Play, MessageSquare, BarChart3, Download, Search, Loader2, List, FileText, History, Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Home() {
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("bulk");
  const [rememberApiKey, setRememberApiKey] = useState(false);
  const [videoLimit, setVideoLimit] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Load saved API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("youtube_api_key");
    const savedRemember = localStorage.getItem("remember_api_key") === "true";
    if (savedApiKey && savedRemember) {
      setApiKey(savedApiKey);
      setRememberApiKey(true);
    }
  }, []);

  // Handle remember API key checkbox change
  const handleRememberChange = (checked: boolean) => {
    setRememberApiKey(checked);
    if (checked && apiKey) {
      localStorage.setItem("youtube_api_key", apiKey);
      localStorage.setItem("remember_api_key", "true");
    } else {
      localStorage.removeItem("youtube_api_key");
      localStorage.removeItem("remember_api_key");
    }
  };

  // Save API key when it changes (if remember is checked)
  useEffect(() => {
    if (rememberApiKey && apiKey) {
      localStorage.setItem("youtube_api_key", apiKey);
    }
  }, [apiKey, rememberApiKey]);

  const parseUrl = trpc.youtube.parseUrl.useQuery(
    { url },
    { enabled: url.length > 5 && inputMode === "single" }
  );

  // Parse bulk URLs to count valid entries
  const parseBulkUrls = () => {
    const lines = bulkUrls.split("\n").filter(line => line.trim().length > 0);
    return lines;
  };

  const bulkUrlCount = parseBulkUrls().length;

  const handleAnalyze = () => {
    if (!apiKey.trim()) {
      alert("Please enter your YouTube API key");
      return;
    }

    if (inputMode === "bulk") {
      const urls = parseBulkUrls();
      if (urls.length === 0) {
        alert("Please enter at least one URL");
        return;
      }
      // Encode the bulk URLs and navigate to bulk analyze page
      const encodedUrls = encodeURIComponent(urls.join("\n"));
      const limitParam = videoLimit !== "all" ? `&limit=${videoLimit}` : "";
      setLocation(`/bulk-analyze?urls=${encodedUrls}&key=${encodeURIComponent(apiKey)}${limitParam}`);
    } else {
      if (parseUrl.data?.type === "playlist_id") {
        setLocation(`/analyze?playlist=${parseUrl.data.value}&key=${encodeURIComponent(apiKey)}`);
      } else if (parseUrl.data?.type === "video_id") {
        setLocation(`/video?id=${parseUrl.data.value}&key=${encodeURIComponent(apiKey)}`);
      } else if (parseUrl.data?.type === "channel_id" || parseUrl.data?.type === "channel_handle") {
        setLocation(`/channel?id=${parseUrl.data.value}&key=${encodeURIComponent(apiKey)}`);
      }
    }
  };

  const features = [
    {
      icon: List,
      title: "Bulk URL Processing",
      description: "Enter multiple playlist or video URLs at once to analyze them all in a single batch.",
    },
    {
      icon: MessageSquare,
      title: "Top 100 Comments",
      description: "Automatically fetch the top 100 comments from each video with full metadata.",
    },
    {
      icon: BarChart3,
      title: "Video Metrics",
      description: "Get complete video metadata including views, likes, duration, and comment counts.",
    },
    {
      icon: Download,
      title: "Export to CSV/Sheets",
      description: "Download all data as CSV or export directly to Google Sheets for easy analysis.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo-placeholder.png" 
              alt="YouTube Playlist Analyzer" 
              className="h-10 w-10"
            />
            <span className="font-bold text-xl tracking-tight">Playlist Analyzer</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects">
                    <Folder className="h-4 w-4 mr-2" />
                    Projects
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/history">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Link>
                </Button>
              </>
            )}
            {isAuthenticated ? (
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name || "User"}
              </span>
            ) : (
              <Button variant="outline" asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-balance">
                Bulk Analyze
                <br />
                <span className="text-primary">YouTube</span>
                <br />
                Comments
              </h1>
              <div className="w-24 h-1 bg-primary mt-6 mb-8" />
              <p className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed">
                Enter playlists, videos, or channels. Fetch top 100 comments per video and export to CSV or Google Sheets.
              </p>
            </motion.div>

            {/* Right Column - Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-2 border-foreground shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Start Analysis</CardTitle>
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
                          className="min-h-[150px] border-2 border-foreground font-mono text-sm"
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube API Key</label>
                    <Input
                      type="password"
                      placeholder="Your YouTube Data API v3 key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="h-12 border-2 border-foreground"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Get your API key from the{" "}
                        <a 
                          href="https://console.cloud.google.com/apis/credentials" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Google Cloud Console
                        </a>
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember-api-key"
                          checked={rememberApiKey}
                          onCheckedChange={handleRememberChange}
                        />
                        <Label htmlFor="remember-api-key" className="text-xs cursor-pointer">
                          Remember
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Video Limit for Channels */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video Limit (for channels)</label>
                    <Select value={videoLimit} onValueChange={setVideoLimit}>
                      <SelectTrigger className="h-12 border-2 border-foreground">
                        <SelectValue placeholder="Select video limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All videos</SelectItem>
                        <SelectItem value="10">Last 10 videos</SelectItem>
                        <SelectItem value="25">Last 25 videos</SelectItem>
                        <SelectItem value="50">Last 50 videos</SelectItem>
                        <SelectItem value="100">Last 100 videos</SelectItem>
                        <SelectItem value="200">Last 200 videos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Limit how many recent videos to fetch from channels (playlists fetch all videos)
                    </p>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={
                      (inputMode === "single" && (!parseUrl.data || parseUrl.data.type === "unknown")) ||
                      (inputMode === "bulk" && bulkUrlCount === 0) ||
                      !apiKey
                    }
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {inputMode === "bulk" ? `Analyze ${bulkUrlCount} URL${bulkUrlCount !== 1 ? "s" : ""}` : "Analyze"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="swiss-divider" />

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4">Features</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
              Powerful tools for bulk YouTube comment analysis and data export.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="border-2 border-foreground shadow-none h-full hover:bg-accent transition-colors">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-4">How It Works</h2>
              <div className="w-16 h-1 bg-primary mb-8" />
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enter URLs</h3>
                    <p className="text-muted-foreground">
                      Paste multiple YouTube playlist or video URLs, one per line.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fetch Comments</h3>
                    <p className="text-muted-foreground">
                      We automatically fetch the top 100 comments from each video with full metadata.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Export Data</h3>
                    <p className="text-muted-foreground">
                      Download everything as CSV or export directly to Google Sheets.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="/images/analytics-feature.jpg" 
                alt="Analytics Dashboard" 
                className="rounded-lg border-2 border-foreground shadow-lg"
              />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary opacity-20 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/images/logo-placeholder.png" 
                alt="Logo" 
                className="h-6 w-6"
              />
              <span className="font-semibold">YouTube Playlist Analyzer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with inspiration from{" "}
              <a 
                href="https://github.com/mattwright324/youtube-comment-suite" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                youtube-comment-suite
              </a>
              {" "}and{" "}
              <a 
                href="https://github.com/mattwright324/youtube-metadata" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                youtube-metadata
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
