import { getCollection } from 'astro:content';
import { GROUP_SLUGS } from '../data/catalog';
import { SURFACES } from '../data/surfaces';

const site = 'https://deeplyai.app';
const STATIC_PAGES = ['/', '/vi/', '/vi/apps/', '/vi/apps/lich-van-nien/', '/vi/apps/car-play-connect/', '/apps/', '/platforms/', '/vi/platforms/', '/about.html', '/services.html', '/solutions.html', '/contact.html', '/privacy.html', '/terms.html', '/cartv-support.html', '/cartv-privacy.html', '/cartv-review.html'];

export async function GET() {
  const entries = await getCollection('apps');
  const paths = [...STATIC_PAGES, ...GROUP_SLUGS.map((g) => `/apps/${g}/`), ...entries.map((e) => `/apps/${e.id}/`), ...SURFACES.map((s) => `/platforms/${s.slug}/`)];
  const urls = paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
