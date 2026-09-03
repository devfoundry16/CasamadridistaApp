import { formatDistanceToNowStrict } from 'date-fns';
import i18n from '@/i18n';

/**
 * "3 min ago" for a publish timestamp.
 *
 * `date-fns` locales are not bundled for Arabic here, so under `ar-SA` this
 * falls back to a compact, digit-first form rather than shipping English words
 * into an Arabic UI. Returns null for a missing/unparseable date so callers can
 * drop the separator instead of rendering "· Invalid Date".
 */
export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  if (i18n.language?.startsWith('ar')) {
    const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
    if (minutes < 60) return i18n.t('casaMedia.timeMinutes', { value: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return i18n.t('casaMedia.timeHours', { value: hours });
    return i18n.t('casaMedia.timeDays', { value: Math.round(hours / 24) });
  }

  try {
    return `${formatDistanceToNowStrict(date)} ago`;
  } catch {
    return null;
  }
}

/** `HH:mm` for timeline rows. Locale-formatted; the strip itself is pinned LTR. */
export function clockTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
