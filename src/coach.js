// Post Coach: upload photos/videos, get AI feedback, then chat about them.
//
// Media never leaves the browser except inside the request to Claude:
// - photos are downscaled to JPEG (keeps requests under Vercel's 4.5 MB body
//   limit and keeps cost down),
// - videos are sampled into still frames (Claude reads images, not video),
// - nothing is stored; leaving the page clears the session.
import { useState, useRef, useEffect, useCallback } from "react";
import { agentChat } from "./api";
import { PROFILE } from "./data";
import { T, Pill, Spinner, Btn, PrimaryBtn, Card, Label, Markdown, PageHeader, inputStyle } from "./ui";
import { ImagePlus, Film, X, Send, Sparkles, Trash2, Copy, Globe, Upload } from "lucide-react";

const MAX_ITEMS = 12;            // photos + videos the user can add
const FRAMES_PER_VIDEO = 6;      // stills sampled from each video
const MAX_IMAGES_SENT = 30;      // hard cap on images in one request
const BODY_BUDGET = 3_400_000;   // base64 chars; stays under Vercel's 4.5 MB limit

const GOALS = ["Not sure, advise me", "Instagram carousel", "Instagram Reel", "YouTube Short", "Story", "YouTube thumbnail"];

const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// Draw an image/video frame to a canvas and return base64 JPEG (no prefix).
function toJpeg(source, w, h, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  c.getContext("2d").drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality).split(",")[1];
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unsupported")); };
    img.src = url;
  });
}

function seek(video, t) {
  return new Promise((resolve) => {
    const done = () => { video.removeEventListener("seeked", done); resolve(); };
    video.addEventListener("seeked", done);
    video.currentTime = t;
  });
}

async function videoFrames(file, count) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = url;
  await new Promise((resolve, reject) => {
    video.onloadeddata = resolve;
    video.onerror = () => reject(new Error("unsupported"));
  });
  const dur = isFinite(video.duration) ? video.duration : 0;
  const n = dur < 4 ? 2 : count;
  const times = Array.from({ length: n }, (_, i) => Math.min(dur - 0.05, (dur * (i + 0.5)) / n));
  const frames = [];
  for (const t of times) {
    await seek(video, Math.max(0, t));
    frames.push({ t, el: video, w: video.videoWidth, h: video.videoHeight, snap: toJpeg(video, video.videoWidth, video.videoHeight, 1024, 0.75) });
  }
  return { url, duration: dur, frames, w: video.videoWidth, h: video.videoHeight };
}

// Re-encode every image so the whole request fits the size budget.
function encodeAll(items, maxSide, quality) {
  return items.map((it) => it.kind === "photo"
    ? { ...it, data: toJpeg(it.img, it.w, it.h, maxSide, quality) }
    : it); // video frames were encoded at capture time
}
const totalSize = (items) => items.reduce((s, it) => s + (it.kind === "photo" ? it.data.length : it.frames.reduce((a, f) => a + f.snap.length, 0)), 0);

function buildSystem(stats) {
  return `You are a hands-on visual content coach for ${PROFILE.handle}, an Instagram and YouTube creator.
Profile: ${PROFILE.base}; full-time job, shoots on weekends; gear ${PROFILE.gear.join(", ")}; buckets: ${PROFILE.buckets.join(", ")}. Grew up in Bihar, lives in Bangalore. Best-performing content so far: relatable millennial humour over their own travel footage, emotional "missing home" stories, useful road-trip tips.
Current numbers: Instagram ${stats.igFollowers || "?"} followers, ~${stats.igAvgReelViews || "?"} avg Reel views, ${stats.igEngagementRate || "?"}% engagement; YouTube ${stats.ytSubscribers || "?"} subscribers.

How to work:
- Look carefully at every image. Refer to items by their number ("#3"). Videos arrive as still frames with timestamps; say so if a judgement needs the actual motion or audio.
- Be specific and practical: which to post and in what order, crops/aspect ratio (4:5 for feed, 9:16 for Reels/Stories), light edits, on-screen text, captions (Hinglish is welcome), hashtags (10–15, mix of big and niche), audio ideas, best time to post (their audience is mostly 25–34 working professionals in India), and how to repurpose for Reels/Shorts.
- Be honest about weak shots, kindly.
- Be respectful of people in photos, especially at religious or cultural events; suggest crediting or asking people when it matters.
- Never invent statistics. If web search is enabled, use it only for genuinely current information (trending audio, a festival date) and say what you found.
- Keep answers scannable: short headings, bullets, copy-ready captions in quotes.`;
}

export function CoachSection({ stats }) {
  const [items, setItems] = useState([]);         // {id, kind, name, url, w, h, img?, data?, duration?, frames?}
  const [goal, setGoal] = useState(GOALS[0]);
  const [context, setContext] = useState("");
  const [web, setWeb] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [history, setHistory] = useState([]);     // API messages with display text
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [history, streaming]);
  useEffect(() => () => items.forEach((it) => URL.revokeObjectURL(it.url)), []); // eslint-disable-line

  const addFiles = useCallback(async (files) => {
    setError("");
    const list = Array.from(files || []).slice(0, Math.max(0, MAX_ITEMS - items.length));
    if (!list.length) { if (files?.length) setError(`You can add up to ${MAX_ITEMS} photos or videos.`); return; }
    setPreparing(true);
    const added = []; const failed = [];
    for (const f of list) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        if (f.type.startsWith("video/")) {
          const v = await videoFrames(f, FRAMES_PER_VIDEO);
          added.push({ id, kind: "video", name: f.name, url: v.url, w: v.w, h: v.h, duration: v.duration, frames: v.frames.map(({ t, snap }) => ({ t, snap })) });
        } else {
          const { img, url } = await loadImage(f);
          added.push({ id, kind: "photo", name: f.name, url, img, w: img.naturalWidth, h: img.naturalHeight });
        }
      } catch { failed.push(f.name); }
    }
    setItems((prev) => [...prev, ...added]);
    if (failed.length) setError(`Couldn't read ${failed.join(", ")}. Try exporting as JPG/PNG (photos) or MP4/MOV (videos).`);
    setPreparing(false);
  }, [items.length]);

  const remove = (id) => setItems((prev) => { const it = prev.find((x) => x.id === id); if (it) URL.revokeObjectURL(it.url); return prev.filter((x) => x.id !== id); });

  const reset = () => { items.forEach((it) => URL.revokeObjectURL(it.url)); setItems([]); setHistory([]); setStreaming(""); setError(""); setInput(""); };

  const run = async (messages) => {
    setBusy(true); setStreaming(""); setError("");
    try {
      const apiMsgs = messages.map(({ role, content }) => ({ role, content }));
      const { text, content } = await agentChat(buildSystem(stats), apiMsgs, { onText: setStreaming, webSearch: web, maxSearches: 3 });
      setHistory([...messages, { role: "assistant", content: content.length ? content : [{ type: "text", text: text || "(no reply)" }], display: text }]);
    } catch (e) {
      setError(e.message || "Request failed");
      setHistory(messages.slice(0, -1));
      return false;
    } finally { setStreaming(""); setBusy(false); }
    return true;
  };

  const analyse = async () => {
    if (!items.length || busy) return;
    // Encode photos, shrinking further if the request would be too big.
    let enc = encodeAll(items, 1024, 0.78);
    if (totalSize(enc) > BODY_BUDGET) enc = encodeAll(items, 768, 0.7);
    if (totalSize(enc) > BODY_BUDGET) enc = encodeAll(items, 600, 0.6);
    const blocks = [];
    let images = 0;
    enc.forEach((it, i) => {
      if (it.kind === "photo") {
        blocks.push({ type: "text", text: `#${i + 1}: photo (${it.w}×${it.h}${it.h > it.w ? ", portrait" : it.w > it.h ? ", landscape" : ", square"})` });
        if (images++ < MAX_IMAGES_SENT) blocks.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: it.data } });
      } else {
        blocks.push({ type: "text", text: `#${i + 1}: video, ${fmtDur(it.duration)} long (${it.w}×${it.h}). ${it.frames.length} still frames follow, at ${it.frames.map((f) => fmtDur(f.t)).join(", ")}.` });
        it.frames.forEach((f) => { if (images++ < MAX_IMAGES_SENT) blocks.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.snap } }); });
      }
    });
    if (totalSize(enc) > BODY_BUDGET) { setError("These files are too large to send together. Remove a few and try again."); return; }
    // Cache the media so follow-up questions are cheaper.
    for (let i = blocks.length - 1; i >= 0; i--) if (blocks[i].type === "image") { blocks[i] = { ...blocks[i], cache_control: { type: "ephemeral" } }; break; }
    const ask = `Goal: ${goal}.${context.trim() ? `\nContext from me: ${context.trim()}` : ""}

Review these and tell me:
1. Quick verdict: what this set is best for (carousel / Reel / Short / Story), and why.
2. Best picks and posting order (by number), plus anything to drop.
3. Edits per item: crop/aspect ratio, light/colour fixes, anything distracting.
4. Hook / on-screen text for the first slide or first 2 seconds.
5. Two caption options (copy-ready) with a comment-trigger CTA.
6. 10–15 hashtags.
7. Audio/music direction.
8. Best time to post and one engagement tip for the first hour.
9. How to repurpose this for a Reel and a YouTube Short.`;
    blocks.push({ type: "text", text: ask });
    const label = `${items.length} item${items.length > 1 ? "s" : ""} · ${goal}${context.trim() ? ` · ${context.trim()}` : ""}`;
    await run([{ role: "user", content: blocks, display: `📎 ${label}` }]);
  };

  const followUp = async (q) => {
    const text = (q ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const ok = await run([...history, { role: "user", content: text, display: text }]);
    if (!ok) setInput(text);
  };

  const started = history.length > 0;
  const copy = (t) => navigator.clipboard?.writeText(t);

  return (
    <div>
      <PageHeader icon={ImagePlus} color={T.pink} title="Post Coach"
        sub="Upload photos or videos from a shoot and get feedback: what to post, in what order, crops, captions, hashtags, music and timing. Then ask follow-up questions."
        right={(items.length > 0 || started) && <Btn small color={T.text3} onClick={() => { if (window.confirm("Clear these files and the conversation?")) reset(); }}><Trash2 size={13}/>Start over</Btn>}/>

      {/* Upload area */}
      <Card style={{ marginBottom: 14 }}>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}/>
        {items.length === 0 ? (
          <button onClick={() => fileRef.current?.click()} disabled={preparing}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            style={{ width: "100%", border: `1.5px dashed ${T.border3}`, borderRadius: 16, background: "rgba(255,255,255,0.03)", color: T.text2, padding: "34px 16px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {preparing ? <Spinner size={22}/> : <Upload size={26} color={T.pink}/>}
            <div className="display" style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{preparing ? "Preparing…" : "Add photos or videos"}</div>
            <div style={{ fontSize: 12.5, color: T.text3 }}>Tap to choose from your gallery, or drag files here · up to {MAX_ITEMS}</div>
          </button>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 10 }}>
              {items.map((it, i) => (
                <div key={it.id} style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border2}`, background: "#000" }}>
                  {it.kind === "photo"
                    ? <img src={it.url} alt={`Item ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    : <img src={`data:image/jpeg;base64,${it.frames[0]?.snap}`} alt={`Video ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>}
                  <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px" }}>#{i + 1}</span>
                  {it.kind === "video" && <span style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 10.5, fontWeight: 600, borderRadius: 99, padding: "2px 7px", display: "flex", alignItems: "center", gap: 4 }}><Film size={11}/>{fmtDur(it.duration)}</span>}
                  {!started && <button aria-label={`Remove item ${i + 1}`} onClick={() => remove(it.id)} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 99, border: 0, background: "rgba(0,0,0,.65)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14}/></button>}
                </div>
              ))}
              {!started && items.length < MAX_ITEMS && (
                <button onClick={() => fileRef.current?.click()} disabled={preparing} style={{ aspectRatio: "4 / 5", borderRadius: 12, border: `1.5px dashed ${T.border3}`, background: "rgba(255,255,255,0.03)", color: T.text2, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: 12 }}>
                  {preparing ? <Spinner size={18}/> : <ImagePlus size={20}/>}Add more
                </button>
              )}
            </div>
            {items.some((x) => x.kind === "video") && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 10 }}>Videos are reviewed as {FRAMES_PER_VIDEO} still frames each. The AI can't hear audio or judge motion exactly.</div>}
          </>
        )}

        {items.length > 0 && !started && (
          <div style={{ marginTop: 16 }}>
            <Label>What's this for?</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {GOALS.map((g) => <Pill key={g} label={g} color={goal === g ? T.pink : T.text3} onClick={() => setGoal(g)}/>)}
            </div>
            <Label>Context (optional)</Label>
            <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Chhath at Art of Living, Bangalore · want it to feel nostalgic" style={{ ...inputStyle, marginBottom: 12 }}/>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.text2, marginBottom: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)}/><Globe size={14}/>Also check the web for current trends (slower, costs a bit more)
            </label>
            <PrimaryBtn onClick={analyse} disabled={busy || preparing}>{busy ? <><Spinner size={13} color="#fff"/>Reviewing…</> : <><Sparkles size={15}/>Get suggestions</>}</PrimaryBtn>
          </div>
        )}
        {error && <div style={{ fontSize: 12.5, color: T.red, marginTop: 12 }}>❌ {error}</div>}
      </Card>

      {/* Conversation */}
      {(started || busy) && (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: 16 }}>
            {history.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "92%", background: m.role === "user" ? "linear-gradient(135deg, rgba(255,122,69,.22), rgba(255,79,139,.18))" : "rgba(255,255,255,0.05)", border: `1px solid ${m.role === "user" ? T.accent + "45" : T.border2}`, borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 15px" }}>
                  {m.role === "user" ? <div style={{ fontSize: 13, color: T.text, whiteSpace: "pre-wrap" }}>{m.display}</div> : <>
                    <Markdown text={m.display}/>
                    <div style={{ marginTop: 8 }}><Btn small color={T.text3} onClick={() => copy(m.display)}><Copy size={12}/>Copy</Btn></div>
                  </>}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: "flex", marginBottom: 12 }}>
                <div style={{ maxWidth: "92%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border2}`, borderRadius: "18px 18px 18px 4px", padding: "11px 15px" }}>
                  {streaming ? <Markdown text={streaming}/> : <div style={{ display: "flex", gap: 8, alignItems: "center", color: T.text2, fontSize: 12.5 }}><Spinner size={14}/>Looking at your {items.length > 1 ? `${items.length} items` : "file"}…</div>}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          {started && (
            <div style={{ borderTop: `1px solid ${T.border}`, padding: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {["Write it in Hinglish", "Make the caption shorter", "Give me a Reel edit plan", "Which one for a YouTube thumbnail?"].map((q) => (
                  <Pill key={q} label={q} color={T.text3} small onClick={() => followUp(q)}/>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); followUp(); } }}
                  placeholder="Ask a follow-up about these photos…" style={{ ...inputStyle, resize: "none", flex: 1 }}/>
                <PrimaryBtn onClick={() => followUp()} disabled={busy || !input.trim()} style={{ alignSelf: "stretch", padding: "0 18px" }}>{busy ? <Spinner size={14} color="#fff"/> : <Send size={17}/>}</PrimaryBtn>
              </div>
            </div>
          )}
        </Card>
      )}
      <div style={{ fontSize: 11.5, color: T.text3, marginTop: 12, lineHeight: 1.5 }}>Files stay in this browser tab and are only sent to Claude for review. Nothing is saved, so leaving this page clears them. A first review of about 10 photos costs roughly 5–15 US cents of Claude credit; follow-up questions cost less.</div>
    </div>
  );
}
