#!/usr/bin/env node
// Bake the home hero (slides from public/content.json) and the site texts (public/data/texts.json: home sections and the
// donate page's amount chips, api/src/lib/texts.js) into public/index.html and public/donate.html.
// Run after editing content.json or data/texts.json by hand:  node tools/render-home.js
// The admin console does the same thing automatically when home content is saved.
"use strict";
const fs = require("fs"), path = require("path");
const hero = require("../api/src/lib/hero");
const texts = require("../api/src/lib/texts");

const PUB = path.join(__dirname, "..", "public");
const content = JSON.parse(fs.readFileSync(path.join(PUB, "content.json"), "utf8"));
// phone crop made by tools/optimize_images.py (<banner>-m.jpg) when the slide has no explicit "mobile"
const mobileFor = (banner) => {
  const m = String(banner || "").replace(/\.(jpe?g|png)$/i, "-m.jpg");
  return m !== banner && fs.existsSync(path.join(PUB, m)) ? m : null;
};
// pixel width of a JPEG from its SOF marker (the srcset needs real widths; no image library here)
function jpegWidth(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return b.readUInt16BE(i + 7);
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
// phone candidates: optimize_images.py writes <banner>-m.jpg (2x) and <banner>-ms.jpg (1.5x) side by side; a slide
// with its own "mobile" photo (admin upload) or without the -ms sibling gets that single file
const mobileSet = (s) => {
  const m = s.mobile || mobileFor(s.banner);
  if (!m) return null;
  const ms = m.replace(/-m\.jpg$/i, "-ms.jpg");
  if (ms === m || !fs.existsSync(path.join(PUB, ms)) || !fs.existsSync(path.join(PUB, m))) return [{ src: m }];
  const wm = jpegWidth(path.join(PUB, m)), ws = jpegWidth(path.join(PUB, ms));
  return wm && ws && ws < wm ? [{ src: ms, w: ws }, { src: m, w: wm }] : [{ src: m }];
};
const idx = path.join(PUB, "index.html");
const before = fs.readFileSync(idx, "utf8");
// texts.json is optional: without it (or without a section) the markup stays as it is
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(path.join(PUB, f), "utf8")); } catch { return null; } };
const t = readJson("data/texts.json"), site = readJson("data/site.json") || {};
let tdata = null;
if (t) { const c = texts.clean(t); if (c.error) { console.error("data/texts.json: " + c.error); process.exit(1); } tdata = c.data; }
const tctx = { hotline: site.hotline || "19340", phone: site.phone || "01200002870", banks: texts.bankCount(readJson("data/donate.json")) };
let after = hero.apply(before, content, { mobileFor, mobileSet });
if (tdata) {
  after = texts.apply(after, tdata, tctx, "index");
  const dfile = path.join(PUB, "donate.html"), dBefore = fs.readFileSync(dfile, "utf8"), dAfter = texts.apply(dBefore, tdata, tctx, "donate");
  if (dAfter !== dBefore) { fs.writeFileSync(dfile, dAfter); console.log("donate.html updated (amount chips)"); }
}
if (after !== before) fs.writeFileSync(idx, after);
console.log((after !== before ? "index.html updated" : "index.html already up to date") + ": " + (content.slides || []).length + " slides, rev " + hero.rev(content.slides));
