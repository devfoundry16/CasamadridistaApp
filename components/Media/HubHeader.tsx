import { useRouter } from 'expo-router';
import { Bookmark, Library, Search } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';

/**
 * The hub's own title row: search, archive and saved.
 *
 * These are actions the tab bar cannot carry (Casa Media has one tab) and that
 * would be buried in the overflow menu, so they live at the top of the screen.
 */
export default function HubHeader() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
      }}
    >
      <Text
        className="text-[22px] font-bold"
        style={{ flex: 1, color: Colors.text.primary }}
        numberOfLines={1}
      >
        {t('casaMedia.hubTitle')}
      </Text>

      <IconButton
        label={t('casaMedia.search')}
        onPress={() => router.push('/media/search')}
        icon={<Search size={20} color={Colors.text.secondary} />}
      />
      <IconButton
        label={t('casaMedia.archive')}
        onPress={() => router.push('/media/archive')}
        icon={<Library size={20} color={Colors.text.secondary} />}
      />
      <IconButton
        label={t('casaMedia.saved')}
        onPress={() => router.push('/media/list/saved')}
        icon={<Bookmark size={20} color={Colors.text.secondary} />}
      />
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginStart: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon}
    </Touchable>
  );
}
