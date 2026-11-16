// Tử vi năm, tử vi trọn đời and sao hạn, after the Lịch Việt app
// (SaoHanCalculator.swift, HoroscopeDetailService.swift, ZodiacDetailViewController.swift,
// SaohanViewController.swift, TuviViewController.swift, TuviTrondoiViewController.swift).
// Rules are kept exactly as the app has them (verified against the Swift code), including its quirks.
// All Vietnamese text lives in src/data/lich/tuvi.json.

import data from '../../data/lich/tuvi.json';

export type Gender = 'Nam' | 'Nữ';
export type SaoRating = 'Tốt' | 'Trung bình' | 'Xấu';
export type ThaiTueKey = 'truc' | 'xung' | 'hai' | 'pha' | 'hinh';

const SH = data.saoHan;
const LT = data.lifetime;

export const THIEN_CAN: string[] = SH.thienCan;
export const DIA_CHI: string[] = SH.diaChi;
export const TUVI_DATA = data;

// ---------------------------------------------------------------- Can Chi

export const canIndex = (year: number) => (((year - 4) % 10) + 10) % 10;
export const chiIndex = (year: number) => (((year - 4) % 12) + 12) % 12;
export const canChi = (year: number) => `${THIEN_CAN[canIndex(year)]} ${DIA_CHI[chiIndex(year)]}`;

/** Tuổi mụ = năm xem − năm sinh (âm lịch) + 1 */
export const tuoiMu = (viewYear: number, birthYear: number) => viewYear - birthYear + 1;

/**
 * Năm âm lịch đang xem sao hạn (HoroscopeDetailService.targetYear):
 * năm âm lịch hiện tại, từ tháng 9 âm lịch trở đi chuyển sang năm sau.
 */
export const targetYearFromLunar = (lunarYear: number, lunarMonth: number) => lunarYear + (lunarMonth >= 9 ? 1 : 0);

// ---------------------------------------------------------------- Sao & Hạn

/** Sao chiếu mệnh (Cửu diệu): chu kỳ 9, khởi tuổi mụ 10 — Nam: La Hầu, Nữ: Kế Đô. null nếu tuổi mụ < 10. */
export function saoChieuMenh(viewYear: number, birthYear: number, isMale: boolean): string | null {
  const t = tuoiMu(viewYear, birthYear);
  if (t < 10) return null;
  const i = (t - 10) % 9;
  return isMale ? SH.saoNam[i] : SH.saoNu[i];
}

/** Hạn (Bát hạn): chu kỳ 8 "mốc chục rồi đếm lẻ" — Nam khởi Huỳnh Tuyền, Nữ khởi Toán Tận. null nếu tuổi mụ < 10. */
export function hanTuoi(viewYear: number, birthYear: number, isMale: boolean): string | null {
  const t = tuoiMu(viewYear, birthYear);
  if (t < 10) return null;
  const i = (((Math.trunc(t / 10) - 1 + (t % 10)) % 8) + 8) % 8;
  return isMale ? SH.hanNam[i] : SH.hanNu[i];
}

/** Phân loại sao như app: Thái Dương/Thái Âm/Mộc Đức = Tốt; Thổ Tú/Thủy Diệu/Vân Hớn = Trung bình; còn lại = Xấu. */
export function saoRating(sao: string): SaoRating {
  switch (sao) {
    case 'Thái Dương': case 'Thái Âm': case 'Mộc Đức': return 'Tốt';
    case 'Thổ Tú': case 'Thủy Diệu': case 'Vân Hớn': return 'Trung bình';
    default: return 'Xấu';
  }
}

export const starMeaning = (sao: string): string => (SH.starMeanings as Record<string, string>)[sao] ?? '';
export const destinyMeaning = (han: string): string => (SH.destinyMeanings as Record<string, string>)[han] ?? '';

// ---------------------------------------------------------------- Tam tai, Thái Tuế

const TAM_TAI_GROUPS: { members: number[]; years: number[] }[] = [
  { members: [8, 0, 4], years: [2, 3, 4] }, // Thân Tý Thìn → Dần Mão Thìn
  { members: [2, 6, 10], years: [8, 9, 10] }, // Dần Ngọ Tuất → Thân Dậu Tuất
  { members: [11, 3, 7], years: [5, 6, 7] }, // Hợi Mão Mùi → Tỵ Ngọ Mùi
  { members: [5, 9, 1], years: [11, 0, 1] }, // Tỵ Dậu Sửu → Hợi Tý Sửu
];

/** Năm thứ mấy (1…3) của hạn Tam tai nếu năm xem là năm tam tai của tuổi, ngược lại null. */
export function tamTai(viewYear: number, birthYear: number): 1 | 2 | 3 | null {
  const chiTuoi = chiIndex(birthYear);
  const chiNam = chiIndex(viewYear);
  const g = TAM_TAI_GROUPS.find((x) => x.members.includes(chiTuoi));
  if (!g) return null;
  const idx = g.years.indexOf(chiNam);
  return idx < 0 ? null : ((idx + 1) as 1 | 2 | 3);
}

const LUC_HAI: Record<number, number> = { 0: 7, 7: 0, 1: 6, 6: 1, 2: 5, 5: 2, 3: 4, 4: 3, 8: 11, 11: 8, 9: 10, 10: 9 };
const LUC_PHA: Record<number, number> = { 0: 9, 9: 0, 1: 4, 4: 1, 2: 11, 11: 2, 3: 6, 6: 3, 5: 8, 8: 5, 7: 10, 10: 7 };
const TAM_HINH: number[][] = [[2, 5, 8], [1, 10, 7], [0, 3]];

/** Quan hệ Thái Tuế (thứ tự ưu tiên như app: Trực, Xung, Hại, Phá, Hình). */
export function thaiTue(viewYear: number, birthYear: number): { key: ThaiTueKey; name: string } | null {
  const tuoi = chiIndex(birthYear);
  const nam = chiIndex(viewYear);
  let key: ThaiTueKey | null = null;
  if (tuoi === nam) key = 'truc';
  else if ((tuoi - nam + 12) % 12 === 6) key = 'xung';
  else if (LUC_HAI[nam] === tuoi) key = 'hai';
  else if (LUC_PHA[nam] === tuoi) key = 'pha';
  else if (TAM_HINH.some((g) => g.includes(nam) && g.includes(tuoi))) key = 'hinh';
  return key ? { key, name: (SH.thaiTueNames as Record<ThaiTueKey, string>)[key] } : null;
}

// ---------------------------------------------------------------- Sao hạn for one person

export interface SaoHanResult {
  birthYear: number;
  viewYear: number;
  gender: Gender;
  canChi: string;
  tuoiMu: number;
  sao: string | null;
  saoRating: SaoRating | null;
  saoMeaning: string;
  han: string | null;
  hanMeaning: string;
  thaiTue: { key: ThaiTueKey; name: string } | null;
  tamTai: 1 | 2 | 3 | null;
}

export function saoHan(birthYear: number, viewYear: number, gender: Gender): SaoHanResult {
  const isMale = gender === 'Nam';
  const sao = saoChieuMenh(viewYear, birthYear, isMale);
  const han = hanTuoi(viewYear, birthYear, isMale);
  return {
    birthYear, viewYear, gender,
    canChi: canChi(birthYear),
    tuoiMu: tuoiMu(viewYear, birthYear),
    sao, saoRating: sao ? saoRating(sao) : null, saoMeaning: sao ? starMeaning(sao) : '',
    han, hanMeaning: han ? destinyMeaning(han) : '',
    thaiTue: thaiTue(viewYear, birthYear),
    tamTai: tamTai(viewYear, birthYear),
  };
}

// ---------------------------------------------------------------- Detail modal (HoroscopeDetailService)

/** Nạp âm 60 năm từ 1924 như app; năm < 1924 app trả "Kim". */
export function nguHanhNapAm(year: number): string {
  const index = (year - 1924) % 60;
  return index >= 0 && index < SH.nguHanhNapAm60From1924.length ? SH.nguHanhNapAm60From1924[index] : 'Kim';
}

/** "Cung Mệnh" của app: chỉ theo địa chi năm sinh (không theo giới tính). */
export const cungMenh = (diaChi: string): string => (SH.cungMenhByChi as Record<string, string>)[diaChi] ?? 'Chưa xác định';

/** Màu hợp theo hành chứa trong tên nạp âm (Kim, Mộc, Thủy, Hỏa, Thổ theo thứ tự), mặc định "Đa dạng". */
export function mauHop(nguHanh: string): string {
  for (const [el, color] of SH.mauHopRules as [string, string][]) if (el !== '?' && nguHanh.includes(el)) return color;
  return (SH.mauHopRules as [string, string][]).find(([el]) => el === '?')![1];
}

export interface HoroscopeDetail {
  birthYear: string;
  ageInTargetYear: string;
  lunarAgeInTargetYear: string;
  star: string;
  starMeaning: string;
  destiny: string;
  destinyMeaning: string;
  canChi: string;
  nguHanh: string;
  cungMenh: string;
  thienCan: string;
  diaChi: string;
  mauHop: string;
}

/** Same fields as HoroscopeDetailService.getHoroscopeDetail, with targetYear = viewYear. Star/hạn are "—" under tuổi mụ 10. */
export function horoscopeDetail(birthYear: number, viewYear: number, gender: Gender): HoroscopeDetail {
  const isMale = gender === 'Nam';
  const star = saoChieuMenh(viewYear, birthYear, isMale) ?? '—';
  const destiny = hanTuoi(viewYear, birthYear, isMale) ?? '—';
  const thienCan = THIEN_CAN[canIndex(birthYear)];
  const diaChi = DIA_CHI[chiIndex(birthYear)];
  const nguHanh = nguHanhNapAm(birthYear);
  const age = viewYear - birthYear;
  return {
    birthYear: String(birthYear),
    ageInTargetYear: String(age),
    lunarAgeInTargetYear: String(age + 1),
    star, starMeaning: starMeaning(star),
    destiny, destinyMeaning: destinyMeaning(destiny),
    canChi: `${thienCan} ${diaChi}`,
    nguHanh, cungMenh: cungMenh(diaChi), thienCan, diaChi, mauHop: mauHop(nguHanh),
  };
}

// ---------------------------------------------------------------- Bảng sao hạn 12 con giáp

export interface ZodiacDetail { name: string; year: string; maleText: string; femaleText: string }
export interface ZodiacItem { title: string; years: string[]; iconName: string; chiIndex: number }

/** Năm sinh của một con giáp được liệt kê: từ năm xem − 96 đến năm xem − 9 (tuổi mụ 10…97). */
export function zodiacBirthYears(chi: number, viewYear: number): number[] {
  const out: number[] = [];
  for (let y = viewYear - 96; y <= viewYear - 9; y++) if (chiIndex(y) === chi) out.push(y);
  return out;
}

/** 12 ô con giáp của màn "Bảng Sao Hạn" (nhãn năm ghép từng cặp "1948 - 1960"). */
export function zodiacItems(viewYear: number): ZodiacItem[] {
  return DIA_CHI.map((chi, index) => {
    const years = zodiacBirthYears(index, viewYear);
    const labels: string[] = [];
    for (let i = 0; i < years.length; ) {
      if (i + 1 < years.length) { labels.push(`${years[i]} - ${years[i + 1]}`); i += 2; }
      else { labels.push(`${years[i]}`); i += 1; }
    }
    return { title: `TUỔI ${chi.toUpperCase()}`, years: labels, iconName: chi, chiIndex: index };
  });
}

/** Thẻ chi tiết của một con giáp: "S. {sao} - H. {hạn}" cho Nam / Nữ mạng. */
export function zodiacDetails(chi: number, viewYear: number): ZodiacDetail[] {
  return zodiacBirthYears(chi, viewYear).map((y) => ({
    name: canChi(y),
    year: `${y}`,
    maleText: `S. ${saoChieuMenh(viewYear, y, true)} - H. ${hanTuoi(viewYear, y, true)}`,
    femaleText: `S. ${saoChieuMenh(viewYear, y, false)} - H. ${hanTuoi(viewYear, y, false)}`,
  }));
}

// ---------------------------------------------------------------- Tử vi năm (fixed content, 2027)

export type ZodiacFortune = (typeof data.yearly.zodiacFortunes.items)[number];
export const YEARLY = data.yearly;
/** Năm mà nội dung tử vi năm của app áp dụng (cố định). */
export const YEARLY_YEAR: number = data.yearly.year;
export const zodiacFortune = (chi: string): ZodiacFortune | undefined =>
  data.yearly.zodiacFortunes.items.find((f) => f.zodiacName === chi);

// ---------------------------------------------------------------- Tử vi trọn đời (template generator)

export interface LifetimeInput {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  gender: Gender;
  /** Chỉ hiển thị, app không chuyển đổi lịch. */
  calendarType: 'Âm Lịch' | 'Dương Lịch';
}

export interface LifetimeOptions {
  /** Năm dương lịch hiện tại (app dùng Calendar.current year). Mặc định: năm hiện tại. */
  currentYear?: number;
  /** 'random' (như app, shuffle mỗi lần) hoặc 'fixed' (lấy các sao đầu danh sách). Mặc định 'random'. */
  starOrder?: 'random' | 'fixed';
  /** RNG cho shuffle, mặc định Math.random. */
  rng?: () => number;
}

type Band = { below: number | null; text: string };
const band = (bands: Band[], v: number) => bands.find((b) => b.below === null || v < b.below)!.text;
const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

function pickStars(pool: string[], n: number, opts: LifetimeOptions) {
  const arr = [...pool];
  if ((opts.starOrder ?? 'random') === 'random') {
    const rng = opts.rng ?? Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr.slice(0, n);
}

export interface LifetimeParts {
  age: number;
  canSign: string;
  zodiacSign: string;
  /** Hành theo công thức đơn giản của app ((năm − 4) / 2) % 5 — không phải nạp âm. */
  element: string;
  destiny: string;
  lunarHour: string;
  goodStars: string[];
  badStars: string[];
  sections: Record<'personality' | 'career' | 'wealth' | 'love' | 'health' | 'ageFortune' | 'fengShui', string>;
}

export function lifetimeParts(f: LifetimeInput, opts: LifetimeOptions = {}): LifetimeParts {
  const S = LT.sections;
  const age = (opts.currentYear ?? new Date().getFullYear()) - f.year;
  const canSign = THIEN_CAN[(f.year - 4) % 10];
  const zodiacSign = DIA_CHI[(f.year - 4) % 12];
  const element = LT.elements[Math.trunc((f.year - 4) / 2) % 5];
  const destiny = LT.palaces[(f.day + f.month + f.year) % 12];
  const lunarHour = LT.lunarHours[Math.trunc(f.hour / 2) % 12];
  const el = <T>(m: Record<string, T>) => m[element];
  const sections = {
    personality: fill(S.personality.template, {
      elementTraits: el(LT.elementMeaning as Record<string, string>),
      zodiacTraits: (LT.chiMeaning as Record<string, string>)[zodiacSign],
      genderAdvice: (S.personality.genderAdvice as Record<string, string>)[f.gender],
    }),
    career: fill(S.career.template, {
      careerAdvice: el(S.career.byElement as Record<string, string>),
      ageAdvice: band(S.career.byAge, age),
    }),
    wealth: fill(S.wealth.template, {
      elementWealth: el(S.wealth.byElement as Record<string, string>),
      monthAdvice: band(S.wealth.byMonth, f.month),
    }),
    love: fill(S.love.template, {
      ageAdvice: band(S.love.byAge, age),
      genderAdvice: (S.love.genderAdvice as Record<string, string>)[f.gender],
    }),
    health: fill(S.health.template, {
      elementHealth: el(S.health.byElement as Record<string, string>),
      ageHealth: band(S.health.byAge, age),
    }),
    ageFortune: fill(S.ageFortune.template, {
      age,
      fortune: band(S.ageFortune.byAge, age),
      nextDecade: (Math.trunc(age / 10) + 1) * 10,
    }),
    fengShui: fill(S.fengShui.template, {
      elementColor: el(S.fengShui.byElement as Record<string, string>),
      direction: (S.fengShui.directionByChi as Record<string, string>)[zodiacSign] ?? 'Trung tâm',
      element,
    }),
  };
  return {
    age, canSign, zodiacSign, element, destiny, lunarHour,
    goodStars: pickStars(LT.goodStarsPool, LT.goodStarsCount, opts),
    badStars: pickStars(LT.badStarsPool, LT.badStarsCount, opts),
    sections,
  };
}

/** Full "TỬ VI TRỌN ĐỜI" text exactly as the app's generateMockTuviResult builds it. */
export function lifetimeHoroscope(f: LifetimeInput, opts: LifetimeOptions = {}): string {
  const p = lifetimeParts(f, opts);
  return fill(LT.resultTemplate, {
    day: f.day, month: f.month, year: f.year, calendarType: f.calendarType,
    hour: f.hour, minute2: String(f.minute).padStart(2, '0'), lunarHour: p.lunarHour,
    gender: f.gender, age: p.age,
    canSign: p.canSign, canMeaning: (LT.canMeaning as Record<string, string>)[p.canSign],
    zodiacSign: p.zodiacSign, zodiacMeaning: (LT.chiMeaning as Record<string, string>)[p.zodiacSign],
    element: p.element, elementMeaning: (LT.elementMeaning as Record<string, string>)[p.element],
    destiny: p.destiny,
    goodStars: p.goodStars.join(', '), badStars: p.badStars.join(', '),
    ...p.sections,
  });
}
