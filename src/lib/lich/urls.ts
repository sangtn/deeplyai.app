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
