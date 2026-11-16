// Full day almanac for the Lịch âm web pages. Runs at build time.
// The lunar conversion, can chi, giờ hoàng đạo, Ngọc hạp stars, nạp âm, travel directions and
// daily quote reproduce the Lịch Việt app exactly (checked against the app's own engine for
// every day 1900–2100). See docs/lich-viet-web-features.md.

import data from '../../data/lich/app-data.json';
import { CAN, CHI, LUNAR_MONTHS, SOLAR_TERMS, fromJd, jdFromDate, lunarToSolar, solarToLunar, sunLongitude, type LunarDate } from '../../components/lich-viet/lunar';
import { moonInfo, sunTimes, type MoonInfo, type SunTimes } from './astro';
import {
  BANH_TO_CAN, BANH_TO_CHI, CITIES, DAYS_OFF, DUONG_CONG, HOLIDAYS, HOUR_RANGES, KIM_THAN_THAT_SAT, LUC_DIEU, LY_THUAN_PHONG,
  NGUYET_KY, SAT_CHU_AM, SAT_CHU_DUONG, TABOO_TEXT, TAM_NUONG, THAN, THO_TU, TRUC, TRUNG_PHUC, TRUNG_TANG, type HolidayDef,
} from './rules';

export { CAN, CHI, LUNAR_MONTHS, SOLAR_TERMS, lunarToSolar, solarToLunar };

export const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const PI = Math.PI;

export const canChi = (index60: number) => `${CAN[index60 % 10]} ${CHI[index60 % 12]}`;
/** Sexagenary index of a day (0 = Giáp Tý). */
export const dayIndex60 = (jd: number) => (jd + 49) % 60;

export function lunarMonthName(month: number, leap = false) {
  return LUNAR_MONTHS[month - 1] + (leap ? ' (nhuận)' : '');
}

/** Short lunar date such as "8/10" or "1/4 nhuận". */
export const lunarShort = (l: LunarDate) => `${l.day}/${l.month}${l.leap ? ' nhuận' : ''}`;

// ---- Solar terms (tiết khí) ----

/** Solar term in force at the end of the given day (Vietnam time), 0 = Xuân phân. */
export function termAt(jd: number) {
  const lon = sunLongitude(jd + 0.5 - 7 / 24);
  return Math.floor((lon / PI) * 12) % 24;
}

export interface SolarTerm { name: string; index: number; start: { day: number; month: number; year: number }; next: { name: string; day: number; month: number; year: number } }

export function solarTerm(jd: number): SolarTerm {
  const index = termAt(jd);
  let s = jd;
  while (termAt(s - 1) === index) s -= 1;
  let e = jd + 1;
  while (termAt(e) === index) e += 1;
  const nextIndex = (index + 1) % 24;
  return { name: SOLAR_TERMS[index], index, start: fromJd(s), next: { name: SOLAR_TERMS[nextIndex], ...fromJd(e) } };
}

/** Chi index of the solar-term month (tháng tiết khí). Dần month starts at Lập Xuân. */
const termMonthChi = (termIndex: number) => (Math.floor(((termIndex - 21 + 24) % 24) / 2) + 2) % 12;

// ---- Holidays ----

export interface HolidayHit { title: string; note: string; lunar: boolean; id: string }

const holidayCache = new Map<number, Map<number, HolidayHit[]>>();

/** All holidays in a Gregorian year, keyed by Julian day. */
export function holidaysOfYear(year: number) {
  const hit = holidayCache.get(year);
  if (hit) return hit;
  const map = new Map<number, HolidayHit[]>();
  const add = (jd: number, h: HolidayDef, suffix = '') => {
    const s = fromJd(jd);
    if (s.year !== year) return;
    const list = map.get(jd) ?? [];
    list.push({ id: h.id, title: h.title + suffix, note: h.note, lunar: h.lunar });
    map.set(jd, list);
  };
  for (const h of HOLIDAYS) {
    for (const ly of [year - 1, year]) {
      if (!h.lunar && ly !== year) continue;
      let start: number | null = null;
      if (h.id === 'giao-thua') {
        // The last day of lunar month 12, whether it has 29 or 30 days.
        const tet = lunarToSolar(1, 1, ly + 1);
        if (tet) start = jdFromDate(tet.day, tet.month, tet.year) - 1;
      } else if (h.lunar) {
        const s = lunarToSolar(h.day, h.month, ly);
        if (s) start = jdFromDate(s.day, s.month, s.year);
      } else {
        start = jdFromDate(h.day, h.month, year);
      }
      if (start === null) continue;
      const span = h.days ?? 1;
      for (let i = 0; i < span; i += 1) add(start + i, h, span > 1 && h.id === 'tet-nguyen-dan' ? ` (mùng ${i + 1})` : '');
    }
  }
  holidayCache.set(year, map);
  return map;
}

export const holidaysOn = (d: number, m: number, y: number) => holidaysOfYear(y).get(jdFromDate(d, m, y)) ?? [];

export function dayOff(d: number, m: number, y: number) {
  const n = y * 10000 + m * 100 + d;
  const e = DAYS_OFF.find((x) => n >= x.start[2] * 10000 + x.start[1] * 100 + x.start[0] && n <= x.end[2] * 10000 + x.end[1] * 100 + x.end[0]);
  return e ? { label: e.label, confirmed: e.confirmed } : null;
}

// ---- Lunar month helpers ----

/** Number of days (29 or 30) in the lunar month containing this lunar date. */
export function lunarMonthLength(l: LunarDate) {
  const next = fromJd(l.jd - l.day + 30);
  return solarToLunar(next.day, next.month, next.year).day === 1 ? 29 : 30;
}

/** Leap month (1–12) of a lunar year, or 0. */
export function leapMonthOf(lunarYear: number) {
  for (let m = 1; m <= 12; m += 1) if (lunarToSolar(1, m, lunarYear, true)) return m;
  return 0;
}

// ---- Light day info used by month grids ----

export interface DayLite {
  day: number; month: number; year: number; jd: number; weekday: number;
  lunar: LunarDate; index60: number; canChi: string;
  hoangDao: boolean; than: string;
  holidays: HolidayHit[]; off: ReturnType<typeof dayOff>;
}

export function dayLite(d: number, m: number, y: number): DayLite {
  const lunar = solarToLunar(d, m, y);
  const jd = lunar.jd;
  const index60 = dayIndex60(jd);
  const chi = index60 % 12;
  const than = (chi - ((lunar.month - 1) % 6) * 2 + 12) % 12;
  return {
    day: d, month: m, year: y, jd, weekday: (jd + 1) % 7, lunar, index60, canChi: canChi(index60),
    hoangDao: THAN[than].good, than: THAN[than].name, holidays: holidaysOn(d, m, y), off: dayOff(d, m, y),
  };
}

// ---- Full almanac ----

export interface Taboo { name: string; text: string }
export interface Hour { chi: string; range: string; canChi: string; than: string; good: boolean; ltp: { name: string; good: boolean; text: string } }

export interface Almanac extends DayLite {
  monthCanChi: string; yearCanChi: string; monthLength: number;
  term: SolarTerm;
  hours: Hour[];
  napAm: string[]; hanh: string; tuoiXung: string;
  truc: (typeof TRUC)[number];
  sao28: { name: string; nen: string[]; kieng: string[]; ngoaiLe: string; tho: string };
  goodStars: { n: string; h: string; d: string }[];
  badStars: { n: string; h: string; d: string }[];
  taboos: Taboo[];
  banhTo: { can: readonly [string, string]; chi: readonly [string, string] };
  lucDieu: (typeof LUC_DIEU)[number];
  directions: { hy: string; tai: string; hac: string };
  quote: string;
  sun: { city: string; times: SunTimes | null }[];
  moon: MoonInfo;
  tet: { days: number; date: { day: number; month: number; year: number }; name: string };
}

export function almanac(d: number, m: number, y: number): Almanac {
  const lite = dayLite(d, m, y);
  const { lunar, jd, index60 } = lite;
  const can = index60 % 10;
  const chi = index60 % 12;
  const lm = lunar.month;

  const term = solarTerm(jd);
  const truc = TRUC[(chi - termMonthChi(term.index) + 12) % 12];

  const hourStart = (8 + (chi % 6) * 2) % 12;
  const hours: Hour[] = CHI.map((name, h) => {
    const than = THAN[(h - hourStart + 12) % 12];
    const ltp = LY_THUAN_PHONG[(lunar.day + lm - 2 + h) % 6];
    return { chi: name, range: HOUR_RANGES[h], canChi: `${CAN[((can % 5) * 2 + h) % 10]} ${name}`, than: than.name, good: than.good, ltp };
  });

  const [goodIdx, badIdx] = data.ngocHap.table[lm - 1][index60] as [number[], number[]];
  const star = (i: number) => ({ n: data.ngocHap.stars[i].n, h: data.ngocHap.stars[i].h, d: data.ngocHap.stars[i].d });

  const monthLength = lunarMonthLength(lunar);
  const yearCan = (lunar.year + 6) % 10;
  const taboos: Taboo[] = [];
  const taboo = (name: string) => taboos.push({ name, text: TABOO_TEXT[name] });
  if (TAM_NUONG.includes(lunar.day)) taboo('Tam Nương');
  if (NGUYET_KY.includes(lunar.day)) taboo('Nguyệt Kỵ');
  if (lunar.day === monthLength) taboo('Nguyệt Tận');
  if (DUONG_CONG.some(([mm, dd]) => mm === lm && dd === lunar.day)) taboo('Dương Công Kỵ');
  if (SAT_CHU_DUONG[lm - 1] === chi) taboo('Sát Chủ Dương');
  if (SAT_CHU_AM[lm - 1] === chi) taboo('Sát Chủ Âm');
  if (THO_TU[lm - 1] === chi) taboo('Thọ Tử');
  if (TRUNG_TANG[lm - 1] === can) taboo('Trùng Tang');
  if (TRUNG_PHUC[lm - 1] === can) taboo('Trùng Phục');
  if (KIM_THAN_THAT_SAT[yearCan % 5].includes(chi)) taboo('Kim Thần Thất Sát');

  const sao = data.sao28[(jd + 11) % 28];
  const napAm = data.napAm[index60];
  const xungLine = napAm.find((line) => line.includes('kỵ các tuổi')) ?? '';
  const tuoiXung = xungLine.split('kỵ các tuổi:')[1]?.replace(/\.$/, '').trim() ?? '';

  // Today if it is Tết, otherwise the next one.
  const isTet = lm === 1 && lunar.day === 1 && !lunar.leap;
  const tetYear = isTet ? lunar.year : lunar.year + 1;
  const tetDate = isTet ? { day: d, month: m, year: y } : lunarToSolar(1, 1, tetYear)!;
  const tetJd = jdFromDate(tetDate.day, tetDate.month, tetDate.year);

  return {
    ...lite,
    monthCanChi: `${CAN[(lunar.year * 12 + lm + 3) % 10]} ${CHI[(lm + 1) % 12]}`,
    yearCanChi: `${CAN[yearCan]} ${CHI[(lunar.year + 8) % 12]}`,
    monthLength,
    term,
    hours,
    napAm,
    hanh: data.days60[index60].hanh,
    tuoiXung,
    truc,
    sao28: sao,
    goodStars: goodIdx.map(star),
    badStars: badIdx.map(star),
    taboos,
    banhTo: { can: BANH_TO_CAN[can], chi: BANH_TO_CHI[chi] },
    lucDieu: LUC_DIEU[(lm + lunar.day - 2) % 6],
    directions: data.days60[index60],
    quote: data.quotes[(jd - 1) % 222],
    sun: CITIES.map((c) => ({ city: c.name, times: sunTimes(d, m, y, c.lat, c.lon) })),
    moon: moonInfo(d, m, y),
    tet: { days: tetJd - jd, date: tetDate, name: `${CAN[(tetYear + 6) % 10]} ${CHI[(tetYear + 8) % 12]}` },
  };
}

// ---- Calendar grids ----

export function daysInMonth(m: number, y: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Weeks for a month grid starting on Monday; days outside the month are null. */
export function monthWeeks(m: number, y: number): (DayLite | null)[][] {
  const count = daysInMonth(m, y);
  const first = (jdFromDate(1, m, y) + 1) % 7; // 0 = Sunday
  const lead = (first + 6) % 7;
  const cells: (DayLite | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= count; d += 1) cells.push(dayLite(d, m, y));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
