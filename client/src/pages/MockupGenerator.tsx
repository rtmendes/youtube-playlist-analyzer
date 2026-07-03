import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Download, ShoppingCart, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ProductType = "t-shirt" | "hoodie" | "mug" | "poster" | "sticker";
type AiModel = "ideogram" | "midjourney" | "dalle";

function readPrefillSignal(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("signal") ?? "";
}

export default function MockupGenerator() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<ProductType>("t-shirt");
  const [signal, setSignal] = useState(readPrefillSignal);
  const [niche, setNiche] = useState("");
  const [style, setStyle] = useState("modern");
  const [aiModel, setAiModel] = useState<AiModel>("ideogram");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");

  useEffect(() => {
    const prefill = readPrefillSignal();
    if (prefill) setSignal(prefill);
  }, []);

  const gen = trpc.pod.generateDesignPrompt.useMutation({
    onSuccess: data => {
      setImageUrl(data.imageUrl);
      setImagePrompt(data.brief.image_prompt);
      toast.success("Design generated");
    },
    onError: err => toast.error(err.message),
  });

  const exportMut = trpc.pod.exportToGridbase.useMutation({
    onSuccess: () => toast.success("Exported to Gridbase"),
    onError: err => toast.error(err.message),
  });

  const productType = selectedTab;

  const handleGenerate = () => {
    if (!signal.trim()) {
      toast.error("Paste a comment or buyer-intent phrase first");
      return;
    }
    gen.mutate({ signal, niche: niche || undefined, productType, style, aiModel });
  };

  const handleExport = () => {
    exportMut.mutate({
      signal,
      niche: niche || undefined,
      productType,
      designPrompt: imagePrompt,
      styleTags: [style],
      trademarkFlag: false,
      status: "designed",
    });
  };

  const handleSave = () => {
    if (!imageUrl) {
      toast.error("Generate a design first");
      return;
    }
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `pod-design-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
    toast.success("Download started");
  };

  const copyPrompt = async () => {
    if (!imagePrompt) return;
    await navigator.clipboard.writeText(imagePrompt);
    toast.success("Image prompt copied");
  };

  const preview = (
    <div className="relative w-[300px] h-[350px] bg-muted rounded-md flex items-center justify-center overflow-hidden">
      {gen.isPending ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : imageUrl ? (
        <img src={imageUrl} alt="Generated POD design" className="max-h-full max-w-full object-contain" />
      ) : (
        <div className="text-muted-foreground text-sm text-center px-4">
          {productType.replace("-", " ")} mockup preview
        </div>
      )}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <Button variant="outline" size="sm" className="bg-background" onClick={handleSave} disabled={!imageUrl}>
          <Download className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button size="sm" onClick={handleExport} disabled={!imagePrompt || exportMut.isPending}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">POD-Optimized Mockup Generator</h1>
        <Button variant="ghost" onClick={() => setLocation("/pod-opportunities")}>
          ← Opportunities
        </Button>
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
                value={signal}
                onChange={e => setSignal(e.target.value)}
                placeholder="I would absolutely need this on a shirt right now! That quote is hilarious 😂"
                className="min-h-[120px]"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={aiModel} onValueChange={v => setAiModel(v as AiModel)}>
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
                  <Select value={style} onValueChange={setStyle}>
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
              <div className="space-y-2">
                <Label>Niche (optional)</Label>
                <Textarea
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="Gaming, tech humor, fitness…"
                  className="min-h-[60px]"
                />
              </div>
              <Button className="w-full gap-2" onClick={handleGenerate} disabled={gen.isPending}>
                {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate Design
              </Button>
              {imagePrompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Image prompt (copy for external tools)</Label>
                    <Button variant="ghost" size="sm" onClick={copyPrompt}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea readOnly value={imagePrompt} className="min-h-[80px] text-xs font-mono" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mockup Preview</CardTitle>
              <CardDescription>See how your design will look on products</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as ProductType)}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="t-shirt">T-Shirt</TabsTrigger>
                  <TabsTrigger value="hoodie">Hoodie</TabsTrigger>
                  <TabsTrigger value="mug">Mug</TabsTrigger>
                </TabsList>
                <TabsContent value="t-shirt" className="flex justify-center">
                  {preview}
                </TabsContent>
                <TabsContent value="hoodie" className="flex justify-center">
                  {preview}
                </TabsContent>
                <TabsContent value="mug" className="flex justify-center">
                  {preview}
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
              <p>Export sends the row to Gridbase when GRIDBASE_TABLE_ID is configured.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
