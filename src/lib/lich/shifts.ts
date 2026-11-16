// Shift calendar, ported from the Lịch Việt iOS app (Models/ShiftSchedule.swift,
// ShiftCalendarViewController.swift): a cycle of shifts repeating from a start date.
// The web version keeps shift types separately so their names and colours can be edited.

import { fromJd, jdFromDate, solarToLunar } from '../../components/lich-viet/lunar';

export interface ShiftType { id: string; name: string; color: string }
export interface ShiftState {
  /** Shift types the visitor can rename and recolour. */
  types: ShiftType[];
  /** The repeating cycle, as type ids; day 0 is the start date. */
  cycle: string[];
  /** First day of the cycle (YYYY-MM-DD). */
  start: string;
}

// The app colours a shift by its name: "nghỉ" green, "đêm" indigo, every other shift orange
// (iOS systemGreen, systemIndigo, systemOrange). Those are the defaults here.
const ORANGE = '#ff9500';
const INDIGO = '#5856d6';
const GREEN = '#34c759';
export const appColor = (name: string) => (name.toLowerCase().includes('nghỉ') ? GREEN : name.toLowerCase().includes('đêm') ? INDIGO : ORANGE);

/** The app's built-in shift names (shift_label_* keys). */
export const DEFAULT_TYPES: ShiftType[] = [
  { id: 'sang', name: 'Sáng', color: ORANGE },
  { id: 'chieu', name: 'Chiều', color: '#e07b00' },
  { id: 'dem', name: 'Đêm', color: INDIGO },
  { id: 'nghi', name: 'Nghỉ', color: GREEN },
  { id: 'ngay', name: 'Ngày', color: ORANGE },
  { id: 'truc', name: 'Trực', color: '#d9480f' },
  { id: 'lam', name: 'Làm', color: ORANGE },
];

/** The app's cycle presets (ShiftSchedule.presets), names verbatim from vi.lproj. */
export const PRESETS: { id: string; name: string; labels: string[] }[] = [
  { id: '3ca', name: '3 ca (Sáng · Chiều · Đêm · Nghỉ)', labels: ['Sáng', 'Chiều', 'Đêm', 'Nghỉ'] },
  { id: '2ca', name: '2 ca (Ngày · Đêm · Nghỉ · Nghỉ)', labels: ['Ngày', 'Đêm', 'Nghỉ', 'Nghỉ'] },
  { id: '24-48', name: 'Trực 24/48 (Trực · Nghỉ · Nghỉ)', labels: ['Trực', 'Nghỉ', 'Nghỉ'] },
  { id: '6-1', name: 'Làm 6 nghỉ 1', labels: ['Làm', 'Làm', 'Làm', 'Làm', 'Làm', 'Làm', 'Nghỉ'] },
  { id: '5-2', name: 'Làm 5 nghỉ 2', labels: ['Làm', 'Làm', 'Làm', 'Làm', 'Làm', 'Nghỉ', 'Nghỉ'] },
];

const p2 = (n: number) => String(n).padStart(2, '0');
export const jdToIso = (jd: number) => {
  const s = fromJd(jd);
  return `${s.year}-${p2(s.month)}-${p2(s.day)}`;
};
export function isoToJd(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  const jd = jdFromDate(Number(m[3]), Number(m[2]), Number(m[1]));
  const s = fromJd(jd);
  return s.day === Number(m[3]) && s.month === Number(m[2]) ? jd : null;
}

const slug = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ca';

/** Finds a type by name (case-insensitive), or adds one with the app's colour rule. Returns its id. */
export function ensureType(types: ShiftType[], name: string): string {
  const clean = name.trim().slice(0, 24);
  const hit = types.find((t) => t.name.toLowerCase() === clean.toLowerCase());
  if (hit) return hit.id;
  let id = slug(clean);
  while (types.some((t) => t.id === id)) id += '-1';
  types.push({ id, name: clean, color: appColor(clean) });
  return id;
}

/** Applies one of the app's presets, keeping the visitor's edited types. */
export function applyPreset(state: ShiftState, presetId: string): ShiftState {
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const types = state.types.map((t) => ({ ...t }));
  return { ...state, types, cycle: preset.labels.map((l) => ensureType(types, l)) };
}

/** Parses the app's quick entry ("Sáng, Chiều, Đêm, Nghỉ") into a cycle, adding new types as needed. */
export function applyText(state: ShiftState, text: string): ShiftState | null {
  const items = text.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 60);
  if (!items.length) return null;
  const types = state.types.map((t) => ({ ...t }));
  return { ...state, types, cycle: items.map((l) => ensureType(types, l)) };
}

export const defaultState = (startIso: string): ShiftState => applyPreset({ types: DEFAULT_TYPES.map((t) => ({ ...t })), cycle: [], start: startIso }, '3ca');

/** Which preset the cycle matches, if any (by shift names, like the app's checkmark). */
export function matchingPreset(state: ShiftState) {
  const names = state.cycle.map((id) => state.types.find((t) => t.id === id)?.name ?? '');
  return PRESETS.find((p) => p.labels.length === names.length && p.labels.every((l, i) => l === names[i]))?.id ?? null;
}

/** The shift on a day: ((days since start) mod cycle length), negative days wrap backwards like the app. */
export function shiftOn(state: ShiftState, startJd: number, jd: number): ShiftType | null {
  const n = state.cycle.length;
  if (!n) return null;
  const idx = (((jd - startJd) % n) + n) % n;
  return state.types.find((t) => t.id === state.cycle[idx]) ?? null;
}

export interface GridCell { jd: number; day: number; weekday: number; lunarDay: number; lunarMonth: number; leap: boolean }

/** Month weeks starting Monday (T2 … CN), like the site's MonthGrid; null for padding cells. */
export function monthWeeks(month: number, year: number): (GridCell | null)[][] {
  const first = jdFromDate(1, month, year);
  const next = month === 12 ? jdFromDate(1, 1, year + 1) : jdFromDate(1, month + 1, year);
  const lead = (first + 1 + 6) % 7; // 0 = Monday
  const cells: (GridCell | null)[] = Array.from({ length: lead }, () => null);
  for (let jd = first; jd < next; jd += 1) {
    const s = fromJd(jd);
    const l = solarToLunar(s.day, s.month, s.year);
    cells.push({ jd, day: s.day, weekday: (jd + 1) % 7, lunarDay: l.day, lunarMonth: l.month, leap: l.leap });
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (GridCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Black or white text, whichever reads better on the colour. */
export function inkOn(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#000';
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.179 ? '#15140f' : '#ffffff';
}

/** Keeps only well-formed fields from stored or imported data. */
export function sanitize(raw: unknown, fallbackStart: string): ShiftState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const types: ShiftType[] = Array.isArray(r.types)
    ? (r.types as unknown[]).flatMap((t) => {
        const o = t as Record<string, unknown>;
        return o && typeof o.id === 'string' && typeof o.name === 'string'
          ? [{ id: o.id.slice(0, 40), name: o.name.slice(0, 24), color: typeof o.color === 'string' && /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : appColor(o.name) }]
          : [];
      }).slice(0, 40)
    : [];
  if (!types.length) return null;
  const cycle = Array.isArray(r.cycle) ? (r.cycle as unknown[]).filter((id): id is string => typeof id === 'string' && types.some((t) => t.id === id)).slice(0, 60) : [];
  const start = typeof r.start === 'string' && isoToJd(r.start) !== null ? r.start : fallbackStart;
  return { types, cycle, start };
}
