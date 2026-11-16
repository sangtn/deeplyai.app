// URL scheme and page ranges for the Lịch âm section.
// URLs mirror how people search ("lịch âm ngày 16/11/2026", "lịch âm tháng 11 2026").
// Day pages start at a fixed year so a published URL never disappears; the end moves forward
// with each yearly build.

export const BASE = '/vi/lich-am/';
export const YEAR_FROM = 1900;
export const YEAR_TO = 2100;
export const DAY_FROM = 2020;
export const DAY_TO = new Date().getFullYear() + 5;

const p2 = (n: number) => String(n).padStart(2, '0');

export const dayUrl = (d: number, m: number, y: number) => `${BASE}ngay-${p2(d)}-${p2(m)}-${y}/`;
export const monthUrl = (m: number, y: number) => `${BASE}thang-${p2(m)}-${y}/`;
export const yearUrl = (y: number) => `${BASE}nam-${y}/`;
export const CONVERT_URL = `${BASE}doi-ngay-am-duong/`;
export const COUNT_URL = `${BASE}dem-ngay/`;
export const GOOD_URL = `${BASE}xem-ngay-tot/`;
export const goodPurposeUrl = (slug: string) => `${GOOD_URL}${slug}/`;
export const goodMonthUrl = (slug: string, m: number, y: number) => `${GOOD_URL}${slug}/thang-${p2(m)}-${y}/`;
export const VAN_KHAN_URL = `${BASE}van-khan/`;
export const vanKhanUrl = (slug: string) => `${VAN_KHAN_URL}${slug}/`;

// Culture section
export const CHI_SLUGS = ['ty', 'suu', 'dan', 'mao', 'thin', 'ti', 'ngo', 'mui', 'than', 'dau', 'tuat', 'hoi'];
export const CULTURE_URL = `${BASE}van-hoa/`;
export const SAO_HAN_URL = `${BASE}sao-han/`;
export const SAO_HAN_FROM = 2025;
export const SAO_HAN_TO = new Date().getFullYear() + 2;
export const SAO_HAN_BIRTH_FROM = 1930;
export const saoHanYearUrl = (y: number) => `${SAO_HAN_URL}nam-${y}/`;
export const saoHanUrl = (y: number, birth: number) => `${SAO_HAN_URL}nam-${y}/tuoi-${birth}/`;
export const tuViYearUrl = (y: number) => `${BASE}tu-vi-${y}/`;
export const tuViChiUrl = (y: number, chi: number) => `${tuViYearUrl(y)}tuoi-${CHI_SLUGS[chi]}/`;
export const xongDatUrl = (y: number) => `${BASE}xong-dat-${y}/`;
export const xongDatChiUrl = (y: number, chi: number) => `${xongDatUrl(y)}tuoi-${CHI_SLUGS[chi]}/`;
export const LE_HOI_URL = `${BASE}le-hoi/`;
export const leHoiUrl = (slug: string) => `${LE_HOI_URL}${slug}/`;
export const LOI_CHUC_URL = `${BASE}loi-chuc-tet/`;
export const loiChucUrl = (slug: string) => `${LOI_CHUC_URL}${slug}/`;
export const THAN_SO_URL = `${BASE}than-so-hoc/`;
export const BOI_SIM_URL = `${BASE}boi-so-dien-thoai/`;
export const TU_VI_NGAY_URL = `${BASE}tu-vi-hom-nay/`;

// Personal tools (data stays in the visitor's browser)
export const TOOLS_URL = `${BASE}tien-ich/`;
export const EVENTS_URL = `${TOOLS_URL}ngay-gio/`;
export const FINANCE_URL = `${TOOLS_URL}thu-chi/`;
export const NOTES_URL = `${TOOLS_URL}ghi-chu/`;
export const PREGNANCY_URL = `${TOOLS_URL}thai-ky/`;
export const VACCINE_URL = `${TOOLS_URL}lich-tiem-chung/`;
export const SHIFT_URL = `${TOOLS_URL}lich-ca/`;
export const FEEDS_URL = `${TOOLS_URL}lich-am-google-calendar/`;

// Services
export const WEATHER_URL = `${BASE}thoi-tiet/`;
export const weatherUrl = (slug: string) => `${WEATHER_URL}${slug}/`;
export const FX_URL = `${BASE}ty-gia/`;
export const PUSH_URL = `${TOOLS_URL}thong-bao/`;
export const ICLOUD_URL = `${TOOLS_URL}icloud/`;

export const hasDayPage = (y: number) => y >= DAY_FROM && y <= DAY_TO;
export const hasMonthPage = (y: number) => y >= YEAR_FROM && y <= YEAR_TO;

const ASSETS = '/assets/apps/lich-viet/';
const CHI_FILES = ['Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Tyj', 'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi'];
/** The app's zodiac icon for an earthly branch index (0 = Tý). */
export const chiIcon = (chi: number) => `${ASSETS}chi/${CHI_FILES[chi]}.svg`;
/** The app's illustration for a solar term, by its name ("Lập đông" → lap-dong.webp). */
export const termImage = (name: string) => `${ASSETS}tiet-khi/${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, '-')}.webp`;
export const directionIcon = (key: 'hy' | 'tai' | 'hac') => `${ASSETS}huong/${key}-than.svg`;

/** "16/11/2026" */
export const dmy = (d: number, m: number, y: number) => `${p2(d)}/${p2(m)}/${y}`;
