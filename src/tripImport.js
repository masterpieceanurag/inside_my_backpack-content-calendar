// Trip planner → Backpack OS handoff.
//
// A trip planner (e.g. the Meghalaya New Year Trip page on claude.ai) opens
// Backpack OS with its posting plan in the URL:  https://<this app>/#trip=<base64url JSON>
// The same JSON can also be pasted in Calendar → Import trip.
//
// Payload: { v:1, trip:{ id, name, url }, posts:[{ id, d:"YYYY-MM-DD", t, f, h, lead, status, owner }] }
// Each imported post gets ext = "<trip.id>:<post.id>", so sending again updates
// those posts in place (keeping any script/caption you wrote) instead of duplicating.
import { useState } from "react";
import { T, Btn, PrimaryBtn, Pill } from "./ui";
import { fmtDate } from "./data";

const FORMAT_MAP = { reel: "Reel", carousel: "Carousel", stories: "Story", story: "Story", vlog: "Vlog", "talking head": "Talking Head" };
const mapFormat = (f = "") => {
  const k = String(f).toLowerCase();
  if (FORMAT_MAP[k]) return FORMAT_MAP[k];
  if (/youtube|film|long/.test(k)) return "Vlog";
  if (/carousel/.test(k)) return "Carousel";
  if (/stor/.test(k)) return "Story";
  return "Reel";
};

function decodePayload(raw) {
  let s = String(raw || "").trim();
  if (!s) throw new Error("Nothing to import.");
  let obj;
  if (s.startsWith("{")) obj = JSON.parse(s);
  else {
    s = s.replace(/^.*#trip=/, "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    obj = JSON.parse(new TextDecoder().decode(bytes));
  }
  if (!obj || !obj.trip || !obj.trip.id || !Array.isArray(obj.posts) || !obj.posts.length)
    throw new Error("That doesn't look like a trip posting plan.");
  obj.posts = obj.posts.filter((p) => p && p.id && /^\d{4}-\d{2}-\d{2}$/.test(p.d || "") && p.t).slice(0, 100);
  if (!obj.posts.length) throw new Error("The trip plan had no valid posts.");
  return obj;
}

// Read (and clear) a #trip= handoff from the URL once, at startup.
export function takeTripFromUrl() {
  try {
    const h = window.location.hash || "";
    if (!h.startsWith("#trip=")) return null;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return decodePayload(h.slice(6));
  } catch (e) {
    return { error: e.message || "Couldn't read the trip link." };
  }
}

export function parseTripText(text) { return decodePayload(text); }

// Merge trip posts into the calendar. Returns { calendar, added, updated }.
export function mergeTrip(calendar, payload) {
  const trip = payload.trip;
  const byExt = new Map(calendar.filter((d) => d.ext).map((d) => [d.ext, d]));
  let nextId = calendar.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0) + 1;
  let added = 0, updated = 0;
  const fresh = [];
  const patch = new Map();
  payload.posts.forEach((p) => {
    const ext = `${trip.id}:${p.id}`;
    const base = {
      date: new Date(`${p.d}T09:00:00+05:30`).toISOString(),
      format: mapFormat(p.f),
      title: p.t,
      tripStatus: p.status || "Idea",
      tripOwner: p.owner || "",
      tripLead: p.lead || "",
      trip: { id: trip.id, name: trip.name || "Trip", url: trip.url || "" },
      ready: p.status === "Scheduled" || p.status === "Posted",
      locked: true, // AI Generate keeps locked posts, so trip posts survive a regenerate
    };
    const old = byExt.get(ext);
    if (old) { patch.set(ext, { ...old, ...base, hook: old.hook || p.h || "" }); updated++; }
    else {
      fresh.push({ id: nextId++, ext, ...base, bucket: "Road Trips", hook: p.h || "", postTime: "7:30 PM",
        caption: "", cta: "", hashtags: "", script: null, trendLocked: false, aiGenerated: false });
      added++;
    }
  });
  return { calendar: [...calendar.map((d) => patch.get(d.ext) || d), ...fresh], added, updated };
}

export function TripImportModal({ payload, calendar, onImport, onClose }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState(payload?.error || "");
  const [data, setData] = useState(payload && !payload.error ? payload : null);
  const existing = data ? new Set(calendar.filter((d) => d.ext).map((d) => d.ext)) : new Set();
  const nNew = data ? data.posts.filter((p) => !existing.has(`${data.trip.id}:${p.id}`)).length : 0;

  const read = () => { try { setData(parseTripText(text)); setErr(""); } catch (e) { setErr(e.message || "Couldn't read that."); } };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,4,8,.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "rgba(24,19,32,0.97)", border: `1px solid ${T.border3}`, borderRadius: 22, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", padding: 22, color: T.text }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>🏔️ Import trip posts</div>
        {!data && (
          <>
            <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 12, lineHeight: 1.5 }}>
              In your trip planner, open Content → Posting plan and tap <b>Send to Backpack OS</b>. Or tap <b>Copy for Backpack OS</b> there and paste it here.
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste the trip plan here"
              style={{ width: "100%", boxSizing: "border-box", background: T.card2, border: `1px solid ${err ? T.red : T.border2}`, borderRadius: 10, color: T.text, padding: 10, fontSize: 12, fontFamily: "inherit", marginBottom: 10 }} />
          </>
        )}
        {err && <div style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>❌ {err}</div>}
        {data && (
          <>
            <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 12 }}>
              {data.trip.name}: {data.posts.length} posts · {nNew} new, {data.posts.length - nNew} already in your calendar (they'll update).
              Imported posts are locked so AI Generate won't overwrite them.
            </div>
            <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
              {data.posts.map((p) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: 10, alignItems: "center", fontSize: 12.5, padding: "7px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                  <span style={{ color: T.text3 }}>{fmtDate(`${p.d}T09:00:00+05:30`)}</span>
                  <span style={{ minWidth: 0 }}>{p.t}<span style={{ color: T.text3 }}> · {mapFormat(p.f)}{p.owner ? ` · ${p.owner}` : ""}</span></span>
                  <Pill small label={p.status || "Idea"} color={p.status === "Posted" ? T.green : p.status === "Scheduled" ? T.blue : T.text3} />
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {data
            ? <PrimaryBtn onClick={() => onImport(data)}>Add to calendar</PrimaryBtn>
            : <PrimaryBtn onClick={read} disabled={!text.trim()}>Read plan</PrimaryBtn>}
          <Btn onClick={onClose} color={T.text3}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}
