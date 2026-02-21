import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Search,
  X,
  ExternalLink,
  Play,
  Maximize2,
  Minimize2,
  Home,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Copy,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YouTubeBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeUrl?: (url: string) => void;
  className?: string;
}

export function YouTubeBrowser({ isOpen, onClose, onAnalyzeUrl, className }: YouTubeBrowserProps) {
  const [url, setUrl] = useState("https://www.youtube.com");
  const [inputUrl, setInputUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<string[]>(["https://www.youtube.com"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigateTo = useCallback((newUrl: string) => {
    // Ensure URL has protocol
    let finalUrl = newUrl;
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      // Check if it's a YouTube search query
      if (!newUrl.includes(".")) {
        finalUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(newUrl)}`;
      } else {
        finalUrl = `https://${newUrl}`;
      }
    }
    
    // Only allow YouTube URLs for security
    if (!finalUrl.includes("youtube.com") && !finalUrl.includes("youtu.be")) {
      toast.error("Only YouTube URLs are allowed");
      return;
    }

    setUrl(finalUrl);
    setInputUrl("");
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      navigateTo(inputUrl.trim());
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setUrl(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setUrl(history[historyIndex + 1]);
    }
  };

  const goHome = () => {
    navigateTo("https://www.youtube.com");
  };

  const refresh = () => {
    const embed = getEmbedUrl(url);
    if (iframeRef.current && embed) {
      iframeRef.current.src = embed;
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const analyzeCurrentUrl = () => {
    if (onAnalyzeUrl) {
      onAnalyzeUrl(url);
      toast.success("Video sent to analysis");
    }
  };

  const extractVideoId = (videoUrl: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractPlaylistId = (pageUrl: string): string | null => {
    const listMatch = pageUrl.match(/[?&]list=([^&\n?#]+)/);
    return listMatch ? listMatch[1] : null;
  };

  // YouTube allows embedding only via their embed URLs. Use these so the iframe works.
  const getEmbedUrl = (pageUrl: string): string | null => {
    const videoId = extractVideoId(pageUrl);
    const playlistId = extractPlaylistId(pageUrl);
    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(url);
  const isEmbeddable = embedUrl !== null;
  const isVideoUrl = extractVideoId(url) !== null;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-l border-border transition-all duration-300",
        isExpanded ? "w-full fixed inset-0 z-50" : "w-[480px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goBack}
                disabled={historyIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goForward}
                disabled={historyIndex >= history.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={refresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goHome}
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>YouTube Home</TooltipContent>
          </Tooltip>
        </div>

        {/* URL/Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search YouTube or enter URL..."
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-8">
            Go
          </Button>
        </form>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy URL</TooltipContent>
          </Tooltip>

          {isVideoUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={analyzeCurrentUrl}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze
                </Button>
              </TooltipTrigger>
              <TooltipContent>Analyze this video</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isExpanded ? "Minimize" : "Maximize"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Current URL Display + Open in new tab (sign in there) */}
      <div className="px-3 py-1.5 bg-muted/20 border-b text-xs text-muted-foreground flex flex-wrap items-center gap-2">
        <Youtube className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="truncate flex-1 min-w-0">{url}</span>
        <Button
          variant="default"
          size="sm"
          className="h-7 px-2 text-xs gap-1 shrink-0"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-3 w-3" />
          Open in new tab
        </Button>
      </div>

      {/* Hint: only when not embeddable */}
      {!isEmbeddable && (
        <div className="px-3 py-2 bg-muted/50 border-b text-xs text-muted-foreground">
          <span>
            Paste a <strong>video</strong> or <strong>playlist</strong> URL above to embed it here. For the full YouTube site (home, search), use <strong>Open in new tab</strong>.
          </span>
        </div>
      )}

      {/* Iframe: use official embed URL so YouTube allows it */}
      <div className="flex-1 relative min-h-0">
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            key={embedUrl}
            src={embedUrl}
            title="YouTube embed"
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-muted/30 text-center text-sm text-muted-foreground">
            <Youtube className="h-12 w-12 text-red-500 opacity-70" />
            <p>Enter a video or playlist URL in the bar above to watch it here.</p>
            <p className="text-xs">Example: youtube.com/watch?v=... or youtube.com/playlist?list=...</p>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              onClick={() => window.open("https://www.youtube.com", "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open YouTube in new tab
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Toggle button component for sidebar
export function YouTubeBrowserToggle({ 
  isOpen, 
  onClick 
}: { 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isOpen ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "gap-2 transition-colors",
            isOpen && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
          )}
          onClick={onClick}
        >
          <Youtube className="h-4 w-4" />
          <span className="hidden sm:inline">YouTube</span>
          {isOpen ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isOpen ? "Close YouTube Browser" : "Open YouTube Browser"}
      </TooltipContent>
    </Tooltip>
  );
}

export default YouTubeBrowser;
