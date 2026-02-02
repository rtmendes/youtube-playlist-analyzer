import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  FileText,
  Mic,
  MessageSquare,
  Megaphone,
  Layout,
  Mail,
  Users,
  BookOpen,
  FileCheck,
  Rocket,
  CalendarDays,
  MoreHorizontal,
  TrendingUp,
  BarChart3,
  Clock,
  Eye,
  Heart,
  Share2,
  Trash2,
  ExternalLink,
  Lightbulb,
  Target,
  Download,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Settings,
  Send,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "blog_post", label: "Blog Post", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "podcast", label: "Podcast", icon: Mic },
  { value: "social_post", label: "Social Post", icon: MessageSquare },
  { value: "ad", label: "Advertisement", icon: Megaphone },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "email", label: "Email", icon: Mail },
  { value: "webinar", label: "Webinar", icon: Users },
  { value: "case_study", label: "Case Study", icon: BookOpen },
  { value: "whitepaper", label: "Whitepaper", icon: FileCheck },
  { value: "product_launch", label: "Product Launch", icon: Rocket },
  { value: "event", label: "Event", icon: CalendarDays },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CompetitorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>("weekly_summary");
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<number[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    frequency: "weekly" as "weekly" | "biweekly" | "monthly" | "quarterly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    timeOfDay: "09:00",
    emailEnabled: true,
    emailRecipients: [] as string[],
    newEmail: "",
  });

  // Form state for adding content
  const [newEntry, setNewEntry] = useState({
    competitorId: "",
    title: "",
    contentType: "blog_post" as const,
    url: "",
    publishedAt: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    notes: "",
  });

  // Queries
  const competitorsQuery = trpc.competitorAnalysis.getCompetitors.useQuery();
  const calendarViewQuery = trpc.competitorAnalysis.getCalendarView.useQuery({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  });

  // Mutations
  const addEntryMutation = trpc.competitorAnalysis.addCalendarEntry.useMutation({
    onSuccess: () => {
      toast.success("Content added to calendar");
      setShowAddDialog(false);
      setNewEntry({
        competitorId: "",
        title: "",
        contentType: "blog_post",
        url: "",
        publishedAt: "",
        views: "",
        likes: "",
        comments: "",
        shares: "",
        notes: "",
      });
      calendarViewQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEntryMutation = trpc.competitorAnalysis.deleteCalendarEntry.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      calendarViewQuery.refetch();
    },
  });

  // Report queries and mutations
  const reportsQuery = trpc.competitorAnalysis.getReports.useQuery({ limit: 20 });
  const schedulesQuery = trpc.competitorAnalysis.getReportSchedules.useQuery();

  const generateReportMutation = trpc.competitorAnalysis.generateReport.useMutation({
    onSuccess: (data) => {
      toast.success("Report generated successfully!");
      setShowReportDialog(false);
      setReportTitle("");
      setSelectedCompetitorIds([]);
      reportsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate report");
    },
  });

  const createScheduleMutation = trpc.competitorAnalysis.createReportSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`Report scheduled! Next run: ${new Date(data.nextRunAt).toLocaleString()}`);
      setShowScheduleDialog(false);
      setScheduleForm({
        name: "",
        frequency: "weekly",
        dayOfWeek: 1,
        dayOfMonth: 1,
        timeOfDay: "09:00",
        emailEnabled: true,
        emailRecipients: [],
        newEmail: "",
      });
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create schedule");
    },
  });

  const updateScheduleMutation = trpc.competitorAnalysis.updateReportSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      schedulesQuery.refetch();
    },
  });

  const deleteScheduleMutation = trpc.competitorAnalysis.deleteReportSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted");
      schedulesQuery.refetch();
    },
  });

  const deleteReportMutation = trpc.competitorAnalysis.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      reportsQuery.refetch();
    },
  });

  const analyzePatternsMutation = trpc.competitorAnalysis.analyzePostingPatterns.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Posting patterns analyzed successfully");
      } else {
        toast.error(data.message || "Analysis failed");
      }
    },
  });

  // YouTube Import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importCompetitorId, setImportCompetitorId] = useState<string>("");
  const [importApiKey, setImportApiKey] = useState("");
  const [importMaxVideos, setImportMaxVideos] = useState(50);

  const importFromYouTubeMutation = trpc.competitorAnalysis.importFromYouTube.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.importedCount} videos, updated ${data.updatedCount} from ${data.channelName}`);
      setShowImportDialog(false);
      setImportCompetitorId("");
      setImportApiKey("");
      calendarViewQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import videos");
    },
  });

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  const getEntriesForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const entries = calendarViewQuery.data?.byDate[dateKey] || [];
    
    if (selectedCompetitor === "all") return entries;
    return entries.filter(e => e.entry.competitorId === parseInt(selectedCompetitor));
  };

  const getContentTypeIcon = (type: string) => {
    const contentType = CONTENT_TYPES.find(ct => ct.value === type);
    return contentType?.icon || MoreHorizontal;
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      blog_post: "bg-blue-500",
      video: "bg-red-500",
      podcast: "bg-purple-500",
      social_post: "bg-pink-500",
      ad: "bg-orange-500",
      landing_page: "bg-green-500",
      email: "bg-yellow-500",
      webinar: "bg-indigo-500",
      case_study: "bg-teal-500",
      whitepaper: "bg-cyan-500",
      product_launch: "bg-emerald-500",
      event: "bg-rose-500",
      other: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddEntry = () => {
    if (!newEntry.competitorId || !newEntry.title || !newEntry.publishedAt) {
      toast.error("Please fill in required fields");
      return;
    }

    addEntryMutation.mutate({
      competitorId: parseInt(newEntry.competitorId),
      title: newEntry.title,
      contentType: newEntry.contentType,
      url: newEntry.url || undefined,
      publishedAt: newEntry.publishedAt,
      views: newEntry.views ? parseInt(newEntry.views) : undefined,
      likes: newEntry.likes ? parseInt(newEntry.likes) : undefined,
      comments: newEntry.comments ? parseInt(newEntry.comments) : undefined,
      shares: newEntry.shares ? parseInt(newEntry.shares) : undefined,
      notes: newEntry.notes || undefined,
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewEntry(prev => ({
      ...prev,
      publishedAt: date.toISOString().split('T')[0] + 'T12:00',
    }));
    setShowAddDialog(true);
  };

  // Get patterns for selected competitor
  const patternsQuery = trpc.competitorAnalysis.getPostingPatterns.useQuery(
    { competitorId: parseInt(selectedCompetitor) },
    { enabled: selectedCompetitor !== "all" && !!selectedCompetitor }
  );

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Competitor Content Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track and analyze competitor content publishing patterns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Competitors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitors</SelectItem>
              {competitorsQuery.data?.map((competitor) => (
                <SelectItem key={competitor.id} value={competitor.id.toString()}>
                  {competitor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Import from YouTube
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import from YouTube</DialogTitle>
                <DialogDescription>
                  Automatically import videos from a competitor's YouTube channel to the calendar
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Select Competitor *</Label>
                  <Select value={importCompetitorId} onValueChange={setImportCompetitorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a competitor" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitorsQuery.data?.map((competitor) => (
                        <SelectItem key={competitor.id} value={competitor.id.toString()}>
                          {competitor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The competitor must have a YouTube channel linked in Competitor Analysis
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>YouTube API Key *</Label>
                  <Input
                    type="password"
                    placeholder="Your YouTube Data API v3 key"
                    value={importApiKey}
                    onChange={(e) => setImportApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from the{" "}
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Google Cloud Console
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Videos</Label>
                  <Select value={importMaxVideos.toString()} onValueChange={(v) => setImportMaxVideos(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 videos</SelectItem>
                      <SelectItem value="25">25 videos</SelectItem>
                      <SelectItem value="50">50 videos</SelectItem>
                      <SelectItem value="100">100 videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!importCompetitorId || !importApiKey) {
                      toast.error("Please select a competitor and enter your API key");
                      return;
                    }
                    importFromYouTubeMutation.mutate({
                      competitorId: parseInt(importCompetitorId),
                      apiKey: importApiKey,
                      maxVideos: importMaxVideos,
                    });
                  }}
                  disabled={importFromYouTubeMutation.isPending}
                >
                  {importFromYouTubeMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Import Videos</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Competitor Content</DialogTitle>
                <DialogDescription>
                  Track a piece of content published by a competitor
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Competitor *</Label>
                    <Select
                      value={newEntry.competitorId}
                      onValueChange={(value) => setNewEntry(prev => ({ ...prev, competitorId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select competitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {competitorsQuery.data?.map((competitor) => (
                          <SelectItem key={competitor.id} value={competitor.id.toString()}>
                            {competitor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type *</Label>
                    <Select
                      value={newEntry.contentType}
                      onValueChange={(value: any) => setNewEntry(prev => ({ ...prev, contentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newEntry.title}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Content title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Published Date/Time *</Label>
                    <Input
                      type="datetime-local"
                      value={newEntry.publishedAt}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, publishedAt: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={newEntry.url}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Views</Label>
                    <Input
                      type="number"
                      value={newEntry.views}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, views: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Likes</Label>
                    <Input
                      type="number"
                      value={newEntry.likes}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, likes: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comments</Label>
                    <Input
                      type="number"
                      value={newEntry.comments}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, comments: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shares</Label>
                    <Input
                      type="number"
                      value={newEntry.shares}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, shares: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this content..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry} disabled={addEntryMutation.isPending}>
                  {addEntryMutation.isPending ? "Adding..." : "Add Content"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <BarChart3 className="w-4 h-4 mr-2" />
            Posting Patterns
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {CONTENT_TYPES.slice(0, 6).map((type) => (
                  <Badge key={type.value} variant="outline" className="text-xs">
                    <div className={`w-2 h-2 rounded-full ${getContentTypeColor(type.value)} mr-1`} />
                    {type.label}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {/* Day headers */}
                {DAYS.map((day) => (
                  <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const entries = getEntriesForDate(day.date);
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`bg-background min-h-[120px] p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                        !day.isCurrentMonth ? "opacity-40" : ""
                      } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                      onClick={() => handleDateClick(day.date)}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {entries.slice(0, 3).map((entry) => {
                          const Icon = getContentTypeIcon(entry.entry.contentType);
                          return (
                            <div
                              key={entry.entry.id}
                              className={`text-xs p-1 rounded flex items-center gap-1 text-white truncate ${getContentTypeColor(entry.entry.contentType)}`}
                              title={`${entry.competitor?.name}: ${entry.entry.title}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (entry.entry.url) {
                                  window.open(entry.entry.url, '_blank');
                                }
                              }}
                            >
                              <Icon className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{entry.entry.title}</span>
                            </div>
                          );
                        })}
                        {entries.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{entries.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Posting Frequency
                </CardTitle>
                <CardDescription>
                  When competitors publish content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCompetitor === "all" ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a specific competitor to view posting patterns
                  </p>
                ) : patternsQuery.data ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-3xl font-bold text-primary">
                          {parseFloat(patternsQuery.data.avgPostsPerWeek || "0").toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Posts/Week</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-3xl font-bold text-primary">
                          {parseFloat(patternsQuery.data.avgPostsPerMonth || "0").toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Posts/Month</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Best Posting Day</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {DAYS[patternsQuery.data.bestDayOfWeek || 0]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Highest engagement
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Best Posting Hour</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {patternsQuery.data.bestHourOfDay || 0}:00
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Highest engagement
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No patterns analyzed yet
                    </p>
                    <Button
                      onClick={() => analyzePatternsMutation.mutate({ competitorId: parseInt(selectedCompetitor) })}
                      disabled={analyzePatternsMutation.isPending}
                    >
                      {analyzePatternsMutation.isPending ? "Analyzing..." : "Analyze Patterns"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Day Distribution
                </CardTitle>
                <CardDescription>
                  Content published by day of week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patternsQuery.data?.dayDistribution ? (
                  <div className="space-y-2">
                    {(patternsQuery.data.dayDistribution as any[]).map((day: any) => (
                      <div key={day.day} className="flex items-center gap-2">
                        <div className="w-12 text-sm">{DAYS[day.day]}</div>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{
                              width: `${Math.min((day.count / Math.max(...(patternsQuery.data?.dayDistribution as any[]).map((d: any) => d.count), 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="w-8 text-sm text-right">{day.count}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {selectedCompetitor === "all" 
                      ? "Select a competitor to view distribution" 
                      : "Analyze patterns to see distribution"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Content Type Mix
                </CardTitle>
                <CardDescription>
                  Types of content published
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patternsQuery.data?.contentTypeDistribution ? (
                  <div className="space-y-2">
                    {(patternsQuery.data.contentTypeDistribution as any[]).map((type: any) => {
                      const Icon = getContentTypeIcon(type.type);
                      return (
                        <div key={type.type} className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <div className="w-24 text-sm truncate">
                            {CONTENT_TYPES.find(ct => ct.value === type.type)?.label || type.type}
                          </div>
                          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getContentTypeColor(type.type)}`}
                              style={{ width: `${type.percentage}%` }}
                            />
                          </div>
                          <div className="w-12 text-sm text-right">{type.percentage.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {selectedCompetitor === "all" 
                      ? "Select a competitor to view content mix" 
                      : "Analyze patterns to see content mix"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Content Gaps
                </CardTitle>
                <CardDescription>
                  Opportunities for differentiation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patternsQuery.data?.contentGaps && (patternsQuery.data.contentGaps as any[]).length > 0 ? (
                  <div className="space-y-3">
                    {(patternsQuery.data.contentGaps as any[]).map((gap: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{gap.opportunity}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {selectedCompetitor === "all" 
                      ? "Select a competitor to view content gaps" 
                      : patternsQuery.data 
                        ? "No significant content gaps identified"
                        : "Analyze patterns to identify gaps"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Strategic Recommendations
                </CardTitle>
                <CardDescription>
                  AI-generated insights based on competitor posting patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patternsQuery.data?.recommendations ? (
                  <div className="space-y-3">
                    {(patternsQuery.data.recommendations as string[]).map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {selectedCompetitor === "all" 
                        ? "Select a competitor and analyze their patterns to get recommendations"
                        : "Analyze posting patterns to generate recommendations"}
                    </p>
                    {selectedCompetitor !== "all" && (
                      <Button
                        onClick={() => analyzePatternsMutation.mutate({ competitorId: parseInt(selectedCompetitor) })}
                        disabled={analyzePatternsMutation.isPending}
                      >
                        {analyzePatternsMutation.isPending ? "Analyzing..." : "Generate Insights"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimal Posting Strategy</CardTitle>
                <CardDescription>
                  Based on competitor analysis, here's when to post for maximum impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patternsQuery.data ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                        Best Day
                      </h4>
                      <p className="text-2xl font-bold">
                        {DAYS[patternsQuery.data.bestDayOfWeek || 0]}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Post on this day for highest engagement
                      </p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                        Best Time
                      </h4>
                      <p className="text-2xl font-bold">
                        {patternsQuery.data.bestHourOfDay || 0}:00
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Optimal posting hour
                      </p>
                    </div>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">
                        Frequency
                      </h4>
                      <p className="text-2xl font-bold">
                        {parseFloat(patternsQuery.data.avgPostsPerWeek || "0").toFixed(1)}/week
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Match or exceed this pace
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Analyze competitor patterns to see optimal posting strategy
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <div className="grid gap-6">
            {/* Generate Report Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Generate Report
                    </CardTitle>
                    <CardDescription>
                      Create comprehensive competitor analysis reports
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Clock className="w-4 h-4 mr-2" />
                          Schedule Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Schedule Automated Report</DialogTitle>
                          <DialogDescription>
                            Set up recurring reports to be generated automatically
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Schedule Name *</Label>
                            <Input
                              value={scheduleForm.name}
                              onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Weekly Competitor Summary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Report Type</Label>
                              <Select
                                value={selectedReportType}
                                onValueChange={setSelectedReportType}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                                  <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                                  <SelectItem value="quarterly_review">Quarterly Review</SelectItem>
                                  <SelectItem value="competitor_deep_dive">Competitor Deep Dive</SelectItem>
                                  <SelectItem value="market_overview">Market Overview</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Frequency</Label>
                              <Select
                                value={scheduleForm.frequency}
                                onValueChange={(v: any) => setScheduleForm(prev => ({ ...prev, frequency: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {scheduleForm.frequency === "weekly" && (
                            <div className="space-y-2">
                              <Label>Day of Week</Label>
                              <Select
                                value={scheduleForm.dayOfWeek.toString()}
                                onValueChange={(v) => setScheduleForm(prev => ({ ...prev, dayOfWeek: parseInt(v) }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS.map((day, i) => (
                                    <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          {(scheduleForm.frequency === "monthly" || scheduleForm.frequency === "quarterly") && (
                            <div className="space-y-2">
                              <Label>Day of Month</Label>
                              <Select
                                value={scheduleForm.dayOfMonth.toString()}
                                onValueChange={(v) => setScheduleForm(prev => ({ ...prev, dayOfMonth: parseInt(v) }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 28 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Time of Day</Label>
                            <Input
                              type="time"
                              value={scheduleForm.timeOfDay}
                              onChange={(e) => setScheduleForm(prev => ({ ...prev, timeOfDay: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Include Competitors</Label>
                            <ScrollArea className="h-32 border rounded-md p-2">
                              {competitorsQuery.data?.map((competitor) => (
                                <div key={competitor.id} className="flex items-center gap-2 py-1">
                                  <Checkbox
                                    checked={selectedCompetitorIds.includes(competitor.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCompetitorIds(prev => [...prev, competitor.id]);
                                      } else {
                                        setSelectedCompetitorIds(prev => prev.filter(id => id !== competitor.id));
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{competitor.name}</span>
                                </div>
                              ))}
                              {(!competitorsQuery.data || competitorsQuery.data.length === 0) && (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  No competitors added yet
                                </p>
                              )}
                            </ScrollArea>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={scheduleForm.emailEnabled}
                                onCheckedChange={(checked) => setScheduleForm(prev => ({ ...prev, emailEnabled: !!checked }))}
                              />
                              <Label>Email notifications</Label>
                            </div>
                            {scheduleForm.emailEnabled && (
                              <div className="flex gap-2">
                                <Input
                                  type="email"
                                  placeholder="Add email recipient"
                                  value={scheduleForm.newEmail}
                                  onChange={(e) => setScheduleForm(prev => ({ ...prev, newEmail: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && scheduleForm.newEmail) {
                                      setScheduleForm(prev => ({
                                        ...prev,
                                        emailRecipients: [...prev.emailRecipients, prev.newEmail],
                                        newEmail: "",
                                      }));
                                    }
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    if (scheduleForm.newEmail) {
                                      setScheduleForm(prev => ({
                                        ...prev,
                                        emailRecipients: [...prev.emailRecipients, prev.newEmail],
                                        newEmail: "",
                                      }));
                                    }
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            {scheduleForm.emailRecipients.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {scheduleForm.emailRecipients.map((email, i) => (
                                  <Badge key={i} variant="secondary" className="gap-1">
                                    {email}
                                    <button
                                      onClick={() => setScheduleForm(prev => ({
                                        ...prev,
                                        emailRecipients: prev.emailRecipients.filter((_, idx) => idx !== i),
                                      }))}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (!scheduleForm.name || selectedCompetitorIds.length === 0) {
                                toast.error("Please fill in all required fields");
                                return;
                              }
                              createScheduleMutation.mutate({
                                name: scheduleForm.name,
                                reportType: selectedReportType as any,
                                competitorIds: selectedCompetitorIds,
                                frequency: scheduleForm.frequency,
                                dayOfWeek: scheduleForm.dayOfWeek,
                                dayOfMonth: scheduleForm.dayOfMonth,
                                timeOfDay: scheduleForm.timeOfDay,
                                emailEnabled: scheduleForm.emailEnabled,
                                emailRecipients: scheduleForm.emailRecipients,
                              });
                            }}
                            disabled={createScheduleMutation.isPending}
                          >
                            {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Generate Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Generate Competitor Report</DialogTitle>
                          <DialogDescription>
                            Create a comprehensive analysis report
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Report Title (optional)</Label>
                            <Input
                              value={reportTitle}
                              onChange={(e) => setReportTitle(e.target.value)}
                              placeholder="Auto-generated if empty"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Report Type</Label>
                            <Select
                              value={selectedReportType}
                              onValueChange={setSelectedReportType}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                                <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                                <SelectItem value="quarterly_review">Quarterly Review</SelectItem>
                                <SelectItem value="competitor_deep_dive">Competitor Deep Dive</SelectItem>
                                <SelectItem value="market_overview">Market Overview</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Select Competitors *</Label>
                            <ScrollArea className="h-40 border rounded-md p-2">
                              {competitorsQuery.data?.map((competitor) => (
                                <div key={competitor.id} className="flex items-center gap-2 py-1">
                                  <Checkbox
                                    checked={selectedCompetitorIds.includes(competitor.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCompetitorIds(prev => [...prev, competitor.id]);
                                      } else {
                                        setSelectedCompetitorIds(prev => prev.filter(id => id !== competitor.id));
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{competitor.name}</span>
                                </div>
                              ))}
                              {(!competitorsQuery.data || competitorsQuery.data.length === 0) && (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  No competitors added yet. Add competitors in Competitor Analysis first.
                                </p>
                              )}
                            </ScrollArea>
                            {selectedCompetitorIds.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {selectedCompetitorIds.length} competitor(s) selected
                              </p>
                            )}
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-2">Report will include:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• Executive summary with AI insights</li>
                              <li>• Competitor metrics overview</li>
                              <li>• SWOT analysis</li>
                              <li>• Strategic recommendations</li>
                              <li>• Key findings and action items</li>
                            </ul>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (selectedCompetitorIds.length === 0) {
                                toast.error("Please select at least one competitor");
                                return;
                              }
                              generateReportMutation.mutate({
                                reportType: selectedReportType as any,
                                competitorIds: selectedCompetitorIds,
                                title: reportTitle || undefined,
                              });
                            }}
                            disabled={generateReportMutation.isPending}
                          >
                            {generateReportMutation.isPending ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Report
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <h4 className="font-medium">Weekly Summary</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quick overview of competitor activity
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <h4 className="font-medium">Monthly Summary</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Comprehensive monthly analysis
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <h4 className="font-medium">Deep Dive</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      In-depth competitor analysis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Scheduled Reports
                </CardTitle>
                <CardDescription>
                  Manage your automated report schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schedulesQuery.data && schedulesQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {schedulesQuery.data.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${schedule.status === 'active' ? 'bg-green-500/10' : 'bg-muted'}`}>
                            {schedule.status === 'active' ? (
                              <Play className="w-4 h-4 text-green-500" />
                            ) : (
                              <Pause className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{schedule.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {schedule.frequency} • {schedule.reportType?.replace(/_/g, ' ')}
                            </p>
                            {schedule.nextRunAt && (
                              <p className="text-xs text-muted-foreground">
                                Next run: {new Date(schedule.nextRunAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                            {schedule.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateScheduleMutation.mutate({
                                scheduleId: schedule.id,
                                status: schedule.status === 'active' ? 'paused' : 'active',
                              });
                            }}
                          >
                            {schedule.status === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteScheduleMutation.mutate({ scheduleId: schedule.id })}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      No scheduled reports yet
                    </p>
                    <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Schedule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generated Reports
                </CardTitle>
                <CardDescription>
                  View and download your competitor analysis reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsQuery.data && reportsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {reportsQuery.data.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            report.status === 'completed' ? 'bg-green-500/10' :
                            report.status === 'generating' ? 'bg-blue-500/10' : 'bg-red-500/10'
                          }`}>
                            {report.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : report.status === 'generating' ? (
                              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{report.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {report.reportType?.replace(/_/g, ' ')} • {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : 'Pending'}
                            </p>
                            {report.isScheduled && (
                              <Badge variant="outline" className="text-xs mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // Build markdown from report data
                                  let markdown = `# ${report.title}\n\n`;
                                  markdown += `**Generated:** ${report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}\n`;
                                  markdown += `**Report Type:** ${report.reportType?.replace(/_/g, ' ')}\n\n`;
                                  markdown += `---\n\n`;
                                  
                                  if (report.executiveSummary) {
                                    markdown += `## Executive Summary\n\n${report.executiveSummary}\n\n`;
                                  }
                                  
                                  if (report.keyFindings && (report.keyFindings as string[]).length > 0) {
                                    markdown += `## Key Findings\n\n`;
                                    (report.keyFindings as string[]).forEach((finding, i) => {
                                      markdown += `${i + 1}. ${finding}\n`;
                                    });
                                    markdown += `\n`;
                                  }
                                  
                                  if (report.swotAnalysis) {
                                    const swot = report.swotAnalysis as { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
                                    markdown += `## SWOT Analysis\n\n`;
                                    markdown += `### Strengths\n${swot.strengths?.map(s => `- ${s}`).join('\n') || 'None identified'}\n\n`;
                                    markdown += `### Weaknesses\n${swot.weaknesses?.map(w => `- ${w}`).join('\n') || 'None identified'}\n\n`;
                                    markdown += `### Opportunities\n${swot.opportunities?.map(o => `- ${o}`).join('\n') || 'None identified'}\n\n`;
                                    markdown += `### Threats\n${swot.threats?.map(t => `- ${t}`).join('\n') || 'None identified'}\n\n`;
                                  }
                                  
                                  if (report.recommendations && (report.recommendations as string[]).length > 0) {
                                    markdown += `## Strategic Recommendations\n\n`;
                                    (report.recommendations as string[]).forEach((rec, i) => {
                                      markdown += `${i + 1}. ${rec}\n`;
                                    });
                                    markdown += `\n`;
                                  }
                                  
                                  markdown += `---\n\n*Report generated by YouTube Playlist Analyzer*\n`;
                                  
                                  const blob = new Blob([markdown], { type: 'text/markdown' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${report.title?.replace(/[^a-z0-9]/gi, '_') || 'report'}.md`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  toast.success('Report downloaded');
                                } catch (error) {
                                  toast.error('Failed to download report');
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReportMutation.mutate({ reportId: report.id })}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      No reports generated yet
                    </p>
                    <Button onClick={() => setShowReportDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Your First Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
