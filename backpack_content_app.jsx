// @inside_my_backpack — AI-Powered Content OS
// Live trend monitoring + dynamic calendar with Claude API
import { useState, useEffect, useCallback, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:       "#080A0F",
  surface:  "#0E1117",
  card:     "#141820",
  card2:    "#1A1F2E",
  border:   "#1E2535",
  border2:  "#2A3347",
  accent:   "#F59E0B",
  accentDim:"#92600A",
  amber:    "#FBBF24",
  blue:     "#3B82F6",
  purple:   "#8B5CF6",
  teal:     "#14B8A6",
  green:    "#22C55E",
  red:      "#EF4444",
  pink:     "#EC4899",
  text:     "#F1F5F9",
  text2:    "#94A3B8",
  text3:    "#475569",
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const PROFILE = {
  handle: "@inside_my_backpack",
  base: "HSR Layout, Bangalore",
  gear: ["Sony A7III", "DJI Mini 5 Pro", "iPhone 15 PM"],
  budget: "₹10,000/month",
  lifestyle: ["Weekend driver", "Home cook", "Full-time job", "Café explorer"],
  buckets: ["City Life & Cafés", "Road Trips", "Weekend Getaways", "Food & Cooking", "Men's Style", "Working Pro + Travel"],
};

const FORMATS = {
  Reel:         { icon: "🎬", color: T.accent },
  Carousel:     { icon: "🎠", color: T.blue },
  "Talking Head":{ icon: "🎙️", color: T.purple },
  Story:        { icon: "📱", color: T.green },
  Vlog:         { icon: "📹", color: T.teal },
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── INITIAL SEED CALENDAR (May/Jun 2026) ─────────────────────────────────────
function makeSeedCalendar() {
  const start = new Date(2026, 4, 27);
  const entries = [
    { format:"Reel", bucket:"City Life & Cafés", title:"A Day Off in HSR — My Favourite Spots", hook:"It's Saturday, I live in HSR Layout, and I have nowhere to be.", postTime:"7:30 AM", ready:true },
    { format:"Carousel", bucket:"Men's Style", title:"My Travel Outfit Formula (Works Every Time)", hook:"I've worn this formula on every trip for 2 years. Here's what it is.", postTime:"8:00 AM", ready:true },
    { format:"Talking Head", bucket:"Working Pro + Travel", title:"Full Time Job + Content Creator — How I Actually Manage It", hook:"I work full-time. I don't travel every week. And I still post consistently.", postTime:"7:30 AM", ready:true },
    { format:"Vlog", bucket:"Road Trips", title:"Solo Drive: Bangalore to Savandurga — 55km, 1 Hour", hook:"55km from HSR Layout. No plan. Just filled up the tank and drove.", postTime:"8:00 AM", ready:true },
    { format:"Reel", bucket:"Food & Cooking", title:"I Made This at 9PM on a Wednesday — Budget Meal That Hits", hook:"Wednesday night. Nothing in the fridge. This is what happened.", postTime:"7:00 AM", ready:true },
    { format:"Reel", bucket:"Road Trips", title:"Left HSR at 6AM. No Plan. Here's Where I Ended Up.", hook:"Full tank, no destination. 3 hours later — this.", postTime:"7:30 AM" },
    { format:"Carousel", bucket:"City Life & Cafés", title:"5 Cafés in HSR/Koramangala Worth Filming In", hook:"These aren't just good coffee — they're genuinely good for content.", postTime:"8:00 AM" },
    { format:"Story", bucket:"Men's Style", title:"Rate My Road Trip OOTD — You Pick", hook:"Heading out this weekend. Which outfit?", postTime:"9:00 AM" },
    { format:"Talking Head", bucket:"Road Trips", title:"What I Keep in My Car for Content Creation", hook:"My car is basically a mobile production studio.", postTime:"7:30 AM" },
    { format:"Reel", bucket:"Food & Cooking", title:"Recreating a Café Dish at Home (Went Better Than Expected)", hook:"Paid ₹450 at a café. Made it at home for ₹90. Here's how.", postTime:"7:00 AM" },
    { format:"Reel", bucket:"Weekend Getaways", title:"Drove 60km at 4:30 AM for THIS View — Nandi Hills", hook:"Alarm: 3:45 AM. Car loaded. Destination: Nandi Hills.", postTime:"7:00 AM" },
    { format:"Carousel", bucket:"Weekend Getaways", title:"Nandi Hills: The Complete Guide from HSR Layout", hook:"Everything you need — from someone who drove there at 4:30 AM.", postTime:"8:00 AM" },
    { format:"Vlog", bucket:"Weekend Getaways", title:"Solo Sunrise Vlog — Nandi Hills from Bangalore", hook:"3:45 alarm. Solo drive. Drone at sunrise. The full thing.", postTime:"8:00 AM" },
    { format:"Carousel", bucket:"Men's Style", title:"5 Outfits for Weekend Drives in Bangalore", hook:"You don't need much. But you need the right fit.", postTime:"8:00 AM" },
    { format:"Story", bucket:"Food & Cooking", title:"What Should I Cook This Weekend? (Community Poll)", hook:"I'm cooking Sunday. You're picking the dish.", postTime:"9:00 AM" },
    { format:"Reel", bucket:"Road Trips", title:"Bangalore to Mysore in 3 Hours — Road Trip Reel", hook:"Friday 6PM. Left HSR. 3 hours later — Mysore Palace lit up.", postTime:"7:30 AM" },
    { format:"Vlog", bucket:"Weekend Getaways", title:"Mysore in 36 Hours — The Honest Weekend Guide", hook:"I gave Mysore a weekend. Here's everything I did, ate, filmed.", postTime:"8:00 AM" },
    { format:"Talking Head", bucket:"Working Pro + Travel", title:"Why I Travel Alone Even When I Don't Have To", hook:"I have friends. I could get a group together. I still go alone.", postTime:"7:30 AM" },
    { format:"Reel", bucket:"Food & Cooking", title:"Sunday Cook — Full Meal, Zero Delivery", hook:"It's Sunday. No plans. Just me, the kitchen, and the A7III.", postTime:"7:00 AM" },
    { format:"Carousel", bucket:"Road Trips", title:"5 Best Drives from Bangalore (Under 3 Hours)", hook:"I've driven all of these from HSR Layout. Here's the real ranking.", postTime:"8:00 AM" },
    { format:"Reel", bucket:"Weekend Getaways", title:"The Waterfall 130km from Bangalore Nobody Talks About", hook:"I've shown you Nandi Hills. Mysore. But this one surprised me most.", postTime:"7:00 AM" },
    { format:"Carousel", bucket:"Men's Style", title:"Men's Packing Formula: 10 Items, 30 Outfits", hook:"Pack light. Look good. Here's the exact formula.", postTime:"8:00 AM" },
    { format:"Story", bucket:"City Life & Cafés", title:"This or That: Bangalore Café Edition", hook:"Two cafés. Same vibe. Which would you pick?", postTime:"9:00 AM" },
    { format:"Talking Head", bucket:"Working Pro + Travel", title:"How I Plan a Weekend Trip in 20 Minutes", hook:"I never plan in advance. Here's how I make it work anyway.", postTime:"7:30 AM" },
    { format:"Vlog", bucket:"City Life & Cafés", title:"A Bangalore City Drive — No Destination, Just Vibes", hook:"Sunday evening. No destination. Just the car and a camera.", postTime:"8:00 AM" },
    { format:"Reel", bucket:"Food & Cooking", title:"The One Dish I Make Every Single Week", hook:"I've cooked this at least 50 times. It never gets old.", postTime:"7:00 AM" },
    { format:"Carousel", bucket:"Weekend Getaways", title:"Chikmagalur: Is It Worth the 4.5 Hour Drive?", hook:"245km from HSR Layout. Here's the honest answer.", postTime:"8:00 AM" },
    { format:"Talking Head", bucket:"Men's Style", title:"How I Dress When I'm Not Trying (But Still Look Put-Together)", hook:"Some days I have zero energy for outfits. This is the formula.", postTime:"7:30 AM" },
    { format:"Story", bucket:"Road Trips", title:"Drop Your Bangalore Drive Suggestion (I'll Do It This Weekend)", hook:"Tell me where to drive. I'll film the whole thing.", postTime:"9:00 AM" },
    { format:"Carousel", bucket:"City Life & Cafés", title:"30 Days of Content — Here's What Actually Worked", hook:"I posted every day. Here's what performed, flopped, and what's next.", postTime:"8:00 AM" },
  ];

  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const entry = entries[i] || { format:"Story", bucket:"City Life & Cafés", title:`Day ${i+1} Content`, hook:"Coming soon.", postTime:"8:00 AM" };
    days.push({
      id: i + 1,
      date: d,
      ...entry,
      caption: "",
      cta: "",
      trendLocked: false,
      aiGenerated: false,
    });
  }
  return days;
}

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, maxTokens = 1500) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  const raw = data.content?.map(b => b.text || "").join("") || "";
  const clean = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7, -3).trim())
                   .replace(/```[\s\S]*?```/g, m => m.slice(3, -3).trim())
                   .trim();
  try { return JSON.parse(clean); }
  catch { return { raw: clean }; }
}

const TREND_SYSTEM = `You are a social media trend analyst for Instagram content, specializing in travel, lifestyle, food, and men's fashion niches in India (specifically Bangalore). 

The creator profile:
- Handle: @inside_my_backpack
- Based: HSR Layout, Bangalore
- Lifestyle: Full-time job, weekend getaways by car, café explorer, home cook, men's style
- Gear: Sony A7III, DJI Mini 5 Pro drone, iPhone 15 Pro Max
- Budget: ₹10,000/month travel
- Content buckets: City Life & Cafés, Road Trips, Weekend Getaways, Food & Cooking, Men's Style, Working Pro + Travel

Always respond with valid JSON only. No markdown, no explanation, no preamble.`;

const CALENDAR_SYSTEM = `You are a content strategist building a 30-day Instagram content calendar for @inside_my_backpack.

Creator profile:
- Based: HSR Layout, Bangalore, India
- Full-time job → shoots only on weekends
- Gear: Sony A7III, DJI Mini 5 Pro, iPhone 15 Pro Max
- Budget: ₹10,000/month travel
- Nearby destinations: Nandi Hills (60km), Savandurga (55km), Kanakapura Road (80km), Mysore (150km), Chikmagalur (245km), Shivanasamudra (130km)
- Cafés: Beanlore, Third Wave Coffee, Hole in the Wall, Dialogues Café, Grapevine (all near HSR)
- Content buckets: City Life & Cafés, Road Trips, Weekend Getaways, Food & Cooking, Men's Style, Working Pro + Travel
- Formats: Reel, Carousel, Talking Head, Story, Vlog

Rules:
- Post every day
- Weekday posts come from batched weekend shoots or home content (cooking, styling, talking head)
- Weekend days are shoot days or edit days
- Mix all formats across the week
- Incorporate trending topics naturally into the niche

Always respond with valid JSON only. No markdown, no preamble.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return d.toLocaleDateString("en-IN", { weekday:"short", month:"short", day:"numeric" });
}
function fmtMonth(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function getMonthDates(year, month) {
  const days = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function Pill({ label, color, small }) {
  return (
    <span style={{
      background: color + "20", color, border: `1px solid ${color}35`,
      borderRadius: 5, padding: small ? "1px 7px" : "3px 10px",
      fontSize: small ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap",
      display: "inline-block",
    }}>{label}</span>
  );
}

function Spinner({ size = 16, color = T.accent }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation:"spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" fill="none" strokeDasharray="40" strokeLinecap="round"/>
    </svg>
  );
}

function TrendCard({ trend, isAlert, onAccept, onDismiss }) {
  return (
    <div style={{
      background: isAlert ? T.red + "12" : T.card2,
      border: `1px solid ${isAlert ? T.red + "40" : T.border2}`,
      borderRadius: 10, padding: "12px 14px", marginBottom: 10,
      animation: isAlert ? "pulseAlert 2s ease infinite" : "none",
    }}>
      <style>{`@keyframes pulseAlert{0%,100%{box-shadow:0 0 0 0 ${T.red}30}50%{box-shadow:0 0 0 6px transparent}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
            {isAlert && <Pill label="🚨 BREAKING TREND" color={T.red} small />}
            <Pill label={trend.platform || "Instagram"} color={T.blue} small />
            <Pill label={trend.category || "Trending"} color={T.purple} small />
            {trend.strength && <Pill label={`🔥 ${trend.strength}`} color={T.accent} small />}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3 }}>{trend.title}</div>
          <div style={{ fontSize:11, color:T.text2, lineHeight:1.5, marginBottom:6 }}>{trend.description}</div>
          {trend.contentIdea && (
            <div style={{ fontSize:11, color:T.teal, padding:"5px 8px", background:T.teal+"10", borderRadius:5, borderLeft:`2px solid ${T.teal}` }}>
              💡 {trend.contentIdea}
            </div>
          )}
        </div>
      </div>
      {isAlert && onAccept && (
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button onClick={onAccept} style={{ flex:1, background:T.green+"20", border:`1px solid ${T.green}40`, color:T.green, borderRadius:6, padding:"5px 0", cursor:"pointer", fontSize:11, fontWeight:600 }}>
            ✅ Update Calendar
          </button>
          <button onClick={onDismiss} style={{ flex:1, background:T.red+"15", border:`1px solid ${T.red}30`, color:T.red, borderRadius:6, padding:"5px 0", cursor:"pointer", fontSize:11, fontWeight:600 }}>
            ✕ Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function DayModal({ day, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: day.title, hook: day.hook, caption: day.caption || "", cta: day.cta || "", postTime: day.postTime, format: day.format, bucket: day.bucket });
  if (!day) return null;
  const fmtInfo = FORMATS[day.format] || FORMATS["Reel"];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.card, border:`1px solid ${T.border2}`, borderRadius:16, padding:24, maxWidth:560, width:"100%", maxHeight:"80vh", overflowY:"auto", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"transparent", border:`1px solid ${T.border}`, color:T.text2, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14 }}>✕</button>
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          <Pill label={`${fmtInfo.icon} ${day.format}`} color={fmtInfo.color} />
          <Pill label={day.bucket} color={T.purple} />
          {day.ready && <Pill label="✅ Ready" color={T.green} />}
          {day.aiGenerated && <Pill label="🤖 AI Updated" color={T.blue} />}
          {day.trendLocked && <Pill label="🔥 Trend-Locked" color={T.red} />}
        </div>
        <div style={{ fontSize:11, color:T.text3, marginBottom:12 }}>📅 {fmtDate(day.date)} · ⏰ {day.postTime}</div>
        {editing ? (
          <div>
            {[["Title","title"],["Hook","hook"],["Post Time","postTime"]].map(([l,k])=>(
              <div key={k} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:3 }}>{l.toUpperCase()}</div>
                <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  style={{ width:"100%", background:T.card2, border:`1px solid ${T.border2}`, borderRadius:6, color:T.text, padding:"7px 10px", fontSize:12, outline:"none" }}/>
              </div>
            ))}
            {[["Caption","caption"],["CTA","cta"]].map(([l,k])=>(
              <div key={k} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:3 }}>{l.toUpperCase()}</div>
                <textarea value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} rows={3}
                  style={{ width:"100%", background:T.card2, border:`1px solid ${T.border2}`, borderRadius:6, color:T.text, padding:"7px 10px", fontSize:12, outline:"none", resize:"vertical" }}/>
              </div>
            ))}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{onUpdate({...day,...form});setEditing(false);}} style={{ flex:1, background:T.accent+"20", border:`1px solid ${T.accent}40`, color:T.accent, borderRadius:7, padding:"7px 0", cursor:"pointer", fontWeight:600, fontSize:12 }}>Save Changes</button>
              <button onClick={()=>setEditing(false)} style={{ flex:1, background:T.border, border:`1px solid ${T.border2}`, color:T.text2, borderRadius:7, padding:"7px 0", cursor:"pointer", fontSize:12 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:8, lineHeight:1.4 }}>{day.title}</div>
            {[["🔥 HOOK",day.hook,T.accent],["📣 CAPTION",day.caption||"(not yet generated)",T.text],["💬 CTA",day.cta||"(not yet generated)",T.green]].map(([l,v,c])=>(
              <div key={l} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:12, color:c, lineHeight:1.6, padding:"8px 10px", background:c+"10", borderRadius:6, borderLeft:`2px solid ${c}`, fontStyle:l.includes("HOOK")?"italic":"normal" }}>{v}</div>
              </div>
            ))}
            <button onClick={()=>setEditing(true)} style={{ width:"100%", marginTop:4, background:T.border, border:`1px solid ${T.border2}`, color:T.text2, borderRadius:7, padding:"7px 0", cursor:"pointer", fontSize:12 }}>✏️ Edit Post</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [calendar, setCalendar] = useState(makeSeedCalendar());
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [loading, setLoading] = useState({ trends:false, calendar:false, alert:false });
  const [selectedDay, setSelectedDay] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [calMonth, setCalMonth] = useState({ year:2026, month:4 }); // May 2026
  const [notification, setNotification] = useState(null);
  const [trackerRows, setTrackerRows] = useState(() =>
    makeSeedCalendar().map(d => ({ id:d.id, title:d.title, date:fmtDate(d.date), format:d.format, scripted:d.ready?"✅":"⬜", shot:d.ready?"✅":"⬜", edited:d.ready?"✅":"⬜", captioned:d.ready?"✅":"⬜", posted:"⬜", likes:"",comments:"",reach:"",saves:"" }))
  );
  const scanIntervalRef = useRef(null);

  const showNotif = useCallback((msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch trends via Claude ────────────────────────────────────────────────
  const fetchTrends = useCallback(async () => {
    setLoading(l => ({ ...l, trends:true }));
    try {
      const now = new Date();
      const result = await callClaude(TREND_SYSTEM, `
Simulate current Instagram & social media trends for ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} that are relevant for a Bangalore-based travel/lifestyle/food/men's fashion content creator.

Return JSON: { "trends": [ { "title": string, "description": string, "platform": string, "category": string, "strength": "High|Medium|Low", "contentIdea": string, "hashtags": string[] } ], "month": string, "summary": string }

Generate 6 realistic, India-relevant trends mixing: Instagram Reels trends, travel trends near Bangalore, food trends, men's fashion trends, and creator economy trends. Make them specific and actionable.
      `, 1800);
      if (result.trends) {
        setTrends(result.trends);
        setLastScan(new Date());
        showNotif(`✅ Found ${result.trends.length} trends for ${result.month || "this month"}`, "success");
      }
    } catch (e) {
      showNotif("Failed to fetch trends. Check connection.", "error");
    }
    setLoading(l => ({ ...l, trends:false }));
  }, [showNotif]);

  // ── Generate full AI calendar ──────────────────────────────────────────────
  const generateCalendar = useCallback(async () => {
    setLoading(l => ({ ...l, calendar:true }));
    showNotif("🤖 Claude is building your calendar...", "info");
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      const trendSummary = trends.length > 0
        ? trends.map(t => `- ${t.title}: ${t.description} (${t.strength})`).join("\n")
        : "No specific trends loaded yet — use general seasonal trends for Bangalore.";

      const result = await callClaude(CALENDAR_SYSTEM, `
Generate a 30-day content calendar starting ${startDate.toDateString()}.

Current trends to incorporate:
${trendSummary}

Return JSON array of exactly 30 objects:
[{
  "day": number (1-30),
  "format": "Reel"|"Carousel"|"Talking Head"|"Story"|"Vlog",
  "bucket": one of the 6 buckets,
  "title": string (compelling, specific),
  "hook": string (first 3-5 words that stop the scroll),
  "caption": string (2-3 sentences, engaging, with emoji),
  "cta": string (comment trigger or save trigger),
  "postTime": "7:00 AM"|"7:30 AM"|"8:00 AM"|"9:00 AM",
  "trendUsed": string|null,
  "isShootDay": boolean,
  "isEditDay": boolean
}]

Rules:
- Days 1-5 should be "ready" content (no filming needed — lifestyle, styling tips, talking heads, cooking)
- Include 4 shoot days on Saturdays (days 3, 10, 17, 24) with location-specific content near Bangalore
- Include edit days the day after each shoot
- Mix all 6 buckets evenly
- Use current trends naturally in 30-40% of posts
- Vary formats: approx 10 Reels, 8 Carousels, 5 Talking Heads, 4 Stories, 3 Vlogs
      `, 3000);

      if (Array.isArray(result)) {
        const updated = result.slice(0, 30).map((entry, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return { id: i + 1, date: d, aiGenerated: true, trendLocked: !!entry.trendUsed, ready: i < 5, ...entry };
        });
        setCalendar(updated);
        setTrackerRows(updated.map(d => ({
          id:d.id, title:d.title, date:fmtDate(d.date), format:d.format,
          scripted:d.ready?"✅":"⬜", shot:d.ready?"✅":"⬜",
          edited:d.ready?"✅":"⬜", captioned:d.ready?"✅":"⬜", posted:"⬜",
          likes:"", comments:"", reach:"", saves:""
        })));
        showNotif("✅ AI calendar generated with live trends!", "success");
      }
    } catch (e) {
      showNotif("Calendar generation failed. Try again.", "error");
    }
    setLoading(l => ({ ...l, calendar:false }));
  }, [trends, showNotif]);

  // ── Check for ad-hoc trend alert ──────────────────────────────────────────
  const checkAlerts = useCallback(async () => {
    setLoading(l => ({ ...l, alert:true }));
    try {
      const result = await callClaude(TREND_SYSTEM, `
Simulate detecting a sudden BREAKING ad-hoc trend on Instagram/social media right now that is highly relevant for a Bangalore travel/lifestyle content creator.

This should be an urgent, time-sensitive trend that could replace or supplement a scheduled calendar post.

Return JSON: {
  "hasAlert": true,
  "alert": {
    "title": string,
    "description": string,
    "urgency": "HIGH",
    "platform": string,
    "category": string,
    "strength": string,
    "contentIdea": string,
    "suggestedFormat": string,
    "replaceDayNumber": number (1-7, near-future day to replace),
    "replacementPost": {
      "title": string,
      "hook": string,
      "caption": string,
      "cta": string,
      "format": string,
      "bucket": string
    }
  }
}

Make it realistic — could be a viral hashtag, a place suddenly trending in Bangalore, a food trend going viral, a fashion moment, a Bangalore-specific event, etc.
      `, 1200);

      if (result.hasAlert && result.alert) {
        setPendingAlert(result.alert);
        setAlerts(prev => [{ ...result.alert, timestamp: new Date() }, ...prev.slice(0, 9)]);
        showNotif("🚨 Breaking trend detected! Review in Alerts tab.", "alert");
      }
    } catch (e) {}
    setLoading(l => ({ ...l, alert:false }));
  }, [showNotif]);

  // ── Accept alert — update calendar ────────────────────────────────────────
  const acceptAlert = useCallback(() => {
    if (!pendingAlert) return;
    const dayNum = pendingAlert.replaceDayNumber || 1;
    setCalendar(prev => prev.map(d => {
      if (d.id !== dayNum) return d;
      return { ...d, ...pendingAlert.replacementPost, trendLocked:true, aiGenerated:true };
    }));
    showNotif(`✅ Day ${dayNum} updated with trending content!`, "success");
    setPendingAlert(null);
  }, [pendingAlert, showNotif]);

  // ── Auto-scan every 5 min (simulated) ────────────────────────────────────
  useEffect(() => {
    scanIntervalRef.current = setInterval(() => {
      const r = Math.random();
      if (r < 0.15) checkAlerts();
    }, 60000);
    return () => clearInterval(scanIntervalRef.current);
  }, [checkAlerts]);

  // ─── UI SECTIONS ────────────────────────────────────────────────────────────

  const calDays = getMonthDates(calMonth.year, calMonth.month);
  const firstDow = calDays[0].getDay(); // 0=Sun
  const calOffset = firstDow === 0 ? 6 : firstDow - 1;

  // ─── DASHBOARD ──────────────────────────────────────────────────────────────
  const DashboardView = () => {
    const readyCount = calendar.filter(d=>d.ready).length;
    const trendCount = calendar.filter(d=>d.trendLocked).length;
    const postsByBucket = PROFILE.buckets.reduce((acc,b)=>({ ...acc, [b]:calendar.filter(d=>d.bucket===b).length }), {});
    const bucketColors = [T.teal,T.accent,T.blue,T.red,T.purple,T.green];

    return (
      <div>
        {/* Stats Row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"Posts This Month", val:calendar.length, color:T.accent, icon:"📅" },
            { label:"Ready to Post", val:readyCount, color:T.green, icon:"✅" },
            { label:"Trend-Locked Posts", val:trendCount, color:T.red, icon:"🔥" },
            { label:"Active Alerts", val:alerts.length, color:T.purple, icon:"🚨" },
          ].map(s => (
            <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:26, fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums" }}>{s.val}</div>
              <div style={{ fontSize:10, color:T.text3, fontWeight:500, marginTop:2, letterSpacing:.5 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* AI Actions */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:18, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🤖 AI Content Engine</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <ActionBtn icon="🌐" label="Scan Live Trends" sub={lastScan ? `Last: ${lastScan.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}` : "Never scanned"} color={T.blue} loading={loading.trends} onClick={fetchTrends} />
            <ActionBtn icon="📅" label="Generate AI Calendar" sub={trends.length > 0 ? `${trends.length} trends loaded` : "Load trends first"} color={T.accent} loading={loading.calendar} onClick={generateCalendar} />
            <ActionBtn icon="🚨" label="Check Alert Trends" sub={pendingAlert ? "1 alert pending!" : "Scan for breaking trends"} color={T.red} loading={loading.alert} onClick={checkAlerts} pulse={!!pendingAlert} />
          </div>
        </div>

        {/* Bucket breakdown */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:18, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🗂️ Content Bucket Mix</div>
          {PROFILE.buckets.map((b,i) => {
            const count = postsByBucket[b] || 0;
            const pct = Math.round(count / calendar.length * 100);
            return (
              <div key={b} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:12, color:T.text2 }}>{b}</span>
                  <span style={{ fontSize:11, color:bucketColors[i], fontWeight:600 }}>{count} posts ({pct}%)</span>
                </div>
                <div style={{ height:5, background:T.border, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:bucketColors[i], borderRadius:3, transition:"width .5s" }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending alert */}
        {pendingAlert && (
          <div style={{ background:T.card, border:`1px solid ${T.red}40`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.red, marginBottom:10 }}>🚨 Action Required — Breaking Trend</div>
            <TrendCard trend={pendingAlert} isAlert onAccept={acceptAlert} onDismiss={()=>setPendingAlert(null)} />
          </div>
        )}
      </div>
    );
  };

  function ActionBtn({ icon, label, sub, color, loading:l, onClick, pulse }) {
    return (
      <button onClick={onClick} disabled={l} style={{
        background: l ? T.border : color + "15",
        border: `1px solid ${color}${l?"20":"40"}`,
        borderRadius:10, padding:"12px 10px", cursor: l ? "default":"pointer",
        textAlign:"left", transition:"all .15s", width:"100%",
        animation: pulse ? "pulseBtn 1.5s ease infinite" : "none",
      }}>
        <style>{`@keyframes pulseBtn{0%,100%{border-color:${color}40}50%{border-color:${color}}}`}</style>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          {l && <Spinner size={14} color={color}/>}
        </div>
        <div style={{ fontSize:12, fontWeight:600, color: l ? T.text3 : color, marginTop:6 }}>{label}</div>
        <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>{sub}</div>
      </button>
    );
  }

  // ─── CALENDAR VIEW ──────────────────────────────────────────────────────────
  const CalendarView = () => {
    const monthCalDays = getMonthDates(calMonth.year, calMonth.month);
    const offset = (() => { const d = monthCalDays[0].getDay(); return d===0?6:d-1; })();
    const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <button onClick={()=>setCalMonth(m=>{ const d=new Date(m.year,m.month-1,1); return {year:d.getFullYear(),month:d.getMonth()}; })}
            style={{ background:T.card, border:`1px solid ${T.border}`, color:T.text2, borderRadius:7, padding:"5px 12px", cursor:"pointer" }}>← Prev</button>
          <span style={{ fontSize:16, fontWeight:700, color:T.text }}>{MONTH_NAMES[calMonth.month]} {calMonth.year}</span>
          <button onClick={()=>setCalMonth(m=>{ const d=new Date(m.year,m.month+1,1); return {year:d.getFullYear(),month:d.getMonth()}; })}
            style={{ background:T.card, border:`1px solid ${T.border}`, color:T.text2, borderRadius:7, padding:"5px 12px", cursor:"pointer" }}>Next →</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:6 }}>
          {DOW.map(d=><div key={d} style={{ textAlign:"center", fontSize:9, color:T.text3, fontWeight:600, letterSpacing:.8, padding:"2px 0" }}>{d.toUpperCase()}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {Array(offset).fill(null).map((_,i)=><div key={"pad"+i}/>)}
          {monthCalDays.map((date, idx) => {
            const calEntry = calendar.find(d => d.date.toDateString()===date.toDateString());
            const isToday = date.toDateString()===new Date().toDateString();
            const fmtInfo = calEntry ? (FORMATS[calEntry.format]||FORMATS["Reel"]) : null;
            return (
              <div key={idx} onClick={()=>calEntry&&setSelectedDay(calEntry)} style={{
                background: calEntry?.trendLocked ? T.red+"18" : calEntry?.aiGenerated ? T.blue+"12" : T.card,
                border: `1.5px solid ${isToday?T.accent:calEntry?.trendLocked?T.red+"50":T.border}`,
                borderRadius:8, padding:"6px 6px 7px", minHeight:74, cursor:calEntry?"pointer":"default",
                transition:"all .1s",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontSize:10, color:isToday?T.accent:T.text3, fontWeight:isToday?700:400 }}>{date.getDate()}</span>
                  {calEntry?.trendLocked && <span style={{ fontSize:8, color:T.red }}>🔥</span>}
                  {calEntry?.aiGenerated && !calEntry.trendLocked && <span style={{ fontSize:8, color:T.blue }}>🤖</span>}
                </div>
                {calEntry && <>
                  <div style={{ fontSize:9, color:fmtInfo?.color, fontWeight:600, marginBottom:1 }}>{fmtInfo?.icon} {calEntry.format}</div>
                  <div style={{ fontSize:9, color:T.text2, lineHeight:1.25 }}>{calEntry.title?.slice(0,38)}{calEntry.title?.length>38?"…":""}</div>
                  <div style={{ fontSize:8, color:T.text3, marginTop:2 }}>⏰ {calEntry.postTime}</div>
                  {calEntry.ready && <div style={{ fontSize:7, color:T.green, fontWeight:700, marginTop:1 }}>✅ READY</div>}
                </>}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
          {[["🔥 Trend-locked",T.red],["🤖 AI-generated",T.blue],["✅ Ready to post",T.green]].map(([l,c])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c }}/>
              <span style={{ fontSize:10, color:T.text3 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── TRENDS VIEW ────────────────────────────────────────────────────────────
  const TrendsView = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Live Trend Monitor</div>
          <div style={{ fontSize:11, color:T.text3 }}>{lastScan ? `Last scan: ${lastScan.toLocaleTimeString("en-IN")}` : "Not yet scanned"}</div>
        </div>
        <button onClick={fetchTrends} disabled={loading.trends} style={{ background:T.blue+"20", border:`1px solid ${T.blue}40`, color:T.blue, borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          {loading.trends ? <><Spinner size={12} color={T.blue}/> Scanning...</> : "🔄 Scan Now"}
        </button>
      </div>

      {pendingAlert && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.red, marginBottom:8 }}>🚨 Breaking Alert — Action Required</div>
          <TrendCard trend={pendingAlert} isAlert onAccept={acceptAlert} onDismiss={()=>setPendingAlert(null)} />
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.text2, marginBottom:8 }}>Recent Alert History</div>
          {alerts.slice(0,3).map((a,i)=>(
            <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px", marginBottom:6, opacity:.7 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:T.text }}>{a.title}</span>
                <span style={{ fontSize:10, color:T.text3 }}>{a.timestamp?.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {trends.length === 0 ? (
        <div style={{ background:T.card, border:`1px dashed ${T.border2}`, borderRadius:12, padding:"32px 20px", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:14, color:T.text2, marginBottom:6 }}>No trends loaded yet</div>
          <div style={{ fontSize:12, color:T.text3 }}>Click "Scan Now" to fetch current Instagram & social media trends</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:12, color:T.text3, marginBottom:10 }}>{trends.length} trends found · Sorted by relevance</div>
          {trends.map((t,i) => <TrendCard key={i} trend={t} />)}
        </div>
      )}
    </div>
  );

  // ─── TRACKER VIEW ────────────────────────────────────────────────────────────
  const TrackerView = () => {
    const phases = ["scripted","shot","edited","captioned","posted"];
    const toggle = (i,f) => setTrackerRows(prev=>prev.map((r,idx)=>idx!==i?r:{...r,[f]:r[f]==="✅"?"⬜":"✅"}));
    const update = (i,f,v) => setTrackerRows(prev=>prev.map((r,idx)=>idx!==i?r:{...r,[f]:v}));
    const pct = r => Math.round(phases.filter(p=>r[p]==="✅").length/phases.length*100);

    return (
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
          <thead>
            <tr style={{ background:T.surface }}>
              {["#","Title","Date","Format","Progress",...phases,"Likes","Comments","Reach","Saves"].map(h=>(
                <th key={h} style={{ padding:"7px 8px", textAlign:"left", color:T.text3, fontWeight:600, fontSize:9, letterSpacing:.8, borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trackerRows.map((row,idx)=>{
              const p=pct(row); const fi=FORMATS[row.format];
              return (
                <tr key={idx} style={{ borderBottom:`1px solid ${T.border}`, background:idx%2===0?T.card:T.surface }}>
                  <td style={{ padding:"5px 8px", color:T.text3, fontWeight:600 }}>{row.id}</td>
                  <td style={{ padding:"5px 8px", color:T.text, maxWidth:160, overflow:"hidden", whiteSpace:"nowrap" }}>{row.title?.slice(0,30)}{row.title?.length>30?"…":""}</td>
                  <td style={{ padding:"5px 8px", color:T.text3, whiteSpace:"nowrap" }}>{row.date}</td>
                  <td style={{ padding:"5px 8px" }}>
                    <span style={{ fontSize:9, background:fi?.color+"20", color:fi?.color, borderRadius:4, padding:"1px 6px", fontWeight:600 }}>{fi?.icon} {row.format}</span>
                  </td>
                  <td style={{ padding:"5px 8px", minWidth:80 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ flex:1, height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
                        <div style={{ width:`${p}%`, height:"100%", background:p===100?T.green:T.accent, borderRadius:2 }}/>
                      </div>
                      <span style={{ fontSize:9, color:p===100?T.green:T.text2, fontWeight:600, minWidth:24 }}>{p}%</span>
                    </div>
                  </td>
                  {phases.map(ph=>(
                    <td key={ph} style={{ padding:"5px 8px", textAlign:"center" }}>
                      <span onClick={()=>toggle(idx,ph)} style={{ cursor:"pointer", fontSize:13, userSelect:"none" }}>{row[ph]}</span>
                    </td>
                  ))}
                  {["likes","comments","reach","saves"].map(m=>(
                    <td key={m} style={{ padding:"3px 5px" }}>
                      <input value={row[m]} onChange={e=>update(idx,m,e.target.value)} placeholder="—"
                        style={{ width:52, background:"transparent", border:`1px solid ${T.border}`, borderRadius:4, color:T.text, padding:"2px 5px", fontSize:10, outline:"none" }}/>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ─── POST LIST ───────────────────────────────────────────────────────────────
  const PostListView = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:13, color:T.text2 }}>{calendar.length} posts · Click any to edit</div>
        <button onClick={generateCalendar} disabled={loading.calendar} style={{ background:T.accent+"20", border:`1px solid ${T.accent}40`, color:T.accent, borderRadius:7, padding:"6px 12px", cursor:"pointer", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
          {loading.calendar ? <><Spinner size={11} color={T.accent}/> Generating...</> : "🤖 Regenerate"}
        </button>
      </div>
      {calendar.map(day => {
        const fi = FORMATS[day.format] || FORMATS["Reel"];
        return (
          <div key={day.id} onClick={()=>setSelectedDay(day)} style={{ background:T.card, border:`1px solid ${day.trendLocked?T.red+"50":T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:7, cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start", transition:"all .12s" }}>
            <div style={{ flexShrink:0, width:40, textAlign:"center" }}>
              <div style={{ fontSize:10, color:T.text3, fontWeight:600 }}>D{day.id}</div>
              <div style={{ fontSize:9, color:T.text3 }}>{fmtDate(day.date).split(",")[0]}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:5, marginBottom:4, flexWrap:"wrap" }}>
                <Pill label={`${fi.icon} ${day.format}`} color={fi.color} small />
                <Pill label={day.bucket} color={T.purple} small />
                {day.ready && <Pill label="✅" color={T.green} small />}
                {day.trendLocked && <Pill label="🔥 Trending" color={T.red} small />}
                {day.aiGenerated && <Pill label="🤖 AI" color={T.blue} small />}
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:T.text, lineHeight:1.3, marginBottom:2 }}>{day.title}</div>
              <div style={{ fontSize:11, color:T.text3 }}>⏰ {day.postTime} · {day.hook?.slice(0,60)}{day.hook?.length>60?"…":""}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── NAV ─────────────────────────────────────────────────────────────────────
  const NAV = [
    { id:"dashboard", icon:"⚡", label:"Dashboard" },
    { id:"calendar",  icon:"📅", label:"Calendar" },
    { id:"posts",     icon:"📋", label:"Post List" },
    { id:"trends",    icon:"🌐", label:"Trends" + (trends.length>0?` (${trends.length})` : "") },
    { id:"tracker",   icon:"📊", label:"Tracker" },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'DM Sans','Nunito Sans','Inter',system-ui,sans-serif", color:T.text, display:"flex", flexDirection:"column" }}>

      {/* Global notification */}
      {notification && (
        <div style={{
          position:"fixed", top:16, right:16, zIndex:2000,
          background: notification.type==="error"?T.red+"20":notification.type==="success"?T.green+"20":notification.type==="alert"?T.red+"25":T.blue+"20",
          border:`1px solid ${notification.type==="error"?T.red:notification.type==="success"?T.green:notification.type==="alert"?T.red:T.blue}50`,
          borderRadius:10, padding:"10px 16px", maxWidth:320, fontSize:12, color:T.text,
          animation:"slideIn .3s ease",
          boxShadow:"0 8px 24px rgba(0,0,0,.4)",
        }}>
          <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:none;opacity:1}}`}</style>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:`linear-gradient(135deg,${T.accent},${T.amber})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>🎒</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:-.3, lineHeight:1 }}>@inside_my_backpack</div>
            <div style={{ fontSize:10, color:T.text3, marginTop:1 }}>AI Content OS · HSR Layout, Bangalore</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {pendingAlert && <div style={{ width:8, height:8, borderRadius:"50%", background:T.red, animation:"blink 1s ease infinite" }}/>}
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
          <div style={{ fontSize:10, color:T.text3 }}>
            {loading.trends||loading.calendar||loading.alert ? <span style={{ color:T.accent, display:"flex", alignItems:"center", gap:4 }}><Spinner size={10} color={T.accent}/> AI working…</span> : "● Live"}
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", overflowX:"auto", flexShrink:0 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={()=>setView(n.id)} style={{
            background:"transparent", border:"none", borderBottom:`2px solid ${view===n.id?T.accent:"transparent"}`,
            color:view===n.id?T.accent:T.text3, padding:"10px 14px", cursor:"pointer",
            fontSize:11, fontWeight:600, whiteSpace:"nowrap", transition:"all .12s",
          }}>{n.icon} {n.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
        {view==="dashboard" && <DashboardView/>}
        {view==="calendar"  && <CalendarView/>}
        {view==="posts"     && <PostListView/>}
        {view==="trends"    && <TrendsView/>}
        {view==="tracker"   && <TrackerView/>}
      </div>

      {/* Day Modal */}
      {selectedDay && (
        <DayModal
          day={selectedDay}
          onClose={()=>setSelectedDay(null)}
          onUpdate={updated=>{
            setCalendar(prev=>prev.map(d=>d.id===updated.id?updated:d));
            setSelectedDay(updated);
            showNotif("Post updated ✅","success");
          }}
        />
      )}
    </div>
  );
}
