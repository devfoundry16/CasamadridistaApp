import { useRouter } from 'expo-router';
import { Clapperboard, Film, ImagePlus, PlusCircle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Avatar from '@/components/Social/Avatar';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import { createHref, type CreateChoice } from '@/utils/createChooser.core';

/**
 * The top of the Home feed: "What's on your mind?" and one-tap Create Story
 * and Create Video. Each asks a signed-out fan to sign in first and comes back
 * to the same place.
 */
export default function ComposerRow() {
  const { t } = useTranslation();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { user } = useUser();
  const name = [user?.profile?.first_name, user?.profile?.last_name].filter(Boolean).join(' ') || null;

  const go = (href: string) => {
    if (requireAuth({ href, mode: 'login' })) router.push(href as never);
  };

  const tiles: { choice: CreateChoice; label: string; Icon: typeof PlusCircle }[] = [
    { choice: 'story', label: t('home.createStory'), Icon: PlusCircle },
    { choice: 'reel', label: t('home.createReel'), Icon: Film },
    { choice: 'video', label: t('home.createVideo'), Icon: Clapperboard },
    { choice: 'photo', label: t('home.createPhoto'), Icon: ImagePlus },
  ];

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 12, gap: 10 }}>
      <Touchable
        onPress={() => go('/community/compose')}
        accessibilityRole="button"
        accessibilityLabel={t('home.composerPrompt')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Avatar uri={user?.profile?.avatar_url} name={name} size={40} />
        <View
          style={{
            flex: 1,
            minHeight: 40,
            justifyContent: 'center',
            paddingHorizontal: 14,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: Colors.border.light,
            backgroundColor: Colors.background.card,
          }}
        >
          <Text className="text-[14px]" style={{ color: Colors.text.tertiary }}>
            {t('home.composerPrompt')}
          </Text>
        </View>
      </Touchable>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {tiles.map(({ choice, label, Icon }) => (
          <Touchable
            key={choice}
            onPress={() => go(createHref(choice))}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 10,
              backgroundColor: Colors.background.card,
              borderWidth: 1,
              borderColor: Colors.border.default,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Icon size={18} color={Colors.darkGold} />
            <Text className="text-[13px] font-semibold" style={{ color: Colors.text.primary }} numberOfLines={1}>
              {label}
            </Text>
          </Touchable>
        ))}
      </View>
    </View>
  );
}
