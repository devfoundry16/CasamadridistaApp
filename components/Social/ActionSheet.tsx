import React from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import T from './T';

export interface SheetAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
  cancelLabel: string;
}

/**
 * A bottom sheet of actions, built from the `Row` recipe in
 * `components/Media/ShareSheet.tsx` — 20pt icon in a 28pt gutter, 56pt rows,
 * hairline separators — so every sheet in the app reads as one family.
 */
export default function ActionSheet({ visible, title, actions, onClose, cancelLabel }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Touchable onPress={onClose} accessibilityRole="button" accessibilityLabel={cancelLabel} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          start: 0,
          end: 0,
          bottom: 0,
          backgroundColor: Colors.background.deepDark,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 1,
          borderColor: Colors.border.default,
          paddingBottom: insets.bottom + 8,
        }}
      >
        {title ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <T step="headline" weight="bold">
              {title}
            </T>
          </View>
        ) : (
          <View style={{ height: 8 }} />
        )}
        {actions.map((action) => (
          <SheetRow key={action.key} action={action} onClose={onClose} />
        ))}
        <SheetRow action={{ key: 'cancel', label: cancelLabel, onPress: () => {} }} onClose={onClose} last />
      </View>
    </Modal>
  );
}

function SheetRow({ action, onClose, last = false }: { action: SheetAction; onClose: () => void; last?: boolean }) {
  return (
    <Touchable
      onPress={() => {
        onClose();
        // After the sheet has left: an Alert or a second Modal presented while
        // this one is still dismissing is silently dropped on iOS.
        setTimeout(action.onPress, 320);
      }}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: Colors.border.default,
        },
        pressed && { backgroundColor: Colors.background.card },
      ]}
    >
      {action.icon ? <View style={{ width: 28, alignItems: 'center' }}>{action.icon}</View> : null}
      <T
        step="body"
        weight={last ? 'regular' : 'semibold'}
        color={action.destructive ? Colors.status.error : last ? Colors.text.tertiary : Colors.text.primary}
        style={{ flex: 1, marginStart: action.icon ? 12 : 0 }}
      >
        {action.label}
      </T>
    </Touchable>
  );
}
