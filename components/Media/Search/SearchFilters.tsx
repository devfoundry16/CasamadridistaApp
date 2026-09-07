import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import PickerPill, { type PickerOption } from '@/components/Team/PickerPill';
import type { MediaSearchQuery } from '@/services/CasaMediaService';
import type { MediaItemType, MediaSearchFilterOptions } from '@/types/media/casaMedia';

interface Props {
  options: MediaSearchFilterOptions | undefined;
  value: MediaSearchQuery;
  onChange: (next: MediaSearchQuery) => void;
}

const ALL_NUMBER = -1;
const ALL = 'all';

const TYPE_LABEL_KEY: Record<MediaItemType, string> = {
  photo: 'casaMedia.collection.photos',
  video: 'casaMedia.collection.videos',
  story: 'casaMedia.collection.stories',
  gallery: 'casaMedia.collection.galleries',
};

/** Relative windows, computed at render so they cannot go stale. */
const DATE_PRESETS = [
  { key: 'all', days: null },
  { key: 'last30', days: 30 },
  { key: 'last90', days: 90 },
  { key: 'last365', days: 365 },
] as const;

type DatePresetKey = (typeof DATE_PRESETS)[number]['key'];

/**
 * §22's filter row: type, competition, season, opponent, contributor, date.
 *
 * Same `PickerPill` recipe as `Archive/ArchiveFilters` — the options open in an
 * RN `Modal` rather than an in-scene overlay, because this row sits above a
 * scrolling result grid.
 *
 * The options come from `GET /search/filters`, which derives them from content
 * that actually exists. A hard-coded competition list eventually offers La Liga
 * seasons nothing was ever published for, and a filter that can only return
 * nothing is worse than no filter.
 */
export default function SearchFilters({ options, value, onChange }: Props) {
  const { t } = useTranslation();

  const typeOptions: PickerOption<string>[] = [
    { value: ALL, label: t('casaMedia.allTypes') },
    ...(options?.media_types ?? []).map((type) => ({
      value: type,
      label: t(TYPE_LABEL_KEY[type]),
    })),
  ];

  const seasonOptions: PickerOption<number>[] = [
    { value: ALL_NUMBER, label: t('casaMedia.allSeasons') },
    ...(options?.seasons ?? []).map((season) => ({
      value: season,
      label: `${season}/${String((season + 1) % 100).padStart(2, '0')}`,
    })),
  ];

  const leagueOptions: PickerOption<number>[] = [
    { value: ALL_NUMBER, label: t('casaMedia.allCompetitions') },
    ...(options?.leagues ?? []).map((league) => ({
      value: league.id,
      label: league.name,
      iconUri: league.logo ?? undefined,
    })),
  ];

  const opponentOptions: PickerOption<number>[] = [
    { value: ALL_NUMBER, label: t('casaMedia.allOpponents') },
    // `MediaTeamRef.id` is nullable — a row without one cannot be filtered on.
    ...(options?.opponents ?? [])
      .filter((team): team is typeof team & { id: number } => team.id != null)
      .map((team) => ({ value: team.id, label: team.name, iconUri: team.logo ?? undefined })),
  ];

  const contributorOptions: PickerOption<string>[] = [
    { value: ALL, label: t('casaMedia.allContributors') },
    ...(options?.contributors ?? []).map((person) => ({
      value: person.id,
      label: person.display_name ?? t('casaMedia.contributor'),
    })),
  ];

  const dateOptions: PickerOption<DatePresetKey>[] = DATE_PRESETS.map((preset) => ({
    value: preset.key,
    label: t(`casaMedia.date.${preset.key}`),
  }));

  const activePreset: DatePresetKey =
    DATE_PRESETS.find((preset) => {
      if (preset.days === null) return !value.from;
      if (!value.from) return false;
      return Math.abs(Date.parse(value.from) - (Date.now() - preset.days * 86_400_000)) < 60_000;
    })?.key ?? 'all';

  const setNumber = (key: keyof MediaSearchQuery, next: number) =>
    onChange({ ...value, [key]: next === ALL_NUMBER ? undefined : next });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
    >
      <PickerPill
        title={t('casaMedia.type')}
        options={typeOptions}
        value={value.type ?? ALL}
        onChange={(next) =>
          onChange({ ...value, type: next === ALL ? undefined : (next as MediaItemType) })
        }
        maxWidth={160}
      />
      <PickerPill
        title={t('casaMedia.competition')}
        options={leagueOptions}
        value={value.league_id ?? ALL_NUMBER}
        onChange={(next) => setNumber('league_id', next)}
        maxWidth={190}
      />
      <PickerPill
        title={t('casaMedia.season')}
        options={seasonOptions}
        value={value.season ?? ALL_NUMBER}
        onChange={(next) => setNumber('season', next)}
        numeric
      />
      <PickerPill
        title={t('casaMedia.opponent')}
        options={opponentOptions}
        value={value.opponent_team_id ?? ALL_NUMBER}
        onChange={(next) => setNumber('opponent_team_id', next)}
        maxWidth={190}
      />
      <PickerPill
        title={t('casaMedia.contributor')}
        options={contributorOptions}
        value={value.contributor_id ?? ALL}
        onChange={(next) =>
          onChange({ ...value, contributor_id: next === ALL ? undefined : next })
        }
        maxWidth={190}
      />
      <PickerPill
        title={t('casaMedia.date.title')}
        options={dateOptions}
        value={activePreset}
        onChange={(next) => {
          const preset = DATE_PRESETS.find((p) => p.key === next);
          onChange({
            ...value,
            from:
              preset?.days == null
                ? undefined
                : new Date(Date.now() - preset.days * 86_400_000).toISOString(),
          });
        }}
        maxWidth={190}
      />
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}
