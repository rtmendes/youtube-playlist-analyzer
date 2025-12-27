import { useState, useEffect } from "react";
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
} from "lucide-react";

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
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [parentFolderForNew, setParentFolderForNew] = useState<number | null>(null);

  // Fetch folders
  const { data: foldersData, refetch: refetchFolders } = trpc.folders.list.useQuery(
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
    { icon: Brain, label: "Intelligence", href: "/intelligence", section: "tools" },
    { icon: Palette, label: "Canvas", href: "/canvas", section: "tools" },
    { icon: History, label: "History", href: "/history", section: "tools" },
    { icon: Trash2, label: "Trash", href: "/trash", section: "other" },
  ];

  const renderFolderItem = (folder: FolderItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
                "text-sm text-muted-foreground hover:text-foreground"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => hasChildren && toggleFolder(folder.id)}
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
            {folder.children!.map((child) => renderFolderItem(child, depth + 1))}
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

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                  <div className="mt-1">
                    {folderTree.map((folder) => renderFolderItem(folder))}
                  </div>
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
