import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileJson, Table, Save, Trash2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

// Column definitions for different data types
export const videoColumns = [
  { id: "videoId", label: "Video ID", category: "basic" },
  { id: "title", label: "Title", category: "basic" },
  { id: "channelTitle", label: "Channel", category: "basic" },
  { id: "publishedAt", label: "Published Date", category: "basic" },
  { id: "description", label: "Description", category: "content" },
  { id: "duration", label: "Duration", category: "metrics" },
  { id: "viewCount", label: "Views", category: "metrics" },
  { id: "likeCount", label: "Likes", category: "metrics" },
  { id: "commentCount", label: "Comment Count", category: "metrics" },
  { id: "thumbnailUrl", label: "Thumbnail URL", category: "media" },
  { id: "videoUrl", label: "Video URL", category: "media" },
  { id: "tags", label: "Tags", category: "metadata" },
  { id: "category", label: "Category", category: "metadata" },
];

export const commentColumns = [
  { id: "commentId", label: "Comment ID", category: "basic" },
  { id: "videoId", label: "Video ID", category: "basic" },
  { id: "videoTitle", label: "Video Title", category: "basic" },
  { id: "authorName", label: "Author Name", category: "author" },
  { id: "authorChannelId", label: "Author Channel ID", category: "author" },
  { id: "text", label: "Comment Text", category: "content" },
  { id: "publishedAt", label: "Published Date", category: "content" },
  { id: "likeCount", label: "Likes", category: "engagement" },
  { id: "replyCount", label: "Reply Count", category: "engagement" },
  { id: "isReply", label: "Is Reply", category: "metadata" },
  { id: "parentId", label: "Parent Comment ID", category: "metadata" },
  { id: "detectedCategory", label: "AI Category", category: "intelligence" },
  { id: "sentiment", label: "Sentiment", category: "intelligence" },
];

// Preset templates
export const presetTemplates = {
  videos: [
    {
      id: "full",
      name: "Full Data",
      description: "All video data including metadata and metrics",
      columns: videoColumns.map(c => c.id),
    },
    {
      id: "metrics",
      name: "Metrics Only",
      description: "Views, likes, comments - perfect for spreadsheet analysis",
      columns: ["videoId", "title", "channelTitle", "viewCount", "likeCount", "commentCount", "publishedAt"],
    },
    {
      id: "content",
      name: "Content Overview",
      description: "Titles, descriptions, and basic info",
      columns: ["videoId", "title", "description", "channelTitle", "publishedAt", "videoUrl"],
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Just the essentials - ID, title, and URL",
      columns: ["videoId", "title", "videoUrl"],
    },
  ],
  comments: [
    {
      id: "full",
      name: "Full Data",
      description: "All comment data including AI analysis",
      columns: commentColumns.map(c => c.id),
    },
    {
      id: "marketing",
      name: "Marketing Insights",
      description: "Comments with AI categories for marketing use",
      columns: ["videoTitle", "authorName", "text", "likeCount", "detectedCategory", "sentiment"],
    },
    {
      id: "engagement",
      name: "Engagement Analysis",
      description: "Focus on likes, replies, and popular comments",
      columns: ["videoTitle", "text", "authorName", "likeCount", "replyCount", "publishedAt"],
    },
    {
      id: "text_only",
      name: "Text Only",
      description: "Just the comment text for content analysis",
      columns: ["videoTitle", "text"],
    },
  ],
};

interface ExportTemplatesProps {
  dataType: "videos" | "comments";
  data: any[];
  trigger?: React.ReactNode;
  onExport?: (format: string, columns: string[], data: any[]) => void;
}

export function ExportTemplates({ dataType, data, trigger, onExport }: ExportTemplatesProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("full");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "sheets">("csv");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");

  const columns = dataType === "videos" ? videoColumns : commentColumns;
  const templates = presetTemplates[dataType];

  // Load saved templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`export_templates_${dataType}`);
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, [dataType]);

  // Update selected columns when template changes
  useEffect(() => {
    const template = [...templates, ...savedTemplates].find(t => t.id === selectedTemplate);
    if (template) {
      setSelectedColumns(template.columns);
    }
  }, [selectedTemplate, templates, savedTemplates]);

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(c => c !== columnId)
        : [...prev, columnId]
    );
    setSelectedTemplate("custom");
  };

  const selectAllColumns = () => {
    setSelectedColumns(columns.map(c => c.id));
    setSelectedTemplate("custom");
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
    setSelectedTemplate("custom");
  };

  const saveCustomTemplate = () => {
    if (!customTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: customTemplateName,
      description: `Custom template with ${selectedColumns.length} columns`,
      columns: selectedColumns,
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem(`export_templates_${dataType}`, JSON.stringify(updated));
    setCustomTemplateName("");
    toast.success("Template saved!");
  };

  const deleteTemplate = (templateId: string) => {
    const updated = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updated);
    localStorage.setItem(`export_templates_${dataType}`, JSON.stringify(updated));
    toast.success("Template deleted");
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column");
      return;
    }

    // Filter data to only include selected columns
    const filteredData = data.map(item => {
      const filtered: Record<string, any> = {};
      selectedColumns.forEach(col => {
        if (item[col] !== undefined) {
          filtered[col] = item[col];
        }
      });
      return filtered;
    });

    if (onExport) {
      onExport(exportFormat, selectedColumns, filteredData);
    } else {
      // Default export behavior
      if (exportFormat === "csv") {
        exportToCSV(filteredData, selectedColumns);
      } else if (exportFormat === "json") {
        exportToJSON(filteredData);
      } else {
        exportToGoogleSheets(filteredData, selectedColumns);
      }
    }

    setOpen(false);
    toast.success(`Exported ${data.length} ${dataType} as ${exportFormat.toUpperCase()}`);
  };

  const exportToCSV = (data: any[], columns: string[]) => {
    const columnLabels = columns.map(c => {
      const col = (dataType === "videos" ? videoColumns : commentColumns).find(vc => vc.id === c);
      return col?.label || c;
    });

    const header = columnLabels.join(",");
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    );

    const csv = [header, ...rows].join("\n");
    downloadFile(csv, `${dataType}_export.csv`, "text/csv");
  };

  const exportToJSON = (data: any[]) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${dataType}_export.json`, "application/json");
  };

  const exportToGoogleSheets = (data: any[], columns: string[]) => {
    // Create CSV and open Google Sheets import
    exportToCSV(data, columns);
    window.open("https://sheets.google.com/create", "_blank");
    toast.info("CSV downloaded. Import it into the new Google Sheet.");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group columns by category
  const columnsByCategory = columns.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = [];
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, typeof columns>);

  const categoryLabels: Record<string, string> = {
    basic: "Basic Info",
    content: "Content",
    metrics: "Metrics",
    media: "Media",
    metadata: "Metadata",
    author: "Author",
    engagement: "Engagement",
    intelligence: "AI Analysis",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {dataType === "videos" ? "Videos" : "Comments"}
          </DialogTitle>
          <DialogDescription>
            Choose a template or customize which columns to export
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Preset Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Columns</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="flex-1 overflow-auto mt-4">
            <div className="grid gap-3">
              {[...templates, ...savedTemplates].map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedTemplate === template.id ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {selectedTemplate === template.id && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {template.columns.length} columns
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {template.id.startsWith("custom_") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllColumns}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllColumns}>
                  Deselect All
                </Button>
              </div>
              <Badge variant="secondary">
                {selectedColumns.length} / {columns.length} selected
              </Badge>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {Object.entries(columnsByCategory).map(([category, cols]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {cols.map((col) => (
                        <div key={col.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={col.id}
                            checked={selectedColumns.includes(col.id)}
                            onCheckedChange={() => toggleColumn(col.id)}
                          />
                          <Label htmlFor={col.id} className="text-sm cursor-pointer">
                            {col.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Input
                placeholder="Template name..."
                value={customTemplateName}
                onChange={(e) => setCustomTemplateName(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={saveCustomTemplate} disabled={selectedColumns.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Export Format</Label>
              <RadioGroup
                value={exportFormat}
                onValueChange={(v) => setExportFormat(v as any)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-1 cursor-pointer">
                    <Table className="h-4 w-4" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-1 cursor-pointer">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sheets" id="sheets" />
                  <Label htmlFor="sheets" className="flex items-center gap-1 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4" />
                    Google Sheets
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export {data.length} {dataType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
