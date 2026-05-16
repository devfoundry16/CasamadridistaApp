import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PenSquare } from 'lucide-react-native';
import FeedTabs from '@/components/Community/FeedTabs';
import FeedList from '@/components/Community/FeedList';
import type { FeedTab } from '@/services/FeedService';
import Colors from '@/constants/colors';

export default function CommunityScreen() {
  const [tab, setTab] = useState<FeedTab>('for-you');
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-medium">
      <FeedTabs active={tab} onSelect={setTab} />
      <FeedList tab={tab} />

      {/* Compose FAB */}
      <TouchableOpacity
        onPress={() => router.push('/community/compose')}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: Colors.darkGold }}
        activeOpacity={0.85}
      >
        <PenSquare size={24} color={Colors.textWhite} />
      </TouchableOpacity>
    </View>
  );
}
