import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Pencil, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import StoriesRow from '@/components/Media/Stories/StoriesRow';
import UserStoriesRow from '@/components/Social/stories/UserStoriesRow';
import { useUser } from '@/hooks/useUser';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import FeedTabs from '@/components/Community/FeedTabs';
import FeedList from '@/components/Community/FeedList';
import FanClubPartnershipSection from '@/components/FanClubPartnershipSection';
import type { FeedTab } from '@/services/FeedService';
import { useStories } from '@/hooks/media/useStories';
import Colors from '@/constants/colors';

export default function CommunityScreen() {
  const [tab, setTab] = useState<FeedTab>('for-you');
  const router = useRouter();
  const { data: stories } = useStories();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const { t } = useTranslation();
  const name = [user?.profile?.first_name, user?.profile?.last_name].filter(Boolean).join(' ') || null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      {/* Stories sit above the feed tabs, the way every social feed places
          them: yours and other fans' first, then Casa Media's official row,
          which is hidden entirely when there are none. */}
      <UserStoriesRow viewerId={user?.id ?? null} viewerName={name} viewerAvatar={user?.profile?.avatar_url ?? null} />
      {stories?.length ? <StoriesRow groups={stories} compact /> : null}
      <FeedTabs
        active={tab}
        onSelect={setTab}
        trailing={
          // People search (spec §21), signed in only: it is the Friends screen's.
          user?.id ? (
            <TouchableOpacity
              onPress={() => router.push('/social/friends?focus=search' as any)}
              accessibilityRole="button"
              accessibilityLabel={t('social.friends.searchPeople')}
              hitSlop={8}
              style={{ paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Search size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          ) : null
        }
      />
      {tab === 'fan-clubs' && <FanClubPartnershipSection variant="feed" />}
      <FeedList tab={tab} />

      <TouchableOpacity
        onPress={() => {
          if (requireAuth({ href: '/community/compose', mode: 'login' })) router.push('/community/compose');
        }}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.darkGold,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 8,
        }}
        activeOpacity={0.85}
      >
        <Pencil size={24} color={Colors.textWhite} />
      </TouchableOpacity>
    </View>
  );
}
