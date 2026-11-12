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
