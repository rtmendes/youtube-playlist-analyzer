import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Users, ListMusic, MessageSquare, RefreshCw } from "lucide-react";

export default function YouTubeChannelPOD() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">YouTube Channel</h1>
        <p className="text-muted-foreground">Your channel and subscription overview for POD research</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-red-100 dark:bg-red-900/30 text-red-600">
              <Youtube className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">My Channel</p>
              <p className="text-lg font-semibold">Connect to view</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-muted">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subscriptions</p>
              <p className="text-lg font-semibold">—</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-muted">
              <ListMusic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Playlists</p>
              <p className="text-lg font-semibold">—</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full p-2 bg-muted">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comments synced</p>
              <p className="text-lg font-semibold">—</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Use these to analyze channels and playlists for POD opportunities</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/channels">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              All Channels
            </Button>
          </Link>
          <Link href="/">
            <Button className="gap-2">
              <RefreshCw className="h-4 w-4" />
              New Analysis
            </Button>
          </Link>
          <Link href="/data-sync">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Data Sync
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
