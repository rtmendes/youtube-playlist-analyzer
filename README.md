# YouTube Playlist Analyzer

Transform YouTube comments into marketing insights. Extract stories, pain points, and product ideas from your audience's words.

**Repo:** [github.com/rtmendes/youtube-playlist-analyzer](https://github.com/rtmendes/youtube-playlist-analyzer)

## Features

- Analyze playlists, videos, and channels
- Comment intelligence and AI categorization
- Marketing Canvas, Content Generator, Competitor Analysis
- Saved playlists, projects, folders, and trash
- Export to CSV, Google Sheets, Notion, Google Docs

## Setup with Supabase (Postgres)

**Not a developer?** Use the **[click-by-click setup guide](docs/SETUP-CLICK-BY-CLICK.md)** — it tells you exactly what to click and type, step by step.

1. **Clone and install:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL` – Your Supabase Postgres connection string (Settings → Database → Connection string URI)
   - Auth vars (optional): `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_APP_ID`
     - If `OAUTH_SERVER_URL` is **not** set, the app runs in **single-user auto-auth mode** (no login screen).
     - `OWNER_OPEN_ID` is optional and defaults to `local-owner` for the auto-auth user.

3. **Apply schema to database:**
   ```bash
   pnpm db:push
   ```
   This pushes the schema to your Supabase Postgres (one command, no migration files).
   
   For migration-based workflow: `pnpm db:migrate` (generate + run migrations).

4. **Start dev server:**
   ```bash
   pnpm dev
   ```

## Self-hosted Supabase

To **save all data to your self-hosted Supabase**:

1. In your Supabase project, go to **Settings → Database** and copy the **Connection string (URI)**.
2. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@[your-host]:5432/postgres
   ```
3. Run migrations: `pnpm db:push`

Optional client-side Supabase (auth, realtime, storage):

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
- Use the Supabase client from `@/lib/supabase` when those env vars are set.

## Environment

See [.env.example](./.env.example) for all variables. Key ones:

- `DATABASE_URL` – **Required.** Postgres connection string (Supabase or any Postgres).
- `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_APP_ID` – Optional auth settings. Leave `OAUTH_SERVER_URL` empty for single-user auto-auth.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` – Optional server-side Supabase.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` – Optional client-side Supabase.

## Scripts

- `pnpm dev` – Start dev server
- `pnpm build` – Build for production
- `pnpm start` – Run production server
- `pnpm db:push` – Push schema to database (recommended for Supabase)
- `pnpm db:migrate` – Generate and run migration files
- `pnpm db:generate` – Generate migrations only
- `pnpm db:studio` – Open Drizzle Studio
- `pnpm test` – Run tests

## CI

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs `pnpm install` and `pnpm check` on push/PR to `main`. If push fails with "workflow scope", see [docs/ENABLE-CI.md](./docs/ENABLE-CI.md).
