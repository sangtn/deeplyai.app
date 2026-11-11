// Builds the optimized images and videos for the Lịch Việt pages
// (/vi/apps/lich-van-nien/ and /apps/lich-van-nien/) from the iOS repo's marketing folder.
//
//   LICH_VIET_MARKETING=/path/to/LichViet/marketing node scripts/lich-viet-media.mjs
//
// Writes AVIF + WebP + JPEG stills, Open Graph images, the zodiac icons and decorative artwork
// to public/assets/apps/lich-viet/, replacing what was there.
// Image sources and licenses: docs/Asset_Licenses.md in the iOS repo.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = process.env.LICH_VIET_MARKETING ?? '/Users/alextran/Desktop/2025/LichViet_V1.2026.1/marketing';
const OUT = new URL('../public/assets/apps/lich-viet/', import.meta.url).pathname;
const SCREENS = join(SRC, 'assets/screens');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'chi'), { recursive: true });

// The countryside photo is the app's own launch background. Every other picture on the page is
// one of the ten approved App Store screenshots below, which carry the current artwork.
const STILLS = {
  countryside: ['assets/lifestyle.jpg', [1400, 900]],
};

const manifest = { stills: {}, shots: [] };

async function still(name, input, widths, background = '#fff') {
  const meta = await sharp(input).metadata();
  for (const w of widths) {
    const h = Math.round((meta.height * w) / meta.width);
    const base = sharp(input).resize(w).flatten({ background });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 76 }).toFile(join(OUT, `${name}-${w}.webp`));
    if (w === widths[0]) {
      await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, `${name}-${w}.jpg`));
      manifest.stills[name] = { width: w, height: h, widths };
    }
  }
}

for (const [name, [file, widths]] of Object.entries(STILLS)) await still(name, join(SRC, file), widths);

// Approved App Store screenshots for version 11.2026.1 (captions: asc-iphone-2027/index.html).
for (let i = 1; i <= 10; i++) {
  const n = String(i).padStart(2, '0');
  await still(`store-${n}`, join(SRC, `asc-iphone-2027/out/iphone-2027-${n}-1320x2868.png`), [720, 560, 392]);
  manifest.shots.push(`store-${n}`);
}

// Open Graph images, one per language, cropped from the family promo banner.
for (const lang of ['vi', 'en']) {
  await sharp(join(SRC, `family-promo/out/${lang}/banner-1920x1080.png`))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, `og-${lang}.jpg`));
}

// Traditional art drawn for the app, and the twelve zodiac icons the app already ships.
copyFileSync(join(SRC, 'assets/art/drum.svg'), join(OUT, 'drum.svg'));
copyFileSync(join(SRC, 'assets/art/lotus.svg'), join(OUT, 'lotus.svg'));
for (const chi of ['Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Tyj', 'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi']) {
  copyFileSync(join(SRC, `assets/chi/${chi}.svg`), join(OUT, `chi/${chi}.svg`));
}

writeFileSync(new URL('../src/data/lich-viet-media.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Saved ${Object.keys(manifest.stills).length} stills.`);
