# Where to get API keys and tokens

**Recommended:** Set keys in the server **.env** file (see `.env.example`) so they work across computers and browsers. Keys are not stored in the browser.

Optional: You can still enter keys in **Settings** for a session, but they are not persisted.

| Tool | Where to get it |
|------|-----------------|
| **YouTube** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create credentials → API key. Enable **YouTube Data API v3**. |
| **Gemini** | [Google AI Studio](https://aistudio.google.com/app/apikey) → Get API key. |
| **Reddit** | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) → “create app” or “create another app” → type **script** → redirect URI `http://localhost`. Use the **client ID** (under the app name) and **secret** as Client ID and Client Secret in Settings. |
| **TikTok** | TikTok uses **OAuth2** (no simple API key). Two options: |
| | 1. **Composio** – Use your [Composio](https://composio.dev) API key and connect TikTok via their [TikTok toolkit](https://docs.composio.dev/toolkits/tiktok) (OAuth2). Tools: user info, list videos, publish status, upload video, etc. |
| | 2. **Scrape Creators** – For data extraction without OAuth: [Scrape Creators API](https://docs.scrapecreators.com/). |
| **Composio** | [Composio](https://composio.dev) dashboard → API key (e.g. `ak_...`). Use with their Python SDK (`pip install composio composio-openai-agents openai-agents`) or their API to connect TikTok, Gmail, etc. |
| **Scrape Creators** | [Scrape Creators](https://docs.scrapecreators.com/) → sign up and get API key for social media data extraction. |
| **Amazon / Competitor** | Rainforest API or ScraperAPI – sign up on their sites and add the key in Settings with the correct “Data source” (Rainforest vs ScraperAPI). |

## Composio (TikTok, Gmail, etc.)

Composio uses **OAuth2** for TikTok: you connect your TikTok account through Composio; the app uses your **Composio API key** to call their API, which then uses the connected account.

- Docs: [Composio TikTok toolkit](https://docs.composio.dev/toolkits/tiktok)
- Install: `pip install composio composio-openai-agents openai-agents`
- You can run agents (e.g. with OpenAI) that use Composio tools; store your Composio API key in Settings so any in-app integration can use it.

## Scrape Creators

For scraping TikTok (and other social) data without OAuth:

- Docs: [Scrape Creators API](https://docs.scrapecreators.com/)
- Add your Scrape Creators API key in .env as `SCRAPECREATORS_API_KEY` (or in Settings for the current session).
