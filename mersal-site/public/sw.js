/* Mersal service worker: offline support for the public site (registered by /js/pwa.js).
 *
 * Deliberately conservative, so a deploy is never hidden behind old files:
 *   - pages (navigations)        network first; the saved copy is used only when the network fails, returns a
 *                                server error, or takes longer than NAV_TIMEOUT while a saved copy exists.
 *                                No saved copy -> /offline.html.
 *   - same-origin CSS / JS       network only while the network answers: the saved copy is used ONLY when the
 *                                request fails (offline) or the server answers 5xx. Never because the network is
 *                                slow, so a deploy's new CSS / JS can never be swapped for an older saved copy.
 *   - /data/*.json, content.json network first; the saved copy is the offline fallback (and after DATA_TIMEOUT
 *                                on a very slow network, when a copy exists).
 *   - /img/*                     stale-while-revalidate, at most LIMITS.img entries.
 *   - /fonts/*.woff2 and Google  cache first (the files never change; /fonts/ is served "immutable").
 *     Fonts css / woff2
 *   - never touched              /api/*, /admin*, /.auth/*, anything requested by the admin console, every
 *                                non-GET request and every other cross-origin request.
 * Only /offline.html and /css/site.css are downloaded at install. Bump VERSION whenever this file's rules or
 * offline.html change: the new worker takes over at once (skipWaiting + clients.claim) and deletes every older
 * mersal-* cache on activate.
 *
 * Emergency off switch (if a worker ever misbehaves), two steps in one deploy:
 *   1. js/pwa.js: set SW_ON = false. Pages then unregister the worker and delete the mersal-* caches.
 *   2. this file: replace everything with the lines below, for tabs that run an old pwa.js. It has no fetch handler,
 *      so the network answers everything at once; it clears the caches and unregisters itself.
 *   self.addEventListener("install", function () { self.skipWaiting(); });
 *   self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (k) {
 *     return Promise.all(k.filter(function (n) { return n.indexOf("mersal-") === 0; }).map(function (n) { return caches.delete(n); }));
 *   }).then(function () { return self.registration.unregister(); })); }); */
"use strict";

var VERSION = "2026-10-09.2";
var PREFIX = "mersal-";
var CACHES = {
  shell: PREFIX + "shell-" + VERSION,   // install-time copies: offline.html + site.css
  pages: PREFIX + "pages-" + VERSION,   // HTML of the pages the visitor opened
  static: PREFIX + "static-" + VERSION, // CSS, JS and the JSON data the pages read
  img: PREFIX + "img-" + VERSION,
  fonts: PREFIX + "fonts-" + VERSION
};
var LIMITS = { pages: 50, static: 60, img: 60, fonts: 30 };
var OFFLINE_URL = "/offline.html";
var PRECACHE = [OFFLINE_URL, "/css/site.css"];
var NAV_TIMEOUT = 4000;   // ms before a slow network gives way to a saved copy of the page
var DATA_TIMEOUT = 6000;  // same for /data/*.json and content.json (only when a saved copy exists). CSS / JS: no timeout
var MATCH = { ignoreVary: true };

function noop() {}

/* ---------- install / activate ---------- */
self.addEventListener("install", function (e) {
  // Chrome's static routing: the admin console, the API and sign-in never even start this worker
  try {
    if (e.addRoutes) {
      e.waitUntil(Promise.resolve(e.addRoutes([
        { condition: { urlPattern: { pathname: "/api/*" } }, source: "network" },
        { condition: { urlPattern: { pathname: "/admin" } }, source: "network" },
        { condition: { urlPattern: { pathname: "/admin/*" } }, source: "network" },
        { condition: { urlPattern: { pathname: "/.auth/*" } }, source: "network" }
      ])).catch(noop));
    }
  } catch (x) {}
  e.waitUntil(caches.open(CACHES.shell).then(function (c) {
    // cache: "reload" skips the HTTP cache, so the worker starts with the files that are live right now
    return c.addAll(PRECACHE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  var keep = Object.keys(CACHES).map(function (k) { return CACHES[k]; });
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(PREFIX) === 0 && keep.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* ---------- routing ---------- */
var NEVER = /^\/(api|admin|\.auth)(\/|$)/i;
var DATA = /^\/(data\/[^/]+\.json|content\.json)$/i;

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  if (req.cache === "only-if-cached" && req.mode !== "same-origin") return; // DevTools quirk
  var url;
  try { url = new URL(req.url); } catch (x) { return; }

  if (url.origin !== self.location.origin) {
    // the only cross-origin files kept: Google Fonts stylesheets and font files (cache first)
    if ((url.hostname === "fonts.googleapis.com" && /^\/css2?$/.test(url.pathname)) ||
        (url.hostname === "fonts.gstatic.com" && /\.woff2$/i.test(url.pathname))) {
      e.respondWith(cacheFirst(e, req, CACHES.fonts, LIMITS.fonts, url.hostname === "fonts.googleapis.com"));
    }
    return;
  }
  var path = url.pathname;
  if (NEVER.test(path) || fromConsole(req)) return;

  if (req.mode === "navigate") { e.respondWith(page(e, url)); return; }
  if (/^\/img\//i.test(path)) { e.respondWith(staleWhileRevalidate(e, req, CACHES.img, LIMITS.img)); return; }
  if (/^\/fonts\/[^/]+\.woff2$/i.test(path)) { e.respondWith(cacheFirst(e, req, CACHES.fonts, LIMITS.fonts, false)); return; }
  if (/\.(css|js)$/i.test(path)) { e.respondWith(networkFirst(e, req, CACHES.static, LIMITS.static, 0)); return; }
  if (DATA.test(path)) { e.respondWith(networkFirst(e, req, CACHES.static, LIMITS.static, DATA_TIMEOUT)); return; }
  // anything else (manifest, robots, sitemap, videos...) is left to the browser
});

// files the admin console asks for (its own preview images, data files) always come straight from the network
function fromConsole(req) {
  try { return NEVER.test(new URL(req.referrer).pathname) && new URL(req.referrer).origin === self.location.origin; } catch (x) { return false; }
}

/* ---------- helpers ---------- */
function cacheable(res, allowOpaque) {
  if (!res) return false;
  if (res.type === "opaque") return !!allowOpaque;
  if (!res.ok || res.status !== 200 || (res.type !== "basic" && res.type !== "cors")) return false;
  return !/no-store/i.test(res.headers.get("Cache-Control") || "");
}

// keep a cache under its size cap: the oldest entries go first (a re-saved entry moves to the end)
function trim(name, max) {
  return caches.open(name).then(function (c) {
    return c.keys().then(function (keys) {
      var extra = keys.length - max;
      return extra > 0 ? Promise.all(keys.slice(0, extra).map(function (k) { return c.delete(k); })) : null;
    });
  }).catch(noop);
}

function save(name, max, key, res) {
  return caches.open(name).then(function (c) { return c.put(key, res); }).then(function () { return trim(name, max); }).catch(noop);
}

function firstMatch(names, key) {
  return names.reduce(function (p, name) {
    return p.then(function (hit) { return hit || caches.open(name).then(function (c) { return c.match(key, MATCH); }); });
  }, Promise.resolve(null)).catch(function () { return null; });
}

function deferred() { var d = {}; d.promise = new Promise(function (r) { d.resolve = r; }); return d; }

// Writing a network answer: one that goes to the page is saved through a clone, one that nobody reads (a saved copy
// answered first) is saved as it is. A clone whose twin is never read can keep the write, and so the worker, busy
// until garbage collection, which would also hold back the next version of this file.
function storer(name, max, key, check) {
  return function (res, used) {
    if (!(check || cacheable)(res)) return null;
    return save(name, max, key, used ? res.clone() : res);
  };
}

// network first: the network answer, or the saved copy when the network fails, answers 5xx, or is slower than `ms`
// (the timeout applies only when a copy exists and ms > 0; CSS / JS pass 0). Rejects only with no copy and no network.
// done -> waitUntil.
function networkOrCopy(network, saved, ms, store, done) {
  return saved.then(function (copy) {
    return new Promise(function (resolve, reject) {
      var settled = false, t = copy && ms > 0 ? setTimeout(function () { settled = true; resolve(copy); }, ms) : 0;
      network.then(function (res) {
        var useIt = !settled && !(copy && res.status >= 500);
        if (!settled) { settled = true; clearTimeout(t); }
        done.resolve(store(res, useIt)); // clones before the answer is handed over
        resolve(useIt ? res : copy);
      }, function (err) {
        done.resolve(null);
        if (settled) return;
        settled = true; clearTimeout(t);
        if (copy) resolve(copy); else reject(err);
      });
    });
  });
}

/* ---------- strategies ---------- */
function isHtml(res) {
  return cacheable(res) && /text\/html/i.test(res.headers.get("Content-Type") || "");
}

function page(e, url) {
  // the site is static: the query string never changes the HTML (?for=, ?amount=, utm_...), so one copy per path
  var key = url.origin + url.pathname, done = deferred();
  e.waitUntil(done.promise);
  var network = fetch(e.request);
  // a page that is gone from the site (404 / 410) is dropped from the saved copies too
  e.waitUntil(network.then(function (res) {
    if (res.status === 404 || res.status === 410) return caches.open(CACHES.pages).then(function (c) { return c.delete(key); });
  }).catch(noop));
  var alias = url.pathname === "/" ? url.origin + "/index.html" : url.pathname === "/index.html" ? url.origin + "/" : null;
  var saved = firstMatch([CACHES.pages], key).then(function (hit) { return hit || (alias ? firstMatch([CACHES.pages], alias) : null); });
  return networkOrCopy(network, saved, NAV_TIMEOUT, storer(CACHES.pages, LIMITS.pages, key, isHtml), done)
    .catch(offlinePage); // no saved copy and no network
}

function offlinePage() {
  return caches.open(CACHES.shell).then(function (c) { return c.match(OFFLINE_URL); }).then(function (res) {
    return res || new Response(
      '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>انت مش متصل بالإنترنت | مؤسسة مرسال</title><body style="font-family:Tahoma,Arial,sans-serif;text-align:center;padding:40px 16px;color:#005959">' +
      '<h1>انت مش متصل بالإنترنت</h1><p>جرّب تاني لما النت يرجع، أو كلمنا على الخط الساخن <a href="tel:19340">19340</a>.</p>' +
      '<button onclick="location.reload()" style="font:inherit;padding:12px 28px;min-height:44px;border-radius:999px;border:0;background:#fec830;color:#003c3c;font-weight:700">حاول تاني</button></body></html>',
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  });
}

function networkFirst(e, req, name, max, ms) {
  var done = deferred(), network = fetch(req);
  e.waitUntil(done.promise);
  network.catch(noop); // handled in networkOrCopy, once the cache lookup is back
  // the runtime copy is newer than the install-time one, so it is looked up first
  var saved = firstMatch(name === CACHES.static ? [CACHES.static, CACHES.shell] : [name], req);
  return networkOrCopy(network, saved, ms, storer(name, max, req), done).catch(function () { return Response.error(); });
}

function staleWhileRevalidate(e, req, name, max) {
  var done = deferred(), network = fetch(req), store = storer(name, max, req);
  e.waitUntil(done.promise);
  network.catch(noop);
  return firstMatch([name], req).then(function (hit) {
    var fresh = network.then(function (res) { done.resolve(store(res, !hit)); return res; }, function (err) { done.resolve(null); throw err; });
    if (hit) { fresh.catch(noop); return hit; }
    return fresh;
  });
}

function cacheFirst(e, req, name, max, allowOpaque) {
  var done = deferred();
  e.waitUntil(done.promise);
  return firstMatch([name], req).then(function (hit) {
    if (hit) { done.resolve(null); return hit; }
    return fetch(req).then(function (res) {
      done.resolve(cacheable(res, allowOpaque) ? save(name, max, req, res.clone()) : null);
      return res;
    }, function (err) { done.resolve(null); throw err; });
  });
}
