import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ListMusic, Lightbulb, MessageSquare, ArrowUpRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

function StatCard({
  title,
  value,
  change,
  icon,
  description,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="rounded-full p-2 bg-primary/10 text-primary">{icon}</div>
        </div>
        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" />
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

export default function PODDashboard() {
  const [tab, setTab] = useState("analytics");
  const stats = trpc.dashboard.getStats.useQuery();
  const opportunities = trpc.pod.listOpportunities.useQuery({ limit: 5 });

  const channelsTracked = stats.data?.channelsTracked ?? 0;
  const projectsSaved = stats.data?.projectsSaved ?? 0;
  const videosAnalyzed = stats.data?.videosAnalyzed ?? 0;
  const commentsCollected = stats.data?.commentsCollected ?? 0;
  const oppCount = opportunities.data?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">POD Dashboard</h1>
          <p className="text-muted-foreground">Overview of your YouTube POD analytics and opportunities</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
          {stats.isLoading ? "Loading…" : "Connected"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Channels Tracked"
          value={stats.isLoading ? "…" : String(channelsTracked)}
          change="From your data"
          icon={<Users className="h-4 w-4" />}
          description="Channels in library"
        />
        <StatCard
          title="Projects Saved"
          value={stats.isLoading ? "…" : String(projectsSaved)}
          change="Saved & analyzed"
          icon={<ListMusic className="h-4 w-4" />}
          description="Saved projects"
        />
        <StatCard
          title="POD Opportunities"
          value={opportunities.isLoading ? "…" : String(oppCount)}
          change="High-intent comments"
          icon={<Lightbulb className="h-4 w-4" />}
          description="From comment insights"
        />
        <StatCard
          title="Comments"
          value={stats.isLoading ? "…" : String(commentsCollected)}
          change="Analyzed"
          icon={<MessageSquare className="h-4 w-4" />}
          description="Comments collected"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics overview</CardTitle>
              <CardDescription>
                {videosAnalyzed} videos analyzed · {commentsCollected} comments collected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Run analyses from <Link href="/" className="text-primary underline">Home</Link> and view results in
                Intelligence, Comments, and POD Opportunities.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="opportunities" className="mt-4 space-y-3">
          {opportunities.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {(opportunities.data ?? []).slice(0, 5).map(o => (
                <Card key={o.id}>
                  <CardContent className="p-3 text-sm">
                    <span className="font-medium">{o.title}</span>
                    <span className="text-muted-foreground"> · {o.intentScore}% intent</span>
                  </CardContent>
                </Card>
              ))}
              <Link href="/pod-opportunities">
                <span className="text-primary font-medium underline">Open all POD Opportunities →</span>
              </Link>
            </>
          )}
        </TabsContent>
        <TabsContent value="marketplace" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace</CardTitle>
              <CardDescription>POD marketplace performance and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/marketplace">
                <span className="text-primary font-medium underline">Open Marketplace →</span>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
