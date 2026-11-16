// Personal recurring dates (giỗ, cưới, sinh nhật…) on the lunar or solar calendar.
// Browser-safe: depends only on the small lunar engine.
// Customs applied when a lunar date has no counterpart in a given year:
//  - day 30 of a 29-day month is kept on day 29 (the last day of that month);
//  - a date in a leap month is observed in the ordinary month with the same number.

import { CAN, CHI, jdFromDate, lunarToSolar, solarToLunar } from '../../components/lich-viet/lunar';
import type { IcsEvent } from './ics';

export type EventKind = 'gio' | 'cuoi' | 'sinh-nhat' | 'ky-niem' | 'khac';
export const KINDS: { id: EventKind; label: string; emoji: string }[] = [
  { id: 'gio', label: 'Ngày giỗ', emoji: '🕯️' },
  { id: 'cuoi', label: 'Kỷ niệm ngày cưới', emoji: '💍' },
  { id: 'sinh-nhat', label: 'Sinh nhật', emoji: '🎂' },
  { id: 'ky-niem', label: 'Kỷ niệm', emoji: '🌸' },
  { id: 'khac', label: 'Khác', emoji: '📌' },
];

export interface PersonalEvent {
  id: string;
  title: string;
  kind: EventKind;
  calendar: 'lunar' | 'solar';
  day: number;
  month: number;
  /** The year it first happened (optional): used for "lần thứ" / age. */
  year?: number;
  note?: string;
  createdAt: string;
}

export interface Occurrence { date: { day: number; month: number; year: number }; jd: number; adjusted: string | null; nth: number | null }

/** Occurrence of the event in a given lunar year (lunar events) or Gregorian year (solar events). */
export function occurrenceIn(e: PersonalEvent, year: number): Occurrence | null {
  let date: { day: number; month: number; year: number } | null = null;
  let adjusted: string | null = null;
  if (e.calendar === 'lunar') {
    date = lunarToSolar(e.day, e.month, year);
    if (!date && e.day === 30) {
      date = lunarToSolar(29, e.month, year);
      if (date) adjusted = `Tháng ${e.month} âm năm này chỉ có 29 ngày, lấy ngày 29`;
    }
  } else {
    const t = new Date(Date.UTC(year, e.month - 1, e.day));
    if (t.getUTCMonth() === e.month - 1) date = { day: e.day, month: e.month, year };
    else if (e.day === 29 && e.month === 2) {
      date = { day: 28, month: 2, year };
      adjusted = 'Năm không nhuận, lấy ngày 28/2';
    }
  }
  if (!date) return null;
  return { date, jd: jdFromDate(date.day, date.month, date.year), adjusted, nth: e.year ? year - e.year : null };
}

/** The next `count` occurrences on or after the given Julian day. */
export function nextOccurrences(e: PersonalEvent, fromJd: number, count: number): Occurrence[] {
  const from = (() => {
    const d = new Date(Date.UTC(2000, 0, 1) + (fromJd - 2451545) * 86400000);
    return { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
  })();
  const startYear = e.calendar === 'lunar' ? solarToLunar(from.day, from.month, from.year).year - 1 : from.year - 1;
  const out: Occurrence[] = [];
  for (let y = startYear; out.length < count && y < startYear + count + 3; y += 1) {
    const o = occurrenceIn(e, y);
    if (o && o.jd >= fromJd) out.push(o);
  }
  return out;
}

export const kindOf = (k: EventKind) => KINDS.find((x) => x.id === k) ?? KINDS[4];
export const yearCanChi = (y: number) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`;
export const dateLabel = (e: Pick<PersonalEvent, 'calendar' | 'day' | 'month'>) => (e.calendar === 'lunar' ? `${e.day}/${e.month} âm lịch` : `${e.day}/${e.month} dương lịch`);

/** ICS events for the next `years` occurrences of every event, with a reminder at noon the day before. */
export function eventsToIcs(events: PersonalEvent[], fromJd: number, years = 10): IcsEvent[] {
  return events.flatMap((e) => nextOccurrences(e, fromJd, years).map((o) => {
    const k = kindOf(e.kind);
    const nth = o.nth && o.nth > 0 ? (e.kind === 'sinh-nhat' ? ` (${o.nth} tuổi)` : ` (năm thứ ${o.nth})`) : '';
    return {
      uid: `${e.id}-${o.date.year}${String(o.date.month).padStart(2, '0')}${String(o.date.day).padStart(2, '0')}@deeplyai.app`,
      date: o.date,
      summary: `${k.emoji} ${e.title}${nth}`,
      description: [`${k.label}: ${dateLabel(e)}`, o.adjusted ?? '', e.note ?? ''].filter(Boolean).join('\n'),
      alarmMinutes: 720,
    };
  }));
}
