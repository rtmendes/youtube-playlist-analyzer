import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowRight, Play, MessageSquare, BarChart3, Download, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const parseUrl = trpc.youtube.parseUrl.useQuery(
    { url },
    { enabled: url.length > 5 }
  );

  const handleAnalyze = () => {
    if (!apiKey.trim()) {
      alert("Please enter your YouTube API key");
      return;
    }
    if (parseUrl.data?.type === "playlist_id") {
      setLocation(`/analyze?playlist=${parseUrl.data.value}&key=${encodeURIComponent(apiKey)}`);
    } else if (parseUrl.data?.type === "video_id") {
      setLocation(`/video?id=${parseUrl.data.value}&key=${encodeURIComponent(apiKey)}`);
    } else if (parseUrl.data?.type === "channel_id" || parseUrl.data?.type === "channel_handle") {
      setLocation(`/channel?id=${parseUrl.data.value}&key=${encodeURIComponent(apiKey)}`);
    }
  };

  const features = [
    {
      icon: Play,
      title: "Playlist Analysis",
      description: "Extract metadata from entire playlists including video counts, durations, and engagement metrics.",
    },
    {
      icon: MessageSquare,
      title: "Comment Gathering",
      description: "Collect and analyze comments from videos with author information and engagement data.",
    },
    {
      icon: BarChart3,
      title: "Data Visualization",
      description: "View statistics and trends across your playlist with interactive charts and tables.",
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Export your data as JSON or CSV for further analysis in spreadsheets or other tools.",
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
                Analyze
                <br />
                <span className="text-primary">YouTube</span>
                <br />
                Playlists
              </h1>
              <div className="w-24 h-1 bg-primary mt-6 mb-8" />
              <p className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed">
                Extract video metadata, gather comments, and export data from any YouTube playlist for analysis.
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
                    Enter a YouTube playlist, video, or channel URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube API Key</label>
                    <Input
                      type="password"
                      placeholder="Your YouTube Data API v3 key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="h-12 border-2 border-foreground"
                    />
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
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={!parseUrl.data || parseUrl.data.type === "unknown" || !apiKey}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    Analyze
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
              Powerful tools for YouTube content analysis, inspired by the best open-source projects.
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
                    <h3 className="text-xl font-semibold mb-2">Enter URL</h3>
                    <p className="text-muted-foreground">
                      Paste any YouTube playlist, video, or channel URL into the analyzer.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fetch Data</h3>
                    <p className="text-muted-foreground">
                      We use the YouTube Data API to gather metadata, statistics, and comments.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Analyze & Export</h3>
                    <p className="text-muted-foreground">
                      View insights, search through comments, and export data in your preferred format.
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
