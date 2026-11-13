import { useState, useEffect, useRef, useCallback } from "react";
import { callClaude, agentChat, SYSTEMS } from "./api";
import { PROFILE } from "./data";
import { T, Pill, Spinner, Btn, PrimaryBtn, Card, Label, Markdown, PageHeader, inputStyle, saveStats } from "./ui";
import { BarChart3, Bot, Youtube, Wallet, Rocket, Instagram, Sparkles, Trash2, Send, Lightbulb, Clapperboard, Map, Mail, Save } from "lucide-react";

const fmtN = (n) => (Number(n) || 0).toLocaleString("en-IN");
const Section = ({ icon, color, title, sub, right, children }) => (
  <div>
    <PageHeader icon={icon} color={color} title={title} sub={sub} right={right}/>
    {children}
  </div>
);

function statsSummary(s) {
  return `Instagram: ${fmtN(s.igFollowers)} followers, ~${fmtN(s.igAvgReelViews)} avg Reel views, ${s.igEngagementRate || 0}% engagement.
YouTube: ${fmtN(s.ytSubscribers)} subscribers, ${fmtN(s.ytWatchHours12mo)} public watch hours (last 12 months), ${fmtN(s.ytShortsViews90d)} Shorts views (last 90 days), ${s.ytUploads90d || 0} uploads in last 90 days, ~${fmtN(s.ytAvgViews)} avg long-form views.
Creator's stated goal: ${s.goal || "not set"}.`;
}

// ─── CREATOR STATS ────────────────────────────────────────────────────────────
export function StatsSection({ stats, setStats, showNotif }) {
  const [form, setForm] = useState(stats);
  const fields = [
    ["igFollowers","Instagram followers"],["igAvgReelViews","Avg Reel views"],["igEngagementRate","IG engagement rate (%)"],
    ["ytSubscribers","YouTube subscribers"],["ytWatchHours12mo","Public watch hours (12 mo)"],["ytShortsViews90d","Shorts views (90 days)"],
    ["ytUploads90d","Public uploads (90 days)"],["ytAvgViews","Avg long-form views"],
  ];
  const save = () => {
    const clean = { ...form };
    fields.forEach(([k]) => { clean[k] = Number(clean[k]) || 0; });
    setStats(clean); saveStats(clean);
    showNotif("✅ Stats saved — the agent will use these numbers", "success");
  };
  return (
    <Section icon={BarChart3} color={T.teal} title="My Stats" sub="Copy these from Instagram's Professional Dashboard and YouTube Studio → Analytics. They're saved on this device only.">
      <Card style={{maxWidth:720}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(210px,100%),1fr))",gap:12,marginBottom:14}}>
          {fields.map(([k,l]) => (
            <div key={k}>
              <Label>{l}</Label>
              <input type="number" min="0" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={inputStyle}/>
            </div>
          ))}
        </div>
        <Label>Main goal (next 90 days)</Label>
        <input value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} style={{...inputStyle,marginBottom:14}}/>
        <Btn onClick={save} color={T.green}><Save size={15}/>Save stats</Btn>
      </Card>
    </Section>
  );
}

// ─── CREATOR AGENT (chat) ─────────────────────────────────────────────────────
const MODES = {
  growth:   { icon:Rocket, label:"Growth Strategist", color:T.accent,
    brief:"Focus on audience growth: content-market fit, hooks, posting cadence, Reels/Shorts discovery, collabs, community, and profile/channel optimisation." },
  youtube:  { icon:Youtube, label:"YouTube Coach", color:T.red,
    brief:"Focus on YouTube: video ideas with search demand, titles, thumbnails, retention structure, Shorts→long-form funnel, channel packaging, and getting to YouTube Partner Program eligibility." },
  instagram:{ icon:Instagram, label:"Instagram Coach", color:T.pink,
    brief:"Focus on Instagram: Reels hooks, carousels for saves/shares, Stories for community, Trial Reels, collabs, bio/highlights, and DM-share-driven reach." },
  money:    { icon:Wallet, label:"Monetization Coach", color:T.green,
    brief:"Focus on monetization: brand deals and pricing, pitching, affiliate, YouTube Partner Program, Instagram creator monetisation tools, digital products, and local partnerships — with realistic INR estimates and ASCI disclosure rules." },
};

const QUICK = [
  "Audit my current numbers and tell me the 3 biggest levers for growth this month",
  "Give me a 4-week plan to post on BOTH Instagram and YouTube with only weekend shooting time",
  "What should my first 10 YouTube videos be? Include titles with real search demand",
  "How do I turn one weekend trip into 1 YouTube video + 5 Reels/Shorts + 2 carousels?",
  "Which brands in India should I pitch first at my size, and what should I charge?",
  "What's the fastest realistic path to my first ₹10,000 from content?",
];

const HISTORY_KEY = "imb_agent_history_v1";

function buildSystem(mode, stats, calendar, trends) {
  const upcoming = (calendar || []).slice(0, 10).map(d => `- ${d.title} (${d.format}, ${d.bucket})`).join("\n");
  const tr = (trends || []).slice(0, 6).map(t => `- ${t.title}`).join("\n");
  return `You are the personal content-creation, growth and monetization agent for ${PROFILE.handle}, a creator on Instagram and YouTube.

## Creator profile
- Base: ${PROFILE.base}. Full-time job; shoots on weekends, edits weekday evenings.
- Gear: ${PROFILE.gear.join(", ")}. Travel budget ${PROFILE.budget}.
- Content buckets: ${PROFILE.buckets.join(", ")}.
- Lifestyle: ${PROFILE.lifestyle.join(", ")}.

## Current numbers
${statsSummary(stats)}

## Planned content (next posts on the calendar)
${upcoming || "(calendar empty)"}

## Tracked trends
${tr || "(none scanned yet)"}

## How to work
- ${MODES[mode].brief}
- Be a hands-on operator, not a lecturer: give concrete next actions, specific titles/hooks/scripts, numbers and deadlines tailored to this creator's niche, city and limited time.
- Use web search when the answer depends on current facts (platform policy or monetization thresholds, trending audio/topics, brand programs, recent algorithm changes) and say what you found.
- When numbers are missing or zero, say what to measure and still give a best plan.
- Money estimates must be labelled as estimate ranges in INR. Never promise outcomes. Remind about ASCI disclosure (#ad / Paid partnership) where relevant.
- Never suggest buying followers, engagement pods, follow/unfollow, or anything that violates platform rules.
- Keep replies scannable: short headings, bullets, bold for key actions. Aim for under ~400 words unless asked for a full plan or script.`;
}

export function AgentSection({ stats, calendar, trends }) {
  const [mode, setMode] = useState("growth");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40))); } catch {}
  }, [history]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [history, streaming]);

  const send = useCallback(async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput(""); setError(null); setBusy(true); setStreaming("");
    const next = [...history, { role:"user", content:q, display:q }];
    setHistory(next);
    try {
      // API history: strip UI-only fields.
      const apiHistory = next.map(m => ({ role:m.role, content:m.content }));
      const { text: reply, content } = await agentChat(
        buildSystem(mode, stats, calendar, trends), apiHistory, { onText:setStreaming });
      setHistory(h => [...h, { role:"assistant", content: content.length ? content : [{ type:"text", text: reply || "(no reply)" }], display:reply, mode }]);
    } catch (e) {
      setError(e.message || "Agent request failed");
      setHistory(h => h.slice(0, -1)); setInput(q);
    }
    setStreaming(""); setBusy(false);
  }, [input, busy, history, mode, stats, calendar, trends]);

  return (
    <Section
      icon={Bot} color={T.accent}
      title="Creator Agent"
      sub="Your growth + monetization co-pilot for Instagram & YouTube. Knows your profile, stats, calendar and trends — and searches the web for current info."
      right={history.length>0 && <Btn small color={T.text3} onClick={()=>{ if(window.confirm("Clear the conversation?")) setHistory([]); }}><Trash2 size={13}/>Clear chat</Btn>}
    >
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {Object.entries(MODES).map(([k,m]) => (
          <Pill key={k} label={<><m.icon size={14}/>{m.label}</>} color={mode===k?m.color:T.text3} onClick={()=>setMode(k)}/>
        ))}
      </div>

      <Card className="chat-card" style={{padding:0,display:"flex",flexDirection:"column",height:"calc(100vh - 290px)",minHeight:440}}>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {history.length===0 && !busy && (
            <div>
              <div className="display" style={{fontSize:20,fontWeight:600,color:T.text,marginBottom:4}}>What are we creating today?</div>
              <div style={{fontSize:13,color:T.text3,marginBottom:14}}>Ask anything, or start with one of these:</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(260px,100%),1fr))",gap:8}}>
                {QUICK.map(q => (
                  <button key={q} onClick={()=>send(q)} style={{textAlign:"left",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border2}`,borderRadius:14,padding:"12px 14px",color:T.text,fontSize:13,cursor:"pointer",lineHeight:1.45,fontFamily:"inherit",display:"flex",gap:10,alignItems:"flex-start"}}><Sparkles size={15} color={T.amber} style={{flexShrink:0,marginTop:2}}/>{q}</button>
                ))}
              </div>
              {!stats.igFollowers && !stats.ytSubscribers && (
                <div style={{fontSize:11,color:T.orange,marginTop:14}}>💡 Tip: add your numbers in <strong>📈 My Stats</strong> so advice is tailored to your actual size.</div>
              )}
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>
              <div style={{maxWidth:"85%",background:m.role==="user"?"linear-gradient(135deg, rgba(255,122,69,.22), rgba(255,79,139,.18))":"rgba(255,255,255,0.05)",border:`1px solid ${m.role==="user"?T.accent+"45":T.border2}`,borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"11px 15px"}}>
                {m.role==="user"
                  ? <div style={{fontSize:13,color:T.text,whiteSpace:"pre-wrap"}}>{m.display}</div>
                  : <Markdown text={m.display}/>}
              </div>
            </div>
          ))}
          {busy && (
            <div style={{display:"flex",marginBottom:12}}>
              <div style={{maxWidth:"85%",background:T.card2,border:`1px solid ${T.border2}`,borderRadius:12,padding:"10px 14px"}}>
                {streaming ? <Markdown text={streaming}/> : <div style={{display:"flex",gap:8,alignItems:"center",color:T.text2,fontSize:12}}><Spinner size={14}/>Thinking & researching…</div>}
              </div>
            </div>
          )}
          {error && <div style={{fontSize:12,color:T.red,marginBottom:8}}>❌ {error}</div>}
          <div ref={endRef}/>
        </div>
        <div style={{borderTop:`1px solid ${T.border}`,padding:12,display:"flex",gap:8,background:T.surface,borderRadius:"0 0 12px 12px"}}>
          <textarea
            value={input} onChange={e=>setInput(e.target.value)} rows={2}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder={`Ask your ${MODES[mode].label}…`}
            style={{...inputStyle,resize:"none",flex:1}}
          />
          <PrimaryBtn onClick={()=>send()} disabled={busy||!input.trim()} style={{alignSelf:"stretch",padding:"0 18px"}}>{busy?<Spinner size={14} color="#fff"/>:<Send size={17}/>}</PrimaryBtn>
        </div>
      </Card>
    </Section>
  );
}

// ─── YOUTUBE STUDIO ───────────────────────────────────────────────────────────
export function YouTubeSection({ stats, showNotif }) {
  const [idea, setIdea] = useState("");
  const [kind, setKind] = useState("Long-form");
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const genIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const r = await callClaude(SYSTEMS.youtube, `Channel stats: ${statsSummary(stats)}

Suggest 8 YouTube video ideas this creator can shoot on a weekend from Bangalore that have real search or browse demand. Mix long-form and Shorts.
Return JSON array: [{"title":string,"type":"Long-form"|"Short","why":string (search/browse demand reasoning),"searchTerm":string,"effort":"Low"|"Medium"|"High"}]`);
      if (Array.isArray(r)) setIdeas(r); else showNotif("Couldn't parse ideas — try again", "error");
    } catch (e) { showNotif(`Idea generation failed: ${e.message}`, "error"); }
    setLoadingIdeas(false);
  };

  const generate = async (topic = idea, type = kind) => {
    if (!topic.trim()) return;
    setIdea(topic); setKind(type); setLoading(true); setPkg(null);
    try {
      const r = await callClaude(SYSTEMS.youtube, `Build a complete YouTube upload package.
Video idea: "${topic}"
Type: ${type}
Channel stats: ${statsSummary(stats)}

Return JSON:
{
  "titles": [{"title":string,"angle":string,"score":number 1-100}] (5 options, best first),
  "thumbnails": [{"concept":string,"text":string (max 4 words),"shot":string (which camera/drone shot to grab)}] (3),
  "hook": string (first 30 seconds word-for-word${type==="Short"?" — for a Short, first 2 seconds":""}),
  "outline": [{"time":string,"section":string,"notes":string}],
  "description": string (SEO description, first 2 lines are the hook, include chapters if long-form and affiliate/gear placeholder lines),
  "tags": string[] (12-15),
  "pinnedComment": string,
  "shorts": [{"title":string,"cut":string}] (3 Shorts/Reels to cut from this video; empty if type is Short),
  "instagram": {"reelHook":string,"caption":string,"carouselIdea":string},
  "endScreen": string (which video to push next and the line to say)
}`);
      if (r.titles) setPkg(r); else showNotif("Couldn't parse package — try again", "error");
    } catch (e) { showNotif(`Package generation failed: ${e.message}`, "error"); }
    setLoading(false);
  };

  const copy = (t) => { navigator.clipboard?.writeText(t); showNotif("📋 Copied", "success"); };

  return (
    <Section icon={Youtube} color={T.red} title="YouTube Studio" sub="Turn an idea into a full upload package — titles, thumbnails, hook, chapters, SEO, Shorts cut-downs and an Instagram repurpose.">
      <Card style={{marginBottom:14}}>
        <Label>Video idea</Label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={idea} onChange={e=>setIdea(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}
            placeholder="e.g. Bangalore to Chikmagalur in ₹3,000 — full weekend plan" style={{...inputStyle,flex:1,minWidth:240}}/>
          {["Long-form","Short"].map(k => <Pill key={k} label={k} color={kind===k?T.red:T.text3} onClick={()=>setKind(k)}/>)}
          <Btn onClick={()=>generate()} disabled={loading||!idea.trim()} color={T.red}>{loading?<><Spinner size={12} color={T.red}/>Building…</>:<><Clapperboard size={15}/>Build package</>}</Btn>
          <Btn onClick={genIdeas} disabled={loadingIdeas} color={T.purple}>{loadingIdeas?<><Spinner size={12} color={T.purple}/>Thinking…</>:<><Lightbulb size={15}/>Suggest ideas</>}</Btn>
        </div>
      </Card>

      {ideas.length>0 && !pkg && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:10,marginBottom:14}}>
          {ideas.map((it,i) => (
            <Card key={i} style={{padding:14}}>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <Pill small label={it.type} color={it.type==="Short"?T.pink:T.red}/>
                <Pill small label={`Effort: ${it.effort}`} color={T.text3}/>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>{it.title}</div>
              <div style={{fontSize:11,color:T.text2,marginBottom:6,lineHeight:1.5}}>{it.why}</div>
              <div style={{fontSize:10,color:T.teal,marginBottom:8}}>🔎 {it.searchTerm}</div>
              <Btn small color={T.red} onClick={()=>generate(it.title, it.type)}>Build package →</Btn>
            </Card>
          ))}
        </div>
      )}

      {pkg && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(320px,100%),1fr))",gap:12}}>
          <Card>
            <Label>Titles</Label>
            {pkg.titles?.map((t,i)=>(
              <div key={i} onClick={()=>copy(t.title)} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:13,color:T.text,fontWeight:600}}>{t.title}</span>
                  <span style={{fontSize:10,color:t.score>80?T.green:T.accent,fontWeight:700}}>{t.score}</span>
                </div>
                <div style={{fontSize:10,color:T.text3}}>{t.angle} · {t.title.length} chars</div>
              </div>
            ))}
          </Card>
          <Card>
            <Label>Thumbnail concepts</Label>
            {pkg.thumbnails?.map((t,i)=>(
              <div key={i} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:800,color:T.amber}}>"{t.text}"</div>
                <div style={{fontSize:12,color:T.text2}}>{t.concept}</div>
                <div style={{fontSize:10,color:T.teal}}>📷 {t.shot}</div>
              </div>
            ))}
          </Card>
          <Card>
            <Label>Hook</Label>
            <div style={{fontSize:13,color:T.accent,fontStyle:"italic",lineHeight:1.6,marginBottom:12}}>"{pkg.hook}"</div>
            <Label>Outline</Label>
            {pkg.outline?.map((o,i)=>(
              <div key={i} style={{display:"flex",gap:10,fontSize:12,padding:"4px 0"}}>
                <code style={{color:T.teal,flexShrink:0}}>{o.time}</code>
                <div><strong style={{color:T.text}}>{o.section}</strong> <span style={{color:T.text2}}>— {o.notes}</span></div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between"}}><Label>Description</Label><Btn small onClick={()=>copy(pkg.description)}>Copy</Btn></div>
            <pre style={{fontSize:11,color:T.text2,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:"6px 0 12px",lineHeight:1.6}}>{pkg.description}</pre>
            <div style={{display:"flex",justifyContent:"space-between"}}><Label>Tags</Label><Btn small onClick={()=>copy((pkg.tags||[]).join(", "))}>Copy</Btn></div>
            <div style={{fontSize:11,color:T.blue,lineHeight:1.8}}>{(pkg.tags||[]).join(", ")}</div>
          </Card>
          <Card>
            <Label>Repurpose</Label>
            {pkg.shorts?.map((s,i)=>(
              <div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                <strong style={{color:T.pink}}>Short {i+1}: {s.title}</strong><div style={{color:T.text2}}>{s.cut}</div>
              </div>
            ))}
            {pkg.instagram && (
              <div style={{marginTop:10,fontSize:12,color:T.text2,lineHeight:1.6}}>
                <div><strong style={{color:T.text}}>📸 Reel hook:</strong> {pkg.instagram.reelHook}</div>
                <div><strong style={{color:T.text}}>Caption:</strong> {pkg.instagram.caption}</div>
                <div><strong style={{color:T.text}}>Carousel:</strong> {pkg.instagram.carouselIdea}</div>
              </div>
            )}
          </Card>
          <Card>
            <Label>Pinned comment</Label>
            <div style={{fontSize:12,color:T.text2,marginBottom:12}}>{pkg.pinnedComment}</div>
            <Label>End screen</Label>
            <div style={{fontSize:12,color:T.text2}}>{pkg.endScreen}</div>
          </Card>
        </div>
      )}
    </Section>
  );
}

// ─── MONETIZATION HUB ─────────────────────────────────────────────────────────
// YouTube Partner Program thresholds (verify in YouTube Studio → Earn; YouTube
// changes these occasionally).
const YPP = {
  expanded: { label:"YPP — fan funding tier", note:"Unlocks memberships, Super Thanks/Chat, Shopping",
    subs:500, uploads:3, hours:3000, shorts:3_000_000 },
  full: { label:"YPP — ad revenue tier", note:"Unlocks watch-page & Shorts ad revenue share",
    subs:1000, hours:4000, shorts:10_000_000 },
};

const Bar = ({ label, value, target, color }) => {
  const pct = Math.min(100, target ? (value / target) * 100 : 0);
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
        <span style={{color:T.text2}}>{label}</span>
        <span style={{color:pct>=100?T.green:T.text3,fontVariantNumeric:"tabular-nums"}}>{fmtN(value)} / {fmtN(target)}{pct>=100?" ✓":""}</span>
      </div>
      <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:pct>=100?T.green:color,borderRadius:3}}/>
      </div>
    </div>
  );
};

export function MonetizeSection({ stats, showNotif }) {
  const [plan, setPlan] = useState(null);
  const [rates, setRates] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [brand, setBrand] = useState({ name:"", category:"Travel / homestays", ask:"" });
  const [loading, setLoading] = useState({});
  const run = async (key, fn) => {
    setLoading(l=>({...l,[key]:true}));
    try { await fn(); } catch (e) { showNotif(`Failed: ${e.message}`, "error"); }
    setLoading(l=>({...l,[key]:false}));
  };
  const copy = (t) => { navigator.clipboard?.writeText(t); showNotif("📋 Copied", "success"); };

  const genPlan = () => run("plan", async () => {
    const r = await callClaude(SYSTEMS.monetize, `Stats: ${statsSummary(stats)}

Build a monetization plan for where this creator is right now.
Return JSON:
{
  "stage": string (one-line honest assessment of monetization readiness),
  "streams": [{"name":string,"platform":"Instagram"|"YouTube"|"Both"|"Off-platform","readiness":"Ready now"|"Soon"|"Later","estMonthlyINR":string (range),"firstSteps":string[] (2-3)}] (6-8, ready-now first),
  "roadmap": [{"week":string,"focus":string,"actions":string[]}] (90 days in ~6 blocks),
  "doNot": string[] (3 common mistakes to avoid)
}`);
    if (r.streams) setPlan(r); else throw new Error("unparseable response");
  });

  const genRates = () => run("rates", async () => {
    const r = await callClaude(SYSTEMS.monetize, `Stats: ${statsSummary(stats)}

Create an estimated rate card for brand collaborations in India at this creator's size.
Return JSON:
{
  "rates": [{"deliverable":string,"lowINR":number,"highINR":number,"notes":string}] (IG Reel, Story set of 3, Carousel, Reel + Story bundle, YouTube integration 60-90s, Dedicated YouTube video, Shorts, UGC-only (no posting), Usage rights add-on per month, Barter guidance),
  "mediaKitBio": string (3-sentence media-kit intro in first person),
  "audienceHooks": string[] (3 selling points for brands),
  "negotiationTips": string[] (4)
}`);
    if (r.rates) setRates(r); else throw new Error("unparseable response");
  });

  const genPitch = () => run("pitch", async () => {
    if (!brand.name.trim()) throw new Error("Enter a brand name");
    const r = await callClaude(SYSTEMS.monetize, `Stats: ${statsSummary(stats)}
Brand: ${brand.name}
Category: ${brand.category}
Extra context / ask: ${brand.ask || "none"}

Write a brand pitch.
Return JSON:
{
  "subject": string,
  "email": string (short, personalised, 120-180 words, concrete content idea, clear package + CTA, sign-off as @inside_my_backpack with a [Your name] placeholder),
  "dm": string (Instagram DM version, under 60 words),
  "contentIdeas": [{"title":string,"format":string,"why":string}] (3),
  "package": string (suggested deliverables + price range in INR),
  "followUp": string (follow-up message for 5 days later)
}`);
    if (r.email) setPitch(r); else throw new Error("unparseable response");
  });

  const s = stats;
  const igMilestones = [
    [1000,"Affiliate links + barter collabs with local cafés/homestays"],
    [5000,"Paid nano-influencer deals; pitch D2C brands"],
    [10000,"Consistent paid collabs; launch a digital product (presets / itineraries)"],
    [50000,"Agency representation; long-term ambassadorships"],
  ];

  return (
    <Section icon={Wallet} color={T.green} title="Monetization Hub" sub="Track eligibility, build a plan, price your collabs and pitch brands. All ₹ figures are AI estimates, not guarantees.">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(300px,100%),1fr))",gap:12,marginBottom:14}}>
        {Object.values(YPP).map(t => (
          <Card key={t.label}>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>▶️ {t.label}</div>
            <div style={{fontSize:10,color:T.text3,marginBottom:12}}>{t.note}</div>
            <Bar label="Subscribers" value={s.ytSubscribers} target={t.subs} color={T.red}/>
            {t.uploads && <Bar label="Public uploads (90 days)" value={s.ytUploads90d} target={t.uploads} color={T.red}/>}
            <Bar label="Watch hours (12 mo)" value={s.ytWatchHours12mo} target={t.hours} color={T.orange}/>
            <div style={{fontSize:10,color:T.text3,textAlign:"center",margin:"-4px 0 6px"}}>— or —</div>
            <Bar label="Shorts views (90 days)" value={s.ytShortsViews90d} target={t.shorts} color={T.pink}/>
          </Card>
        ))}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.text}}>📸 Instagram milestones</div>
          <div style={{fontSize:10,color:T.text3,marginBottom:12}}>Rules of thumb — check Professional Dashboard → Monetisation for tool eligibility</div>
          {igMilestones.map(([n,txt]) => (
            <div key={n} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:12}}>
              <span style={{color:s.igFollowers>=n?T.green:T.text3,flexShrink:0,width:58,fontWeight:700}}>{s.igFollowers>=n?"✓ ":""}{n>=1000?`${n/1000}K`:n}</span>
              <span style={{color:s.igFollowers>=n?T.text:T.text2}}>{txt}</span>
            </div>
          ))}
        </Card>
      </div>
      <div style={{fontSize:10,color:T.text3,marginBottom:14}}>YPP thresholds as last published by YouTube — confirm in YouTube Studio → Earn. Update numbers in 📈 My Stats.</div>

      {/* Plan */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text}}>🗺️ 90-day monetization plan</div>
          <Btn onClick={genPlan} disabled={loading.plan} color={T.green}>{loading.plan?<><Spinner size={12} color={T.green}/>Planning…</>:plan?"🔄 Regenerate":<><Map size={15}/>Build my plan</>}</Btn>
        </div>
        {plan && (
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,color:T.amber,marginBottom:12}}>{plan.stage}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(250px,100%),1fr))",gap:10,marginBottom:14}}>
              {plan.streams?.map((st,i)=>(
                <div key={i} style={{background:T.card2,border:`1px solid ${T.border2}`,borderRadius:10,padding:12}}>
                  <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    <Pill small label={st.readiness} color={st.readiness==="Ready now"?T.green:st.readiness==="Soon"?T.accent:T.text3}/>
                    <Pill small label={st.platform} color={T.blue}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{st.name}</div>
                  <div style={{fontSize:11,color:T.green,margin:"2px 0 6px"}}>≈ {st.estMonthlyINR}/mo</div>
                  {st.firstSteps?.map((f,j)=><div key={j} style={{fontSize:11,color:T.text2}}>→ {f}</div>)}
                </div>
              ))}
            </div>
            <Label>Roadmap</Label>
            {plan.roadmap?.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                <code style={{fontSize:11,color:T.teal,flexShrink:0,width:80}}>{r.week}</code>
                <div style={{fontSize:12}}><strong style={{color:T.text}}>{r.focus}</strong>
                  {r.actions?.map((a,j)=><div key={j} style={{color:T.text2}}>• {a}</div>)}</div>
              </div>
            ))}
            {plan.doNot?.length>0 && <div style={{marginTop:10,fontSize:11,color:T.red}}>{plan.doNot.map((d,i)=><div key={i}>✗ {d}</div>)}</div>}
          </div>
        )}
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(340px,100%),1fr))",gap:12}}>
        {/* Rate card */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>🧾 Rate card & media kit</div>
            <Btn small onClick={genRates} disabled={loading.rates} color={T.amber}>{loading.rates?<Spinner size={11} color={T.amber}/>:"Estimate"}</Btn>
          </div>
          {rates ? (
            <>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginBottom:10}}>
                <tbody>
                  {rates.rates?.map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:"6px 4px",color:T.text}}>{r.deliverable}<div style={{color:T.text3,fontSize:10}}>{r.notes}</div></td>
                      <td style={{padding:"6px 4px",color:T.green,textAlign:"right",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"}}>₹{fmtN(r.lowINR)}–{fmtN(r.highINR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Label>Media-kit bio</Label>
              <div onClick={()=>copy(rates.mediaKitBio)} style={{fontSize:12,color:T.text2,marginBottom:8,cursor:"pointer"}}>{rates.mediaKitBio}</div>
              {rates.audienceHooks?.map((h,i)=><div key={i} style={{fontSize:11,color:T.teal}}>★ {h}</div>)}
              <div style={{marginTop:8}}>{rates.negotiationTips?.map((h,i)=><div key={i} style={{fontSize:11,color:T.text2}}>💬 {h}</div>)}</div>
            </>
          ) : <div style={{fontSize:12,color:T.text3}}>Get estimated INR pricing for Reels, Stories, YouTube integrations and UGC based on your stats.</div>}
        </Card>

        {/* Pitch */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>✉️ Brand pitch writer</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <input value={brand.name} onChange={e=>setBrand({...brand,name:e.target.value})} placeholder="Brand (e.g. Zostel, Bewakoof)" style={inputStyle}/>
            <select value={brand.category} onChange={e=>setBrand({...brand,category:e.target.value})} style={inputStyle}>
              {["Travel / homestays","Cafés & restaurants","Men's fashion (D2C)","Camera & tech gear","Automobile / EV","Fintech / travel credit cards","Food & kitchen","Other"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <input value={brand.ask} onChange={e=>setBrand({...brand,ask:e.target.value})} placeholder="Optional: product, campaign, or angle" style={{...inputStyle,marginBottom:8}}/>
          <Btn onClick={genPitch} disabled={loading.pitch||!brand.name.trim()} color={T.blue}>{loading.pitch?<><Spinner size={12} color={T.blue}/>Writing…</>:<><Mail size={15}/>Write pitch</>}</Btn>
          {pitch && (
            <div style={{marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><Label>Email — {pitch.subject}</Label><Btn small onClick={()=>copy(`Subject: ${pitch.subject}\n\n${pitch.email}`)}>Copy</Btn></div>
              <pre style={{fontSize:11,color:T.text2,whiteSpace:"pre-wrap",fontFamily:"inherit",lineHeight:1.6,margin:"4px 0 10px"}}>{pitch.email}</pre>
              <div style={{display:"flex",justifyContent:"space-between"}}><Label>Instagram DM</Label><Btn small onClick={()=>copy(pitch.dm)}>Copy</Btn></div>
              <div style={{fontSize:11,color:T.text2,marginBottom:10}}>{pitch.dm}</div>
              <Label>Content ideas</Label>
              {pitch.contentIdeas?.map((c,i)=><div key={i} style={{fontSize:11,color:T.text2}}>• <strong style={{color:T.text}}>{c.title}</strong> ({c.format}) — {c.why}</div>)}
              <div style={{fontSize:11,color:T.green,margin:"8px 0"}}>📦 {pitch.package}</div>
              <Label>Follow-up (day 5)</Label>
              <div style={{fontSize:11,color:T.text2}}>{pitch.followUp}</div>
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}
