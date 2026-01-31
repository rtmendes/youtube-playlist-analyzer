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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, Video, Users, BookOpen, Megaphone, ShoppingCart, Mail, Lightbulb,
  Sparkles, ArrowRight, Loader2, Copy, Download, History, Star, Check,
  ChevronRight, Info, Wand2, MessageSquare, Target, Zap, BookMarked
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
      // Clear the URL parameter from browser history
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");

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

  // Mutations
  const generateMutation = trpc.contentGenerator.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setIsGenerating(false);
      toast.success("Content generated successfully!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Generation failed: ${error.message}`);
    },
  });

  const categorizeCommentsMutation = trpc.contentGenerator.categorizeComments.useMutation();
  const extractInsightsMutation = trpc.contentGenerator.extractInsights.useMutation();

  // Get selected prompt details
  const selectedPromptDetails = promptsQuery.data?.find(p => p.id === selectedPrompt);

  // Handle content type selection
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedPrompt(null);
    setVariables({});
    setGeneratedContent(null);
  };

  // Handle prompt selection
  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    setVariables({});
    setGeneratedContent(null);
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
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="generator" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="gap-2">
            <BookMarked className="h-4 w-4" />
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" />
            History
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
                          ? `${contentTypeColors[type.id]} border-2`
                          : "hover:bg-muted/50 border-border"
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
                      <FileText className="h-4 w-4" />
                      2. Select Prompt Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {promptsQuery.isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {promptsQuery.data?.map((prompt) => (
                          <button
                            key={prompt.id}
                            onClick={() => handlePromptSelect(prompt.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                              selectedPrompt === prompt.id
                                ? "bg-primary/5 border-primary"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{prompt.name}</span>
                              {prompt.framework && (
                                <Badge variant="outline" className="text-xs">
                                  {prompt.framework}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {prompt.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Middle Column - Variables & Comments */}
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
                          {variable.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
              {selectedPromptDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      4. Select Source Comments
                      <Badge variant="secondary" className="ml-auto">
                        {selectedComments.length} selected
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Choose saved comments to include in your content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      {savedCommentsQuery.data && savedCommentsQuery.data.length > 0 ? (
                        <div className="space-y-2">
                          {savedCommentsQuery.data.map((comment) => (
                            <div
                              key={comment.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedComments.find(c => c.id === comment.id)
                                  ? "bg-primary/5 border-primary"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => handleCommentToggle(comment)}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={!!selectedComments.find(c => c.id === comment.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {comment.source}
                                    </Badge>
                                    {comment.authorName && (
                                      <span className="text-xs text-muted-foreground">
                                        {comment.authorName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm line-clamp-3">{comment.text}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No saved comments yet. Save comments from your research to use them here.
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Generation & Output */}
            <div className="space-y-6">
              {/* Best Practices */}
              {selectedPromptDetails && (
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
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
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
      </Tabs>
    </div>
  );
}
