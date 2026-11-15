// GET /api/stats — live creator numbers for the dashboard (password-protected).
//
// YouTube (needs YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID): public channel stats
//   via the YouTube Data API v3 (~3 quota units per refresh; free quota is
//   10,000/day).
// Instagram (needs INSTAGRAM_ACCESS_TOKEN from a Meta app using "Instagram API
//   with Instagram Login"): followers, recent Reel views and engagement.
//
// Each platform is optional: a missing key just leaves those numbers manual.
// Results are cached in memory for 10 minutes per server instance.
const { passwordOk, failDelay, sendJson } = require("./_auth");

const CACHE_MS = 10 * 60 * 1000;
let cache = null; // { at, body }

async function getJson(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const msg = j.error?.message || `HTTP ${r.status}`;
    const err = new Error(msg);
    err.code = j.error?.code;
    throw err;
  }
  return j;
}

async function youtube(key, channelId) {
  const base = "https://www.googleapis.com/youtube/v3";
  const ch = await getJson(`${base}/channels?part=statistics,snippet,contentDetails&id=${encodeURIComponent(channelId)}&key=${key}`);
  const c = ch.items?.[0];
  if (!c) throw new Error("Channel not found — check YOUTUBE_CHANNEL_ID");
  const s = c.statistics || {};
  const out = {
    ytSubscribers: s.hiddenSubscriberCount ? null : Number(s.subscriberCount || 0),
    ytTotalViews: Number(s.viewCount || 0),
    ytVideoCount: Number(s.videoCount || 0),
  };
  // Recent uploads (1 unit) + their view counts (1 unit).
  const uploads = c.contentDetails?.relatedPlaylists?.uploads;
  if (uploads) {
    const pl = await getJson(`${base}/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}&key=${key}`);
    const items = (pl.items || []).map((i) => ({ id: i.contentDetails.videoId, at: new Date(i.contentDetails.videoPublishedAt || 0) }));
    const since = Date.now() - 90 * 864e5;
    out.ytUploads90d = items.filter((i) => i.at.getTime() >= since).length;
    const recent = items.slice(0, 10).map((i) => i.id);
    if (recent.length) {
      const v = await getJson(`${base}/videos?part=statistics&id=${recent.join(",")}&key=${key}`);
      const views = (v.items || []).map((x) => Number(x.statistics?.viewCount || 0));
      if (views.length) out.ytAvgViews = Math.round(views.reduce((a, b) => a + b, 0) / views.length);
    }
  }
  return { values: out, title: c.snippet?.title };
}

async function instagram(token) {
  const base = "https://graph.instagram.com";
  const me = await getJson(`${base}/me?fields=username,followers_count,media_count&access_token=${encodeURIComponent(token)}`);
  const out = { igFollowers: Number(me.followers_count || 0) };
  const media = await getJson(`${base}/me/media?fields=id,media_product_type,like_count,comments_count,timestamp&limit=24&access_token=${encodeURIComponent(token)}`);
  const posts = media.data || [];
  const recent = posts.slice(0, 12);
  if (recent.length && out.igFollowers) {
    const eng = recent.reduce((a, p) => a + (p.like_count || 0) + (p.comments_count || 0), 0) / recent.length;
    out.igEngagementRate = Math.round((eng / out.igFollowers) * 1000) / 10; // one decimal, %
  }
  const reels = posts.filter((p) => p.media_product_type === "REELS").slice(0, 12);
  const views = (await Promise.all(reels.map((r) =>
    getJson(`${base}/${r.id}/insights?metric=views&access_token=${encodeURIComponent(token)}`)
      .then((j) => Number(j.data?.[0]?.values?.[0]?.value ?? j.data?.[0]?.total_value?.value ?? NaN))
      .catch(() => NaN)))).filter((n) => Number.isFinite(n));
  if (views.length) out.igAvgReelViews = Math.round(views.reduce((a, b) => a + b, 0) / views.length);
  return { values: out, username: me.username };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
  if (!passwordOk(req)) { await failDelay(); return sendJson(res, 401, { error: "Wrong or missing app password" }); }

  const fresh = new URL(req.url, "http://localhost").searchParams.get("fresh") === "1";
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return sendJson(res, 200, cache.body);

  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID, INSTAGRAM_ACCESS_TOKEN } = process.env;
  const body = { updatedAt: new Date().toISOString(), values: {}, sources: {}, errors: {}, configured: {
    youtube: !!(YOUTUBE_API_KEY && YOUTUBE_CHANNEL_ID), instagram: !!INSTAGRAM_ACCESS_TOKEN,
  } };

  const jobs = [];
  if (body.configured.youtube) jobs.push(youtube(YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID)
    .then((r) => { Object.assign(body.values, r.values); body.sources.youtube = r.title || "YouTube"; })
    .catch((e) => { body.errors.youtube = e.message; }));
  if (body.configured.instagram) jobs.push(instagram(INSTAGRAM_ACCESS_TOKEN)
    .then((r) => { Object.assign(body.values, r.values); body.sources.instagram = r.username ? `@${r.username}` : "Instagram"; })
    .catch((e) => {
      body.errors.instagram = /expired|Session has expired|code 190|Error validating access token/i.test(e.message) || e.code === 190
        ? "Instagram token expired — generate a new one in your Meta app and update INSTAGRAM_ACCESS_TOKEN in Vercel."
        : e.message;
    }));
  await Promise.all(jobs);

  // Never cache null values over manual ones.
  Object.keys(body.values).forEach((k) => body.values[k] == null && delete body.values[k]);
  if (!Object.keys(body.errors).length) cache = { at: Date.now(), body };
  return sendJson(res, 200, body);
};
