import { Image } from 'expo-image';
import { ImageIcon, Upload } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';

interface Props {
  coverUrl: string | null;
  /** Pick a new photo and upload it into the item's `cover` slot. */
  onUpload: () => void;
  disabled?: boolean;
}

const W = 96;
const H = 54; // 16:9

/**
 * The teaser image.
 *
 * Two ways in, and they are deliberately in different places: promoting an
 * asset already on the item is the star on its tile in `AssetStrip` (it is an
 * action *on that asset*), while uploading a dedicated cover lives here. The
 * cover is a public, tokenless image — the one part of a locked item a signed-out
 * visitor sees — so it is worth its own control rather than being implicit.
 */
export default function CoverPicker({ coverUrl, onUpload, disabled = false }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-3">
      <View
        style={{
          width: W,
          height: H,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: Colors.background.light,
          borderWidth: 1,
          borderColor: Colors.border.default,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <ImageIcon size={18} color={Colors.text.muted} />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-[13px] font-semibold" style={{ color: Colors.text.primary }}>
          {coverUrl ? t('contributor.cover.current') : t('contributor.cover.none')}
        </Text>
        <Touchable
          onPress={onUpload}
          disabled={disabled}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
          })}
        >
          <Upload size={14} color={Colors.darkGold} />
          <Text className="text-[12px] font-semibold" style={{ color: Colors.darkGold }}>
            {t('contributor.cover.upload')}
          </Text>
        </Touchable>
      </View>
    </View>
  );
}
