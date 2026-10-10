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
import struct
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
CACHE = os.environ.get("IMPORT_CACHE", os.path.join(ROOT, ".import-cache"))
SITE = "https://mersal-ngo.org"
# Public address of the NEW site (canonical, og:image, og:url, sitemap): the custom domain the site is served on.
SITE_URL = os.environ.get("SITE_URL", "https://www.mersal-ngo.org").rstrip("/")
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
    if "/" not in src and ":" not in src:
        src = "/ClientFilesLayout/DynamicPageImages/" + src  # bare names in the old CMS live here
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


def img_size(path):
    """(width, height) of a local PNG or JPEG, read from its header; None when unknown."""
    try:
        with open(path, "rb") as f:
            b = f.read()
    except OSError:
        return None
    if b[:8] == b"\x89PNG\r\n\x1a\n" and len(b) >= 24:
        return struct.unpack(">II", b[16:24])
    if b[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(b):
            if b[i] != 0xFF:
                i += 1
                continue
            m = b[i + 1]
            if m == 0xFF:
                i += 1
                continue
            if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
                i += 2
                continue
            seg = struct.unpack(">H", b[i + 2:i + 4])[0]
            if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
                h, w = struct.unpack(">HH", b[i + 5:i + 9])
                return w, h
            i += 2 + seg
    return None


def page_photo_ok(src):
    """A picture that can stand as a page's header photo: not an SVG icon, not a small logo or social icon."""
    if not src or src.lower().endswith(".svg"):
        return False
    size = img_size(os.path.join(PUB, src.lstrip("/")))
    return not size or min(size) >= 200


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


# ---------------------------------------------------------------- content markup pass
_ATTR = lambda tag, name: re.search(r'\s' + name + r'\s*=\s*"([^"]*)"', tag, re.I)


def _set_attr(tag, name, value):
    if _ATTR(tag, name):
        return re.sub(r'(\s' + name + r'\s*=\s*)"[^"]*"', lambda m: m.group(1) + '"' + value + '"', tag, count=1, flags=re.I)
    return re.sub(r"^<(\w+)", lambda m: f'<{m.group(1)} {name}="{value}"', tag, count=1)


def content_markup(body):
    """Accessibility + image clean-up of imported content (safe to run again on its own output):
    every <img> gets an alt (decorative "" when it had none or only a file name), content photos with a WebP sibling
    become <picture> with their width/height (no layout shift), the first content photo is not lazy (it is often the
    largest paint), icon-only links get a name (or leave the tab order when they are a decorative bullet), and frames
    get a title."""
    first = [True]

    def img(tag, in_picture):
        alt = _ATTR(tag, "alt")
        if not alt or re.search(r"\.(jpe?g|png|gif|webp|svg)\s*$", alt.group(1), re.I):
            tag = _set_attr(tag, "alt", "")
        icon = re.search(r'class="[^"]*\bimg-(icon|social)\b', tag) or re.search(r"checklist|logo", tag, re.I)
        if icon:
            return tag
        if first[0]:
            first[0] = False
            tag = re.sub(r'\sloading="lazy"', "", tag, count=1)
        src = _ATTR(tag, "src")
        m = src and re.match(r"^(/img/old/[^\"?#]+)\.(jpe?g|png)$", src.group(1), re.I)
        if in_picture or not m:
            return tag
        webp = m.group(1) + ".webp"
        if not os.path.exists(os.path.join(PUB, webp.lstrip("/"))):
            return tag
        size = img_size(os.path.join(PUB, src.group(1).lstrip("/")))
        if size and not _ATTR(tag, "width") and not _ATTR(tag, "height"):
            tag = re.sub(r"\s*/?>$", f' width="{size[0]}" height="{size[1]}">', tag)
        return f'<picture><source type="image/webp" srcset="{webp}">{tag}</picture>'

    def piece(m):
        t = m.group(0)
        if t[:8].lower() == "<picture":
            return re.sub(r"<img\b[^>]*>", lambda k: img(k.group(0), True), t, flags=re.I)
        return img(t, False)
    body = re.sub(r"<picture\b.*?</picture>|<img\b[^>]*>", piece, body, flags=re.S | re.I)

    def link(m):
        tag, inner = m.group(1), m.group(2)
        if _ATTR(tag, "aria-label") or _ATTR(tag, "aria-hidden"):
            return m.group(0)
        if any(a.group(1).strip() for a in re.finditer(r'\salt="([^"]*)"', inner)):
            return m.group(0)
        href = (_ATTR(tag, "href") or [None, ""])[1]
        if re.search(r"checklist", inner):  # a list bullet that the old CMS wrapped in a (repeated, wrong) link
            return _set_attr(_set_attr(tag, "aria-hidden", "true"), "tabindex", "-1") + inner + "</a>"
        label = ("اتصل " + href[4:]) if href.startswith("tel:") else "فيسبوك" if "facebook.com" in href else \
            "لينكدإن" if "linkedin.com" in href else "إنستجرام" if "instagram.com" in href else ""
        return (_set_attr(tag, "aria-label", label) if label else tag) + inner + "</a>"
    body = re.sub(r"(<a\b[^>]*>)((?:\s|&nbsp;)*(?:<picture\b.*?</picture>|<img\b[^>]*>)(?:\s|&nbsp;)*)</a>", link, body, flags=re.S | re.I)
    body = re.sub(r"<iframe\b(?![^>]*\stitle=)", '<iframe title="خريطة الموقع على جوجل"', body, flags=re.I) if "google.com/maps" in body else body
    return body


# ---------------------------------------------------------------- page template
def head(title, desc):
    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" href="/img/favicon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#005959">
<link rel="apple-touch-icon" href="/img/icon-192.png">
<link rel="preload" href="/fonts/cairo-arabic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<link rel="stylesheet" href="/css/legacy.css">
<meta property="og:site_name" content="مؤسسة مرسال">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_EG">
<title>{html.escape(title)} | مؤسسة مرسال</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta name="twitter:card" content="summary_large_image">
</head>"""


def hero_img(src):
    """Page banner photo as <picture> (WebP sibling when tools/optimize_images.py produced one)."""
    if not src:
        return ""
    webp = re.sub(r"\.(jpe?g|png)$", ".webp", src, flags=re.I)
    source = f'<source type="image/webp" srcset="{webp}">' if webp != src and os.path.exists(os.path.join(PUB, webp.lstrip("/"))) else ""
    return f'<picture>{source}<img class="ph-bg" src="{src}" alt="" fetchpriority="high" width="1200" height="800"></picture>'


def side_html(pid, title):
    t = html.escape(title)
    amounts = "".join(f'<a href="/donate.html?for=p{pid}&amp;amount={a}#online">{a:,}<small>جنيه</small></a>' for a in (100, 250, 500, 1000))
    return f"""<aside class="page-side" aria-label="تبرع وتواصل">
        <div class="side-card donate"><h3>ادعم: {t}</h3><p>تبرعك بيوصل مباشرة لمستحقيه.</p>
          <div class="side-amounts">{amounts}</div>
          <a class="btn btn-gold" href="/donate.html?for=p{pid}#online">تبرع بمبلغ آخر</a></div>
        <a class="side-card hot" href="tel:19340"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></span><span><b>19340</b><span>الخط الساخن - مندوبنا لحد باب البيت</span></span></a>
      </aside>"""


def crumbs_html(title, crumbs):
    """Breadcrumbs baked into the page (no layout shift); crumbs = [(title, href_or_None), ...] of the parents."""
    parts = ['<a href="/">الرئيسية</a>']
    for t, href in crumbs or []:
        parts.append("<span>›</span>")
        parts.append(f'<a href="{html.escape(href, quote=True)}">{html.escape(t)}</a>' if href else f"<em>{html.escape(t)}</em>")
    parts.append(f"<span>›</span><strong>{html.escape(title)}</strong>")
    return '<nav class="crumbs" aria-label="مسار الصفحة">' + "".join(parts) + "</nav>"


def page_html(title, body, desc, cover=None, share_img=None, pid=None, crumbs=None):
    """One imported page. `cover` is shown inside the body only when it is not already the banner photo
    (share_img); crumbs are pre-rendered when the menu is known (js/legacy.js builds them otherwise)."""
    cover_html = f'<img class="legacy-cover" src="{cover}" alt="" loading="lazy">' if cover and cover != share_img else ""
    og = f'<meta property="og:image" content="{SITE_URL}{share_img or "/img/hero.jpg"}">'
    canon = (f'<link rel="canonical" href="{SITE_URL}/p/{pid}.html">' + chr(10) +
             f'<meta property="og:url" content="{SITE_URL}/p/{pid}.html">') if pid else ""
    body = content_markup(body)
    side = side_html(pid, title) if pid else ""
    head_html = head(title, desc).replace("</head>", og + chr(10) + canon + chr(10) + "</head>")
    return f"""{head_html}
<body>
<div id="site-header"></div>
<div class="page-head{' has-photo' if share_img else ''}">{hero_img(share_img)}<div class="wrap">{crumbs_html(title, crumbs) if crumbs is not None else ''}<h1>{html.escape(title)}</h1></div></div>
<main id="main">
  <section>
    <div class="wrap page-grid">
      <article class="legacy">
      {cover_html}
<!-- mersal:content -->
{body}
<!-- /mersal:content -->
      </article>
      {side}
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
<script defer src="/js/layout.js"></script>
<script defer src="/js/pwa.js"></script>
<script defer src="/js/legacy.js"></script>
</body>
</html>
"""


def short_text(t, n):
    """At most n characters, cut on a word boundary with an ellipsis."""
    t = (t or "").strip()
    return t if len(t) <= n else re.sub(r"\s+\S*$", "", t[:n]).rstrip(" ،,.:؛") + "…"


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
        photos = [m for m in re.findall(r'<img[^>]+src="(/img/old/[^"]+)"', body)
                  if not re.search(r"checklist|logo", m) and page_photo_ok(m)]
        if pid == 3:  # a picture beside the About text: Mersal volunteers in vests (not the old stock photo of a child)
            body = ('<div class="row align-items-center"><div class="col-md-7">' + body +
                    '</div><div class="col-md-5"><picture><source type="image/webp" srcset="/img/old/43img-7521-9c813483-sm.webp 600w, /img/old/43img-7521-9c813483.webp 1600w" sizes="(max-width: 760px) 92vw, 460px"><img src="/img/old/43img-7521-9c813483-sm.jpg" srcset="/img/old/43img-7521-9c813483-sm.jpg 600w, /img/old/43img-7521-9c813483.jpg 1600w" sizes="(max-width: 760px) 92vw, 460px" alt="متطوعين مرسال بسترات المؤسسة" width="1600" height="1067" loading="lazy"></picture></div></div>')
        with open(os.path.join(PUB, "p", f"{pid}.html"), "w", encoding="utf-8") as f:
            f.write(page_html(title, body, desc, cover, cover or (photos[0] if photos else None), pid))
        pages[pid] = {"title": title, "desc": desc, "cover": cover, "photo": photos[0] if photos else None}
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

    with open(os.path.join(PUB, "data", "pages.json"), "w", encoding="utf-8") as f:
        json.dump({str(k): {"title": v["title"], "desc": v["desc"][:140], "photo": v["photo"] or v["cover"]}
                   for k, v in pages.items()}, f, ensure_ascii=False, indent=1)
    # pages that are only a picture of text (no description) stay out of the sitemap until their text is typed in
    urls = (["/", "/donate.html", "/zakat.html", "/gift.html", "/afia.html", "/contact.html", "/albums.html", "/news.html", "/volunteer.html", "/help.html"]
            + [f"/p/{k}.html" for k in sorted(pages) if pages[k]["desc"]] + ["/privacy.html", "/terms.html"])
    with open(os.path.join(PUB, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        f.writelines(f"  <url><loc>{SITE_URL}{u}</loc></url>\n" for u in urls)
        f.write("</urlset>\n")
    with open(os.path.join(PUB, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {SITE_URL}/sitemap.xml\n")

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
        img = pages[pid]["photo"] or local_image(p.get("ImagePath"), max_w=900) or pages[pid]["cover"]
        projs.append({"title": pages[pid]["title"], "text": short_text(pages[pid]["desc"], 110),
                      "image": img or "/img/hero.jpg", "link": f"/p/{pid}.html"})
    content["projects"] = projs

    # Donation campaigns with goals (old home "التبرعات" cards). The old site calls this
    # endpoint with the fixed anonymous-visitor token that ships in its public JS.
    token = os.environ.get("OLD_SITE_ANON_TOKEN")
    if not token:
        js = os.path.join(ROOT, "..", "Scripts", "MersalScripts", "CommenHeader.js")
        if os.path.exists(js):
            m = re.search(r'"Authorization":\s*"([^"]{100,})"', open(js, encoding="utf-8", errors="replace").read())
            token = m.group(1) if m else None
    camps = []
    if token:
        r = subprocess.run(["curl", "-sS", "-m", "90", "--retry", "4", "--retry-all-errors", "-f",
                            "-H", "Accept: application/json", "-H", "Id: 0", "-H", "Authorization: " + token,
                            API + "/CampaignsHomeCounter/GetAllCampaignsDonationsAmount"], capture_output=True)
        try:
            rows = json.loads(r.stdout.decode("utf-8-sig")) if r.returncode == 0 else []
        except ValueError:
            rows = []
        for c in rows:
            pid = str(c.get("ProjectDestinationId") or "")
            def num(v):
                try:
                    return float(str(v).replace(",", ""))
                except ValueError:
                    return 0.0
            camps.append({
                "title": (c.get("TitleAr") or "").strip(),
                "text": (c.get("DescriptionAr") or "").strip(),
                "image": local_image(c.get("ImageURL"), max_w=900) or "/img/hero.jpg",
                "unit": (c.get("GoalUnit") or "").strip(),
                "unitPrice": int(num(c.get("GoalAverageAmount"))),
                "goal": int(num(c.get("GoalTotal"))),
                "raised": int(num(c.get("AchievedAmount"))),
                "link": f"/p/{pid}.html" if pid.isdigit() and int(pid) in pages else "/donate.html",
                "purpose": f"p{pid}" if pid.isdigit() else "general",
            })
    else:
        print("  ! no anonymous token: donation campaigns skipped")
    if camps:
        content["campaigns"] = camps

    # Photo albums (old /Album pages)
    albums = []
    home = api("Albums/GetLastFourAlbums?maxResults=100") or {}
    for al in home.get("AlbumHomeViewList") or []:
        aid = al.get("Id")
        paths, count = [], 0
        for _ in range(12):
            d = api(f"Albums/GetImagesInAlbum?albumId={aid}&currantCount={count}") or {}
            batch = [x.get("ImagePath") for x in (d.get("AlbumHomeViewList") or []) if x.get("ImagePath")]
            new = [b_ for b_ in batch if b_ not in paths]
            if not new:
                break
            paths += new
            count = d.get("CurrantCountOfAlbums") or (count + len(batch))
            if len(paths) >= 30:
                break
        cover = al.get("ImagePath")
        photos = []
        for ph in ([cover] if cover else []) + [x for x in paths if x != cover]:
            big = local_image(ph, max_w=1400)
            if big:
                photos.append(big)
        if photos:
            albums.append({"title": (al.get("TitleAr") or al.get("TitleEn") or "").strip(),
                           "date": (al.get("CreatedOn") or "")[:10], "photos": photos[:30]})
            print("  album", aid, len(photos), "photos")
    if albums:
        with open(os.path.join(PUB, "data", "albums.json"), "w", encoding="utf-8") as f:
            json.dump(albums, f, ensure_ascii=False, indent=1)
    with open(content_path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    print(f"done: {len(content.get('campaigns', []))} campaigns, {len(pages)} pages, {len(slides)} slides, {len(channels)} channels, {len(stats)} stats, {len(projs)} projects, {len(os.listdir(IMG_DIR))} images")


def small_copy(path, width=720):
    """Make a lighter copy for phones: /img/old/x.jpg -> /img/old/x-sm.jpg (returns its URL)."""
    if not path or not path.startswith("/img/") or not shutil.which("convert"):
        return None
    src = os.path.join(PUB, path.lstrip("/"))
    if not os.path.exists(src):
        return None
    stem, ext = os.path.splitext(src)
    if stem.endswith("-sm"):
        return path
    out = stem + "-sm" + ext
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
        subprocess.run(["convert", src, "-resize", f"{width}x{width}>", "-strip", "-quality", "78", out], capture_output=True)
    return "/" + os.path.relpath(out, PUB).replace(os.sep, "/") if os.path.exists(out) else None


def add_small_copies():
    """Phone-sized variants for every image the home page, related cards and albums show."""
    cp = os.path.join(PUB, "content.json")
    c = json.load(open(cp, encoding="utf-8"))
    for s in c.get("slides", []):
        if s.get("banner"):
            s["bannerSm"] = small_copy(s["banner"], 1200)
    for key in ("campaigns", "projects"):
        for it in c.get(key, []):
            it["imageSm"] = small_copy(it.get("image"), 600)
    json.dump(c, open(cp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    pp = os.path.join(PUB, "data", "pages.json")
    if os.path.exists(pp):
        pg = json.load(open(pp, encoding="utf-8"))
        for v in pg.values():
            v["photoSm"] = small_copy(v.get("photo"), 600)
        json.dump(pg, open(pp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    ap = os.path.join(PUB, "data", "albums.json")
    if os.path.exists(ap):
        al = json.load(open(ap, encoding="utf-8"))
        for a in al:
            a["thumbs"] = [small_copy(x, 600) or x for x in a["photos"]]
        json.dump(al, open(ap, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
    add_small_copies()
    # phone crops + WebP siblings, then bake the hero into index.html
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "optimize_images.py")], check=False)
    subprocess.run(["node", os.path.join(os.path.dirname(os.path.abspath(__file__)), "render-home.js")], check=False)
