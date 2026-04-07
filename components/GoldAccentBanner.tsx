import { Text } from '@/components/Text';
import { BadgeCheck } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

const GOLD = '#BC9045';

const containerStyle: ViewStyle = {
  backgroundColor: 'rgba(188, 144, 69, 0.12)',
  borderWidth: 1,
  borderColor: 'rgba(188, 144, 69, 0.35)',
  borderLeftWidth: 4,
  borderLeftColor: GOLD,
};

export interface GoldAccentBannerProps {
  /** Plain text or rich content. Strings are wrapped in the default banner text style. */
  children: ReactNode;
  /** Override the default checkmark icon (same gold styling expected for consistency). */
  icon?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Informational callout with gold left accent, tint, and icon — distinct from input fields.
 */
export function GoldAccentBanner({
  children,
  icon,
  className = '',
  style,
}: GoldAccentBannerProps) {
  const body =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text className="text-sm text-white leading-5 flex-1 font-medium">{children}</Text>
    ) : (
      <View className="flex-1 justify-center">{children}</View>
    );

  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl px-4 py-3.5 ${className}`}
      style={[containerStyle, style]}
    >
      {icon ?? <BadgeCheck size={22} color={GOLD} strokeWidth={2.5} />}
      {body}
    </View>
  );
}
