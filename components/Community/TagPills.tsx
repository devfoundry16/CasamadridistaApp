import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Props {
  countryCode?: string | null;
  countryName?: string | null;
  fanClubName?: string | null;
  onCountryPress?: () => void;
  onFanClubPress?: () => void;
}

export default function TagPills({ countryCode, countryName, fanClubName, onCountryPress, onFanClubPress }: Props) {
  if (!countryCode && !fanClubName) return null;

  return (
    <View className="flex-row flex-wrap gap-1 mt-1">
      {countryCode && (
        <TouchableOpacity
          onPress={onCountryPress}
          activeOpacity={0.7}
          className="flex-row items-center rounded-full px-2 py-0.5"
          style={{ backgroundColor: Colors.background.medium }}
        >
          <MapPin size={10} color={Colors.text.tertiary} />
          <Text className="text-xs ml-1" style={{ color: Colors.text.tertiary }}>
            {countryName ?? countryCode}
          </Text>
        </TouchableOpacity>
      )}
      {fanClubName && (
        <TouchableOpacity
          onPress={onFanClubPress}
          activeOpacity={0.7}
          className="flex-row items-center rounded-full px-2 py-0.5"
          style={{ backgroundColor: Colors.background.medium }}
        >
          <Users size={10} color={Colors.darkGold} />
          <Text className="text-xs ml-1" style={{ color: Colors.darkGold }}>
            {fanClubName}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
