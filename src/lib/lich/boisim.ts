// Bói sim / số điện thoại phong thủy, ported from the Lịch Việt iOS app
// (ViewController/Utilities/BoiSimViewController.swift). The app has no 80-quẻ table: it scores
// the digits (6/8/9 lucky, 4 unlucky, ascending pairs, repeats), takes the digital root of the
// digit sum, and picks a ngũ hành from the last digit. Output (including the full text block)
// matches the app exactly.

import data from '../../data/lich/boisim.json';

export const BOISIM_LABELS = data.labels;

export type PhoneValidationError = 'empty' | 'length' | 'prefix';

export interface PhoneEvaluation {
  /** The trimmed input as typed. */
  phoneNumber: string;
  /** Digits only. */
  cleanNumber: string;
  /** "0987 654 321" (10 digits) or "012 3456 7890" (11 digits). */
  formatted: string;
  digits: number[];
  totalSum: number;
  /** Số chủ đạo: repeated digit sum of totalSum, 0–9. */
  digitalRoot: number;
  /** 1–10. */
  luckyScore: number;
  scoreBreakdown: { base: number; luckyDigits: number; unluckyDigits: number; consecutive: number; repetition: number };
  luckyLevel: string;
  phongThuyLevel: string;
  /** Index into the five elements (Kim, Mộc, Thủy, Hỏa, Thổ) = last digit % 5. */
  elementIndex: number;
  element: string;
  numberMeaning: string;
  career: [string, string];
  love: [string, string];
  health: [string, string];
  fengShuiAdvice: string[];
  /** The whole result exactly as the app's text view shows it. */
  text: string;
}

export type PhoneResult =
  | { ok: true; evaluation: PhoneEvaluation }
  | { ok: false; error: PhoneValidationError; message: string };

// Swift's CharacterSet.whitespacesAndNewlines: Unicode Z* plus U+0009–U+000D and U+0085.
const SWIFT_WS = /^[\p{Z}\t\n\v\f\r\u0085]+|[\p{Z}\t\n\v\f\r\u0085]+$/gu;
const swiftTrim = (s: string) => s.replace(SWIFT_WS, '');

/** Validates as the app does; returns the trimmed text and digits, or an error. */
export function validatePhone(input: string): { ok: true; phoneNumber: string; cleanNumber: string } | { ok: false; error: PhoneValidationError; message: string } {
  const phoneText = swiftTrim(input ?? '');
  if (!phoneText) return { ok: false, error: 'empty', message: data.errors.empty };
  const cleanNumber = phoneText.replace(/[^0-9]/g, '');
  if (cleanNumber.length < 10 || cleanNumber.length > 11) return { ok: false, error: 'length', message: data.errors.length };
  if (!data.validPrefixes.some((p) => cleanNumber.startsWith(p))) return { ok: false, error: 'prefix', message: data.errors.prefix };
  return { ok: true, phoneNumber: phoneText, cleanNumber };
}

export function digitalRoot(n: number) {
  let sum = n;
  while (sum >= 10) sum = [...String(sum)].reduce((s, c) => s + Number(c), 0);
  return sum;
}

function consecutiveBonus(d: number[]) {
  let count = 0;
  for (let i = 0; i < d.length - 1; i += 1) if (d[i + 1] === d[i] + 1) count += 1;
  return count > 2 ? 2 : count;
}

function repetitionBonus(d: number[]) {
  const counts = new Map<number, number>();
  for (const x of d) counts.set(x, (counts.get(x) ?? 0) + 1);
  const maxRepeat = counts.size ? Math.max(...counts.values()) : 1;
  return maxRepeat >= 4 ? 2 : maxRepeat >= 3 ? 1 : 0;
}

export function luckyScore(digits: number[]) {
  const luckyDigits = digits.filter((x) => data.luckyDigits.includes(x)).length;
  const unluckyDigits = digits.filter((x) => !data.luckyDigits.includes(x) && data.unluckyDigits.includes(x)).length;
  const consecutive = consecutiveBonus(digits);
  const repetition = repetitionBonus(digits);
  const raw = 5 + luckyDigits - unluckyDigits + consecutive + repetition;
  return { score: Math.max(1, Math.min(10, raw)), breakdown: { base: 5, luckyDigits, unluckyDigits, consecutive, repetition } };
}

const band = (table: Record<string, string>, s: number) =>
  s >= 8 && s <= 10 ? table['8-10'] : s >= 6 && s <= 7 ? table['6-7'] : s >= 4 && s <= 5 ? table['4-5'] : s >= 2 && s <= 3 ? table['2-3'] : table.other;

interface Aspect { byRoot: Record<string, string>; rootDefault: string; score7: string; score5: string; scoreLow: string }
const aspect = (a: Aspect, root: number, score: number): [string, string] => [
  a.byRoot[String(root)] ?? a.rootDefault,
  score >= 7 ? a.score7 : score >= 5 ? a.score5 : a.scoreLow,
];

function fengShui(score: number) {
  const f = data.fengShui;
  return [f.always, ...(score >= 8 ? f.score8 : score >= 6 ? f.score6 : score >= 4 ? f.score4 : f.scoreLow)];
}

export function formatPhoneNumber(n: string) {
  if (n.length === 10) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(-3)}`;
  if (n.length === 11) return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7, 11)}`;
  return n;
}

const bullets = (xs: string[]) => xs.map((x) => `• ${x}`).join('\n');

/** Evaluate a phone number exactly as the app's "Đánh Giá" button does. */
export function evaluatePhone(input: string): PhoneResult {
  const v = validatePhone(input);
  if (!v.ok) return v;
  const { phoneNumber, cleanNumber } = v;
  const digits = [...cleanNumber].map(Number);
  const totalSum = digits.reduce((s, x) => s + x, 0);
  const root = digitalRoot(totalSum);
  const { score, breakdown } = luckyScore(digits);
  const elementIndex = Number(cleanNumber[cleanNumber.length - 1]) % 5;
  const element = data.elements[elementIndex];
  const numberMeaning = (data.numberMeanings as Record<string, string>)[String(root)] ?? data.numberMeaningFallback;
  const career = aspect(data.career, root, score);
  const love = aspect(data.love, root, score);
  const health = aspect(data.health, root, score);
  const fengShuiAdvice = fengShui(score);
  const luckyLevel = band(data.luckyLevel, score);
  const phongThuyLevel = band(data.phongThuyLevel, score);
  const formatted = formatPhoneNumber(cleanNumber);
  const h = data.headings;
  // The app's advice string ends without a newline; each block is joined exactly as its template.
  const text = [
    h.result,
    '',
    h.info,
    `• Số điện thoại: ${phoneNumber}`,
    `• Số chuẩn: ${formatted}`,
    `• Tổng số: ${totalSum}`,
    `• Số chủ đạo: ${root}`,
    '',
    h.overview,
    `• Điểm may mắn: ${score}/10`,
    `• Mức độ: ${luckyLevel}`,
    `• Phong thủy: ${phongThuyLevel}`,
    '',
    h.elements,
    `• Ngũ hành: ${element}`,
    '',
    `${h.meaning} (${root}):`,
    numberMeaning,
    '',
    h.career,
    bullets(career),
    '',
    h.love,
    bullets(love),
    '',
    h.health,
    bullets(health),
    '',
    h.advice,
    bullets(fengShuiAdvice),
    '',
    data.disclaimer,
  ].join('\n');
  return {
    ok: true,
    evaluation: {
      phoneNumber, cleanNumber, formatted, digits, totalSum, digitalRoot: root, luckyScore: score, scoreBreakdown: breakdown,
      luckyLevel, phongThuyLevel, elementIndex, element, numberMeaning, career, love, health, fengShuiAdvice, text,
    },
  };
}
