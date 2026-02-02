import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, Video, Users, BookOpen, Megaphone, ShoppingCart, Mail, Lightbulb,
  Sparkles, ArrowRight, Loader2, Copy, Download, History, Star, Check,
  ChevronRight, Info, Wand2, MessageSquare, Target, Zap, BookMarked,
  Save, FolderOpen, GitBranch, ExternalLink, FileDown, Layers, Plus,
  BarChart3, ArrowLeftRight, Trash2, Edit2, Clock, TrendingUp,
  Trophy, Crown, Calendar, Share2, Globe, Link, UserPlus, Play, Pause,
  RefreshCw, Eye, Settings, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// Content type icons mapping
const contentTypeIcons: Record<string, React.ReactNode> = {
  advertorial: <FileText className="h-5 w-5" />,
  vsl_script: <Video className="h-5 w-5" />,
  ugc_scenario: <Users className="h-5 w-5" />,
  course_outline: <BookOpen className="h-5 w-5" />,
  ad_copy: <Megaphone className="h-5 w-5" />,
  sales_page: <ShoppingCart className="h-5 w-5" />,
  email_sequence: <Mail className="h-5 w-5" />,
  product_idea: <Lightbulb className="h-5 w-5" />,
};

// Content type colors
const contentTypeColors: Record<string, string> = {
  advertorial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  vsl_script: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ugc_scenario: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  course_outline: "bg-green-500/10 text-green-600 border-green-500/20",
  ad_copy: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  sales_page: "bg-red-500/10 text-red-600 border-red-500/20",
  email_sequence: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  product_idea: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export default function ContentGenerator() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // State
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Handle URL parameter for content type
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("type");
    if (typeParam && ["advertorial", "vsl_script", "ugc_scenario", "course_outline", "ad_copy", "sales_page", "email_sequence", "product_idea"].includes(typeParam)) {
      setSelectedType(typeParam);
      window.history.replaceState({}, "", location.split("?")[0]);
    }
  }, [location]);

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [selectedComments, setSelectedComments] = useState<Array<{
    id: string;
    text: string;
    source: string;
    category?: string;
  }>>([]);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedContentId, setGeneratedContentId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");

  // Template states
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateVariableValues, setTemplateVariableValues] = useState<Record<string, string>>({});

  // Version states
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [showCreateVersionDialog, setShowCreateVersionDialog] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [isAbTest, setIsAbTest] = useState(false);
  const [abTestName, setAbTestName] = useState("");
  const [abTestVariant, setAbTestVariant] = useState("");
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [metricsInput, setMetricsInput] = useState({
    impressions: "",
    clicks: "",
    conversions: "",
    revenue: "",
  });
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareVersionA, setCompareVersionA] = useState<number | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<number | null>(null);

  // Export states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"markdown" | "plain_text" | "rich_text">("markdown");
  const [exportDestination, setExportDestination] = useState<"google_docs" | "notion" | "file">("file");

  // Batch export states
  const [showBatchExportDialog, setShowBatchExportDialog] = useState(false);
  const [selectedForBatchExport, setSelectedForBatchExport] = useState<number[]>([]);
  const [batchExportFormat, setBatchExportFormat] = useState<"markdown" | "txt" | "html" | "json">("markdown");
  const [batchExportType, setBatchExportType] = useState<"combined" | "individual">("combined");
  const [batchExportSearch, setBatchExportSearch] = useState("");
  const [batchExportContentType, setBatchExportContentType] = useState<string | undefined>(undefined);
  const [batchExportDestination, setBatchExportDestination] = useState<"file" | "google_docs" | "notion">("file");

  // A/B Test Winner states
  const [showAbTestDialog, setShowAbTestDialog] = useState(false);

  // Schedule states
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleTemplateId, setScheduleTemplateId] = useState<number | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1);
  const [scheduleTimeOfDay, setScheduleTimeOfDay] = useState("09:00");
  const [scheduleNotify, setScheduleNotify] = useState(true);

  // Template sharing states
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "duplicate" | "edit">("view");
  const [shareMethod, setShareMethod] = useState<"email" | "link">("email");
  const [shareType, setShareType] = useState<"direct" | "link" | "public">("direct");
  const [shareExpiresInDays, setShareExpiresInDays] = useState<number | undefined>(undefined);
  const [shareTemplateId, setShareTemplateId] = useState<number | null>(null);
  const [showPublicGalleryDialog, setShowPublicGalleryDialog] = useState(false);
  const [publicGallerySearch, setPublicGallerySearch] = useState("");

  // Queries
  const contentTypesQuery = trpc.contentGenerator.getContentTypes.useQuery();
  const promptsQuery = trpc.contentGenerator.getPrompts.useQuery(
    { contentType: selectedType || "" },
    { enabled: !!selectedType }
  );
  const frameworksQuery = trpc.contentGenerator.getFrameworks.useQuery();
  const savedCommentsQuery = trpc.contentGenerator.getSavedCommentsForGeneration.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );
  const historyQuery = trpc.contentGenerator.getHistory.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated && showHistory }
  );
  const croPracticesQuery = trpc.contentGenerator.getCroPractices.useQuery(
    { contentType: selectedType || undefined },
    { enabled: !!selectedType }
  );
  const templatesQuery = trpc.contentGenerator.getTemplates.useQuery(
    { contentType: selectedType || undefined, limit: 50 },
    { enabled: isAuthenticated && showTemplatesDialog }
  );
  const versionsQuery = trpc.contentGenerator.getVersions.useQuery(
    { contentTemplateId: generatedContentId || 0 },
    { enabled: isAuthenticated && showVersionsDialog && !!generatedContentId }
  );
  const compareQuery = trpc.contentGenerator.compareVersions.useQuery(
    { versionAId: compareVersionA || 0, versionBId: compareVersionB || 0 },
    { enabled: isAuthenticated && showCompareDialog && !!compareVersionA && !!compareVersionB }
  );
  const exportHistoryQuery = trpc.contentGenerator.getExportHistory.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated && activeTab === "history" }
  );
  const batchExportContentQuery = trpc.contentGenerator.getAllGeneratedContent.useQuery(
    { contentType: batchExportContentType, limit: 50, search: batchExportSearch },
    { enabled: isAuthenticated && showBatchExportDialog }
  );

  // A/B Test Analysis Query
  const abTestAnalysisQuery = trpc.contentGenerator.getAbTestAnalysis.useQuery(
    { contentTemplateId: generatedContentId || 0 },
    { enabled: isAuthenticated && showAbTestDialog && !!generatedContentId }
  );

  // Schedules Query
  const schedulesQuery = trpc.contentGenerator.getSchedules.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "schedules" }
  );

  // Shared Templates Query
  const sharedWithMeQuery = trpc.contentGenerator.getSharedWithMe.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "shared" }
  );

  // Public Gallery Query
  const publicGalleryQuery = trpc.contentGenerator.getPublicTemplates.useQuery(
    { contentType: selectedType || undefined, search: publicGallerySearch, limit: 20 },
    { enabled: showPublicGalleryDialog }
  );

  // Mutations
  const generateMutation = trpc.contentGenerator.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setGeneratedContentId(data.id);
      setIsGenerating(false);
      toast.success("Content generated successfully!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Generation failed: ${error.message}`);
    },
  });

  const saveTemplateMutation = trpc.contentGenerator.saveAsTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template saved successfully!");
      setShowSaveTemplateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
      setTemplateCategory("");
    },
    onError: (error) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });

  const useTemplateMutation = trpc.contentGenerator.useTemplate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.processedContent);
      toast.success("Template loaded!");
      setShowTemplatesDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to load template: ${error.message}`);
    },
  });

  const deleteTemplateMutation = trpc.contentGenerator.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted!");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const createVersionMutation = trpc.contentGenerator.createVersion.useMutation({
    onSuccess: (data) => {
      toast.success(`Version ${data.versionNumber} created!`);
      setShowCreateVersionDialog(false);
      setVersionName("");
      setVersionNotes("");
      setIsAbTest(false);
      setAbTestName("");
      setAbTestVariant("");
      versionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create version: ${error.message}`);
    },
  });

  const updateMetricsMutation = trpc.contentGenerator.updateVersionMetrics.useMutation({
    onSuccess: (data) => {
      toast.success("Metrics updated!");
      setShowMetricsDialog(false);
      setMetricsInput({ impressions: "", clicks: "", conversions: "", revenue: "" });
      versionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update metrics: ${error.message}`);
    },
  });

  const updateVersionStatusMutation = trpc.contentGenerator.updateVersionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      versionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const rollbackMutation = trpc.contentGenerator.rollbackToVersion.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.restoredContent);
      toast.success("Rolled back to selected version!");
      setShowVersionsDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to rollback: ${error.message}`);
    },
  });

  const exportToGoogleDocsMutation = trpc.contentGenerator.exportToGoogleDocs.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.formattedContent);
      toast.success("Content copied! Paste into Google Docs.");
      setShowExportDialog(false);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportToNotionMutation = trpc.contentGenerator.exportToNotion.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.formattedContent);
      toast.success("Content copied! Paste into Notion.");
      setShowExportDialog(false);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const downloadFileMutation = trpc.contentGenerator.downloadAsFile.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File downloaded!");
      setShowExportDialog(false);
    },
    onError: (error) => {
      toast.error(`Download failed: ${error.message}`);
    },
  });

  const categorizeCommentsMutation = trpc.contentGenerator.categorizeComments.useMutation();
  const extractInsightsMutation = trpc.contentGenerator.extractInsights.useMutation();

  // A/B Test Winner Mutations
  const declareWinnerMutation = trpc.contentGenerator.declareAbTestWinner.useMutation({
    onSuccess: () => {
      toast.success("Winner declared!");
      abTestAnalysisQuery.refetch();
      versionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to declare winner: ${error.message}`);
    },
  });

  // Schedule Mutations
  const createScheduleMutation = trpc.contentGenerator.createSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`Schedule created! Next run: ${new Date(data.nextRunAt).toLocaleDateString()}`);
      setShowScheduleDialog(false);
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const updateScheduleStatusMutation = trpc.contentGenerator.updateScheduleStatus.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated!");
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const deleteScheduleMutation = trpc.contentGenerator.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted!");
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  // Template Sharing Mutations
  const shareTemplateMutation = trpc.contentGenerator.shareTemplate.useMutation({
    onSuccess: (data) => {
      if (data.shareUrl) {
        navigator.clipboard.writeText(window.location.origin + data.shareUrl);
        toast.success("Share link copied to clipboard!");
      } else {
        toast.success("Template shared successfully!");
      }
      setShowShareDialog(false);
      setShareEmail("");
    },
    onError: (error) => {
      toast.error(`Failed to share template: ${error.message}`);
    },
  });

  const duplicateTemplateMutation = trpc.contentGenerator.duplicateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated to your library!");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to duplicate template: ${error.message}`);
    },
  });

  const revokeShareMutation = trpc.contentGenerator.revokeShare.useMutation({
    onSuccess: () => {
      toast.success("Share revoked!");
    },
    onError: (error) => {
      toast.error(`Failed to revoke share: ${error.message}`);
    },
  });

  const batchExportMutation = trpc.contentGenerator.batchExport.useMutation({
    onSuccess: (data) => {
      // Handle Google Docs destination
      if (data.destination === "google_docs" && data.content) {
        navigator.clipboard.writeText(data.content).then(() => {
          window.open("https://docs.google.com/document/create", "_blank");
          toast.success(`${data.itemCount} items copied! Paste into the new Google Doc (Ctrl/Cmd+V)`);
        }).catch(() => {
          toast.error("Failed to copy to clipboard");
        });
      }
      // Handle Notion destination
      else if (data.destination === "notion" && data.content) {
        navigator.clipboard.writeText(data.content).then(() => {
          toast.success(`${data.itemCount} items copied in Notion format! Open Notion and paste (Ctrl/Cmd+V)`);
        }).catch(() => {
          toast.error("Failed to copy to clipboard");
        });
      }
      // Handle file download - combined
      else if (data.exportType === "combined" && data.content && data.filename && data.mimeType) {
        const blob = new Blob([data.content], { type: data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${data.itemCount} items (${data.totalWords} words)`);
      }
      // Handle file download - individual files
      else if (data.files) {
        data.files.forEach((file: { filename: string; content: string; mimeType: string }) => {
          const blob = new Blob([file.content], { type: file.mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.filename;
          a.click();
          URL.revokeObjectURL(url);
        });
        toast.success(`Downloaded ${data.itemCount} files`);
      }
      setShowBatchExportDialog(false);
      setSelectedForBatchExport([]);
      setBatchExportDestination("file");
    },
    onError: (error) => {
      toast.error(`Batch export failed: ${error.message}`);
    },
  });

  // Get selected prompt details
  const selectedPromptDetails = promptsQuery.data?.find(p => p.id === selectedPrompt);

  // Handle content type selection
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedPrompt(null);
    setVariables({});
    setGeneratedContent(null);
    setGeneratedContentId(null);
  };

  // Handle prompt selection
  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    setVariables({});
    setGeneratedContent(null);
    setGeneratedContentId(null);
  };

  // Handle variable change
  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  // Handle comment selection
  const handleCommentToggle = (comment: { id: string; text: string; source: string; category?: string }) => {
    setSelectedComments(prev => {
      const exists = prev.find(c => c.id === comment.id);
      if (exists) {
        return prev.filter(c => c.id !== comment.id);
      }
      return [...prev, comment];
    });
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!selectedType || !selectedPrompt) {
      toast.error("Please select a content type and prompt");
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      contentType: selectedType as any,
      promptId: selectedPrompt,
      variables,
      sourceComments: selectedComments.length > 0 ? selectedComments : undefined,
    });
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast.success("Copied to clipboard!");
    }
  };

  // Download as file
  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedType}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    }
  };

  // Save as template
  const handleSaveAsTemplate = () => {
    if (!generatedContent || !selectedType) return;

    saveTemplateMutation.mutate({
      name: templateName,
      description: templateDescription || undefined,
      contentType: selectedType as any,
      templateContent: generatedContent,
      category: templateCategory || undefined,
      frameworkUsed: selectedPromptDetails?.framework,
    });
  };

  // Use template
  const handleUseTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    const template = templatesQuery.data?.find(t => t.id === templateId);
    if (template?.variables && Array.isArray(template.variables)) {
      const initialValues: Record<string, string> = {};
      template.variables.forEach((v: any) => {
        initialValues[v.name] = v.defaultValue || "";
      });
      setTemplateVariableValues(initialValues);
    }
  };

  // Apply template with variables
  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;
    useTemplateMutation.mutate({
      id: selectedTemplateId,
      variableValues: templateVariableValues,
    });
  };

  // Create version
  const handleCreateVersion = () => {
    if (!generatedContentId || !generatedContent) return;

    createVersionMutation.mutate({
      contentTemplateId: generatedContentId,
      versionName: versionName || undefined,
      content: generatedContent,
      changeNotes: versionNotes || undefined,
      isAbTest,
      abTestName: isAbTest ? abTestName : undefined,
      abTestVariant: isAbTest ? abTestVariant : undefined,
    });
  };

  // Update metrics
  const handleUpdateMetrics = () => {
    if (!selectedVersionId) return;

    updateMetricsMutation.mutate({
      id: selectedVersionId,
      metrics: {
        impressions: metricsInput.impressions ? parseInt(metricsInput.impressions) : undefined,
        clicks: metricsInput.clicks ? parseInt(metricsInput.clicks) : undefined,
        conversions: metricsInput.conversions ? parseInt(metricsInput.conversions) : undefined,
        revenue: metricsInput.revenue ? parseFloat(metricsInput.revenue) : undefined,
      },
    });
  };

  // Export content
  const handleExport = () => {
    if (!generatedContent) return;

    const title = `${selectedType?.replace(/_/g, " ")} - ${new Date().toLocaleDateString()}`;

    if (exportDestination === "google_docs") {
      exportToGoogleDocsMutation.mutate({
        contentTemplateId: generatedContentId || undefined,
        title,
        content: generatedContent,
        format: exportFormat as "plain_text" | "markdown" | "rich_text",
      });
    } else if (exportDestination === "notion") {
      exportToNotionMutation.mutate({
        contentTemplateId: generatedContentId || undefined,
        title,
        content: generatedContent,
        format: exportFormat === "rich_text" ? "markdown" : exportFormat as "plain_text" | "markdown",
      });
    } else {
      downloadFileMutation.mutate({
        contentTemplateId: generatedContentId || undefined,
        title,
        content: generatedContent,
        format: exportFormat === "plain_text" ? "txt" : exportFormat === "rich_text" ? "html" : "markdown",
      });
    }
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to Create Content</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Access AI-powered content generation tools to create advertorials, VSL scripts, 
              UGC scenarios, and more from your research data.
            </p>
            <Button onClick={() => window.location.href = getLoginUrl()}>
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10">
            <Wand2 className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">Content Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Transform your research insights into high-converting marketing content using AI-powered expert prompts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="generator" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="gap-2">
            <BookMarked className="h-4 w-4" />
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2">
            <Share2 className="h-4 w-4" />
            Shared
          </TabsTrigger>
        </TabsList>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Content Type & Prompt Selection */}
            <div className="space-y-6">
              {/* Content Type Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    1. Choose Content Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {contentTypesQuery.data?.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedType === type.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {contentTypeIcons[type.id]}
                        <span className="font-medium text-sm">{type.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Prompt Selection */}
              {selectedType && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      2. Select Prompt Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {promptsQuery.isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      promptsQuery.data?.map((prompt) => (
                        <button
                          key={prompt.id}
                          onClick={() => handlePromptSelect(prompt.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            selectedPrompt === prompt.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{prompt.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {prompt.framework}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {prompt.description}
                          </p>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Middle Column - Variables & Source Comments */}
            <div className="space-y-6">
              {/* Variables Input */}
              {selectedPromptDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      3. Fill in Details
                    </CardTitle>
                    <CardDescription>
                      Customize the prompt with your specific information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPromptDetails.variables.map((variable) => (
                      <div key={variable.name} className="space-y-2">
                        <Label className="text-sm">
                          {variable.name.replace(/_/g, " ")}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {variable.description.length > 50 ? (
                          <Textarea
                            placeholder={variable.description}
                            value={variables[variable.name] || ""}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <Input
                            placeholder={variable.description}
                            value={variables[variable.name] || ""}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Source Comments Selection */}
              {selectedPromptDetails && savedCommentsQuery.data && savedCommentsQuery.data.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      4. Select Source Comments
                    </CardTitle>
                    <CardDescription>
                      Choose saved comments to include in generation
                      <Badge variant="secondary" className="ml-2">
                        {selectedComments.length} selected
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-2">
                        {savedCommentsQuery.data.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-2 rounded-lg border cursor-pointer transition-all ${
                              selectedComments.find(c => c.id === comment.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => handleCommentToggle(comment)}
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={!!selectedComments.find(c => c.id === comment.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm line-clamp-2">{comment.text}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {comment.source}
                                  </Badge>
                                  {comment.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {comment.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Best Practices, Generate, Output */}
            <div className="space-y-6">
              {/* Best Practices */}
              {selectedPromptDetails && selectedPromptDetails.bestPractices.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPromptDetails.bestPractices.slice(0, 5).map((practice, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Generate Button */}
              {selectedPromptDetails && (
                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Content
                    </>
                  )}
                </Button>
              )}

              {/* Generated Content Output */}
              {generatedContent && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Generated Content</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowExportDialog(true)} title="Export">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowSaveTemplateDialog(true)} title="Save as Template">
                          <Save className="h-4 w-4" />
                        </Button>
                        {generatedContentId && (
                          <Button variant="ghost" size="icon" onClick={() => setShowVersionsDialog(true)} title="Versions">
                            <GitBranch className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{generatedContent}</Streamdown>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Saved Templates</h2>
              <p className="text-sm text-muted-foreground">Reusable content templates with variable placeholders</p>
            </div>
            <Button variant="outline" onClick={() => setShowTemplatesDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse All Templates
            </Button>
          </div>

          {templatesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : templatesQuery.data && templatesQuery.data.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesQuery.data.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={contentTypeColors[template.contentType]}>
                        {contentTypeIcons[template.contentType]}
                        <span className="ml-1">{template.contentType.replace(/_/g, " ")}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        {template.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        <span className="text-xs text-muted-foreground">
                          Used {template.useCount}x
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables && Array.isArray(template.variables) && template.variables.slice(0, 3).map((v: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {`{{${v.name}}}`}
                        </Badge>
                      ))}
                      {template.variables && Array.isArray(template.variables) && template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        Use Template
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplateMutation.mutate({ id: template.id })}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Generate content and save it as a template to reuse with different products.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("generator")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Generating
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frameworksQuery.data?.map((framework) => (
              <Card key={framework.acronym} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookMarked className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{framework.acronym}</CardTitle>
                      <CardDescription>{framework.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{framework.description}</p>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="steps" className="border-none">
                      <AccordionTrigger className="text-sm py-2">
                        View Steps
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {framework.steps.map((step, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="font-bold text-primary">{step.letter}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{step.name}</p>
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="flex flex-wrap gap-1 mt-4">
                    {framework.bestFor.map((use) => (
                      <Badge key={use} variant="secondary" className="text-xs">
                        {use.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CRO Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                CRO Best Practices
              </CardTitle>
              <CardDescription>
                Conversion rate optimization guidelines for high-performing content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {croPracticesQuery.data?.map((practice, i) => (
                  <AccordionItem key={i} value={`practice-${i}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={practice.priority === "critical" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {practice.priority}
                        </Badge>
                        <span>{practice.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground mb-4">{practice.description}</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-green-600 mb-2 flex items-center gap-1">
                            <Check className="h-4 w-4" /> Do
                          </h4>
                          <ul className="space-y-1">
                            {practice.doList.map((item, j) => (
                              <li key={j} className="text-sm text-muted-foreground">• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-600 mb-2">✕ Don't</h4>
                          <ul className="space-y-1">
                            {practice.dontList.map((item, j) => (
                              <li key={j} className="text-sm text-muted-foreground">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Batch Export Button */}
          {historyQuery.data && historyQuery.data.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBatchExportDialog(true)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Batch Export
              </Button>
            </div>
          )}
          {historyQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : historyQuery.data && historyQuery.data.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyQuery.data.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={contentTypeColors[item.contentType]}>
                        {contentTypeIcons[item.contentType]}
                        <span className="ml-1">{item.contentType.replace(/_/g, " ")}</span>
                      </Badge>
                      {item.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
                    <CardDescription>
                      {new Date(item.createdAt).toLocaleDateString()} • {item.wordCount} words
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {item.content.substring(0, 150)}...
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          View Full Content
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>{item.title}</DialogTitle>
                          <DialogDescription>
                            Generated on {new Date(item.createdAt).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] pr-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Streamdown>{item.content}</Streamdown>
                          </div>
                        </ScrollArea>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(item.content);
                              toast.success("Copied!");
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Generated Content Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Start generating content and your history will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Content Refresh Schedules</h3>
              <p className="text-sm text-muted-foreground">Automatically regenerate content on a schedule</p>
            </div>
            <Button onClick={() => setShowScheduleDialog(true)} disabled={!templatesQuery.data?.length}>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>

          {schedulesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : schedulesQuery.data && schedulesQuery.data.length > 0 ? (
            <div className="space-y-4">
              {schedulesQuery.data.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${schedule.status === 'active' ? 'bg-green-500/10' : 'bg-muted'}`}>
                          {schedule.status === 'active' ? (
                            <Play className="h-5 w-5 text-green-600" />
                          ) : (
                            <Pause className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{schedule.templateName || 'Unnamed Template'}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                            {schedule.frequency === 'weekly' && schedule.dayOfWeek !== null && (
                              <> on {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][schedule.dayOfWeek]}</>                            )}
                            {' at '}{schedule.timeOfDay || '09:00'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                          {schedule.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Next: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateScheduleStatusMutation.mutate({
                            scheduleId: schedule.id,
                            status: schedule.status === 'active' ? 'paused' : 'active'
                          })}
                        >
                          {schedule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduleMutation.mutate({ scheduleId: schedule.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Schedules Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Create a schedule to automatically refresh your content templates.
                </p>
                <Button onClick={() => setShowScheduleDialog(true)} disabled={!templatesQuery.data?.length}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shared Tab */}
        <TabsContent value="shared" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Shared Templates</h3>
              <p className="text-sm text-muted-foreground">Templates shared with you by other users</p>
            </div>
            <Button variant="outline" onClick={() => setShowPublicGalleryDialog(true)}>
              <Globe className="h-4 w-4 mr-2" />
              Browse Public Gallery
            </Button>
          </div>

          {sharedWithMeQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sharedWithMeQuery.data && sharedWithMeQuery.data.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {sharedWithMeQuery.data.map((share) => (
                <Card key={share.shareId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{share.templateName}</span>
                      <Badge className={contentTypeColors[share.templateType || '']}>
                        {(share.templateType || '').replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {share.templateDescription || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserPlus className="h-4 w-4" />
                        <span>From: {share.ownerName || 'Unknown'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{share.permission}</Badge>
                        {(share.permission === 'duplicate' || share.permission === 'edit') && (
                          <Button
                            size="sm"
                            onClick={() => duplicateTemplateMutation.mutate({ templateId: share.templateId })}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Shared Templates</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Templates shared with you will appear here. Browse the public gallery to find community templates.
                </p>
                <Button variant="outline" onClick={() => setShowPublicGalleryDialog(true)}>
                  <Globe className="h-4 w-4 mr-2" />
                  Browse Public Gallery
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this content as a reusable template. Use {"{{variable}}"} syntax to mark placeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                placeholder="e.g., Product Launch Advertorial"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe when to use this template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="e.g., Product Launch, Seasonal, Evergreen"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName || saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Browser Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Library</DialogTitle>
            <DialogDescription>
              Select a template to use or customize
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {templatesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : templatesQuery.data && templatesQuery.data.length > 0 ? (
              <div className="space-y-3">
                {templatesQuery.data.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{template.name}</span>
                      <Badge className={contentTypeColors[template.contentType]}>
                        {template.contentType.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description || "No description"}
                    </p>
                    {selectedTemplateId === template.id && template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <p className="text-sm font-medium">Fill in variables:</p>
                        {template.variables.map((v: any) => (
                          <div key={v.name} className="space-y-1">
                            <Label className="text-xs">{v.name.replace(/_/g, " ")}</Label>
                            <Input
                              placeholder={v.description}
                              value={templateVariableValues[v.name] || ""}
                              onChange={(e) => setTemplateVariableValues(prev => ({
                                ...prev,
                                [v.name]: e.target.value
                              }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates saved yet</p>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} disabled={!selectedTemplateId || useTemplateMutation.isPending}>
              {useTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={showVersionsDialog} onOpenChange={setShowVersionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Version History
            </DialogTitle>
            <DialogDescription>
              Track changes and A/B test results for this content
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => setShowCreateVersionDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Version
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCompareDialog(true)}>
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              Compare
            </Button>
          </div>
          <ScrollArea className="h-[400px] pr-4">
            {versionsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : versionsQuery.data && versionsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {versionsQuery.data.map((version) => (
                  <Card key={version.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {version.versionName || `Version ${version.versionNumber}`}
                          </span>
                          <Badge variant={
                            (version.status === "winner") ? "default" :
                            version.status === "testing" ? "secondary" :
                            version.status === "active" ? "outline" : "secondary"
                          }>
                            {version.status}
                          </Badge>
                          {version.isAbTest && (
                            <Badge variant="outline" className="text-xs">
                              A/B Test: {version.abTestVariant}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {version.changeNotes && (
                        <p className="text-sm text-muted-foreground mb-3">{version.changeNotes}</p>
                      )}
                      {version.metrics && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {version.metrics.impressions !== undefined && (
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Impressions</p>
                              <p className="font-medium">{version.metrics.impressions.toLocaleString()}</p>
                            </div>
                          )}
                          {version.metrics.clicks !== undefined && (
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Clicks</p>
                              <p className="font-medium">{version.metrics.clicks.toLocaleString()}</p>
                            </div>
                          )}
                          {version.metrics.ctr !== undefined && (
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">CTR</p>
                              <p className="font-medium">{version.metrics.ctr.toFixed(2)}%</p>
                            </div>
                          )}
                          {version.metrics.conversionRate !== undefined && (
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Conv. Rate</p>
                              <p className="font-medium">{version.metrics.conversionRate.toFixed(2)}%</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVersionId(version.id);
                            setShowMetricsDialog(true);
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Update Metrics
                        </Button>
                        <Select
                          value={version.status || "draft"}
                          onValueChange={(value) => updateVersionStatusMutation.mutate({
                            id: version.id,
                            status: value as any
                          })}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="winner">Winner</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (generatedContentId) {
                              rollbackMutation.mutate({
                                versionId: version.id,
                                contentTemplateId: generatedContentId
                              });
                            }
                          }}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No versions created yet</p>
                <Button variant="outline" onClick={() => setShowCreateVersionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Version
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={showCreateVersionDialog} onOpenChange={setShowCreateVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Save the current content as a new version for tracking and A/B testing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Version Name</Label>
              <Input
                placeholder="e.g., Holiday variant, Shorter headline"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Change Notes</Label>
              <Textarea
                placeholder="What changed in this version?"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="abtest"
                checked={isAbTest}
                onCheckedChange={(checked) => setIsAbTest(checked as boolean)}
              />
              <Label htmlFor="abtest">This is an A/B test variant</Label>
            </div>
            {isAbTest && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input
                    placeholder="e.g., Headline Test Q1"
                    value={abTestName}
                    onChange={(e) => setAbTestName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Variant</Label>
                  <Input
                    placeholder="e.g., A, B, C"
                    value={abTestVariant}
                    onChange={(e) => setAbTestVariant(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateVersionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={createVersionMutation.isPending}>
              {createVersionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Metrics Dialog */}
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Performance Metrics</DialogTitle>
            <DialogDescription>
              Track A/B test results and performance data
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Impressions</Label>
              <Input
                type="number"
                placeholder="0"
                value={metricsInput.impressions}
                onChange={(e) => setMetricsInput(prev => ({ ...prev, impressions: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Clicks</Label>
              <Input
                type="number"
                placeholder="0"
                value={metricsInput.clicks}
                onChange={(e) => setMetricsInput(prev => ({ ...prev, clicks: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Conversions</Label>
              <Input
                type="number"
                placeholder="0"
                value={metricsInput.conversions}
                onChange={(e) => setMetricsInput(prev => ({ ...prev, conversions: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Revenue ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={metricsInput.revenue}
                onChange={(e) => setMetricsInput(prev => ({ ...prev, revenue: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetricsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMetrics} disabled={updateMetricsMutation.isPending}>
              {updateMetricsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Update Metrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Versions Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Select two versions to compare side by side
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Version A</Label>
              <Select
                value={compareVersionA?.toString() || ""}
                onValueChange={(v) => setCompareVersionA(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versionsQuery.data?.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.versionName || `Version ${v.versionNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Version B</Label>
              <Select
                value={compareVersionB?.toString() || ""}
                onValueChange={(v) => setCompareVersionB(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versionsQuery.data?.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.versionName || `Version ${v.versionNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {compareQuery.data && (
            <div className="space-y-4">
              {/* Metrics Comparison */}
              {(compareQuery.data.metricsComparison.versionA || compareQuery.data.metricsComparison.versionB) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Version A</p>
                        {compareQuery.data.metricsComparison.versionA ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs">CTR</p>
                              <p className="font-medium">{compareQuery.data.metricsComparison.versionA.ctr?.toFixed(2) || "-"}%</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs">Conv.</p>
                              <p className="font-medium">{compareQuery.data.metricsComparison.versionA.conversionRate?.toFixed(2) || "-"}%</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No metrics</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Version B</p>
                        {compareQuery.data.metricsComparison.versionB ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs">CTR</p>
                              <p className="font-medium">{compareQuery.data.metricsComparison.versionB.ctr?.toFixed(2) || "-"}%</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs">Conv.</p>
                              <p className="font-medium">{compareQuery.data.metricsComparison.versionB.conversionRate?.toFixed(2) || "-"}%</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No metrics</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Content Diff */}
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                <div className="space-y-1 font-mono text-sm">
                  {compareQuery.data.diff.map((line, i) => (
                    <div
                      key={i}
                      className={`px-2 py-0.5 rounded ${
                        line.type === "added" ? "bg-green-500/20 text-green-700 dark:text-green-300" :
                        line.type === "removed" ? "bg-red-500/20 text-red-700 dark:text-red-300" :
                        ""
                      }`}
                    >
                      <span className="mr-2">
                        {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                      </span>
                      {line.line}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Content</DialogTitle>
            <DialogDescription>
              Export your content to external tools or download as a file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={exportDestination} onValueChange={(v) => setExportDestination(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_docs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Google Docs (Copy to clipboard)
                    </div>
                  </SelectItem>
                  <SelectItem value="notion">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Notion (Copy to clipboard)
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      Download File
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="plain_text">Plain Text</SelectItem>
                  {exportDestination === "file" && (
                    <SelectItem value="rich_text">HTML</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {exportDestination === "file" ? "Download" : "Copy & Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Export Dialog */}
      <Dialog open={showBatchExportDialog} onOpenChange={setShowBatchExportDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Batch Export Content
            </DialogTitle>
            <DialogDescription>
              Select multiple pieces of content to export at once
            </DialogDescription>
          </DialogHeader>
          
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search content..."
                value={batchExportSearch}
                onChange={(e) => setBatchExportSearch(e.target.value)}
              />
            </div>
            <Select
              value={batchExportContentType || "all"}
              onValueChange={(v) => setBatchExportContentType(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="advertorial">Advertorial</SelectItem>
                <SelectItem value="vsl_script">VSL Script</SelectItem>
                <SelectItem value="ugc_scenario">UGC Scenario</SelectItem>
                <SelectItem value="course_outline">Course Outline</SelectItem>
                <SelectItem value="ad_copy">Ad Copy</SelectItem>
                <SelectItem value="sales_page">Sales Page</SelectItem>
                <SelectItem value="email_sequence">Email Sequence</SelectItem>
                <SelectItem value="product_idea">Product Idea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Selection */}
          <ScrollArea className="h-[300px] border rounded-lg p-4">
            {batchExportContentQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : batchExportContentQuery.data && batchExportContentQuery.data.length > 0 ? (
              <div className="space-y-2">
                {/* Select All */}
                <div className="flex items-center gap-2 pb-2 border-b mb-2">
                  <Checkbox
                    checked={selectedForBatchExport.length === batchExportContentQuery.data.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedForBatchExport(batchExportContentQuery.data?.map(item => item.id) || []);
                      } else {
                        setSelectedForBatchExport([]);
                      }
                    }}
                  />
                  <span className="text-sm font-medium">
                    Select All ({batchExportContentQuery.data.length} items)
                  </span>
                </div>
                {/* Content Items */}
                {batchExportContentQuery.data.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedForBatchExport.includes(item.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedForBatchExport.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedForBatchExport(prev => [...prev, item.id]);
                        } else {
                          setSelectedForBatchExport(prev => prev.filter(id => id !== item.id));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={contentTypeColors[item.contentType]}>
                          {item.contentType.replace(/_/g, " ")}
                        </Badge>
                        {item.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()} • {item.wordCount} words
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p>No content found</p>
              </div>
            )}
          </ScrollArea>

          {/* Export Options */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={batchExportDestination} onValueChange={(v) => setBatchExportDestination(v as "file" | "google_docs" | "notion")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download File
                    </div>
                  </SelectItem>
                  <SelectItem value="google_docs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Google Docs
                    </div>
                  </SelectItem>
                  <SelectItem value="notion">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Notion
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Export Type</Label>
              <Select 
                value={batchExportType} 
                onValueChange={(v) => setBatchExportType(v as "combined" | "individual")}
                disabled={batchExportDestination !== "file"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combined (Single File)</SelectItem>
                  <SelectItem value="individual">Individual Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select 
                value={batchExportFormat} 
                onValueChange={(v) => setBatchExportFormat(v as any)}
                disabled={batchExportDestination !== "file"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown (.md)</SelectItem>
                  <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                  <SelectItem value="html">HTML (.html)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Destination Info */}
          {batchExportDestination === "google_docs" && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-600">
                <strong>Google Docs:</strong> Content will be copied to clipboard and a new Google Doc will open. Paste (Ctrl/Cmd+V) to import your content.
              </p>
            </div>
          )}
          {batchExportDestination === "notion" && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm text-purple-600">
                <strong>Notion:</strong> Content will be copied to clipboard in Notion-compatible markdown format. Open Notion and paste (Ctrl/Cmd+V) to import.
              </p>
            </div>
          )}

          {/* Selection Summary */}
          {selectedForBatchExport.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 mt-4">
              <p className="text-sm">
                <span className="font-medium">{selectedForBatchExport.length}</span> items selected
                {batchExportContentQuery.data && (
                  <span className="text-muted-foreground">
                    {" "}• ~{batchExportContentQuery.data
                      .filter(item => selectedForBatchExport.includes(item.id))
                      .reduce((sum, item) => sum + (item.wordCount || 0), 0)} words total
                  </span>
                )}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBatchExportDialog(false);
              setSelectedForBatchExport([]);
              setBatchExportDestination("file");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                batchExportMutation.mutate({
                  contentIds: selectedForBatchExport,
                  format: batchExportFormat,
                  exportType: batchExportType,
                  destination: batchExportDestination,
                });
              }}
              disabled={selectedForBatchExport.length === 0 || batchExportMutation.isPending}
              className={batchExportDestination === "google_docs" ? "bg-blue-600 hover:bg-blue-700" : batchExportDestination === "notion" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {batchExportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : batchExportDestination === "google_docs" ? (
                <FileText className="h-4 w-4 mr-2" />
              ) : batchExportDestination === "notion" ? (
                <BookOpen className="h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {batchExportDestination === "google_docs" 
                ? `Export to Google Docs (${selectedForBatchExport.length})` 
                : batchExportDestination === "notion" 
                  ? `Export to Notion (${selectedForBatchExport.length})`
                  : `Download ${selectedForBatchExport.length} Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create Content Refresh Schedule
            </DialogTitle>
            <DialogDescription>
              Set up automatic content regeneration for a template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template *</Label>
              <Select value={String(scheduleTemplateId || '')} onValueChange={(v) => setScheduleTemplateId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesQuery.data?.map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select value={scheduleFrequency} onValueChange={(v) => setScheduleFrequency(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scheduleFrequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={String(scheduleDayOfWeek)} onValueChange={(v) => setScheduleDayOfWeek(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={scheduleTimeOfDay}
                onChange={(e) => setScheduleTimeOfDay(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!scheduleTemplateId) {
                  toast.error("Please select a template");
                  return;
                }
                createScheduleMutation.mutate({
                  savedTemplateId: scheduleTemplateId,
                  frequency: scheduleFrequency,
                  dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
                  timeOfDay: scheduleTimeOfDay,
                });
              }}
              disabled={!scheduleTemplateId || createScheduleMutation.isPending}
            >
              {createScheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Template Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Template
            </DialogTitle>
            <DialogDescription>
              Share this template with others via email or public link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share Method</Label>
              <div className="flex gap-2">
                <Button
                  variant={shareMethod === 'email' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setShareMethod('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={shareMethod === 'link' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setShareMethod('link')}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Public Link
                </Button>
              </div>
            </div>
            {shareMethod === 'email' && (
              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select value={sharePermission} onValueChange={(v) => setSharePermission(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="duplicate">Can Duplicate</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!shareTemplateId) return;
                shareTemplateMutation.mutate({
                  savedTemplateId: shareTemplateId,
                  shareType: shareMethod === 'link' ? 'public' : 'direct',
                  sharedWithEmail: shareMethod === 'email' ? shareEmail : undefined,
                  permission: sharePermission,
                });
              }}
              disabled={shareTemplateMutation.isPending || (shareMethod === 'email' && !shareEmail)}
            >
              {shareTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {shareMethod === 'link' ? 'Generate Link' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Public Gallery Dialog */}
      <Dialog open={showPublicGalleryDialog} onOpenChange={setShowPublicGalleryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Public Template Gallery
            </DialogTitle>
            <DialogDescription>
              Browse and duplicate community-shared templates
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {publicGalleryQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : publicGalleryQuery.data && publicGalleryQuery.data.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {publicGalleryQuery.data.map((template: any) => (
                  <Card key={template.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{template.name}</span>
                        <Badge className={contentTypeColors[template.contentType || '']}>
                          {(template.contentType || '').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{template.usageCount || 0} uses</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            duplicateTemplateMutation.mutate({ templateId: template.id });
                          }}
                          disabled={duplicateTemplateMutation.isPending}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Public Templates</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Be the first to share a template with the community!
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* A/B Test Analysis Dialog */}
      <Dialog open={showAbTestDialog} onOpenChange={setShowAbTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              A/B Test Analysis
            </DialogTitle>
            <DialogDescription>
              Compare version performance and declare a winner
            </DialogDescription>
          </DialogHeader>
          {abTestAnalysisQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : abTestAnalysisQuery.data ? (
            <div className="space-y-4">
              {/* Recommended Winner */}
              {'analysis' in abTestAnalysisQuery.data && abTestAnalysisQuery.data.analysis?.potentialWinner && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">Recommended Winner</span>
                  </div>
                  <p className="text-sm">
                    Version {abTestAnalysisQuery.data.analysis.potentialWinner.versionNumber} has the best performance
                    with {abTestAnalysisQuery.data.analysis.potentialWinner.ctr.toFixed(2)}% CTR
                  </p>
                </div>
              )}

              {/* Version Comparison */}
              <div className="space-y-3">
                {abTestAnalysisQuery.data.versions?.map((version: any) => (
                  <Card key={version.id} className={version.status === 'winner' ? 'border-yellow-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {version.versionNumber}</span>
                          {version.status === 'winner' && (
                            <Badge className="bg-yellow-500">
                              <Trophy className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                        {version.status !== 'winner' && generatedContentId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              declareWinnerMutation.mutate({
                                contentTemplateId: generatedContentId,
                                winnerVersionId: version.id,
                              });
                            }}
                          >
                            <Crown className="h-4 w-4 mr-1" />
                            Declare Winner
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Impressions</p>
                          <p className="font-medium">{version.metrics?.impressions || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-medium">{version.metrics?.clicks || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CTR</p>
                          <p className="font-medium">{(version.metrics?.ctr || 0).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversions</p>
                          <p className="font-medium">{version.metrics?.conversions || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No A/B Test Data</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Create multiple versions and add metrics to start A/B testing.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
