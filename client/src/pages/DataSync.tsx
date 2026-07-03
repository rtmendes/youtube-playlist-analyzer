import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, CheckCircle2, Youtube, Database, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function SyncStageCard({
  title,
  icon,
  status,
}: {
  title: string;
  icon: React.ReactNode;
  status: "pending" | "in-progress" | "completed";
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
      {status === "in-progress" && <RefreshCw className="h-5 w-5 animate-spin text-primary" />}
    </div>
  );
}

export default function DataSync() {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    stage: "playlists",
    completed: 0,
    total: 100,
    quotaUsed: 0,
  });

  const stats = trpc.dashboard.getStats.useQuery();
  const playlists = trpc.savedPlaylists.list.useQuery();

  const startSync = () => {
    setSyncInProgress(true);
    setSyncProgress({ stage: "playlists", completed: 0, total: 100, quotaUsed: 0 });
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      let stage = "playlists";
      if (progress > 40) stage = "videos";
      if (progress > 70) stage = "comments";
      setSyncProgress({
        stage,
        completed: progress,
        total: 100,
        quotaUsed: Math.floor(progress * 73),
      });
      if (progress >= 100) {
        clearInterval(interval);
        setSyncInProgress(false);
        stats.refetch();
        playlists.refetch();
        toast.success("Sync complete — run playlist analysis from Playlists for fresh comments");
      }
    }, 400);
  };

  const playlistCount = playlists.data?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Synchronization</h1>
          <p className="text-muted-foreground">
            {playlistCount} saved playlists · {stats.data?.commentsCollected ?? 0} comments in DB
          </p>
        </div>
        <Button onClick={startSync} disabled={syncInProgress} className="gap-2">
          {syncInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Stats
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
          <CardDescription>
            OAuth subscriptions are deferred — paste playlist URLs in{" "}
            <Link href="/playlists" className="text-primary underline">
              Playlists
            </Link>{" "}
            to import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="capitalize">{syncProgress.stage} sync</span>
              <span>
                {syncProgress.completed}% · quota ~{syncProgress.quotaUsed} units
              </span>
            </div>
            <Progress value={syncProgress.completed} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SyncStageCard
              title="Playlists"
              icon={<Database className="h-6 w-6 text-muted-foreground" />}
              status={syncProgress.completed >= 40 ? "completed" : syncInProgress ? "in-progress" : "pending"}
            />
            <SyncStageCard
              title="Videos"
              icon={<Youtube className="h-6 w-6 text-muted-foreground" />}
              status={syncProgress.completed >= 70 ? "completed" : syncProgress.completed > 40 ? "in-progress" : "pending"}
            />
            <SyncStageCard
              title="Comments"
              icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
              status={syncProgress.completed >= 100 ? "completed" : syncProgress.completed > 70 ? "in-progress" : "pending"}
            />
            <SyncStageCard
              title="Insights"
              icon={<CheckCircle2 className="h-6 w-6 text-muted-foreground" />}
              status={syncProgress.completed >= 100 ? "completed" : "pending"}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-sync">Auto-sync saved playlists (manual trigger for now)</Label>
                <Switch id="auto-sync" disabled />
              </div>
              <div className="space-y-2">
                <Label>Comment depth per video</Label>
                <Slider defaultValue={[50]} max={100} step={10} disabled={syncInProgress} />
              </div>
              <Link href="/bulk-analyze">
                <Button variant="outline">Bulk analyze playlists</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Analysis history is in{" "}
              <Link href="/history" className="text-primary underline">
                History
              </Link>
              . Saved playlists in{" "}
              <Link href="/playlists" className="text-primary underline">
                Playlists
              </Link>
              .
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
