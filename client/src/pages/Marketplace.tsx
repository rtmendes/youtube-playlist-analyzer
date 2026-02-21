import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShoppingBag, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, Settings } from "lucide-react";

export default function Marketplace() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Intelligence</h1>
          <p className="text-muted-foreground">POD marketplace data and competitive analysis</p>
        </div>
        <Button className="gap-2">
          <Settings className="h-4 w-4" />
          Configure Integrations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected Marketplaces</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="rounded-full p-2 bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              <span>All integrations active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published Products</p>
                <p className="text-2xl font-bold">127</p>
              </div>
              <div className="rounded-full p-2 bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+12 in the last 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Conversion Rate</p>
                <p className="text-2xl font-bold">3.8%</p>
              </div>
              <div className="rounded-full p-2 bg-primary/10 text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+0.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Profit Margin</p>
                <p className="text-2xl font-bold">42%</p>
              </div>
              <div className="rounded-full p-2 bg-primary/10 text-primary">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>-2% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Marketplace performance</h2>
          <p className="text-muted-foreground">
            Connect your POD marketplaces (e.g. Etsy, Amazon Merch, TeePublic) to see sales, conversion, and margin data here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
