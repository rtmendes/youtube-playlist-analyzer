# Using Supabase with YouTube Playlist Analyzer

This app uses **PostgreSQL** (via Drizzle ORM) and is configured to work with **Supabase** as the database.

## Quick Setup

1. **Create a Supabase project** (or use self-hosted Supabase).

2. **Get your connection string:**
   - Supabase Cloud: **Project Settings → Database → Connection string** (URI)
   - Self-hosted: `postgresql://postgres:[PASSWORD]@[host]:5432/postgres`

3. **Configure `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:5432/postgres
   ```

4. **Apply schema to database:**
   ```bash
   pnpm install
   pnpm db:push
   ```
   This pushes the schema to your Supabase Postgres.

5. **Start the app:**
   ```bash
   pnpm dev
   ```

## Fresh Database (First-Time Setup)

For a **new Supabase project** with no existing data:

1. Set `DATABASE_URL` in `.env` to your Supabase Postgres connection string.
2. Run **`pnpm db:push`** – this pushes the schema to the database (no migration files needed).
3. Optional: use **Drizzle Studio** to inspect data: `pnpm db:studio`.

## GitHub Secrets

For CI/CD or deployment, add these secrets in **GitHub → Settings → Secrets**:

- `DATABASE_URL` – Your Supabase Postgres connection string
- `JWT_SECRET` – For auth
- `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_APP_ID` – For OAuth (if used)

## Optional: Supabase Auth / Realtime / Storage

To use Supabase for auth, realtime, or storage alongside the app:

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (client-side).
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-side, if needed).
- Use `getSupabase()` from `@/lib/supabase` in your components.
