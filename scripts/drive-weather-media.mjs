// Builds the optimized images and muted loops for /apps/drive-weather/
// from the App Store marketing renders in the iOS repo.
//
//   DRIVE_WEATHER_APPSTORE=/path/to/DriveWeather/AppStore node scripts/drive-weather-media.mjs
//
// Writes AVIF + WebP + JPEG stills, and MP4 (H.264) + WebM (VP9) loops with posters,
// to public/assets/apps/drive-weather/. Needs ffmpeg on PATH; sharp ships with Astro.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = process.env.DRIVE_WEATHER_APPSTORE ?? '/Users/alextran/Desktop/2026/DriveWeather/AppStore';
const OUT = new URL('../public/assets/apps/drive-weather/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const size = (file) => statSync(file).size;
const manifest = { stills: {}, videos: {} };

// Stills ------------------------------------------------------------------
// The 1080x1920 story renders carry a baked headline in their top quarter; the page sets
// its own headings, so each crop keeps only the device.
const DEVICE = { left: 0, top: 462, width: 1080, height: 1218 };
const STILLS = {
  route: ['final/stories/02-route.png', DEVICE, [720, 480]],
  ice: ['final/stories/03-ice.png', DEVICE, [720, 480]],
  later: ['final/stories/04-later.png', DEVICE, [720, 480]],
  radar: ['final/stories/05-radar.png', DEVICE, [720, 480]],
  duo: ['final/stories/09-duo.png', DEVICE, [720, 480]],
};

async function still(name, input, crop, widths) {
  for (const w of widths) {
    const h = Math.round((crop.height * w) / crop.width);
    const base = sharp(input).extract(crop).resize(w).flatten({ background: '#06122b' });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 74 }).toFile(join(OUT, `${name}-${w}.webp`));
    if (w === widths[0]) await base.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(join(OUT, `${name}-${w}.jpg`));
    if (w === widths[0]) manifest.stills[name] = { width: w, height: h, widths };
  }
}

if (!process.env.ONLY || process.env.ONLY === 'stills' || process.env.STILLS_ONLY) {
  for (const [name, [file, crop, widths]] of Object.entries(STILLS)) await still(name, join(SRC, file), crop, widths);
}

// Videos -------------------------------------------------------------------
const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

function encode(name, input, filter, extra = []) {
  const mp4 = join(OUT, `${name}.mp4`);
  const webm = join(OUT, `${name}.webm`);
  ff(...extra, '-i', input, '-vf', filter, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', '30', mp4);
  ff(...extra, '-i', input, '-vf', filter, '-an', '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-r', '30', webm);
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', mp4]);
  const { streams: [s], format } = JSON.parse(probe);
  manifest.videos[name] = { width: s.width, height: s.height, duration: Number(Number(format.duration).toFixed(1)), mp4: size(mp4), webm: size(webm) };
}

async function poster(name, at, tmp) {
  const frame = join(tmp, `${name}.png`);
  ff('-ss', String(at), '-i', join(OUT, `${name}.mp4`), '-frames:v', '1', frame);
  const meta = await sharp(frame).metadata();
  await sharp(frame).avif({ quality: 50, effort: 6 }).toFile(join(OUT, `${name}-poster.avif`));
  await sharp(frame).webp({ quality: 72 }).toFile(join(OUT, `${name}-poster.webp`));
  await sharp(frame).jpeg({ quality: 74, mozjpeg: true }).toFile(join(OUT, `${name}-poster.jpg`));
  manifest.videos[name].poster = { width: meta.width, height: meta.height };
  return frame;
}

// ONLY=stills re-crops the images; ONLY=v13 re-encodes just the 1.3 clips. Either way the
// other entries already in the manifest are kept.
const MANIFEST = new URL('../src/data/drive-weather-media.json', import.meta.url);
const ONLY = process.env.ONLY ?? (process.env.STILLS_ONLY ? 'stills' : '');
if (ONLY && existsSync(MANIFEST)) {
  const prev = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  manifest.stills = { ...prev.stills, ...manifest.stills };
  manifest.videos = prev.videos;
}
const run = (part) => !ONLY || ONLY === part;

const tmp = mkdtempSync(join(tmpdir(), 'dw-media-'));
try {
  if (run('base')) {
    // Hero: the real iPhone app preview (search → route → departure dial).
    encode('phone', join(SRC, 'final/app-preview-iphone-886x1920.mp4'), 'scale=432:-2:flags=lanczos', ['-t', '17']);
    await poster('phone', 9.5, tmp);

    // The 31-second cabin film: clear skies → rain → fog → storm → plan the departure.
    encode('film', join(SRC, 'final-cabin/drive-weather-film-1920x1080.mp4'), 'scale=1280:-2:flags=lanczos');
    await poster('film', 0.6, tmp);

    // Hazards: the square middle of each vertical cabin clip (drops the baked caption).
    const HAZARD = 'crop=1080:1080:0:480,scale=600:600:flags=lanczos';
    for (const [name, clip] of [['snow', '1-snow-ahead'], ['rain', '2-heavy-rain'], ['fog', '3-fog-ahead'], ['storm', '4-storm-building']]) {
      encode(name, join(SRC, `final-cabin/social/${clip}.mp4`), HAZARD, ['-ss', '1', '-t', '9']);
      await poster(name, 4, tmp);
    }

    // iPad app preview.
    encode('ipad', join(SRC, 'final/app-preview-ipad-1200x1600.mp4'), 'scale=600:-2:flags=lanczos', ['-t', '16']);
    await poster('ipad', 8, tmp);

    // Open Graph card from the heavy-rain scene of the film.
    const og = join(tmp, 'og.png');
    ff('-ss', '12.5', '-i', join(SRC, 'final-cabin/drive-weather-film-1920x1080.mp4'), '-frames:v', '1', og);
    await sharp(og).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, 'og.jpg'));
  }

  if (run('v13')) {
    // Version 1.3 set (AppStore/final-v13-film, see its README for provenance).
    const V13 = join(SRC, 'final-v13-film');
    // Rain on the windscreen with real wipers (Mixkit 14452, Mixkit Stock Video Free License): hero backdrop.
    encode('windscreen', join(V13, 'source/v/bg.mp4'), 'scale=960:-2:flags=lanczos,eq=brightness=-0.08:saturation=0.7');
    await poster('windscreen', 1.5, tmp);
    // Dashboard scene: CarPlay screen and iPhone over the rainy road, 21:9, seamless 12 s loop.
    encode('dash', join(V13, 'creative-header-3840x1646.mp4'), 'scale=1600:-2:flags=lanczos');
    await poster('dash', 1.5, tmp);
    // Real CarPlay Simulator captures, one per layout.
    for (const i of [0, 1, 2, 3]) {
      encode(`cp${i}`, join(V13, `source/v/cp${i}.mp4`), 'scale=736:-2:flags=lanczos');
      await poster(`cp${i}`, 1, tmp);
    }
    // iPhone Drive Mode: compact, detailed, minimal.
    for (const i of [0, 1, 2]) {
      encode(`ip${i}`, join(V13, `source/v/ip${i}.mp4`), 'scale=302:-2:flags=lanczos');
      await poster(`ip${i}`, 1.5, tmp);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.videos, null, 2));
