// Rating bands and the age rule for "Xem ngày tốt". No imports, so pages can ship it to the browser.

export type Rating = 'excellent' | 'good' | 'neutral' | 'bad';
export const RATING_LABEL: Record<Rating, string> = { excellent: 'Rất tốt', good: 'Tốt', neutral: 'Bình thường', bad: 'Xấu' };

export const rate = (score: number): Rating => (score >= 6 ? 'excellent' : score >= 2 ? 'good' : score >= -2 ? 'neutral' : 'bad');

const CHI_NAMES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const LUC_HAI: Record<number, number> = { 0: 7, 7: 0, 1: 6, 6: 1, 2: 5, 5: 2, 3: 4, 4: 3, 8: 11, 11: 8, 9: 10, 10: 9 };
const LUC_PHA: Record<number, number> = { 0: 9, 9: 0, 1: 4, 4: 1, 2: 11, 11: 2, 3: 6, 6: 3, 5: 8, 8: 5, 7: 10, 10: 7 };
const TAM_HINH = [[2, 5, 8], [1, 10, 7], [0, 3]];

/** The app's age rule: clash −6, harm/break/punishment −2, three-harmony or six-harmony +2. */
export function ageAdjust(dayChi: number, birthYear: number): { delta: number; note: string; good: boolean } | null {
  const tuoi = ((birthYear - 4) % 12 + 12) % 12;
  if ((tuoi - dayChi + 12) % 12 === 6) return { delta: -6, note: `Ngày ${CHI_NAMES[dayChi]} xung tuổi ${CHI_NAMES[tuoi]}`, good: false };
  if (tuoi !== dayChi) {
    if (LUC_HAI[dayChi] === tuoi) return { delta: -2, note: `Ngày hại tuổi ${CHI_NAMES[tuoi]}`, good: false };
    if (LUC_PHA[dayChi] === tuoi) return { delta: -2, note: `Ngày phá tuổi ${CHI_NAMES[tuoi]}`, good: false };
    if (TAM_HINH.some((g) => g.includes(dayChi) && g.includes(tuoi))) return { delta: -2, note: `Ngày hình tuổi ${CHI_NAMES[tuoi]}`, good: false };
  }
  if ([(tuoi + 4) % 12, (tuoi + 8) % 12].includes(dayChi)) return { delta: 2, note: `Ngày tam hợp với tuổi ${CHI_NAMES[tuoi]}`, good: true };
  if ((tuoi + dayChi) % 12 === 1) return { delta: 2, note: `Ngày lục hợp với tuổi ${CHI_NAMES[tuoi]}`, good: true };
  return null;
}
