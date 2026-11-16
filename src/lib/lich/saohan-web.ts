// Helpers shared by the sao hạn pages: which văn khấn belongs to each star, and the monthly day to make offerings.
import { PRAYERS } from './vankhan';

const ALIAS: Record<string, string> = { 'Vân Hớn': 'Vân Hán', 'Thủy Diệu': 'Thuỷ Diệu' };

export function starPrayer(sao: string | null) {
  if (!sao) return null;
  const name = ALIAS[sao] ?? sao;
  const p = PRAYERS.find((x) => x.cat === 'giai-han' && x.title.includes(`Sao ${name}`));
  if (!p) return null;
  const day = p.title.match(/Ngày (\d+) hàng tháng/)?.[1];
  return { slug: p.slug, title: p.title, day: day ? Number(day) : null };
}
