import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import T from './T';

export type ButtonTone = 'gold' | 'outline' | 'muted' | 'destructive';

interface Props {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  icon?: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  flex?: boolean;
  accessibilityHint?: string;
}

/**
 * The social action button. Gold with DARK text — white on #BC9045 is 2.91:1
 * and fails AA (the rule web/app/globals.css already encodes).
 */
export default function SocialButton({ label, onPress, tone = 'gold', icon, busy, disabled, flex, accessibilityHint }: Props) {
  const palette = {
    gold: { bg: Colors.darkGold, border: Colors.darkGold, fg: Colors.text.dark },
    outline: { bg: 'transparent', border: Colors.border.light, fg: Colors.text.primary },
    muted: { bg: 'transparent', border: Colors.border.default, fg: Colors.text.tertiary },
    destructive: { bg: 'transparent', border: Colors.status.error, fg: Colors.status.error },
  }[tone];

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      style={({ pressed }) => ({
        ...(flex ? { flex: 1 } : {}),
        minHeight: 40,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {icon ? <View style={{ marginEnd: 6 }}>{icon}</View> : null}
          <T step="footnote" weight="semibold" color={palette.fg} numberOfLines={1}>
            {label}
          </T>
        </>
      )}
    </Touchable>
  );
}
