import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, Bookmark } from "lucide-react";

export default function CommentAnalysisPOD() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comment Analysis</h1>
        <p className="text-muted-foreground">Analyze YouTube comments for POD opportunities and buyer intent</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              All Comments
            </CardTitle>
            <CardDescription>Browse and filter comments from analyzed videos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/comments">
              <Button variant="outline" className="w-full">Open Comments</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              YouTube Intelligence
            </CardTitle>
            <CardDescription>AI categorization and buyer intent detection</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/intelligence">
              <Button variant="outline" className="w-full">Open Intelligence</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Comments
            </CardTitle>
            <CardDescription>Comments you saved for POD ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/saved-comments">
              <Button variant="outline" className="w-full">Open Saved Comments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
