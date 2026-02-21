# Integrate Umami Analytics (Fork & Self-Host)

This app can send page views and events to [Umami](https://umami.is), a privacy-focused, open-source analytics platform. You can use the [official cloud](https://umami.is) or **fork and self-host** your own instance, then connect this project to it. If you've already forked Umami (e.g. [rtmendes/umami](https://github.com/rtmendes/umami)), use your fork's clone URL in the steps below.

---

## Option A: Use Umami Cloud (no fork)

1. Sign up at [umami.is](https://umami.is).
2. Add your website and copy the **Website ID** and script URL (e.g. `https://cloud.umami.is`).
3. In this project's root **.env** add:
   ```env
   VITE_ANALYTICS_ENDPOINT=https://cloud.umami.is
   VITE_ANALYTICS_WEBSITE_ID=your-website-id
   ```
4. Restart the app (`pnpm dev`). Analytics will be live.

---

## Option B: Fork and self-host Umami

### 1. Fork the repo

1. Open [https://github.com/umami-software/umami](https://github.com/umami-software/umami).
2. Click **Fork** (top right) and fork to your GitHub account.

### 2. Deploy your fork

Umami needs **Node.js 18.18+** and **PostgreSQL 12.14+**. Two common options:

#### Deploy with Docker (easiest)

On the machine or server where you want Umami to run:

```bash
git clone https://github.com/YOUR_USERNAME/umami.git
cd umami
```

Create a `.env` file (see [Umami's docs](https://umami.is/docs)) with at least:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/umami
```

Then:

```bash
docker compose up -d
```

By default Umami runs on port **3000**. Use a reverse proxy (nginx, Caddy) or cloud load balancer to expose it over HTTPS (e.g. `https://analytics.yourdomain.com`).

#### Deploy from source (no Docker)

From the [Umami repo](https://github.com/umami-software/umami):

```bash
git clone https://github.com/YOUR_USERNAME/umami.git
cd umami
pnpm install
```

Create `.env` with `DATABASE_URL` (PostgreSQL). Then:

```bash
pnpm run build
pnpm run start
```

Default login: **admin** / **umami**. Change the password after first login.

### 3. Create a website in Umami

1. Open your Umami instance in the browser (e.g. `http://localhost:3000` or `https://analytics.yourdomain.com`).
2. Log in (admin / umami, or your new password).
3. Go to **Websites** → **Add website**.
4. Enter a name (e.g. "YouTube Playlist Analyzer") and your app URL (e.g. `http://localhost:3001` for dev or your production URL).
5. Copy the **Website ID** (UUID) shown for that site.

### 4. Connect this project to your Umami instance

In the **youtube-playlist-analyzer** project root (this repo), edit **.env**:

```env
# Your Umami instance base URL (no trailing slash)
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com

# Website ID from Umami dashboard
VITE_ANALYTICS_WEBSITE_ID=the-uuid-you-copied
```

- **Local Umami:** If Umami runs on your machine at `http://localhost:3000`, use `VITE_ANALYTICS_ENDPOINT=http://localhost:3000`. Your app (e.g. `http://localhost:3001`) will load the script from there. For production, use a public URL.
- **Production:** Use the public URL of your Umami instance (e.g. `https://analytics.yourdomain.com`).

Restart this app:

```bash
pnpm dev
```

Open your app in the browser; the Umami script will load and start sending page views. You'll see data in your Umami dashboard.

---

## Option C: Run Umami on your self-hosted Supabase

You can use your **existing Supabase** (self-hosted or [Supabase Cloud](https://supabase.com)) as Umami's database. Official steps: [Umami – Running on Supabase](https://umami.is/docs/guides/running-on-supabase).

### 1. Clone your Umami fork

If you've already forked (e.g. [rtmendes/umami](https://github.com/rtmendes/umami)):

```bash
git clone https://github.com/rtmendes/umami.git
cd umami
pnpm install
```

### 2. Point Umami at Supabase (schema change)

Umami needs a **pooled** URL for the app and a **direct** URL for migrations. In the **umami** repo (not this project):

1. Open **`db/postgresql/schema.prisma`** (or the Prisma schema file under `db/` in the Umami repo).
2. In the `datasource db` block, add a `directUrl` so it looks like:

   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_DATABASE_URL")
   }
   ```

   If `directUrl` is already there, leave it as is.

### 3. Get Supabase connection strings

**Self-hosted Supabase:** Use your Postgres connection details.

- **Connection pooling (for Umami app):** Use Supabase's pooler if you have one (e.g. port **6543** with `?pgbouncer=true&connection_limit=1`). Format:
  ```text
  postgres://[user]:[password]@[your-supabase-host]:6543/postgres?pgbouncer=true&connection_limit=1
  ```
- **Direct (for migrations):** Direct Postgres connection, usually port **5432**:
  ```text
  postgres://postgres:[password]@[your-supabase-host]:5432/postgres
  ```

**Supabase Cloud:** In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **Database**:

- **Connection string:** use the **Connection pooling** URI (port 6543) for `DATABASE_URL`.
- **Direct connection:** use the URI with port **5432** for `DIRECT_DATABASE_URL**.  
  Example format from the [Umami/Supabase guide](https://umami.is/docs/guides/running-on-supabase):

  ```text
  DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
  DIRECT_DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
  ```

Replace `[your-supabase-host]`, `[password]`, and (for Cloud) `[project-ref]` / `[region]` with your actual values.

### 4. Configure Umami `.env`

In the **umami** project root, create or edit **`.env`**:

```env
DATABASE_URL=postgres://[user]:[password]@[your-supabase-host]:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgres://postgres:[password]@[your-supabase-host]:5432/postgres
```

- Use your **self-hosted Supabase** host and credentials.
- If your self-hosted setup has no pooler, you can use the same direct URL for both, with port 5432 (migrations and app will share it). Some setups only expose 5432.

### 5. Build and start Umami

```bash
pnpm run build
pnpm run start
```

First run creates the tables in your Supabase database. Default login: **admin** / **umami** — change the password after first login.

### 6. Add a website and connect this app

1. Open your Umami UI (e.g. `http://localhost:3000` or the URL where you host Umami).
2. Log in → **Websites** → **Add website** (name + your app URL).
3. Copy the **Website ID**.
4. In **youtube-playlist-analyzer** root **.env** add:
   ```env
   VITE_ANALYTICS_ENDPOINT=https://your-umami-url.com
   VITE_ANALYTICS_WEBSITE_ID=the-website-id-uuid
   ```
5. Restart this app (`pnpm dev`). Analytics will send events to Umami, which stores them in your Supabase.

---

## How it's integrated in this app

- **Script:** In `client/src/main.tsx`, the app injects the Umami script only when both `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are set. If either is missing, no script is loaded and no errors occur.
- **Env:** Vite exposes these at build time; they must be set in the **.env** at the project root (same folder as `package.json`).

No code changes are required in this repo to use your fork; only configuration in **.env** and a running Umami instance (cloud or your fork).

---

## References

- [Umami on GitHub](https://github.com/umami-software/umami) (upstream) · [Your fork: rtmendes/umami](https://github.com/rtmendes/umami)
- [Umami docs](https://umami.is/docs) – install, configure, and usage
- [Umami – Running on Supabase](https://umami.is/docs/guides/running-on-supabase)
