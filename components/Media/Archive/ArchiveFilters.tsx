import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import PickerPill, { type PickerOption } from '@/components/Team/PickerPill';
import type { MediaArchiveFilters, MediaItemType } from '@/types/media/casaMedia';

export interface ArchiveFilterValue {
  season?: number;
  league_id?: number;
  opponent_team_id?: number;
  /** §21's content-type filter — matches that have at least one of this type. */
  type?: MediaItemType;
  /** §21's date range, as a kickoff window. */
  from?: string;
  to?: string;
}

/**
 * Date presets rather than a range picker.
 *
 * §21 asks for a date filter. The app has exactly one date picker
 * (`Contributor/SchedulePicker`) and it is single-value, so a real range would
 * mean building range UI for a filter that is, in practice, used as "this
 * season" or "the last few months". These are relative windows computed at
 * render time, so they never go stale.
 */
const DATE_PRESETS = [
  { key: 'all', days: null },
  { key: 'last30', days: 30 },
  { key: 'last90', days: 90 },
  { key: 'last365', days: 365 },
] as const;

type DatePresetKey = (typeof DATE_PRESETS)[number]['key'];

function presetFrom(days: number | null): string | undefined {
  if (days === null) return undefined;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

interface Props {
  filters: MediaArchiveFilters | undefined;
  value: ArchiveFilterValue;
  onChange: (next: ArchiveFilterValue) => void;
}

const ALL = -1;

/**
 * Season / competition / opponent pills for the archive.
 *
 * Uses `Team/PickerPill`, which presents its options in an RN `Modal` — the
 * archive list scrolls horizontally under these pills, and an in-scene overlay
 * would be caught by that scroll view.
 */
export default function ArchiveFilters({ filters, value, onChange }: Props) {
  const { t } = useTranslation();

  const seasonOptions: PickerOption<number>[] = [
    { value: ALL, label: t('casaMedia.allSeasons') },
    ...(filters?.seasons ?? []).map((season) => ({
      value: season,
      label: `${season}/${String((season + 1) % 100).padStart(2, '0')}`,
    })),
  ];

  const leagueOptions: PickerOption<number>[] = [
    { value: ALL, label: t('casaMedia.allCompetitions') },
    ...(filters?.leagues ?? []).map((league) => ({
      value: league.id,
      label: league.name,
      iconUri: league.logo ?? undefined,
    })),
  ];

  const opponentOptions: PickerOption<number>[] = [
    { value: ALL, label: t('casaMedia.allOpponents') },
    // `MediaTeamRef.id` is nullable because an item-embedded match ref carries
    // no team ids. The archive filter list always has them (they come from
    // `matches.opponent_team_id`), but a row without one cannot be filtered on.
    ...(filters?.opponents ?? [])
      .filter((team): team is typeof team & { id: number } => team.id != null)
      .map((team) => ({
        value: team.id,
        label: team.name,
        iconUri: team.logo ?? undefined,
      })),
  ];

  const typeOptions: PickerOption<string>[] = [
    { value: 'all', label: t('casaMedia.allTypes') },
    ...(filters?.types ?? []).map((row) => ({
      value: row.type,
      label: `${t(`casaMedia.collection.${row.type === 'photo' ? 'photos' : row.type === 'video' ? 'videos' : row.type === 'story' ? 'stories' : 'galleries'}`)} (${row.count})`,
    })),
  ];

  const dateOptions: PickerOption<DatePresetKey>[] = DATE_PRESETS.map((preset) => ({
    value: preset.key,
    label: t(`casaMedia.date.${preset.key}`),
  }));

  // Which preset the current `from` came from, so the pill shows the label the
  // user picked rather than recomputing a window and failing to match.
  const activePreset: DatePresetKey =
    DATE_PRESETS.find((preset) => {
      if (preset.days === null) return !value.from;
      if (!value.from) return false;
      const expected = Date.now() - preset.days * 86_400_000;
      // A minute of tolerance: `from` was computed on an earlier render.
      return Math.abs(Date.parse(value.from) - expected) < 60_000;
    })?.key ?? 'all';

  const set = (key: keyof ArchiveFilterValue, next: number) =>
    onChange({ ...value, [key]: next === ALL ? undefined : next });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}
    >
      <PickerPill
        title={t('casaMedia.season')}
        options={seasonOptions}
        value={value.season ?? ALL}
        onChange={(next) => set('season', next)}
        numeric
      />
      <PickerPill
        title={t('casaMedia.competition')}
        options={leagueOptions}
        value={value.league_id ?? ALL}
        onChange={(next) => set('league_id', next)}
        maxWidth={190}
      />
      <PickerPill
        title={t('casaMedia.opponent')}
        options={opponentOptions}
        value={value.opponent_team_id ?? ALL}
        onChange={(next) => set('opponent_team_id', next)}
        maxWidth={190}
      />
      <PickerPill
        title={t('casaMedia.type')}
        options={typeOptions}
        value={value.type ?? 'all'}
        onChange={(next) =>
          onChange({ ...value, type: next === 'all' ? undefined : (next as MediaItemType) })
        }
        maxWidth={190}
      />
      <PickerPill
        title={t('casaMedia.date.title')}
        options={dateOptions}
        value={activePreset}
        onChange={(next) => {
          const preset = DATE_PRESETS.find((p) => p.key === next);
          onChange({ ...value, from: presetFrom(preset?.days ?? null), to: undefined });
        }}
        maxWidth={190}
      />
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}
