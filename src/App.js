import { useState, useEffect, useCallback } from "react";
import { callClaude, researchJSON, SYSTEMS, onApiStatus, checkApiKey, PROXY_MODE, isLoggedIn, onAuthChange, login, logout } from "./api";
import { T, Pill, Spinner, Btn, PrimaryBtn, Card, PageHeader, loadStats } from "./ui";
import {
  Home, Bot, CalendarDays, Youtube, Instagram, Flame, Radar, Layers, ListChecks, Wallet, BarChart3, Github,
  LogOut, Backpack, Grid3X3, X, Siren, AlertTriangle, RefreshCw, Sparkles, FileText, CheckCircle2, Wand2,
  ChevronLeft, ChevronRight, Clock, Lock, Mountain, Lightbulb, Users, Globe, Search, ExternalLink,
} from "lucide-react";
import { AgentSection, YouTubeSection, MonetizeSection, StatsSection } from "./growth";
import { PROFILE, FORMATS, BUCKET_COLORS, MONTH_NAMES, makeSeedCalendar, fmtDate } from "./data";

const Notif = ({ n }) => {
  if (!n) return null;
  const c = n.type==="error"||n.type==="alert" ? T.red : n.type==="success" ? T.green : T.blue;
  return (
    <div role="status" style={{
      position:"fixed",top:"calc(14px + env(safe-area-inset-top, 0px))",right:14,left:"auto",zIndex:9000,
      maxWidth:"min(380px, calc(100vw - 28px))",background:"rgba(24,19,32,0.94)",border:`1px solid ${c}55`,
      borderLeft:`3px solid ${c}`,borderRadius:14,padding:"12px 16px",fontSize:13,color:T.text,lineHeight:1.45,
      boxShadow:"0 16px 40px rgba(0,0,0,.5)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",animation:"_notifIn .25s ease",
    }}>
      <style>{`@keyframes _notifIn{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}`}</style>
      {n.msg}
    </div>
  );
};

// ─── SCRIPT MODAL ─────────────────────────────────────────────────────────────
function ScriptModal({ day, onClose, onSave }) {
  const [script, setScript] = useState(day.script || null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState("script");

  const generate = useCallback(async (userFeedback = "") => {
    setLoading(true);
    try {
      const prompt = userFeedback
        ? `Revise this script based on creator feedback.\n\nOriginal script:\n${JSON.stringify(script)}\n\nFeedback: "${userFeedback}"\n\nKeep the same post but update the script, hook, caption, cta and hashtags per the feedback.`
        : `Generate a complete script for this Instagram post:\n\nTitle: "${day.title}"\nFormat: ${day.format}\nContent Bucket: ${day.bucket}\nHook: "${day.hook}"\nPost Time: ${day.postTime}\n\nReturn JSON: {\n  "hook": string (punchy 3-6 word opening),\n  "script": string (full word-for-word script with [SECTION] markers),\n  "caption": string (Instagram caption with emojis, 3-4 sentences),\n  "cta": string (comment-trigger or save-trigger CTA),\n  "hashtags": string (20 relevant hashtags as single string),\n  "visualNotes": string (camera directions, cuts, B-roll notes),\n  "duration": string (estimated duration e.g. "45-60 sec")\n}`;
      const result = await callClaude(SYSTEMS.script, prompt, 1800);
      if (result.script || result.raw) {
        const s = result.raw ? { script: result.raw, hook: day.hook, caption:"", cta:"", hashtags:"", visualNotes:"", duration:"" } : result;
        setScript(s);
        onSave({ ...day, script: s, caption: s.caption || day.caption, cta: s.cta || day.cta, hashtags: s.hashtags || day.hashtags });
      }
    } catch(e) { console.error(e); }
    setLoading(false);
    setFeedback("");
  }, [script, day, onSave]);

  useEffect(() => { if (!script && !loading) generate(); }, []); // eslint-disable-line

  const fmtInfo = FORMATS[day.format] || FORMATS["Reel"];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(5,4,8,.7)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{background:"rgba(24,19,32,0.97)",border:`1px solid ${T.border3}`,borderRadius:16,width:"100%",maxWidth:680,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexShrink:0}}>
          <div>
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              <Pill label={`${fmtInfo.icon} ${day.format}`} color={fmtInfo.color} small/>
              <Pill label={day.bucket} color={BUCKET_COLORS[day.bucket]||T.purple} small/>
              <Pill label={`⏰ ${day.postTime}`} color={T.text3} small/>
              {day.trendLocked && <Pill label="🔥 Trend" color={T.red} small/>}
            </div>
            <div className="display" style={{fontSize:19,fontWeight:600,color:T.text,lineHeight:1.25}}>{day.title}</div>
            <div style={{fontSize:11,color:T.text3,marginTop:3}}>{fmtDate(day.date)}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.text2,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:13,flexShrink:0}}>✕</button>
        </div>

        {/* Sub-tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          {["script","caption","hashtags","visuals"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t?T.accent:"transparent"}`,color:tab===t?T.accent:T.text3,padding:"8px 14px",cursor:"pointer",fontSize:11,fontWeight:600,textTransform:"capitalize"}}>
              {t==="script"?"📝 Script":t==="caption"?"📣 Caption":t==="hashtags"?"🏷️ Hashtags":"🎬 Visual Notes"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {loading ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,gap:12}}>
              <Spinner size={28} color={T.accent}/>
              <div style={{color:T.text2,fontSize:13}}>{feedback ? "Revising script…" : "Generating script…"}</div>
            </div>
          ) : script ? (
            <>
              {tab==="script" && (
                <div>
                  <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:6,letterSpacing:.5}}>HOOK</div>
                  <div style={{fontSize:14,color:T.accent,fontStyle:"italic",padding:"10px 14px",background:T.accent+"12",borderRadius:8,borderLeft:`3px solid ${T.accent}`,marginBottom:14,lineHeight:1.5}}>"{script.hook || day.hook}"</div>
                  {script.duration && <div style={{fontSize:10,color:T.teal,marginBottom:10}}>⏱ {script.duration}</div>}
                  <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:6,letterSpacing:.5}}>FULL SCRIPT</div>
                  <pre style={{fontSize:12,color:T.text,background:T.bg,borderRadius:10,padding:14,whiteSpace:"pre-wrap",lineHeight:1.85,fontFamily:"'DM Mono',monospace",border:`1px solid ${T.border}`,margin:0}}>
                    {script.script || "(Script not available)"}
                  </pre>
                </div>
              )}
              {tab==="caption" && (
                <div>
                  <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:6,letterSpacing:.5}}>INSTAGRAM CAPTION</div>
                  <div style={{fontSize:13,color:T.text,lineHeight:1.75,padding:"12px 14px",background:T.card2,borderRadius:10,border:`1px solid ${T.border}`,whiteSpace:"pre-wrap",marginBottom:12}}>
                    {script.caption || day.caption || "(Not yet generated)"}
                  </div>
                  <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:6,letterSpacing:.5}}>CTA</div>
                  <div style={{fontSize:13,color:T.green,padding:"10px 14px",background:T.green+"12",borderRadius:8,borderLeft:`3px solid ${T.green}`}}>
                    {script.cta || day.cta || "(Not yet generated)"}
                  </div>
                </div>
              )}
              {tab==="hashtags" && (
                <div>
                  <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:8,letterSpacing:.5}}>HASHTAGS</div>
                  <div style={{fontSize:12,color:T.blue,lineHeight:2,padding:"12px 14px",background:T.blue+"10",borderRadius:10,border:`1px solid ${T.border}`}}>
                    {script.hashtags || day.hashtags || "(Not yet generated)"}
                  </div>
                </div>
              )}
              {tab==="visuals" && (
                <div>
                  <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:6,letterSpacing:.5}}>VISUAL / CAMERA NOTES</div>
                  <pre style={{fontSize:12,color:T.text2,background:T.card2,borderRadius:10,padding:14,whiteSpace:"pre-wrap",lineHeight:1.75,fontFamily:"'DM Mono',monospace",border:`1px solid ${T.border}`,margin:0}}>
                    {script.visualNotes || "(No visual notes generated yet)"}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,gap:8}}>
              <div style={{fontSize:28}}>📝</div>
              <div style={{color:T.text2,fontSize:13}}>No script yet</div>
              <Btn onClick={()=>generate()} small>Generate Script</Btn>
            </div>
          )}
        </div>

        {/* Feedback / Revise */}
        <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,flexShrink:0,background:T.surface}}>
          <div style={{fontSize:11,color:T.text3,marginBottom:6}}>💬 Not happy? Leave feedback and regenerate:</div>
          <div style={{display:"flex",gap:8}}>
            <input
              value={feedback} onChange={e=>setFeedback(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&feedback&&generate(feedback)}
              placeholder="e.g. 'Make the hook more funny' / 'Add a personal story' / 'Shorter, punchier'"
              style={{flex:1,background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,outline:"none",fontFamily:"inherit"}}
            />
            <Btn onClick={()=>feedback?generate(feedback):generate()} disabled={loading} color={loading?T.text3:T.accent}>
              {loading?<><Spinner size={12}/>Working…</>:"🔄 Revise"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DAY DETAIL MODAL ─────────────────────────────────────────────────────────
function DayModal({ day, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [form, setForm] = useState({ title:day.title, hook:day.hook, postTime:day.postTime, format:day.format, bucket:day.bucket });
  const fmtInfo = FORMATS[day.format]||FORMATS["Reel"];

  return (
    <>
    <div className="modal-backdrop" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(5,4,8,.7)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{background:"rgba(24,19,32,0.97)",border:`1px solid ${T.border3}`,borderRadius:22,width:"100%",maxWidth:540,maxHeight:"85vh",overflowY:"auto",padding:22,position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"transparent",border:`1px solid ${T.border}`,color:T.text2,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:13}}>✕</button>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <Pill label={`${fmtInfo.icon} ${day.format}`} color={fmtInfo.color}/>
          <Pill label={day.bucket} color={BUCKET_COLORS[day.bucket]||T.purple}/>
          {day.ready&&<Pill label="✅ Ready" color={T.green}/>}
          {day.trendLocked&&<Pill label="🔥 Trend-Locked" color={T.red}/>}
          {day.aiGenerated&&<Pill label="🤖 AI" color={T.blue}/>}
          {day.script&&<Pill label="📝 Script Ready" color={T.teal}/>}
        </div>
        <div style={{fontSize:11,color:T.text3,marginBottom:8}}>📅 {fmtDate(day.date)} · ⏰ {day.postTime}</div>

        {editing ? (
          <div>
            {[["Title","title"],["Hook","hook"],["Post Time","postTime"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.text3,fontWeight:600,marginBottom:3}}>{l}</div>
                <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  style={{width:"100%",background:T.card2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.text,padding:"8px 11px",fontSize:12,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>{onUpdate({...day,...form});setEditing(false);}} color={T.green}>Save</Btn>
              <Btn onClick={()=>setEditing(false)} color={T.text3}>Cancel</Btn>
            </div>
          </div>
        ) : (
          <div>
            <div className="display" style={{fontSize:22,fontWeight:600,color:T.text,marginBottom:12,lineHeight:1.25}}>{day.title}</div>
            {[["🔥 HOOK",day.hook,T.accent,true],["📣 CAPTION",day.caption||"(tap Script to generate)",T.text,false],["💬 CTA",day.cta||"(tap Script to generate)",T.green,false]].map(([l,v,c,italic])=>(
              <div key={l} style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.text3,fontWeight:600,marginBottom:3,letterSpacing:.5}}>{l}</div>
                <div style={{fontSize:12,color:c,lineHeight:1.6,padding:"8px 11px",background:c+"12",borderRadius:7,borderLeft:`2px solid ${c}`,fontStyle:italic?"italic":"normal"}}>{v}</div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
              <Btn onClick={()=>setShowScript(true)} color={T.teal}>{day.script?"📝 View / Edit Script":"📝 Generate Script"}</Btn>
              <Btn onClick={()=>setEditing(true)} color={T.text2} small>✏️ Edit Post</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
    {showScript && (
      <ScriptModal day={day} onClose={()=>setShowScript(false)}
        onSave={updated=>{onUpdate(updated);setShowScript(false);}}/>
    )}
    </>
  );
}

// ─── VIRAL SUGGESTIONS ────────────────────────────────────────────────────────
const VIRAL_KEY = "imb_viral_ideas_v2";
const normUrl = (u) => { try { const x = new URL(u); return (x.hostname.replace(/^www\./,"") + x.pathname).replace(/\/$/,""); } catch { return ""; } };

function ViralSection({ showNotif }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(VIRAL_KEY)) || null; } catch { return null; } })();
  const [items, setItems] = useState(saved?.items || []);
  const [sources, setSources] = useState(saved?.sources || []);
  const [meta, setMeta] = useState(saved ? { at: saved.at, live: saved.live, focus: saved.focus } : null);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState(saved?.focus || "All");
  const [showSources, setShowSources] = useState(false);

  const research = useCallback(async (p) => {
    setLoading(true);
    const today = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
    const prompt = `Today is ${today}. Research what is trending RIGHT NOW on Instagram Reels, YouTube Shorts and Facebook Reels for Indian travel, lifestyle, food and men's fashion creators (bonus if Bangalore / South India specific).
${p!=="All"?`Focus only on ${p}.`:"Cover all three platforms."}

Creator: @inside_my_backpack — Bangalore (HSR Layout), full-time job, weekend road trips, café explorer, home cook, ex-fashion buyer. Gear: Sony A7III, DJI Mini 5 Pro drone, iPhone 15 Pro Max. The creator's best posts are relatable millennial humour over their own travel footage, emotional "missing home" stories, and useful road-trip tips.

Search the web first. Then return a JSON array of 10 ideas, each grounded in something you found:
[{
  "platform": "Instagram"|"YouTube"|"Facebook",
  "title": string,
  "description": string (2 sentences: what the trend/format is),
  "evidence": string (1 sentence: what you found that shows it's trending now — name the source),
  "sourceUrl": string (URL of the search result you're relying on, copied exactly),
  "format": "Reel"|"Short"|"Vlog"|"Carousel",
  "niche": "travel"|"food"|"style"|"lifestyle"|"humour",
  "viralScore": number 1-100 (your estimate of momentum for THIS creator, not a measured number),
  "hook": string (first-line hook the creator can say or put on screen),
  "adaptation": string (how the creator makes it their own with Bangalore, their gear and weekend-only schedule),
  "exampleAngle": string (one concrete post),
  "trendWindow": "This week"|"Next 2 weeks"|"This month"|"Evergreen"
}]`;
    try {
      const { data, sources: found } = await researchJSON(SYSTEMS.viral, prompt, { maxSearches: 6 });
      if (!Array.isArray(data)) throw new Error("Couldn't read the research results — try Refresh.");
      // Only keep links that the search actually returned.
      const real = new Map(found.map(s => [normUrl(s.url), s]));
      const cleaned = data.map(it => ({ ...it, source: real.get(normUrl(it.sourceUrl)) || null }));
      const m = { at: Date.now(), live: true, focus: p };
      setItems(cleaned); setSources(found); setMeta(m);
      try { localStorage.setItem(VIRAL_KEY, JSON.stringify({ items: cleaned, sources: found, ...m })); } catch {}
    } catch (e) {
      // Live search unavailable (e.g. disabled for the account): fall back to a brainstorm.
      try {
        const result = await callClaude(SYSTEMS.viral.replace(/Use web search[\s\S]*?view counts\./, "Web search is unavailable: brainstorm from general knowledge and say so in each description."), prompt.replace("Search the web first. Then return", "Return"));
        if (!Array.isArray(result)) throw e;
        const m = { at: Date.now(), live: false, focus: p };
        setItems(result.map(it => ({ ...it, source: null }))); setSources([]); setMeta(m);
        showNotif("Live search unavailable — showing a brainstorm instead.", "info");
      } catch (e2) { showNotif(`Viral Ideas failed: ${e2.message || e.message}`, "error"); }
    }
    setLoading(false);
  }, [showNotif]);

  // Only research automatically the first time; afterwards use saved results.
  useEffect(() => { if (!saved) research("All"); }, []);// eslint-disable-line

  const platforms = ["All","Instagram","YouTube","Facebook"];
  const filtered = platform==="All"?items:items.filter(i=>i.platform===platform);
  const platColor = { Instagram:T.pink, YouTube:T.red, Facebook:T.blue, All:T.accent };
  const platIconC = { Instagram:Instagram, YouTube:Youtube, Facebook:Users, All:Globe };
  const ago = meta ? (() => { const m = Math.round((Date.now()-meta.at)/60000); return m<1?"just now":m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:`${Math.round(m/1440)} d ago`; })() : null;

  return (
    <div>
      <PageHeader icon={Flame} color={T.orange} title="Viral Ideas"
        sub="Researched live on the web: what's actually trending for Indian travel, food and style creators, turned into ideas for you."
        right={<PrimaryBtn onClick={()=>research(platform)} disabled={loading}>{loading?<><Spinner size={13} color="#fff"/>Researching…</>:<><Search size={15}/>Research now</>}</PrimaryBtn>}/>

      {/* Platform filter */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {platforms.map(p=>{ const I = platIconC[p]; return (
          <Pill key={p} label={<><I size={13}/>{p}</>} color={platform===p?platColor[p]:T.text3} onClick={()=>setPlatform(p)}/>
        );})}
      </div>

      {meta && !loading && (
        <div className="glass" style={{padding:"10px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",fontSize:12.5,color:T.text2}}>
          {meta.live
            ? <><Globe size={15} color={T.teal}/><span>Researched {ago} from <strong style={{color:T.text}}>{sources.length} web sources</strong>{meta.focus!=="All"?` · ${meta.focus} focus`:""}</span>
                {sources.length>0 && <button onClick={()=>setShowSources(s=>!s)} style={{marginLeft:"auto",background:"transparent",border:0,color:T.teal,cursor:"pointer",fontSize:12.5,fontFamily:"inherit",fontWeight:600}}>{showSources?"Hide sources":"View sources"}</button>}</>
            : <><AlertTriangle size={15} color={T.amber}/><span>Brainstorm only ({ago}): live web search wasn't available, so these aren't checked against current trends.</span></>}
          {showSources && (
            <div style={{flexBasis:"100%",display:"flex",flexDirection:"column",gap:6,marginTop:6}}>
              {sources.map(s=>(
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{color:T.text2,textDecoration:"none",fontSize:12,display:"flex",gap:8,alignItems:"baseline"}}>
                  <ExternalLink size={12} style={{flexShrink:0,position:"relative",top:1}}/><span><span style={{color:T.text}}>{s.title}</span> <span style={{color:T.text3}}>· {s.host}</span></span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div>
          <div className="glass" style={{padding:"12px 14px",marginBottom:14,fontSize:13,color:T.text2,display:"flex",gap:10,alignItems:"center"}}>
            <Spinner size={14}/>Searching the web for this week's trends and checking sources… this takes 20–60 seconds.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(300px,100%),1fr))",gap:12}}>
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="glass" style={{padding:16,height:200,animation:"_pulse 1.5s ease infinite",animationDelay:`${i*.1}s`}}>
                <style>{`@keyframes _pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{textAlign:"center",padding:"40px 20px",color:T.text3}}>
          <Search size={32} style={{marginBottom:10}}/>
          <div className="display" style={{fontSize:18,color:T.text2,marginBottom:4}}>{items.length?`No ${platform} ideas in this batch`:"No research yet"}</div>
          <div style={{fontSize:13}}>Tap <strong>Research now</strong>{platform!=="All"?` to research ${platform} specifically`:""}.</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))",gap:14}}>
          {filtered.map((item, i) => {
            const pc = platColor[item.platform]||T.accent; const PI = platIconC[item.platform]||Globe;
            const sc = item.viralScore>80?T.green:item.viralScore>60?T.accent:T.text3;
            return (
              <div key={i} className="glass" style={{padding:18,display:"flex",flexDirection:"column"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Pill label={<><PI size={12}/>{item.platform}</>} color={pc} small/>
                    <Pill label={item.format} color={T.text3} small/>
                    {item.niche && <Pill label={item.niche} color={T.purple} small/>}
                  </div>
                  <div title="AI estimate of momentum for you, not measured views" style={{fontSize:11,fontWeight:700,color:sc,background:sc+"20",padding:"3px 9px",borderRadius:99,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                    <Flame size={12}/>{item.viralScore}
                  </div>
                </div>
                <div className="display" style={{fontSize:18,fontWeight:600,color:T.text,marginBottom:6,lineHeight:1.25}}>{item.title}</div>
                <div style={{fontSize:12.5,color:T.text2,lineHeight:1.55,marginBottom:10}}>{item.description}</div>
                {meta?.live && item.evidence && (
                  <div style={{fontSize:12,color:T.text2,lineHeight:1.5,marginBottom:10,padding:"8px 10px",background:"rgba(46,211,183,0.08)",border:`1px solid ${T.teal}30`,borderRadius:10}}>
                    <span style={{color:T.teal,fontWeight:700}}>Why now: </span>{item.evidence}
                    {item.source
                      ? <a href={item.source.url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,color:T.teal,marginLeft:6,textDecoration:"none",fontWeight:600}}>{item.source.host}<ExternalLink size={11}/></a>
                      : <span style={{color:T.text3,marginLeft:6}}>(source not verified)</span>}
                  </div>
                )}
                {item.hook && (
                  <div style={{fontSize:13,color:T.amber,fontStyle:"italic",marginBottom:10,lineHeight:1.45}}>“{item.hook}”</div>
                )}
                <div style={{fontSize:12,color:T.text,padding:"8px 10px",background:pc+"12",borderRadius:10,borderLeft:`2px solid ${pc}`,marginBottom:8,lineHeight:1.5}}>
                  <strong style={{color:pc}}>Make it yours: </strong>{item.adaptation}
                </div>
                <div style={{fontSize:12,color:T.text3,marginBottom:10,lineHeight:1.5}}><Lightbulb size={12} style={{verticalAlign:-1}}/> {item.exampleAngle}</div>
                {item.trendWindow && (
                  <div style={{marginTop:"auto"}}><Pill label={<><Clock size={11}/>{item.trendWindow}</>} color={/week/i.test(item.trendWindow)?T.orange:T.teal} small/></div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{fontSize:11.5,color:T.text3,marginTop:14,lineHeight:1.5}}>The 🔥 score is the AI's estimate of momentum for you, not measured views. Each refresh runs up to 6 web searches, costing roughly a few US cents of your Claude credit.</div>
    </div>
  );
}

// ─── CONTENT BUCKETS ─────────────────────────────────────────────────────────
function BucketsSection({ calendar }) {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <PageHeader icon={Layers} color={T.purple} title="Content Buckets" sub="Six themes built around your life: weekday professional, weekend driver, home cook and Bangalore local. Tap a bucket to see its posts."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:12}}>
        {PROFILE.buckets.map(b => {
          const posts = calendar.filter(d=>d.bucket===b);
          const color = BUCKET_COLORS[b]||T.accent;
          const fc = {};
          posts.forEach(p=>{ fc[p.format]=(fc[p.format]||0)+1; });
          const isOpen = selected===b;
          return (
            <div key={b} onClick={()=>setSelected(isOpen?null:b)} className="glass" style={{border:`1px solid ${isOpen?color+"80":T.border}`,overflow:"hidden",cursor:"pointer",transition:"all .15s",background:`linear-gradient(160deg, ${color}14, rgba(255,255,255,0.03) 60%)`}}>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div className="display" style={{fontSize:18,fontWeight:600,color:T.text,marginBottom:3}}>{b}</div>
                    <div style={{fontSize:11,color:T.text3}}>{posts.length} posts this month</div>
                  </div>
                  <div className="display" style={{fontSize:28,fontWeight:600,color,lineHeight:1}}>{posts.length}</div>
                </div>
                <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
                  {Object.entries(fc).map(([f,c])=>(
                    <span key={f} style={{fontSize:9,background:(FORMATS[f]?.color||T.accent)+"20",color:FORMATS[f]?.color||T.accent,borderRadius:4,padding:"1px 6px",fontWeight:700}}>
                      {FORMATS[f]?.icon} {f} ×{c}
                    </span>
                  ))}
                </div>
              </div>
              {isOpen && (
                <div style={{borderTop:`1px solid ${T.border}`,padding:"10px 14px"}}>
                  {posts.map((p,i)=>(
                    <div key={i} style={{fontSize:11,color:T.text2,padding:"5px 0",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{color:T.text3,fontSize:10,flexShrink:0}}>D{p.id}</span>
                      <span style={{flex:1}}>{p.title?.slice(0,46)}{p.title?.length>46?"…":""}</span>
                      {p.script&&<span style={{fontSize:9,color:T.teal}}>📝</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PRODUCTION TRACKER ──────────────────────────────────────────────────────
function TrackerSection({ calendar }) {
  const [rows, setRows] = useState(()=>calendar.map(d=>({
    id:d.id, title:d.title, date:fmtDate(d.date), format:d.format,
    scripted:d.script?"✅":d.ready?"✅":"⬜",
    shot:d.ready?"✅":"⬜", edited:d.ready?"✅":"⬜",
    captioned:d.ready?"✅":"⬜", posted:"⬜",
    likes:"",comments:"",reach:"",saves:"",
  })));

  useEffect(()=>{
    setRows(prev=>{
      const map = Object.fromEntries(prev.map(r=>[r.id,r]));
      return calendar.map(d=>map[d.id]||{id:d.id,title:d.title,date:fmtDate(d.date),format:d.format,scripted:"⬜",shot:"⬜",edited:"⬜",captioned:"⬜",posted:"⬜",likes:"",comments:"",reach:"",saves:""});
    });
  }, [calendar]);

  const phases=["scripted","shot","edited","captioned","posted"];
  const toggle=(i,f)=>setRows(p=>p.map((r,idx)=>idx!==i?r:{...r,[f]:r[f]==="✅"?"⬜":"✅"}));
  const upd=(i,f,v)=>setRows(p=>p.map((r,idx)=>idx!==i?r:{...r,[f]:v}));
  const pct=r=>Math.round(phases.filter(p=>r[p]==="✅").length/phases.length*100);

  return (
    <div>
      <PageHeader icon={ListChecks} color={T.teal} title="Production Tracker" sub="Tap a box to move a post through script, shoot, edit, caption and post. Add the numbers once it's live. Swipe sideways on a phone."/>
      <div className="glass" style={{overflowX:"auto",padding:0}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
          <thead>
            <tr style={{background:T.surface}}>
              {["#","Title","Date","Format","Progress",...phases,"Likes","Comments","Reach","Saves"].map(h=>(
                <th key={h} style={{padding:"7px 8px",textAlign:"left",color:T.text3,fontWeight:600,fontSize:9,letterSpacing:.8,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,idx)=>{
              const p=pct(row); const fi=FORMATS[row.format];
              return (
                <tr key={idx} style={{borderBottom:`1px solid ${T.border}`,background:idx%2===0?T.card:T.surface}}>
                  <td style={{padding:"5px 8px",color:T.text3,fontWeight:600}}>{row.id}</td>
                  <td style={{padding:"5px 8px",color:T.text,maxWidth:160,overflow:"hidden",whiteSpace:"nowrap"}}>{row.title?.slice(0,32)}{row.title?.length>32?"…":""}</td>
                  <td style={{padding:"5px 8px",color:T.text3,whiteSpace:"nowrap"}}>{row.date}</td>
                  <td style={{padding:"5px 8px"}}>
                    <span style={{fontSize:9,background:(fi?.color||T.accent)+"20",color:fi?.color||T.accent,borderRadius:4,padding:"1px 6px",fontWeight:600}}>{fi?.icon} {row.format}</span>
                  </td>
                  <td style={{padding:"5px 8px",minWidth:80}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{flex:1,height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
                        <div style={{width:`${p}%`,height:"100%",background:p===100?T.green:T.accent,borderRadius:2}}/>
                      </div>
                      <span style={{fontSize:9,color:p===100?T.green:T.text2,fontWeight:600,minWidth:24}}>{p}%</span>
                    </div>
                  </td>
                  {phases.map(ph=>(
                    <td key={ph} style={{padding:"5px 8px",textAlign:"center"}}>
                      <span onClick={()=>toggle(idx,ph)} style={{cursor:"pointer",fontSize:13,userSelect:"none"}}>{row[ph]}</span>
                    </td>
                  ))}
                  {["likes","comments","reach","saves"].map(m=>(
                    <td key={m} style={{padding:"3px 5px"}}>
                      <input value={row[m]} onChange={e=>upd(idx,m,e.target.value)} placeholder="—"
                        style={{width:52,background:"transparent",border:`1px solid ${T.border}`,borderRadius:4,color:T.text,padding:"2px 5px",fontSize:10,outline:"none",fontFamily:"inherit"}}/>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarSection({ calendar, onDayClick, onGenerate, loadingCal }) {
  const [month, setMonth] = useState(()=>{
    const dates = calendar.map(d=>new Date(d.date));
    const m = dates[0]||new Date();
    return { year:m.getFullYear(), month:m.getMonth() };
  });

  const getDays = (y,m) => { const days=[]; const d=new Date(y,m,1); while(d.getMonth()===m){days.push(new Date(d));d.setDate(d.getDate()+1);} return days; };
  const days = getDays(month.year, month.month);
  const offset = (() => { const d=days[0].getDay(); return d===0?6:d-1; })();
  const DOW=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div>
      <div>
        <PageHeader icon={CalendarDays} color={T.amber} title="Content Calendar" sub="Tap any day for the post brief, then generate or edit its script."
          right={<>
            <div style={{display:"flex",alignItems:"center",gap:4}} className="glass">
              <button aria-label="Previous month" onClick={()=>setMonth(m=>{const d=new Date(m.year,m.month-1,1);return{year:d.getFullYear(),month:d.getMonth()}})} style={{background:"transparent",border:0,color:T.text2,padding:"8px 10px",cursor:"pointer",display:"flex"}}><ChevronLeft size={18}/></button>
              <span className="display" style={{fontSize:16,fontWeight:600,color:T.text,minWidth:130,textAlign:"center"}}>{MONTH_NAMES[month.month]} {month.year}</span>
              <button aria-label="Next month" onClick={()=>setMonth(m=>{const d=new Date(m.year,m.month+1,1);return{year:d.getFullYear(),month:d.getMonth()}})} style={{background:"transparent",border:0,color:T.text2,padding:"8px 10px",cursor:"pointer",display:"flex"}}><ChevronRight size={18}/></button>
            </div>
            <PrimaryBtn onClick={onGenerate} disabled={loadingCal}>{loadingCal?<><Spinner size={12} color="#fff"/>Generating…</>:<><Wand2 size={15}/>AI Generate</>}</PrimaryBtn>
          </>}/>
      </div>

      {/* Phone: agenda list */}
      <div className="calendar-list">
        {calendar.filter(d=>{const x=new Date(d.date);return x.getMonth()===month.month&&x.getFullYear()===month.year;}).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(entry=>{
          const date=new Date(entry.date); const fi=FORMATS[entry.format]; const c=BUCKET_COLORS[entry.bucket]||T.accent;
          const isToday=date.toDateString()===new Date().toDateString();
          return (
            <button key={entry.id} onClick={()=>onDayClick(entry)} className="glass" style={{display:"flex",gap:14,alignItems:"center",padding:"12px 14px",textAlign:"left",cursor:"pointer",color:T.text,fontFamily:"inherit",borderColor:isToday?T.accent+"80":undefined}}>
              <div style={{width:48,flexShrink:0,textAlign:"center",borderRight:`1px solid ${T.border}`,paddingRight:12}}>
                <div style={{fontSize:10,color:T.text3,fontWeight:700,letterSpacing:1}}>{date.toLocaleDateString("en-IN",{weekday:"short"}).toUpperCase()}</div>
                <div className="display" style={{fontSize:24,fontWeight:600,color:isToday?T.accent:T.text,lineHeight:1.1}}>{date.getDate()}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  <Pill small label={`${fi?.icon||""} ${entry.format}`} color={fi?.color||T.accent}/>
                  {entry.ready&&<Pill small label="Ready" color={T.green}/>}
                  {entry.trendLocked&&<Pill small label="Trend" color={T.red}/>}
                </div>
                <div style={{fontSize:14,fontWeight:600,lineHeight:1.35,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{entry.title}</div>
                <div style={{fontSize:11.5,color:T.text3,marginTop:3,display:"flex",gap:10}}><span style={{color:c}}>● {entry.bucket}</span><span><Clock size={11} style={{verticalAlign:-1}}/> {entry.postTime}</span></div>
              </div>
              <ChevronRight size={18} color={T.text3}/>
            </button>
          );
        })}
        {calendar.filter(d=>{const x=new Date(d.date);return x.getMonth()===month.month&&x.getFullYear()===month.year;}).length===0 && (
          <div className="glass" style={{padding:24,textAlign:"center",color:T.text3,fontSize:13}}>No posts planned this month. Use the arrows to switch month, or tap AI Generate.</div>
        )}
      </div>

      <div className="calendar-grid">
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:5}}>
        {DOW.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:T.text3,fontWeight:600,letterSpacing:.8,padding:"3px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array(offset).fill(null).map((_,i)=><div key={"p"+i}/>)}
        {days.map((date,idx)=>{
          const entry = calendar.find(d=>new Date(d.date).toDateString()===date.toDateString());
          const isToday = date.toDateString()===new Date().toDateString();
          const fi = entry?FORMATS[entry.format]:null;
          return (
            <div key={idx} onClick={()=>entry&&onDayClick(entry)} style={{
              background:entry?.trendLocked?T.red+"18":entry?(BUCKET_COLORS[entry.bucket]||T.accent)+"10":"rgba(255,255,255,0.025)",
              border:`1px solid ${isToday?T.accent:entry?.trendLocked?T.red+"50":T.border}`,
              borderRadius:12,padding:"8px 9px 9px",minHeight:96,cursor:entry?"pointer":"default",transition:"all .12s",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span className="display" style={{fontSize:15,color:isToday?T.accent:T.text2,fontWeight:600}}>{date.getDate()}</span>
                <div style={{display:"flex",gap:2}}>
                  {entry?.script&&<span style={{fontSize:8,color:T.teal}}>📝</span>}
                  {entry?.trendLocked&&<span style={{fontSize:8,color:T.red}}>🔥</span>}
                  {entry?.aiGenerated&&!entry.trendLocked&&<span style={{fontSize:8,color:T.blue}}>🤖</span>}
                </div>
              </div>
              {entry&&<>
                <div style={{fontSize:10,color:fi?.color||T.text3,fontWeight:700,marginBottom:2}}>{fi?.icon} {entry.format}</div>
                <div style={{fontSize:11,color:T.text,lineHeight:1.3}}>{entry.title?.slice(0,40)}{entry.title?.length>40?"…":""}</div>
                <div style={{fontSize:9.5,color:T.text3,marginTop:3}}>{entry.postTime}</div>
                {entry.ready&&<div style={{fontSize:7,color:T.green,fontWeight:700,marginTop:1}}>✅ READY</div>}
              </>}
            </div>
          );
        })}
      </div>
      </div>
      <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap"}}>
        {[["🔥 Trend-locked",T.red],["🤖 AI-generated",T.blue],["📝 Script ready",T.teal],["✅ Ready",T.green]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:2,background:c}}/>
            <span style={{fontSize:10,color:T.text3}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRENDS SECTION ───────────────────────────────────────────────────────────
function TrendsSection({ trends, loading, onScan, lastScan, pendingAlert, onAccept, onDismiss }) {
  return (
    <div>
      <div>
        <PageHeader icon={Radar} color={T.blue} title="Trend Radar" sub={lastScan?`Last scan ${lastScan.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}. Trends worth jumping on this week.`:"Scan to pull this month's travel, food and style trends for Bangalore creators."}
          right={<PrimaryBtn onClick={onScan} disabled={loading}>{loading?<><Spinner size={12} color="#fff"/>Scanning…</>:<><Radar size={15}/>Scan Trends</>}</PrimaryBtn>}/>
      </div>

      {pendingAlert && (
        <div className="glass" style={{borderColor:T.red+"60",padding:16,marginBottom:16,animation:"_alertPulse 2s ease infinite"}}>
          <style>{`@keyframes _alertPulse{0%,100%{box-shadow:0 0 0 0 ${T.red}30}50%{box-shadow:0 0 0 8px transparent}}`}</style>
          <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8}}>🚨 Breaking Trend — Action Required</div>
          <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:4}}>{pendingAlert.title}</div>
          <div style={{fontSize:11,color:T.text2,marginBottom:8}}>{pendingAlert.description}</div>
          {pendingAlert.contentIdea&&<div style={{fontSize:11,color:T.teal,padding:"6px 9px",background:T.teal+"10",borderRadius:6,borderLeft:`2px solid ${T.teal}`,marginBottom:10}}>💡 {pendingAlert.contentIdea}</div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={onAccept} color={T.green} small>✅ Update Calendar</Btn>
            <Btn onClick={onDismiss} color={T.red} small>✕ Dismiss</Btn>
          </div>
        </div>
      )}

      {trends.length===0&&!loading ? (
        <div style={{textAlign:"center",padding:"48px 0",color:T.text3}}>
          <Radar size={36} color={T.text3} style={{marginBottom:10}}/>
          <div className="display" style={{fontSize:18,color:T.text2,marginBottom:4}}>No trends loaded yet</div>
          <div style={{fontSize:12}}>Click "Scan Trends" to pull live Instagram & social media trends</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:10}}>
          {trends.map((t,i)=>{
            const strengthColor = t.strength==="High"?T.green:t.strength==="Medium"?T.accent:T.text3;
            return (
              <div key={i} className="glass" style={{padding:16}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                  <Pill label={t.platform||"Instagram"} color={T.blue} small/>
                  <Pill label={t.category||"Trending"} color={T.purple} small/>
                  <Pill label={`${t.strength==="High"?"🔥":t.strength==="Medium"?"📈":"💡"} ${t.strength}`} color={strengthColor} small/>
                </div>
                <div className="display" style={{fontSize:17,fontWeight:600,color:T.text,marginBottom:6,lineHeight:1.25}}>{t.title}</div>
                <div style={{fontSize:11,color:T.text2,lineHeight:1.5,marginBottom:8}}>{t.description}</div>
                {t.contentIdea&&<div style={{fontSize:11,color:T.teal,padding:"6px 9px",background:T.teal+"10",borderRadius:6,borderLeft:`2px solid ${T.teal}`}}>💡 {t.contentIdea}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const fmtNum = (n) => { n = Number(n)||0; return n>=100000?`${(n/100000).toFixed(1)}L`:n>=1000?`${(n/1000).toFixed(n>=10000?0:1)}K`:String(n); };

function Mountains() {
  // Layered ridgelines with a low sun: the "weekend drive" mood.
  return (
    <svg className="hero-mountains" viewBox="0 0 420 180" aria-hidden="true">
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD27A"/><stop offset="1" stopColor="#FF7A45"/></linearGradient>
        <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF4F8B" stopOpacity=".55"/><stop offset="1" stopColor="#FF4F8B" stopOpacity="0"/></linearGradient>
        <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9B7BFF" stopOpacity=".7"/><stop offset="1" stopColor="#1A1424" stopOpacity=".2"/></linearGradient>
      </defs>
      <circle cx="300" cy="78" r="34" fill="url(#sun)" opacity=".9"/>
      <path d="M0 150 L60 92 L105 128 L160 70 L215 120 L262 86 L320 132 L372 96 L420 124 L420 180 L0 180Z" fill="url(#r1)"/>
      <path d="M0 168 L48 132 L92 156 L150 112 L205 152 L250 124 L300 160 L350 130 L420 158 L420 180 L0 180Z" fill="url(#r2)"/>
      <path d="M0 180 C80 168 140 176 210 170 C280 164 340 174 420 166 L420 180Z" fill="#0D0A12" opacity=".8"/>
    </svg>
  );
}

function Dashboard({ calendar, trends, stats, loading, pendingAlert, lastScan, onScanTrends, onGenerateCal, onCheckAlert, onAccept, onDismiss, go }) {
  const readyCount = calendar.filter(d=>d.ready).length;
  const scriptCount = calendar.filter(d=>d.script).length;
  const trendCount = calendar.filter(d=>d.trendLocked).length;
  const hour = new Date().getHours();
  const greeting = hour<5?"Late night edit?":hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = calendar.filter(d=>new Date(d.date)>=today).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
  const hasStats = stats && (stats.igFollowers || stats.ytSubscribers);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <Mountains/>
        <div style={{position:"relative",maxWidth:560}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:1.4,textTransform:"uppercase",color:T.amber,display:"flex",alignItems:"center",gap:7}}><Mountain size={14}/>{greeting}, creator</div>
          <h1 className="hero-title">Where does the <span className="gradient-text">next story</span> start?</h1>
          <div style={{fontSize:14,color:T.text2,lineHeight:1.55,marginBottom:18}}>Weekend road trips, café corners and style on the road. Plan it, script it and grow it here.</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <PrimaryBtn onClick={()=>go("agent")}><Sparkles size={15}/>Ask your agent</PrimaryBtn>
            <Btn onClick={()=>go("calendar")} color={T.text}><CalendarDays size={15}/>Plan the week</Btn>
            <Btn onClick={()=>go("youtube")} color={T.text}><Youtube size={15}/>YouTube package</Btn>
          </div>
        </div>
      </section>

      {/* Platform snapshot */}
      <div className="grid-2" style={{marginBottom:14}}>
        <button onClick={()=>go("stats")} className="glass platform-ig" style={{padding:18,textAlign:"left",color:T.text,cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:700,color:"#FFB3CF",letterSpacing:.5}}><Instagram size={16}/>INSTAGRAM</div>
          {hasStats ? (
            <div style={{display:"flex",gap:22,marginTop:12,flexWrap:"wrap"}}>
              <div><div className="stat-value">{fmtNum(stats.igFollowers)}</div><div className="stat-label">Followers</div></div>
              <div><div className="stat-value">{fmtNum(stats.igAvgReelViews)}</div><div className="stat-label">Avg Reel views</div></div>
              <div><div className="stat-value">{stats.igEngagementRate||0}%</div><div className="stat-label">Engagement</div></div>
            </div>
          ) : <div style={{fontSize:13,color:T.text2,marginTop:10}}>Add your numbers in <strong>My Stats</strong> to see them here →</div>}
        </button>
        <button onClick={()=>go("monetize")} className="glass platform-yt" style={{padding:18,textAlign:"left",color:T.text,cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:700,color:"#FF9A9D",letterSpacing:.5}}><Youtube size={16}/>YOUTUBE</div>
          {hasStats ? (
            <div style={{display:"flex",gap:22,marginTop:12,flexWrap:"wrap"}}>
              <div><div className="stat-value">{fmtNum(stats.ytSubscribers)}</div><div className="stat-label">Subscribers</div></div>
              <div><div className="stat-value">{fmtNum(stats.ytWatchHours12mo)}</div><div className="stat-label">Watch hrs / 4K</div></div>
              <div><div className="stat-value">{fmtNum(stats.ytShortsViews90d)}</div><div className="stat-label">Shorts views 90d</div></div>
            </div>
          ) : <div style={{fontSize:13,color:T.text2,marginTop:10}}>Track your Partner Program progress in <strong>Monetize</strong> →</div>}
        </button>
      </div>

      {/* Content pipeline */}
      <div className="grid-4" style={{marginBottom:14}}>
        {[
          {l:"Posts planned",v:calendar.length,c:T.amber,I:CalendarDays},
          {l:"Scripts ready",v:scriptCount,c:T.teal,I:FileText},
          {l:"Ready to post",v:readyCount,c:T.green,I:CheckCircle2},
          {l:"Trend-locked",v:trendCount,c:T.pink,I:Flame},
        ].map(s=>(
          <div key={s.l} className="glass stat-tile">
            <div className="stat-icon" style={{background:s.c+"1F",color:s.c}}><s.I size={18}/></div>
            <div className="stat-value" style={{color:T.text}}>{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{marginBottom:14,alignItems:"start"}}>
        {/* Up next */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div className="display" style={{fontSize:19,fontWeight:600}}>Up next</div>
            <Btn small color={T.text2} onClick={()=>go("calendar")}>Full calendar<ChevronRight size={13}/></Btn>
          </div>
          {upcoming.length===0 ? <div style={{fontSize:13,color:T.text3}}>Nothing scheduled. Tap AI Generate on the calendar to plan 30 days.</div> :
            upcoming.map(d=>{ const fi=FORMATS[d.format]; const c=BUCKET_COLORS[d.bucket]||T.accent; const dt=new Date(d.date); return (
              <div key={d.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderTop:`1px solid ${T.border}`}}>
                <div style={{width:44,textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:10,color:T.text3,fontWeight:700}}>{dt.toLocaleDateString("en-IN",{month:"short"}).toUpperCase()}</div>
                  <div className="display" style={{fontSize:22,fontWeight:600,lineHeight:1}}>{dt.getDate()}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.title}</div>
                  <div style={{fontSize:11.5,color:T.text3,marginTop:2}}><span style={{color:fi?.color}}>{fi?.icon} {d.format}</span> · <span style={{color:c}}>{d.bucket}</span></div>
                </div>
              </div>
            );})}
        </Card>

        {/* AI engine */}
        <Card>
          <div className="display" style={{fontSize:19,fontWeight:600,marginBottom:12}}>AI engine</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {I:Radar,l:"Scan trends",s:lastScan?`Last scan ${lastScan.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`:"See what's trending this month",c:T.blue,fn:onScanTrends,ld:loading.trends},
              {I:Wand2,l:"Generate 30-day calendar",s:trends.length>0?`Uses ${trends.length} scanned trends`:"Tip: scan trends first",c:T.accent,fn:onGenerateCal,ld:loading.calendar},
              {I:Siren,l:"Check breaking trends",s:pendingAlert?"1 alert waiting":"Catch a sudden trend early",c:T.pink,fn:onCheckAlert,ld:loading.alert,pulse:!!pendingAlert},
            ].map(a=>(
              <button key={a.l} onClick={a.fn} disabled={a.ld} style={{
                display:"flex",alignItems:"center",gap:12,background:a.c+"12",border:`1px solid ${a.c}35`,
                borderRadius:14,padding:"12px 14px",cursor:a.ld?"default":"pointer",textAlign:"left",color:T.text,fontFamily:"inherit",
                animation:a.pulse?"_btnPulse 1.5s ease infinite":"none",
              }}>
                <style>{`@keyframes _btnPulse{0%,100%{border-color:${a.c}40}50%{border-color:${a.c}}}`}</style>
                <div className="stat-icon" style={{background:a.c+"22",color:a.c,margin:0,flexShrink:0}}>{a.ld?<Spinner size={16} color={a.c}/>:<a.I size={18}/>}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13.5,fontWeight:650}}>{a.l}</div>
                  <div style={{fontSize:11.5,color:T.text3,marginTop:2}}>{a.s}</div>
                </div>
                <ChevronRight size={16} color={T.text3}/>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {pendingAlert&&(
        <Card style={{borderColor:T.red+"55"}}>
          <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Siren size={14}/>BREAKING TREND</div>
          <div className="display" style={{fontSize:18,fontWeight:600,color:T.text,marginBottom:4}}>{pendingAlert.title}</div>
          <div style={{fontSize:13,color:T.text2,marginBottom:12}}>{pendingAlert.description}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn onClick={onAccept} color={T.green} small><CheckCircle2 size={13}/>Add to calendar</Btn>
            <Btn onClick={onDismiss} color={T.text3} small><X size={13}/>Dismiss</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── GITHUB PUSH ──────────────────────────────────────────────────────────────
function GitHubSection({ calendar, trends }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState(null);
  const [pushing, setPushing] = useState(false);

  const OWNER = "masterpieceanurag";
  const REPO  = "inside_my_backpack-content-calendar";

  const pushFile = async (path, content, message) => {
    // Get current SHA if exists
    let sha = undefined;
    try {
      const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
        { headers:{ Authorization:`token ${token}`, Accept:"application/vnd.github.v3+json" }});
      if(r.ok){ const d=await r.json(); sha=d.sha; }
    } catch{}

    const body = { message, content:btoa(unescape(encodeURIComponent(content))), ...(sha?{sha}:{}) };
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method:"PUT",
      headers:{ Authorization:`token ${token}`, "Content-Type":"application/json", Accept:"application/vnd.github.v3+json" },
      body:JSON.stringify(body),
    });
    if(!r.ok){ const e=await r.json(); throw new Error(e.message); }
    return r.json();
  };

  const push = async () => {
    if(!token.trim()){ setStatus({type:"error",msg:"Please enter your GitHub Personal Access Token first."}); return; }
    setPushing(true); setStatus({type:"info",msg:"Pushing to GitHub…"});
    try {
      // 1. Calendar JSON
      await pushFile("data/calendar.json", JSON.stringify(calendar,null,2), "🗓️ Update calendar data");
      // 2. Trends JSON
      if(trends.length>0) await pushFile("data/trends.json", JSON.stringify(trends,null,2), "📈 Update trends data");
      // 3. README
      const md = `# @inside_my_backpack — AI Content OS\n\n> AI-powered Instagram content calendar for a Bangalore-based travel/lifestyle creator.\n\n## Creator Profile\n- **Handle:** @inside_my_backpack\n- **Base:** HSR Layout, Bangalore\n- **Gear:** Sony A7III · DJI Mini 5 Pro · iPhone 15 Pro Max\n- **Budget:** ₹10,000/month travel\n\n## Content Buckets\n${PROFILE.buckets.map(b=>`- ${b}`).join("\n")}\n\n## This Month\n- **${calendar.length} posts** planned\n- **${calendar.filter(d=>d.script).length} scripts** generated\n- **${calendar.filter(d=>d.ready).length}** ready to post\n- **${trends.length} trends** tracked\n\n## Calendar Preview\n| Day | Title | Format | Bucket | Post Time |\n|-----|-------|--------|--------|----------|\n${calendar.slice(0,10).map(d=>`| D${d.id} | ${d.title?.slice(0,40)||""} | ${d.format} | ${d.bucket} | ${d.postTime} |`).join("\n")}\n\n---\n*Last updated: ${new Date().toLocaleString("en-IN")}*\n`;
      await pushFile("README.md", md, "📝 Update README");
      setStatus({type:"success",msg:`✅ Pushed ${calendar.length} posts + ${trends.length} trends to GitHub!`});
    } catch(e) {
      setStatus({type:"error",msg:`❌ Push failed: ${e.message}`});
    }
    setPushing(false);
  };

  return (
    <div>
      <PageHeader icon={Github} color={T.text2} title="GitHub Sync" sub="Back up your calendar, scripts and trends to your GitHub repository."/>

      <div className="glass" style={{padding:18,marginBottom:14}}>
        <div style={{fontSize:12,color:T.text2,marginBottom:10}}>
          To push to GitHub, you need a <strong style={{color:T.accent}}>Personal Access Token</strong> with <code style={{color:T.teal,background:T.bg,padding:"1px 5px",borderRadius:3}}>repo</code> scope.
        </div>
        <div style={{fontSize:11,color:T.text3,marginBottom:12}}>
          Get one at: <span style={{color:T.blue}}>github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)</span>
        </div>
        <div style={{fontSize:10,color:T.text3,marginBottom:8,fontWeight:600}}>GITHUB PAT (never stored, only used for this push)</div>
        <input
          type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          style={{width:"100%",background:T.card2,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,padding:"9px 12px",fontSize:12,outline:"none",fontFamily:"'DM Mono',monospace",boxSizing:"border-box",marginBottom:12}}
        />
        <Btn onClick={push} disabled={pushing||!token} color={T.green}>
          {pushing?<><Spinner size={12} color={T.green}/>Pushing…</>:"🚀 Push to GitHub"}
        </Btn>
      </div>

      {status && (
        <div style={{padding:"10px 14px",borderRadius:8,background:status.type==="success"?T.green+"15":status.type==="error"?T.red+"15":T.blue+"15",border:`1px solid ${status.type==="success"?T.green:status.type==="error"?T.red:T.blue}40`,fontSize:12,color:T.text}}>
          {status.msg}
        </div>
      )}

      <div className="glass" style={{padding:16,marginTop:14}}>
        <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:10}}>📦 What gets pushed</div>
        {[
          ["data/calendar.json",`${calendar.length} posts with titles, hooks, captions, scripts`],
          ["data/trends.json",`${trends.length} current trends`],
          ["README.md","Auto-generated project overview with calendar preview"],
        ].map(([f,d])=>(
          <div key={f} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
            <code style={{fontSize:11,color:T.teal,background:T.bg,padding:"1px 6px",borderRadius:3,flexShrink:0}}>{f}</code>
            <span style={{fontSize:11,color:T.text3}}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN (published version only) ──────────────────────────────────────────
function LoginScreen() {
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await login(pw, remember);
      if (!r.ok) setErr(r.error);
    } catch { setErr("Couldn't reach the server — check your internet connection."); }
    setBusy(false);
  };
  return (
    <>
    <div className="sky" aria-hidden="true"/>
    <div style={{position:"relative",zIndex:1,minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,color:T.text}}>
      <form onSubmit={submit} className="glass" style={{padding:28,width:"100%",maxWidth:380,background:"rgba(24,19,32,0.7)",borderRadius:24}}>
        <BrandMark size={48}/>
        <div className="display" style={{fontSize:28,fontWeight:600,margin:"18px 0 4px",lineHeight:1.1}}>Backpack <span className="gradient-text">OS</span></div>
        <div style={{fontSize:13,color:T.text3,marginBottom:22,display:"flex",alignItems:"center",gap:6}}><Lock size={13}/>Enter your app password to continue</div>
        <input type="password" autoFocus autoComplete="current-password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
          style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${err?T.red:T.border2}`,borderRadius:14,color:T.text,padding:"12px 14px",fontSize:16,outline:"none",fontFamily:"inherit",marginBottom:10}}/>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:T.text2,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember me on this device
        </label>
        {err && <div style={{fontSize:12,color:T.red,marginBottom:10}}>❌ {err}</div>}
        <PrimaryBtn type="submit" disabled={busy||!pw} style={{width:"100%",padding:"13px"}}>
          {busy ? <><Spinner size={14} color="#fff"/>Checking…</> : "Unlock"}
        </PrimaryBtn>
      </form>
    </div>
    </>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"Home",          icon:Home,         group:"Studio" },
  { id:"agent",     label:"Creator Agent", short:"Agent", icon:Bot, group:"Studio" },
  { id:"calendar",  label:"Calendar",      icon:CalendarDays, group:"Studio" },
  { id:"youtube",   label:"YouTube Studio",short:"YouTube", icon:Youtube, group:"Studio" },
  { id:"viral",     label:"Viral Ideas",   icon:Flame,        group:"Studio" },
  { id:"trends",    label:"Trends",        icon:Radar,        group:"Grow" },
  { id:"buckets",   label:"Content Buckets",short:"Buckets", icon:Layers, group:"Grow" },
  { id:"tracker",   label:"Tracker",       icon:ListChecks,   group:"Grow" },
  { id:"monetize",  label:"Monetize",      icon:Wallet,       group:"Earn" },
  { id:"stats",     label:"My Stats",      icon:BarChart3,    group:"Earn" },
  { id:"github",    label:"GitHub Sync",   short:"GitHub", icon:Github, group:"Settings" },
];
const TAB_IDS = ["dashboard","agent","calendar","youtube"];

function BrandMark({ size=40 }) {
  return <div className="brand-mark" style={{width:size,height:size}}><Backpack size={size*0.52} strokeWidth={2}/></div>;
}

function StatusPill({ apiStatus, busy, compact }) {
  if (busy) return (
    <div style={{fontSize:11,color:T.accent,display:"flex",alignItems:"center",gap:6,fontWeight:600}}><Spinner size={12}/>{!compact&&"AI working…"}</div>
  );
  const c = apiStatus.state==="ok" ? T.green : apiStatus.state==="error" ? T.red : T.amber;
  const label = apiStatus.state==="ok" ? "API connected" : apiStatus.state==="error" ? "API problem" : "Checking…";
  return (
    <button onClick={checkApiKey} title={`${apiStatus.message} — tap to re-check`} aria-label={label} style={{fontSize:11,fontWeight:650,color:c,background:c+"16",border:`1px solid ${c}40`,borderRadius:99,padding:compact?"6px 10px":"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"inherit"}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:c,boxShadow:apiStatus.state==="ok"?`0 0 8px ${c}`:"none"}}/>{!compact&&label}
    </button>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const [calendar, setCalendar] = useState(makeSeedCalendar);
  const [trends, setTrends] = useState([]);
  const [, setAlerts] = useState([]);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [loading, setLoading] = useState({ trends:false, calendar:false, alert:false });
  const [selectedDay, setSelectedDay] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [notif, setNotif] = useState(null);
  const [apiStatus, setApiStatus] = useState({ state:"checking", message:"Checking API key…" });
  const [authed, setAuthed] = useState(isLoggedIn);
  useEffect(() => onAuthChange(setAuthed), []);
  useEffect(() => onApiStatus(setApiStatus), []);
  useEffect(() => { if (authed) checkApiKey(); }, [authed]);
  const [stats, setStats] = useState(loadStats);

  const showNotif = useCallback((msg, type="info") => {
    setNotif({msg,type});
    setTimeout(()=>setNotif(null), 4500);
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoading(l=>({...l,trends:true}));
    try {
      const now = new Date();
      const result = await callClaude(SYSTEMS.trends,
        `Simulate current Instagram & social media trends for ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} relevant to a Bangalore travel/lifestyle creator.
Return JSON: { "trends": [{ "title":string, "description":string, "platform":string, "category":string, "strength":"High|Medium|Low", "contentIdea":string, "hashtags":string[] }], "month":string }
Generate 8 trends mixing Instagram Reels, travel, food, men's fashion, and Bangalore-specific topics. Make them specific and actionable.`, 2000);
      if(result.trends){ setTrends(result.trends); setLastScan(new Date()); showNotif(`✅ ${result.trends.length} trends loaded for ${result.month||"this month"}`,"success"); }
    } catch(e){ showNotif("Trend scan failed","error"); }
    setLoading(l=>({...l,trends:false}));
  }, [showNotif]);

  const generateCalendar = useCallback(async () => {
    setLoading(l=>({...l,calendar:true}));
    showNotif("🤖 Building AI calendar…","info");
    try {
      const start = new Date(); start.setDate(start.getDate()+2);
      const tSum = trends.length>0 ? trends.map(t=>`- ${t.title}: ${t.description} (${t.strength})`).join("\n") : "Use seasonal trends for Bangalore in this month.";
      const result = await callClaude(SYSTEMS.calendar,
        `Generate a 30-day content calendar starting ${start.toDateString()}.
Current trends:\n${tSum}

Return JSON array of exactly 30 objects:
[{"day":number,"format":"Reel"|"Carousel"|"Talking Head"|"Story"|"Vlog","bucket":string,"title":string,"hook":string,"caption":string,"cta":string,"hashtags":string,"postTime":"7:00 AM"|"7:30 AM"|"8:00 AM"|"9:00 AM","trendUsed":string|null}]

Mix all 6 buckets, all formats. Days 1-5 = home/city content (no travel needed). Include 4 weekend shoot days (Saturdays). Incorporate trends in ~35% of posts naturally.`, 3500);
      if(Array.isArray(result)){
        const updated = result.slice(0,30).map((e,i)=>{
          const d=new Date(start); d.setDate(d.getDate()+i);
          return { id:i+1, date:d.toISOString(), aiGenerated:true, trendLocked:!!e.trendUsed, ready:i<5, script:null, ...e };
        });
        setCalendar(updated);
        showNotif("✅ AI calendar ready!","success");
      }
    } catch(e){ showNotif("Calendar generation failed","error"); }
    setLoading(l=>({...l,calendar:false}));
  }, [trends, showNotif]);

  const checkAlerts = useCallback(async () => {
    setLoading(l=>({...l,alert:true}));
    try {
      const result = await callClaude(SYSTEMS.trends,
        `Simulate a sudden BREAKING ad-hoc trend on Instagram/social media right now that is highly relevant for a Bangalore travel/lifestyle content creator.
Return JSON: {"hasAlert":true,"alert":{"title":string,"description":string,"urgency":"HIGH","platform":string,"category":string,"strength":string,"contentIdea":string,"suggestedFormat":string,"replaceDayNumber":number,"replacementPost":{"title":string,"hook":string,"caption":string,"cta":string,"format":string,"bucket":string}}}
Make it realistic: viral hashtag, Bangalore place suddenly trending, food trend, fashion moment, etc.`, 1200);
      if(result.hasAlert&&result.alert){
        setPendingAlert(result.alert);
        setAlerts(prev=>[{...result.alert,timestamp:new Date()},...prev.slice(0,9)]);
        showNotif("🚨 Breaking trend detected! Check Alerts.","alert");
      }
    } catch(e){}
    setLoading(l=>({...l,alert:false}));
  }, [showNotif]);

  const acceptAlert = useCallback(()=>{
    if(!pendingAlert) return;
    const dn = pendingAlert.replaceDayNumber||1;
    setCalendar(prev=>prev.map(d=>d.id!==dn?d:{...d,...pendingAlert.replacementPost,trendLocked:true,aiGenerated:true}));
    showNotif(`✅ Day ${dn} updated with trending content!`,"success");
    setPendingAlert(null);
  },[pendingAlert,showNotif]);

  const updateDay = useCallback(updated=>{
    setCalendar(prev=>prev.map(d=>d.id===updated.id?updated:d));
    setSelectedDay(updated);
  },[]);

  if (!authed) return <LoginScreen/>;

  const busy = loading.trends||loading.calendar||loading.alert;
  const go = (id) => { setView(id); setMoreOpen(false); window.scrollTo({top:0}); };
  const groups = [...new Set(NAV.map(n=>n.group))];
  const moreActive = !TAB_IDS.includes(view);

  return (
    <>
      <div className="sky" aria-hidden="true"/>
      <div className="shell">
        <Notif n={notif}/>

        {/* Laptop: sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <BrandMark/>
            <div>
              <div className="brand-name">Backpack OS</div>
              <div className="brand-sub">@inside_my_backpack · Bangalore</div>
            </div>
          </div>
          {groups.map(g => (
            <div key={g}>
              <div className="nav-group">{g}</div>
              {NAV.filter(n=>n.group===g).map(n => {
                const Icon = n.icon;
                return (
                  <button key={n.id} className={`nav-item ${view===n.id?"active":""}`} onClick={()=>go(n.id)}>
                    <Icon size={17} strokeWidth={2}/>{n.label}
                    {n.id==="trends"&&trends.length>0&&<span className="nav-badge">{trends.length}</span>}
                    {n.id==="trends"&&pendingAlert&&<span className="nav-badge" style={{background:T.red+"30",color:T.red}}>!</span>}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="sidebar-foot">
            <StatusPill apiStatus={apiStatus} busy={busy}/>
            {PROXY_MODE && <button className="nav-item" onClick={logout}><LogOut size={16}/>Log out</button>}
          </div>
        </aside>

        {/* Phone: top bar */}
        <header className="topbar">
          <div className="brand">
            <BrandMark size={34}/>
            <div>
              <div className="brand-name">Backpack OS</div>
              <div className="brand-sub">@inside_my_backpack</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {pendingAlert&&<button onClick={()=>go("trends")} aria-label="Trend alert" style={{background:T.red+"20",border:`1px solid ${T.red}50`,color:T.red,borderRadius:99,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}><Siren size={16}/></button>}
            <StatusPill apiStatus={apiStatus} busy={busy} compact/>
          </div>
        </header>

        <main className="main">
          {apiStatus.state==="error" && (
            <div className="glass" style={{background:T.red+"14",borderColor:T.red+"45",fontSize:13,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:18}}>
              <AlertTriangle size={16} color={T.red}/><span style={{flex:1,minWidth:200}}>{apiStatus.message}</span>
              <Btn small color={T.red} onClick={checkApiKey}><RefreshCw size={13}/>Re-check</Btn>
            </div>
          )}
          <div key={view} className="page-enter">
            {view==="dashboard" && <Dashboard calendar={calendar} trends={trends} stats={stats} loading={loading} pendingAlert={pendingAlert} lastScan={lastScan} onScanTrends={fetchTrends} onGenerateCal={generateCalendar} onCheckAlert={checkAlerts} onAccept={acceptAlert} onDismiss={()=>setPendingAlert(null)} go={go}/>}
            {view==="agent"     && <AgentSection stats={stats} calendar={calendar} trends={trends}/>}
            {view==="youtube"   && <YouTubeSection stats={stats} showNotif={showNotif}/>}
            {view==="monetize"  && <MonetizeSection stats={stats} showNotif={showNotif}/>}
            {view==="stats"     && <StatsSection stats={stats} setStats={setStats} showNotif={showNotif}/>}
            {view==="calendar"  && <CalendarSection calendar={calendar} onDayClick={setSelectedDay} onGenerate={generateCalendar} loadingCal={loading.calendar}/>}
            {view==="viral"     && <ViralSection showNotif={showNotif}/>}
            {view==="buckets"   && <BucketsSection calendar={calendar}/>}
            {view==="trends"    && <TrendsSection trends={trends} loading={loading.trends} onScan={fetchTrends} lastScan={lastScan} pendingAlert={pendingAlert} onAccept={acceptAlert} onDismiss={()=>setPendingAlert(null)}/>}
            {view==="tracker"   && <TrackerSection calendar={calendar}/>}
            {view==="github"    && <GitHubSection calendar={calendar} trends={trends}/>}
          </div>
        </main>

        {/* Phone: bottom tab bar */}
        <nav className="tabbar" aria-label="Main">
          {TAB_IDS.map(id => {
            const n = NAV.find(x=>x.id===id); const Icon = n.icon;
            return <button key={id} className={`tab ${view===id?"active":""}`} onClick={()=>go(id)}><Icon size={20} strokeWidth={2}/>{n.short||n.label}</button>;
          })}
          <button className={`tab ${moreActive||moreOpen?"active":""}`} onClick={()=>setMoreOpen(o=>!o)}><Grid3X3 size={20} strokeWidth={2}/>More</button>
        </nav>
        {moreOpen && (
          <div className="more-sheet" onClick={()=>setMoreOpen(false)}>
            <div className="more-panel" onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px 12px"}}>
                <span className="display" style={{fontSize:18,fontWeight:600}}>More</span>
                <button onClick={()=>setMoreOpen(false)} aria-label="Close" style={{background:"transparent",border:0,color:T.text2,padding:4}}><X size={20}/></button>
              </div>
              <div className="more-grid">
                {NAV.filter(n=>!TAB_IDS.includes(n.id)).map(n => {
                  const Icon = n.icon;
                  return <button key={n.id} className={`more-item ${view===n.id?"active":""}`} onClick={()=>go(n.id)}><Icon size={22} strokeWidth={1.8} color={view===n.id?T.accent:undefined}/>{n.short||n.label}</button>;
                })}
                {PROXY_MODE && <button className="more-item" onClick={()=>{setMoreOpen(false);logout();}}><LogOut size={22} strokeWidth={1.8}/>Log out</button>}
              </div>
            </div>
          </div>
        )}

        {selectedDay && (
          <DayModal day={selectedDay} onClose={()=>setSelectedDay(null)} onUpdate={updateDay}/>
        )}
      </div>
    </>
  );
}
