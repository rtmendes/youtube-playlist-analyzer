# Setup guide (click-by-click, no coding experience needed)

This guide tells you exactly what to click and type, step by step. Do the steps in order.

---

## Where to add the server .env (API keys so the app stops asking)

The app can use your **YouTube API key** (and other keys) from a file called **.env** on the **server**. Once you add it there, the app will **not** ask for the key on the home screen.

### Step 1 – Open your project folder

1. In **Cursor**, in the left sidebar, click your project folder (e.g. **youtube-playlist-analyzer**).
2. You should see folders like **client**, **server**, **docs** and files like **package.json**. The **.env** file must live in the **same folder as package.json** (the project root).

### Step 2 – Create or open the .env file

1. In the left sidebar, look for a file named **.env** in the project root (same level as **package.json**).
2. **If you see .env:** click it to open it.
3. **If you do not see .env:**
   - Right‑click in the sidebar on the project root (the folder name at the top).
   - Click **“New File”**.
   - Type exactly: **.env** and press **Enter**.
   - Click the new **.env** file to open it.

### Step 3 – Add your YouTube API key

1. In the **.env** file, click at the end of the file (or in an empty line).
2. Type or paste this on its own line (replace the placeholder with your real key):
   ```text
   YOUTUBE_API_KEY=your_actual_key_here
   ```
   Example (fake key): `YOUTUBE_API_KEY=AIzaSyB1234567890abcdef`
3. Do **not** put quotes around the key. Do **not** leave a space before or after the `=`.
4. Save the file (**File → Save**, or **Ctrl+S** / **Cmd+S**).

### Step 4 – Restart the server

1. Go to the **Terminal** (bottom panel in Cursor, or **Terminal → New Terminal**).
2. If the app is running (**pnpm dev** or **npm run dev**), stop it: press **Ctrl+C** (or **Cmd+C** on Mac).
3. Start it again: type **pnpm dev** (or **npm run dev**) and press **Enter**.
4. Open the app in your browser again. The home page should now say **“Using server key (set in .env). No need to enter a key here.”** and the API key box will be hidden.

### Optional – Other keys in .env

You can add more keys in the same **.env** file, one per line. See the **.env.example** file in the project for names (e.g. `GEMINI_API_KEY=`, `REDDIT_CLIENT_ID=`, etc.). The app uses these so you don’t have to type them in the interface.

---

## How to see the app rendered (run it locally)

To view the app in your browser on your computer:

1. **Open the terminal** (in Cursor: **Terminal** → **New Terminal**, or the Mac **Terminal** app).
2. **Go into the project folder** (you must be inside the project, not your home folder). Type this and press **Enter** (adjust the path if your project is elsewhere):
   ```text
   cd "/Users/rmmakeithappen/Cursor Apps Dec 2025/YouTube POD Analytics/youtube-playlist-analyzer"
   ```
3. **Install dependencies** (only needed the first time or after pulling new code):
   - Type: `pnpm install`
   - Press **Enter** and wait until it finishes.
4. **Start the app:**
   - Type: `pnpm dev`
   - Press **Enter**.
5. **Open your browser:** when you see a message like “Local: http://localhost:5173”, click that link or type **http://localhost:5173** in your browser’s address bar.
6. The app will load. Use the **sidebar** (left side) to open **POD** and other sections. To stop the app, go back to the terminal and press **Ctrl+C** (or **Cmd+C** on Mac).

---

## Part 1: Turn on automatic checks (CI) on GitHub

This makes GitHub run a quick check every time you (or someone) push code. You’ll do it by creating one file on GitHub’s website.

### Step 1.1 – Open your project on GitHub

1. Open your web browser (Chrome, Safari, etc.).
2. Go to: **https://github.com/rtmendes/youtube-playlist-analyzer**
3. You should see the main page of your project (files and folders like `client`, `server`, etc.).

### Step 1.2 – Start creating a new file

1. Look at the **top row** of the project page (same line as the green **Code** button).
2. Click the **Add file** button (it might say **“Add file”** or show a **+** with a small arrow).
3. In the menu that appears, click **“Create new file”**.

### Step 1.3 – Tell GitHub the file path (name and folder)

1. You’ll see a box that says **“Name your file…”** or similar.
2. **Click inside that box** and delete anything that’s there.
3. Type **exactly** this (including the dot and the slash):
   ```text
   .github/workflows/ci.yml
   ```
   - The first part is: dot, then the letters `github`
   - Then a **forward slash**: `/`
   - Then: `workflows`
   - Then another **forward slash**: `/`
   - Then: `ci.yml`
4. Do **not** press Enter yet.

### Step 1.4 – Paste the file contents

1. In the **big text area below** the file name (where you might see “Edit new file” or placeholder text), **click once** inside that area.
2. **Select all** the text in that area (e.g. press **Ctrl+A** on Windows or **Cmd+A** on Mac) and delete it so the area is empty.
3. Open this file on your computer in Cursor (or any text editor):
   - In your project folder: **docs** → **ci-workflow-example.yml**
   Or in the same repo, the file: **.github/workflows/ci.yml**
4. In that file, **select all** (Ctrl+A / Cmd+A) and **copy** (Ctrl+C / Cmd+C).
5. Go back to the browser tab with GitHub.
6. **Click inside the big text area** and **paste** (Ctrl+V / Cmd+V). You should see many lines starting with `#`, `name:`, `on:`, `jobs:`, etc.
7. Do **not** change any of the pasted text.

### Step 1.5 – Save the file to the main branch

1. Scroll down until you see a green button that says **“Commit new file”** or **“Commit changes”**.
2. Optionally, in the first box you can type a short note like: **Add CI workflow**.
3. Leave the branch as **main** (don’t change the branch dropdown).
4. Click the green **“Commit new file”** (or **“Commit changes”**) button.

You’re done with Part 1. CI is now turned on. The next time code is pushed (or a pull request is opened), GitHub will run the check automatically.

---

## Part 2: Apply the database schema (so the app can save data)

Your app uses a database (Supabase). You need to run **one command** on your computer so the database has the right tables. This is done in a **terminal**.

### Step 2.1 – Open the terminal in Cursor

1. Open **Cursor** and open your project folder: **youtube-playlist-analyzer**.
2. At the **top menu**, click **Terminal**.
3. In the menu that opens, click **“New Terminal”** (or **“New Terminal…”**).
4. A panel will open at the **bottom** of Cursor with a black or dark window and a line of text (the “prompt”). That is the terminal.

### Step 2.2 – Make sure you’re in the project folder

1. Look at the line in the terminal. It often ends with the name of a folder, e.g. `youtube-playlist-analyzer` or something like `~ %`.
2. If you’re **not** sure you’re in the right project, type this and press **Enter**:
   ```text
   cd "/Users/rmmakeithappen/Cursor Apps Dec 2025/YouTube POD Analytics/youtube-playlist-analyzer"
   ```
   (If your project is in a different folder, replace that path with the path to your **youtube-playlist-analyzer** folder.)
3. After pressing Enter, you should still see a prompt; that’s normal.

### Step 2.3 – Run the database command

1. In the same terminal, type **exactly**:
   ```text
   pnpm db:push
   ```
2. Press **Enter**.
3. Wait. It may take 10–30 seconds (or longer if the database is slow or far away).
4. **If it succeeds:** you’ll see something like “Changes applied” or similar, and no red error. You’re done with Part 2.
5. **If it fails with “CONNECT_TIMEOUT” or “connection refused”:** your computer couldn’t reach the database. Go to **Part 3** to check your Supabase settings and `.env`.

---

## Part 3: If the database command failed (connection timeout)

Your app connects to Supabase using a **connection string** stored in a file named **.env** in your project. You need to get the right value from Supabase and put it in `.env`.

### Step 3.1 – Open Supabase and your project

1. In your browser, go to **https://supabase.com** and sign in if needed.
2. Open your **project** (the one you use for this app, e.g. **insightprofit** or whatever you named it).
3. In the **left sidebar**, click **“Project Settings”** (often a gear icon at the bottom of the sidebar).

### Step 3.2 – Get the database connection string

1. In **Project Settings**, in the **left** sub-menu, click **“Database”**.
2. On the Database page, find the section **“Connection string”** or **“Connection pooling”**.
3. You’ll see a few options (e.g. **URI**, **Session mode**, **Transaction mode**). For **Transaction mode** (or **Connection pooling**), there is usually a **port number**: use the one that says **6543** (not 5432) if you had connection problems.
4. Click **“Copy”** (or the copy icon) next to the **URI** so the full connection string is in your clipboard. It looks like:
   ```text
   postgresql://postgres.xxxxx:PASSWORD@supabase.insightprofit.live:6543/postgres
   ```
5. If there’s a placeholder like `[YOUR-PASSWORD]`, replace it with your real database password (the one you set for this Supabase project), then copy the whole string again.

### Step 3.3 – Put the connection string in your project’s .env file

1. In **Cursor**, in the **left file list**, find the file named **.env** in the **root** of the project (same level as `client`, `server`, `package.json`).  
   - If you don’t see **.env**, it may be hidden. You can use **File → Open File** and type **.env** to open it.
2. **Open** the **.env** file (double-click or single click depending on your setup).
3. Find the line that starts with **DATABASE_URL=**.
4. **Click** at the end of that line (after the `=` or after the current value).
5. **Select** the whole value after **DATABASE_URL=** (drag to select or triple-click) and **delete** it.
6. **Paste** the connection string you copied from Supabase (Ctrl+V / Cmd+V). The line should look like:
   ```text
   DATABASE_URL=postgresql://postgres.xxxxx:YourPassword@supabase.insightprofit.live:6543/postgres
   ```
7. **Save** the file (Ctrl+S / Cmd+S).
8. Go back to **Part 2**, Step 2.3, and run **pnpm db:push** again in the terminal.

### Step 3.4 – If it still times out

- **Firewall / network:** Something (your router, company network, or Supabase’s side) may be blocking the connection. Try from a different network (e.g. phone hotspot) and run **pnpm db:push** again.
- **Supabase host:** In Supabase **Project Settings → Database**, double-check the **host** and **port** (e.g. 6543 for pooler). Use the **exact** URI Supabase shows for “Transaction” or “Session” mode with port **6543**.

---

## Quick recap

| What you did | Where |
|--------------|--------|
| Turn on CI | GitHub website: Add file → create `.github/workflows/ci.yml` → paste contents → Commit |
| Apply database schema | Cursor: Terminal → `pnpm db:push` |
| Fix connection | Supabase: Project Settings → Database → copy URI → put in `.env` as `DATABASE_URL` → run `pnpm db:push` again |

If you get stuck, note **exactly** what you see (e.g. the full error message or a screenshot) and which step number you were on; that will make it easier to help.
