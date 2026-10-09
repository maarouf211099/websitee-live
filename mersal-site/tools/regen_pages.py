"""Rewrite public/p/*.html with the current import_old_site.page_html template, keeping each page's content.
Run after editing the template (page_html) in tools/import_old_site.py:  python3 -I tools/regen_pages.py"""
import html, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import import_old_site as imp

menu = json.load(open(os.path.join(ROOT, "public/data/menu.json"), encoding="utf-8"))
parents = {}
def walk(items, chain):
    for it in items:
        if it.get("href"): parents.setdefault(it["href"], chain)
        if it.get("children"): walk(it["children"], chain + [(it["title"], it.get("href"))])
walk(menu, [])

pdir = os.path.join(ROOT, "public/p")
n = 0
for f in sorted(os.listdir(pdir)):
    if not f.endswith(".html"): continue
    pid = int(f[:-5]); path = os.path.join(pdir, f)
    s = open(path, encoding="utf-8").read()
    title = html.unescape(re.search(r"<title>(.*?) \| مؤسسة مرسال</title>", s, re.S).group(1))
    desc = html.unescape(re.search(r'<meta name="description" content="(.*?)">', s, re.S).group(1))
    og = re.search(r'<meta property="og:image" content="[^"]*?(/img/[^"]+)">', s)
    share_img = og.group(1) if og else None
    cov = re.search(r'<img class="legacy-cover" src="([^"]+)"', s)
    cover = cov.group(1) if cov else None
    # the hero photo of a page without an own picture must not come from the og fallback
    if share_img == "/img/hero.jpg" and "page-head has-photo" not in s: share_img = None
    body = re.search(r"<!-- mersal:content -->\n(.*?)\n<!-- /mersal:content -->", s, re.S).group(1)
    crumbs = parents.get(f"/p/{pid}.html", [])
    out = imp.page_html(title, body, desc, cover, share_img, pid, crumbs=crumbs)
    open(path, "w", encoding="utf-8").write(out)
    n += 1
    print(pid, title, "| hero" if share_img else "", "| cover" if cover and cover != share_img else "", "| crumbs:", " > ".join(t for t, _ in crumbs) or "-")
print("rewrote", n, "pages")
