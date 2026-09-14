import React from 'react';
import { View } from 'react-native';

import HeaderMenu from '@/components/HeaderMenu';
import NotificationBell from '@/components/Notifications/NotificationBell';
import MessagesButton from '@/components/Social/MessagesButton';

/**
 * The tab navigator's `headerRight`: messages + bell + overflow menu.
 *
 * Messages lives here rather than as a sixth tab — see `MessagesButton`.
 *
 * Split out of `app/(tabs)/_layout.tsx` so the controls are laid out in one
 * place rather than repeated per-screen.
 */
export default function HeaderRight() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginEnd: 4 }}>
      <MessagesButton />
      <NotificationBell />
      <HeaderMenu />
    </View>
  );
}
