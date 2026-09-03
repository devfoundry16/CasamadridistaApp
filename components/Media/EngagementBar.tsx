import { useRouter } from 'expo-router';
import { Bookmark, Flag, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useMediaEngagement } from '@/hooks/media/useMediaEngagement';
import type { MediaItem } from '@/types/media/casaMedia';
import MediaReportSheet from './MediaReportSheet';
import ShareSheet from './ShareSheet';

interface Props {
  item: MediaItem;
}

/** Like / comment / save / share / report for one media item. */
export default function EngagementBar({ item }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toggleLike, toggleSave } = useMediaEngagement(item);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 18,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: Colors.border.default,
        }}
      >
        <Action
          label={t('casaMedia.like')}
          count={item.like_count}
          onPress={() => toggleLike(item.liked_by_me)}
          icon={
            <Heart
              size={20}
              color={item.liked_by_me ? Colors.status.error : Colors.text.secondary}
              fill={item.liked_by_me ? Colors.status.error : 'none'}
            />
          }
        />
        <Action
          label={t('casaMedia.comments')}
          count={item.comment_count}
          onPress={() => router.push(`/media/comments/${item.id}`)}
          icon={<MessageCircle size={20} color={Colors.text.secondary} />}
        />
        <Action
          label={t('casaMedia.save')}
          onPress={() => toggleSave(item.saved_by_me)}
          icon={
            <Bookmark
              size={20}
              color={item.saved_by_me ? Colors.darkGold : Colors.text.secondary}
              fill={item.saved_by_me ? Colors.darkGold : 'none'}
            />
          }
        />
        <Action
          label={t('casaMedia.share')}
          onPress={() => setShareOpen(true)}
          icon={<Share2 size={20} color={Colors.text.secondary} />}
        />

        <View style={{ flex: 1 }} />

        <Action
          label={t('casaMedia.report')}
          onPress={() => setReportOpen(true)}
          icon={<Flag size={18} color={Colors.text.tertiary} />}
        />
      </View>

      <ShareSheet visible={shareOpen} item={item} onClose={() => setShareOpen(false)} />
      <MediaReportSheet
        visible={reportOpen}
        itemId={item.id}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}

function Action({
  icon,
  label,
  count,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon}
      {count && count > 0 ? (
        <Text
          className="text-[12px] font-semibold"
          style={{
            color: Colors.text.secondary,
            marginStart: 5,
            fontVariant: ['tabular-nums'],
          }}
        >
          {count}
        </Text>
      ) : null}
    </Touchable>
  );
}
