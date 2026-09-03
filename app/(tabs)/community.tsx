import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import StoriesRow from '@/components/Media/Stories/StoriesRow';
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      {/* Casa Media stories sit above the feed tabs, the way every social feed
          places them. Hidden entirely when there are none. */}
      {stories?.length ? <StoriesRow groups={stories} compact /> : null}
      <FeedTabs active={tab} onSelect={setTab} />
      {tab === 'fan-clubs' && <FanClubPartnershipSection variant="feed" />}
      <FeedList tab={tab} />

      <TouchableOpacity
        onPress={() => router.push('/community/compose')}
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
