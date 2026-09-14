import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clapperboard, Lock, MessageSquareText, UserRound } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MessageEmbed } from '@/types/social';
import Avatar from './Avatar';
import T from './T';

interface Props {
  embed: MessageEmbed;
  mine: boolean;
}

/**
 * A shared post, media item or profile inside a message. Opens the original.
 *
 * Resolved for the reader by the server, so a premium item shows its lock and an
 * item that was unpublished since shows "no longer available". Nothing here
 * decides access.
 */
export default function EmbedCard({ embed, mine }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const fg = mine ? Colors.text.dark : Colors.text.primary;
  const sub = mine ? 'rgba(26,26,26,0.7)' : Colors.text.tertiary;

  const kindLabel = t(`social.embed.${embed.kind}`);
  const Icon = embed.kind === 'post' ? MessageSquareText : embed.kind === 'media_item' ? Clapperboard : UserRound;

  if (!embed.available) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
        <Icon size={16} color={sub} />
        <T step="footnote" color={sub} style={{ marginStart: 8, fontStyle: 'italic' }}>
          {t('social.embed.unavailable', { kind: kindLabel })}
        </T>
      </View>
    );
  }

  const open = () => {
    if (embed.kind === 'post') router.push(`/community/post/${embed.id}`);
    else if (embed.kind === 'media_item') router.push(`/media/item/${embed.id}`);
    else router.push(`/user/${embed.id}`);
  };

  return (
    <Touchable
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={[kindLabel, embed.title, embed.subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: mine ? 'rgba(26,26,26,0.12)' : Colors.background.medium,
        borderWidth: mine ? 0 : 1,
        borderColor: Colors.border.default,
        opacity: pressed ? 0.8 : 1,
        width: 232,
      })}
    >
      {embed.kind !== 'profile' && embed.image_url ? (
        <View>
          <Image source={{ uri: embed.image_url }} style={{ width: 232, height: 130 }} contentFit="cover" transition={150} />
          {embed.locked ? (
            <View
              style={{
                position: 'absolute',
                top: 8,
                end: 8,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: 'rgba(10,10,10,0.72)',
              }}
            >
              <Lock size={11} color={Colors.darkGold} />
              <T step="caption" weight="semibold" color={Colors.darkGold} style={{ marginStart: 4 }}>
                {t('social.embed.exclusive')}
              </T>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        {embed.kind === 'profile' ? <Avatar uri={embed.image_url} name={embed.title} size={36} /> : <Icon size={16} color={mine ? Colors.text.dark : Colors.darkGold} />}
        <View style={{ flex: 1, marginStart: 10 }}>
          <T step="caption" weight="semibold" color={sub}>
            {kindLabel}
          </T>
          {embed.title ? (
            <T step="footnote" weight="semibold" color={fg} numberOfLines={1}>
              {embed.title}
            </T>
          ) : null}
          {embed.subtitle ? (
            <T step="caption" color={sub} numberOfLines={2}>
              {embed.subtitle}
            </T>
          ) : null}
        </View>
      </View>
    </Touchable>
  );
}
