import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, MoreHorizontal, Zap, Loader2, Wand2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

type Opportunity = {
  id: string;
  insightId: number;
  title: string;
  source: string;
  sourceType: string;
  intentScore: number;
  status: string;
  potentialRevenue: string;
  productTypes: string[];
  createdAt: string;
  priority: string;
  rawComment: string;
};

function getStatusVariant(status: string): "outline" | "secondary" | "default" {
  if (status === "Identified") return "outline";
  if (status === "Validated") return "secondary";
  return "default";
}

function OpportunityCard({
  opportunity,
  onGenerateDesign,
}: {
  opportunity: Opportunity;
  onGenerateDesign: (signal: string) => void;
}) {
  const createdLabel = formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{opportunity.title}</span>
              <Badge variant={getStatusVariant(opportunity.status)}>{opportunity.status}</Badge>
              {opportunity.priority === "High" && (
                <Badge variant="destructive" className="text-xs">
                  High
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              From {opportunity.source} · {opportunity.sourceType} · {opportunity.intentScore}% intent
            </p>
            <div className="flex gap-2 flex-wrap text-xs">
              {opportunity.productTypes.map(t => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5">
                  {t}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-green-600">{opportunity.potentialRevenue} potential</p>
            <p className="text-xs text-muted-foreground">{createdLabel}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" className="gap-1" onClick={() => onGenerateDesign(opportunity.rawComment)}>
              <Wand2 className="h-3.5 w-3.5" />
              Generate design
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Validate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateDesign(opportunity.rawComment)}>
                  Move to design
                </DropdownMenuItem>
                <DropdownMenuItem>View source</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PODOpportunities() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: opportunities = [], isLoading, refetch } = trpc.pod.listOpportunities.useQuery({});

  const filtered = useMemo(() => {
    let list = opportunities;
    if (filter !== "all") {
      const statusMap: Record<string, string> = {
        identified: "Identified",
        validated: "Validated",
        designed: "Designed",
        published: "Published",
      };
      const target = statusMap[filter];
      if (target) list = list.filter(o => o.status === target);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        o =>
          o.title.toLowerCase().includes(q) ||
          o.source.toLowerCase().includes(q) ||
          o.rawComment.toLowerCase().includes(q)
      );
    }
    return list;
  }, [opportunities, filter, search]);

  const goToMockup = (signal: string) => {
    const params = new URLSearchParams({ signal });
    setLocation(`/mockup-generator?${params.toString()}`);
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No opportunities yet. Run comment analysis from Intelligence, then refresh.
          <div className="mt-4">
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      );
    }
    return filtered.map(opp => (
      <OpportunityCard key={opp.id} opportunity={opp} onGenerateDesign={goToMockup} />
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">POD Opportunities</h1>
          <p className="text-muted-foreground">Buyer-intent signals from analyzed YouTube comments</p>
        </div>
        <Button className="gap-2" onClick={() => setLocation("/intelligence")}>
          <Plus className="h-4 w-4" />
          Analyze Comments
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()}>
          <Filter className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="identified">Identified</TabsTrigger>
            <TabsTrigger value="validated">Validated</TabsTrigger>
            <TabsTrigger value="designed">Designed</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Zap className="h-3.5 w-3.5" />
            Showing {filtered.length} opportunities
          </div>
        </div>

        <TabsContent value="all" className="mt-4 space-y-4">
          {renderList()}
        </TabsContent>
        <TabsContent value="identified" className="mt-4 space-y-4">
          {renderList()}
        </TabsContent>
        <TabsContent value="validated" className="mt-4 space-y-4">
          {renderList()}
        </TabsContent>
        <TabsContent value="designed" className="mt-4 space-y-4">
          {renderList()}
        </TabsContent>
        <TabsContent value="published" className="mt-4 space-y-4">
          {renderList()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
