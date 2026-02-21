import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, CheckCircle2, PlayCircle, Youtube, Database, BarChart3 } from "lucide-react";

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
    stage: "channels",
    completed: 0,
    total: 100,
    quotaUsed: 0,
  });

  const startSync = () => {
    setSyncInProgress(true);
    setSyncProgress({ stage: "channels", completed: 0, total: 100, quotaUsed: 0 });
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      let stage = "channels";
      if (progress > 25) stage = "playlists";
      if (progress > 50) stage = "videos";
      if (progress > 75) stage = "comments";
      setSyncProgress({
        stage,
        completed: progress,
        total: 100,
        quotaUsed: Math.floor(progress * 73),
      });
      if (progress >= 100) {
        clearInterval(interval);
        setSyncInProgress(false);
      }
    }, 500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Synchronization</h1>
          <p className="text-muted-foreground">Manage YouTube data collection and synchronization</p>
        </div>
        <Button onClick={startSync} disabled={syncInProgress} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Start Sync Now
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
          <CardDescription>Current synchronization progress and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {syncInProgress ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synchronizing {syncProgress.stage}</span>
                </div>
                <span>{syncProgress.completed}% complete</span>
              </div>
              <Progress value={syncProgress.completed} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <SyncStageCard
                  title="Channels"
                  icon={<Youtube className="h-5 w-5" />}
                  status={
                    syncProgress.stage === "channels"
                      ? "in-progress"
                      : syncProgress.completed > 25
                        ? "completed"
                        : "pending"
                  }
                />
                <SyncStageCard
                  title="Playlists"
                  icon={<PlayCircle className="h-5 w-5" />}
                  status={
                    syncProgress.stage === "playlists"
                      ? "in-progress"
                      : syncProgress.completed > 50
                        ? "completed"
                        : "pending"
                  }
                />
                <SyncStageCard
                  title="Videos"
                  icon={<BarChart3 className="h-5 w-5" />}
                  status={
                    syncProgress.stage === "videos"
                      ? "in-progress"
                      : syncProgress.completed > 75
                        ? "completed"
                        : "pending"
                  }
                />
                <SyncStageCard
                  title="Comments"
                  icon={<Database className="h-5 w-5" />}
                  status={syncProgress.completed > 75 ? "completed" : syncProgress.stage === "comments" ? "in-progress" : "pending"}
                />
              </div>
              <p className="text-sm text-muted-foreground">Quota used this run: ~{syncProgress.quotaUsed} units</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Click &quot;Start Sync Now&quot; to sync channels, playlists, videos, and comments.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>Configure how and when data is synced</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-sync">Auto-sync enabled</Label>
            <Switch id="auto-sync" />
          </div>
          <div className="space-y-2">
            <Label>Sync frequency (minutes)</Label>
            <Slider defaultValue={[60]} max={1440} step={15} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
