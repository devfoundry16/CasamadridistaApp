import { useRouter } from 'expo-router';
import { ChevronRight, Globe, Search } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, View } from 'react-native';

import FeedList from '@/components/Community/FeedList';
import FanClubPartnershipSection from '@/components/FanClubPartnershipSection';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useUser } from '@/hooks/useUser';

/**
 * The Fan Clubs tab. The general feed moved to Home (spec 2.1.0 §03: no two
 * copies of one feed); this tab is about clubs: partnership, the directory,
 * finding people, and the fan-club feed.
 *
 * The route stays `community`: `(tabs)/fan-clubs` would collide with the
 * `/fan-clubs` directory stack, and old `/community` links keep working.
 */
export default function FanClubsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();

  const header = (
    <View style={{ paddingBottom: 4 }}>
      <FanClubPartnershipSection variant="feed" />
      <Row icon={Globe} label={t('fanClubsTab.browse')} onPress={() => router.push('/fan-clubs')} />
      {/* People search (spec §21), signed in only: it is the Friends screen's. */}
      {user?.id ? (
        <Row icon={Search} label={t('social.friends.searchPeople')} onPress={() => router.push('/social/friends?focus=search' as never)} />
      ) : null}
      <Text className="text-[13px] font-bold" style={{ color: Colors.darkGold, marginHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
        {t('fanClubsTab.feedTitle')}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <FeedList tab="fan-clubs" header={header} />
    </View>
  );
}

function Row({ icon: Icon, label, onPress }: { icon: typeof Globe; label: string; onPress: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        marginHorizontal: 12,
        marginTop: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.background.card,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Icon size={20} color={Colors.darkGold} />
      <Text className="text-[14px] font-semibold" style={{ flex: 1, color: Colors.text.primary }}>
        {label}
      </Text>
      <ChevronRight size={18} color={Colors.text.tertiary} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
    </Touchable>
  );
}
