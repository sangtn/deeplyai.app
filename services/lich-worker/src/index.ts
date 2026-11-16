// Cloudflare Worker for the Lịch âm section of deeplyai.app.
//   GET  /v1/weather?lat=&lon=     MET Norway forecast for a location (coords rounded to 0.01°)
//   GET  /v1/market                exchange rates (+ opt-in gold / VN-Index sources)
//   GET  /v1/push/key              VAPID public key
//   POST /v1/push/subscribe        { subscription, topics: string[] }
//   POST /v1/push/unsubscribe      { endpoint }
//   GET  /v1/push/message?id=      today's notification for a subscription (read by the service worker)
// Cron (06:00 Vietnam): builds each subscriber's message and sends a payload-less push.

import { solarToLunar, LUNAR_MONTHS } from '../../../src/components/lich-viet/lunar';
import { PLACES, describe, summarize } from '../../../src/lib/lich/weather';
import { parseVietcombank } from '../../../src/lib/lich/market';

interface Env {
  PUSH: KVNamespace;
  ALLOWED_ORIGINS: string;
  MARKET_SOURCES: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_JWK: string;
  VAPID_SUBJECT: string;
}

const UA = 'DeeplyAiLichAm/1.0 (+https://deeplyai.app/vi/lich-am/thoi-tiet/)';
const json = (data: unknown, init: ResponseInit = {}, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers, ...(init.headers as Record<string, string>) } });

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
}

/** Cache a GET handler's response in the edge cache for `seconds`. */
async function cached(req: Request, key: string, seconds: number, make: () => Promise<Response>) {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache.lich-api/${key}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  const res = await make();
  if (res.ok) {
    const copy = new Response(res.body, res);
    copy.headers.set('Cache-Control', `public, max-age=${seconds}`);
    await cache.put(cacheKey, copy.clone());
    return copy;
  }
  return res;
}

// ---------- Weather ----------

async function weather(lat: number, lon: number) {
  const la = Math.round(lat * 100) / 100;
  const lo = Math.round(lon * 100) / 100;
  const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${la}&lon=${lo}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  return summarize({ slug: 'here', name: 'Vị trí của bạn', city: 'Vị trí của bạn', lat: la, lon: lo }, await res.json());
}

// ---------- Market ----------

const n = (v: unknown) => { const x = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(x) && x > 0 ? x : null; };

async function market(env: Env) {
  const sources = new Set(env.MARKET_SOURCES.split(',').map((s) => s.trim()).filter(Boolean));
  const out: Record<string, unknown> = { at: new Date().toISOString() };
  const vcb = await fetch('https://www.vietcombank.com.vn/api/exchangerates?date=now', { headers: { 'User-Agent': UA } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  out.fx = vcb ? parseVietcombank(vcb as never) : null;
  if (sources.has('pnj')) {
    // PNJ publishes prices in thousand đồng per chỉ; × 10,000 = đồng per lượng.
    const pnj = await fetch('https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00', { headers: { 'User-Agent': UA } }).then((r) => (r.ok ? r.json() : null)).catch(() => null) as { data?: Record<string, unknown>[] } | null;
    const sjc = pnj?.data?.find((x) => String(x.masp).toUpperCase() === 'SJC');
    out.goldSJC = sjc ? { buy: (n(sjc.giamua) ?? 0) * 10000, sell: (n(sjc.giaban) ?? 0) * 10000, source: 'PNJ' } : null;
  }
  if (sources.has('vndirect')) {
    const v = await fetch('https://api-finfo.vndirect.com.vn/v4/vnmarket_prices?q=code:VNINDEX&sort=date&size=1', { headers: { 'User-Agent': UA } }).then((r) => (r.ok ? r.json() : null)).catch(() => null) as { data?: Record<string, unknown>[] } | null;
    const d = v?.data?.[0];
    out.vnindex = d ? { value: n(d.close), change: Number(d.change) || 0, percent: Number(d.pctChange) || 0, date: d.date, source: 'VNDirect' } : null;
  }
  return out;
}

// ---------- Web Push (VAPID, payload-less) ----------

const b64u = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = new TextEncoder();
async function sha(text: string) { return b64u(await crypto.subtle.digest('SHA-256', enc.encode(text))).slice(0, 32); }

async function vapidHeader(endpoint: string, env: Env) {
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.VAPID_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${env.VAPID_PUBLIC_KEY}`;
}

interface Sub { endpoint: string; topics: string[]; createdAt: string }
const TOPICS = new Set(['ram-mung-1', ...PLACES.map((p) => `thoi-tiet:${p.slug}`)]);

async function buildMessage(sub: Sub, weatherCache: Map<string, string | null>) {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const d = now.getUTCDate(), m = now.getUTCMonth() + 1, y = now.getUTCFullYear();
  const l = solarToLunar(d, m, y);
  const lines: string[] = [];
  if (sub.topics.includes('ram-mung-1') && (l.day === 1 || l.day === 15)) lines.push(`Hôm nay là ${l.day === 1 ? 'mùng 1' : 'rằm'} ${LUNAR_MONTHS[l.month - 1].toLowerCase()}${l.leap ? ' nhuận' : ''}.`);
  for (const t of sub.topics.filter((x) => x.startsWith('thoi-tiet:'))) {
    const slug = t.slice('thoi-tiet:'.length);
    if (!weatherCache.has(slug)) {
      const place = PLACES.find((p) => p.slug === slug);
      let text: string | null = null;
      if (place) {
        const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${place.lat}&lon=${place.lon}`, { headers: { 'User-Agent': UA } }).catch(() => null);
        if (res?.ok) { const f = summarize(place, await res.json()); const t0 = f.days[0]; if (t0) text = `${place.name}: ${t0.min}–${t0.max}°C, ${describe(t0.symbol).text.toLowerCase()}${t0.rain >= 1 ? `, mưa khoảng ${t0.rain} mm` : ''}.`; }
      }
      weatherCache.set(slug, text);
    }
    const w = weatherCache.get(slug);
    if (w) lines.push(w);
  }
  if (!lines.length) return null;
  const pad = (v: number) => String(v).padStart(2, '0');
  return { title: `Lịch Việt · ${d}/${m} (${l.day}/${l.month} âm)`, body: lines.join(' '), url: `/vi/lich-am/ngay-${pad(d)}-${pad(m)}-${y}/` };
}

async function sendAll(env: Env) {
  const weatherCache = new Map<string, string | null>();
  let cursor: string | undefined;
  do {
    const page = await env.PUSH.list({ prefix: 'sub:', cursor });
    for (const k of page.keys) {
      const sub = await env.PUSH.get<Sub>(k.name, 'json');
      if (!sub) continue;
      const msg = await buildMessage(sub, weatherCache);
      if (!msg) continue;
      const id = k.name.slice(4);
      await env.PUSH.put(`msg:${id}`, JSON.stringify(msg), { expirationTtl: 36 * 3600 });
      const res = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: await vapidHeader(sub.endpoint, env), TTL: '43200', Urgency: 'normal', 'Content-Length': '0' } }).catch(() => null);
      if (res && (res.status === 404 || res.status === 410)) await env.PUSH.delete(k.name);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

// ---------- Router ----------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    try {
      if (url.pathname === '/v1/weather' && req.method === 'GET') {
        const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
        if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return json({ error: 'lat/lon' }, { status: 400 }, h);
        const key = `w/${lat.toFixed(2)},${lon.toFixed(2)}`;
        const res = await cached(req, key, 1800, async () => { const f = await weather(lat, lon); return f ? json(f) : json({ error: 'upstream' }, { status: 502 }); });
        return new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...h } });
      }
      if (url.pathname === '/v1/market' && req.method === 'GET') {
        const res = await cached(req, `m/${env.MARKET_SOURCES}`, 600, async () => json(await market(env)));
        return new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...h } });
      }
      if (url.pathname === '/v1/push/key') return json({ key: env.VAPID_PUBLIC_KEY || null }, {}, h);
      if (url.pathname === '/v1/push/subscribe' && req.method === 'POST') {
        const body = await req.json() as { subscription?: { endpoint?: string }; topics?: string[] };
        const endpoint = body.subscription?.endpoint;
        if (!endpoint || !/^https:\/\//.test(endpoint)) return json({ error: 'subscription' }, { status: 400 }, h);
        const topics = (body.topics ?? []).filter((t) => TOPICS.has(t)).slice(0, 5);
        const id = await sha(endpoint);
        await env.PUSH.put(`sub:${id}`, JSON.stringify({ endpoint, topics, createdAt: new Date().toISOString() } satisfies Sub));
        return json({ id, topics }, {}, h);
      }
      if (url.pathname === '/v1/push/unsubscribe' && req.method === 'POST') {
        const body = await req.json() as { endpoint?: string };
        if (body.endpoint) await env.PUSH.delete(`sub:${await sha(body.endpoint)}`);
        return json({ ok: true }, {}, h);
      }
      if (url.pathname === '/v1/push/message') {
        const id = url.searchParams.get('id') ?? '';
        const msg = /^[A-Za-z0-9_-]{32}$/.test(id) ? await env.PUSH.get(`msg:${id}`, 'json') : null;
        return json(msg ?? { title: 'Lịch Việt', body: 'Xem lịch âm hôm nay', url: '/vi/lich-am/' }, {}, h);
      }
      return json({ error: 'not found' }, { status: 404 }, h);
    } catch {
      return json({ error: 'server' }, { status: 500 }, h);
    }
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (env.VAPID_PRIVATE_JWK && env.VAPID_PUBLIC_KEY) ctx.waitUntil(sendAll(env));
  },
};
