// Shared password check for the serverless functions.
// APP_PASSWORD is set in Vercel → Project → Settings → Environment Variables.
const crypto = require("crypto");

function digest(s) {
  return crypto.createHash("sha256").update(String(s || ""), "utf8").digest();
}

// Constant-time comparison so the password can't be guessed by timing.
function passwordOk(req) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false; // locked until a password is configured
  const given = req.headers["x-app-password"] || "";
  return crypto.timingSafeEqual(digest(given), digest(expected));
}

// Small delay on failures to slow down password guessing.
const failDelay = () => new Promise((r) => setTimeout(r, 800));

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = { passwordOk, failDelay, sendJson };
