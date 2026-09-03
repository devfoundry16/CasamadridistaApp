import { Search, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';

interface Props {
  value: string;
  onChangeText: (next: string) => void;
  autoFocus?: boolean;
}

export default function MediaSearchBar({ value, onChangeText, autoFocus = true }: Props) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.border.default,
      }}
    >
      <Search size={17} color={Colors.text.tertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        placeholder={t('casaMedia.searchPlaceholder')}
        placeholderTextColor={Colors.text.muted}
        accessibilityLabel={t('casaMedia.search')}
        style={{
          flex: 1,
          // marginStart, not ml-2: the magnifier stays on the leading edge in RTL.
          marginStart: 8,
          color: Colors.text.primary,
          fontSize: 15,
          paddingVertical: 0,
        }}
      />
      {value.length > 0 ? (
        <Touchable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <X size={16} color={Colors.text.tertiary} />
        </Touchable>
      ) : null}
    </View>
  );
}
