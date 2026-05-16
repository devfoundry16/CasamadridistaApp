import React from 'react';
import { View, Text } from 'react-native';
import { Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Props {
  name?: string;
  small?: boolean;
}

export default function FanClubBadge({ name, small = false }: Props) {
  return (
    <View className="flex-row items-center bg-yellow-900/30 rounded-full px-2 py-0.5 ml-1">
      <Shield size={small ? 10 : 12} color={Colors.darkGold} />
      {name && !small && (
        <Text className="text-xs ml-1 font-medium" style={{ color: Colors.darkGold }}>
          {name}
        </Text>
      )}
    </View>
  );
}
