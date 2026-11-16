// Văn khấn content from the Lịch Việt app (vankhan_structured.json), with slugs and groups.
import data from '../../data/lich/van-khan.json';

export interface Prayer { slug: string; title: string; cat: string; meaning: string; offerings: string; prayer: string }
export const PRAYERS = data as Prayer[];
export const prayerBySlug = new Map(PRAYERS.map((p) => [p.slug, p]));

export const PRAYER_GROUPS = [
  { id: 'le-tet', title: 'Rằm, mùng một và lễ Tết' },
  { id: 'gia-dinh', title: 'Gia đình, nhà cửa, công việc' },
  { id: 'giai-han', title: 'Dâng sao giải hạn' },
  { id: 'gio-tang', title: 'Giỗ chạp và tang lễ' },
  { id: 'den-chua', title: 'Đi đền, đi chùa' },
];

/** Holiday id (rules.ts) → the matching prayer. */
export const HOLIDAY_PRAYER: Record<string, string> = {
  'ong-tao': 'van-khan-ong-tao-ngay-23-thang-chap',
  'giao-thua': 'van-khan-giao-thua-trong-nha',
  'tet-nguyen-dan': 'van-khan-le-ta-nam-moi',
  'nguyen-tieu': 'le-nguyen-tieu-le-thuong-nguyen',
  'han-thuc': 'tet-han-thuc-ngay-mong-3-thang-3',
  'doan-ngo': 'tet-doan-ngo-ngay-mong-5-thang-5',
  'vu-lan': 'tet-trung-nguyen-ngay-ram-thang-7',
  'trung-thu': 'tet-trung-thu-ngay-ram-thang-8',
  'trung-thap': 'tet-ha-nguyen-tet-com-moi',
};
export const RAM_MUNG_MOT = 'van-khan-ngay-mong-mot-va-ngay-ram-hang-thang';
