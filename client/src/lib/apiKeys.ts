/**
 * LocalStorage keys for API keys and tokens.
 * Use these everywhere so Settings and tools stay in sync.
 */
export const API_KEY_STORAGE = {
  YOUTUBE_API_KEY: "youtube_api_key",
  REMEMBER_YOUTUBE_KEY: "remember_api_key",
  AMAZON_API_KEY: "amazon_api_key",
  AMAZON_API_PROVIDER: "amazon_api_provider",
  GEMINI_API_KEY: "gemini_api_key",
  REDDIT_CLIENT_ID: "reddit_client_id",
  REDDIT_CLIENT_SECRET: "reddit_client_secret",
  TIKTOK_ACCESS_TOKEN: "tiktok_access_token",
  RAINFOREST_API_KEY: "rainforest_api_key",
  SCRAPER_API_KEY: "scraper_api_key",
  COMPOSIO_API_KEY: "composio_api_key",
  SCRAPECREATORS_API_KEY: "scrapecreators_api_key",
} as const;

export function getStoredYouTubeApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE.YOUTUBE_API_KEY) ?? "";
}

export function setStoredYouTubeApiKey(key: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  if (remember && key) {
    localStorage.setItem(API_KEY_STORAGE.YOUTUBE_API_KEY, key);
    localStorage.setItem(API_KEY_STORAGE.REMEMBER_YOUTUBE_KEY, "true");
  } else {
    localStorage.removeItem(API_KEY_STORAGE.YOUTUBE_API_KEY);
    localStorage.removeItem(API_KEY_STORAGE.REMEMBER_YOUTUBE_KEY);
  }
}

export function getStoredAmazonApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE.AMAZON_API_KEY) ?? "";
}

export function getStoredAmazonApiProvider(): string {
  return localStorage.getItem(API_KEY_STORAGE.AMAZON_API_PROVIDER) ?? "sample";
}

export function getStoredGeminiApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE.GEMINI_API_KEY) ?? "";
}

export function getStoredScrapeCreatorsApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE.SCRAPECREATORS_API_KEY) ?? "";
}
