import React from 'react';
import { View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Props {
  size?: number;
  color?: string;
}

export default function VerifiedBadge({ size = 14, color = Colors.darkGold }: Props) {
  return (
    <View className="ml-1">
      <CheckCircle size={size} color={color} fill={color} />
    </View>
  );
}
