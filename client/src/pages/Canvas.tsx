import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Wand2,
  FileText,
  Video,
  BookOpen,
  GraduationCap,
  Megaphone,
  ShoppingCart,
  Mail,
  Share2,
  Quote,
  Sparkles,
  Plus,
  Save,
  Download,
  Copy,
  Trash2,
  Star,
  Loader2,
  Brain,
  Target,
  Users,
  MessageSquare,
  ChevronRight,
  Settings,
  Palette,
  Send,
  Youtube,
  MessageCircle,
  Database,
  Filter,
  CheckCircle2,
  X,
  Layers,
  Zap,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Asset type definitions
const ASSET_TYPES = {
  advertorial: { label: "Advertorial", icon: FileText, description: "Long-form story-driven ad content" },
  vsl_script: { label: "VSL Script", icon: Video, description: "Video sales letter script" },
  ugc_scenario: { label: "UGC Scenario", icon: Users, description: "User-generated content script" },
  ebook_outline: { label: "Ebook Outline", icon: BookOpen, description: "Structured ebook chapters" },
  course_structure: { label: "Course Structure", icon: GraduationCap, description: "Online course modules" },
  ad_copy: { label: "Ad Copy", icon: Megaphone, description: "Short-form ad variations" },
  sales_page: { label: "Sales Page", icon: ShoppingCart, description: "Landing page copy" },
  product_offer: { label: "Product Offer", icon: Target, description: "Offer stack and pricing" },
  email_sequence: { label: "Email Sequence", icon: Mail, description: "Nurture email series" },
  social_post: { label: "Social Post", icon: Share2, description: "Social media content" },
  testimonial_formatted: { label: "Testimonial", icon: Quote, description: "Formatted testimonials" },
  custom: { label: "Custom", icon: Sparkles, description: "Custom AI generation" },
  multi_source: { label: "Multi-Source", icon: Layers, description: "Generate from YouTube, Amazon & Reddit insights" },
};

interface GeneratedAsset {
  id: number;
  type: keyof typeof ASSET_TYPES;
  title: string;
  content: string | null;
  isFavorite: number | null;
  createdAt: Date;
}

export default function Canvas() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = params.get("projectId");
  
  const { isAuthenticated } = useAuth();
  
  // State
  const [selectedAssetType, setSelectedAssetType] = useState<keyof typeof ASSET_TYPES>("advertorial");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [assetTitle, setAssetTitle] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedAssets, setSavedAssets] = useState<GeneratedAsset[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [multiSourceFilter, setMultiSourceFilter] = useState<"all" | "youtube" | "amazon" | "reddit">("all");
  
  // Load saved API key
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setGeminiApiKey(savedKey);
  }, []);
  
  // Load project data
  const projectQuery = trpc.projects.getById.useQuery(
    { id: parseInt(projectId || "0") },
    { enabled: !!projectId && isAuthenticated }
  );
  
  // Load saved assets
  const assetsQuery = trpc.assets.getByProject.useQuery(
    { projectId: parseInt(projectId || "0") },
    { enabled: !!projectId && isAuthenticated }
  );

  // Load multi-source insights
  const multiInsightsQuery = trpc.multiInsights.listByProject.useQuery(
    { projectId: parseInt(projectId || "0") },
    { enabled: !!projectId && isAuthenticated }
  );

  // Get multi-source stats
  const multiInsightsStatsQuery = trpc.multiInsights.getStats.useQuery(
    { projectId: parseInt(projectId || "0") },
    { enabled: !!projectId && isAuthenticated }
  );
  
  useEffect(() => {
    if (assetsQuery.data) {
      setSavedAssets(assetsQuery.data as GeneratedAsset[]);
    }
  }, [assetsQuery.data]);
  
  // Save asset mutation
  const saveAssetMutation = trpc.assets.create.useMutation({
    onSuccess: () => {
      toast.success("Asset saved!");
      setShowSaveDialog(false);
      assetsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
  
  // Delete asset mutation
  const deleteAssetMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      toast.success("Asset deleted");
      assetsQuery.refetch();
    },
  });

  // Generate content with Gemini
  const generateContent = async () => {
    if (!geminiApiKey) {
      setShowApiKeyDialog(true);
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const assetConfig = ASSET_TYPES[selectedAssetType];
      
      // Build prompt based on asset type
      let systemPrompt = "";
      
      switch (selectedAssetType) {
        case "advertorial":
          systemPrompt = `You are an expert copywriter specializing in advertorials. Create a compelling, story-driven advertorial that:
- Opens with a relatable hook or personal story
- Builds emotional connection through narrative
- Naturally introduces the product/solution
- Uses testimonial-style language
- Ends with a soft call-to-action
Format with clear sections and engaging subheadings.`;
          break;
        case "vsl_script":
          systemPrompt = `You are a video sales letter script expert. Create a VSL script that:
- Hooks viewers in the first 10 seconds
- Identifies the problem/pain point
- Agitates the problem
- Presents the solution
- Shows proof and testimonials
- Makes an irresistible offer
- Creates urgency
Include [VISUAL NOTES] for video direction.`;
          break;
        case "ugc_scenario":
          systemPrompt = `You are a UGC content strategist. Create a user-generated content scenario that:
- Feels authentic and unscripted
- Shows real-life product usage
- Includes natural dialogue
- Captures genuine reactions
- Has a clear story arc
Format as a scene-by-scene breakdown with dialogue.`;
          break;
        case "ebook_outline":
          systemPrompt = `You are an ebook strategist. Create a comprehensive ebook outline that:
- Has an attention-grabbing title
- Includes 8-12 chapters
- Each chapter has 3-5 key sections
- Includes actionable takeaways
- Builds toward a transformation
Format with chapter titles, descriptions, and key points.`;
          break;
        case "course_structure":
          systemPrompt = `You are an online course designer. Create a course structure that:
- Has clear learning objectives
- Is organized into modules and lessons
- Includes practical exercises
- Has milestone checkpoints
- Ends with a capstone project
Format with modules, lessons, and time estimates.`;
          break;
        case "ad_copy":
          systemPrompt = `You are a performance marketing copywriter. Create 5 ad copy variations that:
- Have scroll-stopping headlines
- Use power words and emotional triggers
- Include social proof elements
- Have clear CTAs
- Are optimized for different platforms (Facebook, Google, Instagram)
Format each variation with headline, body, and CTA.`;
          break;
        case "sales_page":
          systemPrompt = `You are a conversion copywriter. Create sales page copy that:
- Has a powerful headline and subheadline
- Addresses objections
- Includes benefit-driven bullet points
- Has testimonial sections
- Creates urgency with scarcity
- Has a strong guarantee
Format with clear sections for each page element.`;
          break;
        case "product_offer":
          systemPrompt = `You are a product strategist. Create a compelling offer stack that:
- Has a clear core offer
- Includes valuable bonuses
- Shows total value vs price
- Has tiered pricing options
- Includes risk reversal
Format as a structured offer breakdown with pricing.`;
          break;
        case "email_sequence":
          systemPrompt = `You are an email marketing expert. Create a 5-email nurture sequence that:
- Welcomes and builds rapport
- Delivers value and education
- Shares social proof
- Addresses objections
- Makes the offer
Format each email with subject line, preview text, and body.`;
          break;
        case "social_post":
          systemPrompt = `You are a social media strategist. Create 10 social media posts that:
- Are platform-optimized
- Use hooks and storytelling
- Include relevant hashtags
- Have engagement prompts
- Mix content types (carousel, single, video ideas)
Format with platform, post type, and content.`;
          break;
        case "testimonial_formatted":
          systemPrompt = `You are a testimonial editor. Transform raw comments into polished testimonials that:
- Highlight key benefits
- Include specific results
- Feel authentic
- Are quotable
- Can be used in marketing
Format with the testimonial, attribution, and use case.`;
          break;
        case "multi_source":
          // Build context from multi-source insights
          const insights = multiInsightsQuery.data || [];
          const youtubeInsights = insights.filter((i: any) => i.sourceType === "youtube").slice(0, 10);
          const amazonInsights = insights.filter((i: any) => i.sourceType === "amazon").slice(0, 10);
          const redditInsights = insights.filter((i: any) => i.sourceType === "reddit").slice(0, 10);
          
          let contextSummary = "";
          
          if (youtubeInsights.length > 0) {
            contextSummary += "\n\n## YouTube Comments Insights:\n";
            youtubeInsights.forEach((i: any) => {
              contextSummary += `- [${i.sentiment}] ${i.contentText.slice(0, 200)}...\n`;
            });
          }
          
          if (amazonInsights.length > 0) {
            contextSummary += "\n\n## Amazon Reviews Insights:\n";
            amazonInsights.forEach((i: any) => {
              contextSummary += `- [${i.sentiment}] ${i.contentText.slice(0, 200)}...\n`;
            });
          }
          
          if (redditInsights.length > 0) {
            contextSummary += "\n\n## Reddit Discussion Insights:\n";
            redditInsights.forEach((i: any) => {
              contextSummary += `- [${i.sentiment}] ${i.contentText.slice(0, 200)}...\n`;
            });
          }
          
          systemPrompt = `You are a marketing strategist with access to real customer insights from multiple sources. 
Analyze the following customer feedback from YouTube comments, Amazon reviews, and Reddit discussions to create comprehensive marketing content.

${contextSummary}

Based on these real customer insights:
1. Identify the main pain points and desires
2. Extract the most compelling testimonial-style quotes
3. Note the language and phrases customers actually use
4. Find patterns across different platforms
5. Generate marketing content that directly addresses what customers care about

Create content that:
- Uses authentic customer language
- Addresses real pain points discovered in the research
- Incorporates actual praise and positive feedback
- Feels genuine and relatable
- Is optimized for conversion`;
          break;
        default:
          systemPrompt = "You are a marketing content expert. Generate high-quality marketing content based on the user's request.";
      }
      
      const userPrompt = customPrompt || `Create ${assetConfig.label} content for a marketing campaign. Make it compelling, conversion-focused, and ready to use.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser Request: ${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate content");
      }
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated";
      
      setGeneratedContent(content);
      setAssetTitle(`${ASSET_TYPES[selectedAssetType].label} - ${new Date().toLocaleDateString()}`);
      
    } catch (error: any) {
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save API key
  const saveApiKey = () => {
    localStorage.setItem("gemini_api_key", geminiApiKey);
    setShowApiKeyDialog(false);
    toast.success("API key saved");
  };

  // Save generated asset
  const handleSaveAsset = () => {
    if (!projectId || !generatedContent) return;
    
    // Map multi_source to custom for database storage
    const dbType = selectedAssetType === "multi_source" ? "custom" : selectedAssetType;
    
    saveAssetMutation.mutate({
      projectId: parseInt(projectId),
      type: dbType as any,
      title: assetTitle,
      content: generatedContent,
      generationPrompt: customPrompt,
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Export asset
  const exportAsset = (asset: GeneratedAsset) => {
    const blob = new Blob([asset.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground sticky top-0 bg-background z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Marketing Canvas
              </h1>
              <p className="text-sm text-muted-foreground">
                {projectQuery.data?.name || "New Project"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowApiKeyDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              API Key
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <FileText className="h-4 w-4" />
              Saved Assets ({savedAssets.length})
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Database className="h-4 w-4" />
              Insights ({multiInsightsStatsQuery.data?.total || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Asset Type Selection */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Asset Type</CardTitle>
                    <CardDescription>Select the type of content to generate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {Object.entries(ASSET_TYPES).map(([key, { label, icon: Icon, description }]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedAssetType(key as keyof typeof ASSET_TYPES)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                              selectedAssetType === key
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary"
                            }`}
                          >
                            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{label}</div>
                              <div className={`text-xs ${
                                selectedAssetType === key ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}>
                                {description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Generation Area */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedAssetType === "multi_source" ? (
                        <Layers className="h-5 w-5 text-primary" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-primary" />
                      )}
                      {ASSET_TYPES[selectedAssetType].label} Generator
                    </CardTitle>
                    <CardDescription>
                      {ASSET_TYPES[selectedAssetType].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Multi-source insights summary */}
                    {selectedAssetType === "multi_source" && (
                      <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Zap className="h-4 w-4 text-primary" />
                          Insights Available for Generation
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Youtube className="h-4 w-4 text-red-500" />
                            <span>{multiInsightsStatsQuery.data?.youtube || 0} YouTube</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ShoppingCart className="h-4 w-4 text-orange-500" />
                            <span>{multiInsightsStatsQuery.data?.amazon || 0} Amazon</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MessageCircle className="h-4 w-4 text-orange-600" />
                            <span>{multiInsightsStatsQuery.data?.reddit || 0} Reddit</span>
                          </div>
                        </div>
                        {(multiInsightsStatsQuery.data?.total || 0) === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Add insights from the Intelligence tools to enable multi-source generation.
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>
                        {selectedAssetType === "multi_source" 
                          ? "What would you like to create? (e.g., ad copy, landing page, email sequence)"
                          : "Custom Instructions (Optional)"}
                      </Label>
                      <Textarea
                        placeholder={selectedAssetType === "multi_source"
                          ? "Describe the content you want to create using insights from all sources. E.g., 'Create Facebook ad copy that addresses the main pain points customers mention across YouTube, Amazon, and Reddit...'"
                          : "Add specific instructions, target audience details, product information, or tone preferences..."}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={generateContent} 
                      disabled={isGenerating || (selectedAssetType === "multi_source" && (multiInsightsStatsQuery.data?.total || 0) === 0)}
                      className="w-full gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : selectedAssetType === "multi_source" ? (
                        <>
                          <Layers className="h-4 w-4" />
                          Generate from {multiInsightsStatsQuery.data?.total || 0} Insights
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          Generate {ASSET_TYPES[selectedAssetType].label}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Content */}
                {generatedContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Generated Content</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(generatedContent)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => setShowSaveDialog(true)}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                            {generatedContent}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedAssets.map((asset) => {
                const AssetIcon = ASSET_TYPES[asset.type]?.icon || FileText;
                return (
                  <Card key={asset.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AssetIcon className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-sm">{asset.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {ASSET_TYPES[asset.type]?.label || asset.type}
                            </CardDescription>
                          </div>
                        </div>
                        {asset.isFavorite === 1 && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {(asset.content || "").substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setGeneratedContent(asset.content || "");
                            setAssetTitle(asset.title);
                            setActiveTab("generate");
                          }}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(asset.content || "")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportAsset(asset)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteAssetMutation.mutate({ id: asset.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {savedAssets.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No saved assets yet</p>
                    <p className="text-sm text-muted-foreground">Generate content and save it here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            {/* Source Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by source:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={multiSourceFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMultiSourceFilter("all")}
                >
                  All ({multiInsightsStatsQuery.data?.total || 0})
                </Button>
                <Button
                  variant={multiSourceFilter === "youtube" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMultiSourceFilter("youtube")}
                  className="gap-2"
                >
                  <Youtube className="h-4 w-4 text-red-500" />
                  YouTube ({multiInsightsStatsQuery.data?.youtube || 0})
                </Button>
                <Button
                  variant={multiSourceFilter === "amazon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMultiSourceFilter("amazon")}
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4 text-orange-500" />
                  Amazon ({multiInsightsStatsQuery.data?.amazon || 0})
                </Button>
                <Button
                  variant={multiSourceFilter === "reddit" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMultiSourceFilter("reddit")}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4 text-orange-600" />
                  Reddit ({multiInsightsStatsQuery.data?.reddit || 0})
                </Button>
              </div>
            </div>

            {/* Insights Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(multiInsightsQuery.data || [])
                .filter(insight => multiSourceFilter === "all" || insight.sourceType === multiSourceFilter)
                .map((insight: any) => {
                  const sourceIcon = insight.sourceType === "youtube" 
                    ? Youtube 
                    : insight.sourceType === "amazon" 
                      ? ShoppingCart 
                      : MessageCircle;
                  const sourceColor = insight.sourceType === "youtube" 
                    ? "text-red-500" 
                    : insight.sourceType === "amazon" 
                      ? "text-orange-500" 
                      : "text-orange-600";
                  const SourceIcon = sourceIcon;
                  
                  return (
                    <Card key={insight.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <SourceIcon className={`h-4 w-4 ${sourceColor}`} />
                            <Badge variant="outline" className="text-xs capitalize">
                              {insight.sourceType}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                insight.sentiment === "positive" ? "bg-green-100 text-green-700" :
                                insight.sentiment === "negative" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {insight.sentiment}
                            </Badge>
                          </div>
                          {insight.isSelected === 1 && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        {insight.sourceTitle && (
                          <CardTitle className="text-sm line-clamp-1 mt-2">
                            {insight.sourceTitle}
                          </CardTitle>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
                          {insight.contentText}
                        </p>
                        {insight.authorName && (
                          <p className="text-xs text-muted-foreground mb-2">
                            — {insight.authorName}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.category?.replace("_", " ")}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyToClipboard(insight.contentText)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {(multiInsightsQuery.data || []).filter(
                (insight: any) => multiSourceFilter === "all" || insight.sourceType === multiSourceFilter
              ).length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No insights collected yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add insights from YouTube, Amazon, or Reddit intelligence tools
                    </p>
                    <div className="flex justify-center gap-2">
                      <Link href="/intelligence">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Youtube className="h-4 w-4 text-red-500" />
                          YouTube
                        </Button>
                      </Link>
                      <Link href="/amazon">
                        <Button variant="outline" size="sm" className="gap-2">
                          <ShoppingCart className="h-4 w-4 text-orange-500" />
                          Amazon
                        </Button>
                      </Link>
                      <Link href="/reddit">
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageCircle className="h-4 w-4 text-orange-600" />
                          Reddit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Asset</DialogTitle>
            <DialogDescription>
              Save this generated content to your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset Title</Label>
              <Input
                value={assetTitle}
                onChange={(e) => setAssetTitle(e.target.value)}
                placeholder="Enter a title for this asset"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset} disabled={saveAssetMutation.isPending}>
              {saveAssetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Gemini API Key</DialogTitle>
            <DialogDescription>
              Enter your Gemini API key to enable AI content generation.
              Get your key from{" "}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveApiKey}>
              Save Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
