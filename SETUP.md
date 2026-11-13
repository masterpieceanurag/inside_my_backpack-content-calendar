# Creator Agent: setup

## 1. Run the web app
```bash
npm install
cp .env.example .env        # then paste your Anthropic API key into .env
npm start
```
The key is bundled into the browser build, so run the app locally or for personal use only. Don't deploy it publicly with your key inside.

## 2. New tabs
| Tab | What it does |
|---|---|
| 🤖 Agent | Chat with your growth and monetization co-pilot. It has 4 modes (Growth, YouTube, Instagram, Monetization), knows your stats, calendar and trends, and searches the web for current info. |
| ▶️ YouTube | Suggests video ideas with search demand, or turns an idea into a full upload package: titles, thumbnails, hook, chapters, description, tags, Shorts cut-downs and an Instagram repurpose. |
| 💰 Monetize | YPP progress bars, Instagram milestones, a 90-day monetization plan, an estimated rate card and media-kit blurb, and a brand pitch writer (email, DM and follow-up). |
| 📈 My Stats | Enter your follower, subscriber and watch-hour numbers so all advice fits your real size. Stored in this browser only. |

## 3. Claude Code agent (live data)
`.claude/agents/creator-agent.md` defines a `creator-agent` subagent for Claude Code. With the vidIQ connector attached, it pulls your real YouTube and Instagram analytics, keyword data and outliers. Example:

> Use the creator-agent to do my weekly review and plan next weekend's shoot.

By default it only reads data. It won't publish, upload or send anything unless you approve that specific action.

## 4. Publish it to use on your phone (Vercel, free)
When the app is published there's **no API key in the app itself**. The key lives on Vercel's server, and the app asks for a password.

1. Sign up at **vercel.com** with **Continue with GitHub**.
2. Click **Add New… → Project** and **Import** `inside_my_backpack-content-calendar`.
3. Before deploying, open **Environment Variables** and add two:
   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your full `sk-ant-…` key |
   | `APP_PASSWORD` | a password you'll type on your phone |

   ⚠️ Do **not** add `REACT_APP_ANTHROPIC_API_KEY` on Vercel. Anything starting with `REACT_APP_` is built into the public app.
4. Click **Deploy**. After about 2 minutes you get a link like `https://inside-my-backpack.vercel.app`.
5. On your iPhone, open the link in **Safari**, enter your password, then tap **Share → Add to Home Screen**.

Every change merged into `main` on GitHub re-publishes automatically.
To change the key or password: Vercel → your project → **Settings → Environment Variables**, edit it, then **Deployments → ⋯ → Redeploy**.

**Running on your computer still works the same way** (`npm start` with your `.env` file). The password screen only appears on the published version.
