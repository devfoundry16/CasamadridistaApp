/**
 * A post's Insights (GET /posts/:id/insights) as the app reads them, and the
 * pin errors the "..." menu explains. Zero imports, so
 * `utils/__tests__/postInsights.test.mts` runs it under `node --test`.
 */

/** The share channels, in the order the screen lists them (backend postShareRules). */
export const SHARE_CHANNELS = ['native_share', 'copy_link', 'qr', 'dm', 'save'] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

export interface InsightsTotals {
  views: number;
  unique_viewers: number;
  opens: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  /** Visits to the shared web link (/p/<id>), one per visitor per day; not app views. */
  web_views: number;
}

export interface PostInsights {
  totals: InsightsTotals;
  channels: { channel: ShareChannel; count: number }[];
  series: { day: string; views: number; web_views: number }[];
  /** The day views started being counted per viewer; null when unknown. */
  trackedSince: string | null;
}

const TOTAL_KEYS: (keyof InsightsTotals)[] = ['views', 'unique_viewers', 'opens', 'likes', 'comments', 'saves', 'shares', 'web_views'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function normaliseInsights(raw: unknown): PostInsights {
  const w = (raw ?? {}) as Record<string, any>;
  const totals = {} as InsightsTotals;
  for (const key of TOTAL_KEYS) totals[key] = count(w.totals?.[key]);
  const series = (Array.isArray(w.series) ? w.series : [])
    .filter((d: any) => typeof d?.day === 'string' && DAY_RE.test(d.day))
    .map((d: any) => ({ day: d.day as string, views: count(d.views), web_views: count(d.web_views) }));
  return {
    totals,
    channels: SHARE_CHANNELS.map((channel) => ({ channel, count: count(w.shares_by_channel?.[channel]) })),
    series,
    trackedSince: typeof w.tracked_since === 'string' && DAY_RE.test(w.tracked_since) ? w.tracked_since : null,
  };
}

/** Bar heights for the daily views, scaled to the tallest day; a day with views shows at least 2 px. */
export function barHeights(series: { views: number }[], maxHeight: number): number[] {
  const top = Math.max(0, ...series.map((d) => d.views));
  if (!top) return series.map(() => 0);
  return series.map((d) => (d.views ? Math.max(2, Math.round((d.views / top) * maxHeight)) : 0));
}

/**
 * The 30-day chart as stacked bars: app views at the bottom, web link views on
 * top, both scaled to the day with the most of the two together. A part with
 * any views shows at least 2 px.
 */
export function stackedBars(series: { views: number; web_views: number }[], maxHeight: number): { app: number; web: number }[] {
  const top = Math.max(0, ...series.map((d) => d.views + d.web_views));
  const part = (n: number) => (top && n ? Math.max(2, Math.round((n / top) * maxHeight)) : 0);
  return series.map((d) => ({ app: part(d.views), web: part(d.web_views) }));
}

/** The message key for a refused pin, from the server's error code. */
export function pinErrorKey(code: string | null | undefined): string {
  if (code === 'pin_limit') return 'community.pin.limit';
  if (code === 'post_not_pinnable') return 'community.pin.notApproved';
  return 'community.pin.failed';
}
