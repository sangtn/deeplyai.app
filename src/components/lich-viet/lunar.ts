// Vietnamese lunar calendar for the "today" page on the Lịch Việt pages.
// Astronomical algorithm by Hồ Ngọc Đức (new moons and solar longitude), computed for
// Vietnam's time zone (UTC+7), the same basis the app uses. Runs at build time and in the
// browser, so it has no dependencies.

const TZ = 7;
const INT = Math.floor;
const PI = Math.PI;

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
/** File names of the app's zodiac icons, in the order of CHI. */
export const CHI_ICONS = ['Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Tyj', 'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi'];
export const SOLAR_TERMS = [
  'Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng', 'Hạ chí', 'Tiểu thử',
  'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ', 'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông',
  'Tiểu tuyết', 'Đại tuyết', 'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập',
];
export const LUNAR_MONTHS = ['Tháng Giêng', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Chạp'];
// Auspicious (Hoàng Đạo) hours by the day's earthly branch, repeating every six branches.
const HOANG_DAO = ['110100101100', '001101001011', '110011010010', '101100110100', '001011001101', '010010110011'];

export function jdFromDate(dd: number, mm: number, yy: number) {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

function newMoon(k: number) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 = c1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + c1 - deltat;
}

const newMoonDay = (k: number) => INT(newMoon(k) + 0.5 + TZ / 24);

/** Apparent solar longitude in radians, normalized to [0, 2π). */
function sunLongitude(jdn: number) {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let dl = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  dl = dl + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + dl) * dr;
  L -= PI * 2 * INT(L / (PI * 2));
  return L;
}

const sunSector = (dayNumber: number) => INT((sunLongitude(dayNumber - 0.5 - TZ / 24) / PI) * 6);

function lunarMonth11(yy: number) {
  const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
  const nm = newMoonDay(k);
  return sunSector(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

function leapMonthOffset(a11: number) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let i = 1;
  let arc = sunSector(newMoonDay(k + i));
  let last;
  do {
    last = arc;
    i += 1;
    arc = sunSector(newMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate { day: number; month: number; year: number; leap: boolean; jd: number }

export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  const jd = jdFromDate(dd, mm, yy);
  const k = INT((jd - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > jd) monthStart = newMoonDay(k);
  let a11 = lunarMonth11(yy);
  let b11 = a11;
  let year;
  if (a11 >= monthStart) {
    year = yy;
    a11 = lunarMonth11(yy - 1);
  } else {
    year = yy + 1;
    b11 = lunarMonth11(yy + 1);
  }
  const day = jd - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let leap = false;
  let month = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11);
    if (diff >= leapDiff) {
      month = diff + 10;
      if (diff === leapDiff) leap = true;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, leap, jd };
}

const canChi = (can: number, chi: number) => `${CAN[can]} ${CHI[chi]}`;

export interface DayInfo {
  solar: { day: number; month: number; year: number; weekday: number };
  lunar: LunarDate;
  dayCanChi: string;
  monthCanChi: string;
  yearCanChi: string;
  yearChi: number;
  solarTerm: string;
  /** Indexes into CHI of the day's auspicious hours. */
  goodHours: number[];
  /** Days until the next Lunar New Year, and that year's can chi. */
  tet: { days: number; date: { day: number; month: number; year: number }; name: string };
}

const fromJd = (jd: number) => {
  const a = jd + 32044;
  const b = INT((4 * a + 3) / 146097);
  const c = a - INT((b * 146097) / 4);
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  return { day: e - INT((153 * m + 2) / 5) + 1, month: m + 3 - 12 * INT(m / 10), year: b * 100 + d - 4800 + INT(m / 10) };
};

export function dayInfo(dd: number, mm: number, yy: number): DayInfo {
  const lunar = solarToLunar(dd, mm, yy);
  const { jd } = lunar;
  const dayChi = (jd + 1) % 12;
  let tetJd = jd + 1;
  for (let i = 0; i < 400; i += 1, tetJd += 1) {
    const s = fromJd(tetJd);
    const l = solarToLunar(s.day, s.month, s.year);
    if (l.day === 1 && l.month === 1 && !l.leap) break;
  }
  const tetDate = fromJd(tetJd);
  const tetYear = lunar.year + 1;
  return {
    solar: { day: dd, month: mm, year: yy, weekday: (jd + 1) % 7 },
    lunar,
    dayCanChi: canChi((jd + 9) % 10, dayChi),
    monthCanChi: canChi((lunar.year * 12 + lunar.month + 3) % 10, (lunar.month + 1) % 12),
    yearCanChi: canChi((lunar.year + 6) % 10, (lunar.year + 8) % 12),
    yearChi: (lunar.year + 8) % 12,
    solarTerm: SOLAR_TERMS[INT((sunLongitude(jd + 0.5 - 0.5 - TZ / 24) / PI) * 12)],
    goodHours: [...HOANG_DAO[dayChi % 6]].flatMap((bit, i) => (bit === '1' ? [i] : [])),
    tet: { days: tetJd - jd, date: tetDate, name: canChi((tetYear + 6) % 10, (tetYear + 8) % 12) },
  };
}

/** Today's date in Vietnam, whatever the visitor's own time zone. */
export function vietnamToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { day: get('day'), month: get('month'), year: get('year') };
}
