#!/usr/bin/env node
// Bake the home hero (slides from public/content.json) into public/index.html.
// Run after editing content.json by hand:  node tools/render-home.js
// The admin console does the same thing automatically when home content is saved.
"use strict";
const fs = require("fs"), path = require("path");
const hero = require("../api/src/lib/hero");

const PUB = path.join(__dirname, "..", "public");
const content = JSON.parse(fs.readFileSync(path.join(PUB, "content.json"), "utf8"));
// phone crop made by tools/optimize_images.py (<banner>-m.jpg) when the slide has no explicit "mobile"
const mobileFor = (banner) => {
  const m = String(banner || "").replace(/\.(jpe?g|png)$/i, "-m.jpg");
  return m !== banner && fs.existsSync(path.join(PUB, m)) ? m : null;
};
const idx = path.join(PUB, "index.html");
const before = fs.readFileSync(idx, "utf8");
const after = hero.apply(before, content, { mobileFor });
if (after !== before) fs.writeFileSync(idx, after);
console.log((after !== before ? "index.html updated" : "index.html already up to date") + ": " + (content.slides || []).length + " slides, rev " + hero.rev(content.slides));
