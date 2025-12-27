import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Folder, 
  Video, 
  MessageSquare, 
  Tag, 
  FileText,
  Clock,
  X,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

interface SearchResult {
  id: string;
  type: "project" | "folder" | "video" | "comment" | "tag";
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
  tags?: string[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("yt-analyzer-recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    try {
      // Search projects from localStorage/API
      const projectsData = localStorage.getItem("yt-analyzer-projects");
      if (projectsData) {
        const projects = JSON.parse(projectsData);
        projects.forEach((project: any) => {
          if (
            project.name?.toLowerCase().includes(lowerQuery) ||
            project.description?.toLowerCase().includes(lowerQuery)
          ) {
            searchResults.push({
              id: `project-${project.id}`,
              type: "project",
              title: project.name,
              subtitle: project.description,
              url: `/projects/${project.id}`,
              icon: <FileText className="h-4 w-4" />,
              tags: project.tags,
            });
          }
        });
      }

      // Search folders from localStorage/API
      const foldersData = localStorage.getItem("yt-analyzer-folders");
      if (foldersData) {
        const folders = JSON.parse(foldersData);
        folders.forEach((folder: any) => {
          if (folder.name?.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              id: `folder-${folder.id}`,
              type: "folder",
              title: folder.name,
              subtitle: `${folder.itemCount || 0} items`,
              url: `/folders/${folder.id}`,
              icon: <Folder className="h-4 w-4" />,
            });
          }
        });
      }

      // Search videos from localStorage
      const videosData = localStorage.getItem("yt-analyzer-videos");
      if (videosData) {
        const videos = JSON.parse(videosData);
        videos.slice(0, 50).forEach((video: any) => {
          if (
            video.title?.toLowerCase().includes(lowerQuery) ||
            video.channelTitle?.toLowerCase().includes(lowerQuery)
          ) {
            searchResults.push({
              id: `video-${video.videoId}`,
              type: "video",
              title: video.title,
              subtitle: video.channelTitle,
              url: `/videos?highlight=${video.videoId}`,
              icon: <Video className="h-4 w-4" />,
              tags: video.tags,
            });
          }
        });
      }

      // Search comments from localStorage
      const commentsData = localStorage.getItem("yt-analyzer-comments");
      if (commentsData) {
        const comments = JSON.parse(commentsData);
        comments.slice(0, 100).forEach((comment: any) => {
          if (comment.text?.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              id: `comment-${comment.id}`,
              type: "comment",
              title: comment.text.substring(0, 100) + (comment.text.length > 100 ? "..." : ""),
              subtitle: comment.authorName,
              url: `/comments?highlight=${comment.id}`,
              icon: <MessageSquare className="h-4 w-4" />,
            });
          }
        });
      }

      // Search tags
      const tagsData = localStorage.getItem("yt-analyzer-tags");
      if (tagsData) {
        const tags = JSON.parse(tagsData);
        tags.forEach((tag: any) => {
          if (tag.name?.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              id: `tag-${tag.id}`,
              type: "tag",
              title: tag.name,
              subtitle: `${tag.count || 0} items`,
              url: `/tags/${tag.name}`,
              icon: <Tag className="h-4 w-4" />,
            });
          }
        });
      }

      // Add static navigation matches
      const navItems = [
        { name: "All Videos", url: "/videos", icon: <Video className="h-4 w-4" /> },
        { name: "All Channels", url: "/channels", icon: <Video className="h-4 w-4" /> },
        { name: "All Comments", url: "/comments", icon: <MessageSquare className="h-4 w-4" /> },
        { name: "Intelligence", url: "/intelligence", icon: <FileText className="h-4 w-4" /> },
        { name: "Canvas", url: "/canvas", icon: <FileText className="h-4 w-4" /> },
        { name: "History", url: "/history", icon: <Clock className="h-4 w-4" /> },
        { name: "Projects", url: "/projects", icon: <Folder className="h-4 w-4" /> },
      ];

      navItems.forEach((item) => {
        if (item.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: `nav-${item.url}`,
            type: "folder",
            title: item.name,
            subtitle: "Navigate to page",
            url: item.url,
            icon: item.icon,
          });
        }
      });

      setResults(searchResults.slice(0, 20));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("yt-analyzer-recent-searches", JSON.stringify(newRecent));
    
    onOpenChange(false);
    window.location.href = result.url;
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("yt-analyzer-recent-searches");
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "project": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "folder": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "video": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "comment": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "tag": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, folders, videos, comments, tags..."
            className="border-0 focus-visible:ring-0 text-lg h-auto py-0 px-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="ml-3 pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[400px]">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left rounded-md hover:bg-muted transition-colors"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions when no query */}
          {!query && recentSearches.length === 0 && (
            <div className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </span>
              <div className="mt-2 space-y-1">
                <Link href="/" onClick={() => onOpenChange(false)}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
                    <Video className="h-4 w-4 text-red-500" />
                    <span>New Analysis</span>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/videos" onClick={() => onOpenChange(false)}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
                    <Video className="h-4 w-4 text-blue-500" />
                    <span>Browse All Videos</span>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/intelligence" onClick={() => onOpenChange(false)}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span>Comment Intelligence</span>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && (
            <div className="p-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-md transition-colors ${
                        index === selectedIndex
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className={`p-1.5 rounded ${getTypeColor(result.type)}`}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {result.type}
                      </Badge>
                      {result.tags && result.tags.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                          {result.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
              Select
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘K</kbd>
            to open search
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use global search with keyboard shortcut
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
