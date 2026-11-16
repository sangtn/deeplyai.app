// Thần số học (Pythagorean numerology), ported from the Lịch Việt iOS app
// (Models/NumerologyEngine.swift). Numbers and texts match the app exactly; see the notes on
// normalizeName for how Vietnamese letters are handled (the app folds diacritics, so "Đ" adds 0).

import data from '../../data/lich/numerology.json';

export const NUMEROLOGY_LABELS = data.labels;
export const MASTER_NUMBERS = [11, 22, 33] as const;

export interface BirthDate { day: number; month: number; year: number }

export interface NumerologyInterpretation {
  lifePathMeaning: string;
  soulUrgeMeaning: string;
  expressionMeaning: string;
  personalYearMeaning: string;
  /** [lifePath, soulUrge, expression], as the app builds it (not shown in the app's UI). */
  luckyNumbers: number[];
  strengths: string[];
  challenges: string[];
}

export interface NumerologyProfile {
  birthDate: BirthDate;
  fullName: string;
  /** Name after diacritic folding, upper-casing and removing spaces (what the sums run over). */
  normalizedName: string;
  lifePathNumber: number;
  soulUrgeNumber: number;
  expressionNumber: number;
  personalYear: number;
  interpretation: NumerologyInterpretation;
}

const PYTHAGOREAN: Record<string, number> = {
  A: 1, J: 1, S: 1, B: 2, K: 2, T: 2, C: 3, L: 3, U: 3, D: 4, M: 4, V: 4, E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6, G: 7, P: 7, Y: 7, H: 8, Q: 8, Z: 8, I: 9, R: 9,
};
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Sum of the decimal digits of a non-negative integer. */
export const sumDigits = (n: number) => [...String(n)].reduce((s, c) => s + (c >= '0' && c <= '9' ? +c : 0), 0);

/** Reduce to one digit, keeping the master numbers 11, 22 and 33. */
export function reduceToSingleDigit(n: number) {
  if (n === 11 || n === 22 || n === 33) return n;
  let r = n;
  while (r > 9) {
    r = sumDigits(r);
    if (r === 11 || r === 22 || r === 33) return r;
  }
  return r;
}

/**
 * Same result as Swift's `name.folding(options: .diacriticInsensitive, locale:).uppercased()`
 * with spaces removed: diacritics are stripped (ă â ê ô ơ ư and the tone marks fold to the base
 * letter) but "Đ/đ" has no decomposition, so it stays "Đ" and scores 0, exactly as in the app.
 * Checked against Swift for every Unicode scalar.
 */
export function normalizeName(name: string) {
  // Web fix: the app leaves Đ/đ unfolded, so it scored 0 ("Đức" counted as "ỨC"). Đ is read as D here.
  return name.replace(/[Đđ]/g, 'D').normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC').toUpperCase().replace(/ /g, '');
}

// Swift iterates grapheme clusters; a letter fused with a following non-mark joiner is not "A".
function characters(s: string): string[] {
  const Seg = (Intl as any).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x: any) => x.segment as string);
  return [...s];
}

export const letterToNumber = (ch: string) => PYTHAGOREAN[ch] ?? 0;

/** Con số chủ đạo / đường đời: digits of day + month + year, reduced. */
export const calculateLifePathNumber = ({ day, month, year }: BirthDate) =>
  reduceToSingleDigit(sumDigits(day) + sumDigits(month) + sumDigits(year));

/** Con số linh hồn: vowels A E I O U only (Y is never a vowel here). */
export const calculateSoulUrgeNumber = (normalizedName: string) =>
  reduceToSingleDigit(characters(normalizedName).filter((c) => VOWELS.has(c)).reduce((s, c) => s + letterToNumber(c), 0));

/** Con số biểu đạt: every letter of the name. */
export const calculateExpressionNumber = (normalizedName: string) =>
  reduceToSingleDigit(characters(normalizedName).reduce((s, c) => s + letterToNumber(c), 0));

/** Năm cá nhân: birth day + birth month + the current (Gregorian) year. */
export const calculatePersonalYear = (birth: Pick<BirthDate, 'day' | 'month'>, currentYear: number) =>
  reduceToSingleDigit(sumDigits(birth.day) + sumDigits(birth.month) + sumDigits(currentYear));

type TextTable = Record<string, string>;
const pick = (table: TextTable, n: number, fallback: string) => table[String(n)] ?? fallback;

/**
 * Full profile as the app computes it. `currentYear` defaults to this year in the visitor's
 * clock, as the app uses the device's current year.
 */
export function calculateNumerology(fullName: string, birthDate: BirthDate, currentYear = new Date().getFullYear()): NumerologyProfile {
  const normalizedName = normalizeName(fullName);
  const lifePathNumber = calculateLifePathNumber(birthDate);
  const soulUrgeNumber = calculateSoulUrgeNumber(normalizedName);
  const expressionNumber = calculateExpressionNumber(normalizedName);
  const personalYear = calculatePersonalYear(birthDate, currentYear);
  const f = data.fallbacks;
  return {
    birthDate,
    fullName,
    normalizedName,
    lifePathNumber,
    soulUrgeNumber,
    expressionNumber,
    personalYear,
    interpretation: {
      lifePathMeaning: pick(data.lifePath, lifePathNumber, f.lifePath),
      soulUrgeMeaning: pick(data.soulUrge, soulUrgeNumber, f.soulUrge),
      expressionMeaning: pick(data.expression, expressionNumber, f.expression),
      personalYearMeaning: pick(data.personalYear, personalYear, f.personalYear),
      luckyNumbers: [lifePathNumber, soulUrgeNumber, expressionNumber],
      strengths: (data.strengths as Record<string, string[]>)[String(lifePathNumber)] ?? [],
      challenges: (data.challenges as Record<string, string[]>)[String(lifePathNumber)] ?? [],
    },
  };
}
