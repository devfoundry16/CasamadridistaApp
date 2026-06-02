import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import FeedTabs from '@/components/Community/FeedTabs';
import FeedList from '@/components/Community/FeedList';
import type { FeedTab } from '@/services/FeedService';
import Colors from '@/constants/colors';

export default function CommunityScreen() {
  const [tab, setTab] = useState<FeedTab>('for-you');
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <FeedTabs active={tab} onSelect={setTab} />
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
