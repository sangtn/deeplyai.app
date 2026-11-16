// Child vaccination schedule, ported from the Lịch Việt iOS app (PregnancyViewController.swift,
// "Tiêm chủng cho bé"). Pure logic over civil dates (Julian day numbers). The schedule texts
// live in src/data/lich/vaccines.json, verbatim from the app; they still need expert review.

import data from '../../data/lich/vaccines.json';
import { fromJd, jdFromDate } from '../../components/lich-viet/lunar';

export interface Vaccine { id: string; months: number; title: string; note: string }
/** Ids follow the app's string keys (preg_v0 … preg_v10) so marks survive data updates. */
export const VACCINES: Vaccine[] = data.vaccines.map((v, i) => ({ id: `v${i}`, ...v }));
export const SOURCE = data.source;
export const FOOTER = data.footer;
export const HEADING = data.heading;

/** What the visitor saved. `done` maps a vaccine id to the day it was marked (YYYY-MM-DD). */
export interface VaccineState { dob: string; name?: string; done: Record<string, string> }
export const emptyState = (): VaccineState => ({ dob: '', name: '', done: {} });

/** The app's age label: "Sơ sinh", "2 tháng", "1 tuổi", "1 tuổi 6 tháng". */
export function ageLabel(months: number) {
  if (months === 0) return data.newborn;
  const whole = Math.floor(months);
  if (whole < 12) return `${whole} tháng`;
  const y = Math.floor(whole / 12);
  const m = whole % 12;
  return `${y} tuổi${m > 0 ? ` ${m} tháng` : ''}`;
}

/** Vaccines grouped by age, in schedule order. */
export function byAge() {
  const groups: { months: number; label: string; items: Vaccine[] }[] = [];
  for (const v of VACCINES) {
    const last = groups[groups.length - 1];
    if (last && last.months === v.months) last.items.push(v);
    else groups.push({ months: v.months, label: ageLabel(v.months), items: [v] });
  }
  return groups;
}

/** Adds calendar months like Foundation's Calendar: 31/1 + 1 month → 28 or 29/2. */
export function addMonths(jd: number, months: number) {
  const s = fromJd(jd);
  const total = s.year * 12 + (s.month - 1) + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  const lastDay = fromJd(jdFromDate(1, m === 12 ? 1 : m + 1, m === 12 ? y + 1 : y) - 1).day;
  return jdFromDate(Math.min(s.day, lastDay), m, y);
}

/** Due date of a dose: whole months added to the birth date, then any fraction as 30-day months (the app's rule). */
export function dueJd(dob: number, months: number) {
  const whole = Math.floor(months);
  const frac = months - whole;
  const d = addMonths(dob, whole);
  return frac > 0 ? d + Math.floor(frac * 30) : d;
}

/** Age as years, months, days between two civil dates (like Calendar.dateComponents). */
export function age(dob: number, today: number) {
  if (today < dob) return null;
  const a = fromJd(dob);
  const b = fromJd(today);
  let months = (b.year - a.year) * 12 + (b.month - a.month);
  if (b.day < a.day) months -= 1;
  const anchor = addMonths(dob, months);
  return { years: Math.floor(months / 12), months: months % 12, days: today - anchor };
}

export type DoseStatus = 'done' | 'overdue' | 'soon' | 'later';

export interface DoseRow extends Vaccine { due: number; status: DoseStatus; doneOn?: string }

/** Every dose with its due date and state; "soon" is within the next 30 days. */
export function schedule(state: VaccineState, dob: number, today: number): DoseRow[] {
  return VACCINES.map((v) => {
    const due = dueJd(dob, v.months);
    const doneOn = state.done[v.id];
    const status: DoseStatus = doneOn ? 'done' : due < today ? 'overdue' : due - today <= 30 ? 'soon' : 'later';
    return { ...v, due, status, doneOn };
  });
}

/** Keeps only fields we know, so an imported backup cannot inject anything else. */
export function sanitize(raw: unknown): VaccineState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const dob = typeof r.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.dob) ? r.dob : '';
  const name = typeof r.name === 'string' ? r.name.slice(0, 60) : '';
  const done: Record<string, string> = {};
  if (r.done && typeof r.done === 'object') {
    for (const v of VACCINES) {
      const d = (r.done as Record<string, unknown>)[v.id];
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) done[v.id] = d;
    }
  }
  return { dob, name, done };
}
