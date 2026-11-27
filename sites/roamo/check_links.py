#!/usr/bin/env python3
"""Sanity checks for public/roamo (stdlib only). Exit code 1 on any problem.

- every page exists for every language (support: public/roam-support[.<lang>].html;
  roamo/[<lang>/]support[/] are redirects to it)
- every relative href/src resolves to a file (and #anchors exist)
- no root-absolute paths ("/..."), so dist/ works under a sub-path
- <html lang> is set and matches the folder
- page weight (HTML + CSS + JS + images, textures excluded) < 300 KB
"""
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

DIST = Path(os.environ.get("ROAMO_OUT", Path(__file__).resolve().parents[2] / "public" / "roamo")).resolve()
PUBLIC = DIST.parent  # site root: roam-support.html and roam-support.<lang>.html live here
LANGS = ["en", "es", "fr", "de", "pt-BR", "it", "ja", "ko", "zh-Hans", "ru", "vi"]
PAGES = ["index.html", "privacy.html", "terms.html", "support.html",
         "privacy/index.html", "terms/index.html", "support/index.html"]
BUDGET = 300 * 1024


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids, self.lang = [], set(), None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if "id" in a:
            self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k) and not (tag == "link" and a.get("rel") in ("canonical", "alternate")) \
                    and not (tag == "meta"):
                self.refs.append((tag, a.get("rel"), a[k]))


def parse(path):
    p = P()
    p.feed(path.read_text(encoding="utf-8"))
    return p


errors = []
for lang in LANGS:
    base = DIST if lang == "en" else DIST / lang
    for page in PAGES:
        if not (base / page).is_file():
            errors.append(f"missing page: {(base / page).relative_to(DIST)}")

for lang in LANGS:
    f = PUBLIC / ("roam-support.html" if lang == "en" else f"roam-support.{lang}.html")
    if not f.is_file():
        errors.append(f"missing page: {f.name}")

css_urls = re.findall(r"url\(([^)]+)\)", (DIST / "assets/site.css").read_text())
for u in css_urls:
    if u.startswith(("data:", "http")):
        continue
    if not (DIST / "assets" / u.strip("'\"")).is_file():
        errors.append(f"site.css: broken url({u})")

pages = sorted(DIST.rglob("*.html")) + sorted(PUBLIC.glob("roam-support*.html"))
parsed = {f: parse(f) for f in pages}
checked = 0
for f, p in parsed.items():
    rel = f.relative_to(PUBLIC)
    if rel.parts[0] == DIST.name:
        first = rel.parts[1]
    else:  # roam-support.<lang>.html
        first = f.name.split(".")[1] if f.name.count(".") == 2 else "en"
    want = first if first in LANGS else "en"
    if p.lang != want:
        errors.append(f"{rel}: <html lang={p.lang!r}>, expected {want!r}")
    weight = f.stat().st_size
    seen_assets = set()
    for tag, rel_attr, url in p.refs:
        if url.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
            continue
        if url.startswith("/"):
            errors.append(f"{rel}: root-absolute path {url}")
            continue
        parts = urlsplit(url)
        target = f if not parts.path else (f.parent / unquote(parts.path)).resolve()
        checked += 1
        if not target.is_file():
            errors.append(f"{rel}: broken link {url}")
            continue
        if parts.fragment and target.suffix == ".html":
            tp = parsed.get(target) or parse(target)
            if parts.fragment not in tp.ids:
                errors.append(f"{rel}: missing anchor {url}")
        if tag in ("img", "script") or (tag == "link" and rel_attr == "stylesheet"):
            if target not in seen_assets:
                seen_assets.add(target)
                weight += target.stat().st_size
    if p.lang and f.name == "index.html" and "assets/site.css" in str(seen_assets):
        pass
    if weight > BUDGET:
        errors.append(f"{rel}: page weight {weight // 1024} KB > 300 KB")

print(f"{len(pages)} HTML files, {checked} relative links/assets checked")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("OK — no broken links, all pages present, lang set, within budget")
