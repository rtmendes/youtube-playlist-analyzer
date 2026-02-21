import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Users, MessageSquare, BarChart3, ListMusic } from "lucide-react";

export default function YouTubeDataPOD() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">YouTube Data</h1>
        <p className="text-muted-foreground">Videos, playlists, and comment data for POD research</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos
            </CardTitle>
            <CardDescription>Browse and analyze videos for comment-driven opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/videos">
              <Button variant="outline">View all videos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Channels
            </CardTitle>
            <CardDescription>Channels you track or have analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/channels">
              <Button variant="outline">View all channels</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </CardTitle>
            <CardDescription>Comment intelligence and saved comments</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/comments">
              <Button variant="outline">View comments</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              Playlists
            </CardTitle>
            <CardDescription>Saved playlists and analysis history</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/playlists">
              <Button variant="outline">View playlists</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Intelligence
          </CardTitle>
          <CardDescription>AI-powered comment analysis and buyer intent</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/intelligence">
            <Button>Open YouTube Intelligence</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
