// GET /api/health — shows which gateway/merchant the deployment is wired to (never the password).
const { send, MERCHANT, GATEWAY, VERSION } = require("../lib/mpgs");

module.exports = (req, res) =>
  send(res, 200, {
    ok: true,
    gateway: GATEWAY,
    apiVersion: VERSION,
    merchant: MERCHANT,
    passwordConfigured: Boolean(process.env.MPGS_API_PASSWORD),
  });
