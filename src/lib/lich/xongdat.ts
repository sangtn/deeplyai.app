// Xông đất (first-footer) age picker, ported from the LichViet iOS app (XongDat2026ViewController +
// ZodiacCompatibilityData). The app only ships rules for Đinh Mùi 2027; for that year this module
// returns the app's text verbatim. For other years it applies the rule the 2027 table follows
// (verified to reproduce every 2027 rule exactly), flagged with source: 'derived'.
import data from '../../data/lich/xong-dat.json';

export type Chi = 'Tý' | 'Sửu' | 'Dần' | 'Mão' | 'Thìn' | 'Tỵ' | 'Ngọ' | 'Mùi' | 'Thân' | 'Dậu' | 'Tuất' | 'Hợi';
export type Can = 'Giáp' | 'Ất' | 'Bính' | 'Đinh' | 'Mậu' | 'Kỷ' | 'Canh' | 'Tân' | 'Nhâm' | 'Quý';
export type Element = 'Kim' | 'Mộc' | 'Thuỷ' | 'Hoả' | 'Thổ';
export type Relation = 'tam-hop' | 'luc-hop' | 'hop-nam';
export type ThaiTue = 'Trực Thái Tuế' | 'Xung Thái Tuế' | 'Hại Thái Tuế' | 'Phá Thái Tuế';

export const CHI: Chi[] = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const CAN: Can[] = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
/** The only lunar year the app has hand-written rules for. */
export const XONG_DAT_APP_YEAR = data.appYear.year;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const chiIdx = (c: Chi) => CHI.indexOf(c);

// Tam hợp triads in the order the app lists them (Hợi-Mão-Mùi is listed Mão, Hợi in the app data).
const TAM_HOP: Chi[][] = [['Thân', 'Tý', 'Thìn'], ['Tỵ', 'Dậu', 'Sửu'], ['Dần', 'Ngọ', 'Tuất'], ['Mão', 'Hợi', 'Mùi']];
const LUC_HOP = (i: number) => mod(1 - i, 12);
const LUC_HAI: Record<number, number> = { 0: 7, 7: 0, 1: 6, 6: 1, 2: 5, 5: 2, 3: 4, 4: 3, 8: 11, 11: 8, 9: 10, 10: 9 };
const LUC_PHA: Record<number, number> = { 0: 9, 9: 0, 1: 4, 4: 1, 2: 11, 11: 2, 3: 6, 6: 3, 5: 8, 8: 5, 7: 10, 10: 7 };
const TAM_HINH: number[][] = [[2, 5, 8], [1, 10, 7], [0, 3]];
const ELEMENTS_BY_STEM: Element[] = ['Mộc', 'Hoả', 'Thổ', 'Kim', 'Thuỷ']; // stem index >> 1
const SINH: Record<Element, Element> = { Mộc: 'Hoả', Hoả: 'Thổ', Thổ: 'Kim', Kim: 'Thuỷ', Thuỷ: 'Mộc' };

const tamHopOf = (c: Chi) => TAM_HOP.find((t) => t.includes(c))!.filter((x) => x !== c);
const lucHopOf = (c: Chi) => CHI[LUC_HOP(chiIdx(c))];

export interface CanChiYear { year: number; can: Can; chi: Chi; canChi: string; napAm: string; element: Element }

/** Can chi + nạp âm of a lunar year (napAm names from the app's VNLunar.m). */
export function canChiOfYear(year: number): CanChiYear {
  const can = CAN[mod(year - 4, 10)];
  const chi = CHI[mod(year - 4, 12)];
  const n = data.napAm[mod(year - 4, 60)];
  return { year, can, chi, canChi: `${can} ${chi}`, napAm: n.napAm, element: n.element as Element };
}

/** Branches that clash with the year's Thái Tuế, in the order the app lists them. */
export function thaiTueConflicts(yearChi: Chi): { chi: Chi; label: ThaiTue }[] {
  const y = chiIdx(yearChi);
  return [
    { chi: yearChi, label: 'Trực Thái Tuế' as ThaiTue },
    { chi: CHI[mod(y + 6, 12)], label: 'Xung Thái Tuế' as ThaiTue },
    { chi: CHI[LUC_HAI[y]], label: 'Hại Thái Tuế' as ThaiTue },
    { chi: CHI[LUC_PHA[y]], label: 'Phá Thái Tuế' as ThaiTue },
  ];
}

const hostConflict = (a: Chi, b: Chi) => {
  const i = chiIdx(a), j = chiIdx(b);
  return mod(i - j, 12) === 6 || LUC_HAI[i] === j || LUC_PHA[i] === j || TAM_HINH.some((g) => g.includes(i) && g.includes(j));
};

/** Stems to avoid: same-polarity stems that overcome the year stem, or that the year stem overcomes. */
export function avoidStems(yearCan: Can): Can[] {
  const i = CAN.indexOf(yearCan), e = i >> 1, p = i & 1;
  const overcomes = (a: number, b: number) => mod(b - a, 5) === 2;
  const res: Can[] = [];
  for (let k = 0; k < 10; k++) if ((k & 1) === p && (overcomes(k >> 1, e) || overcomes(e, k >> 1))) res.push(CAN[k]);
  return res.sort((a, b) => (overcomes(CAN.indexOf(b) >> 1, e) ? 1 : 0) - (overcomes(CAN.indexOf(a) >> 1, e) ? 1 : 0));
}
/** Ngũ hợp partner stem (Giáp-Kỷ, Ất-Canh, Bính-Tân, Đinh-Nhâm, Mậu-Quý). */
export const hopStem = (yearCan: Can): Can => CAN[mod(CAN.indexOf(yearCan) + 5, 10)];
/** Nạp âm elements in tương sinh with the year's nạp âm (the one that produces it, the one it produces). */
export const sinhElements = (el: Element): Element[] => [(Object.keys(SINH) as Element[]).find((k) => SINH[k] === el)!, SINH[el]];

export interface Candidate extends CanChiYear {
  /** Tuổi âm in the target year. */
  age: number;
  bonuses: string[];
}
export interface Pick { rank: number; chi: Chi; relations: Relation[]; years: Candidate[] }
export interface XongDatResult {
  hostBirthYear: number;
  host: CanChiYear;
  target: CanChiYear;
  /** 'app' = hand-written app rule (2027 only); 'derived' = generalized rule. */
  source: 'app' | 'derived';
  /** Recommended con giáp in the app's order, each with eligible guest birth years. */
  picks: Pick[];
  /** All candidate years flattened, sorted by bonus count (desc), then pick order, then year. */
  ranked: Candidate[];
  /** Branches the rule skipped because they clash with Thái Tuế. */
  excluded: { chi: Chi; relation: Relation; label: ThaiTue }[];
  reason: string;
  description: string;
  /** The text the app shows in its result card (identical to the app for source 'app'). */
  resultText: string;
  adviceText: string;
  avoid: { chi: { chi: Chi; label: ThaiTue }[]; stems: Can[] };
  favorable: { stem: Can; elements: Element[]; yearHopChi: Chi[] };
}

/** Guest birth-year window the 2027 app table uses: ages 20–70 (target − 70 … target − 20). */
export const GUEST_MIN_AGE = 20;
export const GUEST_MAX_AGE = 70;

function derivePicks(host: Chi, target: CanChiYear) {
  const conflicts = thaiTueConflicts(target.chi);
  const bad = new Map(conflicts.map((c) => [c.chi, c.label] as const));
  const picks: { chi: Chi; relations: Relation[] }[] = [];
  const excluded: XongDatResult['excluded'] = [];
  const consider = (c: Chi, rel: Relation) => {
    if (bad.has(c)) excluded.push({ chi: c, relation: rel, label: bad.get(c)! });
    else picks.push({ chi: c, relations: [rel] });
  };
  tamHopOf(host).forEach((c) => consider(c, 'tam-hop'));
  consider(lucHopOf(host), 'luc-hop');
  if (picks.length < 2) {
    // App behaviour (host Ngọ in 2027): top up with branches that harmonise with the year itself.
    for (const c of [...tamHopOf(target.chi), lucHopOf(target.chi)]) {
      if (picks.length >= 2) break;
      if (c === host || bad.has(c) || picks.some((p) => p.chi === c) || hostConflict(c, host)) continue;
      picks.push({ chi: c, relations: ['hop-nam'] });
    }
  }
  return { picks, excluded };
}

function candidateYears(chi: Chi, target: CanChiYear): CanChiYear[] {
  const skip = avoidStems(target.can);
  const out: CanChiYear[] = [];
  for (let y = target.year - GUEST_MAX_AGE; y <= target.year - GUEST_MIN_AGE; y++) {
    const cc = canChiOfYear(y);
    if (cc.chi === chi && !skip.includes(cc.can)) out.push(cc);
  }
  return out;
}

const REL_LABEL: Record<Relation, string> = { 'tam-hop': 'Tam hợp', 'luc-hop': 'Lục hợp', 'hop-nam': 'hợp năm' };

function derivedText(host: Chi, target: CanChiYear, picks: Pick[], excluded: XongDatResult['excluded']) {
  const groups = (rel: Relation) => picks.filter((p) => p.relations.includes(rel)).map((p) => p.chi);
  const parts: string[] = [];
  const th = groups('tam-hop'), lh = groups('luc-hop'), hn = groups('hop-nam');
  if (th.length) parts.push(`${th.join(', ')} Tam hợp`);
  if (lh.length) parts.push(`${lh.join(', ')} Lục hợp`);
  let reason = parts.length ? `${parts.join(', ')} với ${host}.` : '';
  if (hn.length) reason += `${reason ? ' ' : ''}${hn.join(', ')} hợp với năm ${target.chi}.`;
  for (const e of excluded) reason += ` ${e.chi} dù ${REL_LABEL[e.relation]} với ${host} nhưng ${e.label} năm ${target.chi} nên tạm không chọn.`;
  const desc = `Chủ nhà tuổi ${host} nên chọn ` + picks.map((p) => `tuổi ${p.chi} (${p.years.map((y) => `${y.canChi} ${y.year}`).join(', ')})`).join(', ').replace(/, (tuổi [^,(]+\([^)]*\))$/, ' và $1');
  return { reason: reason.trim(), description: desc };
}

/**
 * Recommended first-footer ages.
 * @param hostBirthYear the host's LUNAR birth year (someone born in January before Tết uses the previous year).
 * @param targetLunarYear the lunar year being welcomed (e.g. 2027 for Tết Đinh Mùi).
 * @param mode 'auto' (default) uses app data for 2027 and the derived rule otherwise.
 */
export function getXongDat(hostBirthYear: number, targetLunarYear: number, mode: 'auto' | 'app' | 'derived' = 'auto'): XongDatResult {
  const host = canChiOfYear(hostBirthYear);
  const target = canChiOfYear(targetLunarYear);
  const useApp = mode === 'app' || (mode === 'auto' && targetLunarYear === XONG_DAT_APP_YEAR);
  if (mode === 'app' && targetLunarYear !== XONG_DAT_APP_YEAR) throw new Error(`App data only covers ${XONG_DAT_APP_YEAR}`);

  const favStem = hopStem(target.can);
  const favEls = sinhElements(target.element);
  const hostEls = (data.elementRules.find((r) => r.host === host.element)?.compatible ?? []) as Element[];
  const yearHop = [...tamHopOf(target.chi), lucHopOf(target.chi)];
  const toCandidate = (cc: CanChiYear): Candidate => {
    const bonuses: string[] = [];
    if (cc.can === favStem) bonuses.push(`Thiên can ${favStem} hợp can ${target.can} của năm ${target.canChi}`);
    if (favEls.includes(cc.element)) bonuses.push(`Nạp âm ${cc.napAm} (${cc.element}) tương sinh với ${target.napAm} của năm ${target.canChi}`);
    if (hostEls.includes(cc.element)) bonuses.push(`Mệnh ${cc.element} hợp mệnh ${host.element} của gia chủ`);
    return { ...cc, age: targetLunarYear - cc.year + 1, bonuses };
  };

  const derived = derivePicks(host.chi, target);
  let picks: Pick[];
  let reason: string, description: string;
  if (useApp) {
    const rule = data.zodiacRules.find((r) => r.host === host.chi)!;
    const years = data.candidateYearsByChi as Record<string, { canChi: string; year: number }[]>;
    picks = rule.compatible.map((c, i) => ({
      rank: i + 1,
      chi: c as Chi,
      relations: derived.picks.find((p) => p.chi === c)?.relations ?? [],
      years: (years[c] ?? []).map((y) => toCandidate(canChiOfYear(y.year))),
    }));
    reason = rule.reason;
    description = rule.description;
  } else {
    picks = derived.picks.map((p, i) => ({ rank: i + 1, ...p, years: candidateYears(p.chi, target).map(toCandidate) }));
    ({ reason, description } = derivedText(host.chi, target, picks, derived.excluded));
  }
  const ranked = picks
    .flatMap((p) => p.years.map((y) => ({ y, r: p.rank })))
    .sort((a, b) => b.y.bonuses.length - a.y.bonuses.length || a.r - b.r || a.y.year - b.y.year)
    .map((x) => x.y);
  const resultText = data.screen.resultTemplate
    .replace('{host}', () => host.chi)
    .replace('{compatible}', () => picks.map((p) => p.chi).join(', '))
    .replace('{reason}', () => reason)
    .replace('{description}', () => description);
  return {
    hostBirthYear, host, target, source: useApp ? 'app' : 'derived', picks, ranked, excluded: derived.excluded,
    reason, description, resultText, adviceText: data.screen.adviceText,
    avoid: { chi: thaiTueConflicts(target.chi), stems: avoidStems(target.can) },
    favorable: { stem: favStem, elements: favEls, yearHopChi: yearHop },
  };
}
