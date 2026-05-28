# @inside_my_backpack — AI Content OS

> AI-powered Instagram content calendar for a Bangalore-based travel/lifestyle/food/men's style creator.

## 🎒 Creator Profile
- **Handle:** @inside_my_backpack
- **Base:** HSR Layout, Bangalore, India
- **Gear:** Sony A7III · DJI Mini 5 Pro · iPhone 15 Pro Max
- **Budget:** ₹10,000/month travel
- **Lifestyle:** Full-time job, weekend getaways by car, café explorer, home cook

## ✨ Features
| Feature | Description |
|---------|-------------|
| 📅 **30-Day Calendar** | Visual calendar with post briefs — click any day to view/edit |
| 📝 **AI Script Generator** | Per-post scripts with hook, full script, caption, CTA, hashtags, visual notes |
| 🔄 **Script Refresh** | Leave feedback → Claude revises the script instantly |
| 🔥 **Viral Suggestions** | Trending formats from Instagram, YouTube & Facebook adapted to your niche |
| 🌐 **Live Trend Monitor** | Scans current trends and auto-flags breaking content opportunities |
| 🚨 **Ad-hoc Trend Alerts** | Notifies you of breaking trends with option to update calendar |
| 🗂️ **Content Buckets** | 6 buckets with mix breakdown across all formats |
| 📊 **Production Tracker** | Script → Shot → Edited → Captioned → Posted + engagement metrics |
| 🐙 **GitHub Sync** | Push calendar + trends data to this repo with one click |

## 🗂️ Content Buckets
- 🏙️ City Life & Cafés
- 🚗 Road Trips & Drives
- 🏔️ Weekend Getaways
- 🍳 Food & Cooking
- 👔 Men's Style & Outfits
- 🧠 Working Pro + Travel

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the app
npm start

# Build for production
npm run build
```

### Environment Variables
Create a `.env` file (optional — the app works without it in the browser):
```
REACT_APP_ANTHROPIC_API_KEY=your_key_here
```

> **Note:** In the Claude.ai artifact environment, the API key is automatically injected. When running locally, add your own Anthropic API key.

## 📁 File Structure
```
src/
├── App.js          # Main app with all sections
├── api.js          # Claude API utility + system prompts
├── data.js         # Static seed data, profile, helpers
└── index.js        # Entry point

data/
├── calendar.json   # Auto-generated from app
└── trends.json     # Auto-generated from app
```

## 📍 Nearby Destinations (from HSR Layout)
| Place | Distance | Drive | Drone | Budget |
|-------|----------|-------|-------|--------|
| Savandurga | 55km | 1 hr | ✅ | ₹600–1000 |
| Nandi Hills | 60km | 1.5 hrs | ✅ | ₹800–1200 |
| Kanakapura Road | 80km | 1.5 hrs | ✅ | ₹1000–1500 |
| Shivanasamudra | 130km | 2.5 hrs | ✅ | ₹1500–2000 |
| Mysore | 150km | 3 hrs | ✅ | ₹2500–3500 |
| Chikmagalur | 245km | 4.5 hrs | ✅ | ₹4000–7000 |

---
*Built with Claude AI · Last updated automatically*
