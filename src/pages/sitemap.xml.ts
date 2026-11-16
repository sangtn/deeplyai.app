import { getCollection } from 'astro:content';
import { GROUP_SLUGS } from '../data/catalog';
import { SURFACES } from '../data/surfaces';
import { BASE, CONVERT_URL, COUNT_URL, DAY_FROM, DAY_TO, YEAR_FROM, YEAR_TO, dayUrl, monthUrl, yearUrl } from '../lib/lich/urls';
import { daysInMonth } from '../lib/lich/engine';

// Lịch âm: hub, tools, every year and month page, and the day pages in range.
function lichPaths() {
  const out = [BASE, CONVERT_URL, COUNT_URL];
  for (let y = YEAR_FROM; y <= YEAR_TO; y += 1) {
    out.push(yearUrl(y));
    for (let m = 1; m <= 12; m += 1) {
      out.push(monthUrl(m, y));
      if (y >= DAY_FROM && y <= DAY_TO) for (let d = 1; d <= daysInMonth(m, y); d += 1) out.push(dayUrl(d, m, y));
    }
  }
  return out;
}

const site = 'https://deeplyai.app';
const STATIC_PAGES = ['/', '/vi/', '/vi/apps/', '/vi/apps/lich-van-nien/', '/vi/apps/car-play-connect/', '/apps/', '/platforms/', '/vi/platforms/', '/about.html', '/services.html', '/solutions.html', '/contact.html', '/privacy.html', '/terms.html', '/cartv-support.html', '/cartv-privacy.html', '/cartv-review.html'];

export async function GET() {
  const entries = await getCollection('apps');
  const paths = [...STATIC_PAGES, ...GROUP_SLUGS.map((g) => `/apps/${g}/`), ...entries.map((e) => `/apps/${e.id}/`), ...SURFACES.map((s) => `/platforms/${s.slug}/`), ...lichPaths()];
  const urls = paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
