import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemArchitecture() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Architecture</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Flow Diagram</CardTitle>
          <CardDescription>Overview of the YouTube POD Analytics platform architecture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <pre className="text-xs font-mono bg-muted p-4 rounded-md whitespace-pre min-w-[600px]">
{`graph TD
  A["YouTube API"] -->|Fetch Data| B["Quota Manager"]
  B -->|Optimized Requests| C["Sync Service"]
  C -->|Store Data| D["Supabase Database"]
  C -->|Analyze Comments| E["Buyer Intent Detector"]
  E -->|AI Analysis| F["OpenAI / AI SDK"]
  E -->|Store Results| D
  D -->|Fetch Data| G["App Server"]
  G -->|tRPC / API| H["UI Components"]
  H -->|User Interaction| I["Design Generation"]
  I -->|Create Designs| J["Canva Integration"]
  H -->|User Interaction| K["POD Opportunities"]
  K -->|Validate| L["Marketplace Intelligence"]

  subgraph "Data Collection"
    A
    B
    C
  end

  subgraph "AI Analysis"
    E
    F
  end

  subgraph "Storage"
    D
  end

  subgraph "User Interface"
    G
    H
  end

  subgraph "POD Tools"
    I
    J
    K
    L
  end`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Components</CardTitle>
            <CardDescription>Main building blocks of the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">YouTube API Client</h3>
              <p className="text-sm text-muted-foreground">
                Handles all interactions with the YouTube API, including fetching channels, playlists, videos, and comments. Implements optimized batching and pagination to minimize API calls.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Quota Manager</h3>
              <p className="text-sm text-muted-foreground">
                Tracks and manages YouTube API quota usage to prevent exceeding limits. Implements quota reservation for critical operations and automatic reset at midnight Pacific Time.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Buyer Intent Detector</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered system that analyzes YouTube comments for purchase intent related to POD products. Uses a combination of rule-based filtering and AI analysis to identify high-potential opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Sync Service</h3>
              <p className="text-sm text-muted-foreground">
                Orchestrates the synchronization of YouTube data with optimized quota usage. Implements prioritization and batching for channels, playlists, videos, and comments.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stack</CardTitle>
            <CardDescription>Technologies used in this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Frontend:</strong> React, Vite, wouter, tRPC, TanStack Query, Tailwind, shadcn/ui</p>
            <p><strong>Backend:</strong> Node, Express, tRPC, Drizzle ORM</p>
            <p><strong>Database:</strong> PostgreSQL (Supabase)</p>
            <p><strong>Auth:</strong> Optional OAuth / Supabase Auth</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
