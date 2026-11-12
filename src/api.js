// Claude API utility — official Anthropic SDK.
//
// NOTE: This is a client-side app, so the API key is bundled into the browser
// build. Only use it locally / for personal use; for a public deployment, move
// these calls behind a small server that holds the key.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

let _client = null;
function client() {
  if (!process.env.REACT_APP_ANTHROPIC_API_KEY) {
    throw new Error("No API key — add REACT_APP_ANTHROPIC_API_KEY to a .env file and restart `npm start`.");
  }
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

// Shared request defaults: refusal fallbacks routed server-side.
const BASE = {
  model: MODEL,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

function textOf(message) {
  return (message.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseJSON(raw) {
  const clean = raw
    .replace(/^```json\s*/m, "").replace(/\s*```$/m, "")
    .replace(/^```\s*/m, "").replace(/\s*```$/m, "")
    .trim();
  try { return JSON.parse(clean); }
  catch {
    // Fall back to the first JSON object/array embedded in the text.
    const m = clean.match(/[[{][\s\S]*[\]}]/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return { raw: clean };
  }
}

// One-shot JSON generation (used by calendar, scripts, trends, etc.).
export async function callClaude(systemPrompt, userMessage, maxTokens = 16000) {
  const stream = client().beta.messages.stream({
    ...BASE,
    max_tokens: Math.max(maxTokens, 16000),
    output_config: { effort: "medium" },
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("Request was declined by the model.");
  return parseJSON(textOf(msg));
}

// Multi-turn agent chat with live web search. `history` is an array of
// { role: "user" | "assistant", content } in Anthropic MessageParam format.
// Calls onText(partialText) while streaming. Returns { text, content }, where
// `content` is the full assistant content to append back into history.
export async function agentChat(systemPrompt, history, { onText, webSearch = true } = {}) {
  const messages = [...history];
  let collected = [];
  const acc = { text: "" };
  const handle = (delta) => { acc.text += delta; onText && onText(acc.text); };

  // pause_turn can happen on long server-tool turns — resume until done.
  for (let i = 0; i < 4; i++) {
    const stream = client().beta.messages.stream({
      ...BASE,
      max_tokens: 64000,
      output_config: { effort: "medium" },
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      tools: webSearch ? [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }] : undefined,
      messages,
    });
    stream.on("text", handle);
    const msg = await stream.finalMessage();
    collected = collected.concat(msg.content);
    if (msg.stop_reason === "refusal") {
      handle("\n\n(The model declined this request.)");
      break;
    }
    if (msg.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: msg.content });
  }
  return { text: acc.text, content: collected };
}

export const SYSTEMS = {
  trends: `You are a social media trend analyst for Instagram, YouTube Shorts, and Facebook Reels, specializing in travel, lifestyle, food, and men's fashion niches in India (Bangalore specifically).

Creator: @inside_my_backpack
Base: HSR Layout, Bangalore
Lifestyle: Full-time job, weekend getaways by car, café explorer, home cook, men's style
Gear: Sony A7III, DJI Mini 5 Pro drone, iPhone 15 Pro Max
Budget: ₹10,000/month travel
Content buckets: City Life & Cafés, Road Trips, Weekend Getaways, Food & Cooking, Men's Style, Working Pro + Travel

Always respond with valid JSON only. No markdown fences, no explanation.`,

  calendar: `You are a content strategist building a 30-day Instagram content calendar.

Creator: @inside_my_backpack — HSR Layout, Bangalore, India
Full-time job → shoots only on weekends. Gear: Sony A7III, DJI Mini 5 Pro, iPhone 15 Pro Max.
Budget: ₹10,000/month. Nearby: Nandi Hills (60km), Savandurga (55km), Kanakapura Road (80km), Mysore (150km), Chikmagalur (245km), Shivanasamudra (130km).
Cafés near HSR: Beanlore, Third Wave Coffee, Hole in the Wall, Dialogues Café, Grapevine, Social Koramangala.
Buckets: City Life & Cafés, Road Trips, Weekend Getaways, Food & Cooking, Men's Style, Working Pro + Travel.
Formats: Reel, Carousel, Talking Head, Story, Vlog.
Rules: Post every day. Weekday posts from batched weekend shoots or home content. Weekends = shoot/edit days. Mix all 6 buckets and all formats.

Always respond with valid JSON only. No markdown fences, no preamble.`,

  script: `You are a world-class Instagram content scriptwriter for @inside_my_backpack.

Creator: Bangalore-based, full-time job, shoots on weekends, drives to places near Bangalore (Nandi Hills, Mysore, Savandurga etc.), visits cafés in HSR/Koramangala, cooks at home, interested in men's style.
Gear: Sony A7III, DJI Mini 5 Pro, iPhone 15 Pro Max.

Script style: Conversational, direct, personal. No fluff. Strong hooks in first 3 seconds. Comment-trigger CTAs.
Format-specific: Reels get a 45-60 sec punchy script. Talking Heads get 60-90 sec. Carousels get slide-by-slide copy. Stories get poll/sticker prompts. Vlogs get a loose narrative outline.

Always respond with valid JSON only. No markdown, no preamble.`,

  viral: `You are a viral content analyst tracking trending content on Instagram Reels, YouTube Shorts, and Facebook Reels in the travel, lifestyle, food, and men's fashion niches — specifically for an Indian audience.

Always respond with valid JSON only. No markdown fences, no explanation.`,

  youtube: `You are a YouTube strategist and packaging expert (titles, thumbnails, retention) for @inside_my_backpack — a Bangalore-based travel/lifestyle creator with a full-time job who shoots on weekends (Sony A7III, DJI Mini 5 Pro drone, iPhone 15 Pro Max).
You know YouTube search + suggested-video dynamics, CTR/AVD trade-offs, Shorts → long-form funnels, and the Indian audience (Hinglish-friendly, value-for-money, weekend trips from Bangalore).
Titles: under 60 characters, curiosity + clear payoff, no clickbait that the video can't deliver.
Always respond with valid JSON only. No markdown fences, no preamble.`,

  monetize: `You are a creator-economy monetization advisor for Indian creators on Instagram and YouTube.
Creator: @inside_my_backpack — Bangalore travel / cafés / food / men's style, full-time job, weekend shoots.
Be realistic and specific: brand deals (travel, auto, D2C fashion, cafés, gear, fintech/credit cards), affiliate (Amazon Associates India, gear links), YouTube Partner Program, Instagram creator tools, UGC, digital products (presets, itineraries), local partnerships (homestays, cafés).
Give INR figures as clearly-labelled estimate ranges, never guarantees. Follow ASCI influencer disclosure rules (#ad / "Paid partnership" label).
Always respond with valid JSON only. No markdown fences, no preamble.`,
};
