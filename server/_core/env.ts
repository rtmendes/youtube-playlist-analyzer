export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** @deprecated Forge proxy — use llmBaseUrl / llmApiKey instead */
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  /** @deprecated Forge proxy — use llmBaseUrl / llmApiKey instead */
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  llmBaseUrl:
    process.env.LLM_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai",
  llmApiKey: process.env.LLM_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",

  /** Supabase (optional): URL and service key for server-side Supabase usage */
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.STORAGE_BUCKET ?? "generated-images",

  /** API keys from .env – use these so keys persist across computers/browsers */
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  redditClientId: process.env.REDDIT_CLIENT_ID ?? "",
  redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
  amazonApiKey: process.env.AMAZON_API_KEY ?? "",
  amazonApiProvider: (process.env.AMAZON_API_PROVIDER ?? "rainforest") as
    | "rainforest"
    | "scraperapi",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  scrapeCreatorsApiKey: process.env.SCRAPECREATORS_API_KEY ?? "",
  composioApiKey: process.env.COMPOSIO_API_KEY ?? "",

  /** Gridbase REST export target */
  gridbaseBaseUrl:
    process.env.GRIDBASE_BASE_URL ?? "https://gridbase.insightprofit.live",
  gridbaseApiKey: process.env.GRIDBASE_API_KEY ?? process.env.GRIDBASE_TOKEN ?? "",
  gridbaseTableId: process.env.GRIDBASE_TABLE_ID ?? "",
};
