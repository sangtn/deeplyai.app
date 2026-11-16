// Tử vi hằng ngày theo tuổi, ported from the Lịch Việt iOS app (Models/DailyHoroscopeEngine.swift).
//
// The app's score = Can Chi relation (birth-year branch vs day branch: tam hợp +2, lục xung −2)
// + lunar-day favourability (±1) + Int.random(in: -1...1). Because of that random term the app is
// NOT deterministic: the same person on the same day can get a different rating each tap. Here
// the random term is an explicit input (`randomFactor`); with the same value the output is
// identical to the app's. Leave it out to draw it at random like the app, or pass
// stableRandomFactor(...) for a page that should not change on reload (a site-only choice).

import data from '../../data/lich/daily-horoscope.json';
import { CAN, CHI, jdFromDate, solarToLunar } from '../../components/lich-viet/lunar';

export const HOROSCOPE_LABELS = data.labels;

export interface SolarDate { day: number; month: number; year: number }
export type RandomFactor = -1 | 0 | 1;

export interface DailyPrediction {
  overall: string;
  work: string;
  finance: string;
  love: string;
  health: string;
  luckyColor: string;
  luckyDirection: string;
  shouldDo: string[];
  shouldAvoid: string[];
  /** 1–5 stars. */
  rating: number;
}

export interface DailyHoroscopeProfile {
  date: SolarDate;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  birthYear: number;
  /** Can chi of the Gregorian birth year (the app does not switch at Tết). */
  birthCanChi: string;
  dayCanChi: string;
  relation: 'tam-hop' | 'luc-xung' | 'none';
  lunarDayKind: 'favorable' | 'unfavorable' | 'neutral';
  /** Score before the random term (−3…3). */
  baseScore: number;
  randomFactor: RandomFactor;
  /** baseScore + randomFactor (−4…4). */
  energyScore: number;
  prediction: DailyPrediction;
}

/** The app's VNLunar.yearOfVietnames for a Gregorian year. */
export const yearCanChi = (year: number) => `${CAN[(((year + 6) % 10) + 10) % 10]} ${CHI[(((year + 8) % 12) + 12) % 12]}`;
/** The app's VNLunar.dayOfVietnamese for a Gregorian date. */
export function dayCanChi(day: number, month: number, year: number) {
  const jd = jdFromDate(day, month, year);
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}

const lastWord = (canChi: string) => canChi.split(' ').filter(Boolean).pop() ?? '';

export function relationOf(birthCanChi: string, dayCC: string): DailyHoroscopeProfile['relation'] {
  const a = lastWord(birthCanChi);
  const b = lastWord(dayCC);
  if (data.tripleHarmony.some((g) => g.includes(a) && g.includes(b))) return 'tam-hop';
  if ((data.sixConflicts as Record<string, string>)[a] === b) return 'luc-xung';
  return 'none';
}

export function lunarDayKind(lunarDay: number): DailyHoroscopeProfile['lunarDayKind'] {
  // Day 23 is in both of the app's lists; the favourable check runs first, so it counts as good.
  if (data.favorableLunarDays.includes(lunarDay)) return 'favorable';
  if (data.unfavorableLunarDays.includes(lunarDay)) return 'unfavorable';
  return 'neutral';
}

const band5 = (s: number) => (s >= 3 ? 0 : s >= 1 ? 1 : s >= 0 ? 2 : s >= -2 ? 3 : 4);
const band3 = (s: number) => (s >= 2 ? 0 : s >= 0 ? 1 : 2);
const rating = (s: number) => (s >= 3 ? 5 : s >= 1 ? 4 : s >= 0 ? 3 : s >= -2 ? 2 : 1);

export function generatePrediction(energyScore: number, dayCC: string): DailyPrediction {
  const i = band5(energyScore);
  const j = band3(energyScore);
  const chi = lastWord(dayCC);
  return {
    overall: data.overall[i],
    work: data.work[i],
    finance: data.finance[i],
    love: data.love[i],
    health: data.health[i],
    luckyColor: (data.luckyColor as Record<string, string>)[chi] ?? data.luckyColorDefault,
    luckyDirection: (data.luckyDirection as Record<string, string>)[chi] ?? data.luckyDirectionDefault,
    shouldDo: data.shouldDo[j],
    shouldAvoid: data.shouldAvoid[j],
    rating: rating(energyScore),
  };
}

/** Draws −1, 0 or 1 uniformly, as Swift's Int.random(in: -1...1). */
export const randomRandomFactor = (): RandomFactor => (Math.floor(Math.random() * 3) - 1) as RandomFactor;

/** Site-only: a fixed −1/0/1 per (birth year, date), so a page shows the same result all day. */
export function stableRandomFactor(birthYear: number, date: SolarDate): RandomFactor {
  let h = 2166136261;
  for (const c of `${birthYear}|${date.year}-${date.month}-${date.day}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (((h >>> 0) % 3) - 1) as RandomFactor;
}

/**
 * Horoscope for someone born in `birthYear` (Gregorian year of the birth date, as the app reads it)
 * on the Gregorian `date` (the app uses the device's today).
 */
export function calculateDailyHoroscope(birthYear: number, date: SolarDate, randomFactor: RandomFactor = randomRandomFactor()): DailyHoroscopeProfile {
  const birthCanChi = yearCanChi(birthYear);
  const dayCC = dayCanChi(date.day, date.month, date.year);
  const lunar = solarToLunar(date.day, date.month, date.year);
  const relation = relationOf(birthCanChi, dayCC);
  const kind = lunarDayKind(lunar.day);
  const baseScore = (relation === 'tam-hop' ? 2 : relation === 'luc-xung' ? -2 : 0) + (kind === 'favorable' ? 1 : kind === 'unfavorable' ? -1 : 0);
  const energyScore = baseScore + randomFactor;
  return {
    date,
    lunarDay: lunar.day,
    lunarMonth: lunar.month,
    lunarYear: lunar.year,
    birthYear,
    birthCanChi,
    dayCanChi: dayCC,
    relation,
    lunarDayKind: kind,
    baseScore,
    randomFactor,
    energyScore,
    prediction: generatePrediction(energyScore, dayCC),
  };
}
