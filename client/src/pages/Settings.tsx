import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Youtube,
  ShoppingCart,
  MessageCircle,
  Play,
  BarChart3,
  Palette,
  User,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { API_KEY_STORAGE } from "@/lib/apiKeys";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Settings() {
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [amazonApiKey, setAmazonApiKey] = useState("");
  const [amazonProvider, setAmazonProvider] = useState("sample");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [redditClientId, setRedditClientId] = useState("");
  const [redditClientSecret, setRedditClientSecret] = useState("");
  const [tiktokToken, setTiktokToken] = useState("");
  const [composioApiKey, setComposioApiKey] = useState("");
  const [scrapecreatorsApiKey, setScrapecreatorsApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const { isAuthenticated } = useAuth();
  const { data: apiKeyStatus } = trpc.system.getApiKeyStatus.useQuery();
  const { data: serverSettings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const setSettingsMutation = trpc.settings.set.useMutation({
    onSuccess: () => toast.success("Settings saved and synced to your account for use on other browsers."),
  });

  // Load from localStorage first, then merge server values when signed in
  useEffect(() => {
    const fromLocal = {
      [API_KEY_STORAGE.YOUTUBE_API_KEY]: localStorage.getItem(API_KEY_STORAGE.YOUTUBE_API_KEY) ?? "",
      [API_KEY_STORAGE.AMAZON_API_KEY]: localStorage.getItem(API_KEY_STORAGE.AMAZON_API_KEY) ?? "",
      [API_KEY_STORAGE.AMAZON_API_PROVIDER]: localStorage.getItem(API_KEY_STORAGE.AMAZON_API_PROVIDER) ?? "sample",
      [API_KEY_STORAGE.GEMINI_API_KEY]: localStorage.getItem(API_KEY_STORAGE.GEMINI_API_KEY) ?? "",
      [API_KEY_STORAGE.REDDIT_CLIENT_ID]: localStorage.getItem(API_KEY_STORAGE.REDDIT_CLIENT_ID) ?? "",
      [API_KEY_STORAGE.REDDIT_CLIENT_SECRET]: localStorage.getItem(API_KEY_STORAGE.REDDIT_CLIENT_SECRET) ?? "",
      [API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN]: localStorage.getItem(API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN) ?? "",
      [API_KEY_STORAGE.COMPOSIO_API_KEY]: localStorage.getItem(API_KEY_STORAGE.COMPOSIO_API_KEY) ?? "",
      [API_KEY_STORAGE.SCRAPECREATORS_API_KEY]: localStorage.getItem(API_KEY_STORAGE.SCRAPECREATORS_API_KEY) ?? "",
    };
    const fromServer = (serverSettings?.settings ?? {}) as Record<string, string>;
    setYoutubeApiKey((fromServer[API_KEY_STORAGE.YOUTUBE_API_KEY] ?? fromLocal[API_KEY_STORAGE.YOUTUBE_API_KEY]) || "");
    setAmazonApiKey((fromServer[API_KEY_STORAGE.AMAZON_API_KEY] ?? fromLocal[API_KEY_STORAGE.AMAZON_API_KEY]) || "");
    setAmazonProvider(fromServer[API_KEY_STORAGE.AMAZON_API_PROVIDER] ?? fromLocal[API_KEY_STORAGE.AMAZON_API_PROVIDER] ?? "sample");
    setGeminiApiKey((fromServer[API_KEY_STORAGE.GEMINI_API_KEY] ?? fromLocal[API_KEY_STORAGE.GEMINI_API_KEY]) || "");
    setRedditClientId((fromServer[API_KEY_STORAGE.REDDIT_CLIENT_ID] ?? fromLocal[API_KEY_STORAGE.REDDIT_CLIENT_ID]) || "");
    setRedditClientSecret((fromServer[API_KEY_STORAGE.REDDIT_CLIENT_SECRET] ?? fromLocal[API_KEY_STORAGE.REDDIT_CLIENT_SECRET]) || "");
    setTiktokToken((fromServer[API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN] ?? fromLocal[API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN]) || "");
    setComposioApiKey((fromServer[API_KEY_STORAGE.COMPOSIO_API_KEY] ?? fromLocal[API_KEY_STORAGE.COMPOSIO_API_KEY]) || "");
    setScrapecreatorsApiKey((fromServer[API_KEY_STORAGE.SCRAPECREATORS_API_KEY] ?? fromLocal[API_KEY_STORAGE.SCRAPECREATORS_API_KEY]) || "");
  }, [serverSettings]);

  const saveAll = () => {
    if (youtubeApiKey) localStorage.setItem(API_KEY_STORAGE.YOUTUBE_API_KEY, youtubeApiKey);
    if (amazonApiKey) localStorage.setItem(API_KEY_STORAGE.AMAZON_API_KEY, amazonApiKey);
    localStorage.setItem(API_KEY_STORAGE.AMAZON_API_PROVIDER, amazonProvider);
    if (geminiApiKey) localStorage.setItem(API_KEY_STORAGE.GEMINI_API_KEY, geminiApiKey);
    if (redditClientId) localStorage.setItem(API_KEY_STORAGE.REDDIT_CLIENT_ID, redditClientId);
    if (redditClientSecret) localStorage.setItem(API_KEY_STORAGE.REDDIT_CLIENT_SECRET, redditClientSecret);
    if (tiktokToken) localStorage.setItem(API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN, tiktokToken);
    if (composioApiKey) localStorage.setItem(API_KEY_STORAGE.COMPOSIO_API_KEY, composioApiKey);
    if (scrapecreatorsApiKey) localStorage.setItem(API_KEY_STORAGE.SCRAPECREATORS_API_KEY, scrapecreatorsApiKey);
    setSaved(true);
    const toSync: Record<string, string> = {
      [API_KEY_STORAGE.YOUTUBE_API_KEY]: youtubeApiKey,
      [API_KEY_STORAGE.AMAZON_API_KEY]: amazonApiKey,
      [API_KEY_STORAGE.AMAZON_API_PROVIDER]: amazonProvider,
      [API_KEY_STORAGE.GEMINI_API_KEY]: geminiApiKey,
      [API_KEY_STORAGE.REDDIT_CLIENT_ID]: redditClientId,
      [API_KEY_STORAGE.REDDIT_CLIENT_SECRET]: redditClientSecret,
      [API_KEY_STORAGE.TIKTOK_ACCESS_TOKEN]: tiktokToken,
      [API_KEY_STORAGE.COMPOSIO_API_KEY]: composioApiKey,
      [API_KEY_STORAGE.SCRAPECREATORS_API_KEY]: scrapecreatorsApiKey,
    };
    if (isAuthenticated) {
      setSettingsMutation.mutate({ settings: toSync });
    } else {
      toast.success("Settings saved for this browser.");
    }
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            When signed in, keys are synced to your account so they restore on other browsers. Use a persistent subdomain (e.g. with Cloudflare) so the same URL keeps your data—see <strong>docs/PERSISTENT-SUBDOMAIN-AND-KEYS.md</strong> in the repo. For server-wide keys, set them in the server <strong>.env</strong> file. See{" "}
            <a href="https://github.com/rtmendes/youtube-playlist-analyzer/blob/main/docs/API-KEYS.md" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              docs/API-KEYS.md <ExternalLink className="h-3 w-3" />
            </a>
            {" "}for where to get each key.
          </p>
        </div>
        <Button onClick={saveAll} disabled={saved}>
          {saved ? "Saved" : "Save all"}
        </Button>
      </div>

      {/* What to update - plain checklist */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">What to update</CardTitle>
          <CardDescription>
            Fill in only what you use. Click <strong>Save all</strong> when done.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Required for core app:</strong></p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li><strong>YouTube Data API v3</strong> — needed for playlists, videos, channels, comments. Get it from Google Cloud Console (link below).</li>
          </ul>
          <p className="pt-2"><strong>Optional (unlock more features):</strong></p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li><strong>Gemini</strong> — AI content in Marketing Canvas.</li>
            <li><strong>Amazon</strong> — Amazon Reviews & Competitor Analysis (Rainforest or ScraperAPI).</li>
            <li><strong>Reddit</strong> — Reddit Research (client ID + secret from reddit.com/prefs/apps).</li>
            <li><strong>TikTok</strong> — Composio API key or Scrape Creators key, or an OAuth token.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Account / Sign-in note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
          <CardDescription>
            You’re the only user. Sign in once; your session is stored in a cookie so you don’t have to sign in every time. If you’re asked to sign in again, the session may have expired or cookies were cleared.
          </CardDescription>
        </CardHeader>
      </Card>

      <Separator />

      {/* YouTube */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Youtube className="h-4 w-4 text-red-500" />
            YouTube Data API v3
          </CardTitle>
          <CardDescription>
            Required for analysis, playlists, channels, and comments. Get a key from{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeyStatus?.youtube ? (
            <p className="text-sm text-muted-foreground">Using server key (YOUTUBE_API_KEY in .env)</p>
          ) : (
            <div className="space-y-2">
              <Label>API Key (or set YOUTUBE_API_KEY in .env)</Label>
              <Input
                type="password"
                placeholder="Your YouTube Data API v3 key"
                value={youtubeApiKey}
                onChange={(e) => setYoutubeApiKey(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amazon / Competitor data source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Amazon Reviews & Competitor Analysis
          </CardTitle>
          <CardDescription>
            For Amazon product/review data and competitor product comparison. Use Rainforest API or ScraperAPI, or leave blank for sample data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data source</Label>
            <Select value={amazonProvider} onValueChange={setAmazonProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">Sample Data (no key)</SelectItem>
                <SelectItem value="rainforest">Rainforest API</SelectItem>
                <SelectItem value="scraperapi">ScraperAPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {amazonProvider !== "sample" && (
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder={amazonProvider === "rainforest" ? "Rainforest API key" : "ScraperAPI key"}
                value={amazonApiKey}
                onChange={(e) => setAmazonApiKey(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gemini */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Google Gemini (Canvas / AI)
          </CardTitle>
          <CardDescription>
            For AI content generation in Canvas. Get a key from{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Google AI Studio <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Gemini API Key</Label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reddit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Reddit Research
          </CardTitle>
          <CardDescription>
            Optional. Get credentials: go to{" "}
            <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              reddit.com/prefs/apps <ExternalLink className="h-3 w-3" />
            </a>
            , click &quot;create app&quot; or &quot;create another app&quot;, choose &quot;script&quot;, set redirect to <code className="text-xs bg-muted px-1 rounded">http://localhost</code>. Use the string under the app name as Client ID and the &quot;secret&quot; as Client Secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input
              type="text"
              placeholder="Reddit app client ID (under app name)"
              value={redditClientId}
              onChange={(e) => setRedditClientId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Client Secret</Label>
            <Input
              type="password"
              placeholder="Reddit app secret"
              value={redditClientSecret}
              onChange={(e) => setRedditClientSecret(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* TikTok */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4" />
            TikTok Intelligence
          </CardTitle>
          <CardDescription>
            Optional. TikTok uses <strong>OAuth2</strong> (no simple API key). Options: (1) Use <strong>Composio</strong> (API key below) to connect TikTok via their toolkit —{" "}
            <a href="https://docs.composio.dev/toolkits/tiktok" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Composio TikTok docs <ExternalLink className="h-3 w-3" />
            </a>
            . (2) Use <strong>Scrape Creators</strong> for social data extraction —{" "}
            <a href="https://docs.scrapecreators.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Scrape Creators API <ExternalLink className="h-3 w-3" />
            </a>
            . Store an access token here if your integration provides one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>TikTok access token (or use Composio / Scrape Creators below)</Label>
            <Input
              type="password"
              placeholder="OAuth access token if applicable"
              value={tiktokToken}
              onChange={(e) => setTiktokToken(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Composio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composio API</CardTitle>
          <CardDescription>
            Use Composio to connect TikTok, Gmail, and other tools via OAuth2. Get your API key from the Composio dashboard. With this key you can use their toolkits (e.g. TikTok: list videos, user info, publish status).{" "}
            <a href="https://docs.composio.dev/toolkits/tiktok" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              TikTok toolkit <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Composio API Key</Label>
            <Input
              type="password"
              placeholder="ak_..."
              value={composioApiKey}
              onChange={(e) => setComposioApiKey(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scrape Creators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scrape Creators API</CardTitle>
          <CardDescription>
            Optional. For social media data extraction (TikTok, etc.) without OAuth.{" "}
            <a href="https://docs.scrapecreators.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              Scrape Creators docs <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Scrape Creators API Key</Label>
            <Input
              type="password"
              placeholder="Your Scrape Creators API key"
              value={scrapecreatorsApiKey}
              onChange={(e) => setScrapecreatorsApiKey(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saved}>
          {saved ? "Saved" : "Save all"}
        </Button>
      </div>
    </div>
  );
}
