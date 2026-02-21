export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Supabase (optional): URL and service key for server-side Supabase usage */
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  /** API keys from .env – use these so keys persist across computers/browsers */
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  redditClientId: process.env.REDDIT_CLIENT_ID ?? "",
  redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
  amazonApiKey: process.env.AMAZON_API_KEY ?? "",
  amazonApiProvider: (process.env.AMAZON_API_PROVIDER ?? "rainforest") as "rainforest" | "scraperapi",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  scrapeCreatorsApiKey: process.env.SCRAPECREATORS_API_KEY ?? "",
  composioApiKey: process.env.COMPOSIO_API_KEY ?? "",
};
