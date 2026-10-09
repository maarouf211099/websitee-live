// Safe saves for the console.
//   rev(text): revision of a file's text (its git blob sha). Every GET the console makes returns it in the
//     X-Mersal-Sha header; the console sends it back on PUT as X-Mersal-Base, and the save is refused (409) when the
//     file changed in between - so two admins (or two tabs) never silently erase each other's edits.
//   retry(commitFiles, build, message, who): commitFiles refuses a stale parent (force: false), so when another commit
//     lands between the read and the write GitHub answers 409/422; build() then runs again on the fresh files (and
//     re-checks the base revision) up to 3 times. build() returns the files to commit, or null to skip.
"use strict";
const crypto = require("crypto");

const rev = (text) => { const b = Buffer.from(String(text == null ? "" : text), "utf8"); return crypto.createHash("sha1").update("blob " + b.length + "\0").update(b).digest("hex"); };

async function retry(commitFiles, build, message, who) {
  for (let i = 0; ; i++) {
    try { const files = await build(); return files ? await commitFiles(files, message, who) : null; }
    catch (e) { if (i >= 2 || !/GitHub (409|422)/.test(e.message || "")) throw e; }
  }
}

const err = (status, message, extra) => Object.assign(new Error(message), { status }, extra || {});
const MISSING = "اللوحة محتاجة تتحدث: اعمل تحديث للصفحة (F5) وجرّب تاني";
const CHANGED = "حد تاني عدّل الملف ده من ساعة ما فتحته. حدّث الصفحة (F5) وعيد التعديل";
// Throws 428 when the console sent no base revision, 409 when the file moved on since it was read.
function checkBase(base, current) {
  if (!base) throw err(428, MISSING);
  if (base !== current) throw err(409, CHANGED, { conflict: true });
}
const baseOf = (req) => String((req.headers && req.headers.get && req.headers.get("x-mersal-base")) || "").trim();

module.exports = { rev, retry, checkBase, baseOf, SHA_HEADER: "X-Mersal-Sha" };
