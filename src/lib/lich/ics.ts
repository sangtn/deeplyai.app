// Minimal iCalendar (RFC 5545) writer for all-day events. No imports, so it also runs in the browser.

export interface IcsEvent {
  uid: string;
  date: { day: number; month: number; year: number };
  summary: string;
  description?: string;
  url?: string;
  /** Minutes before the start of the day; e.g. 720 = noon the day before. */
  alarmMinutes?: number;
}

export interface IcsCalendar { name: string; description?: string; events: IcsEvent[]; refreshDays?: number }

const p2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: { day: number; month: number; year: number }) => `${d.year}${p2(d.month)}${p2(d.day)}`;
const nextDay = (d: { day: number; month: number; year: number }) => {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + 1));
  return { day: t.getUTCDate(), month: t.getUTCMonth() + 1, year: t.getUTCFullYear() };
};
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a content line at 75 octets (UTF-8), never splitting a character. */
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (bytes + n > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(cal: IcsCalendar, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DeeplyAi//Lich Viet Web//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(cal.name)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];
  if (cal.description) lines.push(`X-WR-CALDESC:${escape(cal.description)}`);
  if (cal.refreshDays) lines.push(`REFRESH-INTERVAL;VALUE=DURATION:P${cal.refreshDays}D`, `X-PUBLISHED-TTL:P${cal.refreshDays}D`);
  for (const e of cal.events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(e.date))}`,
      `SUMMARY:${escape(e.summary)}`,
      'TRANSP:TRANSPARENT',
    );
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    if (e.alarmMinutes !== undefined) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escape(e.summary)}`, `TRIGGER:-PT${e.alarmMinutes}M`, 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
