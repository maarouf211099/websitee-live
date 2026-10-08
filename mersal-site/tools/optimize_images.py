#!/usr/bin/env python3
"""Shrink site images in place and add WebP siblings (needs ImageMagick `convert`/`identify`).

- JPEGs: capped at 1600px (640px for *-sm files), quality 76, progressive, metadata stripped.
- Photo PNGs without transparency (>80KB) become JPEGs; references in HTML/CSS/JS/JSON are rewritten.
- PNGs with transparency are only stripped.
- Slide banners (content.json "slides") get a phone crop <banner>-m.jpg (left 46%: the photo half) for the hero.
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


def cap(p):
    return "1200x1200>" if p.stem.endswith("-sm") else "1600x1600>"  # -sm copies are made at 600/1200 by the importer


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


def mobile_banners():
    """Phone hero crops: the left 46% (photo half-disc) of each slide banner -> <banner>-m.jpg (+ .webp in main())."""
    cp = ROOT / "content.json"
    if not cp.exists():
        return
    import json
    for s in json.loads(cp.read_text(encoding="utf-8")).get("slides", []):
        b = s.get("banner") or ""
        if not b.startswith("/img/") or "/uploads/" in b:
            continue
        src = ROOT / b.lstrip("/")
        m = src.with_name(src.stem + "-m.jpg")
        if src.exists() and (not m.exists() or m.stat().st_mtime < src.stat().st_mtime):
            subprocess.run(["convert", str(src) + "[0]", "-gravity", "West", "-crop", "46%x100%+0+0", "+repage", "-unsharp", "0x0.8+0.8+0.02", "-strip", "-interlace", "Plane", "-sampling-factor", "4:2:0", "-quality", "82", str(m)], check=True)
            print("phone crop", m.relative_to(ROOT))


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
        elif p.stem.endswith("-m") or (kind == "JPEG" and int(run("identify", "-format", "%Q", str(p))) <= int(QUALITY) and max(w, h) <= int(cap(p).split("x")[0])):
            tmp = None  # already optimized on a previous run: don't re-encode (each pass loses quality)
        else:
            subprocess.run(["convert", str(p) + "[0]", "-strip", "-resize", cap(p), "-interlace", "Plane", "-sampling-factor", "4:2:0", "-quality", QUALITY, str(tmp)], check=True)
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
