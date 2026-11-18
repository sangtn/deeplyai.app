// Builds the optimized images and muted loops for /apps/carwidget/ from the marketing
// folder of the iOS repo (Car Widget Studio).
//
//   CARWIDGET_MARKETING=/path/to/CarPlayWidgets/marketing node scripts/carwidget-media.mjs
//   ONLY=film node scripts/carwidget-media.mjs        # re-encode one part, keep the rest
//
// Parts: film, phone, rotation, tiles, seasons, stills. Writes AVIF + WebP + JPEG stills
// and MP4 (H.264) + WebM (VP9) loops with posters to public/assets/apps/carwidget/,
// and the manifest to src/data/carwidget-media.json. Needs ffmpeg; sharp ships with Astro.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = process.env.CARWIDGET_MARKETING ?? '/Users/alextran/Desktop/2025/CarPlayWidgets/marketing';
// The in-car film: the final ASC header (V4, daytime mockup) with the app's real CarPlay
// widgets on the car's screen. Its music track is dropped; the page plays it muted.
const FILM = process.env.FILM ?? join(SRC, 'Final/Header-Search/V4_Mockup-daytime/header-3840x1646-15s-asc-music.mp4');
const OUT = new URL('../public/assets/apps/carwidget/', import.meta.url).pathname;
const MANIFEST = new URL('../src/data/carwidget-media.json', import.meta.url);
mkdirSync(OUT, { recursive: true });

const ONLY = process.env.ONLY ?? '';
const run = (part) => !ONLY || ONLY === part;
const manifest = { stills: {}, videos: {}, tiles: [], seasons: {} };
if (ONLY && existsSync(MANIFEST)) Object.assign(manifest, JSON.parse(readFileSync(MANIFEST, 'utf8')));

const size = (file) => statSync(file).size;
const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

// Stills ------------------------------------------------------------------------
async function still(name, input, crop, widths, bg = '#0b0b14') {
  for (const w of widths) {
    let img = sharp(input);
    if (crop) img = img.extract(crop);
    const base = img.resize(w).flatten({ background: bg });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 76 }).toFile(join(OUT, `${name}-${w}.webp`));
    if (w === widths[0]) {
      await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, `${name}-${w}.jpg`));
      const meta = await sharp(join(OUT, `${name}-${w}.jpg`)).metadata();
      manifest.stills[name] = { width: meta.width, height: meta.height, widths };
    }
  }
}

// Videos ------------------------------------------------------------------------
function encode(name, input, filter, { pre = [], crf = [28, 40], webm = true } = {}) {
  const mp4 = join(OUT, `${name}.mp4`);
  ff(...pre, '-i', input, '-vf', filter, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf[0]), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', '30', mp4);
  if (webm) ff(...pre, '-i', input, '-vf', filter, '-an', '-c:v', 'libvpx-vp9', '-crf', String(crf[1]), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-r', '30', join(OUT, `${name}.webm`));
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', mp4]);
  const { streams: [s], format } = JSON.parse(probe);
  manifest.videos[name] = { width: s.width, height: s.height, duration: Number(Number(format.duration).toFixed(1)), mp4: size(mp4), ...(webm && { webm: size(join(OUT, `${name}.webm`)) }) };
}

async function poster(name, at, tmp) {
  const frame = join(tmp, `${name}.png`);
  ff('-ss', String(at), '-i', join(OUT, `${name}.mp4`), '-frames:v', '1', frame);
  const meta = await sharp(frame).metadata();
  await sharp(frame).avif({ quality: 50, effort: 6 }).toFile(join(OUT, `${name}-poster.avif`));
  await sharp(frame).webp({ quality: 74 }).toFile(join(OUT, `${name}-poster.webp`));
  await sharp(frame).jpeg({ quality: 76, mozjpeg: true }).toFile(join(OUT, `${name}-poster.jpg`));
  manifest.videos[name].poster = { width: meta.width, height: meta.height };
  return frame;
}

// Real animated templates, recorded from the app (assets/clips, 558×558). Grouped the way
// the page tabs them; no car-maker names or logos.
const TILES = {
  racing: ['auto_tacho_clock', 'auto_neon_tuner', 'auto_touge_night', 'auto_boost_gauge', 'auto_concept_hud', 'neo_hyper_gauge'],
  aesthetic: ['neo_y2k_chrome', 'neo_pixel_sunset', 'neo_bento_day', 'neo_dreamcore', 'neo_vapor_weather', 'glass_weather'],
  cute: ['cute_bubble_kitty', 'cute_strawberry_milk', 'cute_teddy_cafe', 'cute_sparkle_princess', 'cute_bunny_hop', 'cute_cotton_candy'],
  animals: ['pet_autumn_fox', 'pet_panda_bamboo', 'pet_puppy_wag', 'pet_sleepy_cat', 'pet_penguin_slide', 'pet_goldfish_bowl'],
  neon: ['neon_cityscape_race', 'neon_pink_pulse', 'purple_plasma', 'electric_storm_cards', 'clock_face_neon', 'neo_night_drift'],
  love: ['love_heartbeat_timer', 'love_meter_animated', 'love_floating_hearts', 'neo_love_letter', 'neo_cupid_glow', 'neo_heartbeat'],
};

// Holiday collections (version 11.2026.1): the five real widget renders of each, plus the
// in-car promo film from inapp-events (illustrated cabin, real widgets).
const SEASONS = {
  thanksgiving: { promo: 'inapp-events/out/thanksgiving/20261118-1248/promo-1920x1080.mp4', widgets: ['thanksgiving_countdown', 'thanksgiving_maple_drive', 'thanksgiving_grateful_calendar', 'thanksgiving_harvest_moon', 'thanksgiving_cozy_cocoa'] },
  christmas: { promo: 'inapp-events/out/christmas/20261118-1113/promo-1920x1080.mp4', widgets: ['christmas_countdown', 'christmas_snowy_drive', 'christmas_advent_calendar', 'christmas_fireplace', 'christmas_twinkle_tree'] },
  newyear: { promo: 'inapp-events/out/newyear/20261118-1151/promo-1920x1080.mp4', widgets: ['newyear_countdown', 'newyear_fireworks', 'newyear_year_progress', 'newyear_champagne', 'newyear_fresh_start'] },
  lunar: { promo: 'inapp-events/out/lunar/20261118-1221/promo-1920x1080.mp4', widgets: ['lunar_countdown', 'lunar_zodiac', 'lunar_lantern_night', 'lunar_blossom_calendar', 'lunar_lucky_envelope'] },
};

const tmp = mkdtempSync(join(tmpdir(), 'cw-media-'));
try {
  if (run('film')) {
    // Daytime drive with Widget Rotation on the car's CarPlay screen, 21:9.
    encode('drive', FILM, 'scale=1600:-2:flags=lanczos', { crf: [27, 38] });
    await poster('drive', 0.5, tmp);
    // Open Graph card: the widget wall on the car screen.
    const og = join(tmp, 'og.png');
    ff('-ss', '10', '-i', FILM, '-frames:v', '1', og);
    await sharp(og).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, 'og.jpg'));
  }

  if (run('phone')) {
    // Screen recording of the Widgets tab (real app, iOS 26 simulator).
    encode('library', join(SRC, 'assets/recordings/widgets-tab.mp4'), 'scale=390:-2:flags=lanczos');
    await poster('library', 0.4, tmp);
  }

  if (run('rotation')) {
    // New Rotation: pick designs, preview sped up, order / shuffle, then Home.
    const joined = join(tmp, 'rotation.mp4');
    ff('-i', join(SRC, 'assets/recordings/rotation-a.mp4'), '-i', join(SRC, 'assets/recordings/rotation-b.mp4'),
      '-filter_complex', '[0:v]setsar=1,fps=30[a];[1:v]setsar=1,fps=30[b];[a][b]concat=n=2:v=1[v]', '-map', '[v]', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', joined);
    encode('rotation', joined, 'scale=390:-2:flags=lanczos');
    await poster('rotation', 7.2, tmp);
  }

  if (run('tiles')) {
    manifest.tiles = [];
    for (const [group, ids] of Object.entries(TILES)) {
      for (const id of ids) {
        const name = `t-${id.replaceAll('_', '-')}`;
        encode(name, join(SRC, `assets/clips/${id}.mp4`), 'scale=288:288:flags=lanczos', { crf: [26, 36], webm: false });
        await poster(name, 2, tmp);
        manifest.tiles.push({ name, group });
      }
    }
  }

  if (run('seasons')) {
    for (const [key, { promo, widgets }] of Object.entries(SEASONS)) {
      encode(`s-${key}`, join(SRC, promo), 'scale=960:-2:flags=lanczos', { pre: ['-t', '16'], crf: [30, 0], webm: false });
      await poster(`s-${key}`, 6, tmp);
      manifest.seasons[key] = widgets.map((w) => `w-${w.replaceAll('_', '-')}`);
      for (const w of widgets) await still(`w-${w.replaceAll('_', '-')}`, join(SRC, `inapp-events/widgets/${w}.png`), null, [240]);
    }
  }

  if (run('stills')) {
    // iPad renders from the Duo set, without the baked headline (top 640 px).
    const DUO = { left: 0, top: 640, width: 2007, height: 2213 };
    await still('editor', join(SRC, 'asc-duo-lifestyle/out/05.png'), DUO, [720, 1080]);
    await still('screens', join(SRC, 'asc-duo-lifestyle/out/08.png'), DUO, [720, 1080]);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.videos, null, 2));
