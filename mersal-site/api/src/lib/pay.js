// The card payment switch, kept in public/js/layout.js inside the SITE block (one `key: "value"` per line):
//   payMode:     "off" | "demo" | "live"      (the console's "الدفع بالبطاقة")
//   payProvider: "app" | "paymob" | "mpgs"    (the console's "بوابة الدفع"; absent = Banque Misr, see defaultProvider)
//                "app" = Paymob through the Mersal app's own backend (lib/mersalapp.js), needs no settings here
// Read by /api/checkout (cached there) and written by the console settings endpoint with plain token replacements, so the
// rest of layout.js (and the site details block written by /api/console/site) is never touched.
"use strict";
const paymob = require("./paymob");
const mersalapp = require("./mersalapp");

const MODES = ["off", "demo", "live"], PROVIDERS = ["app", "paymob", "mpgs"];
const MODE_RE = /payMode:\s*"(off|demo|live)"/, PROVIDER_RE = /payProvider:\s*"(app|paymob|mpgs)"/;
const env = (k) => String(process.env[k] || "").trim();
const MPGS_REQUIRED = ["MPGS_MERCHANT", "MPGS_API_PASSWORD"];

// Names (never values) of the application settings a gateway still needs (Paymob: + why its keys cannot take real money)
const missingFor = (p) => (p === "app" ? mersalapp.missing() : p === "paymob" ? paymob.missing().concat(paymob.keyProblem() || [])
  : p === "mpgs" ? MPGS_REQUIRED.filter((k) => !env(k)) : ["?"]);
const ready = (p) => missingFor(p).length === 0;
// No saved choice: Banque Misr (MPGS), the gateway the site used before a gateway could be chosen. Never derived from
// which settings exist, so adding or removing PAYMOB_* settings never moves live payments; Paymob takes over only once it
// is saved (the console saves the gateway every time card payment is set to live).
const defaultProvider = () => "mpgs";
const effective = (saved) => (PROVIDERS.includes(saved) ? saved : defaultProvider());

// -> { mode, provider } (provider = the saved choice or null)
function read(js) {
  const t = String(js || "");
  return { mode: (MODE_RE.exec(t) || [])[1] || "off", provider: (PROVIDER_RE.exec(t) || [])[1] || null };
}
// layout.js with the new switch. provider null/undefined keeps whatever is saved (or nothing, if nothing is).
function write(js, mode, provider) {
  if (!MODES.includes(mode)) throw new Error("bad payMode");
  let out = String(js).replace(MODE_RE, `payMode: "${mode}"`);
  if (!PROVIDERS.includes(provider)) return out;
  if (PROVIDER_RE.test(out)) return out.replace(PROVIDER_RE, `payProvider: "${provider}"`);
  // first save of a provider: its own line right after payMode, same indentation
  return out.replace(/^([ \t]*)payMode:\s*"(off|demo|live)"(\s*,)?/m, (m, ind, v, comma) => `${ind}payMode: "${v}",\n${ind}payProvider: "${provider}"${comma ? "," : ""}`);
}
// The switch as the live site serves it (/js/layout.js), for when GitHub cannot be read (no GITHUB_TOKEN yet, or a
// GitHub hiccup): no token needed, and a console change shows here once its deploy is out (about a minute). The site is
// PUBLIC_BASE_URL (the custom domain once there is one) or this Static Web App's own default hostname, never the
// request's Host header (the switch is cached for everyone).
const DEFAULT_SITE = "https://jolly-moss-063f03a10.3.azurestaticapps.net";
const siteBase = () => { const v = env("PUBLIC_BASE_URL").replace(/\/+$/, ""); return /^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/.test(v) ? v : DEFAULT_SITE; };
async function readDeployed() {
  const r = await fetch(`${siteBase()}/js/layout.js?pay=${Date.now()}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  const t = r.ok ? await r.text() : "";
  if (!/mersal:site/.test(t)) throw new Error(`deployed layout.js: HTTP ${r.status}`);
  return read(t);
}
const label = (p) => (p === "app" ? "Paymob (تطبيق مرسال)" : p === "paymob" ? "Paymob" : p === "mpgs" ? "بنك مصر (MPGS)" : String(p));

module.exports = { MODES, PROVIDERS, MODE_RE, PROVIDER_RE, read, write, readDeployed, siteBase, missingFor, ready, defaultProvider, effective, label };
