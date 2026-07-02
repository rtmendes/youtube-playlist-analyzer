# Persistent subdomain and API keys

## Why keys and data “disappear”

The app stores API keys, starred comments, last run, and other preferences in your **browser’s localStorage**. That storage is tied to the **origin** (the exact URL):

- `http://localhost:3000` has one storage
- `http://localhost:5173` has another
- `https://youtube-analyzer.yourdomain.com` has another

So if you:

- Open a **new browser** or **incognito** → new profile, empty storage, keys gone.
- Use a **different URL** (e.g. sometimes localhost, sometimes a deployed URL) → different storage, keys not shared.

To keep keys and data stable you want:

1. **One stable URL** (a persistent subdomain) you always use.
2. **Optional:** sync keys to the server when signed in, so a new browser can restore them after login.

---

## 1. Use a persistent subdomain (recommended)

If you always open the app at the **same** URL (e.g. `https://youtube-analyzer.yourdomain.com`), then in that browser everything (keys, starred comments, last run) will persist. New browser or new device will still start empty unless you add server sync (below).

### Deploy the app to a host

Deploy so the app is reachable at a URL. Examples:

- **Vercel:** Connect the repo, build command `pnpm build` (or `npm run build`), output = `dist` + client static (see your `package.json` scripts). Set root directory if the app is in a subfolder. Add **Environment variables** (e.g. `DATABASE_URL`, `YOUTUBE_API_KEY`) in the dashboard.
- **Netlify:** Same idea: build command, publish directory. Add env vars in Site settings → Environment variables.
- **Railway / Render / Fly.io:** Deploy the Node server and serve the built client; set env vars in the dashboard.

After deploy you’ll get a URL like `https://your-app-xyz.vercel.app` or `https://your-app.onrender.com`.

### Add your own subdomain (e.g. with Cloudflare)

1. **In your host (e.g. Vercel):**
   - Project → Settings → Domains.
   - Add a domain: `youtube-analyzer.yourdomain.com` (use your real domain).
   - Follow the host’s instructions (often they’ll ask for a CNAME or A record).

2. **In Cloudflare (if your domain is there):**
   - **DNS:** Add a record:
     - Type: **CNAME**
     - Name: `youtube-analyzer` (or the subdomain you chose)
     - Target: the host’s canonical hostname (e.g. `cname.vercel-dns.com` for Vercel).
   - **SSL/TLS:** set to **Full** (or **Full (strict)** if the host provides a valid cert).
   - Optionally enable **Proxy** (orange cloud) for caching and DDoS protection.

3. **Always use that URL**
   - Bookmark `https://youtube-analyzer.yourdomain.com` and use only that link when opening the app. Then keys and data will persist in that browser for that origin.

### Server .env on the host

Put API keys in the **server** environment (e.g. Vercel/Netlify env vars or a `.env` file on the server). The app can use server-side keys so you don’t have to type them in the UI; see **docs/SETUP-CLICK-BY-CLICK.md** and **.env.example**. That way keys are stable regardless of browser storage.

---

## 2. Sync keys across browsers (when signed in)

If you **sign in** (OAuth), the app can save your API keys and preferences on the server and restore them when you open the app in a **new browser** or new device. After login, open **Settings** and click **Save all** once; next time you use another browser, sign in and your saved keys will be loaded into that browser.

**Server setup:** Ensure the `user_settings` table exists. From the project root run: `pnpm run db:push` (or apply your migrations). This creates the table that stores synced settings.

- Keys are stored per user in the database (same security as the rest of your app data).
- You still need to use a stable URL for the app; Cloudflare is optional (for your own subdomain and SSL).

---

## Summary

| Goal | What to do |
|------|------------|
| Keys and data persist in **this** browser | Use **one** stable URL (e.g. a subdomain) every time. |
| Use your own domain + optional CDN | Deploy app → add subdomain in host → point subdomain in Cloudflare (CNAME + SSL). |
| Keys persist in **new** browser / device | Sign in, save keys in Settings once; they sync to server and restore after login elsewhere. |
| Keys never asked in UI | Put keys in server **.env** (or host’s environment variables). |

For a “persistent subdomain” setup: deploy the app, add `youtube-analyzer.yourdomain.com` (or similar) in your host and in Cloudflare DNS, then always open the app at that URL so keys and memories don’t disappear when you use the same browser.
