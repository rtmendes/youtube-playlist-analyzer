import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Folder,
  Youtube,
  ShoppingCart,
  MessageCircle,
  Music,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

const SOURCE_ICONS = {
  youtube: Youtube,
  amazon: ShoppingCart,
  reddit: MessageCircle,
  tiktok: Music,
};

const SOURCE_COLORS = {
  youtube: "text-red-500",
  amazon: "text-orange-500",
  reddit: "text-orange-600",
  tiktok: "text-pink-500",
};

export default function SharedCollection() {
  const { shareToken } = useParams<{ shareToken: string }>();

  const { data, isLoading, error } = trpc.collections.getPublicCollection.useQuery(
    { shareToken: shareToken || "" },
    { enabled: !!shareToken }
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Collection Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This collection may have been deleted, made private, or the link is invalid.
        </p>
      </div>
    );
  }

  const { collection, comments } = data;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-6 py-4">
        <Breadcrumb
          items={[
            { label: "Shared Collection", href: "#" },
            { label: collection.name },
          ]}
        />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Collection Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: (collection.color || "#6366f1") + "20" }}
                >
                  <Folder className="h-6 w-6" style={{ color: collection.color || "#6366f1" }} />
                </div>
                <div>
                  <CardTitle className="text-2xl">{collection.name}</CardTitle>
                  {collection.description && (
                    <CardDescription className="mt-1">
                      {collection.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{collection.commentCount} comments</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Shared Collection
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const SourceIcon = SOURCE_ICONS[comment.sourceType as keyof typeof SOURCE_ICONS] || MessageCircle;
                    const sourceColor = SOURCE_COLORS[comment.sourceType as keyof typeof SOURCE_COLORS] || "text-gray-500";

                    return (
                      <div
                        key={comment.id}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <SourceIcon className={`h-4 w-4 ${sourceColor}`} />
                            <span className="font-medium text-sm">
                              {comment.authorName || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(comment.savedAt as unknown as string)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {comments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No comments in this collection yet.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
