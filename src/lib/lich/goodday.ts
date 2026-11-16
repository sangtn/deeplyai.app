// "Xem ngày tốt" scoring, after the Lịch Việt app's GoodDayEngine.swift.
// Same structure, weights and rating bands as the app. Where group 1 replaced an app rule with the
// traditional one (12 day gods for hoàng/hắc đạo, Trực by solar-term month, the full taboo set,
// Khổng Minh lục diệu), the score uses the same corrected values the day pages show, so both agree.
// The age part depends only on the day's earthly branch, so pages can apply it in the browser.

import { almanac, type Almanac } from './engine';
import { rate, type Rating } from './goodday-age';

export { RATING_LABEL, ageAdjust, rate, type Rating } from './goodday-age';

export interface Purpose { slug: string; title: string; short: string; keywords: string[]; query: string; vanKhan?: string }

export const PURPOSES: Purpose[] = [
  { slug: 'cuoi-hoi', title: 'Cưới hỏi', short: 'cưới hỏi', query: 'xem ngày cưới', keywords: ['cưới hỏi', 'hôn sự', 'giá thú', 'hôn nhân', 'kết hôn'], vanKhan: 'van-khan-khi-cuoi-ga' },
  { slug: 'khai-truong', title: 'Khai trương', short: 'khai trương', query: 'ngày tốt khai trương', keywords: ['khai trương', 'mở cửa hàng', 'mở cửa hiệu', 'kinh doanh', 'khai thương', 'buôn bán'], vanKhan: 'van-khan-le-khai-truong-cua-hang' },
  { slug: 'dong-tho', title: 'Động thổ, xây dựng', short: 'động thổ', query: 'ngày tốt động thổ', keywords: ['động thổ', 'xây dựng', 'làm nhà', 'tạo ốc', 'đào đất', 'dựng cột', 'xây tường', 'sửa nhà', 'tu sửa'], vanKhan: 'van-khan-le-dong-tho' },
  { slug: 'xuat-hanh', title: 'Xuất hành, đi xa', short: 'xuất hành', query: 'ngày tốt xuất hành', keywords: ['xuất hành', 'đi xa', 'viễn hành', 'đi thuyền', 'xuất hành cầu tài'] },
  { slug: 'nhap-trach', title: 'Nhập trạch, chuyển nhà', short: 'chuyển nhà', query: 'ngày tốt chuyển nhà', keywords: ['dọn nhà', 'nhập trạch', 'di dời', 'về nhà mới', 'chuyển nhà'], vanKhan: 'van-khan-le-nhap-trach' },
  { slug: 'ky-ket', title: 'Ký kết, giao dịch', short: 'ký hợp đồng', query: 'ngày tốt ký hợp đồng', keywords: ['lập khế ước', 'ký hợp đồng', 'giao dịch', 'giao thương', 'họp bàn', 'ký kết'] },
  { slug: 'mua-xe', title: 'Mua xe, tài sản', short: 'mua xe', query: 'ngày tốt mua xe', keywords: ['mua bán', 'giao dịch', 'mua sắm', 'cầu tài', 'nhận việc mới', 'tài chính', 'mua trâu', 'mua súc vật'] },
  { slug: 'an-tang', title: 'An táng, cải mộ', short: 'an táng', query: 'ngày tốt an táng', keywords: ['an táng', 'chôn cất', 'mai táng', 'ma chay', 'tảo mộ', 'mộ phần', 'đặt táng', 'cải táng'], vanKhan: 'le-cai-cat' },
  { slug: 'cat-toc', title: 'Cắt tóc, làm đẹp', short: 'cắt tóc', query: 'ngày tốt cắt tóc', keywords: ['cắt tóc', 'tẩy trừ', 'chữa bệnh', 'làm đẹp', 'tỉa'] },
  { slug: 'cau-tai', title: 'Cầu tài, cúng lễ', short: 'cầu tài', query: 'ngày tốt cầu tài', keywords: ['cầu tài', 'cúng lễ', 'cúng tế', 'lễ bái', 'cầu tự', 'tụng kinh', 'dâng sao'], vanKhan: 'van-khan-than-tai' },
];

export const purposeBySlug = new Map(PURPOSES.map((p) => [p.slug, p]));


export interface DayScore { score: number; rating: Rating; reasons: string[]; warnings: string[] }

const matches = (p: Purpose, items: string[]) => {
  const lowered = items.map((s) => s.toLowerCase());
  return p.keywords.some((k) => lowered.some((s) => s.includes(k)));
};

/** Taboo days that matter for each purpose (all purposes avoid Thọ Tử, Tam Nương, Nguyệt Kỵ, Dương Công). */
const TABOO_FOR: Record<string, { purposes: string[] | 'all'; weight: number }> = {
  'Tam Nương': { purposes: 'all', weight: 3 },
  'Nguyệt Kỵ': { purposes: 'all', weight: 2 },
  'Dương Công Kỵ': { purposes: 'all', weight: 3 },
  'Thọ Tử': { purposes: 'all', weight: 3 },
  'Nguyệt Tận': { purposes: ['cuoi-hoi', 'khai-truong', 'dong-tho', 'nhap-trach', 'ky-ket'], weight: 2 },
  'Sát Chủ Dương': { purposes: ['cuoi-hoi', 'dong-tho', 'nhap-trach'], weight: 3 },
  'Sát Chủ Âm': { purposes: ['an-tang'], weight: 3 },
  'Trùng Tang': { purposes: ['an-tang', 'cuoi-hoi', 'dong-tho'], weight: 3 },
  'Trùng Phục': { purposes: ['an-tang', 'cuoi-hoi'], weight: 2 },
  'Kim Thần Thất Sát': { purposes: ['dong-tho'], weight: 3 },
};

/** Score of a day for a purpose, without the visitor's age. */
export function scoreDay(a: Almanac, p: Purpose): DayScore {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const short = p.title.toLowerCase();

  if (a.hoangDao) { score += 3; reasons.push(`Ngày ${a.than} hoàng đạo`); } else { score -= 3; warnings.push(`Ngày ${a.than} hắc đạo`); }

  if (matches(p, a.truc.nen)) { score += 3; reasons.push(`Trực ${a.truc.name} hợp ${short}`); }
  if (matches(p, a.truc.kieng)) { score -= 4; warnings.push(`Trực ${a.truc.name} kỵ ${short}`); }

  const star = a.sao28.name.replace(/\s*\(.*\)$/, '');
  if (matches(p, a.sao28.nen)) { score += 2; reasons.push(`Sao ${star} tốt cho việc này`); }
  if (matches(p, a.sao28.kieng)) { score -= 3; warnings.push(`Sao ${star} kiêng việc này`); }
  if (a.sao28.kieng.length === 0) score += 1;

  for (const t of a.taboos) {
    const rule = TABOO_FOR[t.name];
    if (rule && (rule.purposes === 'all' || rule.purposes.includes(p.slug))) { score -= rule.weight; warnings.push(`Ngày ${t.name}`); }
  }

  if (p.slug === 'xuat-hanh') {
    if (a.lucDieu.good) { score += 2; reasons.push(`Ngày ${a.lucDieu.name} theo Khổng Minh`); } else { score -= 2; warnings.push(`Ngày ${a.lucDieu.name} theo Khổng Minh`); }
  }

  score = Math.max(-10, Math.min(10, score));
  return { score, rating: rate(score), reasons, warnings };
}

export function scoreAll(a: Almanac) {
  return PURPOSES.map((p) => ({ purpose: p, ...scoreDay(a, p) }));
}

/** Month scan: every day with its score for one purpose. */
export function scanMonth(m: number, y: number, p: Purpose) {
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => {
    const a = almanac(i + 1, m, y);
    return { a, ...scoreDay(a, p) };
  });
}
