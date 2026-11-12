import { useState, useEffect, useCallback, useMemo } from "react";
import { callClaude, SYSTEMS } from "./api";
import { SNAPSHOT_DATE, ACCOUNT, POSTS, FOOTAGE, SCOUT, PLAN } from "./managerData";

// Same palette as App.js
const T = {
  bg:"#080A0F", surface:"#0D1117", card:"#141820", card2:"#1A2030",
  border:"#1E2535", border2:"#263040",
  accent:"#F59E0B", blue:"#3B82F6", purple:"#8B5CF6", teal:"#14B8A6",
  green:"#22C55E", red:"#EF4444", pink:"#EC4899",
  text:"#F0F4FF", text2:"#8899AA", text3:"#445566",
};

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const Card = ({ children, style }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14, ...style }}>{children}</div>
);
const Pill = ({ label, color }) => (
  <span style={{ background:color+"20", color, border:`1px solid ${color}35`, borderRadius:5, padding:"2px 8px", fontSize:10, fontWeight:600, whiteSpace:"nowrap" }}>{label}</span>
);
const Btn = ({ children, onClick, color=T.accent, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ background:disabled?T.border:color+"20", border:`1px solid ${disabled?T.border2:color+"45"}`, color:disabled?T.text3:color, borderRadius:8, padding:"6px 12px", cursor:disabled?"default":"pointer", fontSize:11, fontWeight:600 }}>{children}</button>
);
const Stat = ({ label, value, color=T.text }) => (
  <Card style={{ flex:"1 1 130px" }}>
    <div style={{ fontSize:10, color:T.text3, textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color, marginTop:4 }}>{value}</div>
  </Card>
);
const fmt = n => n==null ? "—" : n>=1000 ? (n/1000).toFixed(1)+"K" : String(Math.round(n));
const pct = v => v==null ? "—" : Math.round(v*100)+"%";

// ─── LIVE DATA (Windsor.ai REST API) ─────────────────────────────────────────
const WINDSOR_FIELDS = "date,media_type,media_caption,media_permalink,media_views,media_reach,media_shares,media_saved,media_engagement,media_reel_avg_watch_time,media_reel_skip_rate";
async function fetchWindsor(apiKey) {
  const url = `https://connectors.windsor.ai/instagram?api_key=${encodeURIComponent(apiKey)}&date_preset=last_30d&fields=${WINDSOR_FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Windsor returned ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data;
  if (!Array.isArray(rows)) throw new Error("Unexpected Windsor response");
  return rows.filter(r => r.media_permalink).map(r => ({
    date:r.date, type:r.media_type, caption:(r.media_caption||"").split("\n")[0], url:r.media_permalink,
    views:r.media_views, reach:r.media_reach, shares:r.media_shares, saves:r.media_saved,
    engagement:r.media_engagement, watchMs:r.media_reel_avg_watch_time, skip:r.media_reel_skip_rate,
  }));
}

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────
function Performance({ showNotif }) {
  const [apiKey, setApiKey] = useState(() => store.get("windsorKey", ""));
  const [posts, setPosts] = useState(() => store.get("windsorPosts", null) || POSTS);
  const [source, setSource] = useState(() => store.get("windsorPosts", null) ? `Windsor (${store.get("windsorAt","")})` : `Snapshot ${SNAPSHOT_DATE}`);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("views");

  const refresh = useCallback(async () => {
    if (!apiKey) { showNotif("Add your Windsor API key first", "error"); return; }
    setLoading(true);
    try {
      const rows = await fetchWindsor(apiKey);
      const at = new Date().toLocaleString();
      setPosts(rows); setSource(`Windsor (${at})`);
      store.set("windsorPosts", rows); store.set("windsorAt", at);
      showNotif(`✅ ${rows.length} posts loaded from Windsor`, "success");
    } catch (e) {
      showNotif(`Windsor refresh failed: ${e.message}. Showing last saved data.`, "error");
    }
    setLoading(false);
  }, [apiKey, showNotif]);

  const reels = posts.filter(p => p.skip != null);
  const totViews = posts.reduce((s,p)=>s+(p.views||0),0);
  const avgSkip = reels.length ? reels.reduce((s,p)=>s+p.skip,0)/reels.length : null;
  const best = [...posts].sort((a,b)=>(b.views||0)-(a.views||0))[0];
  const sorted = [...posts].sort((a,b)=> sort==="skip" ? (a.skip??9)-(b.skip??9) : (b[sort]||0)-(a[sort]||0));
  const skipColor = s => s==null ? T.text3 : s<0.4 ? T.green : s<0.6 ? T.accent : T.red;

  return (
    <div>
      <Card style={{ marginBottom:14, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:11, color:T.text2 }}>Windsor API key</span>
        <input type="password" value={apiKey} placeholder="paste key from windsor.ai" onChange={e=>{ setApiKey(e.target.value); store.set("windsorKey", e.target.value); }}
          style={{ flex:"1 1 200px", background:T.surface, border:`1px solid ${T.border2}`, color:T.text, borderRadius:6, padding:"6px 8px", fontSize:12 }}/>
        <Btn onClick={refresh} disabled={loading}>{loading ? "Loading…" : "🔄 Refresh live"}</Btn>
        <span style={{ fontSize:10, color:T.text3 }}>Source: {source}</span>
      </Card>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
        <Stat label="Followers" value={fmt(ACCOUNT.followers)}/>
        <Stat label="Posts (30d)" value={posts.length}/>
        <Stat label="Views (30d)" value={fmt(totViews)} color={T.accent}/>
        <Stat label="Avg skip rate" value={pct(avgSkip)} color={skipColor(avgSkip)}/>
        <Stat label="New followers (30d)" value={ACCOUNT.newFollowers30d} color={T.teal}/>
      </div>

      {best && <Card style={{ marginBottom:14, borderColor:T.green+"55" }}>
        <div style={{ fontSize:11, color:T.green, fontWeight:700 }}>🏆 Top post</div>
        <a href={best.url} target="_blank" rel="noreferrer" style={{ color:T.text, fontSize:13 }}>{best.caption}</a>
        <div style={{ fontSize:11, color:T.text2, marginTop:4 }}>{fmt(best.views)} views · {best.shares} shares · {best.saves} saves · skip {pct(best.skip)}</div>
      </Card>}

      <div style={{ display:"flex", gap:6, marginBottom:8, alignItems:"center" }}>
        <span style={{ fontSize:11, color:T.text3 }}>Sort by</span>
        {[["views","Views"],["shares","Shares"],["saves","Saves"],["skip","Lowest skip"]].map(([k,l]) =>
          <Btn key={k} onClick={()=>setSort(k)} color={sort===k?T.accent:T.text3}>{l}</Btn>)}
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ color:T.text3, textAlign:"left" }}>
            {["Date","Type","Post","Views","Shares","Saves","Skip"].map(h=><th key={h} style={{ padding:"6px 8px", borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>{sorted.map((p,i)=>(
            <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
              <td style={{ padding:"6px 8px", color:T.text2, whiteSpace:"nowrap" }}>{p.date}</td>
              <td style={{ padding:"6px 8px" }}><Pill label={p.type==="CAROUSEL_ALBUM"?"Carousel":"Reel"} color={p.type==="CAROUSEL_ALBUM"?T.blue:T.accent}/></td>
              <td style={{ padding:"6px 8px", maxWidth:320 }}><a href={p.url} target="_blank" rel="noreferrer" style={{ color:T.text }}>{p.caption}</a></td>
              <td style={{ padding:"6px 8px" }}>{fmt(p.views)}</td>
              <td style={{ padding:"6px 8px" }}>{p.shares}</td>
              <td style={{ padding:"6px 8px" }}>{p.saves}</td>
              <td style={{ padding:"6px 8px", color:skipColor(p.skip), fontWeight:600 }}>{pct(p.skip)}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize:10, color:T.text3, marginTop:8 }}>Skip rate = viewers who swipe away in the first 3 seconds. Green under 40%, red over 60%.</div>
    </div>
  );
}

// ─── FOOTAGE LIBRARY ─────────────────────────────────────────────────────────
const STATUS = { posted:[T.text3,"Posted"], planned:[T.accent,"Planned"], unposted:[T.green,"Not posted"], unknown:[T.blue,"Check"] };
function Footage() {
  const [items, setItems] = useState(() => store.get("footage", FOOTAGE));
  const [filter, setFilter] = useState("all");
  useEffect(() => store.set("footage", items), [items]);
  const cycle = i => setItems(prev => prev.map((f,j)=> j!==i ? f : { ...f, status: { unposted:"planned", planned:"posted", posted:"unknown", unknown:"unposted" }[f.status] }));
  const shown = items.map((f,i)=>({...f,i})).filter(f => filter==="all" || f.status===filter);
  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        {["all","unposted","planned","unknown","posted"].map(k=>
          <Btn key={k} onClick={()=>setFilter(k)} color={filter===k?T.accent:T.text3}>{k==="all"?"All":STATUS[k][1]} ({k==="all"?items.length:items.filter(f=>f.status===k).length})</Btn>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
        {shown.map(f => (
          <Card key={f.folder}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>📁 {f.folder}</div>
              <span onClick={()=>cycle(f.i)} style={{ cursor:"pointer" }} title="Tap to change status"><Pill label={STATUS[f.status][1]} color={STATUS[f.status][0]}/></span>
            </div>
            <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>Shot {f.date} · My Drive/Pictures</div>
            <div style={{ fontSize:11, color:T.text2, marginTop:6 }}>{f.contents}</div>
            <div style={{ fontSize:11, color:T.text, marginTop:6 }}>{f.note}</div>
          </Card>
        ))}
      </div>
      <div style={{ fontSize:10, color:T.text3, marginTop:10 }}>Tap a status to change it. Changes are saved in this browser.</div>
    </div>
  );
}

// ─── VIRAL SCOUT ─────────────────────────────────────────────────────────────
function Scout({ showNotif }) {
  const [ideas, setIdeas] = useState(() => store.get("scoutIdeas", []));
  const [loading, setLoading] = useState(false);
  const unposted = store.get("footage", FOOTAGE).filter(f => f.status==="unposted" || f.status==="unknown").map(f=>f.folder);

  const adapt = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callClaude(SYSTEMS.viral,
`These Instagram reels are currently beating their creators' usual views by a wide margin:
${SCOUT.map(s=>`- ${s.handle} (${s.views}, ${s.multiple} their median): hook "${s.hook}" — format: ${s.format}`).join("\n")}

@inside_my_backpack has unposted footage from: ${unposted.join(", ")}.
Adapt the winning formats to this footage. Return JSON array of 5 objects:
[{"footage":string,"hook":string (on-screen text, Hinglish ok),"format":string,"shotOrder":string,"caption":string,"basedOn":string (handle)}]`, 1800);
      if (Array.isArray(result)) { setIdeas(result); store.set("scoutIdeas", result); }
      else showNotif("Couldn't read the AI response", "error");
    } catch (e) { showNotif("Idea generation failed — check your Anthropic API key", "error"); }
    setLoading(false);
  }, [unposted, showNotif]);

  return (
    <div>
      <div style={{ fontSize:11, color:T.text3, marginBottom:10 }}>Outliers from vidIQ, {SNAPSHOT_DATE}. Ask Claude in chat to rescan for fresh ones.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10, marginBottom:18 }}>
        {SCOUT.map(s => (
          <Card key={s.url}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color:T.pink, fontWeight:700, fontSize:12 }}>{s.handle}</a>
              <Pill label={`${s.views} · ${s.multiple}`} color={T.green}/>
            </div>
            <div style={{ fontSize:13, marginTop:6 }}>“{s.hook}”</div>
            <div style={{ fontSize:11, color:T.text2, marginTop:6 }}>{s.format}</div>
            <div style={{ marginTop:6 }}><Pill label={s.angle} color={T.purple}/></div>
          </Card>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:700 }}>💡 Adapted to your unposted footage</div>
        <Btn onClick={adapt} disabled={loading}>{loading ? "Thinking…" : "✨ Generate ideas"}</Btn>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
        {ideas.map((x,i) => (
          <Card key={i}>
            <Pill label={x.footage} color={T.teal}/>
            <div style={{ fontSize:13, fontWeight:700, marginTop:6 }}>{x.hook}</div>
            <div style={{ fontSize:11, color:T.text2, marginTop:4 }}>{x.format}</div>
            <div style={{ fontSize:11, color:T.text, marginTop:6 }}>🎬 {x.shotOrder}</div>
            <div style={{ fontSize:11, color:T.text2, marginTop:6 }}>{x.caption}</div>
            {x.basedOn && <div style={{ fontSize:10, color:T.text3, marginTop:6 }}>Based on {x.basedOn}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── WEEKLY PLANNER ──────────────────────────────────────────────────────────
const PSTATUS = ["Idea","Editing","Edited","Ready","Scheduled","Posted"];
const PCOLOR = { Idea:T.text3, Editing:T.accent, Edited:T.blue, Ready:T.teal, Scheduled:T.purple, Posted:T.green };
function Planner({ showNotif }) {
  const [plan, setPlan] = useState(() => store.get("plan", PLAN));
  useEffect(() => store.set("plan", plan), [plan]);
  const upd = (id, patch) => setPlan(p => p.map(x => x.id===id ? { ...x, ...patch } : x));
  const add = () => setPlan(p => [...p, { id:Date.now(), day:"", time:"", format:"Reel", title:"New post", hook:"", caption:"", status:"Idea" }]);
  const copy = text => { navigator.clipboard?.writeText(text); showNotif("📋 Caption copied", "success"); };
  const input = { fontFamily:"inherit", background:T.surface, border:`1px solid ${T.border2}`, color:T.text, borderRadius:6, padding:"5px 7px", fontSize:12 };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:11, color:T.text3 }}>Edits are saved in this browser.</div>
        <Btn onClick={add}>＋ Add post</Btn>
      </div>
      <div style={{ display:"grid", gap:10 }}>
        {plan.map(x => (
          <Card key={x.id} style={{ borderLeft:`3px solid ${PCOLOR[x.status]}` }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              <input value={x.day} onChange={e=>upd(x.id,{day:e.target.value})} placeholder="Day" style={{ ...input, width:90 }}/>
              <input value={x.time} onChange={e=>upd(x.id,{time:e.target.value})} placeholder="Time" style={{ ...input, width:80 }}/>
              <select value={x.format} onChange={e=>upd(x.id,{format:e.target.value})} style={input}>
                {["Reel","Carousel","Story","Talking Head","Vlog"].map(f=><option key={f}>{f}</option>)}
              </select>
              <select value={x.status} onChange={e=>upd(x.id,{status:e.target.value})} style={{ ...input, color:PCOLOR[x.status] }}>
                {PSTATUS.map(s=><option key={s}>{s}</option>)}
              </select>
              <button onClick={()=>setPlan(p=>p.filter(y=>y.id!==x.id))} style={{ marginLeft:"auto", background:"none", border:"none", color:T.text3, cursor:"pointer" }}>✕</button>
            </div>
            <input value={x.title} onChange={e=>upd(x.id,{title:e.target.value})} style={{ ...input, width:"100%", marginTop:8, fontWeight:700, fontSize:13, boxSizing:"border-box" }}/>
            <input value={x.hook} onChange={e=>upd(x.id,{hook:e.target.value})} placeholder="Hook / on-screen text" style={{ ...input, width:"100%", marginTop:6, boxSizing:"border-box" }}/>
            <textarea value={x.caption} onChange={e=>upd(x.id,{caption:e.target.value})} placeholder="Caption" rows={3} style={{ ...input, width:"100%", marginTop:6, boxSizing:"border-box", resize:"vertical" }}/>
            <div style={{ marginTop:6 }}><Btn onClick={()=>copy(x.caption)} color={T.teal}>📋 Copy caption</Btn></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── MANAGER SHELL ───────────────────────────────────────────────────────────
const TABS = [
  { id:"perf", label:"📈 Performance" },
  { id:"footage", label:"🎞️ Footage" },
  { id:"planner", label:"🗓️ This Week" },
  { id:"scout", label:"🛰️ Viral Scout" },
];
export default function ManagerSection({ showNotif }) {
  const [tab, setTab] = useState(() => store.get("managerTab", "perf"));
  useEffect(() => store.set("managerTab", tab), [tab]);
  const body = useMemo(() => ({
    perf: <Performance showNotif={showNotif}/>,
    footage: <Footage/>,
    planner: <Planner showNotif={showNotif}/>,
    scout: <Scout showNotif={showNotif}/>,
  }), [showNotif]);
  return (
    <div>
      <div style={{ fontSize:16, fontWeight:700 }}>🧑‍💼 Social Media Manager</div>
      <div style={{ fontSize:11, color:T.text3, marginTop:2, marginBottom:12 }}>Live stats, footage status, this week's posts and what's going viral</div>
      <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:`1px solid ${T.border}`, overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?T.accent:"transparent"}`, color:tab===t.id?T.accent:T.text3, padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>{t.label}</button>
        ))}
      </div>
      {body[tab]}
    </div>
  );
}
