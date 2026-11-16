// Thu chi (income / expense) logic, ported from the Lịch Việt iOS app (FinanceViewController,
// TransactionModel). Pure functions only: no DOM, no storage. The page keeps one document under
// the store key 'finance' with the shape of FinanceData.

export type TxType = 'expense' | 'income';

export interface Transaction {
  id: string;
  /** Whole VND, always positive; `type` carries the sign. */
  amount: number;
  type: TxType;
  /** A CategoryId; unknown ids fall back to 'other' / 'otherIncome' on display. */
  category: string;
  note: string;
  /** Solar date, 'YYYY-MM-DD'. */
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceData { version: 1; items: Transaction[] }

export const FINANCE_KEY = 'finance';
export const emptyFinance = (): FinanceData => ({ version: 1, items: [] });

export interface Category { id: string; type: TxType; label: string; icon: string; color: string }

// Same ids, order and Vietnamese labels as the app; SF Symbols become emoji, system colors become hex.
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', type: 'expense', label: 'Ăn uống', icon: '🍜', color: '#e8890c' },
  { id: 'transport', type: 'expense', label: 'Đi lại', icon: '🚗', color: '#1a73e8' },
  { id: 'shopping', type: 'expense', label: 'Mua sắm', icon: '🛍️', color: '#d6336c' },
  { id: 'bills', type: 'expense', label: 'Hoá đơn', icon: '🧾', color: '#4c4fc4' },
  { id: 'health', type: 'expense', label: 'Sức khoẻ', icon: '💊', color: '#d63a2f' },
  { id: 'education', type: 'expense', label: 'Học tập', icon: '📚', color: '#138a94' },
  { id: 'entertainment', type: 'expense', label: 'Giải trí', icon: '🎮', color: '#9443c4' },
  { id: 'family', type: 'expense', label: 'Gia đình', icon: '👨‍👩‍👧', color: '#8f6a43' },
  { id: 'housing', type: 'expense', label: 'Nhà cửa', icon: '🏠', color: '#1f93b8' },
  { id: 'gift', type: 'expense', label: 'Hiếu hỉ, quà', icon: '🎁', color: '#14a08a' },
  { id: 'other', type: 'expense', label: 'Khác', icon: '📦', color: '#7c7c80' },
];
export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', type: 'income', label: 'Lương', icon: '💵', color: '#1f8a4c' },
  { id: 'bonus', type: 'income', label: 'Thưởng', icon: '⭐', color: '#c99a06' },
  { id: 'investment', type: 'income', label: 'Đầu tư', icon: '📈', color: '#2e9e5b' },
  { id: 'business', type: 'income', label: 'Kinh doanh', icon: '💼', color: '#138a94' },
  { id: 'otherIncome', type: 'income', label: 'Thu khác', icon: '➕', color: '#7c7c80' },
];
export const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export const categoriesFor = (type: TxType) => (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES);
export const categoryOf = (t: Pick<Transaction, 'category' | 'type'>): Category => {
  const c = BY_ID.get(t.category);
  return c && c.type === t.type ? c : BY_ID.get(t.type === 'expense' ? 'other' : 'otherIncome')!;
};

/** Amounts the app offers as one-tap additions. */
export const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 200_000, 500_000];
export const quickLabel = (v: number) => (v >= 1_000_000 ? `${v / 1_000_000}tr` : `${v / 1000}k`);

// ---------- Money ----------

/** 1234567 → "1.234.567" (Vietnamese grouping). */
export const groupDigits = (n: number) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** "1.234.567 ₫"; with sign: "+1.234.567 ₫" / "−1.234.567 ₫" (zero gets no sign). */
export function formatVnd(n: number, sign = false) {
  const s = `${groupDigits(n)}\u00a0₫`; // no-break space keeps ₫ with the number
  if (!sign || n === 0) return s;
  return (n < 0 ? '−' : '+') + s;
}

/** Reads what a visitor typed ("1.200.000", "1,2tr" is not supported, digits only) into whole VND. */
export function parseAmount(text: string): number {
  const digits = text.replace(/\D/g, '').slice(0, 15);
  return digits ? Number(digits) : 0;
}

// ---------- Dates ----------

const p2 = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d: number, m: number, y: number) => `${y}-${p2(m)}-${p2(d)}`;
export const monthKey = (m: number, y: number) => `${y}-${p2(m)}`;
export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};
export const shiftMonth = (m: number, y: number, delta: number) => {
  const i = y * 12 + (m - 1) + delta;
  return { m: (i % 12) + 1, y: Math.floor(i / 12) };
};
const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const weekdayOf = (iso: string) => {
  const { y, m, d } = parseIso(iso);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

// ---------- Monthly summary ----------

export const signed = (t: Transaction) => (t.type === 'expense' ? -t.amount : t.amount);

export interface DayGroup { date: string; items: Transaction[]; total: number }
export interface CategoryRow { category: Category; amount: number; count: number; share: number }
export interface MonthSummary {
  items: Transaction[];
  income: number;
  expense: number;
  balance: number;
  days: DayGroup[];
  /** Expense rows first, then income, each sorted by amount (as in the app). `share` is of its own side's total. */
  categories: CategoryRow[];
}

/** Newest first; same-day entries by most recently created. */
const byNewest = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export function inMonth(items: Transaction[], m: number, y: number) {
  const key = monthKey(m, y);
  return items.filter((t) => t.date.startsWith(key));
}

export function summarize(all: Transaction[], m: number, y: number): MonthSummary {
  const items = inMonth(all, m, y).sort(byNewest);
  let income = 0;
  let expense = 0;
  const days: DayGroup[] = [];
  const cats = new Map<string, { category: Category; amount: number; count: number }>();
  for (const t of items) {
    if (t.type === 'expense') expense += t.amount;
    else income += t.amount;
    const last = days[days.length - 1];
    if (last && last.date === t.date) {
      last.items.push(t);
      last.total += signed(t);
    } else days.push({ date: t.date, items: [t], total: signed(t) });
    const c = categoryOf(t);
    const row = cats.get(c.id) ?? { category: c, amount: 0, count: 0 };
    row.amount += t.amount;
    row.count += 1;
    cats.set(c.id, row);
  }
  const categories = [...cats.values()]
    .map((r) => ({ ...r, share: r.amount / Math.max(1, r.category.type === 'expense' ? expense : income) }))
    .sort((a, b) => (a.category.type === b.category.type ? b.amount - a.amount : a.category.type === 'expense' ? -1 : 1));
  return { items, income, expense, balance: income - expense, days, categories };
}

// ---------- CSV ----------

const csvCell = (v: string | number) => {
  let s = String(v);
  // Keep notes such as "=SUM(…)" or "+84…" from being run as formulas in Excel.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n;]/.test(s) || typeof v === 'string' ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * The app's CSV columns (Ngày, Loại, Danh mục, Số tiền, Ghi chú) plus the lunar date. Starts with a
 * UTF-8 byte order mark so Excel opens Vietnamese text correctly; CRLF line endings.
 * `lunarOf` turns 'YYYY-MM-DD' into a label such as "26/9 âm".
 */
export function buildCsv(items: Transaction[], lunarOf: (iso: string) => string) {
  const rows = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const lines = [['Ngày', 'Ngày âm lịch', 'Loại', 'Danh mục', 'Số tiền', 'Ghi chú'].map(csvCell).join(',')];
  for (const t of rows) {
    lines.push([t.date, lunarOf(t.date), t.type === 'expense' ? 'Chi' : 'Thu', categoryOf(t).label, t.amount, t.note].map(csvCell).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** "ThuChi-2026-11.csv", like the app's "ThuChi-<tháng>.csv". */
export const csvFilename = (m: number, y: number) => `ThuChi-${monthKey(m, y)}.csv`;

// ---------- Validation (stored data and imported backups) ----------

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Keeps only well-formed transactions; returns null when the value is not finance data at all. */
export function sanitize(value: unknown): Transaction[] | null {
  const list = Array.isArray(value) ? value : value && typeof value === 'object' && Array.isArray((value as FinanceData).items) ? (value as FinanceData).items : null;
  if (!list) return null;
  const now = new Date().toISOString();
  const out: Transaction[] = [];
  for (const raw of list as Partial<Transaction>[]) {
    if (!raw || typeof raw !== 'object') continue;
    const amount = Math.round(Number(raw.amount));
    const type: TxType = raw.type === 'income' ? 'income' : 'expense';
    if (typeof raw.id !== 'string' || !raw.id || !(amount > 0) || typeof raw.date !== 'string' || !ISO_RE.test(raw.date)) continue;
    out.push({
      id: raw.id.slice(0, 64),
      amount: Math.min(amount, 999_999_999_999_999),
      type,
      category: typeof raw.category === 'string' ? raw.category : type === 'expense' ? 'other' : 'otherIncome',
      note: typeof raw.note === 'string' ? raw.note.slice(0, 200) : '',
      date: raw.date,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    });
  }
  return out;
}

/** Merges a backup into current data by id; the more recently updated copy wins. */
export function merge(current: Transaction[], incoming: Transaction[]) {
  const map = new Map(current.map((t) => [t.id, t]));
  let added = 0;
  let updated = 0;
  for (const t of incoming) {
    const have = map.get(t.id);
    if (!have) {
      map.set(t.id, t);
      added += 1;
    } else if (t.updatedAt > have.updatedAt) {
      map.set(t.id, t);
      updated += 1;
    }
  }
  return { items: [...map.values()], added, updated };
}
