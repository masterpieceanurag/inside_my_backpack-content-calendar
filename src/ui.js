import React from "react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
// Golden-hour palette. Colour tokens stay 6-digit hex because components add
// alpha by appending two hex digits (e.g. color+"20"); surfaces are translucent
// so the sunset sky (styles.css) glows through.
export const T = {
  bg:"#0D0A12", surface:"rgba(20,16,28,0.72)", card:"rgba(255,255,255,0.045)", card2:"rgba(255,255,255,0.07)",
  border:"rgba(255,255,255,0.08)", border2:"rgba(255,255,255,0.12)", border3:"rgba(255,255,255,0.18)",
  accent:"#FF7A45", amber:"#FFC15E", blue:"#5AA9FF", purple:"#9B7BFF",
  teal:"#2ED3B7", green:"#3DDC97", red:"#FF5A5F", pink:"#FF4F8B",
  orange:"#FF9F43", indigo:"#7C83FF",
  text:"#FBF6EF", text2:"#C9BFB5", text3:"#8C8291",
};

export const SUNSET = "linear-gradient(135deg,#FF7A45 0%,#FF4F8B 55%,#9B7BFF 100%)";

// True on phone-sized screens; follows window resizes and rotation.
export function useIsMobile(query = "(max-width: 820px)") {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [m, setM] = React.useState(get);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const fn = () => setM(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn));
  }, [query]);
  return m;
}

// ─── TINY UI ATOMS ────────────────────────────────────────────────────────────
export const Pill = ({ label, color, small, onClick }) => (
  <span onClick={onClick} style={{
    background:color+"1F", color, border:`1px solid ${color}38`,
    borderRadius:99, padding:small?"2px 9px":"5px 13px",
    fontSize:small?10.5:12, fontWeight:600, whiteSpace:"nowrap",
    cursor:onClick?"pointer":"default", userSelect:"none", display:"inline-flex", alignItems:"center", gap:5,
    transition:"background .15s",
  }}>{label}</span>
);

export const Spinner = ({ size=16, color=T.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    style={{animation:"_spin .75s linear infinite",flexShrink:0}}>
    <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" fill="none"
      strokeDasharray="35 20" strokeLinecap="round"/>
  </svg>
);

export const Btn = ({ children, onClick, color=T.accent, disabled, small, style:sx }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:disabled?"rgba(255,255,255,0.05)":color+"1C", border:`1px solid ${disabled?T.border2:color+"48"}`,
    color:disabled?T.text3:color, borderRadius:99,
    padding:small?"6px 13px":"9px 18px", cursor:disabled?"default":"pointer",
    fontSize:small?11.5:13, fontWeight:650, display:"inline-flex", alignItems:"center", justifyContent:"center",
    gap:7, transition:"all .15s", whiteSpace:"nowrap", fontFamily:"inherit", ...sx,
  }}>{children}</button>
);

// Primary call-to-action with the sunset gradient.
export const PrimaryBtn = ({ children, onClick, disabled, style:sx, type }) => (
  <button type={type} className="btn-primary" onClick={onClick} disabled={disabled} style={sx}>{children}</button>
);

export const Card = ({ children, style:sx, className="" }) => (
  <div className={`glass ${className}`} style={{padding:18,...sx}}>{children}</div>
);

export const Label = ({ children }) => (
  <div style={{fontSize:10.5,color:T.text3,fontWeight:700,letterSpacing:1,marginBottom:7,textTransform:"uppercase"}}>{children}</div>
);

// Page heading used by every screen: icon tile, serif title, subtitle, actions.
export const PageHeader = ({ icon:Icon, color=T.accent, title, sub, right }) => (
  <div className="page-head">
    <div>
      {Icon && <div className="page-icon" style={{color}}><Icon size={18} strokeWidth={2}/></div>}
      <h1 className="page-title">{title}</h1>
      {sub && <div className="page-sub">{sub}</div>}
    </div>
    {right && <div className="head-actions">{right}</div>}
  </div>
);

export const inputStyle = {
  width:"100%",background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border2}`,borderRadius:12,color:T.text,
  padding:"11px 14px",fontSize:13.5,outline:"none",fontFamily:"inherit",boxSizing:"border-box",
};

// Minimal, safe markdown → React (headings, bold, bullets, links-as-text).
export function Markdown({ text }) {
  const lines = (text || "").split("\n");
  const inline = (s, k) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={k+"-"+i} style={{color:T.text}}>{p.slice(2,-2)}</strong> : <span key={k+"-"+i}>{p}</span>);
  return (
    <div style={{fontSize:13,lineHeight:1.7,color:T.text2}}>
      {lines.map((l, i) => {
        const h = l.match(/^(#{1,4})\s+(.*)/);
        if (h) return <div key={i} style={{fontSize:h[1].length<=2?15:13,fontWeight:700,color:T.text,margin:"10px 0 4px"}}>{inline(h[2], i)}</div>;
        const b = l.match(/^\s*([-*•]|\d+\.)\s+(.*)/);
        if (b) return <div key={i} style={{display:"flex",gap:8,paddingLeft:l.search(/\S/)>1?16:0}}><span style={{color:T.accent,flexShrink:0}}>{/\d/.test(b[1])?b[1]:"•"}</span><span>{inline(b[2], i)}</span></div>;
        if (!l.trim()) return <div key={i} style={{height:6}}/>;
        return <div key={i}>{inline(l, i)}</div>;
      })}
    </div>
  );
}

// Creator stats persisted per-browser (used by the agent + monetization tools).
const STATS_KEY = "imb_creator_stats_v1";
export const DEFAULT_STATS = {
  igFollowers: 0, igAvgReelViews: 0, igEngagementRate: 0,
  ytSubscribers: 0, ytWatchHours12mo: 0, ytShortsViews90d: 0, ytUploads90d: 0, ytAvgViews: 0,
  goal: "Grow to 10K on Instagram and get YouTube monetized",
};
export function loadStats() {
  try { return { ...DEFAULT_STATS, ...(JSON.parse(localStorage.getItem(STATS_KEY)) || {}) }; }
  catch { return { ...DEFAULT_STATS }; }
}
export function saveStats(s) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {}
}
