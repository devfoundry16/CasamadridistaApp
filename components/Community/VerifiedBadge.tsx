import React from 'react';
import { View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

interface Props {
  size?: number;
}

export default function VerifiedBadge({ size = 14 }: Props) {
  return (
    <View className="ml-1">
      <CheckCircle size={size} color="#D4A853" fill="none" />
    </View>
  );
}
