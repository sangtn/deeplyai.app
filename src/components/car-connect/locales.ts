// Languages for the Car Connect page. EN and VI are real pages (indexed, with hreflang);
// the others are applied in the browser from /apps/car-play-connect/i18n/<code>.json,
// built from the files in ./i18n. They mirror the 10 languages the app itself ships in.
import type { Copy } from './copy';

export interface Locale { code: string; flag: string; name: string; htmlLang: string; href?: string }

export const LOCALES: Locale[] = [
  { code: 'en', flag: '🇺🇸', name: 'English', htmlLang: 'en', href: '/apps/car-play-connect/' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt', htmlLang: 'vi', href: '/vi/apps/car-play-connect/' },
  { code: 'fr', flag: '🇫🇷', name: 'Français', htmlLang: 'fr' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', htmlLang: 'de' },
  { code: 'es', flag: '🇪🇸', name: 'Español', htmlLang: 'es' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano', htmlLang: 'it' },
  { code: 'ja', flag: '🇯🇵', name: '日本語', htmlLang: 'ja' },
  { code: 'ko', flag: '🇰🇷', name: '한국어', htmlLang: 'ko' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский', htmlLang: 'ru' },
  { code: 'zh', flag: '🇨🇳', name: '简体中文', htmlLang: 'zh-Hans' },
];

export const CLIENT_LOCALES = LOCALES.filter((l) => !l.href).map((l) => l.code);

/** Flattens the copy into { 'features.2.points.1': '…' } — the keys used by data-i18n. */
export function flatten(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof value === 'string') out[prefix] = value;
  else if (Array.isArray(value)) value.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) flatten(item, prefix ? `${prefix}.${key}` : key, out);
  return out;
}

const files = import.meta.glob<{ default: Copy }>('./i18n/*.ts', { eager: true });
export const TRANSLATIONS: Record<string, Copy> = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.match(/([a-z]+)\.ts$/)![1], mod.default]),
);

// A translation that drifts from the English structure fails the build instead of
// leaving English holes on the page.
import { COPY } from './copy';
const reference = flatten(COPY.en);
const FIXED = /^(jumpLinks\.\d+\.0|driveCaptions\.\d+\.0|features\.\d+\.id|compat\.cards\.\d+\.tone|h1)$/;
for (const [code, copy] of Object.entries(TRANSLATIONS)) {
  const dict = flatten(copy);
  const missing = Object.keys(reference).filter((key) => !(key in dict));
  const extra = Object.keys(dict).filter((key) => !(key in reference));
  const changed = Object.keys(reference).filter((key) => FIXED.test(key) && dict[key] !== reference[key]);
  const placeholders = ['ratingLine', 'requires'].filter((key) => (reference[key].match(/\{\w\}/g) ?? []).some((p) => !dict[key]?.includes(p)));
  if (missing.length || extra.length || changed.length || placeholders.length) {
    throw new Error(`Car Connect i18n/${code}.ts: missing ${missing.join(', ') || '-'}; extra ${extra.join(', ') || '-'}; changed ids ${changed.join(', ') || '-'}; placeholders ${placeholders.join(', ') || '-'}`);
  }
}
