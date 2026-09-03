import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import PickerPill, { type PickerOption } from '@/components/Team/PickerPill';
import type { MediaArchiveFilters } from '@/types/media/casaMedia';

export interface ArchiveFilterValue {
  season?: number;
  league_id?: number;
  opponent_team_id?: number;
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
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}
