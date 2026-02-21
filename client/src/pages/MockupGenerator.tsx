import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Download, ShoppingCart } from "lucide-react";

export default function MockupGenerator() {
  const [selectedTab, setSelectedTab] = useState("t-shirt");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">POD-Optimized Mockup Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Prompt</CardTitle>
              <CardDescription>Describe the design you want to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="I would absolutely need this on a shirt right now! That quote is hilarious 😂"
                className="min-h-[120px]"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select defaultValue="ideogram">
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ideogram">Ideogram</SelectItem>
                      <SelectItem value="midjourney">Midjourney</SelectItem>
                      <SelectItem value="dalle">DALL-E 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select defaultValue="modern">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full gap-2">
                <Wand2 className="h-4 w-4" />
                Generate Design
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mockup Preview</CardTitle>
              <CardDescription>See how your design will look on products</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="t-shirt">T-Shirt</TabsTrigger>
                  <TabsTrigger value="hoodie">Hoodie</TabsTrigger>
                  <TabsTrigger value="mug">Mug</TabsTrigger>
                </TabsList>
                <TabsContent value="t-shirt" className="flex justify-center">
                  <div className="relative w-[300px] h-[350px] bg-muted rounded-md flex items-center justify-center">
                    <div className="text-muted-foreground text-sm">T-Shirt mockup placeholder</div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                      <Button variant="outline" size="sm" className="bg-background">
                        <Download className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="hoodie" className="flex justify-center">
                  <div className="relative w-[300px] h-[350px] bg-muted rounded-md flex items-center justify-center">
                    <div className="text-muted-foreground text-sm">Hoodie mockup placeholder</div>
                  </div>
                </TabsContent>
                <TabsContent value="mug" className="flex justify-center">
                  <div className="relative w-[300px] h-[350px] bg-muted rounded-md flex items-center justify-center">
                    <div className="text-muted-foreground text-sm">Mug mockup placeholder</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
              <CardDescription>Get the best results from the mockup generator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Paste a comment or quote that shows buyer intent to generate a design concept.</p>
              <p>Use clear style keywords (e.g. minimalist, vintage) for consistent output.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
