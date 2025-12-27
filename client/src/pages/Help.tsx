import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Target,
  Brain,
  Palette,
  Folder,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Youtube,
  Search,
  MessageSquare,
  Download,
  Sparkles,
  Users,
  FileText,
  Tag,
  Mic,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const helpContent: Record<string, {
  title: string;
  description: string;
  icon: any;
  sections: {
    title: string;
    content: string;
    tips?: string[];
  }[];
}> = {
  "getting-started": {
    title: "Getting Started",
    description: "Learn the basics of YouTube Playlist Analyzer and start extracting insights from your favorite content.",
    icon: Zap,
    sections: [
      {
        title: "What is YouTube Playlist Analyzer?",
        content: "YouTube Playlist Analyzer is a powerful tool that helps you extract, analyze, and leverage insights from YouTube content. Whether you're a marketer, content creator, or researcher, this tool helps you understand your audience through their comments and engagement patterns.",
        tips: [
          "Perfect for market research and audience analysis",
          "Extract testimonials and user stories for marketing",
          "Identify product opportunities from viewer requests",
          "Generate marketing content using AI-powered tools",
        ],
      },
      {
        title: "Getting Your YouTube API Key",
        content: "To use this app, you'll need a YouTube Data API v3 key from Google Cloud Console. This is free and gives you 10,000 quota units per day.",
        tips: [
          "Go to console.cloud.google.com",
          "Create a new project or select existing one",
          "Enable 'YouTube Data API v3' in the API Library",
          "Create credentials → API Key",
          "Use the 'Remember' checkbox to save your key locally",
        ],
      },
      {
        title: "Your First Analysis",
        content: "Start by entering a YouTube playlist URL on the home page. The app will fetch all videos in the playlist along with their metadata (views, likes, duration) and the top 100 comments from each video.",
        tips: [
          "You can enter multiple URLs at once (one per line)",
          "Supports playlists, individual videos, and channel URLs",
          "Use the Video Limit dropdown to control how many videos to fetch from channels",
        ],
      },
    ],
  },
  "analyze": {
    title: "Analyze Playlists & Videos",
    description: "Learn how to analyze YouTube playlists, videos, and channels to extract valuable data.",
    icon: Target,
    sections: [
      {
        title: "Supported URL Types",
        content: "The analyzer supports multiple YouTube URL formats to give you flexibility in what content you analyze.",
        tips: [
          "Playlist URLs: youtube.com/playlist?list=PLxxxxx",
          "Video URLs: youtube.com/watch?v=xxxxx",
          "Channel handles: youtube.com/@ChannelName",
          "Channel IDs: youtube.com/channel/UCxxxxx",
        ],
      },
      {
        title: "Bulk Analysis",
        content: "Enter multiple URLs at once to analyze several playlists, videos, or channels in a single batch. Each URL should be on its own line.",
        tips: [
          "Mix and match URL types in the same batch",
          "Progress tracking shows which item is being processed",
          "Errors for individual URLs won't stop the entire batch",
        ],
      },
      {
        title: "Video Metadata",
        content: "For each video, we extract comprehensive metadata including title, channel, publish date, view count, like count, comment count, duration, and thumbnail URL.",
        tips: [
          "Sort videos by any metric to find top performers",
          "Filter by date range to analyze specific time periods",
          "Export video data to CSV or Google Sheets",
        ],
      },
      {
        title: "Comment Extraction",
        content: "We fetch the top 100 comments for each video, including author name, comment text, like count, reply count, and publish date.",
        tips: [
          "Comments are sorted by relevance (YouTube's default)",
          "Reply threads are included with parent comment references",
          "Use the Intelligence page for deeper comment analysis",
        ],
      },
    ],
  },
  "intelligence": {
    title: "Comment Intelligence",
    description: "Discover how to use AI-powered analysis to extract marketing insights from comments.",
    icon: Brain,
    sections: [
      {
        title: "Smart Category Detection",
        content: "Comments are automatically categorized into marketing-relevant categories using pattern detection.",
        tips: [
          "Personal Stories - Great for testimonials and case studies",
          "Testimonials - Direct endorsements and recommendations",
          "Product Requests - 'I want this' or 'Someone should make...'",
          "Pain Points - Problems and frustrations to address",
          "Humor - Viral potential and engagement drivers",
          "Questions - FAQ content and educational opportunities",
        ],
      },
      {
        title: "Search & Filter",
        content: "Use the powerful search and filter tools to find exactly the comments you need for your marketing campaigns.",
        tips: [
          "Search by keyword across all comment text",
          "Filter by category to find specific comment types",
          "Sort by likes to find most-engaged comments",
          "Filter by video to focus on specific content",
        ],
      },
      {
        title: "Marketing Potential Score",
        content: "Each comment receives a marketing potential score based on engagement, category, and content quality.",
        tips: [
          "Higher scores indicate better marketing material",
          "Personal stories with high likes are gold for testimonials",
          "Product requests reveal market opportunities",
        ],
      },
    ],
  },
  "canvas": {
    title: "Marketing Canvas",
    description: "Learn how to use the AI-powered canvas to generate marketing assets from comment insights.",
    icon: Palette,
    sections: [
      {
        title: "What is the Marketing Canvas?",
        content: "The Marketing Canvas is an AI-powered workspace where you can transform comment insights into ready-to-use marketing content.",
        tips: [
          "Generate advertorials from personal stories",
          "Create video sales letter (VSL) scripts",
          "Build UGC video scenarios",
          "Develop ebook outlines and course structures",
        ],
      },
      {
        title: "Asset Types",
        content: "Generate various types of marketing assets based on your selected comments and insights.",
        tips: [
          "Advertorials - Long-form story-driven ads",
          "VSL Scripts - Video sales letter frameworks",
          "UGC Scenarios - User-generated content briefs",
          "Ebook Outlines - Chapter structures from pain points",
          "Course Structures - Educational content frameworks",
          "Ad Copy - Short-form advertising text",
          "Sales Pages - Landing page copy",
          "Email Sequences - Nurture campaign content",
        ],
      },
      {
        title: "Using Google Gemini",
        content: "The canvas uses Google Gemini AI to generate content. You'll need a Gemini API key for AI-powered generation.",
        tips: [
          "Get your key at ai.google.dev",
          "Free tier includes generous usage limits",
          "Custom prompts let you guide the AI output",
        ],
      },
    ],
  },
  "projects": {
    title: "Projects & Folders",
    description: "Organize your analyses and marketing assets with projects, folders, and tags.",
    icon: Folder,
    sections: [
      {
        title: "Creating Projects",
        content: "Projects help you organize related analyses and generated content. Create projects from the Intelligence or Canvas pages.",
        tips: [
          "Group analyses by client, campaign, or topic",
          "Add descriptions to remember project context",
          "Tag projects for easy filtering",
        ],
      },
      {
        title: "Folder Organization",
        content: "Use folders to create a hierarchical structure for your projects, similar to Notion or file explorers.",
        tips: [
          "Create nested subfolders for complex organizations",
          "Drag and drop to reorganize folders",
          "Color-code folders for visual organization",
          "Right-click for folder actions (rename, delete, move)",
        ],
      },
      {
        title: "Tagging System",
        content: "Tags provide a flexible way to categorize and find your content across projects and folders.",
        tips: [
          "Click any tag to filter content instantly",
          "Create custom tags for your workflow",
          "Tags work across videos, comments, and projects",
          "Use tags for status tracking (draft, review, published)",
        ],
      },
    ],
  },
  "export": {
    title: "Export & Reports",
    description: "Learn about the various export options and how to create reports from your data.",
    icon: TrendingUp,
    sections: [
      {
        title: "Export Formats",
        content: "Export your data in multiple formats to suit your workflow and tools.",
        tips: [
          "CSV - Universal spreadsheet format",
          "JSON - For developers and data processing",
          "Google Sheets - Direct import to Google Sheets",
        ],
      },
      {
        title: "Export Templates",
        content: "Use preset templates or create custom templates to export exactly the columns you need.",
        tips: [
          "Full Data - All available fields",
          "Metrics Only - Views, likes, comments for analysis",
          "Marketing Insights - AI categories and sentiment",
          "Save custom templates for repeated use",
        ],
      },
      {
        title: "Column Selection",
        content: "Customize which columns to include in your export for cleaner, more focused data.",
        tips: [
          "Select/deselect individual columns",
          "Group columns by category (basic, metrics, content)",
          "Preview data before exporting",
        ],
      },
    ],
  },
  "tips": {
    title: "Tips & Best Practices",
    description: "Pro tips to get the most out of YouTube Playlist Analyzer.",
    icon: Lightbulb,
    sections: [
      {
        title: "API Quota Management",
        content: "YouTube API has daily quota limits. Here's how to use them efficiently.",
        tips: [
          "Each playlist fetch uses ~3 quota units per 50 videos",
          "Comment fetching uses ~2 units per 100 comments",
          "Batch your analyses to minimize repeated fetches",
          "Save analyses to avoid re-fetching the same data",
        ],
      },
      {
        title: "Finding Gold in Comments",
        content: "The best marketing insights often come from specific comment patterns.",
        tips: [
          "Look for 'I wish...' or 'I need...' for product ideas",
          "Personal stories with high likes make great testimonials",
          "Questions reveal content gaps to fill",
          "Humor and memes show what resonates with the audience",
        ],
      },
      {
        title: "Workflow Recommendations",
        content: "Optimize your workflow for maximum efficiency.",
        tips: [
          "Start with competitor analysis to understand the market",
          "Create folders by campaign or client",
          "Use the Intelligence page before Canvas for better context",
          "Save your API key with 'Remember' to avoid re-entry",
          "Export regularly to backup your insights",
        ],
      },
      {
        title: "Voice Notes",
        content: "Use voice recording to capture insights as you browse comments.",
        tips: [
          "Record observations while reviewing comments",
          "Speech is automatically transcribed",
          "Edit transcripts before saving",
          "Attach voice notes to specific projects",
        ],
      },
    ],
  },
};

export default function Help() {
  const [, params] = useRoute("/help/:topic");
  const topic = params?.topic || "getting-started";
  const content = helpContent[topic];

  if (!content) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Topic Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The help topic you're looking for doesn't exist.
            </p>
            <Link href="/help/getting-started">
              <Button>Go to Getting Started</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = content.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{content.title}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{content.description}</p>
      </div>

      {/* Quick Navigation */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">On This Page</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {content.sections.map((section, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  document.getElementById(`section-${index}`)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {section.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Sections */}
      <div className="space-y-8">
        {content.sections.map((section, index) => (
          <Card key={index} id={`section-${index}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {index + 1}
                </span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {section.content}
              </p>
              {section.tips && section.tips.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Key Points
                  </h4>
                  <ul className="space-y-2">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Need more help? Check out other topics in the Knowledge Base.
          </div>
          <div className="flex gap-2">
            {Object.entries(helpContent)
              .filter(([key]) => key !== topic)
              .slice(0, 3)
              .map(([key, value]) => (
                <Link key={key} href={`/help/${key}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    {value.title}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
