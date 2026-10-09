#!/usr/bin/env python3
"""Shrink site images in place and add WebP siblings (needs ImageMagick `convert`/`identify`).

- JPEGs: capped at 1600px (1200px for *-sm files), quality 76, progressive, metadata stripped.
  Slide banners (content.json "slides") keep up to 1920px at quality 80: the phone hero shows the photo half alone.
- Photo PNGs without transparency (>80KB) become JPEGs; references in HTML/CSS/JS/JSON are rewritten.
- PNGs with transparency are only stripped.
- Slide banners (content.json "slides") get phone crops for the hero: <banner>-m.jpg (left 46% = the photo half,
  upscaled 2x with Lanczos + a light unsharp to 1766x1140 so 3x phones get crisp pixels) and a lighter 1.5x
  sibling <banner>-ms.jpg (1324x855) that dpr-2 phones pick through srcset; both get a .webp (q78).
- Every JPEG/PNG under public/img (except uploads/) gets a .webp sibling; js/layout.js (mersalPic) relies on that,
  so run this script again after adding images to public/img by hand.
Safe to re-run; files only get replaced when the result is smaller.
"""
import os, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "public"
IMG = ROOT / "img"
QUALITY, WEBP_Q = "76", "74"


def run(*a):
    return subprocess.run(a, capture_output=True, text=True, check=True).stdout.strip()


def info(p):
    w, h, alpha, kind = run("identify", "-format", "%w %h %A %m", str(p) + "[0]").split()
    return int(w), int(h), alpha in ("True", "Blend"), kind


def banners():
    """Paths of the hero banners in content.json (they are allowed to stay bigger than the other photos)."""
    cp = ROOT / "content.json"
    if not cp.exists():
        return set()
    import json
    out = set()
    for s in json.loads(cp.read_text(encoding="utf-8")).get("slides", []):
        b = s.get("banner") or ""
        if b.startswith("/img/"):
            out.add((ROOT / b.lstrip("/")).resolve())
    return out


BANNERS = banners()


def is_banner(p):
    return p.resolve() in BANNERS


def cap(p):
    if p.stem.endswith("-sm"):
        return "1200x1200>"  # -sm copies are made at 600/1200 by the importer
    return "1920x1920>" if is_banner(p) else "1600x1600>"


def quality(p):
    return "80" if is_banner(p) else QUALITY


def replace_refs(old_rel, new_rel):
    n = 0
    for f in list(ROOT.rglob("*.html")) + list(ROOT.rglob("*.json")) + list(ROOT.rglob("*.css")) + list(ROOT.rglob("*.js")):
        if "node_modules" in f.parts or "/admin/" in str(f):
            continue
        s = f.read_text(encoding="utf-8")
        if old_rel in s:
            f.write_text(s.replace(old_rel, new_rel), encoding="utf-8")
            n += 1
    return n


# phone hero crops: the left 46% (photo half-disc) of each banner, upscaled 2x (3x phones) and 1.5x (dpr-2 phones)
MOBILE_CROP = 0.46
MOBILE_SIZES = (("-m", 2.0, "80", "78"), ("-ms", 1.5, "80", "78"))  # (suffix, scale, jpeg q, webp q)


def mobile_crop(src, dst, scale, jpeg_q, webp_q):
    """Crop the photo half of a banner and enlarge it `scale` times: Lanczos keeps edges clean where the
    browser's own bilinear upscale smears them, and a light unsharp brings back the detail that the 2x
    stretch softens. The .webp sibling is encoded from the same pixels (not from the JPEG)."""
    w, h, _, _ = info(src)
    cw = round(w * MOBILE_CROP)
    size = f"{round(cw * scale)}x{round(h * scale)}!"
    base = ["convert", str(src) + "[0]", "-gravity", "West", "-crop", f"{cw}x{h}+0+0", "+repage",
            "-filter", "Lanczos", "-resize", size, "-unsharp", "0x1+0.6+0.02", "-strip"]
    subprocess.run(base + ["-interlace", "Plane", "-sampling-factor", "4:2:0", "-quality", jpeg_q, str(dst)], check=True)
    subprocess.run(base + ["-quality", webp_q, "-define", "webp:method=6", str(dst.with_suffix(".webp"))], check=True)


def mobile_banners():
    """Phone hero crops for every slide banner: <banner>-m.jpg (+.webp) at 2x and <banner>-ms.jpg (+.webp) at 1.5x.
    Idempotent: a crop is only rebuilt when it is missing, older than the banner, or not at the expected size
    (crops made by an older version of this script were 1x)."""
    cp = ROOT / "content.json"
    if not cp.exists():
        return
    import json
    for s in json.loads(cp.read_text(encoding="utf-8")).get("slides", []):
        b = s.get("banner") or ""
        if not b.startswith("/img/") or "/uploads/" in b:
            continue
        src = ROOT / b.lstrip("/")
        if not src.exists():
            continue
        w, h, _, _ = info(src)
        for suffix, scale, jq, wq in MOBILE_SIZES:
            m = src.with_name(src.stem + suffix + ".jpg")
            want = (round(round(w * MOBILE_CROP) * scale), round(h * scale))
            fresh = m.exists() and m.with_suffix(".webp").exists() and m.stat().st_mtime >= src.stat().st_mtime
            if fresh and info(m)[:2] == want:
                continue
            mobile_crop(src, m, scale, jq, wq)
            print(f"phone crop {m.relative_to(ROOT)} {want[0]}x{want[1]} {m.stat().st_size // 1024}KB (webp {m.with_suffix('.webp').stat().st_size // 1024}KB)")


def main():
    mobile_banners()
    saved = 0
    files = [p for p in IMG.rglob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png") and "uploads" not in p.parts]
    for p in sorted(files):
        try:
            w, h, alpha, kind = info(p)
        except subprocess.CalledProcessError:
            print("skip (unreadable)", p); continue
        before = p.stat().st_size
        tmp = p.with_name(p.stem + ".tmp" + p.suffix)
        if kind == "PNG" and alpha:
            subprocess.run(["convert", str(p), "-strip", str(tmp)], check=True)
            src = p
        elif kind == "PNG" and before > 80_000:
            # Photo stored as PNG: make it a JPEG and point everything at the new name
            new = p.with_suffix(".jpg")
            subprocess.run(["convert", str(p) + "[0]", "-strip", "-resize", cap(p), "-background", "white", "-flatten", "-interlace", "Plane", "-sampling-factor", "4:2:0", "-quality", QUALITY, str(new)], check=True)
            old_rel, new_rel = "/" + p.relative_to(ROOT).as_posix(), "/" + new.relative_to(ROOT).as_posix()
            refs = replace_refs(old_rel, new_rel)
            print(f"png->jpg {old_rel} {before//1024}KB -> {new.stat().st_size//1024}KB ({refs} files updated)")
            saved += before - new.stat().st_size
            p.unlink(); p = new; before = p.stat().st_size; tmp = None
            src = None
        elif p.stem.endswith(("-m", "-ms")) or (kind == "JPEG" and int(run("identify", "-format", "%Q", str(p))) <= int(quality(p)) and max(w, h) <= int(cap(p).split("x")[0])):
            tmp = None  # already optimized on a previous run: don't re-encode (each pass loses quality)
        else:
            subprocess.run(["convert", str(p) + "[0]", "-strip", "-resize", cap(p), "-interlace", "Plane", "-sampling-factor", "4:2:0", "-quality", quality(p), str(tmp)], check=True)
            src = p
        if tmp is not None and tmp.exists():
            after = tmp.stat().st_size
            if after < before * 0.97:
                tmp.replace(p); saved += before - after
                print(f"shrunk {p.relative_to(ROOT)} {before//1024}KB -> {after//1024}KB")
            else:
                tmp.unlink()
        # WebP sibling: ALWAYS present for every jpg/png under img/ (except uploads/); js/layout.js (mersalPic) relies on it
        webp = p.with_suffix(".webp")
        if not webp.exists() or webp.stat().st_mtime < p.stat().st_mtime:
            subprocess.run(["convert", str(p) + "[0]", "-strip", "-quality", WEBP_Q, "-define", "webp:method=5", str(webp)], check=True)
    print(f"total saved: {saved//1024}KB")


if __name__ == "__main__":
    main()
