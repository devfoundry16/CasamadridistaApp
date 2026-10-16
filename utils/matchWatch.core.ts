/**
 * The match page's admin-entered extras, as the app reads them: where to
 * watch, by country, and the two clubs' trophies (backend
 * matchExtrasController). API-Football has neither; the Casa Media desk
 * enters them. Zero imports, so `utils/__tests__/matchWatch.test.mts` runs it
 * under `node --test`.
 */

export const TROPHY_ORDER = [
  'league',
  'domestic_cup',
  'super_cup',
  'champions_league',
  'europa_league',
  'uefa_super_cup',
  'club_world_cup',
] as const;
export type TrophyCompetition = (typeof TROPHY_ORDER)[number];

export interface Channel {
  channel: string;
  url: string | null;
}

export interface Broadcasts {
  /** The viewer's country, or null when it is not known. */
  country: string | null;
  here: Channel[];
  worldwide: Channel[];
  others: { country_code: string; channels: Channel[] }[];
}

export interface TrophyClub {
  team_id: number;
  name: string | null;
  logo: string | null;
}

export interface Trophies {
  home: TrophyClub;
  away: TrophyClub;
  rows: { competition: TrophyCompetition; home: number; away: number }[];
  totals: { home: number; away: number };
  updatedAt: string | null;
}

const channelsOf = (list: unknown): Channel[] =>
  (Array.isArray(list) ? list : [])
    .filter((c: any) => typeof c?.channel === 'string' && c.channel.trim())
    .map((c: any) => ({
      channel: c.channel,
      url: typeof c.url === 'string' && /^https:\/\//.test(c.url) ? c.url : null,
    }));

/** GET /match/fixture/:id/broadcasts, folded into safe values; null when there is nothing to show. */
export function normaliseBroadcasts(raw: unknown): Broadcasts | null {
  const w = raw as Record<string, any> | null;
  if (!w || typeof w !== 'object') return null;
  const out: Broadcasts = {
    country: typeof w.country === 'string' && /^[A-Z]{2}$/.test(w.country) ? w.country : null,
    here: channelsOf(w.here),
    worldwide: channelsOf(w.worldwide),
    others: (Array.isArray(w.others) ? w.others : [])
      .filter((g: any) => typeof g?.country_code === 'string')
      .map((g: any) => ({ country_code: g.country_code, channels: channelsOf(g.channels) }))
      .filter((g: { channels: Channel[] }) => g.channels.length > 0),
  };
  return out.here.length || out.worldwide.length || out.others.length ? out : null;
}

const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
const club = (c: any): TrophyClub => ({
  team_id: Number(c?.team_id) || 0,
  name: typeof c?.name === 'string' ? c.name : null,
  logo: typeof c?.logo === 'string' ? c.logo : null,
});

/** GET /match/fixture/:id/trophies, folded into safe values; null when there is nothing to show. */
export function normaliseTrophies(raw: unknown): Trophies | null {
  const w = raw as Record<string, any> | null;
  if (!w || typeof w !== 'object') return null;
  const byCompetition = new Map<string, { home: number; away: number }>();
  for (const r of Array.isArray(w.rows) ? w.rows : []) {
    if (typeof r?.competition === 'string') byCompetition.set(r.competition, { home: count(r.home), away: count(r.away) });
  }
  const rows = TROPHY_ORDER.filter((c) => byCompetition.has(c)).map((competition) => ({
    competition,
    ...byCompetition.get(competition)!,
  }));
  if (!rows.length) return null;
  return {
    home: club(w.home),
    away: club(w.away),
    rows,
    totals: { home: count(w.totals?.home), away: count(w.totals?.away) },
    updatedAt: typeof w.updated_at === 'string' ? w.updated_at : null,
  };
}

/** A country's name in the app language, or its code when the name is not known. */
export function countryName(code: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' }).of(code);
    return name || code;
  } catch {
    return code;
  }
}
