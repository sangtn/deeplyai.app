// Builds the optimized images and short motion videos for /apps/car-play-connect/
// from real Car Connect captures in the iOS repo's marketing folder.
//
//   CAR_CONNECT_MARKETING=/path/to/CarPlayConnectSync/marketing node scripts/car-connect-media.mjs
//
// Writes AVIF + WebP + JPEG stills, and MP4 (H.264) + WebM (VP9) loops with posters,
// to public/assets/apps/car-connect/. Needs ffmpeg on PATH; sharp ships with Astro.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = process.env.CAR_CONNECT_MARKETING ?? '/Users/alextran/Desktop/2025/CarPlayConnectSync/marketing';
const OUT = new URL('../public/assets/apps/car-connect/', import.meta.url).pathname;
const SCREENS = join(SRC, 'assets/screens');
const CLIPS = join(SRC, 'assets/clips/iphone');
mkdirSync(OUT, { recursive: true });

// name: [source, widths]. The largest width is the <img> fallback; sizes are recorded in media.json.
const STILLS = {
  // Driving Mode, landscape
  'dm-map': ['dm2-map.png', [1280, 720]],
  'dm-radio': ['dm2-radio.png', [1280, 720]],
  'dm-music': ['dm2-music.png', [1280, 720]],
  'dm-phone': ['dm2-phone.png', [1280, 720]],
  'dm-dashcam': ['dm2-dashcam-road.png', [1280, 720]],
  'dm-custom': ['dm2-custom6.png', [1280, 720]],
  'dm-nav': ['dm2-nav.png', [1280, 720]],
  'dm-hud': ['dm2-hud.png', [1280, 720]],
  // iPhone, portrait
  home: ['iphone-home.png', [600, 400]],
  history: ['iphone-history.png', [600, 400]],
  'radio-list': ['iphone-radio.png', [600, 400]],
  'radio-player': ['iphone-radio-play.png', [600, 400]],
  nearby: ['iphone-nearby-sf.png', [600, 400]],
  weather: ['iphone-tripweather.png', [600, 400]],
  garage: ['iphone-garage-detail.png', [600, 400]],
  // Other devices
  'ipad-dm': ['ipad-dm2-map.png', [1200, 720]],
  'duo-home': ['duo-home.png', [600, 400]],
};

const size = (file) => statSync(file).size;
const manifest = { stills: {}, shots: [], videos: {} };

async function still(name, input, widths) {
  const meta = await sharp(input).metadata();
  for (const w of widths) {
    const h = Math.round((meta.height * w) / meta.width);
    const base = sharp(input).resize(w).flatten({ background: '#000' });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 74 }).toFile(join(OUT, `${name}-${w}.webp`));
    if (w === widths[0]) await base.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(join(OUT, `${name}-${w}.jpg`));
    if (w === widths[0]) manifest.stills[name] = { width: w, height: h, widths };
  }
}

for (const [name, [file, widths]] of Object.entries(STILLS)) await still(name, join(SCREENS, file), widths);

// Official App Store screenshots 02–10 (01 carries a headline we no longer use).
for (let i = 2; i <= 10; i++) {
  const n = String(i).padStart(2, '0');
  await still(`store-${n}`, join(SRC, `asc-final/iphone/${n}.jpg`), [560, 392]);
  manifest.shots.push(`store-${n}`);
}

// Videos -------------------------------------------------------------------
const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

function encode(name, input, filter) {
  const mp4 = join(OUT, `${name}.mp4`);
  const webm = join(OUT, `${name}.webm`);
  ff('-i', input, '-vf', filter, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', '30', mp4);
  ff('-i', input, '-vf', filter, '-an', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-r', '30', webm);
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', mp4]);
  const { streams: [s], format } = JSON.parse(probe);
  manifest.videos[name] = { width: s.width, height: s.height, duration: Number(Number(format.duration).toFixed(1)), mp4: size(mp4), webm: size(webm) };
}

async function poster(name, frameSource) {
  const meta = await sharp(frameSource).metadata();
  await sharp(frameSource).avif({ quality: 50, effort: 6 }).toFile(join(OUT, `${name}-poster.avif`));
  await sharp(frameSource).webp({ quality: 72 }).toFile(join(OUT, `${name}-poster.webp`));
  await sharp(frameSource).jpeg({ quality: 74, mozjpeg: true }).toFile(join(OUT, `${name}-poster.jpg`));
  manifest.videos[name].poster = { width: meta.width, height: meta.height };
}

const tmp = mkdtempSync(join(tmpdir(), 'cc-media-'));
try {
  // 1. Driving Mode tour: real Driving Mode captures, crossfaded, landscape.
  const tour = ['dm2-map', 'dm2-radio', 'dm2-music', 'dm2-phone', 'dm2-dashcam-road', 'dm2-custom6', 'dm2-nav', 'dm2-hud'];
  const W = 1280, H = 590, HOLD = 2.6, FADE = 0.5;
  const inputs = tour.flatMap((f) => ['-loop', '1', '-t', String(HOLD), '-i', join(SCREENS, `${f}.png`)]);
  const scaled = tour.map((_, i) => `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p[v${i}]`);
  let chain = '';
  let last = 'v0';
  tour.slice(1).forEach((_, k) => {
    const i = k + 1;
    const offset = (HOLD - FADE) * i;
    chain += `;[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[x${i}]`;
    last = `x${i}`;
  });
  const raw = join(tmp, 'tour.mp4');
  ff(...inputs, '-filter_complex', scaled.join(';') + chain, '-map', `[${last}]`, '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', raw);
  encode('drive-tour', raw, 'null');
  const tourFrame = join(tmp, 'tour.png');
  ff('-i', raw, '-frames:v', '1', tourFrame);
  await poster('drive-tour', tourFrame);

  // 2–4. Real screen recordings (portrait iPhone).
  const PORTRAIT = 'scale=480:-2:flags=lanczos';
  for (const [name, clip] of [['speed', 'speed.mp4'], ['weather', 'weather.mp4'], ['nearby', 'nearby.mp4']]) {
    encode(name, join(CLIPS, clip), PORTRAIT);
    const frame = join(tmp, `${name}.png`);
    ff('-ss', '0.2', '-i', join(OUT, `${name}.mp4`), '-frames:v', '1', frame);
    await poster(name, frame);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

writeFileSync(new URL('../src/data/car-connect-media.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.videos, null, 2));
