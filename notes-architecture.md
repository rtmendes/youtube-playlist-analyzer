# Architecture Notes

## Database
- MySQL/TiDB via Drizzle ORM (dialect: mysql)
- Connection: process.env.DATABASE_URL
- Schema: drizzle/schema.ts

## Auth
- Manus OAuth via server/_core/oauth.ts
- protectedProcedure requires ctx.user
- publicProcedure does not require auth
- Login redirect in client/src/main.tsx (UNAUTHED_ERR_MSG check)
- useAuth hook in client/src/_core/hooks/useAuth.ts
- OAuth callback at /api/oauth/callback

## LLM
- Model: gemini-2.5-flash via Manus Forge API
- Endpoint: ENV.forgeApiUrl + /v1/chat/completions
- Key: ENV.forgeApiKey (BUILT_IN_FORGE_API_KEY)

## GridBase Integration
- Base URL: https://gridbase.insightprofit.live
- API: /api/v1/bases (requires Bearer token auth)
- Key env var: GRIDBASE_API_KEY
- Health endpoint returns {"ok":true}
- 401 without key, 200 with key

## Key Files for Auth Removal
- server/_core/trpc.ts - defines protectedProcedure and publicProcedure
- server/routers.ts - all procedures (many use protectedProcedure)
- client/src/main.tsx - login redirect on UNAUTHED_ERR_MSG
- client/src/_core/hooks/useAuth.ts - auth state hook
- client/src/pages/*.tsx - pages that check isAuthenticated

## Comment Threading
- comments table has parentCommentId field
- YouTube API returns thread.replies.comments array
- Frontend renders replies indented under parent with border-l-2
- Sorted by: newest, oldest, most-liked, most-replies

## Thumbnails/Images
- Videos: thumbnailUrl stored in videos table, rendered via ThumbnailCell component
- Comments: authorProfileImageUrl rendered as circular avatar
- Channels: thumbnailUrl and bannerUrl in competitorYouTubeChannels table
- All images are YouTube CDN URLs (i.ytimg.com), not stored locally

## Bulk Processing
- BulkAnalyze page accepts multiple URLs (one per line)
- Processes sequentially: parse URL → fetch playlist/channel → get videos → batch comments
- getBatchVideoComments: paginates up to maxComments (default 500, max 5000)
- Videos fetched in batches of 50 IDs at a time
- Channel uploads playlist auto-detected
