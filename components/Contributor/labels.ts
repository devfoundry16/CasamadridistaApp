import type { TFunction } from 'i18next';

import Colors from '@/constants/colors';
import type { ContributorItem, ContributorMatch } from '@/types/media/contributor';

/**
 * "Real Madrid v Girona" from whichever half of the row the server filled in.
 *
 * `matchService` sometimes hands back `home_team_name`/`away_team_name` and
 * sometimes only `opponent_name` + `is_home`; both spellings are read so a
 * match pill never renders as an empty string.
 */
export function matchLabel(match: ContributorMatch | null | undefined, fallback: string): string {
  if (!match) return fallback;
  if (match.home_team_name && match.away_team_name) {
    return `${match.home_team_name} — ${match.away_team_name}`;
  }
  if (match.opponent_name) {
    return match.is_home ? `Real Madrid — ${match.opponent_name}` : `${match.opponent_name} — Real Madrid`;
  }
  return `#${match.id}`;
}

/** `2026-09-02` — digits only, never locale month names next to Arabic. */
export function matchDateLabel(match: ContributorMatch | null | undefined): string | null {
  if (!match?.kickoff_at) return null;
  const date = new Date(match.kickoff_at);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Badge colour per status.
 *
 * Anything unrecognised is neutral rather than absent — the schema and the
 * plan disagree by two statuses (`changes_requested`, `expired`) and a server
 * that grows a third must not render a blank badge.
 */
export function statusTone(status: string): { bg: string; fg: string } {
  switch (status) {
    case 'published':
      return { bg: 'rgba(16,185,129,0.16)', fg: Colors.status.success };
    case 'scheduled':
    case 'approved':
      return { bg: 'rgba(188,144,69,0.18)', fg: Colors.darkGold };
    case 'pending_review':
      return { bg: 'rgba(245,158,11,0.16)', fg: Colors.status.warning };
    case 'rejected':
    case 'removed':
      return { bg: 'rgba(239,68,68,0.16)', fg: Colors.status.error };
    case 'changes_requested':
      return { bg: 'rgba(249,115,22,0.16)', fg: Colors.zone.relegationPlayoff };
    default:
      return { bg: Colors.background.light, fg: Colors.text.tertiary };
  }
}

export function statusLabel(t: TFunction, status: string): string {
  const key = `contributor.status.${status}`;
  const translated = t(key);
  // i18next returns the key itself when it is missing; show the raw status
  // rather than a dotted path.
  return translated === key ? status.replace(/_/g, ' ') : translated;
}

/** Bytes → "12.4 MB". Digits only, so it is bidi-safe. */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The thumbnail an editorial item can show in a list. */
export function itemThumbnail(item: ContributorItem): string | null {
  if (item.cover_url) return item.cover_url;
  const asset = item.assets?.find((a) => a.thumbnail_url) ?? item.assets?.[0];
  return asset?.thumbnail_url ?? asset?.url ?? null;
}
