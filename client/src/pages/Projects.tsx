import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Folder,
  FolderPlus,
  Tag,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Palette,
  Brain,
  FileText,
  Calendar,
  Loader2,
  ChevronRight,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FOLDER_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

interface FolderType {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
}

interface ProjectType {
  id: number;
  name: string;
  description: string | null;
  folderId: number | null;
  status: "draft" | "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

interface TagType {
  id: number;
  name: string;
  color: string | null;
}

export default function Projects() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(FOLDER_COLORS[4]);
  
  // Queries
  const foldersQuery = trpc.folders.list.useQuery(undefined, { enabled: isAuthenticated });
  const projectsQuery = trpc.projects.list.useQuery(
    selectedFolder ? { folderId: selectedFolder } : undefined,
    { enabled: isAuthenticated }
  );
  const tagsQuery = trpc.tags.list.useQuery(undefined, { enabled: isAuthenticated });
  
  // Mutations
  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      toast.success("Folder created!");
      setShowCreateFolder(false);
      setNewFolderName("");
      foldersQuery.refetch();
    },
  });
  
  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted");
      foldersQuery.refetch();
      if (selectedFolder) setSelectedFolder(null);
    },
  });
  
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created!");
      setShowCreateProject(false);
      setNewProjectName("");
      setNewProjectDescription("");
      projectsQuery.refetch();
      setLocation(`/canvas?projectId=${data.id}`);
    },
  });
  
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      projectsQuery.refetch();
    },
  });
  
  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created!");
      setShowCreateTag(false);
      setNewTagName("");
      tagsQuery.refetch();
    },
  });
  
  const deleteTagMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("Tag deleted");
      tagsQuery.refetch();
    },
  });

  // Filter projects by search
  const filteredProjects = (projectsQuery.data || []).filter((p: ProjectType) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b-2 border-foreground">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logo-placeholder.png" alt="Logo" className="h-10 w-10" />
              <span className="font-bold text-xl">Playlist Analyzer</span>
            </div>
            <Button variant="outline" asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to access your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </div>
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
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Projects
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your marketing projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowCreateTag(true)}>
              <Tag className="h-4 w-4 mr-2" />
              New Tag
            </Button>
            <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={() => setShowCreateProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Folders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    selectedFolder === null ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span className="text-sm font-medium">All Projects</span>
                  <Badge variant="secondary">{projectsQuery.data?.length || 0}</Badge>
                </button>
                
                {(foldersQuery.data || []).map((folder: FolderType) => (
                  <div key={folder.id} className="group relative">
                    <button
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        selectedFolder === folder.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: folder.color || FOLDER_COLORS[0] }}
                        />
                        <span className="text-sm">{folder.name}</span>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFolderMutation.mutate({ id: folder.id })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(tagsQuery.data || []).map((tag: TagType) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer group"
                      style={{ borderColor: tag.color || FOLDER_COLORS[4] }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: tag.color || FOLDER_COLORS[4] }}
                      />
                      {tag.name}
                      <button
                        className="ml-1 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteTagMutation.mutate({ id: tag.id })}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {(tagsQuery.data || []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No tags yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Projects */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Projects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredProjects.map((project: ProjectType) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteProjectMutation.mutate({ id: project.id })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {project.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            project.status === "active" ? "default" :
                            project.status === "archived" ? "secondary" : "outline"
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/canvas?projectId=${project.id}`}>
                              <Palette className="h-4 w-4 mr-2" />
                              Canvas
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredProjects.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No projects yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a project to start generating marketing assets
                    </p>
                    <Button onClick={() => setShowCreateProject(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Organize your projects with folders</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Q1 Campaigns"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newFolderColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>Cancel</Button>
            <Button 
              onClick={() => createFolderMutation.mutate({ name: newFolderName, color: newFolderColor })}
              disabled={!newFolderName || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Start a new marketing project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Product Launch Campaign"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Brief description of the project"
              />
            </div>
            <div className="space-y-2">
              <Label>Folder (Optional)</Label>
              <Select 
                value={selectedFolder?.toString() || ""} 
                onValueChange={(v) => setSelectedFolder(v ? parseInt(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No folder</SelectItem>
                  {(foldersQuery.data || []).map((folder: FolderType) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProject(false)}>Cancel</Button>
            <Button 
              onClick={() => createProjectMutation.mutate({ 
                name: newProjectName, 
                description: newProjectDescription || undefined,
                folderId: selectedFolder || undefined,
              })}
              disabled={!newProjectName || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>Add tags to organize your projects</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., High Priority"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newTagColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTag(false)}>Cancel</Button>
            <Button 
              onClick={() => createTagMutation.mutate({ name: newTagName, color: newTagColor })}
              disabled={!newTagName || createTagMutation.isPending}
            >
              {createTagMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
