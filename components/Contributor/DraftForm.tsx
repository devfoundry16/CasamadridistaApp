import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Text } from '@/components/Text';
import Chip from '@/components/Team/Chip';
import PickerPill, { type PickerOption } from '@/components/Team/PickerPill';
import Colors from '@/constants/colors';
import { MEDIA_PHASES, type MediaAccessLevel, type MediaPhase } from '@/types/media/casaMedia';
import {
  CONTRIBUTOR_ITEM_TYPES,
  type ContributorAsset,
  type ContributorItemType,
  type ContributorMe,
  type MediaNotifyMode,
} from '@/types/media/contributor';
import AssetStrip from './AssetStrip';
import SchedulePicker from './SchedulePicker';
import { matchDateLabel, matchLabel } from './labels';

export interface DraftFormValue {
  type: ContributorItemType;
  match_id: number | null;
  match_phase: MediaPhase | null;
  category_id: string | null;
  title: string;
  short_description: string;
  caption: string;
  access_level: MediaAccessLevel | 'internal';
  /** Comma-separated in the field, split on save. */
  tags: string;
  publish_at: string | null;
  notify_mode: MediaNotifyMode;
  publish_when_ready: boolean;
}

const ACCESS_ORDER: (MediaAccessLevel | 'internal')[] = [
  'public',
  'registered',
  'premium',
  'internal',
];

const NOTIFY_MODES: MediaNotifyMode[] = ['none', 'now', 'digest', 'scheduled'];

interface Props {
  value: DraftFormValue;
  onChange: (patch: Partial<DraftFormValue>) => void;
  me: ContributorMe;
  assets: ContributorAsset[];
  coverAssetId?: string | null;
  onAddAssets?: () => void;
  onCaptureAsset?: () => void;
  onReorderAssets: (assetIds: string[]) => void;
  onRemoveAsset: (assetId: string) => void;
  onSetCover?: (assetId: string) => void;
  /** Rendered between the asset strip and the text fields (the upload queue). */
  uploads?: React.ReactNode;
  disabled?: boolean;
  /** Type is fixed once the item exists — the server derives asset rules from it. */
  lockType?: boolean;
}

function Label({ children }: { children: string }) {
  return (
    <Text className="text-[12px] font-semibold mb-2" style={{ color: Colors.text.tertiary }}>
      {children}
    </Text>
  );
}

/**
 * The full editor behind Quick Post.
 *
 * Purely controlled: it renders `value` and reports patches. The screen owns
 * the debounce, the server draft row and every mutation, which is what lets the
 * same form drive both "create" (no id yet) and "edit" (id from the route).
 *
 * Access levels above the contributor's `max_access_level` are not rendered at
 * all rather than rendered disabled — the server refuses them with a 403, and a
 * greyed-out "Premium" chip on a correspondent's phone reads as a bug.
 */
export default function DraftForm({
  value,
  onChange,
  me,
  assets,
  coverAssetId,
  onAddAssets,
  onCaptureAsset,
  onReorderAssets,
  onRemoveAsset,
  onSetCover,
  uploads,
  disabled = false,
  lockType = false,
}: Props) {
  const { t } = useTranslation();

  const matchOptions: PickerOption<number>[] = useMemo(
    () =>
      me.allowedMatches.map((match) => ({
        value: match.id,
        label: matchLabel(match, `#${match.id}`),
        caption: matchDateLabel(match) ?? undefined,
        iconUri: match.league_logo ?? undefined,
      })),
    [me.allowedMatches],
  );

  const accessLevels = useMemo(() => {
    const ceiling = me.maxAccessLevel ?? 'premium';
    const maxIndex = ACCESS_ORDER.indexOf(ceiling);
    // An unknown ceiling must not silently unlock `internal`.
    return ACCESS_ORDER.slice(0, maxIndex >= 0 ? maxIndex + 1 : 3);
  }, [me.maxAccessLevel]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
      style={{ backgroundColor: Colors.background.dark }}
    >
      {/* ── Assets ─────────────────────────────────────────────── */}
      <View className="pt-4 pb-2">
        <View className="px-4">
          <Label>{t('contributor.assets.title')}</Label>
        </View>
        {assets.length || onAddAssets || onCaptureAsset ? (
          <AssetStrip
            assets={assets}
            coverAssetId={coverAssetId}
            onReorder={onReorderAssets}
            onRemove={onRemoveAsset}
            onSetCover={onSetCover}
            onAdd={onAddAssets}
            onCapture={onCaptureAsset}
            busy={disabled}
          />
        ) : (
          <Text className="px-4 text-[13px]" style={{ color: Colors.text.muted }}>
            {t('contributor.assets.empty')}
          </Text>
        )}
      </View>

      {uploads}

      {/* ── Type ───────────────────────────────────────────────── */}
      {!lockType ? (
        <View className="px-4 pt-4">
          <Label>{t('contributor.create.type')}</Label>
          <View className="flex-row flex-wrap gap-2">
            {CONTRIBUTOR_ITEM_TYPES.map((type) => (
              <Chip
                key={type}
                label={t(`contributor.type.${type}`)}
                active={value.type === type}
                onPress={() => onChange({ type })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Match ──────────────────────────────────────────────── */}
      <View className="px-4 pt-4">
        <Label>{t('contributor.create.match')}</Label>
        <PickerPill
          title={t('contributor.create.match')}
          options={matchOptions}
          value={value.match_id ?? -1}
          onChange={(next) => onChange({ match_id: next })}
          placeholder={t('contributor.create.selectMatch')}
          disabled={disabled || !matchOptions.length}
          maxWidth={280}
        />
      </View>

      {/* ── Category ───────────────────────────────────────────── */}
      {me.allowedCategories.length ? (
        <View className="px-4 pt-4">
          <Label>{t('contributor.create.category')}</Label>
          <View className="flex-row flex-wrap gap-2">
            {me.allowedCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                active={value.category_id === category.id}
                onPress={() =>
                  onChange({
                    category_id: value.category_id === category.id ? null : category.id,
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Phase ──────────────────────────────────────────────── */}
      <View className="px-4 pt-4">
        <Label>{t('contributor.create.phase')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {MEDIA_PHASES.map((phase) => (
            <Chip
              key={phase}
              label={t(`casaMedia.phase.${phase}`)}
              active={value.match_phase === phase}
              onPress={() =>
                onChange({ match_phase: value.match_phase === phase ? null : phase })
              }
            />
          ))}
        </View>
      </View>

      {/* ── Copy ───────────────────────────────────────────────── */}
      <View className="px-4 pt-5">
        <Label>{t('contributor.create.titleLabel')}</Label>
        <TextInput
          value={value.title}
          onChangeText={(title) => onChange({ title })}
          placeholder={t('contributor.create.titlePlaceholder')}
          placeholderTextColor={Colors.text.muted}
          maxLength={200}
          editable={!disabled}
          style={styles.input}
        />
      </View>

      <View className="px-4 pt-4">
        <Label>{t('contributor.create.shortDescription')}</Label>
        <TextInput
          value={value.short_description}
          onChangeText={(short_description) => onChange({ short_description })}
          placeholder={t('contributor.create.shortDescriptionPlaceholder')}
          placeholderTextColor={Colors.text.muted}
          maxLength={400}
          multiline
          editable={!disabled}
          style={[styles.input, styles.multiline]}
        />
        <Text className="text-[11px] mt-1" style={{ color: Colors.text.muted }}>
          {t('contributor.create.shortDescriptionHint')}
        </Text>
      </View>

      <View className="px-4 pt-4">
        <Label>{t('contributor.create.caption')}</Label>
        <TextInput
          value={value.caption}
          onChangeText={(caption) => onChange({ caption })}
          placeholder={t('contributor.create.captionPlaceholder')}
          placeholderTextColor={Colors.text.muted}
          multiline
          editable={!disabled}
          style={[styles.input, styles.multilineTall]}
        />
      </View>

      <View className="px-4 pt-4">
        <Label>{t('contributor.create.tags')}</Label>
        <TextInput
          value={value.tags}
          onChangeText={(tags) => onChange({ tags })}
          placeholder={t('contributor.create.tagsPlaceholder')}
          placeholderTextColor={Colors.text.muted}
          autoCapitalize="none"
          editable={!disabled}
          style={styles.input}
        />
      </View>

      {/* ── Access ─────────────────────────────────────────────── */}
      <View className="px-4 pt-5">
        <Label>{t('contributor.create.accessLevel')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {accessLevels.map((level) => (
            <Chip
              key={level}
              label={t(`contributor.access.${level}`)}
              active={value.access_level === level}
              onPress={() => onChange({ access_level: level })}
            />
          ))}
        </View>
      </View>

      {/* ── Publishing ─────────────────────────────────────────── */}
      <View className="px-4 pt-5">
        <Label>{t('contributor.schedule.title')}</Label>
        <SchedulePicker
          value={value.publish_at}
          onChange={(publish_at) => onChange({ publish_at })}
          disabled={disabled}
        />
      </View>

      <View className="px-4 pt-4">
        <Label>{t('contributor.create.notifyMode')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {NOTIFY_MODES.map((mode) => (
            <Chip
              key={mode}
              label={t(`contributor.notify.${mode}`)}
              active={value.notify_mode === mode}
              onPress={() => onChange({ notify_mode: mode })}
            />
          ))}
        </View>
      </View>

      <View
        className="flex-row items-center justify-between px-4 py-4 mt-4"
        style={{ borderTopWidth: 1, borderTopColor: Colors.border.default }}
      >
        <View className="flex-1" style={{ paddingEnd: 16 }}>
          <Text className="text-[13px] font-semibold" style={{ color: Colors.text.primary }}>
            {t('contributor.create.publishWhenReady')}
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: Colors.text.tertiary }}>
            {t('contributor.create.publishWhenReadyHint')}
          </Text>
        </View>
        <Switch
          value={value.publish_when_ready}
          onValueChange={(publish_when_ready) => onChange({ publish_when_ready })}
          disabled={disabled}
          trackColor={{ false: Colors.background.light, true: Colors.darkGold }}
          thumbColor={Colors.text.primary}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text.primary,
    fontSize: 14,
    // `textAlign: auto` follows the string's own direction, so an Arabic
    // caption right-aligns and a Latin hashtag list does not.
    textAlign: 'auto',
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  multilineTall: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
