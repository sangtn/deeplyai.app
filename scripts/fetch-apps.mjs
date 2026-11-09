// Refreshes src/data/apps.json and local app artwork from public App Store data.
// A failed or suspicious lookup exits non-zero and leaves existing data untouched.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const DEVELOPER_ID = 1809787876;
const MIN_EXPECTED_APPS = 40;
const SCREENSHOTS_PER_APP = 5;
const CONCURRENCY = 8;
const LOOKUP = `https://itunes.apple.com/lookup?id=${DEVELOPER_ID}&entity=software&limit=200&country=us`;
const ICON_DIR = new URL('../public/assets/apps/icons/', import.meta.url);
const SHOT_DIR = new URL('../public/assets/apps/shots/', import.meta.url);
const DATA_FILE = new URL('../src/data/apps.json', import.meta.url);
const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18 Safari/605.1.15';

async function download(source, target) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${response.status} for ${source}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}

// No storefront in the path, so every visitor lands in their own country's App Store.
const storeLink = (id) => `https://apps.apple.com/app/id${id}?itscg=30200&itsct=apps_box_badge&mttnsubad=${id}`;

const artwork = (url, size) => url.replace(/\/[^/]+$/, `/${size}.webp`);

/** Reads the Compatibility section of an App Store page; null when the page is unavailable. */
async function compatibility(url) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': BROWSER } });
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ');
    if (!text.includes('Compatibility')) return null;
    const find = (pattern) => text.match(pattern)?.[1] ?? null;
    return {
      macOS: find(/Mac Requires macOS ([\d.]+)/),
      visionOS: find(/Apple Vision Requires visionOS ([\d.]+)/),
      watchOS: find(/Apple Watch Requires watchOS ([\d.]+)/),
    };
  } catch {
    return null;
  }
}

const previous = new Map(
  JSON.parse(await readFile(DATA_FILE, 'utf8').catch(() => '[]')).map((app) => [app.id, app]),
);

const response = await fetch(LOOKUP);
if (!response.ok) throw new Error(`Lookup failed: ${response.status}`);
const { results } = await response.json();
const software = results.filter((item) => item.wrapperType === 'software');
if (software.length < MIN_EXPECTED_APPS) {
  throw new Error(`Only ${software.length} apps returned; keeping existing data.`);
}

await mkdir(ICON_DIR, { recursive: true });
await mkdir(SHOT_DIR, { recursive: true });

async function build(item) {
  await download(artwork(item.artworkUrl512, '256x256bb'), new URL(`${item.trackId}.webp`, ICON_DIR));
  await download(artwork(item.artworkUrl512, '512x512bb'), new URL(`${item.trackId}@512.webp`, ICON_DIR));

  const screenshots = [];
  for (const [index, url] of (item.screenshotUrls ?? []).slice(0, SCREENSHOTS_PER_APP).entries()) {
    const name = `${item.trackId}-${index + 1}.webp`;
    await download(artwork(url, '600x0w'), new URL(name, SHOT_DIR));
    screenshots.push(`/assets/apps/shots/${name}`);
  }

  const listing = item.trackViewUrl.split('?')[0];
  const known = previous.get(item.trackId)?.compatibility;
  const compat = (await compatibility(listing)) ?? known ?? { macOS: null, visionOS: null, watchOS: null };
  if (!compat.watchOS && (item.supportedDevices ?? []).some((device) => device.startsWith('Watch'))) {
    compat.watchOS = known?.watchOS ?? 'supported';
  }

  return {
    id: item.trackId,
    storeName: item.trackName,
    genre: item.primaryGenreName,
    rating: Math.round((item.averageUserRating ?? 0) * 10) / 10,
    ratingCount: item.userRatingCount ?? 0,
    version: item.version,
    updated: item.currentVersionReleaseDate.slice(0, 10),
    minimumOs: item.minimumOsVersion,
    price: item.price ?? 0,
    url: storeLink(item.trackId),
    icon: `/assets/apps/icons/${item.trackId}.webp`,
    iconLarge: `/assets/apps/icons/${item.trackId}@512.webp`,
    screenshots,
    compatibility: compat,
  };
}

const apps = [];
for (let start = 0; start < software.length; start += CONCURRENCY) {
  apps.push(...(await Promise.all(software.slice(start, start + CONCURRENCY).map(build))));
}

apps.sort((a, b) => a.id - b.id);
await writeFile(DATA_FILE, `${JSON.stringify(apps, null, 2)}\n`);
const count = (key) => apps.filter((app) => app.compatibility[key]).length;
console.log(`Saved ${apps.length} apps. Mac ${count('macOS')}, Vision ${count('visionOS')}, Watch ${count('watchOS')}.`);
