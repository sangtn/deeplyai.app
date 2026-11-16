// Weather forecasts for the Lịch âm section, fetched at build time from MET Norway's
// Locationforecast 2.0 (free, commercial use allowed with attribution, no API key).
// The site rebuilds every night, so pages carry a forecast that is at most a day old and say when
// it was issued. A failed request never fails the build: that location just has no forecast.
// Terms: https://api.met.no/doc/TermsOfService — identify the client in User-Agent, ≤ 20 req/s.

export interface Place { slug: string; name: string; city: string; lat: number; lon: number; tourist?: boolean }

/** The 34 provinces and cities (from 1/7/2025) by a main city, plus popular destinations.
 *  Where a destination has its own page, the province uses another city so the two pages differ. */
export const PLACES: Place[] = [
  { slug: 'ha-noi', name: 'Hà Nội', city: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { slug: 'tp-ho-chi-minh', name: 'TP. Hồ Chí Minh', city: 'TP. Hồ Chí Minh', lat: 10.7769, lon: 106.7009 },
  { slug: 'hai-phong', name: 'Hải Phòng', city: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { slug: 'da-nang', name: 'Đà Nẵng', city: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { slug: 'can-tho', name: 'Cần Thơ', city: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { slug: 'hue', name: 'Huế', city: 'Huế', lat: 16.4637, lon: 107.5909 },
  { slug: 'lai-chau', name: 'Lai Châu', city: 'Lai Châu', lat: 22.3964, lon: 103.4582 },
  { slug: 'dien-bien', name: 'Điện Biên', city: 'Điện Biên Phủ', lat: 21.386, lon: 103.023 },
  { slug: 'son-la', name: 'Sơn La', city: 'Sơn La', lat: 21.3256, lon: 103.9188 },
  { slug: 'lang-son', name: 'Lạng Sơn', city: 'Lạng Sơn', lat: 21.8537, lon: 106.7615 },
  { slug: 'quang-ninh', name: 'Quảng Ninh', city: 'Cẩm Phả', lat: 21.0166, lon: 107.2925 },
  { slug: 'thanh-hoa', name: 'Thanh Hóa', city: 'Thanh Hóa', lat: 19.8067, lon: 105.7852 },
  { slug: 'nghe-an', name: 'Nghệ An', city: 'Vinh', lat: 18.6796, lon: 105.6813 },
  { slug: 'ha-tinh', name: 'Hà Tĩnh', city: 'Hà Tĩnh', lat: 18.3428, lon: 105.9057 },
  { slug: 'cao-bang', name: 'Cao Bằng', city: 'Cao Bằng', lat: 22.6657, lon: 106.2577 },
  { slug: 'tuyen-quang', name: 'Tuyên Quang', city: 'Tuyên Quang', lat: 21.8236, lon: 105.214 },
  { slug: 'lao-cai', name: 'Lào Cai', city: 'Lào Cai', lat: 22.4856, lon: 103.9707 },
  { slug: 'thai-nguyen', name: 'Thái Nguyên', city: 'Thái Nguyên', lat: 21.5942, lon: 105.8482 },
  { slug: 'phu-tho', name: 'Phú Thọ', city: 'Việt Trì', lat: 21.3227, lon: 105.4019 },
  { slug: 'bac-ninh', name: 'Bắc Ninh', city: 'Bắc Ninh', lat: 21.1861, lon: 106.0763 },
  { slug: 'hung-yen', name: 'Hưng Yên', city: 'Hưng Yên', lat: 20.6464, lon: 106.0511 },
  { slug: 'ninh-binh', name: 'Ninh Bình', city: 'Ninh Bình', lat: 20.2506, lon: 105.9745 },
  { slug: 'quang-tri', name: 'Quảng Trị', city: 'Đông Hà', lat: 16.8163, lon: 107.1003 },
  { slug: 'quang-ngai', name: 'Quảng Ngãi', city: 'Quảng Ngãi', lat: 15.1214, lon: 108.8044 },
  { slug: 'gia-lai', name: 'Gia Lai', city: 'Pleiku', lat: 13.9833, lon: 108.0 },
  { slug: 'khanh-hoa', name: 'Khánh Hòa', city: 'Cam Ranh', lat: 11.9214, lon: 109.1591 },
  { slug: 'lam-dong', name: 'Lâm Đồng', city: 'Bảo Lộc', lat: 11.548, lon: 107.8077 },
  { slug: 'dak-lak', name: 'Đắk Lắk', city: 'Buôn Ma Thuột', lat: 12.6667, lon: 108.05 },
  { slug: 'dong-nai', name: 'Đồng Nai', city: 'Biên Hòa', lat: 10.9574, lon: 106.8426 },
  { slug: 'tay-ninh', name: 'Tây Ninh', city: 'Tây Ninh', lat: 11.31, lon: 106.0983 },
  { slug: 'vinh-long', name: 'Vĩnh Long', city: 'Vĩnh Long', lat: 10.2537, lon: 105.9722 },
  { slug: 'dong-thap', name: 'Đồng Tháp', city: 'Cao Lãnh', lat: 10.46, lon: 105.633 },
  { slug: 'ca-mau', name: 'Cà Mau', city: 'Cà Mau', lat: 9.1769, lon: 105.1524 },
  { slug: 'an-giang', name: 'An Giang', city: 'Long Xuyên', lat: 10.3864, lon: 105.4351 },
  { slug: 'da-lat', name: 'Đà Lạt', city: 'Đà Lạt', lat: 11.9404, lon: 108.4583, tourist: true },
  { slug: 'sa-pa', name: 'Sa Pa', city: 'Sa Pa', lat: 22.3364, lon: 103.8438, tourist: true },
  { slug: 'nha-trang', name: 'Nha Trang', city: 'Nha Trang', lat: 12.2388, lon: 109.1967, tourist: true },
  { slug: 'ha-long', name: 'Hạ Long', city: 'Hạ Long', lat: 20.9712, lon: 107.0448, tourist: true },
  { slug: 'vung-tau', name: 'Vũng Tàu', city: 'Vũng Tàu', lat: 10.346, lon: 107.0843, tourist: true },
  { slug: 'phu-quoc', name: 'Phú Quốc', city: 'Phú Quốc', lat: 10.2899, lon: 103.984, tourist: true },
  { slug: 'hoi-an', name: 'Hội An', city: 'Hội An', lat: 15.8801, lon: 108.338, tourist: true },
];
export const placeBySlug = new Map(PLACES.map((p) => [p.slug, p]));

// MET symbol codes (without _day/_night) → Vietnamese wording and an emoji.
const SYMBOLS: Record<string, [string, string]> = {
  clearsky: ['Trời quang', '☀️'], fair: ['Ít mây', '🌤️'], partlycloudy: ['Có mây', '⛅'], cloudy: ['Nhiều mây', '☁️'], fog: ['Sương mù', '☁️'],
  lightrainshowers: ['Mưa rào nhẹ', '🌦️'], rainshowers: ['Mưa rào', '🌦️'], heavyrainshowers: ['Mưa rào to', '🌧️'],
  lightrain: ['Mưa nhỏ', '🌧️'], rain: ['Mưa', '🌧️'], heavyrain: ['Mưa to', '🌧️'],
  lightrainshowersandthunder: ['Mưa rào kèm dông', '⛈️'], rainshowersandthunder: ['Mưa rào và dông', '⛈️'], heavyrainshowersandthunder: ['Mưa rào to, dông', '⛈️'],
  lightrainandthunder: ['Mưa nhỏ kèm dông', '⛈️'], rainandthunder: ['Mưa dông', '⛈️'], heavyrainandthunder: ['Mưa to, dông mạnh', '⛈️'],
  lightsleet: ['Mưa tuyết nhẹ', '🌨️'], sleet: ['Mưa tuyết', '🌨️'], lightsnow: ['Tuyết nhẹ', '🌨️'], snow: ['Tuyết', '❄️'],
};
export function describe(symbol?: string) {
  const base = (symbol ?? '').replace(/_(day|night|polartwilight)$/, '');
  const [text, icon] = SYMBOLS[base] ?? ['Không rõ', '🌡️'];
  return { text, icon, night: (symbol ?? '').endsWith('_night') };
}

export interface HourPoint { iso: string; hour: number; day: string; temp: number; feels?: number; symbol?: string; rain: number; humidity: number; wind: number; windDir: number; uv?: number }
export interface DaySummary { date: { day: number; month: number; year: number }; key: string; min: number; max: number; rain: number; symbol?: string; uvMax?: number; windMax: number; humidity: number }
export interface Forecast { place: Place; updatedAt: string; hours: HourPoint[]; days: DaySummary[] }

const TZ_MS = 7 * 3600 * 1000;
const local = (iso: string) => new Date(new Date(iso).getTime() + TZ_MS);
const dayKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
const round = (n: number, p = 0) => Math.round(n * 10 ** p) / 10 ** p;

interface MetSeries { time: string; data: { instant: { details: Record<string, number> }; next_1_hours?: { summary: { symbol_code: string }; details: { precipitation_amount?: number } }; next_6_hours?: { summary: { symbol_code: string }; details: { precipitation_amount?: number } }; next_12_hours?: { summary: { symbol_code: string } } } }

export function summarize(place: Place, json: { properties: { meta: { updated_at: string }; timeseries: MetSeries[] } }): Forecast {
  const series = json.properties.timeseries;
  const hours: HourPoint[] = series.map((s) => {
    const d = local(s.time);
    const i = s.data.instant.details;
    const step = s.data.next_1_hours ?? s.data.next_6_hours;
    return {
      iso: s.time, hour: d.getUTCHours(), day: dayKey(d), temp: i.air_temperature, feels: i.apparent_air_temperature,
      symbol: step?.summary.symbol_code ?? s.data.next_12_hours?.summary.symbol_code,
      rain: s.data.next_1_hours?.details.precipitation_amount ?? 0,
      humidity: i.relative_humidity, wind: i.wind_speed, windDir: i.wind_from_direction, uv: i.ultraviolet_index_clear_sky,
    };
  });
  // Rain per day: hourly steps where they exist, 6-hour steps after that (no double counting).
  const lastHourly = series.reduce((acc, s, idx) => (s.data.next_1_hours ? idx : acc), -1);
  const byDay = new Map<string, MetSeries[]>();
  series.forEach((s) => { const k = dayKey(local(s.time)); byDay.set(k, [...(byDay.get(k) ?? []), s]); });
  const days: DaySummary[] = [];
  for (const [key, list] of byDay) {
    if (list.length < 3) continue;
    const temps = list.map((s) => s.data.instant.details.air_temperature);
    let rain = 0;
    list.forEach((s) => {
      const idx = series.indexOf(s);
      rain += idx <= lastHourly ? s.data.next_1_hours?.details.precipitation_amount ?? 0 : s.data.next_6_hours?.details.precipitation_amount ?? 0;
    });
    // Daytime weather: the 6-hour symbol nearest to 12:00 local.
    const noon = [...list].sort((a, b) => Math.abs(local(a.time).getUTCHours() - 12) - Math.abs(local(b.time).getUTCHours() - 12))[0];
    const [y, m, d] = key.split('-').map(Number);
    days.push({
      date: { day: d, month: m, year: y }, key,
      min: round(Math.min(...temps)), max: round(Math.max(...temps)), rain: round(rain, 1),
      symbol: noon.data.next_6_hours?.summary.symbol_code ?? noon.data.next_1_hours?.summary.symbol_code ?? noon.data.next_12_hours?.summary.symbol_code,
      uvMax: Math.max(...list.map((s) => s.data.instant.details.ultraviolet_index_clear_sky ?? 0)) || undefined,
      windMax: round(Math.max(...list.map((s) => s.data.instant.details.wind_speed)) * 3.6),
      humidity: round(list.reduce((sum, s) => sum + s.data.instant.details.relative_humidity, 0) / list.length),
    });
  }
  return { place, updatedAt: json.properties.meta.updated_at, hours: hours.slice(0, 24), days: days.slice(0, 8) };
}

const UA = 'DeeplyAiLichAm/1.0 (+https://deeplyai.app/vi/lich-am/thoi-tiet/)';

async function fetchPlace(place: Place): Promise<Forecast | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (!res.ok) return null;
    return summarize(place, await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

let cache: Promise<Map<string, Forecast | null>> | null = null;

/** All forecasts, fetched once per build with at most 4 requests in flight. Set LICH_WEATHER=off to skip. */
export function allForecasts() {
  if (cache) return cache;
  cache = (async () => {
    const out = new Map<string, Forecast | null>();
    if (process.env.LICH_WEATHER === 'off') return out;
    const queue = [...PLACES];
    await Promise.all(Array.from({ length: 4 }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) out.set(p.slug, await fetchPlace(p));
    }));
    return out;
  })();
  return cache;
}

export const uvLabel = (uv?: number) => (uv === undefined ? '' : uv < 3 ? 'thấp' : uv < 6 ? 'trung bình' : uv < 8 ? 'cao' : uv < 11 ? 'rất cao' : 'cực cao');
const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
export const windDirLabel = (deg: number) => DIRS[Math.round(deg / 45) % 8];
