#!/usr/bin/env python3
"""One-time import of the old mersal-ngo.org content into the static site.

Reads the old site's public API (menu, CMS pages, home slider, donation channels,
statistics, projects) and writes:
  public/p/<id>.html          one page per CMS page, in the new layout
  public/img/old/...          every image those pages use (resized, ASCII names)
  public/data/menu.json       the old menu tree (used by js/layout.js)
  public/content.json         slides / stats / projects / donation channels for the home page

Run:  python3 mersal-site/tools/import_old_site.py
Needs curl and (optionally) ImageMagick `convert` for resizing.
"""
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
CACHE = os.environ.get("IMPORT_CACHE", os.path.join(ROOT, ".import-cache"))
SITE = "https://mersal-ngo.org"
API = SITE + "/MersalAPI/api"
os.makedirs(CACHE, exist_ok=True)


def fetch(url, binary=False):
    key = hashlib.md5(url.encode()).hexdigest()
    path = os.path.join(CACHE, key)
    if not os.path.exists(path):
        r = subprocess.run(["curl", "-sS", "-L", "--compressed", "--retry", "6", "--retry-all-errors",
                            "--retry-delay", "1", "-m", "120", "-f", "-o", path + ".part", url])
        if r.returncode != 0:
            print("  ! failed", url, file=sys.stderr)
            return None
        os.replace(path + ".part", path)
    with open(path, "rb") as f:
        data = f.read()
    return data if binary else data.decode("utf-8-sig", errors="replace")


def api(path):
    t = fetch(API + "/" + path)
    return json.loads(t) if t else None


# ---------------------------------------------------------------- images
IMG_DIR = os.path.join(PUB, "img", "old")
os.makedirs(IMG_DIR, exist_ok=True)
_img_map = {}


def local_image(src, max_w=1600):
    """Download an image from the old site and return its new /img/old/... path."""
    if not src:
        return None
    src = html.unescape(src.strip())
    if src.startswith("data:image"):
        m = re.match(r"data:image/(\w+);base64,(.*)", src, re.S)
        if not m:
            return None
        import base64
        raw = base64.b64decode(m.group(2))
        ext = {"jpeg": "jpg"}.get(m.group(1), m.group(1))
        name = "inline-" + hashlib.md5(raw).hexdigest()[:10] + "." + ext
        out = os.path.join(IMG_DIR, name)
        if not os.path.exists(out):
            with open(out, "wb") as f:
                f.write(raw)
            shrink(out, max_w)
        return "/img/old/" + name
    url = urllib.parse.urljoin(SITE + "/", src)
    if not re.match(r"https?://(www\.)?mersal-ngo\.org/", url):
        return src  # external image: keep as is
    if url in _img_map:
        return _img_map[url]
    parts = urllib.parse.urlsplit(url)
    url_q = urllib.parse.urlunsplit((parts.scheme, parts.netloc, urllib.parse.quote(urllib.parse.unquote(parts.path)), parts.query, ""))
    data = fetch(url_q, binary=True)
    if not data:
        _img_map[url] = None
        return None
    base = os.path.basename(urllib.parse.unquote(parts.path))
    stem, ext = os.path.splitext(base)
    ext = (ext or ".jpg").lower()
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"):
        ext = ".jpg"
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")[:30]
    name = (slug + "-" if slug else "") + hashlib.md5(url.encode()).hexdigest()[:8] + ext
    out = os.path.join(IMG_DIR, name)
    if not os.path.exists(out):
        with open(out, "wb") as f:
            f.write(data)
        shrink(out, max_w)
    _img_map[url] = "/img/old/" + name
    return _img_map[url]


def shrink(path, max_w):
    if not shutil.which("convert") or path.endswith((".svg", ".gif")):
        return
    subprocess.run(["convert", path, "-auto-orient", "-resize", f"{max_w}x{max_w}>", "-strip",
                    "-quality", "82", path], capture_output=True)


# ---------------------------------------------------------------- html cleanup
def page_link(url):
    if not url:
        return None
    url = url.strip().replace("\\", "/")
    m = re.search(r"RenderPage\?id=(\d+)", url, re.I)
    if m:
        return f"/p/{m.group(1)}.html"
    low = url.lower().split("?")[0].split("#")[0]
    for old, new in (("/home/afiacard", "/afia.html"), ("/home/zakahcalculator", "/zakat.html"),
                     ("/home/contactus", "/contact.html"), ("/donation", "/donate.html")):
        if low.rstrip("/").endswith(old):
            return new
    return url


def clean_html(s):
    s = re.sub(r"<(script|style|noscript)\b.*?</\1\s*>", "", s, flags=re.S | re.I)
    s = re.sub(r"<(link|meta)\b[^>]*>", "", s, flags=re.I)
    s = re.sub(r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", s, flags=re.I)
    s = re.sub(r"(href|src)\s*=\s*([\"'])\s*javascript:[^\"']*\2", r'\1="#"', s, flags=re.I)

    def iframe(m):
        tag = m.group(0)
        src = re.search(r"src\s*=\s*[\"']([^\"']+)", tag)
        if src and re.search(r"(youtube\.com|youtube-nocookie\.com|google\.com/maps|facebook\.com/plugins)", src.group(1)):
            return tag
        return ""
    s = re.sub(r"<iframe\b.*?(</iframe\s*>|/>)", iframe, s, flags=re.S | re.I)

    def img(m):
        tag = m.group(0)
        src = re.search(r"\ssrc\s*=\s*([\"'])(.*?)\1", tag, re.S)
        if not src:
            return ""
        new = local_image(src.group(2))
        if not new:
            return ""
        tag = tag[:src.start(2)] + new + tag[src.end(2):]
        if "loading=" not in tag:
            tag = tag.replace("<img", '<img loading="lazy"', 1)
        return tag
    s = re.sub(r"<img\b[^>]*>", img, s, flags=re.S | re.I)

    def href(m):
        new = page_link(html.unescape(m.group(2)))
        new = re.sub(r"^https?://(www\.)?mersal-ngo\.org", "", new or "") or "/"
        return f'href="{html.escape(new, quote=True)}"'
    s = re.sub(r"href\s*=\s*([\"'])(.*?)\1", href, s, flags=re.S | re.I)
    # Bootstrap 5 accordion -> handled by js/legacy.js
    return s.strip()


# ---------------------------------------------------------------- page template
def head(title, desc):
    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" href="/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
<link rel="stylesheet" href="/css/legacy.css">
<meta property="og:site_name" content="مؤسسة مرسال">
<title>{html.escape(title)} | مؤسسة مرسال</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
</head>"""


def page_html(title, body, desc, cover=None):
    cover_html = f'<img class="legacy-cover" src="{cover}" alt="" loading="lazy">' if cover else ""
    return f"""{head(title, desc)}
<body>
<div id="site-header"></div>
<div class="page-head"><div class="wrap"><h1>{html.escape(title)}</h1></div></div>
<main>
  <section>
    <div class="wrap legacy">
      {cover_html}
{body}
    </div>
  </section>
  <section class="alt cta-band">
    <div class="wrap" style="text-align:center">
      <h2>ساهم مع مرسال</h2>
      <p>تبرعك بيوصل لمستحقيه - صدقة أو زكاة.</p>
      <a class="btn btn-gold" href="/donate.html">تبرع الآن</a>
      <a class="btn btn-teal" href="tel:19340">اتصل 19340</a>
    </div>
  </section>
</main>
<div id="site-footer"></div>
<script src="/js/layout.js"></script>
<script src="/js/legacy.js"></script>
</body>
</html>
"""


def text_of(h, n=155):
    t = re.sub(r"<[^>]+>", " ", h)
    t = html.unescape(re.sub(r"\s+", " ", t)).strip()
    return t[:n].rsplit(" ", 1)[0] + "…" if len(t) > n else t


# ---------------------------------------------------------------- run
def main():
    menu = json.loads(fetch(SITE + "/UserManagementAPI/api/User/GetMenuItemsByuserIdAndAppID?userId=0&appId=1"))
    lookup = api("DynamicPages/GetPagesLookup?type=2") or []
    projects = api("DynamicPages/GetByType?typeCode=MersalProjects") or []

    ids = {3, 4, 46, 51}
    for m in menu:
        r = re.search(r"id=(\d+)", m.get("URL") or "", re.I)
        if r:
            ids.add(int(r.group(1)))
    ids |= {int(p["Id"]) for p in lookup}
    ids |= {int(p["Id"]) for p in projects}

    os.makedirs(os.path.join(PUB, "p"), exist_ok=True)
    pages = {}
    for pid in sorted(ids):
        d = api(f"DynamicPages/GetPageById?Id={pid}")
        if not d or not (d.get("ContentAR") or "").strip():
            print("  - skip empty page", pid)
            continue
        title = (d.get("TitleAR") or d.get("Name") or "").strip().rstrip(":")
        body = clean_html(d["ContentAR"])
        cover = local_image(d.get("ImagePath")) if d.get("ImagePath") else None
        desc = text_of(body)
        with open(os.path.join(PUB, "p", f"{pid}.html"), "w", encoding="utf-8") as f:
            f.write(page_html(title, body, desc, cover))
        pages[pid] = {"title": title, "desc": desc, "cover": cover}
        print("  page", pid, title)

    with open(os.path.join(PUB, "legacy.html"), "w", encoding="utf-8") as f:
        f.write("""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>مؤسسة مرسال</title><script>
var m = /[?&]id=(\\d+)/i.exec(location.search), known = %s;
location.replace(m && known.indexOf(+m[1]) > -1 ? "/p/" + m[1] + ".html" : "/");
</script></head><body><a href="/">مؤسسة مرسال</a></body></html>
""" % json.dumps(sorted(pages)))

    # menu tree
    by_parent = {}
    for m in menu:
        if m.get("IsActive") is False:
            continue
        by_parent.setdefault(m.get("ParentId"), []).append(m)

    def build(parent):
        out = []
        for m in sorted(by_parent.get(parent, []), key=lambda x: (x.get("ItemOrder") or 0, x["Id"])):
            link = page_link(m.get("URL"))
            if link and link.startswith("/p/") and int(re.search(r"(\d+)", link).group(1)) not in pages:
                link = None
            item = {"title": (m.get("NameOther") or m.get("Name") or "").strip(), "href": link}
            kids = build(m["Id"])
            if kids:
                item["children"] = kids
            if item["href"] or kids:
                out.append(item)
        return out
    tree = build(None)
    os.makedirs(os.path.join(PUB, "data"), exist_ok=True)
    with open(os.path.join(PUB, "data", "menu.json"), "w", encoding="utf-8") as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)

    # home content
    content_path = os.path.join(PUB, "content.json")
    content = json.load(open(content_path, encoding="utf-8"))
    slides = []
    for s in api("HomeSlider/GetAllHomeSliderHomeView") or []:
        img = local_image(s.get("ImagePath"), max_w=1920)
        if img:
            slides.append({"banner": img, "link": page_link(s.get("HrefUrl")) or "/donate.html",
                           "alt": (s.get("TitleAr") or "").strip() or "مؤسسة مرسال"})
    if slides:
        content["slides"] = slides
    channels = []
    for c in api("DonationSlider/GetAllDonationSlider") or []:
        channels.append({"title": (c.get("TitleAr") or c.get("Title") or "").strip(),
                         "text": (c.get("DescriptionAr") or c.get("Description") or "").strip(),
                         "image": local_image(c.get("ImageName"), max_w=600)})
    content["channels"] = channels
    stats = []
    for s in api("DonationStatistics/GetAll?IsDeleted=False") or []:
        try:
            v = int(str(s.get("Value") or "0").replace(",", ""))
        except ValueError:
            continue
        stats.append({"label": (s.get("NameArabic") or "").strip(), "value": v, "suffix": "جنيه"})
    content["stats"] = stats
    content["statsTitle"] = "احتياجات مرسال"
    projs, seen = [], set()
    for p in sorted(projects, key=lambda x: -int(x["Id"])):  # newest first; drop duplicate titles
        key = re.sub(r"\s+|مشروع|ال|:", "", (p.get("TitleAR") or ""))
        if key in seen or re.search(r"طرق التبرع|متطوع|كارت", p.get("TitleAR") or ""):
            continue
        seen.add(key)
        pid = int(p["Id"])
        if pid not in pages:
            continue
        img = local_image(p.get("ImagePath"), max_w=900) or pages[pid]["cover"]
        projs.append({"title": pages[pid]["title"], "text": pages[pid]["desc"][:110],
                      "image": img or "/img/hero.jpg", "link": f"/p/{pid}.html"})
    content["projects"] = projs
    with open(content_path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    print(f"done: {len(pages)} pages, {len(slides)} slides, {len(channels)} channels, {len(stats)} stats, {len(projs)} projects, {len(os.listdir(IMG_DIR))} images")


if __name__ == "__main__":
    main()
