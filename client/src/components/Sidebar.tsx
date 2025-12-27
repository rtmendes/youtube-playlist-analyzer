import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Home,
  Search,
  Plus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Video,
  MessageSquare,
  Users,
  Brain,
  Palette,
  History,
  Trash2,
  Star,
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Edit2,
  FolderPlus,
  Copy,
  Archive,
  Tag,
  Filter,
  SortAsc,
  FileText,
  Sparkles,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Zap,
  Target,
  TrendingUp,
  ShoppingCart,
  MessageCircle,
  BarChart3,
  ListMusic,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface FolderItem {
  id: number;
  name: string;
  parentFolderId: number | null;
  color: string | null;
  children?: FolderItem[];
  projectCount?: number;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSearch?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, onOpenSearch }: SidebarProps) {
  const [location] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [parentFolderForNew, setParentFolderForNew] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find the dragged folder and target folder
    const draggedId = active.id as number;
    const targetId = over.id as number;

    // Update folder's parent to move it
    updateFolderMutation.mutate({
      id: draggedId,
      parentFolderId: targetId === 0 ? null : targetId,
    });

    toast.success("Folder moved");
  };

  // Fetch folders
  const { data: foldersData, refetch: refetchFolders } = trpc.folders.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch saved playlists
  const { data: savedPlaylistsData } = trpc.savedPlaylists.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Folder mutations
  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      refetchFolders();
      setShowNewFolderDialog(false);
      setNewFolderName("");
      setParentFolderForNew(null);
      toast.success("Folder created");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateFolderMutation = trpc.folders.update.useMutation({
    onSuccess: () => {
      refetchFolders();
      setEditingFolder(null);
      toast.success("Folder updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      refetchFolders();
      toast.success("Folder deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  // Build folder tree from flat list
  const buildFolderTree = (folders: FolderItem[]): FolderItem[] => {
    const map = new Map<number, FolderItem>();
    const roots: FolderItem[] = [];

    folders.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach((folder) => {
      const node = map.get(folder.id)!;
      if (folder.parentFolderId === null) {
        roots.push(node);
      } else {
        const parent = map.get(folder.parentFolderId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return roots;
  };

  const folderTree = foldersData ? buildFolderTree(foldersData as FolderItem[]) : [];

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      parentFolderId: parentFolderForNew ?? undefined,
    });
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    if (confirm(`Delete folder "${folder.name}" and all its contents?`)) {
      deleteFolderMutation.mutate({ id: folder.id });
    }
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/", section: "main" },
    { icon: Sparkles, label: "New Analysis", href: "/", section: "main", highlight: true },
    { icon: Video, label: "All Videos", href: "/videos", section: "library" },
    { icon: Users, label: "All Channels", href: "/channels", section: "library" },
    { icon: MessageSquare, label: "All Comments", href: "/comments", section: "library" },
    { icon: Brain, label: "YouTube Intelligence", href: "/intelligence", section: "tools" },
    { icon: ShoppingCart, label: "Amazon Reviews", href: "/amazon", section: "tools" },
    { icon: MessageCircle, label: "Reddit Research", href: "/reddit", section: "tools" },
    { icon: BarChart3, label: "Competitor Analysis", href: "/competitors", section: "tools" },
    { icon: Palette, label: "Canvas", href: "/canvas", section: "tools" },
    { icon: History, label: "History", href: "/history", section: "tools" },
    { icon: Trash2, label: "Trash", href: "/trash", section: "other" },
  ];

  // Sortable folder item component
  const SortableFolderItem = ({ folder, depth = 0 }: { folder: FolderItem; depth?: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: folder.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab hover:bg-accent transition-colors",
                "text-sm text-muted-foreground hover:text-foreground",
                isDragging && "cursor-grabbing bg-accent"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              {...listeners}
            >
              {hasChildren ? (
                <button className="p-0.5 hover:bg-muted rounded">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}
              {isExpanded ? (
                <FolderOpen
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: folder.color || undefined }}
                />
              ) : (
                <Folder
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: folder.color || undefined }}
                />
              )}
              <span className="truncate flex-1">{folder.name}</span>
              {folder.projectCount !== undefined && folder.projectCount > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  {folder.projectCount}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setParentFolderForNew(folder.id);
                      setShowNewFolderDialog(true);
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Add Subfolder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteFolder(folder)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              onClick={() => {
                setParentFolderForNew(folder.id);
                setShowNewFolderDialog(true);
              }}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Subfolder
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setEditingFolder(folder)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive"
              onClick={() => handleDeleteFolder(folder)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map((child) => (
              <SortableFolderItem key={child.id} folder={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex flex-col items-center gap-1 mt-4">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  location === item.href && "bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/">
            <span className="font-bold text-lg tracking-tight">YT Analyzer</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Search - Opens Global Search Dialog */}
        <div className="p-3">
          <button
            onClick={() => onOpenSearch?.()}
            className="w-full flex items-center gap-2 px-2.5 h-8 bg-muted/50 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ⌘K
            </kbd>
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Quick Actions */}
            <div className="mb-4">
              <Link href="/">
                <Button
                  variant="default"
                  className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  New Analysis
                </Button>
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Navigation
              </div>
              {navItems
                .filter((item) => item.section === "main" && !item.highlight)
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        "text-sm hover:bg-accent",
                        location === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Favorites */}
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Favorites</span>
                <Star className="h-3 w-3" />
              </div>
              <div className="px-2 py-2 text-xs text-muted-foreground/60 italic">
                No favorites yet
              </div>
            </div>

            {/* Recent */}
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Recent</span>
                <Clock className="h-3 w-3" />
              </div>
              <div className="px-2 py-2 text-xs text-muted-foreground/60 italic">
                No recent items
              </div>
            </div>

            {/* Folders */}
            {user && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Folders</span>
                  <button
                    className="p-0.5 hover:bg-muted rounded"
                    onClick={() => {
                      setParentFolderForNew(null);
                      setShowNewFolderDialog(true);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                {folderTree.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={folderTree.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="mt-1">
                        {folderTree.map((folder) => (
                          <SortableFolderItem key={folder.id} folder={folder} />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeId ? (
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent text-accent-foreground text-sm shadow-lg">
                          <Folder className="h-4 w-4" />
                          <span>
                            {foldersData?.find((f: any) => f.id === activeId)?.name || "Folder"}
                          </span>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                ) : (
                  <div className="px-2 py-2 text-xs text-muted-foreground/60 italic">
                    No folders yet
                  </div>
                )}
              </div>
            )}

            {/* Library */}
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Library
              </div>
              {navItems
                .filter((item) => item.section === "library")
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        "text-sm hover:bg-accent",
                        location === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Saved Playlists */}
            {savedPlaylistsData && savedPlaylistsData.length > 0 && (
              <div className="mb-4">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                    <div className="flex items-center gap-1">
                      <ListMusic className="h-3 w-3" />
                      <span>Saved Playlists</span>
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 space-y-0.5">
                      {savedPlaylistsData.slice(0, 5).map((playlist) => (
                        <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                              "text-sm hover:bg-accent group",
                              location === `/playlist/${playlist.id}`
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <ListMusic className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-sm">{playlist.title}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {playlist.lastRunAt
                                    ? new Date(playlist.lastRunAt).toLocaleDateString()
                                    : "Never run"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {savedPlaylistsData.length > 5 && (
                        <Link href="/playlists">
                          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                            <span>View all {savedPlaylistsData.length} playlists →</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Tools */}
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tools
              </div>
              {navItems
                .filter((item) => item.section === "tools")
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        "text-sm hover:bg-accent",
                        location === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Other */}
            <div className="mb-4">
              {navItems
                .filter((item) => item.section === "other")
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        "text-sm hover:bg-accent",
                        location === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </ScrollArea>

        {/* Knowledge Base Section */}
        <div className="px-3 py-2 border-t border-sidebar-border">
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Knowledge Base</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1">
              <Link href="/help/getting-started">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Getting Started</span>
                </div>
              </Link>
              <Link href="/help/analyze">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <Target className="h-3.5 w-3.5" />
                  <span>Analyze Playlists</span>
                </div>
              </Link>
              <Link href="/help/intelligence">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <Brain className="h-3.5 w-3.5" />
                  <span>Comment Intelligence</span>
                </div>
              </Link>
              <Link href="/help/canvas">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <Palette className="h-3.5 w-3.5" />
                  <span>Marketing Canvas</span>
                </div>
              </Link>
              <Link href="/help/projects">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <Folder className="h-3.5 w-3.5" />
                  <span>Projects & Folders</span>
                </div>
              </Link>
              <Link href="/help/export">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Export & Reports</span>
                </div>
              </Link>
              <Link href="/help/tips">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Tips & Best Practices</span>
                </div>
              </Link>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          {authLoading ? (
            <div className="h-8 bg-muted/50 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
              </div>
              <ThemeToggle size="sm" />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentFolderForNew ? "Create Subfolder" : "Create Folder"}
            </DialogTitle>
            <DialogDescription>
              Enter a name for your new folder.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFolderDialog(false);
                setNewFolderName("");
                setParentFolderForNew(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={editingFolder?.name || ""}
            onChange={(e) =>
              setEditingFolder((prev) =>
                prev ? { ...prev, name: e.target.value } : null
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && editingFolder) {
                updateFolderMutation.mutate({
                  id: editingFolder.id,
                  name: editingFolder.name,
                });
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingFolder) {
                  updateFolderMutation.mutate({
                    id: editingFolder.id,
                    name: editingFolder.name,
                  });
                }
              }}
              disabled={!editingFolder?.name.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Sidebar;
