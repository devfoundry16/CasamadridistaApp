import React from 'react';
import { View } from 'react-native';

import HeaderMenu from '@/components/HeaderMenu';
import NotificationBell from '@/components/Notifications/NotificationBell';

/**
 * The tab navigator's `headerRight`: bell + overflow menu.
 *
 * Split out of `app/(tabs)/_layout.tsx` so the two controls are laid out in one
 * place rather than repeated per-screen.
 */
export default function HeaderRight() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginEnd: 4 }}>
      <NotificationBell />
      <HeaderMenu />
    </View>
  );
}
