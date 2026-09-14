/**
 * The app's type scale — the first one it has had.
 *
 * Six steps, each a tightening of a cluster already in use across the codebase
 * (`text-[11px]`, `text-[13px]`, `text-sm`, `text-[17px]`…) rather than an
 * invented set. No new typeface: English stays on the system font and Arabic on
 * Cairo, via `components/Text`.
 *
 * Arabic gets taller line heights. Cairo's ascenders and diacritics clip at
 * Latin leading — the same bump `app/(tabs)/team/_layout.tsx` applies by hand (13px: 18 → 22).
 */
export const TYPE = {
  caption: { fontSize: 11, lineHeight: 14 },
  footnote: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 21 },
  headline: { fontSize: 17, lineHeight: 22 },
  title: { fontSize: 20, lineHeight: 26 },
  display: { fontSize: 28, lineHeight: 34 },
} as const;

export type TypeStep = keyof typeof TYPE;

export function typeStyle(step: TypeStep, isArabic: boolean): { fontSize: number; lineHeight: number } {
  const base = TYPE[step];
  return isArabic ? { fontSize: base.fontSize, lineHeight: base.lineHeight + Math.round(base.fontSize * 0.3) } : base;
}
