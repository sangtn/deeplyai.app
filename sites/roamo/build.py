#!/usr/bin/env python3
"""ROAMO marketing site generator — Python 3 standard library only.

    python3 sites/roamo/build.py    # writes public/roamo/ (served at deeplyai.app/roamo/)
    SITE_URL=https://example.com/roamo/ ROAMO_OUT=/tmp/roamo python3 sites/roamo/build.py

Templates and the English (source) strings live in this file. The other ten
languages live in sites/roamo/i18n/<lang>.json with exactly the same keys; any key a
translation is missing falls back to English and is reported as a warning.

Every link between pages and to assets is RELATIVE, so dist/ works at a domain
root, under a sub-path (https://deeplyai.app/roamo/), on GitLab Pages, and when
opened straight from disk (file://).
"""
import html
import json
import os
import posixpath
import shutil
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# Constants — change these in ONE place.
# --------------------------------------------------------------------------
APP_STORE_URL = "https://apps.apple.com/app/roamo/id0000000000"  # PLACEHOLDER until the listing is live
SUPPORT_EMAIL = "info@deeplyai.app"                                # DeeplyAi mailbox used across deeplyai.app
SITE_URL = os.environ.get("SITE_URL", "https://deeplyai.app/roamo/").rstrip("/") + "/"
# The DeeplyAi site root that holds roamo/ (https://deeplyai.app/).
ROOT_URL = os.environ.get("ROOT_URL", SITE_URL.rstrip("/").rsplit("/", 1)[0] + "/")
# Support lives at the site root with the other app support pages (cartv-support.html):
# roam-support.html (EN) and roam-support.<lang>.html. The old roamo/[<lang>/]support[/]
# URLs, which the app links to, become redirects.
SUPPORT_FILE = "roam-support"
MANAGE_SUBS_URL = "https://apps.apple.com/account/subscriptions"
PUBLISHER = "DeeplyAi"
BUNDLE_ID = "com.deeplyai.roamo"
UPDATED_ISO = "2026-11-26"
APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"

ROOT = Path(__file__).resolve().parent
# Output goes straight into the Astro site's public/ folder, so it is served at
# https://deeplyai.app/roamo/ (override with ROAMO_OUT=/some/dir for a preview).
DIST = Path(os.environ.get("ROAMO_OUT", ROOT.parents[1] / "public" / "roamo")).resolve()
PUBLIC = DIST.parent  # site root; the support pages are written here
ASSETS = ROOT / "assets"

# (code used in folder names + hreflang, Open Graph locale)
LANGS = [
    ("en", "en_US"), ("es", "es_ES"), ("fr", "fr_FR"), ("de", "de_DE"),
    ("pt-BR", "pt_BR"), ("it", "it_IT"), ("ja", "ja_JP"), ("ko", "ko_KR"),
    ("zh-Hans", "zh_CN"), ("ru", "ru_RU"), ("vi", "vi_VN"),
]
DEFAULT_LANG = "en"
PAGES = ["index", "privacy", "terms", "support"]

# --------------------------------------------------------------------------
# Worlds — colors copied from design/themes/themes.json (ui.accent,
# ui.routeColor, ui.isDark). Textures are copies of design/textures/*.png in
# sites/roamo/assets/textures/. base/road/edge are web-only mock-up colors.
# land/patch: a texture name, or a raw CSS image value for texture-less worlds.
# --------------------------------------------------------------------------
GROUPS = ["gamers", "cute", "style", "students", "adventure", "seasonal"]
WORLDS = [
    # id, name, group, free, accent, route, dark, base, land, patch, road, edge
    ("blockworld", "Block World", "gamers", True, "#FFD640", "#FFD640", False, "#5E9B3C", "bw_grass", "bw_water", "#A3A3A3", "#5C5C5C"),
    ("neon", "Neon Night", "gamers", False, "#FF2BD6", "#FFE14D", True, "#0B0620",
     "repeating-linear-gradient(0deg,rgba(255,43,214,.18) 0 1px,transparent 1px 26px),repeating-linear-gradient(90deg,rgba(59,232,255,.16) 0 1px,transparent 1px 26px)",
     "radial-gradient(circle at 40% 40%,rgba(255,43,214,.55),rgba(59,232,255,.15) 60%,transparent 75%)", "#1E1245", "#3BE8FF"),
    ("urbanheist", "Urban Heist", "gamers", False, "#F2C21B", "#F2C21B", True, "#26262A", "uh_asphalt", None, "#45454D", "#111114"),
    ("retrosunset", "Retro Sunset", "gamers", False, "#FF5FA2", "#29E3E3", True, "#2A0E3D",
     "linear-gradient(180deg,rgba(255,95,162,.05),rgba(255,95,162,.28)),repeating-linear-gradient(0deg,rgba(41,227,227,.2) 0 1px,transparent 1px 28px),repeating-linear-gradient(90deg,rgba(41,227,227,.2) 0 1px,transparent 1px 28px)",
     "radial-gradient(circle at 50% 100%,#FFB347 0 30%,#FF5FA2 55%,transparent 72%)", "#3A1550", "#FF5FA2"),
    ("arcade", "8-Bit Arcade", "gamers", False, "#FCE21B", "#FCE21B", True, "#0E0E1C", "ar_scan", None, "#23234D", "#4D4DFF"),
    ("hacker", "Hacker Terminal", "gamers", False, "#39FF6A", "#39FF6A", True, "#020A04", "ht_grid", None, "#0B3A1A", "#1F8F40"),
    ("speedway", "Speedway", "gamers", False, "#E3242B", "#FFD400", True, "#2E2E2E", "sp_asphalt", "sp_curb", "#4A4A4A", "#E3242B"),
    ("wasteland", "Wasteland", "gamers", False, "#E8892B", "#3FE0C5", False, "#C9A06A", "wl_dust", "wl_rust", "#8A7356", "#5A4630"),
    ("safezone", "Safe Zone", "gamers", False, "#4FB4FF", "#FFD23F", True, "#76875A", "sz_terrain", None, "#E6DEC2", "#4A4636"),
    ("skyisles", "Sky Isles", "gamers", False, "#4F8CFF", "#FF5FA2", False, "#9BDE74", "si_tiles", None, "#F3E6C4", "#8B6B3E"),
    ("legendary", "Legendary", "gamers", False, "#F5C542", "#6FF2FF", True, "#2A1656", "lg_sparkle", None, "#5A3EA8", "#F5C542"),
    ("candycloud", "Candy Cloud", "cute", False, "#FF7EB6", "#FF5FA2", False, "#FFE3F0", "cc_sprinkles", "cc_hearts", "#FFFFFF", "#FFB3D4"),
    ("comicpop", "Comic Pop", "cute", False, "#FF3B30", "#FF3B30", False, "#FFF3C4", "cp_halftone", "cp_halftone_blue", "#FFFFFF", "#111111"),
    ("galaxy", "Galaxy Dream", "cute", False, "#B98CFF", "#FFD6FF", True, "#120A2E", "gx_stars", None, "#2A1B5E", "#B98CFF"),
    ("toyland", "Toy Land", "cute", False, "#FF6A2B", "#FF6A2B", False, "#7CD35A", "tl_grass", "tl_coins", "#FFF1C4", "#C98A3A"),
    ("luxury", "Luxury", "style", False, "#D4AF37", "#F5D77A", True, "#0E0C0A", "lx_quilt", "lx_marble", "#2A2418", "#D4AF37"),
    ("notebook", "Doodle Notebook", "students", True, "#2F6FE4", "#E8453C", False, "#FBFBF6", "nb_graph", "nb_hatch", "#FFFFFF", "#2F6FE4"),
    ("blueprint", "Blueprint", "students", False, "#FFFFFF", "#FFD23F", True, "#1D4E9E", "bp_grid", None, "#2A5DB0", "#FFFFFF"),
    ("frontier", "Frontier Paper", "adventure", False, "#8B2E1F", "#8B2E1F", False, "#E9DCC0", "fp_paper", "fp_water", "#F4EAD2", "#8A6D47"),
    ("fantasy", "Fantasy Atlas", "adventure", False, "#C08A2E", "#A3301F", False, "#E6D3A3", "fa_parchment", "fa_forest", "#EAD9AE", "#7A5A2E"),
    ("treasureisle", "Treasure Isle", "adventure", False, "#D7262E", "#D7262E", False, "#EED7A2", "ti_sand", "ti_water", "#A8743E", "#6A4220"),
    ("snowday", "Snow Day", "seasonal", False, "#4A9BE8", "#E8453C", False, "#EEF5FC", "sd_snow", None, "#FFFFFF", "#A9C6E6"),
]
DEFAULT_WORLD = "blockworld"

PRICES = {"weekly": "$3.99", "monthly": "$6.99", "yearly": "$39.99", "lifetime": "$79.99"}

# --------------------------------------------------------------------------
# English source strings. Values may contain trusted inline HTML.
# Placeholders: {email} {email_link} {eula} {osm} {ofm} {omt} {geoapify}
#               {maplibre} {geoapify_privacy} {ofm_privacy}
# --------------------------------------------------------------------------
EN = {
    "lang_name": "English",
    "title": "ROAMO — Game-style map worlds for iPhone",
    "description": "ROAMO is GPS navigation for iPhone that restyles the whole map into a game-style world. 22 worlds, turn-by-turn voice guidance, no account, no ads, no tracking.",
    "skip": "Skip to content",
    "nav_worlds": "Worlds", "nav_features": "Features", "nav_privacy": "Privacy",
    "nav_pricing": "Pricing", "nav_faq": "FAQ", "nav_support": "Support",
    "lang_label": "Language",
    "badge_small": "Download on the", "badge_big": "App Store",
    "badge_aria": "Download ROAMO on the App Store",
    "hero_kicker": "GPS navigation for iPhone",
    "hero_title": "Your city, <mark>restyled as a game world.</mark>",
    "hero_sub": "ROAMO is a real turn-by-turn map app — search, routes, voice guidance — where every street, park and river is redrawn in the style of your favorite kind of game.",
    "hero_note": "2 worlds free forever · No account · No ads",
    "hero_req": "Requires iOS 17 or later",
    "switch_title": "Tap a world to restyle the map",
    "now_showing": "Now showing: {world}",
    "phone_aria": "ROAMO app preview in the {world} world, showing a route and a turn card",
    "phone_dist": "500 ft", "phone_street": "Turn right onto Maple Ave", "phone_then": "Then turn left",
    "phone_eta": "12 min", "phone_trip": "4.3 mi", "phone_arrive": "Arrive 9:41",
    "phone_speed": "34", "phone_speed_unit": "mph", "phone_limit": "35",
    "worlds_title": "22 worlds. One for every mood.",
    "worlds_sub": "Pick a world and the entire map changes — ground, water, roads, labels, even your route color. Tap any world to try it on the phone above.",
    "free": "Free", "pro": "Pro", "preview": "Preview",
    "grp_gamers": "For gamers", "grp_cute": "Cute & cozy", "grp_students": "For students",
    "grp_style": "Stylish", "grp_adventure": "For adventurers", "grp_seasonal": "Seasonal",
    "w_blockworld": "Chunky grass, water and gravel blocks.",
    "w_neon": "Glowing streets on a midnight grid.",
    "w_urbanheist": "Gritty asphalt and getaway-yellow routes.",
    "w_retrosunset": "Synthwave grid under an endless sunset.",
    "w_arcade": "Scanlines and pixel-bright paths.",
    "w_hacker": "Green-on-black terminal city.",
    "w_speedway": "Race-track asphalt with red-white curbs.",
    "w_candycloud": "Sprinkles, hearts and pastel streets.",
    "w_comicpop": "Bold ink lines and halftone dots.",
    "w_galaxy": "Starlit roads through a dreamy cosmos.",
    "w_notebook": "Hand-drawn doodles on graph paper.",
    "w_blueprint": "Crisp white lines on architect blue.",
    "w_frontier": "Aged paper and ink, like an old trail map.",
    "w_fantasy": "Parchment, forests and a hero's road.",
    "w_snowday": "Fresh snow, frosty blues and cozy reds.",
    "w_wasteland": "Dusty roads and rusted metal after the end of the world.",
    "w_luxury": "Quilted leather, marble and gold-lined streets.",
    "w_toyland": "Bright hills, toy-colored roofs and coins in the park.",
    "w_safezone": "A tactical grid map with a glowing safe-zone edge.",
    "w_skyisles": "Clean voxel blocks on floating pastel islands.",
    "w_legendary": "Royal purple streets with a rare-card gold shine.",
    "w_treasureisle": "Turquoise seas, palm woods and a red treasure route.",
    "features_title": "A real navigation app under the fun skin",
    "features_sub": "Everything you need to get from A to B, built for one-handed use in the car, on the bike or on foot.",
    "f_search_t": "Search anywhere", "f_search_d": "Find addresses and places with fast autocomplete.",
    "f_voice_t": "Voice search", "f_voice_d": "Say where you want to go. Speech is recognized on your device.",
    "f_nearby_t": "Nearby in one tap", "f_nearby_d": "Gas, EV charging, food, coffee, hotels, parking and groceries.",
    "f_saved_t": "Home, Work & favorites", "f_saved_d": "Save the places you go most and start a route instantly.",
    "f_parking_t": "Remember my parking", "f_parking_d": "One tap saves where you parked, so you can walk back later.",
    "f_pin_t": "Drop a pin", "f_pin_d": "Long-press anywhere on the map to drop a pin and route there.",
    "f_routes_t": "Drive, bike or walk", "f_routes_d": "Compare the fastest and the shortest route before you go.",
    "f_turns_t": "Big turn cards", "f_turns_d": "Clear turn-by-turn guidance you can read at a glance.",
    "f_prompts_t": "Voice prompts", "f_prompts_d": "Choose spoken directions, gentle chimes, or muted.",
    "f_speed_t": "Speedometer & limits", "f_speed_d": "See your speed next to the posted speed limit.",
    "f_reroute_t": "Auto rerouting", "f_reroute_d": "Missed a turn? ROAMO finds a new route automatically.",
    "f_night_t": "Night tint", "f_night_d": "The map dims automatically after sunset, easy on your eyes.",
    "f_3d_t": "3D buildings", "f_3d_d": "Buildings rise in 3D in selected worlds.",
    "f_lang_t": "11 languages", "f_lang_d": "English, Spanish, French, German, Portuguese, Italian, Japanese, Korean, Chinese, Russian and Vietnamese.",
    "privacy_kicker": "Privacy promise",
    "privacy_title": "Your trips are nobody's business.",
    "privacy_sub": "ROAMO has no servers that collect your data, no accounts and no trackers. It is built to need as little as possible.",
    "pp1_t": "No account", "pp1_d": "Open the app and go. No sign-up, no email, no login.",
    "pp2_t": "No analytics, no ads", "pp2_d": "No advertising, no analytics and no tracking SDKs of any kind.",
    "pp3_t": "Location stays on your phone", "pp3_d": "Your GPS position is used on your device to guide you. It is never stored on any server.",
    "pp4_t": "Only what a request needs", "pp4_d": "To find a place or a route, only the search text or the route's start and end points are sent to the map service ({geoapify}) to answer that request.",
    "privacy_label_note": "App Store privacy label",
    "privacy_label": "Data Not Collected",
    "privacy_more": "Read the full privacy policy",
    "pricing_title": "Start free. Unlock every world.",
    "pricing_sub": "Block World and Doodle Notebook are free forever. ROAMO Pro unlocks all 22 worlds.",
    "plan_free": "Free", "plan_free_desc": "Block World + Doodle Notebook, free forever, with full search and navigation.",
    "plan_weekly": "Weekly", "plan_monthly": "Monthly", "plan_yearly": "Yearly", "plan_lifetime": "Lifetime",
    "per_week": "/ week", "per_month": "/ month", "per_year": "/ year", "one_time": "one-time",
    "best_badge": "Best value",
    "pro_includes": "All 22 worlds",
    "pricing_note": "Prices shown in US dollars; your local App Store price may differ. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your App Store account settings.",
    "faq_title": "Questions? Answered.",
    "faq": [
        {"q": "Is ROAMO free?", "a": "Yes. Block World and Doodle Notebook are free forever, with search and turn-by-turn navigation. ROAMO Pro unlocks the other 13 worlds."},
        {"q": "Do I need an account?", "a": "No. There is no sign-up and no login. Purchases are handled by Apple through your App Store account."},
        {"q": "Which devices are supported?", "a": "iPhone with iOS 17 or later."},
        {"q": "Does ROAMO track me?", "a": "No. ROAMO has no ads, no analytics and no tracking SDKs, and its App Store privacy label is “Data Not Collected”."},
        {"q": "Where does the map data come from?", "a": "Map data © {osm} contributors, tiles from {ofm} / {omt}, search and routing powered by {geoapify}, rendered with {maplibre}."},
        {"q": "Is ROAMO connected to any video game?", "a": "No. ROAMO is an independent app and is not affiliated with any game publisher. The worlds are original styles inspired by game genres."},
    ],
    "faq_more": "More help on the support page",
    "cta_title": "Ready to roam?",
    "cta_sub": "Turn your next drive, ride or walk into a level.",
    "footer_tag": "Game-style map worlds for iPhone.",
    "footer_legal": "Legal", "footer_privacy": "Privacy Policy", "footer_terms": "Terms of Use", "footer_support": "Support",
    "footer_credits": "Map credits",
    "attr_osm": "Map data © {osm} contributors",
    "attr_tiles": "Tiles: {ofm} / {omt}",
    "attr_geo": "Search & routing powered by {geoapify}",
    "attr_engine": "Map engine: {maplibre}",
    "disclaimer": "ROAMO is an independent app and is not affiliated with any game publisher.",
    "trademark": "Apple, App Store and iPhone are trademarks of Apple Inc.",
    "updated": "Last updated: November 27, 2026",
    "back": "Back to ROAMO",
    "translation_note": "",
    # ---- Privacy policy ----
    "privacy_page_title": "Privacy Policy",
    "privacy_page_desc": "How ROAMO handles your data: no account, no analytics, no ads, no tracking. Location stays on your device.",
    "privacy_intro": "This policy explains what happens to your information when you use ROAMO (“the app”), published by DeeplyAi (“we”). The short version: we do not collect, store or sell any personal data.",
    "privacy_sections": [
        {"h": "1. Summary", "ul": [
            "No account: ROAMO never asks for your name, email or phone number.",
            "No analytics, no advertising and no tracking SDKs are included in the app.",
            "We do not operate servers that receive your data, and we never sell or share personal data.",
            "Your location is processed on your device. Only the information needed to answer a search or route request is sent to the map service.",
            "The app's App Store privacy label is “Data Not Collected”."]},
        {"h": "2. Location", "p": [
            "If you allow location access, ROAMO uses your device's GPS position to show where you are, guide you turn by turn, show your speed, reroute you, and suggest places near you. This happens on your iPhone. We never receive, store or log your location history.",
            "You can change or revoke location access at any time in iOS Settings › Privacy & Security › Location Services › ROAMO. Features that depend on your position will not work without it."]},
        {"h": "3. What is sent to the map service", "p": [
            "Search and routing are provided by {geoapify}. To answer a request, the app sends only what that request needs:"],
         "ul": [
            "Search: the text you type or say, plus a reference point (your position or the map area) so nearby results come first.",
            "Nearby: the category you choose (for example “coffee”) and the point to search around.",
            "Routes: the start and end points of the route and the travel mode (drive, bike or walk). When you leave the route, your current position is sent as the new start point to calculate a new route."],
         "p2": [
            "These requests are not linked to any account or identifier of yours. Geoapify processes them under its own privacy policy: {geoapify_privacy}."]},
        {"h": "4. Map tiles", "p": [
            "The map images (tiles) are downloaded from {ofm}, using {omt} and {osm} data. Like any website or server on the internet, these services receive standard connection information such as your IP address and which map tiles are requested, which can reveal the general area you are viewing. ROAMO does not add any identifier to these requests. See {ofm_privacy}."]},
        {"h": "5. Voice search and voice prompts", "p": [
            "Voice search uses Apple's on-device speech recognition. Your voice is not sent to us or to the map service; only the resulting text is used as a normal search. If on-device recognition is not available for your language, the microphone button is hidden. Spoken turn-by-turn prompts are generated on your device. Microphone access is requested only when you use voice search and can be changed in iOS Settings."]},
        {"h": "6. Camera, screenshots and facecam", "p": [
            "ROAMO uses the camera only when you ask: to record the optional trip facecam, or to photograph your own textures in World Studio. The screenshot button on the navigation screen does not use the camera; it captures what ROAMO shows. The facecam records the front camera at a few frames per second, without sound, only while a trip is being recorded, and iOS pauses it whenever ROAMO is not on your iPhone's screen. Screenshots and facecam clips are saved only on your iPhone: they are never uploaded to us or to anyone else, are not analysed for faces, and are used only for your own pictures and trip video. You decide whether to save or share them; please ask passengers before you record or share them. You can delete a trip's facecam in the trip video editor, and camera access can be changed at any time in iOS Settings."]},
        {"h": "7. Data stored on your device", "p": [
            "ROAMO saves a few things locally so the app works the way you left it: your Home, Work and favorite places, your saved parking spot, the world you chose, and your settings (such as voice, units and language). This data stays on your iPhone and is removed when you delete the app. It may be included in your own device backups according to your iOS settings; we cannot access it.",
            "Trips you record (route, times, speed, altitude, screenshots and facecam clips) are also stored only on your iPhone; facecam clips are excluded from iCloud backups."]},
        {"h": "8. Purchases", "p": [
            "ROAMO Pro subscriptions and the lifetime purchase are processed entirely by Apple through the App Store. We never receive your name, payment details or Apple ID. The app only checks with Apple, on your device, whether Pro is active. Apple's handling of purchases is covered by Apple's privacy policy."]},
        {"h": "9. No tracking, no advertising, no sale of data", "p": [
            "ROAMO contains no advertising, no analytics and no third-party tracking or crash-reporting SDKs. We do not track you across apps or websites, we do not build profiles, and we do not sell or share personal information as those terms are defined in laws such as the GDPR or the CCPA/CPRA."]},
        {"h": "10. Children", "p": [
            "ROAMO is a general-audience navigation app and is not directed at children under 13. Because the app collects no personal data, it does not knowingly collect information from children."]},
        {"h": "11. Your rights", "p": [
            "Depending on where you live, you may have rights to access, correct or delete personal data. Because we do not collect or hold personal data about you, there is nothing for us to access or delete; the data saved on your device is under your control and is erased when you delete the app. For requests about data processed by Geoapify or OpenFreeMap, contact those services directly. You can always contact us with questions at {email_link}."]},
        {"h": "12. Security", "p": [
            "All requests to the map service and tile servers use encrypted HTTPS connections."]},
        {"h": "13. Changes to this policy", "p": [
            "If the way ROAMO handles data changes, we will update this page and the date at the top before the change takes effect in the app."]},
        {"h": "14. Contact", "p": [
            "DeeplyAi — {email_link}"]},
    ],
    # ---- Terms ----
    "terms_page_title": "Terms of Use",
    "terms_page_desc": "Terms of use for the ROAMO iPhone app, including subscriptions and the Apple standard EULA.",
    "terms_intro": "ROAMO is licensed to you under Apple's {eula}. The short terms below add to it; if anything conflicts, the Apple EULA prevails.",
    "eula_name": "Standard Licensed Application End User License Agreement (EULA)",
    "terms_sections": [
        {"h": "1. Navigation safety", "p": [
            "ROAMO is a navigation aid. Always obey traffic laws, road signs and local conditions, and keep your eyes on the road. Do not interact with the app while driving; set your route before you start or let a passenger do it. Routes, speed limits, travel times and place information come from third-party data and may be incomplete, outdated or wrong."]},
        {"h": "2. Map data and services", "p": [
            "Map data © {osm} contributors, available under the Open Database License. Tiles are provided by {ofm} using {omt}. Search and routing are powered by {geoapify}. These services may change, limit or be temporarily unavailable; when the daily service limit is reached, search and routing may pause until it resets."]},
        {"h": "3. ROAMO Pro", "ul": [
            "Block World and Doodle Notebook are free. ROAMO Pro unlocks all worlds.",
            "Plans: Weekly $3.99, Monthly $6.99, Yearly $39.99 and Lifetime $79.99 (one-time purchase). Prices are in US dollars and may vary by country.",
            "Payment is charged to your Apple ID at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period, and your account is charged for renewal within 24 hours before the period ends.",
            "Manage or cancel your subscription in your App Store account settings. Refunds are handled by Apple according to its policies."]},
        {"h": "4. Acceptable use", "p": [
            "Do not reverse engineer, resell or misuse the app or the map services it relies on, or use it in any way that breaks the law."]},
        {"h": "5. Independence", "p": [
            "ROAMO is an independent app and is not affiliated with any game publisher. World names and styles are original."]},
        {"h": "6. Disclaimer and liability", "p": [
            "The app is provided “as is”. To the extent permitted by law, DeeplyAi is not liable for any loss or damage arising from the use of the app, including inaccurate directions, as further described in the Apple EULA."]},
        {"h": "7. Changes and contact", "p": [
            "We may update these terms; the date at the top shows the latest version. Questions: {email_link}."]},
    ],
    # ---- Support ----
    "support_page_title": "Support",
    "support_page_desc": "Help for ROAMO: restore purchases, cancel a subscription, free worlds, language settings and contact.",
    "support_intro": "Quick answers to the most common questions. Still stuck? Write to us, we read every message.",
    "support_faq": [
        {"q": "How do I restore my purchase?", "a": "Open ROAMO, tap the gear button to open Settings, then tap <b>Restore purchases</b>. Make sure you are signed in to the App Store with the same Apple ID you used to buy ROAMO Pro."},
        {"q": "How do I cancel my subscription?", "a": "Subscriptions are managed by Apple. On your iPhone open <b>Settings › [your name] › Subscriptions › ROAMO</b> and tap <b>Cancel Subscription</b>. Cancel at least 24 hours before the renewal date to avoid being charged for the next period. Deleting the app does not cancel a subscription."},
        {"q": "What can I do for free?", "a": "Block World and Doodle Notebook are free forever, with search, nearby places and turn-by-turn navigation. ROAMO Pro unlocks the other 13 worlds."},
        {"q": "Why do I see “Daily map service limit reached”?", "a": "Search and routing use a shared map service with a daily request limit. If it is reached, try again later; the limit resets every day. The map itself and your saved places keep working."},
        {"q": "How do I change the language?", "a": "Open ROAMO, tap the gear button, and choose a language under <b>Language</b>. “System default” follows your iPhone's language. Some text may update after restarting ROAMO."},
        {"q": "How do I switch between miles and kilometers, or mute the voice?", "a": "In ROAMO Settings, under <b>Navigation</b>, choose <b>Units</b> and <b>Voice</b> (voice, chimes or muted). You can also hide the speedometer there."},
        {"q": "The blue dot does not move or shows the wrong place.", "a": "Check that location access is allowed in iOS Settings › Privacy & Security › Location Services › ROAMO, preferably with Precise Location on. Moving to an open area helps GPS lock on."},
    ],
    "contact_title": "Contact us",
    "contact_text": "Email {email_link}. Please include your iPhone model, iOS version and a short description of the problem. We usually reply within two business days.",
    "contact_btn": "Email support",
    "support_links": "Useful links",
    "manage_subs": "Manage subscriptions",
    "footer_company": "More from DeeplyAi",
    "footer_apps": "All apps", "footer_about": "About", "footer_contact": "Contact",
}

LINKS = {
    "osm": '<a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>',
    "ofm": '<a href="https://openfreemap.org" rel="noopener">OpenFreeMap</a>',
    "omt": '<a href="https://openmaptiles.org" rel="noopener">OpenMapTiles</a>',
    "geoapify": '<a href="https://www.geoapify.com" rel="noopener">Geoapify</a>',
    "maplibre": '<a href="https://maplibre.org" rel="noopener">MapLibre</a>',
    "geoapify_privacy": '<a href="https://www.geoapify.com/privacy-policy/" rel="noopener">geoapify.com/privacy-policy</a>',
    "ofm_privacy": '<a href="https://openfreemap.org" rel="noopener">openfreemap.org</a>',
    "email": SUPPORT_EMAIL,
    "email_link": f'<a href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a>',
}

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
esc = html.escape
WARNINGS = []


def load_translations():
    t = {"en": EN}
    for code, _ in LANGS:
        if code == "en":
            continue
        path = ROOT / "i18n" / f"{code}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        for k in EN:
            if k not in data:
                WARNINGS.append(f"{code}: missing key '{k}' (English used)")
        t[code] = {**EN, **data}
    return t


def fill(s, T=None, **extra):
    """Replace {placeholders} without str.format (strings contain CSS/JSON braces)."""
    rep = dict(LINKS)
    if T is not None:
        rep["eula"] = f'<a href="{APPLE_EULA}" rel="noopener">{T["eula_name"]}</a>'
    rep.update(extra)
    for k, v in rep.items():
        s = s.replace("{" + k + "}", v)
    return s


def strip_tags(s):
    out, inside = [], False
    for ch in s:
        if ch == "<":
            inside = True
        elif ch == ">":
            inside = False
        elif not inside:
            out.append(ch)
    return "".join(out)


def lang_dir(code):
    return "" if code == DEFAULT_LANG else code + "/"


def support_file(code):
    return f"{SUPPORT_FILE}.html" if code == DEFAULT_LANG else f"{SUPPORT_FILE}.{code}.html"


def url_of(code, page):
    """Where a page lives, relative to the site root (public/)."""
    if page == "support":
        return support_file(code)
    return "roamo/" + lang_dir(code) + ("index.html" if page == "index" else page + ".html")


def rel(here, target):
    """Relative link from the page at `here` to `target` (both relative to the site root)."""
    r = posixpath.relpath(target, posixpath.dirname(here) or ".")
    return "" if r == "." else r


def canonical(code, page):
    if page == "support":
        return ROOT_URL + support_file(code)
    return SITE_URL + lang_dir(code) + ("" if page == "index" else page + "/")


def luminance(hex_color):
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ink_on(hex_color):
    return "#111111" if luminance(hex_color) > 0.22 else "#FFFFFF"


def css_image(value):
    """Used inside assets/site.css, so texture URLs are relative to assets/."""
    if value is None:
        return "none"
    if value.startswith(("linear", "radial", "repeating")):
        return value
    return f"url(textures/{value}.png)"


def world_vars(w):
    (wid, name, group, free, accent, route, dark, base, land, patch, road, edge) = w
    return {
        "--base": base,
        "--land": css_image(land),
        "--patch": css_image(patch),
        "--accent": accent,
        "--accent-ink": ink_on(accent),
        "--route": route,
        "--road": road,
        "--edge": edge,
        "--chrome": "rgba(18,18,22,.88)" if dark else "rgba(255,255,255,.92)",
        "--chrome-ink": "#FFFFFF" if dark else "#111111",
    }


def worlds_css():
    out = ["\n/* ---------- Worlds (generated by build.py) ---------- */"]
    for w in WORLDS:
        out.append(f".w-{w[0]}{{" + ";".join(f"{k}:{v}" for k, v in world_vars(w).items()) + "}")
    return "\n".join(out) + "\n"


# --------------------------------------------------------------------------
# Inline SVG icons (stroke = currentColor)
# --------------------------------------------------------------------------
def icon(name):
    paths = {
        "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
        "voice": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
        "nearby": '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
        "saved": '<path d="M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10"/>',
        "parking": '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>',
        "pin": '<path d="M12 22v-8"/><circle cx="12" cy="8" r="5"/>',
        "routes": '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
        "turns": '<path d="M6 20v-7a4 4 0 0 1 4-4h9"/><path d="m15 5 4 4-4 4"/>',
        "prompts": '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12"/>',
        "speed": '<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 14 4-5"/>',
        "reroute": '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
        "night": '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
        "3d": '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
        "lang": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
        "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M3 3l18 18"/>',
        "eye": '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
        "phone": '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
        "send": '<path d="M4 12h12M12 6l6 6-6 6"/>',
        "check": '<path d="m5 12 5 5L20 7"/>',
        "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
        "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    }
    return (f'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" '
            f'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{paths[name]}</svg>')


APPLE_GLYPH = ('<svg class="badge-apple" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
               '<path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-4zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>')


def badge(T, extra_class=""):
    return (f'<a class="badge {extra_class}" href="{APP_STORE_URL}" rel="noopener" aria-label="{esc(T["badge_aria"])}">'
            f'{APPLE_GLYPH}<span class="badge-txt"><small>{T["badge_small"]}</small><strong>{T["badge_big"]}</strong></span></a>')


# --------------------------------------------------------------------------
# Page shell
# --------------------------------------------------------------------------
def head(T, code, og_locale, page, title, desc, prefix):
    alts = "\n".join(
        f'<link rel="alternate" hreflang="{c}" href="{canonical(c, page)}">' for c, _ in LANGS)
    alts += f'\n<link rel="alternate" hreflang="x-default" href="{canonical(DEFAULT_LANG, page)}">'
    og_alts = "\n".join(f'<meta property="og:locale:alternate" content="{o}">' for c, o in LANGS if c != code)
    jsonld = ""
    if page == "index":
        data = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ROAMO",
            "alternateName": "ROAMO — Game-style map worlds",
            "description": T["description"],
            "applicationCategory": "TravelApplication",
            "applicationSubCategory": "Navigation",
            "operatingSystem": "iOS 17.0 or later",
            "url": canonical(code, "index"),
            "downloadUrl": APP_STORE_URL,
            "installUrl": APP_STORE_URL,
            "image": SITE_URL + "assets/og-icon.jpg",
            "inLanguage": [c for c, _ in LANGS],
            "isAccessibleForFree": True,
            "identifier": BUNDLE_ID,
            "publisher": {"@type": "Organization", "name": PUBLISHER, "url": ROOT_URL, "email": SUPPORT_EMAIL},
            "offers": [
                {"@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD"},
                {"@type": "Offer", "name": "ROAMO Pro Weekly", "price": "3.99", "priceCurrency": "USD"},
                {"@type": "Offer", "name": "ROAMO Pro Monthly", "price": "6.99", "priceCurrency": "USD"},
                {"@type": "Offer", "name": "ROAMO Pro Yearly", "price": "39.99", "priceCurrency": "USD"},
                {"@type": "Offer", "name": "ROAMO Pro Lifetime", "price": "79.99", "priceCurrency": "USD"},
            ],
        }
    elif page == "support":
        data = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "inLanguage": code,
            "mainEntity": [{"@type": "Question", "name": strip_tags(x["q"]),
                            "acceptedAnswer": {"@type": "Answer", "text": strip_tags(fill(x["a"], T))}}
                           for x in T["support_faq"]],
        }
    else:
        data = None
    if data:
        jsonld = ('<script type="application/ld+json">'
                  + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + "</script>")
    app_id = APP_STORE_URL.rsplit("/id", 1)[-1]
    smart_banner = "" if set(app_id) <= {"0"} else f'<meta name="apple-itunes-app" content="app-id={app_id}">\n'
    return f"""<!doctype html>
<html lang="{code}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FFD640" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#080E2B" media="(prefers-color-scheme: dark)">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="canonical" href="{canonical(code, page)}">
{alts}
<link rel="icon" type="image/png" sizes="32x32" href="{prefix}assets/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="{prefix}assets/icon-192.png">
<link rel="apple-touch-icon" href="{prefix}assets/icon-180.png">
{smart_banner}<meta property="og:type" content="website">
<meta property="og:site_name" content="DeeplyAi">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canonical(code, page)}">
<meta property="og:image" content="{SITE_URL}assets/og-icon.jpg">
<meta property="og:image:width" content="630">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="ROAMO app icon">
<meta property="og:locale" content="{og_locale}">
{og_alts}
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE_URL}assets/og-icon.jpg">
<link rel="stylesheet" href="{prefix}assets/site.css">
{jsonld}
</head>"""


def lang_switcher(T, code, page, here):
    items = []
    for c, _ in LANGS:
        name = TRANSLATIONS[c]["lang_name"]
        href = rel(here, url_of(c, page)) or posixpath.basename(here)
        cur = ' aria-current="true"' if c == code else ""
        items.append(f'<li><a href="{href}" hreflang="{c}" lang="{c}"{cur}>{esc(name)}</a></li>')
    return (f'<details class="langs"><summary aria-label="{esc(T["lang_label"])}: {esc(T["lang_name"])}">'
            f'{icon("globe")}<span>{esc(T["lang_name"])}</span></summary>'
            f'<ul role="list">{"".join(items)}</ul></details>')


def header(T, code, page, prefix, here):
    home = rel(here, url_of(code, "index"))
    sec = "" if page == "index" else home
    nav = "".join(
        f'<li><a href="{sec}#{a}">{T[k]}</a></li>'
        for a, k in [("worlds", "nav_worlds"), ("features", "nav_features"), ("privacy", "nav_privacy"),
                     ("pricing", "nav_pricing"), ("faq", "nav_faq")])
    cur = ' aria-current="page"' if page == "support" else ""
    nav += f'<li><a href="{rel(here, url_of(code, "support"))}"{cur}>{T["nav_support"]}</a></li>'
    return f"""<body>
<a class="skip" href="#main">{T["skip"]}</a>
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="{home}"><img src="{prefix}assets/logo-72.png" width="36" height="36" alt=""><span>ROAMO</span></a>
    <nav class="mainnav" aria-label="ROAMO"><ul role="list">{nav}</ul></nav>
    {lang_switcher(T, code, page, here)}
  </div>
</header>"""


def footer(T, code, prefix, here):
    u = lambda page: rel(here, url_of(code, page))
    logo = lambda tone: rel(here, f"assets/images/brand/logo-{tone}.svg")
    note = f'<p class="tnote">{T["translation_note"]}</p>' if T["translation_note"] else ""
    return f"""<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <a class="logo" href="{u("index")}"><img src="{prefix}assets/logo-72.png" width="36" height="36" alt=""><span>ROAMO</span></a>
      <p class="muted">{T["footer_tag"]}</p>
      {badge(T, "badge-sm")}
    </div>
    <div>
      <h2 class="foot-h">{T["footer_legal"]}</h2>
      <ul role="list" class="foot-list">
        <li><a href="{u("privacy")}">{T["footer_privacy"]}</a></li>
        <li><a href="{u("terms")}">{T["footer_terms"]}</a></li>
        <li><a href="{u("support")}">{T["footer_support"]}</a></li>
        <li><a href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a></li>
      </ul>
    </div>
    <div>
      <h2 class="foot-h">{T["footer_credits"]}</h2>
      <ul role="list" class="foot-list">
        <li>{fill(T["attr_osm"])}</li>
        <li>{fill(T["attr_tiles"])}</li>
        <li>{fill(T["attr_geo"])}</li>
        <li>{fill(T["attr_engine"])}</li>
      </ul>
    </div>
    <div>
      <h2 class="foot-h">{T["footer_company"]}</h2>
      <a class="dai" href="{ROOT_URL}" aria-label="DeeplyAi"><picture><source srcset="{logo("white")}" media="(prefers-color-scheme: dark)"><img src="{logo("black")}" width="132" height="29" alt="DeeplyAi" loading="lazy"></picture></a>
      <ul role="list" class="foot-list">
        <li><a href="{ROOT_URL}apps/">{T["footer_apps"]}</a></li>
        <li><a href="{ROOT_URL}about.html">{T["footer_about"]}</a></li>
        <li><a href="{ROOT_URL}contact.html">{T["footer_contact"]}</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap foot-base">
    <p><strong>{T["disclaimer"]}</strong></p>
    <p class="muted">{T["trademark"]} © 2026 {PUBLISHER}.</p>
    {note}
  </div>
</footer>
<script src="{prefix}assets/site.js" defer></script>
</body>
</html>
"""


# --------------------------------------------------------------------------
# Landing page
# --------------------------------------------------------------------------
def phone(T, prefix):
    w = next(x for x in WORLDS if x[0] == DEFAULT_WORLD)
    label = T["phone_aria"].replace("{world}", w[1])
    return f"""<div class="phone w-{w[0]}" id="phone" role="img" aria-label="{esc(label)}">
  <div class="screen" aria-hidden="true">
    <div class="map">
      <div class="patch"></div>
      <svg class="roads" viewBox="0 0 300 640" preserveAspectRatio="xMidYMid slice">
        <g class="r-edge"><path d="M-10 170H310M-10 440H310M90-10V650M222-10V650M222 300 310 230"/></g>
        <g class="r-fill"><path d="M-10 170H310M-10 440H310M90-10V650M222-10V650M222 300 310 230"/></g>
        <path class="route-edge" d="M90 650V440H222V170H310"/>
        <path class="route" d="M90 650V440H222V170H310"/>
        <g class="puck" transform="translate(90 505)"><circle r="17"/><path d="M0-10 8 9 0 4-8 9z"/></g>
      </svg>
    </div>
    <div class="island"></div>
    <div class="turn">
      <svg viewBox="0 0 24 24" class="turn-ico"><path d="M6 21v-8a4 4 0 0 1 4-4h8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="m14 4 5 5-5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div><b class="turn-dist">{T["phone_dist"]}</b><span class="turn-st">{T["phone_street"]}</span></div>
    </div>
    <div class="then">{T["phone_then"]} ↰</div>
    <div class="speed"><b>{T["phone_speed"]}</b><small>{T["phone_speed_unit"]}</small></div>
    <div class="limit"><b>{T["phone_limit"]}</b></div>
    <div class="eta"><b>{T["phone_eta"]}</b><span>{T["phone_trip"]} · {T["phone_arrive"]}</span></div>
    <div class="wtag" id="wtag">{w[1]}</div>
  </div>
</div>"""


def world_button(T, w, prefix, kind):
    wid, name, group, free = w[0], w[1], w[2], w[3]
    data = esc(json.dumps({"id": wid, "name": name}, separators=(",", ":")))
    tag = f'<span class="tag {"tag-free" if free else "tag-pro"}">{T["free"] if free else T["pro"]}</span>'
    pressed = "true" if wid == DEFAULT_WORLD else "false"
    sw = f'<span class="sw w-{wid}" aria-hidden="true"><i></i></span>'
    if kind == "chip":
        return (f'<li><button type="button" class="chip" data-w="{data}" aria-pressed="{pressed}">'
                f'{sw}<span>{name}</span></button></li>')
    return (f'<li><button type="button" class="card" data-w="{data}" aria-pressed="{pressed}">'
            f'{sw}<span class="card-b"><span class="card-n">{name} {tag}</span>'
            f'<span class="card-d">{T["w_" + wid]}</span></span></button></li>')


def index_body(T, code, prefix, here):
    chips = "".join(world_button(T, w, prefix, "chip") for w in WORLDS)
    groups = ""
    for g in GROUPS:
        cards = "".join(world_button(T, w, prefix, "card") for w in WORLDS if w[2] == g)
        groups += f'<div class="group"><h3 class="group-h">{T["grp_" + g]}</h3><ul role="list" class="cards">{cards}</ul></div>'
    feats = ""
    for key, ic in [("search", "search"), ("voice", "voice"), ("nearby", "nearby"), ("saved", "saved"),
                    ("parking", "parking"), ("pin", "pin"), ("routes", "routes"), ("turns", "turns"),
                    ("prompts", "prompts"), ("speed", "speed"), ("reroute", "reroute"), ("night", "night"),
                    ("3d", "3d"), ("lang", "lang")]:
        feats += f'<li class="feat">{icon(ic)}<h3>{T["f_" + key + "_t"]}</h3><p>{T["f_" + key + "_d"]}</p></li>'
    pps = ""
    for i, ic in zip(range(1, 5), ["user", "eye", "phone", "send"]):
        pps += f'<li>{icon(ic)}<div><h3>{T[f"pp{i}_t"]}</h3><p>{fill(T[f"pp{i}_d"])}</p></div></li>'
    plans = (f'<li class="plan plan-free"><h3>{T["plan_free"]}</h3><p class="price">$0</p>'
             f'<p>{T["plan_free_desc"]}</p></li>')
    for p, per in [("weekly", "per_week"), ("monthly", "per_month"), ("yearly", "per_year"), ("lifetime", "one_time")]:
        hot = p == "yearly"
        flag = f'<span class="flag">{T["best_badge"]}</span>' if hot else ""
        if p == "lifetime":
            flag = ""
        plans += (f'<li class="plan{" plan-hot" if hot else ""}">{flag}<h3>{T["plan_" + p]}</h3>'
                  f'<p class="price">{PRICES[p]} <small>{T[per]}</small></p>'
                  f'<p class="incl">{icon("check")} {T["pro_includes"]}</p>'
                  + "</li>")
    faq = "".join(f'<details class="qa"><summary>{x["q"]}</summary><div>{fill(x["a"])}</div></details>' for x in T["faq"])
    u = lambda page: rel(here, url_of(code, page))
    return f"""<main id="main">
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="kicker">{T["hero_kicker"]}</p>
      <h1>{T["hero_title"]}</h1>
      <p class="lead">{T["hero_sub"]}</p>
      <div class="cta-row">{badge(T)}<span class="note">{T["hero_note"]}</span></div>
      <p class="req">{T["hero_req"]}</p>
    </div>
    <div class="hero-phone">
      {phone(T, prefix)}
    </div>
  </div>
  <div class="wrap switcher">
    <h2 class="switch-h" id="switch-h">{T["switch_title"]}</h2>
    <ul role="list" class="chips" aria-labelledby="switch-h">{chips}</ul>
    <p class="sr-only" id="live" aria-live="polite" data-tpl="{esc(T["now_showing"])}" data-aria="{esc(T["phone_aria"])}"></p>
  </div>
</section>

<section class="sec" id="worlds" aria-labelledby="worlds-h">
  <div class="wrap">
    <h2 class="sec-h" id="worlds-h">{T["worlds_title"]}</h2>
    <p class="sec-sub">{T["worlds_sub"]}</p>
    {groups}
  </div>
</section>

<section class="sec sec-alt" id="features" aria-labelledby="features-h">
  <div class="wrap">
    <h2 class="sec-h" id="features-h">{T["features_title"]}</h2>
    <p class="sec-sub">{T["features_sub"]}</p>
    <ul role="list" class="feats">{feats}</ul>
  </div>
</section>

<section class="sec sec-dark" id="privacy" aria-labelledby="privacy-h">
  <div class="wrap priv-grid">
    <div>
      <p class="kicker">{T["privacy_kicker"]}</p>
      <h2 class="sec-h" id="privacy-h">{T["privacy_title"]}</h2>
      <p class="sec-sub">{T["privacy_sub"]}</p>
      <div class="label-card"><small>{T["privacy_label_note"]}</small><strong>{icon("check")} {T["privacy_label"]}</strong></div>
      <p><a class="more" href="{u("privacy")}">{T["privacy_more"]} →</a></p>
    </div>
    <ul role="list" class="pps">{pps}</ul>
  </div>
</section>

<section class="sec" id="pricing" aria-labelledby="pricing-h">
  <div class="wrap">
    <h2 class="sec-h" id="pricing-h">{T["pricing_title"]}</h2>
    <p class="sec-sub">{T["pricing_sub"]}</p>
    <ul role="list" class="plans">{plans}</ul>
    <p class="fine">{T["pricing_note"]} <a href="{u("terms")}">{T["footer_terms"]}</a> · <a href="{u("privacy")}">{T["footer_privacy"]}</a></p>
  </div>
</section>

<section class="sec sec-alt" id="faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <h2 class="sec-h" id="faq-h">{T["faq_title"]}</h2>
    {faq}
    <p><a class="more" href="{u("support")}">{T["faq_more"]} →</a></p>
  </div>
</section>

<section class="sec cta-band" aria-labelledby="cta-h">
  <div class="wrap cta-in">
    <h2 class="sec-h" id="cta-h">{T["cta_title"]}</h2>
    <p class="sec-sub">{T["cta_sub"]}</p>
    {badge(T)}
  </div>
</section>
</main>"""


# --------------------------------------------------------------------------
# Document pages (privacy / terms / support)
# --------------------------------------------------------------------------
def sections_html(T, sections):
    out = ""
    for s in sections:
        out += f'<section><h2>{s["h"]}</h2>'
        for p in s.get("p", []):
            out += f"<p>{fill(p, T)}</p>"
        if s.get("ul"):
            out += "<ul>" + "".join(f"<li>{fill(li, T)}</li>" for li in s["ul"]) + "</ul>"
        for p in s.get("p2", []):
            out += f"<p>{fill(p, T)}</p>"
        out += "</section>"
    return out


def doc_body(T, code, page, prefix, here):
    u = lambda p: rel(here, url_of(code, p))
    note = f'<p class="tnote">{T["translation_note"]}</p>' if T["translation_note"] else ""
    if page == "privacy":
        title, inner = T["privacy_page_title"], f'<p class="lead">{fill(T["privacy_intro"], T)}</p>' + sections_html(T, T["privacy_sections"])
    elif page == "terms":
        title, inner = T["terms_page_title"], f'<p class="lead">{fill(T["terms_intro"], T)}</p>' + sections_html(T, T["terms_sections"])
    else:
        title = T["support_page_title"]
        qa = "".join(f'<details class="qa"><summary>{x["q"]}</summary><div>{fill(x["a"], T)}</div></details>'
                     for x in T["support_faq"])
        links = (f'<li><a href="{u("privacy")}">{T["footer_privacy"]}</a></li>'
                 f'<li><a href="{u("terms")}">{T["footer_terms"]}</a></li>'
                 f'<li><a href="{MANAGE_SUBS_URL}" rel="noopener">{T["manage_subs"]}</a></li>'
                 f'<li><a href="{APP_STORE_URL}" rel="noopener">{T["badge_aria"]}</a></li>')
        inner = (f'<p class="lead">{T["support_intro"]}</p>{qa}'
                 f'<section class="links" aria-labelledby="links-h"><h2 id="links-h">{T["support_links"]}</h2>'
                 f'<ul role="list" class="link-list">{links}</ul></section>'
                 f'<section class="contact" id="contact"><h2>{T["contact_title"]}</h2><p>{fill(T["contact_text"], T)}</p>'
                 f'<p><a class="btn" href="mailto:{SUPPORT_EMAIL}?subject=ROAMO%20support">{icon("mail")} {T["contact_btn"]}</a></p></section>')
    return f"""<main id="main" class="doc">
  <div class="wrap narrow">
    <p><a class="back" href="{u("index")}">← {T["back"]}</a></p>
    <h1>{title}</h1>
    <p class="muted">{T["updated"]}</p>
    {note}
    {inner}
  </div>
</main>"""


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------
def render(code, og_locale, page, here):
    """`here`: where the file is written, relative to the site root (public/)."""
    T = TRANSLATIONS[code]
    prefix = rel(here, "roamo/index.html").rsplit("index.html", 1)[0]  # path to roamo/ ("" inside it)
    if page == "index":
        title, desc, body = T["title"], T["description"], index_body(T, code, prefix, here)
    else:
        title = f'{T[page + "_page_title"]} — ROAMO'
        desc = T[page + "_page_desc"]
        body = doc_body(T, code, page, prefix, here)
    return (head(T, code, og_locale, page, title, desc, prefix) + "\n" + header(T, code, page, prefix, here)
            + "\n" + body + "\n" + footer(T, code, prefix, here))


def redirect(code, here, target):
    """Stub kept at an old URL (the app links to roamo/support/): sends visitors to `target`."""
    to = rel(here, target)
    url = canonical(code, "support")
    return f"""<!doctype html>
<html lang="{code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ROAMO Support</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={to}">
<script>location.replace("{to}" + location.hash);</script>
</head>
<body>
<p><a href="{to}">{esc(url)}</a></p>
</body>
</html>
"""


def write(path, text):
    """`path` is relative to the site root (public/)."""
    p = PUBLIC / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def sitemap():
    rows = []
    for page in PAGES:
        if page == "support":
            continue  # outside /roamo/: listed in the main sitemap (src/pages/sitemap.xml.ts)
        for c, _ in LANGS:
            alts = "".join(f'<xhtml:link rel="alternate" hreflang="{a}" href="{canonical(a, page)}"/>' for a, _ in LANGS)
            alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{canonical(DEFAULT_LANG, page)}"/>'
            rows.append(f"<url><loc>{canonical(c, page)}</loc><lastmod>{UPDATED_ISO}</lastmod>{alts}</url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(rows) + "\n</urlset>\n")


def main():
    global TRANSLATIONS
    TRANSLATIONS = load_translations()
    if DIST.exists():
        shutil.rmtree(DIST)
    for old in PUBLIC.glob(SUPPORT_FILE + "*.html"):
        old.unlink()
    shutil.copytree(ASSETS, DIST / "assets")
    with open(DIST / "assets" / "site.css", "a", encoding="utf-8") as f:
        f.write(worlds_css())
    count = 0
    for code, og in LANGS:
        base = "roamo/" + lang_dir(code)
        for page in PAGES:
            if page == "index":
                write(base + "index.html", render(code, og, page, base + "index.html")); count += 1
            elif page == "support":
                target = url_of(code, "support")
                write(target, render(code, og, page, target)); count += 1
                for old in (base + "support.html", base + "support/index.html"):
                    write(old, redirect(code, old, target))
            else:
                # flat file (used by internal links, works from file://) + clean folder URL
                for f in (base + page + ".html", base + page + "/index.html"):
                    write(f, render(code, og, page, f)); count += 1
    write("roamo/sitemap.xml", sitemap())
    # robots.txt lives at the site root (public/robots.txt) and points to this sitemap.
    for w in WARNINGS:
        print("WARNING:", w, file=sys.stderr)
    print(f"Built {count} HTML pages in {len(LANGS)} languages -> {DIST}")


TRANSLATIONS = {}

if __name__ == "__main__":
    main()
