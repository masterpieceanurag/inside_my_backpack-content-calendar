import React from "react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
export const T = {
  bg:"#080A0F", surface:"#0D1117", card:"#141820", card2:"#1A2030",
  border:"#1E2535", border2:"#263040", border3:"#2E3A50",
  accent:"#F59E0B", amber:"#FBBF24", blue:"#3B82F6", purple:"#8B5CF6",
  teal:"#14B8A6", green:"#22C55E", red:"#EF4444", pink:"#EC4899",
  orange:"#FB923C", indigo:"#6366F1",
  text:"#F0F4FF", text2:"#8899AA", text3:"#445566",
};

// ─── TINY UI ATOMS ────────────────────────────────────────────────────────────
export const Pill = ({ label, color, small, onClick }) => (
  <span onClick={onClick} style={{
    background:color+"20", color, border:`1px solid ${color}35`,
    borderRadius:5, padding:small?"1px 7px":"3px 10px",
    fontSize:small?10:11, fontWeight:600, whiteSpace:"nowrap",
    cursor:onClick?"pointer":"default", userSelect:"none",
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
    background:disabled?T.border:color+"20", border:`1px solid ${disabled?T.border2:color+"45"}`,
    color:disabled?T.text3:color, borderRadius:8,
    padding:small?"5px 11px":"8px 16px", cursor:disabled?"default":"pointer",
    fontSize:small?11:12, fontWeight:600, display:"inline-flex", alignItems:"center",
    gap:6, transition:"all .15s", whiteSpace:"nowrap", ...sx,
  }}>{children}</button>
);

export const Card = ({ children, style:sx }) => (
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,...sx}}>{children}</div>
);

export const Label = ({ children }) => (
  <div style={{fontSize:10,color:T.text3,fontWeight:700,letterSpacing:.6,marginBottom:6,textTransform:"uppercase"}}>{children}</div>
);

export const inputStyle = {
  width:"100%",background:T.card2,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,
  padding:"8px 11px",fontSize:12,outline:"none",fontFamily:"inherit",boxSizing:"border-box",
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
