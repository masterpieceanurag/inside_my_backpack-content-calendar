import { useState, useEffect, useCallback, useRef } from "react";
import { callClaude, SYSTEMS } from "./api";
import { PROFILE, FORMATS, BUCKET_COLORS, MONTH_NAMES, makeSeedCalendar, fmtDate, fmtDateObj } from "./data";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const T = {
  bg:"#080A0F", surface:"#0D1117", card:"#141820", card2:"#1A2030",
  border:"#1E2535", border2:"#263040", border3:"#2E3A50",
  accent:"#F59E0B", amber:"#FBBF24", blue:"#3B82F6", purple:"#8B5CF6",
  teal:"#14B8A6", green:"#22C55E", red:"#EF4444", pink:"#EC4899",
  orange:"#FB923C", indigo:"#6366F1",
  text:"#F0F4FF", text2:"#8899AA", text3:"#445566",
};

// ─── TINY UI ATOMS ────────────────────────────────────────────────────────────
const Pill = ({ label, color, small, onClick }) => (
  <span onClick={onClick} style={{
    background:color+"20", color, border:`1px solid ${color}35`,
    borderRadius:5, padding:small?"1px 7px":"3px 10px",
    fontSize:small?10:11, fontWeight:600, whiteSpace:"nowrap",
    cursor:onClick?"pointer":"default", userSelect:"none",
  }}>{label}</span>
);

const Spinner = ({ size=16, color=T.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    style={{animation:"_spin .75s linear infinite",flexShrink:0}}>
    <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" fill="none"
      strokeDasharray="35 20" strokeLinecap="round"/>
  </svg>
);

const Btn = ({ children, onClick, color=T.accent, disabled, small, style:sx }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:disabled?T.border:color+"20", border:`1px solid ${disabled?T.border2:color+"45"}`,
    color:disabled?T.text3:color, borderRadius:8,
    padding:small?"5px 11px":"8px 16px", cursor:disabled?"default":"pointer",
    fontSize:small?11:12, fontWeight:600, display:"inline-flex", alignItems:"center",
    gap:6, transition:"all .15s", whiteSpace:"nowrap", ...sx,
  }}>{children}</button>
);

const Notif = ({ n }) => n ? (
  <div style={{
    position:"fixed",top:16,right:16,zIndex:9000,
    background:n.type==="error"?T.red+"25":n.type==="success"?T.green+"25":n.type==="alert"?T.red+"30":T.blue+"25",
    border:`1px solid ${n.type==="error"?T.red:n.type==="success"?T.green:n.type==="alert"?T.red:T.blue}55`,
    borderRadius:10,padding:"10px 16px",maxWidth:340,fontSize:12,color:T.text,
    boxShadow:"0 10px 30px rgba(0,0,0,.5)",animation:"_notifIn .25s ease",
  }}>
    <style>{`@keyframes _notifIn{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}`}</style>
    {n.msg}
  </div>
) : null;

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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.border3}`,borderRadius:16,width:"100%",maxWidth:680,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexShrink:0}}>
          <div>
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              <Pill label={`${fmtInfo.icon} ${day.format}`} color={fmtInfo.color} small/>
              <Pill label={day.bucket} color={BUCKET_COLORS[day.bucket]||T.purple} small/>
              <Pill label={`⏰ ${day.postTime}`} color={T.text3} small/>
              {day.trendLocked && <Pill label="🔥 Trend" color={T.red} small/>}
            </div>
            <div style={{fontSize:15,fontWeight:700,color:T.text,lineHeight:1.3}}>{day.title}</div>
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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.border3}`,borderRadius:16,width:"100%",maxWidth:540,maxHeight:"85vh",overflowY:"auto",padding:22,position:"relative"}}>
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
            <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:10,lineHeight:1.4}}>{day.title}</div>
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
function ViralSection({ showNotif }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("All");

  const fetch = useCallback(async (p) => {
    setLoading(true);
    try {
      const result = await callClaude(SYSTEMS.viral,
        `Generate 12 viral content ideas trending right now on Instagram Reels, YouTube Shorts, and Facebook Reels for a Bangalore-based travel/lifestyle/food/men's fashion creator.
${p!=="All"?`Focus only on ${p}.`:"Mix all three platforms."}

Return JSON array of 12 objects:
[{
  "platform": "Instagram"|"YouTube"|"Facebook",
  "title": string (viral content idea title),
  "description": string (2-sentence description of the trend/format),
  "format": "Reel"|"Short"|"Vlog"|"Carousel",
  "niche": string (travel|food|style|lifestyle|motivation),
  "viralScore": number 1-100,
  "hook": string (specific hook sentence for this creator to use),
  "adaptation": string (how @inside_my_backpack can make this their own — be specific with Bangalore/HSR/gear context),
  "exampleAngle": string (concrete example post idea),
  "trendWindow": string (e.g. "This week", "Next 2 weeks", "Evergreen")
}]`, 2500);
      if (Array.isArray(result)) setItems(result);
    } catch(e) { showNotif("Failed to load viral content", "error"); }
    setLoading(false);
  }, [showNotif]);

  useEffect(() => { fetch("All"); }, []);// eslint-disable-line

  const platforms = ["All","Instagram","YouTube","Facebook"];
  const filtered = platform==="All"?items:items.filter(i=>i.platform===platform);

  const platColor = { Instagram:T.pink, YouTube:T.red, Facebook:T.blue, All:T.accent };
  const platIcon  = { Instagram:"📸", YouTube:"▶️", Facebook:"👥" };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:T.text}}>🔥 Viral Content Suggestions</div>
          <div style={{fontSize:11,color:T.text3,marginTop:2}}>Trending formats across Instagram, YouTube & Facebook — adapted for your niche</div>
        </div>
        <Btn onClick={()=>fetch(platform)} disabled={loading} color={T.accent}>
          {loading?<><Spinner size={12}/>Loading…</>:"🔄 Refresh"}
        </Btn>
      </div>

      {/* Platform filter */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {platforms.map(p=>(
          <Pill key={p} label={`${platIcon[p]||"🌐"} ${p}`} color={platform===p?platColor[p]:T.text3}
            onClick={()=>{setPlatform(p);fetch(p);}}/>
        ))}
      </div>

      {loading ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,height:180,animation:"_pulse 1.5s ease infinite",animationDelay:`${i*.1}s`}}>
              <style>{`@keyframes _pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:T.text3}}>
          <div style={{fontSize:32,marginBottom:8}}>🔍</div>
          <div>No content loaded. Hit Refresh.</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
          {filtered.map((item, i) => {
            const pc = platColor[item.platform]||T.accent;
            return (
              <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,transition:"border-color .15s",cursor:"default"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Pill label={`${platIcon[item.platform]||"🌐"} ${item.platform}`} color={pc} small/>
                    <Pill label={item.format} color={T.text3} small/>
                    {item.niche && <Pill label={item.niche} color={T.purple} small/>}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:item.viralScore>80?T.green:item.viralScore>60?T.accent:T.text3,background:(item.viralScore>80?T.green:item.viralScore>60?T.accent:T.text3)+"20",padding:"2px 7px",borderRadius:4,flexShrink:0}}>
                    🔥 {item.viralScore}
                  </div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:5,lineHeight:1.3}}>{item.title}</div>
                <div style={{fontSize:11,color:T.text2,lineHeight:1.5,marginBottom:8}}>{item.description}</div>
                <div style={{fontSize:11,color:pc,padding:"6px 9px",background:pc+"10",borderRadius:6,borderLeft:`2px solid ${pc}`,marginBottom:8,lineHeight:1.4}}>
                  🎯 {item.adaptation}
                </div>
                <div style={{fontSize:10,color:T.text3,marginBottom:4}}>💡 {item.exampleAngle}</div>
                {item.trendWindow && (
                  <Pill label={`⏳ ${item.trendWindow}`} color={item.trendWindow.includes("week")?T.orange:T.teal} small/>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CONTENT BUCKETS ─────────────────────────────────────────────────────────
function BucketsSection({ calendar }) {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>🗂️ Content Buckets</div>
      <div style={{fontSize:11,color:T.text3,marginBottom:16}}>6 buckets built for your lifestyle — working professional, weekend driver, home cook, Bangalore local.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {PROFILE.buckets.map(b => {
          const posts = calendar.filter(d=>d.bucket===b);
          const color = BUCKET_COLORS[b]||T.accent;
          const fc = {};
          posts.forEach(p=>{ fc[p.format]=(fc[p.format]||0)+1; });
          const isOpen = selected===b;
          return (
            <div key={b} onClick={()=>setSelected(isOpen?null:b)} style={{background:T.card,border:`1.5px solid ${isOpen?color:T.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all .15s"}}>
              <div style={{padding:"14px 16px",borderLeft:`4px solid ${color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color,marginBottom:3}}>{b}</div>
                    <div style={{fontSize:11,color:T.text3}}>{posts.length} posts this month</div>
                  </div>
                  <div style={{fontSize:18,fontWeight:700,color}}>{posts.length}</div>
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
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>📊 Production Tracker</div>
      <div style={{fontSize:11,color:T.text3,marginBottom:14}}>Click checkboxes to advance phases. Fill in metrics after posting.</div>
      <div style={{overflowX:"auto"}}>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:T.text}}>📅 Content Calendar</div>
          <div style={{fontSize:11,color:T.text3,marginTop:2}}>Click any day to view post brief + generate/edit script</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Btn onClick={()=>setMonth(m=>{const d=new Date(m.year,m.month-1,1);return{year:d.getFullYear(),month:d.getMonth()}})} color={T.text3} small>← Prev</Btn>
          <span style={{fontSize:13,fontWeight:600,color:T.text,minWidth:120,textAlign:"center"}}>{MONTH_NAMES[month.month]} {month.year}</span>
          <Btn onClick={()=>setMonth(m=>{const d=new Date(m.year,m.month+1,1);return{year:d.getFullYear(),month:d.getMonth()}})} color={T.text3} small>Next →</Btn>
          <Btn onClick={onGenerate} disabled={loadingCal} color={T.accent}>
            {loadingCal?<><Spinner size={11}/>Generating…</>:"🤖 AI Generate"}
          </Btn>
        </div>
      </div>

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
              background:entry?.trendLocked?T.red+"18":entry?.aiGenerated?T.blue+"10":T.card,
              border:`1.5px solid ${isToday?T.accent:entry?.trendLocked?T.red+"50":T.border}`,
              borderRadius:8,padding:"6px 7px 7px",minHeight:76,cursor:entry?"pointer":"default",transition:"all .12s",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:10,color:isToday?T.accent:T.text3,fontWeight:isToday?700:400}}>{date.getDate()}</span>
                <div style={{display:"flex",gap:2}}>
                  {entry?.script&&<span style={{fontSize:8,color:T.teal}}>📝</span>}
                  {entry?.trendLocked&&<span style={{fontSize:8,color:T.red}}>🔥</span>}
                  {entry?.aiGenerated&&!entry.trendLocked&&<span style={{fontSize:8,color:T.blue}}>🤖</span>}
                </div>
              </div>
              {entry&&<>
                <div style={{fontSize:9,color:fi?.color||T.text3,fontWeight:600,marginBottom:1}}>{fi?.icon} {entry.format}</div>
                <div style={{fontSize:9,color:T.text2,lineHeight:1.25}}>{entry.title?.slice(0,36)}{entry.title?.length>36?"…":""}</div>
                <div style={{fontSize:8,color:T.text3,marginTop:2}}>⏰ {entry.postTime}</div>
                {entry.ready&&<div style={{fontSize:7,color:T.green,fontWeight:700,marginTop:1}}>✅ READY</div>}
              </>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:14,marginTop:10,flexWrap:"wrap"}}>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:T.text}}>🌐 Live Trend Monitor</div>
          <div style={{fontSize:11,color:T.text3,marginTop:2}}>{lastScan?`Last scan: ${lastScan.toLocaleTimeString("en-IN")}`:"Not yet scanned — hit Scan to load live trends"}</div>
        </div>
        <Btn onClick={onScan} disabled={loading} color={T.blue}>
          {loading?<><Spinner size={12} color={T.blue}/>Scanning…</>:"🔄 Scan Trends"}
        </Btn>
      </div>

      {pendingAlert && (
        <div style={{background:T.card,border:`1px solid ${T.red}50`,borderRadius:12,padding:16,marginBottom:16,animation:"_alertPulse 2s ease infinite"}}>
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
          <div style={{fontSize:32,marginBottom:10}}>📡</div>
          <div style={{fontSize:14,color:T.text2,marginBottom:4}}>No trends loaded yet</div>
          <div style={{fontSize:12}}>Click "Scan Trends" to pull live Instagram & social media trends</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {trends.map((t,i)=>{
            const strengthColor = t.strength==="High"?T.green:t.strength==="Medium"?T.accent:T.text3;
            return (
              <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                  <Pill label={t.platform||"Instagram"} color={T.blue} small/>
                  <Pill label={t.category||"Trending"} color={T.purple} small/>
                  <Pill label={`${t.strength==="High"?"🔥":t.strength==="Medium"?"📈":"💡"} ${t.strength}`} color={strengthColor} small/>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:4}}>{t.title}</div>
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
function Dashboard({ calendar, trends, loading, pendingAlert, lastScan, onScanTrends, onGenerateCal, onCheckAlert, onAccept, onDismiss }) {
  const readyCount = calendar.filter(d=>d.ready).length;
  const scriptCount = calendar.filter(d=>d.script).length;
  const trendCount = calendar.filter(d=>d.trendLocked).length;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {l:"Total Posts",v:calendar.length,c:T.accent,i:"📅"},
          {l:"Scripts Ready",v:scriptCount,c:T.teal,i:"📝"},
          {l:"Ready to Post",v:readyCount,c:T.green,i:"✅"},
          {l:"Trend-Locked",v:trendCount,c:T.red,i:"🔥"},
        ].map(s=>(
          <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:22,marginBottom:5}}>{s.i}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.c,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:10,color:T.text3,fontWeight:500,marginTop:4,letterSpacing:.5}}>{s.l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:18,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:12}}>🤖 AI Engine</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[
            {i:"🌐",l:"Scan Trends",s:lastScan?`Last: ${lastScan.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`:"Never scanned",c:T.blue,fn:onScanTrends,ld:loading.trends},
            {i:"📅",l:"Generate Calendar",s:trends.length>0?`${trends.length} trends loaded`:"Load trends first",c:T.accent,fn:onGenerateCal,ld:loading.calendar},
            {i:"🚨",l:"Check Breaking Trends",s:pendingAlert?"1 alert pending!":"Scan for breaking trends",c:T.red,fn:onCheckAlert,ld:loading.alert,pulse:!!pendingAlert},
          ].map(a=>(
            <button key={a.l} onClick={a.fn} disabled={a.ld} style={{
              background:a.ld?T.border:a.c+"15",border:`1px solid ${a.c}${a.ld?"20":"40"}`,
              borderRadius:10,padding:"12px",cursor:a.ld?"default":"pointer",textAlign:"left",
              animation:a.pulse?"_btnPulse 1.5s ease infinite":"none",
            }}>
              <style>{`@keyframes _btnPulse{0%,100%{border-color:${a.c}40}50%{border-color:${a.c}}}`}</style>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:20}}>{a.i}</span>
                {a.ld&&<Spinner size={14} color={a.c}/>}
              </div>
              <div style={{fontSize:12,fontWeight:600,color:a.ld?T.text3:a.c,marginTop:6}}>{a.l}</div>
              <div style={{fontSize:10,color:T.text3,marginTop:2}}>{a.s}</div>
            </button>
          ))}
        </div>
      </div>

      {pendingAlert&&(
        <div style={{background:T.card,border:`1px solid ${T.red}40`,borderRadius:12,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8}}>🚨 Breaking Trend Alert</div>
          <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:4}}>{pendingAlert.title}</div>
          <div style={{fontSize:11,color:T.text2,marginBottom:10}}>{pendingAlert.description}</div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={onAccept} color={T.green} small>✅ Update Calendar</Btn>
            <Btn onClick={onDismiss} color={T.red} small>✕ Dismiss</Btn>
          </div>
        </div>
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
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>🐙 GitHub Sync</div>
      <div style={{fontSize:11,color:T.text3,marginBottom:16}}>Push your calendar, scripts, and trends data to <strong style={{color:T.text}}>masterpieceanurag/inside_my_backpack-content-calendar</strong></div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:18,marginBottom:14}}>
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

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,marginTop:14}}>
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

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"⚡ Dashboard" },
  { id:"calendar",  label:"📅 Calendar" },
  { id:"viral",     label:"🔥 Viral Ideas" },
  { id:"buckets",   label:"🗂️ Buckets" },
  { id:"trends",    label:"🌐 Trends" },
  { id:"tracker",   label:"📊 Tracker" },
  { id:"github",    label:"🐙 GitHub" },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [calendar, setCalendar] = useState(makeSeedCalendar);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [loading, setLoading] = useState({ trends:false, calendar:false, alert:false });
  const [selectedDay, setSelectedDay] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [notif, setNotif] = useState(null);

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

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'DM Sans','Nunito Sans','Inter',system-ui,sans-serif",color:T.text,display:"flex",flexDirection:"column"}}>
      <Notif n={notif}/>

      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"11px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.amber})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🎒</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,letterSpacing:"-.3px",lineHeight:1}}>@inside_my_backpack</div>
            <div style={{fontSize:10,color:T.text3,marginTop:1}}>AI Content OS · HSR Layout, Bangalore</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {pendingAlert&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.red,background:T.red+"15",border:`1px solid ${T.red}40`,borderRadius:6,padding:"3px 9px",cursor:"pointer"}} onClick={()=>setView("trends")}>🚨 Trend Alert</div>}
          <div style={{fontSize:10,color:loading.trends||loading.calendar?T.accent:T.text3,display:"flex",alignItems:"center",gap:4}}>
            {loading.trends||loading.calendar||loading.alert?<><Spinner size={10}/>AI working…</>:"● Live"}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",overflowX:"auto",flexShrink:0}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${view===n.id?T.accent:"transparent"}`,color:view===n.id?T.accent:T.text3,padding:"10px 14px",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",transition:"all .12s"}}>
            {n.label}{n.id==="trends"&&trends.length>0?` (${trends.length})`:""}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        {view==="dashboard" && <Dashboard calendar={calendar} trends={trends} loading={loading} pendingAlert={pendingAlert} lastScan={lastScan} onScanTrends={fetchTrends} onGenerateCal={generateCalendar} onCheckAlert={checkAlerts} onAccept={acceptAlert} onDismiss={()=>setPendingAlert(null)}/>}
        {view==="calendar"  && <CalendarSection calendar={calendar} onDayClick={setSelectedDay} onGenerate={generateCalendar} loadingCal={loading.calendar}/>}
        {view==="viral"     && <ViralSection showNotif={showNotif}/>}
        {view==="buckets"   && <BucketsSection calendar={calendar}/>}
        {view==="trends"    && <TrendsSection trends={trends} loading={loading.trends} onScan={fetchTrends} lastScan={lastScan} pendingAlert={pendingAlert} onAccept={acceptAlert} onDismiss={()=>setPendingAlert(null)}/>}
        {view==="tracker"   && <TrackerSection calendar={calendar}/>}
        {view==="github"    && <GitHubSection calendar={calendar} trends={trends}/>}
      </div>

      {/* Day Modal */}
      {selectedDay && (
        <DayModal day={selectedDay} onClose={()=>setSelectedDay(null)} onUpdate={updateDay}/>
      )}
    </div>
  );
}
