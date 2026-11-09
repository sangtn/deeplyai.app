// Refreshes src/data/apps.json and local app artwork from the public App Store lookup API.
// A failed or suspicious response exits non-zero and leaves existing data untouched.
import { mkdir, writeFile, access } from 'node:fs/promises';

const DEVELOPER_ID = 1809787876;
const MIN_EXPECTED_APPS = 40;
const SCREENSHOTS_PER_APP = 5;
const LOOKUP = `https://itunes.apple.com/lookup?id=${DEVELOPER_ID}&entity=software&limit=200&country=us`;
const ICON_DIR = new URL('../public/assets/apps/icons/', import.meta.url);
const SHOT_DIR = new URL('../public/assets/apps/shots/', import.meta.url);
const DATA_FILE = new URL('../src/data/apps.json', import.meta.url);

const exists = (url) => access(url).then(() => true, () => false);

async function download(source, target) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${response.status} for ${source}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}

const artwork = (url, size) => url.replace(/\/[^/]+$/, `/${size}.webp`);

const response = await fetch(LOOKUP);
if (!response.ok) throw new Error(`Lookup failed: ${response.status}`);
const { results } = await response.json();
const software = results.filter((item) => item.wrapperType === 'software');
if (software.length < MIN_EXPECTED_APPS) {
  throw new Error(`Only ${software.length} apps returned; keeping existing data.`);
}

await mkdir(ICON_DIR, { recursive: true });
await mkdir(SHOT_DIR, { recursive: true });

const apps = [];
for (const item of software) {
  const icon = new URL(`${item.trackId}.webp`, ICON_DIR);
  await download(artwork(item.artworkUrl512, '144x144bb'), icon);

  const screenshots = [];
  for (const [index, url] of (item.screenshotUrls ?? []).slice(0, SCREENSHOTS_PER_APP).entries()) {
    const name = `${item.trackId}-${index + 1}.webp`;
    const target = new URL(name, SHOT_DIR);
    if (!(await exists(target))) await download(artwork(url, '392x0w'), target);
    screenshots.push(`/assets/apps/shots/${name}`);
  }

  apps.push({
    id: item.trackId,
    storeName: item.trackName,
    genre: item.primaryGenreName,
    rating: Math.round((item.averageUserRating ?? 0) * 10) / 10,
    ratingCount: item.userRatingCount ?? 0,
    version: item.version,
    updated: item.currentVersionReleaseDate.slice(0, 10),
    minimumOs: item.minimumOsVersion,
    price: item.price ?? 0,
    url: item.trackViewUrl.split('?')[0],
    icon: `/assets/apps/icons/${item.trackId}.webp`,
    screenshots,
  });
}

apps.sort((a, b) => a.id - b.id);
await writeFile(DATA_FILE, `${JSON.stringify(apps, null, 2)}\n`);
console.log(`Saved ${apps.length} apps.`);
