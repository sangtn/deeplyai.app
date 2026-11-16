// Pregnancy timeline, ported from the Lịch Việt iOS app (PregnancyViewController.swift).
// Pure logic: dates are Julian day numbers (civil dates, no time zone), so results match
// the app's Calendar.startOfDay arithmetic. Checkup texts live in src/data/lich/pregnancy.json.

import data from '../../data/lich/pregnancy.json';
import { fromJd, jdFromDate, solarToLunar } from '../../components/lich-viet/lunar';

export interface Milestone { week: number; title: string; desc: string }
export const MILESTONES: Milestone[] = data.milestones;
export const SOURCE = data.source;
export const FOOTER = data.footer;
export const HEADING = data.heading;

/** Naegele's rule: due date is 280 days (40 weeks) after the first day of the last period. */
export const TERM_DAYS = 280;
/** The app stops showing the running status past 320 days (about 45 weeks). */
export const MAX_DAYS = 320;

/** What the visitor saved: the first day of the last period, or the due date. */
export interface PregnancyInput { mode: 'lmp' | 'edd'; date: string }

const p2 = (n: number) => String(n).padStart(2, '0');
export const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** "2026-11-16" → Julian day number, or null when the text is not a real date. */
export function isoToJd(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const jd = jdFromDate(d, mo, y);
  const back = fromJd(jd);
  return back.day === d && back.month === mo && back.year === y ? jd : null;
}
export const jdToIso = (jd: number) => {
  const s = fromJd(jd);
  return `${s.year}-${p2(s.month)}-${p2(s.day)}`;
};
/** "Thứ Hai, 16/11/2026" */
export const formatJd = (jd: number, weekday = true) => {
  const s = fromJd(jd);
  return `${weekday ? `${WEEKDAYS[(jd + 1) % 7]}, ` : ''}${p2(s.day)}/${p2(s.month)}/${s.year}`;
};
/** "6/10 âm" (with "nhuận" for a leap month), the app's lunar suffix style. */
export const lunarLabel = (jd: number) => {
  const s = fromJd(jd);
  const l = solarToLunar(s.day, s.month, s.year);
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} âm`;
};

/** First day of the last period, from either kind of input. */
export function lmpJd(input: PregnancyInput | null): number | null {
  if (!input) return null;
  const jd = isoToJd(input.date);
  if (jd === null) return null;
  return input.mode === 'edd' ? jd - TERM_DAYS : jd;
}

export interface PregnancyStatus {
  lmp: number;
  edd: number;
  /** Days since the last period; negative when the date is in the future. */
  days: number;
  /** False when the date is in the future or more than 320 days ago (the app's "stale" state). */
  current: boolean;
  week: number;
  day: number;
  trimester: 1 | 2 | 3;
  /** 0…1 share of the 280-day journey. */
  progress: number;
  daysLeft: number;
}

export function status(lmp: number, today: number): PregnancyStatus {
  const days = today - lmp;
  const week = Math.floor(Math.max(0, days) / 7);
  return {
    lmp,
    edd: lmp + TERM_DAYS,
    days,
    current: days >= 0 && days <= MAX_DAYS,
    week,
    day: Math.max(0, days) % 7,
    trimester: week < 13 ? 1 : week < 27 ? 2 : 3,
    progress: Math.min(1, Math.max(0, days) / TERM_DAYS),
    daysLeft: Math.max(0, lmp + TERM_DAYS - today),
  };
}

/** The app dates each checkup at the start of its week: LMP + week × 7 days. */
export const milestoneJd = (lmp: number, week: number) => lmp + week * 7;

export const trimesterOf = (week: number): 1 | 2 | 3 => (week < 13 ? 1 : week < 27 ? 2 : 3);
export const TRIMESTERS = [
  { n: 1, name: 'Tam cá nguyệt 1', weeks: 'Tuần 0 – 12' },
  { n: 2, name: 'Tam cá nguyệt 2', weeks: 'Tuần 13 – 26' },
  { n: 3, name: 'Tam cá nguyệt 3', weeks: 'Tuần 27 – 40' },
];

export interface WeekRow { week: number; start: number; end: number; trimester: 1 | 2 | 3; milestones: Milestone[] }

/**
 * One row per week, counted like the app's status line ("Tuần 6 ngày 2"): week w covers
 * LMP + w×7 … LMP + w×7 + 6, and the checkup for week w falls on its first day.
 */
export function weeks(lmp: number, last = 41): WeekRow[] {
  const rows: WeekRow[] = [];
  for (let w = 0; w <= last; w += 1) {
    const start = lmp + w * 7;
    rows.push({ week: w, start, end: start + 6, trimester: trimesterOf(w), milestones: MILESTONES.filter((m) => m.week === w) });
  }
  return rows;
}
