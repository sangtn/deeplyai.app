# ROAMO website (deeplyai.app/roamo/)

Static landing page + Privacy Policy, Terms, Support for the ROAMO iOS app, in 11 languages.
No framework, no CDN, no tracker: Python 3 standard library only. Moved here from the ROAMO
app repo on 27 Nov 2026 so it ships with the rest of deeplyai.app.

## Layout

```
sites/roamo/
  build.py          generator: constants, HTML templates, English (source) strings
  i18n/<lang>.json  the other 10 languages (same keys as EN in build.py)
  assets/           site.css, site.js, icons, OG image, textures/
  check_links.py    checks: every page exists, no broken links, <html lang>, page < 300 KB
public/roamo/       BUILD OUTPUT, committed: Astro copies it as-is, so rebuild before you commit
```

Pages: `index.html` (EN) and `<lang>/index.html` for es, fr, de, pt-BR, it, ja, ko, zh-Hans, ru, vi;
each language has `privacy.html`, `terms.html` **and** the folder form `privacy/`, `terms/`,
which the app links to (`https://deeplyai.app/roamo/privacy/`).

**Support** is the `#support` section of the landing page (with the guides and the FAQ), not a page
of its own. `roam-support.html` / `roam-support.<lang>.html` and the old `roamo/[<lang>/]support.html`
and `support/` (the app and App Store Connect link there) are noindex redirects to
`roamo/[<lang>/]#support`; a `#hash` on the old URL is kept.

The landing page shows the ROAMO 1.0 guides (`guide_sections()` in `build.py`, strings under
`sup` in `EN` and in each `i18n/<lang>.json`): header film, getting started, CarPlay, Lock Screen
and Watch, World Studio, trip videos. Their media in `assets/support/` come from the ROAMO repo's
`Final/` folder (App Store screenshots, App Preview, CarPlay ad, header film), resized for the
web: screenshots as WebP 560 px wide (watch 280 px, iPad 1200 px) with sharp, videos as H.264
without sound (`-crf 26–32 -movflags +faststart`, `setsar=1`). Videos are muted, play only while
on screen and never with reduced motion (`assets/site.js`). Screenshots are English only.

Brand: the publisher is written **DeeplyAi**, as on the rest of deeplyai.app; `og:site_name` is
DeeplyAi and the footer links back to deeplyai.app (all apps, About, Contact).

## Build

```bash
python3 sites/roamo/build.py        # rewrites public/roamo/ and public/roam-support*.html
python3 sites/roamo/check_links.py  # must print OK
npm run build                       # Astro copies public/roamo/ to dist/roamo/
```

After editing, run both scripts and commit `public/roamo/` too; a push to `main` deploys.

## Editing

- **App Store URL / support email**: `APP_STORE_URL`, `SUPPORT_EMAIL` at the top of `build.py`.
  Once the real App Store ID replaces `id0000000000`, the Safari Smart App Banner turns on.
- **English text**: the `EN` dict in `build.py`. **Other languages**: `i18n/<lang>.json`.
  A missing key falls back to English and prints `WARNING: ... missing key`.
- **Worlds / colors**: `WORLDS` in `build.py` (colors from the ROAMO repo, `design/themes/themes.json`).
- **Canonical URL**: defaults to `https://deeplyai.app/roamo/`; preview elsewhere with
  `SITE_URL=... ROAMO_OUT=/tmp/roamo python3 sites/roamo/build.py`.

The app's links (`ios/Roamo/Features/Paywall/PaywallView.swift`, `AppLinks`) point to
`https://deeplyai.app/roamo/{privacy,support}/`. Don't move or rename these folders without
shipping an app update first.
