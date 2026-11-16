// Exchange rates published by Vietcombank, fetched at build time (the site rebuilds nightly).
// Only an openly published feed is used here. Gold and stock-index sources live in the optional
// Worker (services/lich-worker) and stay off until the site owner confirms the right to use them.

export interface Rate { code: string; name: string; cashBuy: number | null; transferBuy: number | null; sell: number | null }
export interface RateTable { source: 'Vietcombank'; updatedAt: string; rates: Rate[] }

const NAMES: Record<string, string> = {
  USD: 'Đô la Mỹ', EUR: 'Euro', GBP: 'Bảng Anh', JPY: 'Yên Nhật', AUD: 'Đô la Úc', CAD: 'Đô la Canada', CHF: 'Franc Thụy Sĩ',
  CNY: 'Nhân dân tệ', DKK: 'Krone Đan Mạch', HKD: 'Đô la Hồng Kông', INR: 'Rupee Ấn Độ', KRW: 'Won Hàn Quốc', KWD: 'Dinar Kuwait',
  MYR: 'Ringgit Malaysia', NOK: 'Krone Na Uy', RUB: 'Rúp Nga', SAR: 'Riyal Ả Rập Xê Út', SEK: 'Krona Thụy Điển', SGD: 'Đô la Singapore', THB: 'Baht Thái',
};
const num = (v: unknown) => { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };

export function parseVietcombank(json: { UpdatedDate?: string; Date?: string; Data?: Record<string, unknown>[] }): RateTable | null {
  if (!json?.Data?.length) return null;
  const rates = json.Data.map((r) => ({
    code: String(r.currencyCode), name: NAMES[String(r.currencyCode)] ?? String(r.currencyName),
    cashBuy: num(r.cash), transferBuy: num(r.transfer), sell: num(r.sell),
  })).filter((r) => r.sell);
  return { source: 'Vietcombank', updatedAt: json.UpdatedDate ?? json.Date ?? '', rates };
}

let cache: Promise<RateTable | null> | null = null;

/** Set LICH_MARKET=off to skip the request (offline builds). */
export function exchangeRates() {
  if (cache) return cache;
  cache = (async () => {
    if (process.env.LICH_MARKET === 'off') return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('https://www.vietcombank.com.vn/api/exchangerates?date=now', { headers: { 'User-Agent': 'DeeplyAiLichAm/1.0 (+https://deeplyai.app/vi/lich-am/ty-gia/)' }, signal: ctrl.signal });
      return res.ok ? parseVietcombank(await res.json()) : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();
  return cache;
}

export const vnd = (n: number | null, digits = 0) => (n === null ? '–' : n.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits }));
