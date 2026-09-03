import { Image } from 'expo-image';
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Star,
  Trash2,
  Video,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, ScrollView, View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { ContributorAsset } from '@/types/media/contributor';

interface Props {
  assets: ContributorAsset[];
  onReorder: (assetIds: string[]) => void;
  onRemove: (assetId: string) => void;
  onSetCover?: (assetId: string) => void;
  onAdd?: () => void;
  /** Disables every control while a mutation is in flight. */
  busy?: boolean;
  coverAssetId?: string | null;
}

const TILE = 92;

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * The ordered asset strip of a draft.
 *
 * Reordering is two buttons, not a drag: a drag inside a horizontal ScrollView
 * inside a vertical form needs a gesture-handler race that is genuinely fiddly
 * to get right, and "move one place earlier/later" is what a correspondent
 * actually does with a twenty-shot burst.
 *
 * The chevrons are chosen by `I18nManager.isRTL`, not mirrored by layout: the
 * strip itself reverses under RTL, so "earlier" points right there. The glyph
 * has to follow the direction of travel, not the writing direction.
 */
export default function AssetStrip({
  assets,
  onReorder,
  onRemove,
  onSetCover,
  onAdd,
  busy = false,
  coverAssetId,
}: Props) {
  const { t } = useTranslation();
  const Earlier = I18nManager.isRTL ? ChevronRight : ChevronLeft;
  const Later = I18nManager.isRTL ? ChevronLeft : ChevronRight;

  const shift = useCallback(
    (index: number, delta: number) => {
      const next = move(assets, index, index + delta);
      if (next === assets) return;
      onReorder(next.map((asset) => asset.id));
    },
    [assets, onReorder],
  );

  const confirmRemove = useCallback(
    (assetId: string) => {
      Alert.alert(t('contributor.assets.removeTitle'), t('contributor.assets.removeBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('contributor.assets.remove'),
          style: 'destructive',
          onPress: () => onRemove(assetId),
        },
      ]);
    },
    [onRemove, t],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 4 }}
    >
      {assets.map((asset, index) => {
        const preview = asset.thumbnail_url ?? asset.url ?? null;
        const isCover = coverAssetId === asset.id;
        return (
          <View key={asset.id} style={{ width: TILE }}>
            <View
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 10,
                overflow: 'hidden',
                backgroundColor: Colors.background.light,
                borderWidth: isCover ? 2 : 1,
                borderColor: isCover ? Colors.darkGold : Colors.border.default,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {preview ? (
                <Image
                  source={{ uri: preview }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  placeholder={asset.blurhash ? { blurhash: asset.blurhash } : undefined}
                  transition={120}
                />
              ) : asset.kind === 'video' ? (
                <Video size={20} color={Colors.text.tertiary} />
              ) : (
                <ImagePlus size={20} color={Colors.text.tertiary} />
              )}

              {asset.status === 'processing' || asset.status === 'uploading' ? (
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                >
                  <ActivityIndicator size="small" color={Colors.text.primary} />
                </View>
              ) : null}

              {asset.status === 'failed' ? (
                <View
                  className="absolute inset-0 items-center justify-center px-1"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                >
                  <Text
                    className="text-[10px] font-semibold text-center"
                    style={{ color: Colors.status.error }}
                  >
                    {t('contributor.assets.failed')}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center justify-between mt-1">
              <Touchable
                onPress={() => shift(index, -1)}
                disabled={busy || index === 0}
                accessibilityRole="button"
                accessibilityLabel={t('contributor.assets.moveEarlier')}
                hitSlop={6}
                style={({ pressed }) => ({
                  padding: 3,
                  opacity: busy || index === 0 ? 0.25 : pressed ? 0.6 : 1,
                })}
              >
                <Earlier size={16} color={Colors.text.secondary} />
              </Touchable>

              {onSetCover ? (
                <Touchable
                  onPress={() => onSetCover(asset.id)}
                  disabled={busy || asset.status !== 'ready'}
                  accessibilityRole="button"
                  accessibilityLabel={t('contributor.assets.setCover')}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    padding: 3,
                    opacity: busy || asset.status !== 'ready' ? 0.25 : pressed ? 0.6 : 1,
                  })}
                >
                  <Star
                    size={16}
                    color={isCover ? Colors.darkGold : Colors.text.secondary}
                    fill={isCover ? Colors.darkGold : 'transparent'}
                  />
                </Touchable>
              ) : null}

              <Touchable
                onPress={() => confirmRemove(asset.id)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('contributor.assets.remove')}
                hitSlop={6}
                style={({ pressed }) => ({ padding: 3, opacity: busy ? 0.25 : pressed ? 0.6 : 1 })}
              >
                <Trash2 size={16} color={Colors.status.error} />
              </Touchable>

              <Touchable
                onPress={() => shift(index, 1)}
                disabled={busy || index === assets.length - 1}
                accessibilityRole="button"
                accessibilityLabel={t('contributor.assets.moveLater')}
                hitSlop={6}
                style={({ pressed }) => ({
                  padding: 3,
                  opacity: busy || index === assets.length - 1 ? 0.25 : pressed ? 0.6 : 1,
                })}
              >
                <Later size={16} color={Colors.text.secondary} />
              </Touchable>
            </View>
          </View>
        );
      })}

      {onAdd ? (
        <Touchable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('contributor.assets.add')}
          style={({ pressed }) => ({
            width: TILE,
            height: TILE,
            borderRadius: 10,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: Colors.border.light,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ImagePlus size={20} color={Colors.darkGold} />
          <Text className="text-[11px] mt-1" style={{ color: Colors.text.tertiary }}>
            {t('contributor.assets.add')}
          </Text>
        </Touchable>
      ) : null}
    </ScrollView>
  );
}
