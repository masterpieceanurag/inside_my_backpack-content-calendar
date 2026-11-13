// Password-protected proxy to the Claude API.
//
// The browser never sees the real API key: it calls /api/anthropic/<path>
// (rewritten to this function by vercel.json), and this function adds
// ANTHROPIC_API_KEY on the server before forwarding to api.anthropic.com.
// Only the two endpoints the app uses are allowed, so a leaked password
// can't be used to reach anything else on the account.
const { Readable } = require("stream");
const { passwordOk, failDelay, sendJson } = require("./_auth");

const UPSTREAM = process.env.ANTHROPIC_UPSTREAM || "https://api.anthropic.com";

const ALLOWED = [
  { method: "POST", re: /^v1\/messages$/ },
  { method: "GET", re: /^v1\/models\/[A-Za-z0-9._-]+$/ },
];

// Request headers passed through to Anthropic (everything else is dropped,
// including the browser's dummy x-api-key and the app password).
const FORWARD_REQ = ["anthropic-version", "anthropic-beta", "content-type", "accept"];
// Response headers passed back to the browser.
const FORWARD_RES = ["content-type", "request-id", "retry-after", "anthropic-ratelimit-requests-remaining"];

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = (url.searchParams.get("path") || "").replace(/^\/+/, "");

  if (!passwordOk(req)) {
    await failDelay();
    return sendJson(res, 401, { type: "error", error: { type: "app_password_error", message: "Wrong or missing app password" } });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return sendJson(res, 500, { type: "error", error: { type: "authentication_error", message: "ANTHROPIC_API_KEY is not set on the server." } });
  }
  if (!ALLOWED.some((a) => a.method === req.method && a.re.test(path))) {
    return sendJson(res, 404, { type: "error", error: { type: "not_found_error", message: "Endpoint not allowed" } });
  }

  const headers = { "x-api-key": process.env.ANTHROPIC_API_KEY };
  for (const h of FORWARD_REQ) if (req.headers[h]) headers[h] = req.headers[h];

  let upstream;
  try {
    upstream = await fetch(`${UPSTREAM}/${path}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await readBody(req) : undefined,
    });
  } catch (e) {
    return sendJson(res, 502, { type: "error", error: { type: "api_error", message: "Could not reach the Claude API." } });
  }

  res.statusCode = upstream.status;
  for (const h of FORWARD_RES) {
    const v = upstream.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  res.setHeader("cache-control", "no-store");
  if (!upstream.body) return res.end();
  // Stream the response through so chat replies appear word by word.
  Readable.fromWeb(upstream.body).pipe(res);
};
