import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, MoreHorizontal, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Opportunity = {
  id: string;
  title: string;
  source: string;
  sourceType: string;
  intentScore: number;
  status: string;
  potentialRevenue: string;
  productTypes: string[];
  createdAt: string;
  priority: string;
};

const opportunities: Opportunity[] = [
  {
    id: "OP-1234",
    title: "Gaming Quotes Collection",
    source: "GameTheory",
    sourceType: "comment",
    intentScore: 92,
    status: "Validated",
    potentialRevenue: "$1,240",
    productTypes: ["T-Shirt", "Hoodie"],
    createdAt: "2 days ago",
    priority: "High",
  },
  {
    id: "OP-1235",
    title: "Tech Humor Series",
    source: "MKBHD",
    sourceType: "comment",
    intentScore: 88,
    status: "Designed",
    potentialRevenue: "$980",
    productTypes: ["T-Shirt", "Mug"],
    createdAt: "3 days ago",
    priority: "Medium",
  },
  {
    id: "OP-1236",
    title: "DIY Enthusiast Collection",
    source: "DIY Creators",
    sourceType: "comment",
    intentScore: 85,
    status: "Identified",
    potentialRevenue: "$760",
    productTypes: ["T-Shirt", "Poster"],
    createdAt: "4 days ago",
    priority: "Medium",
  },
  {
    id: "OP-1237",
    title: "Cat Lovers Bundle",
    source: "Funny Cat Compilation",
    sourceType: "comment",
    intentScore: 82,
    status: "Published",
    potentialRevenue: "$1,120",
    productTypes: ["T-Shirt", "Mug", "Poster"],
    createdAt: "1 week ago",
    priority: "High",
  },
  {
    id: "OP-1238",
    title: "Fitness Motivation Series",
    source: "FitLife",
    sourceType: "video",
    intentScore: 79,
    status: "Validated",
    potentialRevenue: "$840",
    productTypes: ["T-Shirt", "Tank Top"],
    createdAt: "1 week ago",
    priority: "Medium",
  },
];

function getStatusVariant(status: string): "outline" | "secondary" | "default" {
  if (status === "Identified") return "outline";
  if (status === "Validated") return "secondary";
  return "default";
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{opportunity.title}</span>
              <Badge variant={getStatusVariant(opportunity.status)}>{opportunity.status}</Badge>
              {opportunity.priority === "High" && (
                <Badge variant="destructive" className="text-xs">High</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              From {opportunity.source} · {opportunity.sourceType} · {opportunity.intentScore}% intent
            </p>
            <div className="flex gap-2 flex-wrap text-xs">
              {opportunity.productTypes.map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5">{t}</span>
              ))}
            </div>
            <p className="text-sm font-medium text-green-600">{opportunity.potentialRevenue} potential</p>
            <p className="text-xs text-muted-foreground">{opportunity.createdAt}</p>
          </div>
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
              <DropdownMenuItem>Move to design</DropdownMenuItem>
              <DropdownMenuItem>View source</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PODOpportunities() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">POD Opportunities</h1>
          <p className="text-muted-foreground">Manage and track your print-on-demand opportunities</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities..." className="pl-8" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
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
          <div className="text-sm text-muted-foreground">Showing {opportunities.length} opportunities</div>
        </div>

        <TabsContent value="all" className="mt-4 space-y-4">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
          <div className="flex justify-center mt-6">
            <Button variant="outline">Load More</Button>
          </div>
        </TabsContent>

        <TabsContent value="identified" className="mt-4">
          <div className="text-center py-8 text-muted-foreground">Showing opportunities with &quot;Identified&quot; status</div>
        </TabsContent>
        <TabsContent value="validated" className="mt-4">
          <div className="text-center py-8 text-muted-foreground">Showing opportunities with &quot;Validated&quot; status</div>
        </TabsContent>
        <TabsContent value="designed" className="mt-4">
          <div className="text-center py-8 text-muted-foreground">Showing opportunities with &quot;Designed&quot; status</div>
        </TabsContent>
        <TabsContent value="published" className="mt-4">
          <div className="text-center py-8 text-muted-foreground">Showing opportunities with &quot;Published&quot; status</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
