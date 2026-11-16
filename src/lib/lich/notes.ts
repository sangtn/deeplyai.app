// Notes and diary ("Ghi chú & nhật ký"), ported from the Lịch Việt iOS app (NoteModel, DiaryInsights).
// Pure logic only: types, validation, search, sorting, stats, streak and "ngày này năm xưa".
// Dates are local calendar days written as "YYYY-MM-DD" so they never shift with time zones.

import { solarToLunar } from '../../components/lich-viet/lunar';

export type NoteKind = 'note' | 'diary';

export interface ChecklistItem { id: string; text: string; done: boolean }

export interface Note {
  id: string;
  kind: NoteKind;
  /** The day the note or diary page belongs to, "YYYY-MM-DD". */
  date: string;
  title: string;
  content: string;
  /** Only used by notes. */
  checklist: ChecklistItem[];
  /** Diary mood: 0 = not chosen, 1…5 (see MOODS). */
  mood: number;
  /** Only used by notes: pinned notes sort first. */
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

/** The document stored under the 'notes' key. */
export interface NotesDoc { version: 1; items: Note[] }

/** Stored under 'notes-lock': a salted SHA-256 hash of the diary PIN, never the PIN itself. */
export interface DiaryLock { salt: string; hash: string }

/** The app's five moods (NoteMood), with its emoji and Vietnamese labels. */
export const MOODS = [
  { value: 1, emoji: '😞', label: 'Tệ' },
  { value: 2, emoji: '😕', label: 'Không vui' },
  { value: 3, emoji: '😐', label: 'Bình thường' },
  { value: 4, emoji: '😊', label: 'Vui' },
  { value: 5, emoji: '🤩', label: 'Tuyệt vời' },
] as const;

export const moodOf = (value: number) => MOODS.find((m) => m.value === value);

export const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const emptyDoc = (): NotesDoc => ({ version: 1, items: [] });

// ---------- Dates ----------

const p2 = (n: number) => String(n).padStart(2, '0');
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const toIso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

export function parseIso(iso: string) {
  const m = ISO_RE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? { y, m: mo, d } : null;
}

export function addDays(iso: string, n: number) {
  const p = parseIso(iso);
  if (!p) return iso;
  return toIso(new Date(p.y, p.m - 1, p.d + n));
}

/** "Thứ Hai, 16/11/2026" */
export function solarLabel(iso: string) {
  const p = parseIso(iso);
  if (!p) return iso;
  return `${WEEKDAY_NAMES[new Date(p.y, p.m - 1, p.d).getDay()]}, ${p2(p.d)}/${p2(p.m)}/${p.y}`;
}

/** "16/10 âm lịch" (with "nhuận" for a leap month). */
export function lunarLabel(iso: string) {
  const p = parseIso(iso);
  if (!p) return '';
  const l = solarToLunar(p.d, p.m, p.y);
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} âm lịch`;
}

// ---------- Validation (storage and backup files are untrusted) ----------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

export function sanitizeNote(raw: unknown, makeId: () => string): Note | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind: NoteKind = r.kind === 'diary' ? 'diary' : 'note';
  const date = typeof r.date === 'string' && parseIso(r.date) ? r.date : null;
  if (!date) return null;
  const now = Date.now();
  const checklist = Array.isArray(r.checklist)
    ? r.checklist
        .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
        .map((c) => ({ id: str(c.id, 64) || makeId(), text: str(c.text, 500), done: c.done === true }))
        .slice(0, 200)
    : [];
  const mood = Math.round(num(r.mood, 0));
  return {
    id: str(r.id, 64) || makeId(),
    kind,
    date,
    title: str(r.title, 300),
    content: str(r.content, 50000),
    checklist: kind === 'note' ? checklist : [],
    mood: kind === 'diary' && mood >= 1 && mood <= 5 ? mood : 0,
    pinned: kind === 'note' && r.pinned === true,
    createdAt: num(r.createdAt, now),
    updatedAt: num(r.updatedAt, now),
  };
}

export function sanitizeDoc(raw: unknown, makeId: () => string): NotesDoc | null {
  const items = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as NotesDoc).items) ? (raw as NotesDoc).items : null;
  if (!items) return null;
  return { version: 1, items: items.map((n) => sanitizeNote(n, makeId)).filter((n): n is Note => !!n) };
}

/** Merges a backup into the current items: same id keeps the most recently edited copy. */
export function mergeItems(current: Note[], incoming: Note[]) {
  const byId = new Map(current.map((n) => [n.id, n]));
  let added = 0;
  let updated = 0;
  for (const n of incoming) {
    const old = byId.get(n.id);
    if (!old) added += 1;
    else if (n.updatedAt > old.updatedAt) updated += 1;
    else continue;
    byId.set(n.id, n);
  }
  return { items: [...byId.values()], added, updated };
}

// ---------- Search and sorting ----------

/** Lower-case and strip Vietnamese diacritics, so "nhat ky" finds "Nhật ký". */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();

export function matches(note: Note, query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fold([note.title, note.content, ...note.checklist.map((c) => c.text), note.date.split('-').reverse().join('/')].join('\n'));
  return words.every((w) => hay.includes(w));
}

export const search = (items: Note[], query: string) => items.filter((n) => matches(n, query));

/** Pinned first, then newest day, then most recently edited (as in the app's default sort). */
export const sortItems = (items: Note[]) =>
  [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);

export const diaryFor = (items: Note[], date: string) => items.find((n) => n.kind === 'diary' && n.date === date);

// ---------- Diary insights ----------

/** Consecutive days with a diary page, counting back from today (or yesterday if today is not written yet). */
export function streak(items: Note[], today: string) {
  const days = new Set(items.filter((n) => n.kind === 'diary').map((n) => n.date));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export interface OnThisDay { note: Note; years: number; match: 'solar' | 'lunar' }

/** Diary pages from earlier years on the same solar day/month, or on the same lunar day/month. */
export function onThisDay(items: Note[], today: string): OnThisDay[] {
  const t = parseIso(today);
  if (!t) return [];
  const tl = solarToLunar(t.d, t.m, t.y);
  const out: OnThisDay[] = [];
  for (const note of items) {
    if (note.kind !== 'diary') continue;
    const p = parseIso(note.date);
    if (!p || p.y >= t.y) continue;
    if (p.d === t.d && p.m === t.m) {
      out.push({ note, years: t.y - p.y, match: 'solar' });
      continue;
    }
    const l = solarToLunar(p.d, p.m, p.y);
    if (l.day === tl.day && l.month === tl.month && l.leap === tl.leap && l.year < tl.year) out.push({ note, years: tl.year - l.year, match: 'lunar' });
  }
  return out.sort((a, b) => b.note.date.localeCompare(a.note.date));
}

export interface NoteStats { notes: number; pinned: number; tasksDone: number; tasksTotal: number }
export interface DiaryStats { entries: number; thisMonth: number; streak: number; moods: Record<number, number>; avgMood: number | null }

export function noteStats(items: Note[]): NoteStats {
  const notes = items.filter((n) => n.kind === 'note');
  const tasks = notes.flatMap((n) => n.checklist);
  return { notes: notes.length, pinned: notes.filter((n) => n.pinned).length, tasksDone: tasks.filter((c) => c.done).length, tasksTotal: tasks.length };
}

export function diaryStats(items: Note[], today: string): DiaryStats {
  const diaries = items.filter((n) => n.kind === 'diary');
  const month = today.slice(0, 7);
  const moods: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let rated = 0;
  for (const d of diaries) {
    if (d.mood >= 1 && d.mood <= 5) {
      moods[d.mood] += 1;
      sum += d.mood;
      rated += 1;
    }
  }
  return {
    entries: diaries.length,
    thisMonth: diaries.filter((d) => d.date.startsWith(month)).length,
    streak: streak(items, today),
    moods,
    avgMood: rated ? Math.round((sum / rated) * 10) / 10 : null,
  };
}

// ---------- Diary PIN ----------

export const PIN_RE = /^\d{4,6}$/;

const hex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const lockSupported = () => typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.getRandomValues === 'function';

async function digest(salt: string, pin: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`)));
}

export async function createLock(pin: string): Promise<DiaryLock> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await digest(salt, pin) };
}

export async function checkPin(lock: DiaryLock, pin: string) {
  return PIN_RE.test(pin) && (await digest(lock.salt, pin)) === lock.hash;
}

export const isLock = (v: unknown): v is DiaryLock =>
  !!v && typeof v === 'object' && typeof (v as DiaryLock).salt === 'string' && typeof (v as DiaryLock).hash === 'string' && /^[0-9a-f]{64}$/.test((v as DiaryLock).hash);
