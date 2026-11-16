// Compares the site's lunar engine with the Lịch Việt app's own engine for every day 1900–2100.
// Input: all.jsonl produced by dump.m (see run.sh). Exits non-zero on any mismatch.
import { readFileSync } from 'node:fs';
import { CHI, dayInfo, lunarToSolar } from '../../src/components/lich-viet/lunar';

const file = process.argv[2];
const fails: Record<string, number> = {};
const examples: Record<string, string> = {};
const bad = (k: string, s: string) => { fails[k] = (fails[k] ?? 0) + 1; examples[k] ??= s; };
const lines = readFileSync(file, 'utf8').trim().split('\n');
for (const line of lines) {
  const r = JSON.parse(line);
  const d = +r.Day, m = +r.Month, y = +r.Year;
  const i = dayInfo(d, m, y);
  const [ld, lm, ly, leap] = r.VNLunar;
  const tag = `${d}/${m}/${y}`;
  if (i.lunar.day !== ld || i.lunar.month !== lm || i.lunar.year !== ly || +i.lunar.leap !== leap) bad('solarToLunar', tag);
  const back = lunarToSolar(ld, lm, ly, !!leap);
  if (!back || back.day !== d || back.month !== m || back.year !== y) bad('lunarToSolar', tag);
  if (i.dayCanChi !== r.DayOfVietnamese) bad('dayCanChi', tag);
  if (!r.MonthOfVietnamese.startsWith(i.monthCanChi)) bad('monthCanChi', tag);
  if (i.yearCanChi !== r.YearOfVietnamese) bad('yearCanChi', tag);
  if (i.goodHours.map((h) => CHI[h]).join(' - ') !== r.HoroscopeHours) bad('goodHours', tag);
}
console.log(`${lines.length} days checked`, Object.keys(fails).length ? { fails, examples } : 'all match');
process.exit(Object.keys(fails).length ? 1 : 0);
