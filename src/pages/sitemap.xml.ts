import { getCollection } from 'astro:content';
import { GROUP_SLUGS } from '../data/catalog';
import { SURFACES } from '../data/surfaces';
import { BASE, CONVERT_URL, COUNT_URL, DAY_FROM, DAY_TO, GOOD_URL, VAN_KHAN_URL, YEAR_FROM, YEAR_TO, dayUrl, goodMonthUrl, goodPurposeUrl, monthUrl, vanKhanUrl, yearUrl } from '../lib/lich/urls';
import { PURPOSES } from '../lib/lich/goodday';
import { PRAYERS } from '../lib/lich/vankhan';
import { BOI_SIM_URL, CHI_SLUGS, CULTURE_URL, LE_HOI_URL, LOI_CHUC_URL, SAO_HAN_BIRTH_FROM, SAO_HAN_FROM, SAO_HAN_TO, SAO_HAN_URL, THAN_SO_URL, TU_VI_NGAY_URL, loiChucUrl, saoHanUrl, saoHanYearUrl, tuViChiUrl, tuViYearUrl, xongDatChiUrl, xongDatUrl } from '../lib/lich/urls';
import { YEARLY_YEAR } from '../lib/lich/tuvi';
import { XONG_DAT_APP_YEAR } from '../lib/lich/xongdat';
import greetings from '../data/lich/loi-chuc-tet.json';
import { PLACES } from '../lib/lich/weather';
import { CLOUDKIT_TOKEN, LICH_API } from '../lib/lich/config';
import { ICLOUD_URL, PUSH_URL, FX_URL, WEATHER_URL, weatherUrl, EVENTS_URL, FEEDS_URL, FINANCE_URL, NOTES_URL, PREGNANCY_URL, SHIFT_URL, TOOLS_URL, VACCINE_URL } from '../lib/lich/urls';

function culturePaths() {
  const out = [...(LICH_API ? [PUSH_URL] : []), ...(CLOUDKIT_TOKEN ? [ICLOUD_URL] : []), FX_URL, WEATHER_URL, ...PLACES.map((p) => weatherUrl(p.slug)), TOOLS_URL, EVENTS_URL, FEEDS_URL, FINANCE_URL, NOTES_URL, PREGNANCY_URL, VACCINE_URL, SHIFT_URL, CULTURE_URL, SAO_HAN_URL, LE_HOI_URL, LOI_CHUC_URL, THAN_SO_URL, BOI_SIM_URL, TU_VI_NGAY_URL, tuViYearUrl(YEARLY_YEAR), xongDatUrl(XONG_DAT_APP_YEAR)];
  out.push(...greetings.categories.map((c) => loiChucUrl(c.slug)));
  CHI_SLUGS.forEach((_, i) => out.push(tuViChiUrl(YEARLY_YEAR, i), xongDatChiUrl(XONG_DAT_APP_YEAR, i)));
  for (let y = SAO_HAN_FROM; y <= SAO_HAN_TO; y += 1) {
    out.push(saoHanYearUrl(y));
    for (let b = SAO_HAN_BIRTH_FROM; b <= y - 9; b += 1) out.push(saoHanUrl(y, b));
  }
  return out;
}
import { daysInMonth } from '../lib/lich/engine';

// Lịch âm: hub, tools, every year and month page, and the day pages in range.
function lichPaths() {
  const out = [BASE, CONVERT_URL, COUNT_URL, GOOD_URL, VAN_KHAN_URL, ...PRAYERS.map((p) => vanKhanUrl(p.slug))];
  for (const p of PURPOSES) {
    out.push(goodPurposeUrl(p.slug));
    for (let y = DAY_FROM; y <= DAY_TO; y += 1) for (let m = 1; m <= 12; m += 1) out.push(goodMonthUrl(p.slug, m, y));
  }
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
const STATIC_PAGES = ['/', '/vi/', '/vi/apps/', '/vi/apps/lich-van-nien/', '/vi/apps/car-play-connect/', '/apps/', '/platforms/', '/vi/platforms/', '/about.html', '/services.html', '/solutions.html', '/contact.html', '/privacy.html', '/terms.html', '/cartv-support.html', '/cartv-privacy.html', '/cartv-review.html', '/cartv-faq.html', '/cartv-faq.tr.html', '/cartv-faq.pt-BR.html', '/cartv-faq.es.html', '/cartv-faq.de.html', '/cartv-faq.ar.html', '/cartv-carplay-video.html', '/cartv-carplay-video.tr.html', '/cartv-carplay-video.pt-BR.html', '/cartv-carplay-video.es.html', '/cartv-carplay-video.de.html', '/cartv-carplay-video.ar.html', '/cartv-guide.html', '/cartv-guide.es.html', '/cartv-guide.pt-BR.html', '/cartv-guide.de.html', '/cartv-guide.fr.html', '/cartv-guide.it.html', '/cartv-guide.tr.html', '/cartv-guide.ar.html', '/cartv-guide.zh-Hans.html', '/cartv-guide.ja.html', '/cartv-guide.ko.html', '/cartv-guide.vi.html'];

export async function GET() {
  const entries = await getCollection('apps');
  const paths = [...STATIC_PAGES, ...GROUP_SLUGS.map((g) => `/apps/${g}/`), ...entries.map((e) => `/apps/${e.id}/`), ...SURFACES.map((s) => `/platforms/${s.slug}/`), ...lichPaths(), ...culturePaths()];
  const urls = paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
