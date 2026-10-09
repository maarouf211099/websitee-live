// The card payment switch, kept in public/js/layout.js inside the SITE block (one `key: "value"` per line):
//   payMode:     "off" | "demo" | "live"      (the console's "الدفع بالبطاقة")
//   payProvider: "paymob" | "mpgs"            (the console's "بوابة الدفع"; absent = Banque Misr, see defaultProvider)
// Read by /api/checkout (cached there) and written by the console settings endpoint with plain token replacements, so the
// rest of layout.js (and the site details block written by /api/console/site) is never touched.
"use strict";
const paymob = require("./paymob");

const MODES = ["off", "demo", "live"], PROVIDERS = ["paymob", "mpgs"];
const MODE_RE = /payMode:\s*"(off|demo|live)"/, PROVIDER_RE = /payProvider:\s*"(paymob|mpgs)"/;
const env = (k) => String(process.env[k] || "").trim();
const MPGS_REQUIRED = ["MPGS_MERCHANT", "MPGS_API_PASSWORD"];

// Names (never values) of the application settings a gateway still needs
const missingFor = (p) => (p === "paymob" ? paymob.missing() : p === "mpgs" ? MPGS_REQUIRED.filter((k) => !env(k)) : ["?"]);
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
const label = (p) => (p === "paymob" ? "Paymob" : p === "mpgs" ? "بنك مصر (MPGS)" : String(p));

module.exports = { MODES, PROVIDERS, MODE_RE, PROVIDER_RE, read, write, missingFor, ready, defaultProvider, effective, label };
