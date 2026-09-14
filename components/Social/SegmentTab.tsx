import React from 'react';
import { View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import T from './T';

/** An underlined segment tab with an optional gold count. */
export default function SegmentTab({ label, on, count, onPress }: { label: string; on: boolean; count?: number; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: on ? Colors.darkGold : 'transparent', marginBottom: -1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T step="footnote" weight="semibold" color={on ? Colors.text.primary : Colors.text.tertiary}>
          {label}
        </T>
        {count ? (
          <View style={{ marginStart: 6, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.darkGold }}>
            <T step="caption" weight="bold" color={Colors.text.dark} ltr>
              {count > 99 ? '99+' : String(count)}
            </T>
          </View>
        ) : null}
      </View>
    </Touchable>
  );
}
