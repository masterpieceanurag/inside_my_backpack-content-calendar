// POST /api/login — checks the app password (sent in the x-app-password header).
const { passwordOk, failDelay, sendJson } = require("./_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  if (!process.env.APP_PASSWORD) {
    return sendJson(res, 503, { ok: false, error: "APP_PASSWORD is not set on the server yet." });
  }
  if (!passwordOk(req)) {
    await failDelay();
    return sendJson(res, 401, { ok: false, error: "Wrong password" });
  }
  return sendJson(res, 200, { ok: true });
};
